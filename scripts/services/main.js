const Web3 = require("web3");
const mallABI = require("../../addresses/mall_abi/RC3_Mall_Implementation.json");
const creatorsABI = require("../../artifacts/contracts/RC3_Creators.sol/RC3_Creators.json");
const addresses = require("../../addresses/index.js");
const CreatorsEventSync = require("../helpers/CreatorsEventSync");
const AuctionEventSync = require("../helpers/AuctionEventSync");
const MarketEventSync = require("../helpers/MarketEventSync");

class Main {
  constructor() {
    this.lastBlock = 22825845; // bst testnet read from
  }

  async subscribe() {
    //connect to RPC
    const web3 = new Web3(
      new Web3.providers.HttpProvider(process.env.BSC_TEST)
    );

    //create web3 contract instance
    const mall = new web3.eth.Contract(mallABI.abi, addresses.kovan.mall);
    const creators = new web3.eth.Contract(
      creatorsABI.abi,
      addresses.kovan.creators
    );

    const latest_block = await web3.eth.getBlockNumber();
    console.log(`The latest block is ${latest_block}`);

    try {
      // watch for auction events
      await new AuctionEventSync(
        web3,
        mall,
        latest_block,
        this.lastBlock
      ).sync();

      // watch for market sale events
      await new MarketEventSync(
        web3,
        mall,
        latest_block,
        this.lastBlock
      ).sync();

      // watch for creator events
      await new CreatorsEventSync(
        web3,
        creators,
        latest_block,
        this.lastBlock
      ).sync();

      //update latest checked block
      this.lastBlock = latest_block;
    } catch (e) {
      log.info(`Error inserting new market logs: ${e}`);
      console.log(`Error inserting new market logs: ${e}`);
    }
  }
}

module.exports = Main;
