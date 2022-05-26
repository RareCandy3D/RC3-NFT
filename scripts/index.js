require("dotenv").config();
const Web3 = require("web3");
const mallABI = require("./../artifacts/contracts/RC3_MALL.sol/RC3_MALL.json");
const creatorsABI = require("./../artifacts/contracts/RC3_Creators.sol/RC3_Creators.json");
const originalsABI = require("./../artifacts/contracts/RC3_Originals.sol/RC3_Originals.json");
const addresses = require("./../addresses/index.js");

//connect to RPC
const web3 = new Web3(
  new Web3.providers.WebsocketProvider(process.env.INFURA_URL)
);

//add wallet account
const { address: admin } = web3.eth.accounts.wallet.add(
  process.env.PRIVATE_KEY
);
//const accounts = web3.eth.getAccounts();

//create web3 contract instance
const mall = new web3.eth.Contract(mallABI.abi, addresses.kovan.mall);

const creators = new web3.eth.Contract(
  creatorsABI.abi,
  addresses.kovan.creators
);
// const originals = new web3.eth.Contract(
//   originalsABI.abi,
//   addresses.kovan.originals
// );

const init = async () => {
  //how to write a function using web3js
  //await mall.methods.setFeeETH(2450).send({ from: admin, gas: 45000 });

  web3.eth
    .subscribe("newBlockHeaders")
    .on("data", async (block) => {
      //console.log(`New block: ${block.number}`);

      //how to read SC values
      // const res = await mall.methods.ethFee().call();
      // console.log("the result is:", res);

      // await mall.events.FeeSet().on("data", (event) => {
      //   console.log(event.returnValues.sender);
      // });

      // await mall.methods.setFeeETH(0).send({ from: admin, gas: 45000 });

      //update database if event emits
      await creators.events.NewToken().on("data", (event) => {
        console.log(event.returnValues.creator);

        //update database if event emits and web socket
      });

      //await mall.events.MarketSale()...
    })
    .on("error", (error) => {
      console.log(error);
    });
};
init();
