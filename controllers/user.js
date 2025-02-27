const Listing = require("../models/listing.js");
const User = require("../models/user.js");


module.exports.signupForm = (req, res) => {
    const error = req.query.error || null; 
    res.render("users/signup.ejs", { error });
}


module.exports.signup = async (req, res) => {
    try {
        let { username, email, password } = req.body;
        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) {
                next(err);
            }
            res.redirect("/listings");
        })
    } catch (err) {
        res.render("users/signup.ejs", { error: err.message }); 
    }
}


module.exports.loginForm = (req, res) => {
    const error = req.flash("error"); 
    res.render("users/login.ejs", { error: error.length > 0 ? error[0] : null });
}

module.exports.login = async (req, res) => {
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
}


module.exports.logout =  (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "you are logged out!");
        res.redirect("/listings");
    })
}


