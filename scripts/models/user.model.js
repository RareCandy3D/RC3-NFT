const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  address: {
    // address of a user
    type: String,
    // required: true,
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
    type: String,
  },
  numberOfItemsBuys: {
    // no of times this user bought by auction and instant trades
    type: Number,
    default: 0,
  },
  numberOfSells: {
    // no of times this user sold from auction and instant trades
    type: Number,
    default: 0,
  },
  rcdySpent: {
    // amount of rcdy spent by this user on purchases from auctions and instant trades
    type: Number,
    default: 0,
  },
  rcdyReceived: {
    // amount of rcdy received by this user on sells from auctions and instant trades
    type: Number,
    default: 0,
  },
  ethSpent: {
    // amount of eth spent by this user on purchases from instant trades
    type: Number,
    default: 0,
  },
  ethReceived: {
    // amount of eth received by this user on sells from instant trades
    type: Number,
    default: 0,
  },
  numberOfTokensCreated: {
    // no of creations by this user
    type: Number,
    default: 0,
  },
  numberOfLikes: {
    //no of likes
    type: Number,
    default: 0,
  },
  numberOfFollowing: {
    //no of people user is following
    type: Number,
    default: 0,
  },
  numberOfFollowers: {
    //no of people following user
    type: Number,
    default: 0,
  },
  peopleFollowing: {
    // array of people who follow user
    type: [String],
  },
  mintableCollectionIds: {
    // array of collections that can be minted by user
    type: [String],
  },
  likedCollections: {
    // array of collections user likes
    type: [String],
  },
  userFollowing: {
    // array of people who user follows
    type: [String],
  },
  rc3CollectionIdsCreated: {
    // array of rc3 collection ids created
    type: [String],
  },
  auctionsClosed: {
    // array of auctions closed by user
    type: [Number],
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
  marketIdsCreated: {
    // array of direct trade ids created
    type: [Number],
  },
  marketIdsBought: {
    // array of direct trade ids bought
    type: [Number],
  },
  balances: [
    //array carrying balances of user in different collections
    {
      collectionId: String,
      address: String,
      balance: Number,
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
