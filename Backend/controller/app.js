// Express
var express = require('express');
var app = express();
app.use(express.json()); // so POST bodies work
app.use(express.urlencoded({ extended: true })); // optional (for form posts)

// Auth Middleware
const verifyJWT = require("../middleware/auth.js");
var cors = require('cors')

// QR
var qr = require('../model/paynow.js')
const supabase = require('../database.js');


app.use(
    cors({
        origin: [
            "http://localhost:5173",
            process.env.FRONTEND_ORIGIN
        ],
        credentials: true
    })
)

// Exisitng routes
app.get("/test", async (req, res) => {
    const { data, error } = await supabase.from('users').select();
    if (error != null) {
        res.send(error);
    } else {
        res.send(data);
    }
})

app.get('/generateQR',function(req, res){

    qr.generate((err, pngBuffer) => {
    if (err) {
        console.error("Failed:", err);
        return res.status(500).json({ error: "Failed to generate QR" });
    }
    //send PNG Bytes to browser
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Length", pngBuffer.length);
    res.send(pngBuffer);
    });
});

// TRIP

const tripsController = require("./tripsController");
app.get("/trips", verifyJWT, tripsController.listTrips);
app.post("/trips", verifyJWT, tripsController.createTrip);

const inviteController = require("./inviteController");
app.get("/trips/:tripId/invites", verifyJWT, inviteController.getInvites);

app.get("/invites", verifyJWT, inviteController.getInvitesForUser);
app.post("/trips/:tripid/invites", verifyJWT, inviteController.addInvite);
app.post("/trips/:tripid/invites/:inviteid/accept", verifyJWT, inviteController.acceptInvite);
app.post("/trips/:tripid/invites/:inviteid/decline", verifyJWT, inviteController.declineInvite);

const expensesController = require("./expensesController.js")
app.get("/trips/:tripId/expenses", verifyJWT, expensesController.listExpenses)
app.post("/trips/:tripId/expenses", verifyJWT, expensesController.addExpense)
app.delete("/trips/:tripId/expenses/:expenseId", verifyJWT, expensesController.deleteExpense)

module.exports = app;

