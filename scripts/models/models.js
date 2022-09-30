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

const nftCollectionSchema = new mongoose.Schema({
  address: {
    //NFT address
    type: String,
    required: true,
  },
  collectionId: {
    //collection id
    type: Number,
  },
  name: {
    // collection name
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
    default: 0,
    required: true,
  },
  timeLastTraded: {
    //the time when this NFT token id last traded
    type: Number,
    required: true,
  },
  properties: {
    category: {
      //art, fashion, music, etc
      type: String,
    },
    nature: {
      //physical, digital, phygital
      type: String,
    },
    unlockableContentUrl: {
      // URL link to unlockable
      type: String,
    },
    unlockableContentDescription: {
      // describes the unlockable content
      type: String,
    },
  },
});

const nftSchema = new mongoose.Schema({
  address: {
    // nft address
    type: String,
  },
  name: {
    // token name
    type: String,
  },
  symbol: {
    // token sumbol
    type: String,
  },
  uri: {
    // token uri
    type: String,
  },
});

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

module.exports = {
  auction: mongoose.model("Aunction", auctionTradeSchema),
  directTrade: mongoose.model("DirectTrade", directTradeSchema),
  collection: mongoose.model("Collection", nftCollectionSchema),
  nft: mongoose.model("Nft", nftSchema),
  user: mongoose.model("User", userSchema),
};
