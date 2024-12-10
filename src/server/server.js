const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const { throwError } = require("rxjs");

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

dotenv.config();

app.post("/authenticate", async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log(
      username,
      " ",
      password,
      " ",
      process.env["CLIENT_ID"],
      " ",
      process.env["CLIENT_SECRET"]
    );

    this.https;
    const response = await axios.post(
      "https://login.salesforce.com/services/oauth2/authorize",
      {
        username: username,
        password: password,
        client_id: process.env["CLIENT_ID"],
        client_secret: process.env["CLIENT_SECRET"]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    res.json(response.data);
    console.log("response", response.data);
  } catch (error) {
    res
      .status(error.status)
      .json({ error: "Internal Error!", message: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log("Server at port: " + PORT);
});
