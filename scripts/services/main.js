const Web3 = require("web3");
require("dotenv").config();
const BlockModel = require("../models/block.model");
const CreatorsEventSync = require("../helpers/CreatorsEventSync");
const AuctionEventSync = require("../helpers/AuctionEventSync");
const MarketEventSync = require("../helpers/MarketEventSync");

const initContractBlock = 23557638; //bsc testnet deployment block for RC3_Mall contract

class Main {
  async subscribe() {
    //connect to RPC
    const web3 = new Web3(
      new Web3.providers.HttpProvider(process.env.BSC_TEST)
    );

    const latest_block = (await web3.eth.getBlockNumber()) - 5;

    try {
      let fromBlock, toBlock;
      let lastBlock = await BlockModel.findOne({ id: initContractBlock });

      if (!lastBlock) {
        const newBlock = new BlockModel({
          blockId: initContractBlock,
          lastBlock: initContractBlock,
        });
        await newBlock.save();
      }

      lastBlock = await BlockModel.findOne({ id: initContractBlock });

      // gap 5000 blocks - limit of getPastEvents
      if (latest_block - lastBlock["lastBlock"] > 5000) {
        fromBlock = lastBlock["lastBlock"] + 1;
        toBlock = lastBlock["lastBlock"] + 5000;
      } else {
        fromBlock = lastBlock["lastBlock"] + 1;
        toBlock = Math.min(lastBlock["lastBlock"] + 5000, latest_block);
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
        { id: initContractBlock },
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
