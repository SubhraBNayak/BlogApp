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
    hashes the password (bcrypt) and stores it in the database
        status(500) -> internal server error, no/bad response from the database
*/
app.post("/signup", emailCheck, async function(req, res){
    const email = req.email;
    const password = req.password;
    try {
        const hashedPassword = await bcrypt.hash( password, 5);
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

app.listen(3000);