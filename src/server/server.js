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

    const response = await axios.post(
      "https://novigosolutionspvtltd2-dev-ed.develop.my.salesforce-sites.com/services/oauth2/authorize",
      null,
      {
        params: {
          grant_type: "client_credentials",
          username: username,
          password: password,
          client_id: process.env["CLIENT_ID"],
          client_secret: process.env["CLIENT_SECRET"]
        },
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    res.json({ data: response.data });
    console.log("response", response.data);

    // const response = await axios.post(
    //   "https://novigosolutionspvtltd2-dev-ed.develop.my.salesforce-sites.com/services/oauth2/token",
    //   null,
    //   {
    //     grant_type: "client_credentials",
    //     client_id: process.env["CLIENT_ID"],
    //     client_secret: process.env["CLIENT_SECRET"]
    //   }
    // );
    // res.json(response.data);
    // console.log("response", response.data);
  } catch (error) {
    console.log(error.status);
    res.status(400).json({ error: "Internal Error!", message: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log("Server at port: " + PORT);
});
