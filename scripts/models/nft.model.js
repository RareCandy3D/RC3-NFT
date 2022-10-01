const mongoose = require("mongoose");

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

module.exports = {
  collection: mongoose.model("Collection", nftCollectionSchema),
  nft: mongoose.model("Nft", nftSchema),
};
