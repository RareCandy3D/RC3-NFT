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
        { startTime: { $lte: new Date.now() } },
        { endTime: { $gte: new Date.now() } },
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

module.exports = mallRouter;
