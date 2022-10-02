const log = require("../../config/log4js");
const UserModel = require("../models/user.model");
const { AuctionModel, DirectModel } = require("../models/mall.model");
const { CollectionModel, NftModel } = require("../models/nft.model");

class MarketEventSync {
  constructor(web3, mall, currentBlock, lastBlockChecked) {
    this.web3 = web3;
    this.mall = mall;
    this.currentBlock = currentBlock;
    this.lastBlockChecked = lastBlockChecked;
  }
  async sync() {
    try {
      //create new market trade
      const market_created_events = await this.mall.getPastEvents("NewMarket", {
        fromBlock: this.lastBlockChecked,
        toBlock: this.currentBlock,
      });
      await updateMarketCreatedDB(market_created_events);

      //buy market trade
      const market_bid_events = await this.mall.getPastEvents("MarketSale", {
        fromBlock: this.lastBlockChecked,
        toBlock: this.currentBlock,
      });
      await updateMarketSaleDB(market_bid_events);

      //delist market trade
      const market_cancelled_events = await this.mall.getPastEvents(
        "MarketCancelled",
        {
          fromBlock: this.lastBlockChecked,
          toBlock: this.currentBlock,
        }
      );
      await updateMarketCancelledDB(market_cancelled_events);
    } catch (e) {
      log.info(`Error Inserting action logs: ${e}`);
      console.log(`Error Inserting market logs: ${e}`);
    }
  }

  async updateMarketCreatedDB(data_events) {
    for (i = 0; i < data_events.length; i++) {
      let seller = data_events[i]["returnValues"]["caller"];
      let nft = data_events[i]["returnValues"]["nifty"];
      let marketId = data_events[i]["returnValues"]["marketId"];
      let tokenId = data_events[i]["returnValues"]["tokenId"];
      let amount = data_events[i]["returnValues"]["amount"];
      let price = data_events[i]["returnValues"]["price"];
      let tokenType = data_events[i]["returnValues"]["tokenType"];
      let asset = data_events[i]["returnValues"]["asset"];

      try {
        const data = new DirectModel({
          marketId: marketId,
          nftId: tokenId,
          nftAddress: nft,
          seller: seller,
          floorPrice: price,
          startTime: startPeriod,
          endTime: endPeriod,
          tradeToken: asset === 0 ? "ETH" : "RCDY",
          amount: tokenType === 0 ? 1 : amount,
        });
        await data.save();

        await UserModel.updateOne(
          { address: seller },
          {
            $push: { marketIdsCreated: marketId },
          }
        );
      } catch (e) {
        log.info(`Error inserting new market logs: ${e}`);
        console.log(`Error inserting new market logs: ${e}`);
      }
    }
  }

  async updateMarketSaleDB(data_events) {
    for (i = 0; i < data_events.length; i++) {
      let buyer = data_events[i]["returnValues"]["caller"];
      let marketId = data_events[i]["returnValues"]["marketId"];
      let price = data_events[i]["returnValues"]["price"];

      try {
        const market = await DirectModel.find({ marketId: marketId });

        await DirectModel.updateOne(
          { marketId: marketId },
          { buyer: buyer, soldFor: price, isClosed: true }
        );

        await CollectionModel.updateOne(
          { collectionId: market.collectionId },
          {
            numberOfTimesTraded: market.numberOfTimesTraded + 1,
            timeLastTraded: new Date.now(),
          }
        );

        await UserModel.updateOne(
          { address: buyer },
          {
            numberOfItemsBuys: market.numberOfItemsBuys + 1,
            amountSpent: market.amountSpent + market.soldFor,
            $push: { marketIdsBought: marketId },
          }
        );

        await UserModel.updateOne(
          { address: market.seller },

          {
            numberOfSells: market.numberOfSells + 1,
            amountReceived: market.amountReceived + market.soldFor,
          }
        );
      } catch (e) {
        log.info(`Error Inserting creator logs: ${e}`);
        console.log(`Error Inserting creator logs: ${e}`);
      }
    }
  }

  async updateMarketCancelledDB(data_events) {
    for (i = 0; i < data_events.length; i++) {
      let marketId = data_events[i]["returnValues"]["marketId"];

      try {
        const market = await DirectModel.find({ marketId: marketId });

        if (!market.isClosed) {
          await DirectModel.updateOne(
            { marketId: marketId },
            { $set: { isClosed: true } }
          );
        }
      } catch (e) {
        log.info(`Error Inserting creator logs: ${e}`);
        console.log(`Error Inserting creator logs: ${e}`);
      }
    }
  }
}

module.exports = MarketEventSync;
