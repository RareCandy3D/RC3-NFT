const dev=process.env.NODE_ENV=="production" ? false : true;
if(dev){
  require('dotenv').config();
}else{
  require('dotenv').config({ path: "production.env"});
}

const express = require("express");
const app = express();
var morgan = require('morgan');
app.use(morgan('combined'))
const bodyParser = require("body-parser");
const cors = require("cors"); 
const helmet = require("helmet");
const log = require("../config/log4js");
const Main=require("./services/main");
const main=new Main();
const creatorsRoute=require("./routes/creators");
const hotnftsRoute=require("./routes/hot-nft");


const allowedOrigins = [
  "https://rarecandy.xyz","http://localhost:3000"
];

app.use(bodyParser.json({limit: '200mb'}));
app.use(bodyParser.urlencoded({limit: '200mb', extended: false, parameterLimit: 1000000}));
app.use(bodyParser.json({verify: (req, res, buf) => {req.rawBody = buf}}));
app.use(cors({
  "origin": allowedOrigins,
  "methods": ["GET","HEAD","PUT","PATCH","POST","DELETE"],
  "preflightContinue": false,
  "optionsSuccessStatus": 204,
  "allowedHeaders": ["Content-Type","Origin","X-Requested-with","Accept", "Authorization"]
}));
app.use(helmet());

app.use("/api/creators",creatorsRoute);
app.use("/api/hot-nfts",hotnftsRoute);

app.get("/api/",async (req,res)=>{
  res.status(200).send(new Date);
  });

(async function init(){
  await main.subscribe();
})();



const port = process.env.PORT || 3000;

  app.listen(port, () => {
    log.info(`🚀 Listening to server on port ${port}`);
    console.log(`Listening on port ${port}`);
  });
