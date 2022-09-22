const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  address: {
    // address of a user
    type: String,
    required: true,
  },
  numberOfTokensCreated: {
    // no of creations by this user
    type: Number,
    required: true,
  },
  numberOfSells: {
    // no of times this user sold from auction and instant trades
    type: Number,
    required: true,
  },
  numberOfItemsBuys: {
    // no of times this user bought from auction and instant trades
    type: Number,
    required: true,
  },
  amountSpent: {
    // amount spent by this user on purchases from auctions and instant trades
    type: Number,
    required: true,
  },
  amountReceived: {
    // amount received by this user on sells from auctions and instant trades
    type: Number,
    required: true,
  },
});

const nftSchema = new mongoose.Schema({
  address: {
    //NFT address
    type: String,
    required: true,
  },
  floorPrice: {
    //minimum amount sold for
    type: Number,
  },
  typeOfNFT: {
    //whether ERC1155 or ERC721
    type: String,
    required: true,
  },
  numberOfTimesTraded: {
    //how many completed instant trades and auctions
    type: Number,
    required: true,
  },

  timeLastTraded: {
    //the time when this NFT token id last traded
    type: Number,
    required: true,
  },
});

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
    required: true,
    default: "0x0000000000000000000000000000000000000000",
  },

  soldFor: {
    // price in which it was sold
    type: Number,
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
    required: true,
    default: "0x0000000000000000000000000000000000000000",
  },

  soldFor: {
    // price in which it was sold
    type: Number,
    required: true,
  },

  tradeToken: {
    // the asset used to conduct this sale. RCDY or ETH
    type: String,
    required: true,
  },
});

module.exports = {
  auction: mongoose.model("Aunction", auctionTradeSchema),
  directTrade: mongoose.model("DirectTrade", directTradeSchema),
  nft: mongoose.model("Nft", nftSchema),
  user: mongoose.model("User", userSchema),
};
