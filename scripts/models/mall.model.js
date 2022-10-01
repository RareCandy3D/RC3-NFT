const mongoose = require("mongoose");

const auctionTradeSchema = new mongoose.Schema({
  auctionId: {
    // ID of auction in the Smart contract
    type: Number,
    required: true,
  },

  nftId: {
    // ID of the NFT
    type: Number,
    required: true,
  },

  nftAddress: {
    //address of the nft
    type: String,
    required: true,
  },

  seller: {
    //address of the seller
    type: String,
    required: true,
  },

  buyer: {
    //address of the buyer
    type: String,
  },

  floorPrice: {
    // price in which it was sold
    type: Number,
    required: true,
  },

  soldFor: {
    // price in which it was sold
    type: Number,
  },

  startTime: {
    // time for start
    type: Number,
    required: true,
  },

  endTime: {
    // time for end
    type: Number,
    required: true,
  },

  isClosed: {
    //if still open
    type: Boolean,
    default: false,
    required: true,
  },
});

const directTradeSchema = new mongoose.Schema({
  marketId: {
    // ID of instant market trade in the Smart contract
    type: Number,
    required: true,
  },

  nftId: {
    // ID of the NFT
    type: Number,
    required: true,
  },

  nftAddress: {
    //address of the nft
    type: String,
    required: true,
  },

  seller: {
    //address of the seller
    type: String,
    required: true,
  },

  buyer: {
    //address of the buyer
    type: String,
  },

  floorPrice: {
    // floor price
    type: Number,
  },

  soldFor: {
    // price in which it was sold
    type: Number,
  },

  tradeToken: {
    // the asset used to conduct this sale. RCDY or ETH
    type: String,
  },
  isClosed: {
    //if still open
    type: Boolean,
    default: false,
    required: true,
  },
});

module.exports = {
  auction: mongoose.model("AuctionTrade", auctionTradeSchema),
  direct: mongoose.model("DirectTrade", directTradeSchema),
};
