// Environment variables
require('dotenv').config();

// DB setup
const pgp = require('pg-promise')();
let conn = process.env.DATABASE_CONN_STRING;
const db = pgp(conn);

// Express
var express = require('express');
var app = express();

module.exports = app;

app.get("/test", async (req, res) => {
    let dbres = await db.any('SELECT * FROM USERS');
    res.send(dbres);
})
