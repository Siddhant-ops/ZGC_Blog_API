const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose.connect(
  process.env.DB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  },
  () => {
    console.log("Connected to db");
  }
);

// Importing Routes
const AuthRoutes = require("./routes/auth");

// Route Middleware
app.use("/auth/local", AuthRoutes);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Auth Service Running at ${PORT}`);
});
