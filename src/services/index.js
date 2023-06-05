const express = require('express');
const multer = require("multer");


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads");
    },
    filename: function (req, file, cb) {
        const split_mime = file.mimetype.split("/");
        const extension = typeof split_mime[1] !== "undefined" ? split_mime[1] : "jpeg";
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({
    storage: storage,
});

const route = express.Router();

const AuthController = require('./controllers/AuthController')
const Authorize = require('../middleware/Authorize')

route.get("/", Authorize.authorize, AuthController.Login);
route.post('/api/register',upload.none(), AuthController.Signup)
route.post('/api/login',upload.none(), AuthController.Login)
route.get('/register',Authorize.authorize,AuthController.Signup)
route.get('/login',Authorize.authorize, AuthController.Login)
route.get('/:id/dashboard',Authorize.verify, AuthController.Dashboard)
route.get('/logout', AuthController.Logout)

//------------------------------Forgot Password Routes---------------------------------
route.get("/forgotPassword", Authorize.authorize, AuthController.ForgotPassword);
route.post("/forgotPassword", upload.none(), AuthController.ForgotPassword);
route.get("/forgot-password/:id", Authorize.authorize, AuthController.ForgotPasswordMsg);
route.post("/resend-link", upload.none(), Authorize.authorize, AuthController.ForgotPasswordMsg);

//----------------------------------------Reset Password Routes--------------------------
route.get("/resetPassword/:user_id", Authorize.authorize, AuthController.ResetPassword);
route.post("/resetPassword/:user_id", upload.none(), AuthController.ResetPassword);

module.exports = route;
