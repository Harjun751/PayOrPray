// Express
var express = require('express');
var app = express();
app.use(express.json()); // so POST bodies work
app.use(express.urlencoded({ extended: true })); // optional (for form posts)

// QR
var qr = require('../model/paynow.js')
const supabase = require('../database.js');

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
app.get("/trips", tripsController.listTrips);
app.post("/trips", tripsController.createTrip);

const inviteController = require("./inviteController");
app.get("/trips/:tripId/invites", inviteController.getInvites);

app.get("/invites", inviteController.getInvitesForUser);
app.post("/trips/:tripid/invites", inviteController.addInvite);
app.post("/trips/:tripid/invites/:inviteid/accept", inviteController.acceptInvite);
app.post("/trips/:tripid/invites/:inviteid/decline", inviteController.declineInvite);

const expensesController = require("./expensesController.js")
app.get("/trips/:tripId/expenses", expensesController.listExpenses)
app.post("/trips/:tripId/expenses", expensesController.addExpense)

module.exports = app;

