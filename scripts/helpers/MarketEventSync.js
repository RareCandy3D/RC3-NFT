const Web3 = require("web3");
const log = require("../../config/log4js");
const userDatabase = require("../models/user.model");
const directDatabase = require("../models/mall.model");
const collectionDatabase = require("../models/nft.model");
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.MUMBAI_URL));
const { RC3MallAddr, RC3CAddr, RC3MallABI } = require("../contracts");
let BN = web3.utils.BN;

class MarketEventSync {
  constructor(currentBlock, lastBlockChecked) {
    this.mall = new web3.eth.Contract(RC3MallABI, RC3MallAddr);
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

      if (market_created_events.length !== 0) {
        this.updateMarketCreatedDB(market_created_events);
      }

      //buy market trade
      const market_bid_events = await this.mall.getPastEvents("MarketSale", {
        fromBlock: this.lastBlockChecked,
        toBlock: this.currentBlock,
      });

      if (market_bid_events.length !== 0) {
        this.updateMarketSaleDB(market_bid_events);
      }

      //delist market trade
      const market_cancelled_events = await this.mall.getPastEvents(
        "MarketCancelled",
        {
          fromBlock: this.lastBlockChecked,
          toBlock: this.currentBlock,
        }
      );
      if (market_cancelled_events.length !== 0) {
        this.updateMarketCancelledDB(market_cancelled_events);
      }
    } catch (e) {
      log.info(`Error Inserting action logs: ${e}`);
      console.log(`Error Inserting market logs: ${e}`);
    }
  }

  async updateMarketCreatedDB(data_events) {
    for (let i = 0; i < data_events.length; i++) {
      const seller = data_events[i]["returnValues"]["caller"];
      const nft = data_events[i]["returnValues"]["nifty"];
      const marketId = data_events[i]["returnValues"]["marketId"];
      const tokenId = data_events[i]["returnValues"]["tokenId"];
      const amount = data_events[i]["returnValues"]["amount"];
      const price = data_events[i]["returnValues"]["price"];
      const tokenType = data_events[i]["returnValues"]["tokenType"];
      const asset = data_events[i]["returnValues"]["asset"];

      const data = new directDatabase.directDatabase({
        marketId: marketId,
        nftId: tokenId.toString(),
        nftAddress: nft,
        seller: seller,
        floorPrice: price,
        tradeToken: asset === 0 ? "ETH" : "RCDY",
        amount: tokenType === 0 ? 1 : amount,
      });
      await data.save();

      await userDatabase.findOneAndUpdate(
        { address: seller },
        {
          $push: { marketIdsCreated: marketId },
        }
      );

      console.log(
        `Found NewMarket event: marketID = ${marketId}, txHash = ${data_events[i]["transactionHash"]}`
      );
    }
  }

  async updateMarketSaleDB(data_events) {
    for (let i = 0; i < data_events.length; i++) {
      const buyer = data_events[i]["returnValues"]["caller"];
      const marketId = data_events[i]["returnValues"]["marketId"];
      const price = data_events[i]["returnValues"]["price"];

      await directDatabase.directDatabase.findOneAndUpdate(
        { marketId: marketId },
        {
          buyer: buyer,
          soldFor: price,
          isClosed: true,
        }
      );

      const market = await directDatabase.directDatabase.findOne({
        marketId: marketId,
      });
      const query = {
        $and: [
          {
            collectionId: market["nftId"],
          },
          {
            address: RC3CAddr,
          },
        ],
      };

      const collection = await collectionDatabase.findOne(query);

      await collectionDatabase.findOneAndUpdate(query, {
        numberOfTimesTraded: collection["numberOfTimesTraded"] + 1,
        timeLastTraded: Date.now(),
      });

      if (market["tradeToken"] === "RCDY") {
        this.updateRCDYPayment(market);
      } else {
        this.updateETHPayment(market);
      }

      console.log(
        `Found MarketSale event: marketID=${marketId}, txHash=${data_events[i]["transactionHash"]}`
      );
    }
  }

  async updateMarketCancelledDB(data_events) {
    for (let i = 0; i < data_events.length; i++) {
      const marketId = data_events[i]["returnValues"]["marketId"];

      await directDatabase.directDatabase.findOneAndUpdate(
        { marketId: marketId },
        { isClosed: true }
      );

      console.log(
        `Found MarketCancelled event: marketID = ${marketId}, txHash = ${data_events[i]["transactionHash"]}`
      );
    }
  }

  async updateRCDYPayment(market) {
    const buyer = market["buyer"];
    const seller = market["seller"];
    const price = market["floorPrice"];
    const marketId = market["marketId"];

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
        $push: { marketIdsBought: marketId },
      }
    );

    user = await userDatabase.findOne({ address: seller });
    await userDatabase.findOneAndUpdate(
      { address: seller },

      {
        numberOfSells: user["numberOfSells"] + 1,
        rcdyReceived: new BN(user["rcdyReceived"].toString()).add(
          new BN(price.toString())
        ), //user["rcdyReceived"] + web3.utils.toWei(price.toString()),
        $push: { marketIdsSold: marketId },
      }
    );
  }

  async updateETHPayment(market) {
    console.log("the market is", market);
    const buyer = market["buyer"];
    const seller = market["seller"];
    const price = market["soldFor"];
    const marketId = market["marketId"];

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
        ethSpent: new BN(user["ethSpent"].toString()).add(
          new BN(price.toString())
        ), //user["ethSpent"] + web3.utils.toWei(price.toString()),
        $push: { marketIdsBought: marketId },
      }
    );

    user = await userDatabase.findOne({ address: seller });
    await userDatabase.findOneAndUpdate(
      { address: seller },

      {
        numberOfSells: user["numberOfSells"] + 1,
        ethReceived: user["ethReceived"] + web3.utils.toWei(price.toString()),
        $push: { marketIdsSold: marketId },
      }
    );
  }
}

module.exports = MarketEventSync;
