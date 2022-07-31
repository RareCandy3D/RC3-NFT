const Web3 = require("web3");
const mallABI = require("../../addresses/mall_abi/RC3_Mall_Implementation.json");
const creatorsABI = require("../../artifacts/contracts/RC3_Creators.sol/RC3_Creators.json");
const originalsABI = require("../../artifacts/contracts/RC3_Originals.sol/RC3_Originals.json");
const addresses = require("../../addresses/index.js");
const Web3Helper = require("../helpers/Web3Helper");
const CreatorEventWatcher = require("../helpers/CreatorEventWatcher");
const AuctionEventWatcher = require("../helpers/AuctionEventWatcher");
const MarketSaleEventWatcher = require("../helpers/MarketSaleEventWatcher");

class Main {
  async subscribe() {
    //connect to RPC
    const web3 = new Web3(
      new Web3.providers.WebsocketProvider(process.env.INFURA_URL)
    );

    //add wallet account
    const { address: admin } = web3.eth.accounts.wallet.add(
      process.env.PRIVATE_KEY
    );

    // //create web3 contract instance
    const mall = new web3.eth.Contract(mallABI.abi, addresses.kovan.mall);

    const creators = new web3.eth.Contract(
      creatorsABI.abi,
      addresses.kovan.creators
    );
    // const originals = new web3.eth.Contract(
    //   originalsABI.abi,
    //   addresses.kovan.originals
    // );

    web3.eth
      .subscribe("newBlockHeaders")
      .on("data", async (block) => {
        // console.log(`New block: ${block.number}`);
        // watch for creator events
         await new CreatorEventWatcher(creators).watch();
        // watch for auction events
        await new AuctionEventWatcher(mall).watch();
        // watch for market sale events
         await new MarketSaleEventWatcher(mall).watch(mall);
      })
      .on("error", (error) => {
        console.log(error);
      });
  }
}

module.exports = Main;
