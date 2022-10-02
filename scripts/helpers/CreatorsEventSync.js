const log = require("../../config/log4js");
const UserModel = require("../models/user.model");
const { CollectionModel, NftModel } = require("../models/nft.model");

class CreatorsEventSync {
  constructor(web3, mall, currentBlock, lastBlockChecked) {
    this.web3 = web3;
    this.mall = mall;
    this.currentBlock = currentBlock;
    this.lastBlockChecked = lastBlockChecked;
  }
  async sync() {
    try {
      //create new rc3 creators
      const new_token_events = await this.mall.getPastEvents("NewToken", {
        fromBlock: this.lastBlockChecked,
        toBlock: this.currentBlock,
      });
      await updateNewTokenCreatedDB(new_token_events);
    } catch (e) {
      log.info(`Error Inserting action logs: ${e}`);
      console.log(`Error Inserting market logs: ${e}`);
    }
  }

  async updateNewTokenCreatedDB(data_events) {
    for (i = 0; i < data_events.length; i++) {
      let creator = data_events[i]["returnValues"]["creator"];
      let id = data_events[i]["returnValues"]["id"];

      try {
        const data = new CollectionModel({
          id: id,
          address: creator,
          typeOfNFT: "ERC1155",
        });
        await data.save();

        const user = await UserModel.find({ address: creator });

        await UserModel.updateOne(
          { address: creator },
          {
            numberOfTokensCreated: user.numberOfTokensCreated++,
            $push: { rc3CollectionIdsCreated: id },
          }
        );
      } catch (e) {
        log.info(`Error Inserting creator logs: ${e}`);
        console.log(`Error Inserting creator logs: ${e}`);
      }
    }
  }
}

module.exports = CreatorsEventSync;
