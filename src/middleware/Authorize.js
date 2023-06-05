const {Users} = require('../services/models/index');
const jwt = require('jsonwebtoken')

//-------------redirect user to dashboard if token and user id-----------------
module.exports.authorize = async (req, res, next) => {
    let server_session = req?.session;
    if (server_session?.token && server_session?.user) {
        return res.redirect(`/${server_session?.user._id}/dashboard`);

    }

    next();
};

//----------------TOKEN VERIFICATION----------------
module.exports.verify = async (req, res, next) => {

  let auth_token = req?.session?.token;
  try{
    jwt.verify(auth_token, process.env.JWT_SECRET_TOKEN, async function (err, decoded) {
        if (err) {
            res.redirect("/");
        } else {
            // no err
            let session_user = req?.session?.user;

            if (decoded.user_id) {
            
                if (decoded?.user_id !== session_user?._id) {
                    return res.redirect("/");
                }
                    
                req.auth_user = session_user;
                req.user_id = decoded.user_id;

                next();
            } else {
                res.send("Invalid Token");
            }
        }
    });
}
catch (error) {
    return res.json({
        status: false,
        message: "Something went wrong.Please try again!",
    });
}
};

