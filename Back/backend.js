/*
    Backend @Blogger
*/
const express = require('express');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const dns = require('dns');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const {UserModel} = require('./db');

const JWTSECRET = "developersOfBlogger"
const app = express();
mongoose.connect("mongodb+srv://subhrabikiran:LeZshcaShnL3DEnU@cluster0.je3gfax.mongodb.net/blog-app-database");

/*-----------------MIDDLEWARES-----------------*/

/*
    parsing middleware
*/
app.use(express.json());

/*
    (OK TESTED)
    @emailCheck middleware first validates the email syntax (validator) and checks the email domain (dns)
        status(400) -> bad request, wrong/invalid email address sent by the user
*/
function emailCheck(req, res, next){
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
    }else{
        res.status(400).send({
            message : "something wrong with the email."
        })
    }
}


/*-----------------ENDPOINTS FOR @BLOGGER-----------------*/

/*
    (OK TESTED)
    @signup goes through the parsing and emailChecking middleware,
    hashes the password (bcrypt.hash) and stores it in the database
        status(500) -> internal server error, no/bad response from the database
*/
app.post("/signup", emailCheck, async function(req, res){
    const email = req.email;
    const password = req.password;
    try {
        const hashedPassword = await bcrypt.hash(password, 5);
        await UserModel.create({
            email : email,
            password : hashedPassword
        })
    } catch (error) {
        res.status(500).send({
            message : "bad response from database!"
        })
    }  
    res.status(200).send({
        message : "user signed up!"
    })
})

/*
    (OK TESTED)
    @signin goes through emailCheck middleware,
    hashes the password and compares tha hashed password (bcrypt.compare) with the password in the db.
        status(404) -> request has not been applied as resource not found (email must have been entered incorrectly by user)
        status(200) -> all ok, user signed in, credentials verified
        status(401) -> invalid credentials, entered password is wrong
*/
app.post("/signin", emailCheck, async function(req, res){
    const email = req.email;
    const password = req.password;
    const user = await UserModel.findOne({
        email : email
    })
    if (user) {
        const hashedPassword = user.password;
        const passwordVerified = await bcrypt.compare(password, hashedPassword);
        if (passwordVerified) {
            const token = jwt.sign({
                email : email
            }, JWTSECRET)
            user.online = true;
            res.status(200).send({
                token : token
            })
        }else{
            res.status(401).send({
                message : "wrong password"
            })
        }
    }else{
        res.status(404).send({
            message : "user doesn't exist!"
        })
    }
})

app.listen(3000);