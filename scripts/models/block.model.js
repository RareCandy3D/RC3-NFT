const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema({
  blockId: {
    //22825845
    // if set or not
    type: Number,
    required: true,
  },
  lastBlock: {
    // last synced block on etherum mainnet
    type: Number,
  },
});

module.exports = mongoose.model("Block", blockSchema);
