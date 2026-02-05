const axios = require("axios");
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
        // originalImageurl = originalImageurl.replace("/upload", "/upload/h_300,w_250");
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


function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(1); // 1 decimal place
}




module.exports.nearbyplaces = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const [lng, lat] = listing.geometry.coordinates;

    const query = `
      [out:json];
      (
        node(around:8000,${lat},${lng})["tourism"="attraction"];
        node(around:8000,${lat},${lng})["natural"];
        node(around:8000,${lat},${lng})["historic"];
      );
      out body;
    `;

    const response = await axios.post(
      "https://overpass-api.de/api/interpreter",
      `data=${encodeURIComponent(query)}`,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const places = response.data.elements
      .filter(el => el.tags?.name && el.lat && el.lon)
      .map(el => {
        const distance = getDistanceKm(lat, lng, el.lat, el.lon);

        let category = "Other";
        if (el.tags.natural === "hot_spring") category = "Hot Spring";
        else if (el.tags.natural === "peak") category = "Peak";
        else if (el.tags.tourism === "attraction") category = "Attraction";
        else if (el.tags.historic) category = "Historic";

        return {
          name: el.tags.name,
          category,
          distance
        };
      })
      .sort((a, b) => a.distance - b.distance);

    res.json(places);
  } catch (err) {
  console.error("NEARBY PLACES FULL ERROR:");
  console.error(err.response?.data || err.message || err);
  res.status(500).json({
    error: "Unable to fetch nearby places",
    debug: err.response?.data || err.message
  });

  }
};
