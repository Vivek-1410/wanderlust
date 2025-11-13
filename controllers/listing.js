// const Listing = require("../models/listing.js");

// module.exports.index = async (req, res) => {
//     let listings = await Listing.find();
//     res.render("listings.ejs", { listings })
// }

// module.exports.form = (req, res) => {
//     res.render("newlisting.ejs")
// }


// module.exports.showListing =  async (req, res, next) => {
//     try {
//         let {id} = req.params;
//         let listingDetail = await Listing.findById(id).populate({path: "reviews", populate: {
//             path: "author",
//         }}).populate("owner");
//         console.log(listingDetail);
//         if (!listingDetail) {
//             next(new ExpressError(404, "Listing not found!"));
//         }
//         res.render("listingDetail.ejs", { listingDetail})
//     } catch (err) {
//         next(err);
//     }
// }

// module.exports.newListing =  async (req, res, next) => {
//     try {
//         let url = req.file.path;
//         let filename = req.file.filename;
//         const address = `${req.body.location}, ${req.body.country}`; 
//         const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&language=en`;
//         const geocodeResponse = await fetch(geocodeUrl);
//         const data = await geocodeResponse.json();

//         if (data && data.length > 0) {
//             const lat = data[0].lat;
//             const lon = data[0].lon;
//             const newlisting = new Listing({
//                 ...req.body, 
//                 owner: req.user._id, 
//                 image: { url, filename }, 
//                 geometry: {
//                     type: "Point", 
//                     coordinates: [lon, lat] 
//                 }
//     });         
//             await newlisting.save();
//             console.log("Listing created with geolocation.");

// } 
//      else {
//             const newlisting = new Listing(req.body);
//             newlisting.owner = req.user._id;
//             newlisting.image = {url, filename};
//             await newlisting.save();
//             console.log("No");
//             }
//         res.redirect("/listings");
//     } catch (err) {
//         next(err);
//     }
// }


// module.exports.categoryListing =  async (req, res) => {
//         const selectedCategory = req.query.category;
//         const categoryListings = await Listing.find({ category: selectedCategory[0] });
//         console.log(categoryListings);
//         res.render("categoryListings", { listings: categoryListings });
//     }


// module.exports.searchDestination = async (req, res) => {
//         const searchQuery = req.body.search_dest;  
//         let matchedDest = await Listing.find({ country: new RegExp(searchQuery, 'i') }); 
//         if (!matchedDest) {
//             matchedDest = await Listing.find({ location: new RegExp(searchQuery, 'i') }); 
//         }
//         console.log(matchedDest);
//         res.render("searchResults", { matchedDest, searchQuery });
//     }



// module.exports.editListingForm = async (req, res, next) => {
//     try {
//         let {id} = req.params;
//         let tobeEdited = await Listing.findById(id);
//         if (!tobeEdited) {
//             next(new ExpressError(404, "Listing not found!" ))
//         }
//         let originalImageurl = tobeEdited.image.url;
//         // originalImageurl = originalImageurl.replace("/upload", "/upload/h_300,w_250");
//         res.render("editlisting.ejs" , { tobeEdited, originalImageurl });
//     } catch (err) {
//         next(err);
//     }
// }



// module.exports.editListing = async (req, res, next) => {
//     try {
//         let { id } = req.params;
//         let editedListing = req.body;
//         let listing = await Listing.findByIdAndUpdate(id, { ...editedListing });
//         if(typeof req.file !== "undefined") {
//             let url = req.file.url;
//             let filename = req.file.filename;
//             listing.image = {url, filename};
//             listing.save();
//         }   
//         req.flash("success", "Listing updated successfully!");
//         res.redirect(`/listings/${id}`);
//     } catch (err) {
//         next(err);
//     }
// }





// module.exports.deleteListing = async (req, res, next) => {
//     try {
//         let {id} = req.params;
//         let tobeEdited = await Listing.findById(id);
//         if (!tobeEdited) {
//             next(new ExpressError(404, "Listing not found!" ))
//         }
//         res.render("editlisting.ejs" , { tobeEdited });
//     } catch (err) {
//         next(err);
//     }
// }


 const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");
const fetch = require("node-fetch"); 

// 🧠 LIST ALL LISTINGS
module.exports.index = async (req, res) => {
  const listings = await Listing.find();
  res.render("listings.ejs", { listings });
};

// 🧱 NEW LISTING FORM
module.exports.form = (req, res) => {
  res.render("newlisting.ejs");
};

// 🔍 SHOW SINGLE LISTING DETAILS
module.exports.showListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listingDetail = await Listing.findById(id)
      .populate({
        path: "reviews",
        populate: { path: "author" },
      })
      .populate("owner");

    if (!listingDetail) {
      return next(new ExpressError(404, "Listing not found!"));
    }

    res.render("listingDetail.ejs", { listingDetail });
  } catch (err) {
    next(err);
  }
};

// 🆕 CREATE NEW LISTING (with AWS S3 image)
module.exports.newListing = async (req, res, next) => {
  try {
    // ✅ Get image details from AWS S3
    const url = req.file.location;   // S3 URL
    const filename = req.file.key;   // Unique file name in S3

    // ✅ Get coordinates from OpenStreetMap
    const address = `${req.body.location}, ${req.body.country}`;
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&language=en`;
    const geocodeResponse = await fetch(geocodeUrl);
    const data = await geocodeResponse.json();

    const listingData = {
      ...req.body,
      owner: req.user._id,
      image: { url, filename },
    };

    // ✅ Add coordinates if found
    if (data && data.length > 0) {
      const lat = data[0].lat;
      const lon = data[0].lon;
      listingData.geometry = {
        type: "Point",
        coordinates: [lon, lat],
      };
      console.log("Listing created with geolocation.");
    } else {
      console.log("Geolocation not found, saving without coordinates.");
    }

    const newlisting = new Listing(listingData);
    await newlisting.save();

    req.flash("success", "Listing created successfully!");
    res.redirect("/listings");
  } catch (err) {
    next(err);
  }
};

// 📂 CATEGORY-BASED LISTINGS
module.exports.categoryListing = async (req, res) => {
  const selectedCategory = req.query.category;
  const categoryListings = await Listing.find({
    category: selectedCategory[0],
  });
  res.render("categoryListings", { listings: categoryListings });
};

// 🔎 SEARCH DESTINATIONS
module.exports.searchDestination = async (req, res) => {
  const searchQuery = req.body.search_dest;
  let matchedDest = await Listing.find({
    country: new RegExp(searchQuery, "i"),
  });

  if (!matchedDest || matchedDest.length === 0) {
    matchedDest = await Listing.find({
      location: new RegExp(searchQuery, "i"),
    });
  }

  res.render("searchResults", { matchedDest, searchQuery });
};

// 🧩 EDIT LISTING FORM
module.exports.editListingForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tobeEdited = await Listing.findById(id);

    if (!tobeEdited) {
      return next(new ExpressError(404, "Listing not found!"));
    }

    const originalImageurl = tobeEdited.image.url;
    res.render("editlisting.ejs", { tobeEdited, originalImageurl });
  } catch (err) {
    next(err);
  }
};

// ✏️ UPDATE LISTING (with optional new S3 image)
module.exports.editListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const editedListing = req.body;
    const listing = await Listing.findByIdAndUpdate(id, { ...editedListing });

    if (req.file) {
      // ✅ If user uploaded a new image, update S3 image details
      const url = req.file.location;
      const filename = req.file.key;
      listing.image = { url, filename };
      await listing.save();
    }

    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    next(err);
  }
};

// 🗑️ DELETE LISTING (UI version – not actual DB delete)
module.exports.deleteListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tobeEdited = await Listing.findById(id);
    if (!tobeEdited) {
      return next(new ExpressError(404, "Listing not found!"));
    }
    res.render("editlisting.ejs", { tobeEdited });
  } catch (err) {
    next(err);
  }
};
