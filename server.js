"use strict";
require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const jwt = require("express-jwt");
const jwks = require("jwks-rsa");
const mongoose = require("mongoose");
const startCrons = require("./crons/cron");

const db = mongoose.connection;

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
db.on("error", console.error.bind(console, "mongoose connection error:"));
db.once("open", console.log.bind(console, "mongoose connected"));

var jwtCheck = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ["RS256"],
});

app.use(require("cors")());
app.use(require("compression")());
app.use(require("response-time")());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/favoriteGroup", require("./routes/favoriteGroup"));
//app.use(jwtCheck);
app.use("/user", require("./routes/user"));

if (app.get("env") === "development") {
  app.use(function (err, req, res, next) {
    res.status(500).json(err.stack);
  });
} else {
  app.use(function (err, req, res, next) {
    res.status(500).json(err.message);
  });
}

app.listen(process.env.PORT || 5001, () => {
  startCrons();
});
