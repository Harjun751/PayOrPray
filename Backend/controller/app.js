// Express
var express = require('express');
var app = express();
var qr = require('../model/paynow.js')
const supabase = require('../database.js');

module.exports = app;

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
