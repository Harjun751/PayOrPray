// Environment variables
require('dotenv').config();

// DB setup
const pgp = require('pg-promise')();
let conn = process.env.DATABASE_CONN_STRING;
const db = pgp(conn);

// Express
var express = require('express');
var app = express();
app.use(express.json()); // so POST bodies work

// QR
var qr = require('../model/paynow.js')


// Exisitng routes
app.get("/test", async (req, res) => {
    let dbres = await db.any('SELECT * FROM USERS');
    res.send(dbres);
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

module.exports = app;
