const Listing = require("../models/listing.js");

module.exports.index = async (req, res) => {
    let listings = await Listing.find();
    res.render("listings.ejs", { listings })
}

module.exports.form = (req, res) => {
    res.render("newlisting.ejs")
}


module.exports.showListing =  async (req, res, next) => {
    try {
        let {id} = req.params;
        let listingDetail = await Listing.findById(id).populate({path: "reviews", populate: {
            path: "author",
        }}).populate("owner");
        console.log(listingDetail);
        if (!listingDetail) {
            next(new ExpressError(404, "Listing not found!"));
        }
        res.render("listingDetail.ejs", { listingDetail})
    } catch (err) {
        next(err);
    }
}

module.exports.newListing =  async (req, res, next) => {
    try {
        let url = req.file.path;
        let filename = req.file.filename;
        const address = `${req.body.location}, ${req.body.country}`; 
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&language=en`;
        const geocodeResponse = await fetch(geocodeUrl);
        const data = await geocodeResponse.json();

        if (data && data.length > 0) {
            const lat = data[0].lat;
            const lon = data[0].lon;
            const newlisting = new Listing({
                ...req.body, 
                owner: req.user._id, 
                image: { url, filename }, 
                geometry: {
                    type: "Point", 
                    coordinates: [lon, lat] 
                }
    });         
            await newlisting.save();
            console.log("Listing created with geolocation.");

} 
     else {
            const newlisting = new Listing(req.body);
            newlisting.owner = req.user._id;
            newlisting.image = {url, filename};
            await newlisting.save();
            console.log("No");
            }
        res.redirect("/listings");
    } catch (err) {
        next(err);
    }
}


module.exports.categoryListing =  async (req, res) => {
        const selectedCategory = req.query.category;
        const categoryListings = await Listing.find({ category: selectedCategory[0] });
        console.log(categoryListings);
        res.render("categoryListings", { listings: categoryListings });
    }


module.exports.searchDestination = async (req, res) => {
        const searchQuery = req.body.search_dest;  
        let matchedDest = await Listing.find({ country: new RegExp(searchQuery, 'i') }); 
        if (!matchedDest) {
            matchedDest = await Listing.find({ location: new RegExp(searchQuery, 'i') }); 
        }
        console.log(matchedDest);
        res.render("searchResults", { matchedDest, searchQuery });
    }



module.exports.editListingForm = async (req, res, next) => {
    try {
        let {id} = req.params;
        let tobeEdited = await Listing.findById(id);
        if (!tobeEdited) {
            next(new ExpressError(404, "Listing not found!" ))
        }
        let originalImageurl = tobeEdited.image.url;
        originalImageurl = originalImageurl.replace("/upload", "/upload/h_300,w_250");
        res.render("editlisting.ejs" , { tobeEdited, originalImageurl });
    } catch (err) {
        next(err);
    }
}



module.exports.editListing = async (req, res, next) => {
    try {
        let { id } = req.params;
        let editedListing = req.body;
        let listing = await Listing.findByIdAndUpdate(id, { ...editedListing });
        if(typeof req.file !== "undefined") {
            let url = req.file.url;
            let filename = req.file.filename;
            listing.image = {url, filename};
            listing.save();
        }   
        req.flash("success", "Listing updated successfully!");
        res.redirect(`/listings/${id}`);
    } catch (err) {
        next(err);
    }
}





module.exports.deleteListing = async (req, res, next) => {
    try {
        let {id} = req.params;
        let tobeEdited = await Listing.findById(id);
        if (!tobeEdited) {
            next(new ExpressError(404, "Listing not found!" ))
        }
        res.render("editlisting.ejs" , { tobeEdited });
    } catch (err) {
        next(err);
    }
}