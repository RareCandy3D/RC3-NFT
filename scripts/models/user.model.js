const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  address: {
    // address of a user
    type: String,
    required: true,
  },
  username: {
    // user name
    type: String,
  },
  bio: {
    // user bio
    type: String,
  },
  image: {
    //user image link
    type: Number,
  },
  numberOwned: {
    //no of tokens owned
    type: Number,
  },
  numberOfFollowing: {
    //no of people user is following
    type: String,
  },
  numberOfFollowers: {
    //no of people following user
    type: Number,
  },
  numberOfLikes: {
    //no of likes
    type: Number,
  },
  likedTokens: {
    // array of liked tokens
    type: [Object], //token address and id
  },
  numberOfTokensCreated: {
    // no of creations by this user
    type: Number,
  },
  rc3CollectionIdsCreated: {
    // array of rc3 collection ids created
    type: [Number],
  },
  numberOfSells: {
    // no of times this user sold from auction and instant trades
    type: Number,
  },
  numberOfItemsBuys: {
    // no of times this user bought from auction and instant trades
    type: Number,
  },
  amountSpent: {
    // amount spent by this user on purchases from auctions and instant trades
    type: Number,
  },
  amountReceived: {
    // amount received by this user on sells from auctions and instant trades
    type: Number,
  },
  auctionIdsCreated: {
    // array of auction ids created
    type: [Number],
  },
  auctionIdsBought: {
    // array of auction ids bought
    type: [Number],
  },
  auctionIdsBidded: {
    // array of auction ids bidded
    type: [Number],
  },
  directIdsCreated: {
    // array of direct trade ids created
    type: [Number],
  },
  directIdsBought: {
    // array of direct trade ids bought
    type: [Number],
  },
});

module.exports = mongoose.model("User", userSchema);
