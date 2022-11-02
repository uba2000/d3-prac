const express = require("express");
const { Spot } = require("@binance/connector");
const dotenv = require("dotenv");
dotenv.config();

// [
//   [
//     1499040000000, // Open time
//     "0.01634790", // Open
//     "0.80000000", // High
//     "0.01575800", // Low
//     "0.01577100", // Close
//     "148976.11427815", // Volume
//     1499644799999, // Close time
//     "2434.19055334", // Quote asset volume
//     308, // Number of trades
//     "1756.87402397", // Taker buy base asset volume
//     "28.46694368", // Taker buy quote asset volume
//     "17928899.62484339", // Ignore.
//   ],
// ];

const PORT = process.env.PORT || 5500;

const app = express();
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
