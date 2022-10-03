const log = require("../../config/log4js");
const UserModel = require("../models/user.model");
const { AuctionModel, DirectModel } = require("../models/mall.model");
const { CollectionModel, NftModel } = require("../models/nft.model");

class AuctionEventSync {
  constructor(web3, mall, currentBlock, lastBlockChecked) {
    this.web3 = web3;
    this.mall = mall;
    this.currentBlock = currentBlock;
    this.lastBlockChecked = lastBlockChecked;
  }
  async sync() {
    try {
      //create new auction trade
      const auction_created_events = await this.mall.getPastEvents(
        "NewAuction",
        {
          fromBlock: this.lastBlockChecked,
          toBlock: this.currentBlock,
        }
      );
      await updateAuctionCreatedDB(auction_created_events);

      //bid auction trade
      const auction_bid_events = await this.mall.getPastEvents("NewBid", {
        fromBlock: this.lastBlockChecked,
        toBlock: this.currentBlock,
      });
      await updateNewBidDB(auction_bid_events);

      //updated auction trade time
      const auction_updated_events = await this.mall.getPastEvents(
        "AuctionUpdated",
        {
          fromBlock: this.lastBlockChecked,
          toBlock: this.currentBlock,
        }
      );
      await updateAuctionUpdatedDB(auction_updated_events);

      //close auction trade positive
      const auction_resulted_events = await this.mall.getPastEvents(
        "AuctionResulted",
        {
          fromBlock: this.lastBlockChecked,
          toBlock: this.currentBlock,
        }
      );
      await updateAuctionResultedDB(auction_resulted_events);

      //close auction trade negative
      const auction_cancelled_events = await this.mall.getPastEvents(
        "AuctionCancelled",
        {
          fromBlock: this.lastBlockChecked,
          toBlock: this.currentBlock,
        }
      );
      await updateAuctionCancelledDB(auction_cancelled_events);
    } catch (e) {
      log.info(`Error Inserting action logs: ${e}`);
      console.log(`Error Inserting auction logs: ${e}`);
    }
  }

  async updateAuctionCreatedDB(data_events) {
    for (i = 0; i < data_events.length; i++) {
      let seller = data_events[i]["returnValues"]["seller"];
      let nft = data_events[i]["returnValues"]["nft"];
      let auctionId = data_events[i]["returnValues"]["auctionId"];
      let tokenId = data_events[i]["returnValues"]["tokenId"];
      let floorPrice = data_events[i]["returnValues"]["floorPrice"];
      let amount = data_events[i]["returnValues"]["amount"];
      let startPeriod = data_events[i]["returnValues"]["startPeriod"];
      let endPeriod = data_events[i]["returnValues"]["endPeriod"];
      let tokenType = data_events[i]["returnValues"]["tokenType"];

      try {
        const data = new AuctionModel({
          auctionId: auctionId,
          nftId: tokenId,
          nftAddress: nft,
          seller: seller,
          floorPrice: floorPrice,
          startTime: startPeriod,
          endTime: endPeriod,
          amount: tokenType === 0 ? 1 : amount,
        });
        await data.save();

        await UserModel.updateOne(
          { address: seller },
          {
            $push: { auctionIdsCreated: auctionId },
          }
        );
      } catch (e) {
        log.info(`Error Inserting creator logs: ${e}`);
        console.log(`Error Inserting creator logs: ${e}`);
      }
    }
  }

  async updateNewBidDB(data_events) {
    for (i = 0; i < data_events.length; i++) {
      let bidder = data_events[i]["returnValues"]["bidder"];
      let price = data_events[i]["returnValues"]["price"];
      let auctionId = data_events[i]["returnValues"]["auctionId"];

      try {
        const auction = await AuctionModel.find({ auctionId: auctionId });

        await AuctionModel.updateOne(
          { auctionId: data.auctionId },
          { buyer: bidder, soldFor: price }
        );

        await CollectionModel.updateOne(
          { collectionId: auction.collectionId },
          {
            timeLastTraded: new Date.now(),
          }
        );

        await UserModel.updateOne(
          { address: bidder },
          {
            $push: { auctionIdsBidded: auctionId },
          }
        );
      } catch (e) {
        log.info(`Error Inserting creator logs: ${e}`);
        console.log(`Error Inserting creator logs: ${e}`);
      }
    }
  }

  async updateAuctionUpdatedDB(data_events) {
    for (i = 0; i < data_events.length; i++) {
      let auctionId = data_events[i]["returnValues"]["auctionId"];
      let newEndPeriod = data_events[i]["returnValues"]["newEndPeriod"];

      try {
        const auction = await AuctionModel.find({ auctionId: auctionId });

        //update auction
        await AuctionModel.updateOne(
          { auctionId: auctionId },
          { endTime: newEndPeriod }
        );
      } catch (e) {
        log.info(`Error Inserting creator logs: ${e}`);
        console.log(`Error Inserting creator logs: ${e}`);
      }
    }
  }

  async updateAuctionResultedDB(data_events) {
    for (i = 0; i < data_events.length; i++) {
      let auctionId = data_events[i]["returnValues"]["auctionId"];

      try {
        const auction = await AuctionModel.find({ auctionId: auctionId });

        if (!auction.isClosed) {
          await AuctionModel.updateOne(
            { auctionId: data.auctionId },
            { $set: { isClosed: true } }
          );
        }

        await UserModel.updateOne(
          { address: auction.buyer },

          {
            numberOfItemsBuys: numberOfItemsBuys + 1,
            amountSpent: amountSpent + auction.soldFor,
            $push: { auctionIdsBought: auctionId },
          }
        );

        await UserModel.updateOne(
          { address: auction.seller },

          {
            numberOfSells: numberOfSells + 1,
            amountReceived: amountReceived + auction.soldFor,
          }
        );
      } catch (e) {
        log.info(`Error Inserting creator logs: ${e}`);
        console.log(`Error Inserting creator logs: ${e}`);
      }
    }
  }

  async updateAuctionCancelledDB(data_events) {
    for (i = 0; i < data_events.length; i++) {
      let caller = data_events[i]["returnValues"]["caller"];
      let nft = data_events[i]["returnValues"]["nft"];
      let auctionId = data_events[i]["returnValues"]["auctionId"];

      try {
        const auction = await AuctionModel.find({ auctionId: auctionId });

        if (!auction.isClosed) {
          await AuctionModel.updateOne(
            { auctionId: auctionId },
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

module.exports = AuctionEventSync;
