const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./reviews.js");
const User = require("./user.js");

const listingSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    image: {
        url: String,
        filename: String,
    },
    price: {
        type: Number
    },
    location: {
        type: String
    },
    country: {
        type: String
    },
    category: {
        type: String,
        enum: [
            'Trending','Rooms','Iconic Cities',
            'Mountain','Castle','Camping','Farms',
            'Arctic','Villa','Chalet','Cabin','Treehouse','Apartment','Cottage','Beach House', 'Beachfront','City','Luxury Penthouse','Ski Chalet','Safari Lodge','Historic House', 'Private Island',
        ], 
        required: true
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
        },
        coordinates: {
            type: [Number],
        }
    }, 
    nearbyPlaces: [
        {
            name: String,
            category: String,
            distance: Number
        }
    ], 
    nearbyStatus: {
        type: String,
        enum: ["pending", "ready", "failed"],
        default: "pending"
    }

});

listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
