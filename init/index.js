const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
    await mongoose.connect(MONGO_URL);
}

main()
    .then((res) => {
        console.log("connection successful");
    })
    .catch((err) => {
        console.log(err);
    })


async function initDB () {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({...obj, owner: "678a410c239eb71600ad09d0"}));
    await Listing.insertMany(initData.data);
    console.log("data was initialized.");
}

initDB();