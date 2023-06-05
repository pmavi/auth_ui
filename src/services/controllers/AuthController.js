const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { SendEmailToUser } = require('../../helpers/emailSend');
const {Users} = require('../models/index');

//------------- User login ------------------------
module.exports.Login = async (req, res, next) => {
    if (req.method === "POST") {
        try {
            let request_data = req.body;

            // Check Required Params
            if(!request_data.email || !request_data.password){
                return res.json({
                    status:false,
                    message:'Missing parameter either name or password'
                })
            }
           // Check If User Exists or Not 
            const user = await Users.findOne({
                    email: request_data.email
            });

            // Check User Password
            if (!user || !(await bcrypt.compare(request_data.password, user.password))) {
                return res.json({
                    status: false,
                    message: "Email or password is incorrect"
                });
            }

            // Create token
            const token = jwt.sign(
                {
                    user_id: user.id,
                },
                process.env.JWT_SECRET_TOKEN
            );

            // Set auth user cookies
            res.cookie('auth_user', user);
            res.cookie('auth_token', token);

            // Set auth user session
            req.session.user = user;
            req.session.token = token;
            req.session.save();

                return res.json({
                    status: true,
                    message: "Logged in Successfully",
                    redirect_url: `${process.env.APP_URL}/${user._id}/dashboard`,
                });
           
            
        } catch (error) {
            return res.json({
                error: error,
                status: false,
                message: "Something went wrong.Please try again!",
            });
        }
    }

    res.render("frontend/auth/login");
};

//----------------Signup-----------------------------
module.exports.Signup = async (req, res, next) => {
    if (req.method === "POST") {
        try {
            let request_data = req.body;

            // Check Required Params
            if(!request_data.email || !request_data.password || !request_data.confirm_password || !request_data.first_name){
                return res.json({
                    status:false,
                    message:'Required fields are:Name,Email,Password and Confirm Password '
                }) 
            }

            // Check password & confirm password
            if(request_data.password != request_data.confirm_password){
                return res.json({
                    status:false,
                    message:'Confirm Password does not matched!'
                })
            }

            // Check email address validity
            const email_check = validator.isEmail(request_data.email);
            if(!email_check){
                return res.json({
                    status:false,
                    message:'Invalid Email address.Please check you email address'
                })
            }

            // Check password length validity
            const pwd_check = validator.isLength(request_data.password,{min:6});
            if(!pwd_check){
                return res.json({
                    status:false,
                    message:'Password minimum length should be 6 characters'
                })
            }
            if(request_data.terms == 'on'){
                request_data.terms = true;
            }
            if (await Users.findOne({
                   email: request_data.email
                    
                })
            ) {
                return res.json({
                    status: false,
                    message: "Email already exists. Please try a different email.",
                });
            }
            if (request_data.password) {
                request_data.password = await bcrypt.hash(request_data.password, 10);
            }

            // Create new user
            let user = await Users.create(request_data);

            /* Create token ----------you can uncomment it if your requirement says
            let token = jwt.sign(
                {
                    user_id: user.id,
                },
                process.env.JWT_SECRET_TOKEN
            );

            // Set auth user cookies
            res.cookie('auth_user', user);
            res.cookie('auth_token', token);

            // Set auth user session
            req.session.user = user;
            req.session.token = token;
            req.session.save(); */

            return res.json({
                status: true,
                message: "Successfully Registerred",
                redirect_url: `${process.env.APP_URL}/login`,
            });
        } catch (error) {
            return res.json({
                status: false,
                message: "Something went wrong. Please try again!",
            });
        }
    }

    res.render("frontend/auth/register", 
       
    );
};

//---------------Forgot Password-------------------------
module.exports.ForgotPassword = async (req, res, next) => {
    try {
        if (req.method === "POST") {
            let request_data = req.body;

            const user = await Users.findOne({
                    email: request_data.email
            });

            // Check user exists or not 
            if (!user) {
                return res.json({
                    status: false,
                    message: "Email is incorrect"
                });
            } else {
                let expiryTime = new Date();
                // set expiry time --> token
                expiryTime.setMinutes(expiryTime.getMinutes() + 30);
                let token = Buffer.from(String(user._id)).toString("base64");
                await Users.findOneAndUpdate(
                    {
                        email: request_body.email
                    },
                    {
                        token: token,
                        reset_password_expires: expiryTime
                    },{upsert:true}
                );

                // Email parameters
                let email_params = {
                    RESET_PWD_URL: `${process.env.APP_URL}/resetPassword/${token}`,
                    USERNAME: `${request_data?.email}`,
                    HOME_URL: `${process.env.APP_URL}`,
                };
                let email_template = await fs.readFileSync(`${appRoot}/views/email-templates/EmailForgotPasswordTemplate.html`, "utf8");
                email_template = email_template.replace(/RESET_PWD_URL|HOME_URL|USERNAME/gi, function (matched) {
                    return email_params[matched];
                });

                // Email start
                let mail_options = {
                    html: email_template,
                    subject: "Test App",
                    to: request_data?.email,
                    from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
                };
                let response_mail = await SendEmailToUser(mail_options);
                if (response_mail) {
                    return res.json({
                        status: true,
                        email: user.email,
                        message: "Sent Email",
                        redirect_url: `${process.env.APP_URL}/forgot-password/${user.id}`,
                    });
                } else {
                    return res.json({
                        status: false,
                        message: "Unable to send reset link at mail",
                    });
                }
            }
        }
    } catch (error) {
        return res.json({
            error: error,
            status: false,
            message: "Something went wrong. Please try again.",
        });
    }

    res.render("frontend/auth/forgotPassword");
};

//-------------Forgot password message-------------------------------
module.exports.ForgotPasswordMsg = async (req, res, next) => {
    try {
        let user = await Users.findOne({
            _id: req.params.id
            
        }).then((response) => {
            return response;
        });
        res.render("frontend/auth/ForgotPasswordMsg", {
            user: user
        });
    } catch (error) {
        return res.json({
            status: false,
            message: "Something went wrong!Please try again.",
        });
    }
};

//--------------Reset password----------------------------
module.exports.ResetPassword = async (req, res, next) => {
    try {
        let user_id = Buffer.from(req.params.user_id, "base64").toString();

        if (req.method === "POST") {
            let request_data = req.body;
            let current_date = new Date();

            // Check required params
            if (!request_data.password || !request_data.confirm_password) {
                return res.json({
                    status: false,
                    message: "Required Password and Confirm password",
                });
            }
            // Confirm password check 
            if (request_data.password !== request_data.confirm_password) {
                return res.json({
                    status: false,
                    message: "Password and Confirm Password does not match",
                });
            }

            // Password length check
            if (request_data.password.length < 6) {
                return res.json({
                    status: false,
                    message: "Password value should be greater than 6",
                });
            }
            // Confirm password check 
            if (request_data.confirm_password.length < 6) {
                return res.json({
                    status: false,
                    message: "Confirm Password value should be greater than 6",
                });
            }

            // Find user 
            const user = await Users.findOne({
                    _id: user_id,
                    token: req.params.user_id
                
            });
            if (user) {

                // Check if reset pwd link expires
                if (current_date > user.reset_password_expires) {
                    return res.json({
                        status: false,
                        message: "Reset Link Expired!",
                    });
                } else {
                    if (request_data.password) {
                        request_data.password = await bcrypt.hash(request_data.password, 10);
                    }

                    // Update password
                    const updatePwd = await Users.findOneAndUpdate(
                        {
                            email: user.email
                        
                        },
                        {$set:{password:request_data.password}}, {new: true}
       
                    );
                    if (updatePwd) {
                        return res.json({
                            status: true,
                            message: "Your password has been changed, now you can log in. ",
                        });
                    } else {
                        return res.json({
                            status: false,
                            message: "Unable to reset the password"
                        });
                    }
                }
            } else {
                return res.json({
                    status: false,
                    message: "User not found!"
                });
            }
        }
    } catch (error) {
        return res.json({
            error: error,
            status: false,
            message: "Something went wrong. Please check your details.",
        });
    }

    res.render("frontend/auth/resetPassword");
};

//----------------Dashboard--------------------------
module.exports.Dashboard = async (req, res, next) => {
    let user = req.auth_user;
   try{
   }
   catch(err){
    return res.json({
        status:false,
        message:'Something went wrong.'
    })
   }
   res.render("frontend/dashboard/index",{
    auth_user:user
   });
    
};

//-----------------User Logout---------------------
module.exports.Logout = async (req, res, next) => {
    try {

        // clear cookies
        res.clearCookie('auth_user', { path: '/' });
        res.clearCookie('user_id', { path: '/' });
        res.clearCookie('auth_token', { path: '/' });

        req.session.destroy();
        return res.redirect("/");
    } catch (error) {
        return res.json({
            error: error,
            status: false,
            message: "Something went wrong. Please try again.",
        });
    }
};
