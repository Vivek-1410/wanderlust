const Listing = require("./models/listing");
const Review = require("./models/reviews");
const { ObjectId } = require('mongodb');

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {

    // redirectURL save
    req.session.redirectUrl = req.originalUrl;

    req.flash("error", "you must be logged in to create listing");
    return res.redirect("/login");
    }
    next();
}


module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
        let listing = await Listing.findById(id);

    if (!listing.owner._id.equals(res.locals.currUser._id)) {
        req.flash("error", "You should be the host to edit!");  
        return res.redirect(`/listings/${id}`);
    }
    next();
}

 // Import ObjectId if not already imported

module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    
    // Find the listing and populate its reviews (this will give us the full review objects)
    let listing = await Listing.findById(id).populate('reviews');
    
    // Log the structure of reviews to ensure they are populated correctly
    console.log("Listing Reviews:", listing.reviews);
    
    // Find the review by ID using ObjectId comparison
    let review = listing.reviews.find(r => r._id.equals(new ObjectId(reviewId)));  // Correct usage of ObjectId
    
    // Log review to check if it's found correctly
    console.log("Review found:", review);
    
    // If review is not found or the author does not match
    if (!review || !review.author || !review.author._id.equals(res.locals.currUser._id)) {
        req.flash("error", "You can only delete your own reviews.");
        return res.redirect(`/listings/${id}`);
    }
    
    next();
}







module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}