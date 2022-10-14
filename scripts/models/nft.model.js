const mongoose = require("mongoose");

const rc3CreatorsNFTchema = new mongoose.Schema({
  address: {
    //NFT address
    type: String,
    required: true,
  },
  collectionId: {
    //collection id
    type: String,
    required: true,
  },
  name: {
    // collection name
    type: String,
  },
  image: {
    // collection image
    type: String,
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
  supply: {
    //supply of nft
    type: Number,
    required: true,
  },
  numberOfTimesTraded: {
    //how many completed instant trades and auctions
    type: Number,
    default: 0,
  },
  royalty: {
    //1% = 100 units
    type: Number,
    default: 0,
  },
  timeLastTraded: {
    //the time when this NFT token id last traded
    type: Date,
    default: new Date(0),
  },
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
  numberOfLikes: {
    //no of likes
    type: Number,
    default: 0,
  },
  peopleLiking: {
    // array of users who like collection
    type: [String],
  },
});

module.exports = mongoose.model("Collection", rc3CreatorsNFTchema);
