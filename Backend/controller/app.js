// Environment variables
require('dotenv').config();

// DB setup
const pgp = require('pg-promise')();
let conn = process.env.DATABASE_CONN_STRING;
const db = pgp(conn);

// Express
var express = require('express');
var app = express();
var qr = require('../model/paynow.js')

module.exports = app;

app.get("/test", async (req, res) => {
    let dbres = await db.any('SELECT * FROM USERS');
    res.send(dbres);
})

module.exports = app;

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
