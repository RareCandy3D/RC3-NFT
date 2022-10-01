const Web3 = require("web3");
const mallABI = require("../../addresses/mall_abi/RC3_Mall_Implementation.json");
const creatorsABI = require("../../artifacts/contracts/RC3_Creators.sol/RC3_Creators.json");
const addresses = require("../../addresses/index.js");
const CreatorEventWatcher = require("../helpers/CreatorEventWatcher");
const AuctionEventWatcher = require("../helpers/AuctionEventWatcher");
const MarketSaleEventWatcher = require("../helpers/MarketSaleEventWatcher");

class Main {
  async subscribe() {
    //connect to RPC
    const web3 = new Web3(
      new Web3.providers.WebsocketProvider(process.env.INFURA_URL)
    );

    //create web3 contract instance
    const mall = new web3.eth.Contract(mallABI.abi, addresses.kovan.mall);
    const creators = new web3.eth.Contract(
      creatorsABI.abi,
      addresses.kovan.creators
    );

    web3.eth
      .subscribe("newBlockHeaders")
      .on("data", async (block) => {
        // watch for creator events
        await new CreatorEventWatcher(creators).watch();
        // watch for auction events
        await new AuctionEventWatcher(mall).watch();
        // watch for market sale events
        await new MarketSaleEventWatcher(mall).watch();
        //      mall.events.allEvents().on("data", async (event) => {
        // console.log(event)
        //         })
      })
      .on("error", (error) => {
        console.log(error);
      });
  }
}

module.exports = Main;
