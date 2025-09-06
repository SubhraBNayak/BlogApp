/*
Backend @Blogger
*/
const express = require('express');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const dns = require('dns');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');
const rateLimit = require('express-rate-limit');
const { UserModel,BlogModel,BlogIndexModel } = require('./db');

const JWTSECRET = "developersOfBlogger"
const app = express();
mongoose.connect("mongodb+srv://subhrabikiran:LeZshcaShnL3DEnU@cluster0.je3gfax.mongodb.net/blog-app-database");

/*-----------------MIDDLEWARES-----------------*/

/*
    cross-origin-resource-sharing (cors)
*/
app.use(cors({
    origin: true,  // Allow all origins for debugging
    credentials: true
}));

/*
    parsing middleware
*/
app.use(express.json());

/*
    (OK TESTED)
    @emailCheck middleware first validates the email syntax (validator) and checks the email domain (dns)
        status(400) -> bad request, wrong/invalid email address sent by the user
*/
function emailCheck(req, res, next) {
    const email = req.body.email;
    const password = req.body.password;
    if (validator.isEmail(email)) {
        const domain = email.split("@")[1];
        dns.resolveMx(domain, function (err, address) {
            if (err) {
                res.status(400).send({
                    message: "something wrong with the email."
                });
            } else {
                req.email = email;
                req.password = password;
                next();
            }
        })
    } else {
        res.status(400).send({
            message: "something wrong with the email."
        })
    }
}

/*
    @jwtAuth is a middleware that takes the token from the frontend and verifies the token
    using JWTSECRET.
        req.email = gives you the user email if token verified
*/
async function jwtAuth(req, res, next){
    const token = req.body.token;
    try {
        const email = jwt.verify(token, JWTSECRET).email;
        req.email = email;
        next();
    } catch (error) {
        res.status(401).send({
            message : "token invalid, request can't be authenticated!"
        })
    }
}
/*-----------------ENDPOINTS FOR @BLOGGER-----------------*/

/*
    (OK TESTED)
    @signup goes through the parsing and emailChecking middleware,
    hashes the password (bcrypt.hash) and stores it in the database
    it generates and returns a jwt token for the current session, 
    as the user directly gets redirected to the mainpage
        status(500) -> internal server error, no/bad response from the database
        status(409) -> user conflict, user email already exists
*/
app.post("/api/signup", emailCheck, async function (req, res) {
    const email = req.email;
    const password = req.password;
    const user = await UserModel.findOne({
        email: email
    })
    if (user) {
        res.status(409).send({
            message: "user already exists! try different email"
        })
    } else {
        try {
            const hashedPassword = await bcrypt.hash(password, 5);
            await UserModel.create({
                email: email,
                password: hashedPassword
            })
        } catch (error) {
            res.status(500).send({
                message: "bad response from database!"
            })
        }
        const token = jwt.sign({
            email : email
        }, JWTSECRET)
        res.status(200).send({
            token
        })
    }
})

/*
    (OK TESTED)
    @signin goes through emailCheck middleware,
    hashes the password and compares the hashed password (bcrypt.compare) with the password in the db.
        status(404) -> request has not been applied as resource not found (email must have been entered incorrectly by user)
        status(200) -> all ok, user signed in, credentials verified
        status(401) -> invalid credentials, entered password is wrong
*/
app.post("/api/signin", emailCheck, async function (req, res) {
    const email = req.email;
    const password = req.password;
    const user = await UserModel.findOne({
        email: email
    })
    if (user) {
        const hashedPassword = user.password;
        const passwordVerified = await bcrypt.compare(password, hashedPassword);
        if (passwordVerified) {
            const token = jwt.sign({
                email: email
            }, JWTSECRET)
            user.online = true;
            res.status(200).json({
                token: token
            })
        } else {
            res.status(401).send({
                message: "wrong password"
            })
        }
    } else {
        res.status(404).send({
            message: "user doesn't exist!"
        })
    }
})

/*
    (OK TESTED)
    @publishBlog, first verifies the token. Upon verification it uses the email gotten out of the token
    to findOne user having that emailId, stores the OID of that user. sends the OID of the user along with 
    the blogPost to the 'blogs' collection under 'blog-app-database'. This way we would be able to keep 
    of the users and the blogs posted by them.
        status(503) -> mongodb database unreachable 
        status(404) -> user doesn't exist
        status(200) -> blog published
*/
app.post("/publishBlog", jwtAuth, async function(req, res){
    const email = req.email;
    const { title, subtitle, content } = req.body;
    const user = await UserModel.findOne({
        email : email
    })
    if (user) {
        try {
            const userOID = user._id;
            //we are updating the BlogIndexModel by 1 any time the user publishes the blog.
            //retrieved the objectId manually from compass 68b70196ead0b649e73f945e.
            const doc = await BlogIndexModel.findById('68b70196ead0b649e73f945e');
            doc.Index = (doc.Index)+1;
            await doc.save();
            const newBlog = await BlogModel.create({
                userOID : userOID,
                authorEmail : email,
                title : title,
                subtitle : subtitle,
                content : content,
                Index : doc.Index //here will it pass the updated value of Index
            })
            res.status(200).send({
                message : "you're published!"
            })
        } catch (error) {
            res.status(503).send({
                message : "database unreachable!"
            })
        }
    }else{
        res.status(404).send({
            message : "user doesn't exist"
        })
    }
})

/*
    (OK TESTED)
    @fetchBlog is an endpoint, it first takes the jwtToken from the frontend.
    verifies the token, authenticates the user, and then proceeds to fetch the blogs 
    from backend. It fetches 5 blogs at a time.
*/
app.post("/fetchBlog", jwtAuth, async function(req, res){
    const requiredBlogIndex = req.body.currentIndex;
    const doc = await BlogIndexModel.findById('68b70196ead0b649e73f945e');
    const lastIndex = doc.Index;
    if (requiredBlogIndex < lastIndex) {
        try {
        const blog = await BlogModel.findOne({
            Index : requiredBlogIndex
        });
        res.status(200).json({
            blog : blog,
        })
    } catch (error) {
        res.status(500).send({
            message : "bad response from the database!"
        })
    }
    }else{
        res.status(404).send({
            message : "Requested Indexed content doesn't exist! "
        })
    }
})

/*
    serving static files
*/
app.use(express.static(path.join(__dirname, "Front")));

//http://127.0.0.1:5000/Front/signin.html to open the frontend
app.listen(3000 , () => {
    console.log("server running at http://localhost:3000")
});