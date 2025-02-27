const Listing = require("../models/listing.js");
const Review = require("../models/reviews.js");


module.exports.createReview = async (req, res, next) => {
    try {
        let reviewByCustomer = {comment: req.body.Comment, rating: req.body.rating};
        let listing = await Listing.findById(req.params.id);
        let newReview = new Review(reviewByCustomer);
        newReview.author = req.user._id;
        listing.reviews.push(newReview);
        await newReview.save();
        await listing.save();
        console.log(newReview);
        res.redirect(`/listings/${listing.id}`);
    } catch (err) {
        next(err);
    }
}

module.exports.deleteReview = async (req, res, next) => {
    let {id, reviewId} = req.params;
    await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/listings/${id}`);
}