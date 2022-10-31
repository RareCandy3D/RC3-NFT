const express = require("express");
const app = express();
const session = require("express-session");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const log = require("../config/log4js");
const Main = require("./services/main");
const { mongoConnect } = require("./services/mongo");
const main = new Main();
const PingServer = require("./helpers/classes/ping-server");
require("dotenv").config();
const port = process.env.PORT || 3000;

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

app.use(
  session({
    name: "rarecandy3D",
    secret: "kuXMThISDw9LA7mkEQ0pnOZt",
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false, sameSite: true },
  })
);

app.use("/api/mall", require("./routes/mall.routes"));
app.use("/api/nft", require("./routes/nft.routes"));
app.use("/api/user", require("./routes/user.routes"));

(async function init() {
  await mongoConnect();
  await main.subscribe();
  // sync events every 3 mins
  setInterval(async () => {
    await main.subscribe();
  }, 1800000);
})();

//ping heroku server every 50 mins
new PingServer().ping();

app.listen(port, () => {
  log.info(`🚀 Listening to server on port ${port}`);
  console.log(`Listening on port ${port}`);
});
