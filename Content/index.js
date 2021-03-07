const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");

dotenv.config();

const mongoURI = process.env.DB_URI;

// Importing Route
const blogRoute = require("./routes/blog");
const commentRoute = require("./routes/comment");

// Starting instance of express app
const app = express();
app.use(cors());

mongoose
  // Connect to DB
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })

  // Console log on successful connection
  .then(() => {
    console.log("Connected to Local mongoDB");
  })

  // Console log error if any
  .catch((err) => {
    console.error(err);
  });

app.use(bodyParser.json());
app.use("/blog", blogRoute);
app.use("/comment", commentRoute);

// Middleware for using raw data and JSON data
app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);

// Finding PORT argument
let ARG_PORT = "";

process.argv.forEach((elem) => {
  if (/[-port=]\d/g.test(elem)) {
    ARG_PORT = parseInt(elem.substr(6));
  }
});

// Use port 4000 if Environnent variable not set
const PORT = Number(ARG_PORT) || process.env.PORT || 4000;

// Start Listening
app.listen(PORT, () => {
  console.log("Content API is Started on", PORT);
});
