const express = require("express");
const mallRouter = express.Router();
const UserModel = require("../models/user.model");
const { AuctionModel, DirectModel } = require("../models/mall.model");
const { CollectionModel, NftModel } = require("../models/nft.model");

//get all auctions
mallRouter.get("/auctions", async (req, res) => {
  try {
    const data = await AuctionModel.find().limit(10).skip(0);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(400).json({ message: error.message });
  }
});

//get active auctions
mallRouter.get("/auctions/active", async (req, res) => {
  try {
    const data = await AuctionModel.find({
      $and: [
        { startTime: { $gte: new Date.now() } },
        { endTime: { $lte: new Date.now() } },
      ],
    })
      .limit(10)
      .skip(0);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(400).json({ message: error.message });
  }
});

//get all direct markets
mallRouter.get("/markets", async (req, res) => {
  try {
    const data = await DirectModel.find({}).limit(10).skip(0);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(400).json({ message: error.message });
  }
});

//get active direct markets
mallRouter.get("/markets/active", async (req, res) => {
  try {
    const data = await DirectModel.find({ buyer: { $exists: false } })
      .limit(10)
      .skip(0);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(400).json({ message: error.message });
  }
});

//create new auction trade
mallRouter.post("/auctions/create", async (req, res) => {
  try {
    const data = new AuctionModel({
      auctionId: Number(req.body.auctionId),
      nftId: Number(req.body.nftId),
      nftAddress: req.body.nftAddress,
      seller: req.body.seller,
      floorPrice: req.body.floorPrice,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      tradeToken: req.body.tradeToken,
    });

    const dataToSave = await data.save();

    await UserModel.updateOne(
      { address: data.seller },
      {
        $push: { auctionIdsCreated: data.auctionId },
      }
    );

    return res.status(200).json(dataToSave);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

//make bid
mallRouter.post("/auctions/bid", async (req, res) => {
  try {
    const data = {
      auctionId: req.body.auctionId,
      price: req.body.amount,
      address: req.body.userAddress,
    };

    const auction = await AuctionModel.updateOne(
      { auctionId: data.auctionId },
      { buyer: data.address, soldFor: data.price }
    );

    await CollectionModel.updateOne(
      { collectionId: auction.collectionId },
      {
        numberOfTimesTraded: auction.numberOfTimesTraded + 1,
        timeLastTraded: new Date.now(),
      }
    );

    await UserModel.updateOne(
      { address: data.address },
      {
        $push: { auctionIdsBidded: data.auctionId },
      }
    );
    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

//close bid
mallRouter.post("/auctions/close", async (req, res) => {
  try {
    const data = {
      auctionId: req.body.auctionId,
    };

    const auction = await AuctionModel.updateOne(
      { auctionId: data.auctionId },
      { isClosed: true }
    );

    await UserModel.updateOne(
      { address: auction.buyer },

      {
        numberOfItemsBuys: numberOfItemsBuys + 1,
        amountSpent: amountSpent + auction.soldFor,
        $push: { auctionIdsBought: data.auctionId },
      }
    );

    await UserModel.updateOne(
      { address: auction.seller },

      {
        numberOfSells: numberOfSells + 1,
        amountReceived: amountReceived + auction.soldFor,
      }
    );
    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

//create new direct trade
mallRouter.post("markets/create", async (req, res) => {
  try {
    const data = new DirectModel({
      marketId: req.body.marketId,
      nftId: req.body.nftId,
      nftAddress: req.body.nftAddress,
      seller: req.body.seller,
      floorPrice: req.body.floorPrice,
      tradeToken: req.body.tradeToken,
    });

    const dataToSave = await data.save();

    await UserModel.updateOne(
      { address: data.seller },
      {
        $push: { directIdsCreated: data.auctionId },
      }
    );

    return res.status(200).json(dataToSave);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

//buy market
mallRouter.post("/markets/buy", async (req, res) => {
  try {
    const data = {
      marketId: req.body.marketId,
      price: req.body.amount,
      address: req.body.userAddress,
    };

    const market = await DirectModel.updateOne(
      { marketId: data.marketId },
      { buyer: data.address, soldFor: data.price, isClosed: true }
    );

    await CollectionModel.updateOne(
      { collectionId: market.collectionId },
      {
        numberOfTimesTraded: market.numberOfTimesTraded + 1,
        timeLastTraded: new Date.now(),
      }
    );

    await UserModel.updateOne(
      { address: data.address },

      {
        numberOfItemsBuys: numberOfItemsBuys + 1,
        amountSpent: amountSpent + data.price,
        $push: { directIdsBought: data.marketId },
      }
    );

    await UserModel.updateOne(
      { address: market.seller },

      {
        numberOfSells: numberOfSells + 1,
        amountReceived: amountReceived + data.price,
      }
    );

    const dataToSave = await data.save();
    return res.status(200).json(dataToSave);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = mallRouter;
