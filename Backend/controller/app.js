var express = require('express');
var app = express();

var qr = require('../model/paynow.js')

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