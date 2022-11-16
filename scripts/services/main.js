const Web3 = require("web3");
require("dotenv").config();
const BlockModel = require("../models/block.model");
const CreatorsEventSync = require("../helpers/CreatorsEventSync");
const AuctionEventSync = require("../helpers/AuctionEventSync");
const MarketEventSync = require("../helpers/MarketEventSync");

const initContractBlock = 29180000; //mumbai testnet deployment block for RC3_Mall contract
const range = 3500; // 5000

class Main {
  async subscribe() {
    //connect to RPC
    const web3 = new Web3(
      new Web3.providers.HttpProvider(process.env.MUMBAI_URL)
    );

    const latest_block = (await web3.eth.getBlockNumber()) - 5;

    try {
      let toBlock;
      let lastBlock = await BlockModel.findOne({ blockId: initContractBlock });

      if (!lastBlock) {
        const newBlock = new BlockModel({
          blockId: initContractBlock,
          lastBlock: initContractBlock,
        });
        await newBlock.save();
        lastBlock = await BlockModel.findOne({ blockId: initContractBlock });
      }

      let fromBlock = lastBlock["lastBlock"] + 1;

      // gap range blocks - limit of getPastEvents
      if (latest_block - lastBlock["lastBlock"] > range) {
        toBlock = lastBlock["lastBlock"] + range;
      } else {
        toBlock = Math.min(lastBlock["lastBlock"] + range, latest_block);
      }

      console.log(
        `listening for events from block: ${fromBlock}, to block: ${toBlock}`
      );

      // watch for creator events
      await new CreatorsEventSync(toBlock, fromBlock).sync();

      // watch for auction events
      await new AuctionEventSync(toBlock, fromBlock).sync();

      // watch for market sale events
      await new MarketEventSync(toBlock, fromBlock).sync();

      //update latest checked block
      await BlockModel.findOneAndUpdate(
        { blockId: initContractBlock },
        {
          lastBlock: toBlock,
        }
      );

      console.log(
        `done listening for events from block: ${fromBlock}, to block: ${toBlock}`
      );
    } catch (e) {
      console.log(`Error inserting logs: ${e}`);
    }
  }
}

module.exports = Main;
