const log = require("../../config/log4js");
const userDatabase = require("../models/user.model");
const collectionDatabase = require("../models/nft.model");
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.BSC_TEST));
const { RC3CAddr, RC3CABI } = require("../contracts");

class CreatorsEventSync {
  constructor(currentBlock, lastBlockChecked) {
    this.creators = new web3.eth.Contract(RC3CABI, RC3CAddr);
    this.currentBlock = currentBlock;
    this.lastBlockChecked = lastBlockChecked;
    this.origin = "0x0000000000000000000000000000000000000000";
  }

  async sync() {
    try {
      //create new rc3 creators
      let data_events = await this.creators.getPastEvents("NewToken", {
        fromBlock: this.lastBlockChecked,
        toBlock: this.currentBlock,
      });
      if (data_events.length > 0) {
        await this.updateNewTokenCreatedDB(data_events);
      }

      // new rc3 creators mint
      data_events = await this.creators.getPastEvents("TransferSingle", {
        fromBlock: this.lastBlockChecked,
        toBlock: this.currentBlock,
      });
      if (data_events.length > 0) {
        await this.updateNewMintSingleDB(data_events);
      }

      // new rc3 creators batch mint
      data_events = await this.creators.getPastEvents("TransferBatch", {
        fromBlock: this.lastBlockChecked,
        toBlock: this.currentBlock,
      });
      if (data_events.length > 0) {
        await this.updateNewMintMultipleDB(data_events);
      }
    } catch (e) {
      log.info(`Error Inserting action logs: ${e}`);
      console.log(`Error Inserting creator logs: ${e}`);
    }
  }

  async updateNewTokenCreatedDB(data_events) {
    for (const event of data_events) {
      const { returnValues, transactionHash } = event;
      const { creator, initialSupply, maxSupply, id } = returnValues;

      let data = await collectionDatabase.findOne({
        collectionId: id.toString(),
        address: RC3CAddr,
      });

      if (!data) {
        const info = await this.creators.methods.getInfo(id).call();
        const categ = await this.creators.methods.categories().call();
        const natur = await this.creators.methods.natures().call();
        let cat, nat;

        // biuld category
        if (categ[0] == info[2]) {
          cat = "ART";
        } else if (categ[1] == info[2]) {
          cat = "MUSIC";
        } else if (categ[2] == info[2]) {
          cat = "FASHION";
        }

        //build nature
        if (natur[0] == info[1]) {
          nat = "PHYSICAL";
        } else if (natur[1] == info[1]) {
          nat = "DIGITAL";
        } else {
          nat = "PHYGITAL";
        }

        data = new collectionDatabase({
          collectionId: id.toString(),
          address: RC3CAddr,
          typeOfNFT: "ERC1155",
          supply: initialSupply,
          category: cat,
          nature: nat,
        });
        await data.save();
        console.log("New collection saved:", data);
      }

      const user = await userDatabase.findOne({ address: creator });
      if (user) {
        await userDatabase.findOneAndUpdate(
          { address: creator },
          {
            numberOfTokensCreated: user["numberOfTokensCreated"] + 1,
            $push: { rc3CollectionIdsCreated: id.toString() },
          }
        );
      } else {
        const newUser = new userDatabase({
          address: creator,
          numberOfTokensCreated: 1,
          rc3CollectionIdsCreated: [id.toString()],
        });
        await newUser.save();
        console.log("New user saved:", creator);
      }

      console.log(
        `Found NewToken event: creator=${creator}, initialSupply=${initialSupply}, maxSupply=${maxSupply}, id=${id}, txHash=${transactionHash}`
      );
    }
  }

  async updateNewMintSingleDB(data_events) {
    for (const event of data_events) {
      const { returnValues, transactionHash } = event;
      const { operator, from, to, id, value } = returnValues;

      if (from === this.origin) {
        let data = await collectionDatabase.findOne({
          collectionId: id.toString(),
          address: RC3CAddr,
        });

        await collectionDatabase.findByIdAndUpdate(
          {
            collectionId: id.toString(),
            address: RC3CAddr,
          },
          {
            supply: data["supply"] + value,
          }
        );
      }

      console.log(
        `Found NewSingleMint event: creator=${operator}, to=${to}, id=${id}, txHash=${transactionHash}`
      );
    }
  }

  async updateNewMintMultipleDB(data_events) {
    for (const event of data_events) {
      const { returnValues, transactionHash } = event;
      const { operator, from, to, ids, values } = returnValues;

      if (from === this.origin) {
        for (let i = 0; i < ids.length; i++) {
          let data = await collectionDatabase.findOne({
            collectionId: ids[i].toString(),
            address: RC3CAddr,
          });

          await collectionDatabase.findByIdAndUpdate(
            {
              collectionId: ids[i].toString(),
              address: RC3CAddr,
            },
            {
              supply: data["supply"] + values[i],
            }
          );
        }
      }

      console.log(
        `Found NewMultipleMint event: creator=${operator}, to=${to}, id=${ids}, txHash=${transactionHash}`
      );
    }
  }
}

module.exports = CreatorsEventSync;
