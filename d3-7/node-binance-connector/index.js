const express = require("express");
const { Spot } = require("@binance/connector");
const dotenv = require("dotenv");
const cors = require("cors");

const corsOptions = require("./config/corsOptions");

dotenv.config();

const PORT = process.env.PORT || 5500;

const app = express();
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const client = new Spot(process.env.API_KEY, process.env.API_SECRET);

app.get("/get-data", (req, res) => {
  client
    .klines("btcusdt", "1m", {
      limit: 100,
    })
    .then((response) => {
      client.logger.log(response.data);
      res.json(response.data);
    });
});

app.listen(PORT, () => {
  console.log("Server listening on port " + PORT);
});
