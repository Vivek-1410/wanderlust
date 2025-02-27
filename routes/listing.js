const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");
const {listingSchema} = require("../Schema.js");
const {isLoggedIn, isOwner} = require("../middleware.js");
const ListingController = require("../controllers/listing.js");
const multer = require("multer");
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage })



router.route("/")
    .get(ListingController.index )
    .post(
        isLoggedIn, 
        upload.single("image"), 
        ListingController.newListing
    );
    

router.route("/category")
    .get(ListingController.categoryListing);


router.route("/place")
    .post(ListingController.searchDestination);


router.route("/new")
    .get(
        isLoggedIn, 
        ListingController.form
    );



router.route("/:id")
    .get(ListingController.showListing)
    .put(
        isLoggedIn, 
        isOwner, 
        upload.single("image"), 
        ListingController.editListing
    )
    .delete(
        isLoggedIn, 
        ListingController.deleteListing
    );


router.route("/:id/edit")
  .get(
        isLoggedIn, 
        ListingController.editListingForm
    );


module.exports = router;