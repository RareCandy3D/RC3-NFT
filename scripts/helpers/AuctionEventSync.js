const Web3 = require("web3");
const log = require("../../config/log4js");
const userDatabase = require("../models/user.model");
const auctionDatabase = require("../models/mall.model");
const collectionDatabase = require("../models/nft.model");
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.MUMBAI_URL));
const { RC3MallAddr, RC3CAddr, RC3MallABI } = require("../contracts");
let BN = web3.utils.BN;

class AuctionEventSync {
  constructor(currentBlock, lastBlockChecked) {
    this.mall = new web3.eth.Contract(RC3MallABI, RC3MallAddr);
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

      if (auction_created_events.length !== 0) {
        await this.updateAuctionCreatedDB(auction_created_events);
      }

      //bid auction trade
      const auction_bid_events = await this.mall.getPastEvents("NewBid", {
        fromBlock: this.lastBlockChecked,
        toBlock: this.currentBlock,
      });

      if (auction_bid_events.length !== 0) {
        await this.updateNewBidDB(auction_bid_events);
      }

      //updated auction trade time
      const auction_updated_events = await this.mall.getPastEvents(
        "AuctionUpdated",
        {
          fromBlock: this.lastBlockChecked,
          toBlock: this.currentBlock,
        }
      );

      if (auction_updated_events.length !== 0) {
        await this.updateAuctionUpdatedDB(auction_updated_events);
      }

      //close auction trade positive
      const auction_resulted_events = await this.mall.getPastEvents(
        "AuctionResulted",
        {
          fromBlock: this.lastBlockChecked,
          toBlock: this.currentBlock,
        }
      );

      if (auction_resulted_events.length !== 0) {
        await this.updateAuctionResultedDB(auction_resulted_events);
      }

      //close auction trade negative
      const auction_cancelled_events = await this.mall.getPastEvents(
        "AuctionCancelled",
        {
          fromBlock: this.lastBlockChecked,
          toBlock: this.currentBlock,
        }
      );

      if (auction_cancelled_events.length !== 0) {
        await this.updateAuctionCancelledDB(auction_cancelled_events);
      }
    } catch (e) {
      log.info(`Error Inserting action logs: ${e}`);
      console.log(`Error Inserting auction logs: ${e}`);
    }
  }

  async updateAuctionCreatedDB(data_events) {
    for (let i = 0; i < data_events.length; i++) {
      const seller = data_events[i]["returnValues"]["seller"];
      const nft = data_events[i]["returnValues"]["nft"];
      const auctionId = data_events[i]["returnValues"]["auctionId"];
      const tokenId = data_events[i]["returnValues"]["tokenId"];
      const floorPrice = data_events[i]["returnValues"]["floorPrice"];
      const amount = data_events[i]["returnValues"]["amount"];
      const startPeriod = data_events[i]["returnValues"]["startPeriod"];
      const endPeriod = data_events[i]["returnValues"]["endPeriod"];
      const tokenType = data_events[i]["returnValues"]["tokenType"];

      const data = new auctionDatabase.auctionDatabase({
        auctionId: auctionId,
        nftId: tokenId.toString(),
        nftAddress: nft,
        seller: seller,
        floorPrice: floorPrice,
        startTime: startPeriod * 1000,
        endTime: endPeriod * 1000,
        amount: tokenType === 0 ? 1 : amount,
      });
      await data.save();

      let user = await userDatabase.findOne({ address: seller });

      if (!user) {
        const newUser = new userDatabase({
          address: seller,
        });
        await newUser.save();
        console.log("New user saved:", seller);
        user = await userDatabase.findOne({ address: seller });
      }

      await userDatabase.findOneAndUpdate(
        { address: seller },
        {
          $push: { auctionIdsCreated: auctionId },
        }
      );

      console.log(
        `Found NewAuction event: auctionID = ${auctionId}, txHash = ${data_events[i]["transactionHash"]}`
      );
    }
  }

  async updateNewBidDB(data_events) {
    for (let i = 0; i < data_events.length; i++) {
      const bidder = data_events[i]["returnValues"]["bidder"];
      const price = data_events[i]["returnValues"]["price"];
      const auctionId = data_events[i]["returnValues"]["auctionId"];

      const auction = await auctionDatabase.auctionDatabase.findOne({
        auctionId: auctionId,
      });

      await auctionDatabase.auctionDatabase.findOneAndUpdate(
        { auctionId: auctionId },
        { buyer: bidder, soldFor: price }
      );

      const query = {
        $and: [
          {
            collectionId: { $eq: auction["nftId"] },
          },
          {
            address: { $eq: RC3CAddr },
          },
        ],
      };

      await collectionDatabase.findOneAndUpdate(query, {
        timeLastTraded: Date.now(),
      });

      await userDatabase.findOneAndUpdate(
        { address: bidder },
        {
          $push: { auctionIdsBidded: auctionId },
        }
      );

      console.log(
        `Found NewBid event: auctionID = ${auctionId}, txHash = ${data_events[i]["transactionHash"]}`
      );
    }
  }

  async updateAuctionUpdatedDB(data_events) {
    for (let i = 0; i < data_events.length; i++) {
      const auctionId = data_events[i]["returnValues"]["auctionId"];
      const newEndPeriod = data_events[i]["returnValues"]["newEndPeriod"];

      const eTime = new Date(0); // The 0 there is the key, which sets the date to the epoch
      eTime.setUTCSeconds(newEndPeriod);

      //update auction
      await auctionDatabase.auctionDatabase.findOneAndUpdate(
        { auctionId: auctionId },
        { endTime: eTime }
      );

      console.log(
        `Found AuctionUpdated event: auctionID = ${auctionId}, txHash = ${data_events[i]["transactionHash"]}`
      );
    }
  }

  async updateAuctionResultedDB(data_events) {
    for (let i = 0; i < data_events.length; i++) {
      const closedBy = data_events[i]["returnValues"]["caller"];
      const seller = data_events[i]["returnValues"]["seller"];
      const buyer = data_events[i]["returnValues"]["highestBidder"];
      const auctionId = data_events[i]["returnValues"]["auctionId"];
      const price = data_events[i]["returnValues"]["winPrice"];

      const auction = await auctionDatabase.auctionDatabase.findOne({
        auctionId: auctionId,
      });

      await auctionDatabase.auctionDatabase.findOneAndUpdate(
        { auctionId: auctionId },
        { isClosed: true }
      );

      let user = await userDatabase.findOne({ address: buyer });

      if (!user) {
        const newUser = new userDatabase({
          address: buyer,
        });
        await newUser.save();
        console.log("New user saved:", buyer);
        user = await userDatabase.findOne({ address: buyer });
      }

      await userDatabase.findOneAndUpdate(
        { address: buyer },
        {
          numberOfItemsBuys: user["numberOfItemsBuys"] + 1,
          rcdySpent: new BN(user["rcdySpent"].toString()).add(
            new BN(price.toString())
          ), //user["rcdySpent"] + web3.utils.toWei(price.toString()),
          $push: { auctionIdsBought: auctionId },
        }
      );

      user = await userDatabase.findOne({ address: seller });
      await userDatabase.findOneAndUpdate(
        { address: seller },
        {
          numberOfSells: user["numberOfSells"] + 1,
          rcdyReceived: new BN(user["rcdyReceived"].toString()).add(
            new BN(price.toString())
          ),
          //user["rcdyReceived"] + web3.utils.toWei(price.toString()),
          $push: { auctionIdsSold: auctionId },
        }
      );

      user = await userDatabase.findOne({ address: closedBy });
      if (!user) {
        const newUser = new userDatabase({
          address: closedBy,
        });
        await newUser.save();
        console.log("New user saved:", closedBy);
        user = await userDatabase.findOne({ address: closedBy });
      }

      await userDatabase.findOneAndUpdate(
        { address: closedBy },
        {
          $push: { auctionsClosed: auctionId },
        }
      );

      const query = {
        $and: [
          {
            collectionId: { $eq: auction["nftId"] },
          },
          {
            address: { $eq: RC3CAddr },
          },
        ],
      };

      const collection = await collectionDatabase.findOne(query);

      await collectionDatabase.findOneAndUpdate(query, {
        numberOfTimesTraded: collection["numberOfTimesTraded"] + 1,
      });

      console.log(
        `Found AuctionResulted event: auctionID = ${auctionId}, txHash = ${data_events[i]["transactionHash"]}`
      );
    }
  }

  async updateAuctionCancelledDB(data_events) {
    for (let i = 0; i < data_events.length; i++) {
      const closedBy = data_events[i]["returnValues"]["caller"];
      const auctionId = data_events[i]["returnValues"]["auctionId"];

      await auctionDatabase.auctionDatabase.findOneAndUpdate(
        { auctionId: auctionId },
        { isClosed: true }
      );

      await userDatabase.findOneAndUpdate(
        { address: closedBy },
        {
          $push: { auctionsClosed: auctionId },
        }
      );

      console.log(
        `Found AuctionCancelled event: auctionID = ${auctionId}, txHash = ${data_events[i]["transactionHash"]}`
      );
    }
  }
}

module.exports = AuctionEventSync;
