const tripsModel = require("../model/tripsModel");

// TEMP auth: use header x-user-id to simulate logged in user
function getUserId(req) {
  const v = req.header("x-user-id");
  return v ? Number(v) : null;
}

// List trips for authenticated user
async function listTrips(req, res) {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing credentials" });

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
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing credentials" });

  const { Description } = req.body || {};
  if (!Description || !String(Description).trim()) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "Description is required" });
  }

    const trip = await tripsModel.createTrip({
    ownerId: userId,
    description: String(Description).trim(),
  });

  res.setHeader("Location", `/trips/${trip.TripID}`);
  return res.status(201).json(trip);
}



module.exports = { listTrips, createTrip};
