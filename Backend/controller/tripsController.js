const tripsModel = require("../model/tripsModel");

// List trips for authenticated user
async function listTrips(req, res) {
    try {
        const userId = req.user.id;

        const page = req.query.page ? Number(req.query.page) : 1;
        const trips = await tripsModel.getTripsForUser(userId, page);
        return res.status(200).json(trips);
    }
    catch (err) {
        console.error("listTrips error:", err);
        return res.status(500).json({
        code: "INTERNAL_ERROR",
        message: err?.message || "Unknown error",
        details: err,
        });
    }
}

// Create a new trip for authenticated user
async function createTrip(req, res) {
    try {
        const userId = req.user.id;
        if (!userId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing credentials" });

        const { name,description } = req.body || {};
        console.log("Received name:", name); // Add this
        if (!name || !String(name).trim()) {
            return res.status(400).json({ code: "BAD_REQUEST", message: "Name is required" });
        }

        const trip = await tripsModel.createTrip({
            ownerId: userId,
            name: String(name).trim(),
            description: description
        });

        res.setHeader("Location", `/trips/${trip.TripID}`);
        return res.status(201).json(trip);
    } catch (err) {
        console.error("createTrip error:", err); // Add this
        return res.status(500).json({
            code: "INTERNAL_ERROR",
            message: err?.message || "Unknown error",
            details: err,
        });
    }
}



module.exports = { listTrips, createTrip};
