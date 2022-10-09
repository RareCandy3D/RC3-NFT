const express = require("express");
const mallRouter = express.Router();
const log = require("../../config/log4js");
const database = require("../models/mall.model");

//get all auctions
mallRouter.get("/auction", async (req, res) => {
  try {
    const data = await database.auctionDatabase
      .find({}, { _id: 0, __v: 0 })
      .sort({ auctionId: -1 })
      .skip(0)
      .limit(10);
    return res.status(200).json(data);
  } catch (e) {
    log.info(`Client Error getting all auctions logs: ${e}`);
    return res.status(400).json({ message: e.message });
  }
});

//get active auctions
mallRouter.get("/auction/active", async (req, res) => {
  try {
    const time = new Date();
    const data = await database.auctionDatabase
      .find(
        {
          $and: [
            { startTime: { $lte: time.getTime() / 1000 } },
            { endTime: { $gte: time.getTime() / 1000 } },
          ],
        },
        { _id: 0, __v: 0 }
      )
      .sort({ auctionId: -1 })
      .limit(10)
      .skip(0);

    if (data.length === 0) {
      return res.status(404).json({
        error: "No active auction not found",
      });
    }
    return res.status(200).json(data);
  } catch (e) {
    log.info(`Client Error getting active auctions logs: ${e}`);
    return res.status(400).json({ message: e.message });
  }
});

//get upcoming auctions
mallRouter.get("/auction/upcoming", async (req, res) => {
  const time = new Date();
  try {
    const data = await database.auctionDatabase
      .find(
        {
          startTime: { $gte: time.getTime() },
        },
        { _id: 0, __v: 0 }
      )
      .sort({ startTime: 1 })
      .limit(10)
      .skip(0);

    if (data.length === 0) {
      return res.status(404).json({
        error: "No upcoming auction found",
      });
    }
    return res.status(200).json(data);
  } catch (e) {
    log.info(`Client Error getting upcoming auctions logs: ${e}`);
    return res.status(400).json({ message: e.message });
  }
});

//get all direct markets
mallRouter.get("/direct", async (req, res) => {
  try {
    const data = await database.directDatabase
      .find({}, { _id: 0, __v: 0 })
      .sort({ marketId: -1 })
      .limit(10)
      .skip(0);

    if (data.length === 0) {
      return res.status(404).json({
        error: "No direct trade found",
      });
    }
    return res.status(200).json(data);
  } catch (e) {
    log.info(`Client Error getting all direct markets logs: ${e}`);
    return res.status(400).json({ message: e.message });
  }
});

//get active direct markets
mallRouter.get("/direct/active", async (req, res) => {
  try {
    const data = await database.directDatabase
      .find({ isClosed: false }, { _id: 0, __v: 0 })
      .sort({ marketId: -1 })
      .limit(10)
      .skip(0);

    if (data.length === 0) {
      return res.status(404).json({
        error: "No active direct trade found",
      });
    }
    return res.status(200).json(data);
  } catch (e) {
    log.info(`Client Error getting active direct markets logs: ${e}`);
    return res.status(400).json({ message: e.message });
  }
});

module.exports = mallRouter;
