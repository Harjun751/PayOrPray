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

const tripPeopleController = require("./peopleController");
app.get("/trips/:tripId/people", verifyJWT, tripPeopleController.getPeople)
app.post("/people", tripPeopleController.searchPerson);


const debtController = require("./debtController")
app.get("/trips/:tripId/debt", verifyJWT, debtController.getDebt)


// INVITES
const inviteController = require("./inviteController");
app.get("/trips/:tripId/invites", verifyJWT, inviteController.getInvites);
app.get("/invites", verifyJWT, inviteController.getInvitesForUser);
app.post("/trips/:tripId/invites", verifyJWT, inviteController.addInvite);
app.post("/trips/:tripId/invites/:inviteid/accept", verifyJWT, inviteController.acceptInvite);
app.post("/trips/:tripId/invites/:inviteid/decline", verifyJWT, inviteController.declineInvite);

// EXPENSES
const expensesController = require("./expensesController.js")
app.get("/trips/:tripId/expenses", expensesController.listExpenses)
app.post("/trips/:tripId/expenses", expensesController.addExpense)
app.delete("/trips/:tripId/expenses/:expenseId", expensesController.deleteExpense)

const owedController = require("./owedController.js")
app.get("/trips/:tripId/owed", verifyJWT, owedController.getOwed);


// EXPENSESPLITS
const expenseSplitsController = require("./expensesSplitsController");
app.get("/trips/:tripid/expenses/:expenseid/splits", expenseSplitsController.getExpenseSplits);
app.put("/trips/:tripid/expenses/:expenseid/splits", expenseSplitsController.putExpenseSplits);


module.exports = app;

