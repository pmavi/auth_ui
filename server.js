"use strict";

require("dotenv").config({
    path: __dirname + "/.env",
});

const https = require('https');
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const cookie = require('cookie');
const express = require("express");
const jwt = require("jsonwebtoken");
var cookieParser = require('cookie-parser');
const expressSession = require("express-session");

const app = express();
app.use(cors());

// Set Global
global.appRoot = __dirname;
global.server_url = process.env.APP_URL;

// cookieParser middleware
app.use(cookieParser());

app.use(expressSession({
    secret: "P5&A%R3s1Z3Ea!dN@n!T3R7A",
    cookie: {
        secure: false,
        maxAge: 3600000,
        expires: new Date(Date.now() + 3600000),
    },
    resave: true,
    saveUninitialized: false,
}));

app.use(function(req,res,next){
    res.locals.session = req.session;
    next();
});

// Parsers for POST data
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: false })); // for parsing application/x-www-form-urlencoded

//set public folder path
app.use(express.static(__dirname + "/public"));
app.set(express.static(path.join(__dirname, "public/upload")));

mongoose.connect('mongodb://127.0.0.1/testing-db') ,{
    useNewUrlParser: true,
    useUnifiedTopology: true
};

const db = mongoose.connection;

db.on('error', console.error.bind(console,'Failed db connection'));

db.once('open',function(){
    console.log("---connected to db successfully!")

});

// Check Server Cookies For Auth User
app.get('/*', (req, res, next) => {
    let server_cookie = req.cookies;
    let server_session = req?.session;

    if (!server_session?.token && server_cookie?.auth_user) {
        let user = server_cookie?.auth_user;

        // Create token
        const token = jwt.sign({ user_id: user._id }, process.env.JWT_SECRET_TOKEN);

        // Set User Session
        req.session.user = user;
        req.session.token = token;
       // req.session.user_id = server_cookie?.user_id;

      
    }
    next();
});
app.use(require("./src/services"));

// set the view engine to pug
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.set(express.static(path.join(__dirname, "public/upload")));

//The 404 Route (ALWAYS Keep this as the last route)
app.get("*", function (req, res) {
   // return res.redirect("/");
    res.render("404");
});



/*** Get port from environment and store in Express. ***/
const http_port = process.env.http_port || "8002";
const httpServer = require("http").Server(app);
httpServer.listen(http_port, function () {
    console.log(`httpServer App started on port ${http_port}`);
});

//*** Create an HTTPS service identical to the HTTP service. ***/
// const https_port = process.env.https_port || "8001";
// var httpsServer = https.createServer(app);
// httpsServer.listen(https_port, () => {
//     console.log(`httpsServer App started on port ${https_port}`);
// });


