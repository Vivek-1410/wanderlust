const express = require("express");
const router = express.Router({mergeParams: true});
const ExpressError = require("../utils/ExpressError.js");
const Review = require("../models/reviews.js");
const Listing = require("../models/listing.js");
const { reviewSchema } = require("../Schema.js");
const { isLoggedIn, isReviewAuthor } = require("../middleware.js");
const ReviewController = require("../controllers/review.js")

//Reviews
router.route("/")
    .post(isLoggedIn, ReviewController.createReview);


router.route("/:reviewId")
    .delete(isLoggedIn, isReviewAuthor, ReviewController.deleteReview);

module.exports = router;