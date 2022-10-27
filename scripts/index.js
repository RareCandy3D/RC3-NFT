require("dotenv").config();
const express = require("express");
// const { Session } = require("express-session");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const log = require("../config/log4js");
const Main = require("./services/main");
const { mongoConnect } = require("./services/mongo");
const main = new Main();
const PingServer = require("./helpers/classes/ping-server");

const allowedOrigins = [
  "https://app.rarecandy.xyz",
  "http://localhost:3000",
  "http://localhost:3001",
];
app.use(helmet());
app.use(morgan("combined"));
app.use(bodyParser.json({ limit: "200mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "200mb",
    extended: false,
    parameterLimit: 1000000,
  })
);
app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    allowedHeaders: [
      "Content-Type",
      "Origin",
      "X-Requested-with",
      "Accept",
      "Authorization",
    ],
  })
);

// app.use(
//   Session({
//     name: "racecandy3D",
//     secret: "racecandy3D-freestyle-secret",
//     resave: true,
//     saveUninitialized: true,
//     proxy: true,
//     cookie: { secure: true, sameSite: true },
//   })
// );

app.use("/api/mall", require("./routes/mall.routes"));
app.use("/api/nft", require("./routes/nft.routes"));
app.use("/api/user", require("./routes/user.routes"));

app.get("/api/", async (req, res) => {
  res.status(200).send(new Date());
});

(async function init() {
  await mongoConnect();

  // sync events every 3 mins
  setInterval(async () => {
    await main.subscribe();
  }, 180000);
})();

//ping heroku server every 50 mins
new PingServer().ping();

const port = process.env.PORT || 3000;

app.listen(port, () => {
  log.info(`🚀 Listening to server on port ${port}`);
  console.log(`Listening on port ${port}`);
});
