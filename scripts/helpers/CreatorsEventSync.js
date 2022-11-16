const log = require("../../config/log4js");
const userDatabase = require("../models/user.model");
const collectionDatabase = require("../models/nft.model");
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.MUMBAI_URL));
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

      // new rc3 creators minter role set
      data_events = await this.creators.getPastEvents("MinterSet", {
        fromBlock: this.lastBlockChecked,
        toBlock: this.currentBlock,
      });
      if (data_events.length > 0) {
        await this.updateNewMinterRoleDB(data_events);
      }

      // new rc3 royalty updated
      data_events = await this.creators.getPastEvents("RoyaltyInfoUpdated", {
        fromBlock: this.lastBlockChecked,
        toBlock: this.currentBlock,
      });
      if (data_events.length > 0) {
        await this.updateRoyaltyDB(data_events);
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

      let data = await collectionDatabase.findOne(
        {
          address: RC3CAddr,
          collectionId: id.toString(),
        },
        { _id: 0, __v: 0 }
      );

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
          address: RC3CAddr,
          collectionId: id.toString(),
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
            $push: {
              rc3CollectionIdsCreated: id.toString(),
              mintableCollectionIds: id.toString(),
            },
          }
        );
      } else {
        const newUser = new userDatabase({
          address: creator,
          numberOfTokensCreated: 1,
          rc3CollectionIdsCreated: [id.toString()],
          mintableCollectionIds: [id.toString()],
        });
        await newUser.save();
        console.log("New user saved:", creator);
      }

      console.log(
        `Found NewToken event: creator=${creator}, initialSupply=${initialSupply}, 
        maxSupply=${maxSupply}, id=${id}, txHash=${transactionHash}`
      );
    }
  }

  async updateNewMintSingleDB(data_events) {
    for (const event of data_events) {
      const { returnValues, transactionHash } = event;
      const { operator, from, to, id, value } = returnValues;

      if (from === this.origin) {
        let data = await collectionDatabase.findOne({
          address: RC3CAddr,
          collectionId: id.toString(),
        });

        await collectionDatabase.findByIdAndUpdate(
          { address: RC3CAddr, collectionId: id.toString() },
          {
            supply: data["supply"] + value,
          }
        );
      }

      console.log(
        `Found NewSingleMint event: creator=${operator}, \n
        to=${to}, id=${id}, txHash=${transactionHash}`
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
            address: RC3CAddr,
            collectionId: ids[i].toString(),
          });

          await collectionDatabase.findByIdAndUpdate(
            { address: RC3CAddr, collectionId: ids[i].toString() },
            {
              supply: data["supply"] + values[i],
            }
          );
        }
      }

      console.log(
        `Found NewMultipleMint event: creator=${operator},\n 
        to=${to}, id=${ids}, txHash=${transactionHash}`
      );
    }
  }

  async updateNewMinterRoleDB(data_events) {
    for (const event of data_events) {
      const { returnValues, transactionHash } = event;
      const { caller, id, minter, canMint } = returnValues;

      let data = await collectionDatabase.findOne({
        address: RC3CAddr,
        collectionId: id.toString(),
      });
      if (data) {
        if (canMint) {
          await userDatabase.findByIdAndUpdate(
            {
              address: minter,
            },
            {
              $push: { mintableCollectionIds: id.toString() },
            },
            { upsert: true }
          );
        } else {
          await userDatabase.findByIdAndUpdate(
            {
              address: minter,
            },
            {
              $pull: { mintableCollectionIds: id.toString() },
            }
          );
        }
      }
      console.log(
        `Found MinterSet event: caller=${caller}, id=${id},\n 
        minter=${minter}, canMint=${canMint}, txHash=${transactionHash}`
      );
    }
  }

  async updateRoyaltyDB(data_events) {
    for (const event of data_events) {
      const { returnValues, transactionHash } = event;
      const { oldCreator, newCreator, id, royalty, recipient, shares } =
        returnValues;

      let data = await collectionDatabase.findOne({
        address: RC3CAddr,
        collectionId: id.toString(),
      });
      if (data && oldCreator !== newCreator) {
        await userDatabase.findByIdAndUpdate(
          {
            address: newCreator,
          },
          {
            $push: { mintableCollectionIds: id.toString() },
          },
          { upsert: true }
        );

        await userDatabase.findByIdAndUpdate(
          {
            address: oldCreator,
          },
          {
            $pull: { mintableCollectionIds: id.toString() },
          }
        );
      }
      console.log(
        `Found RoyaltyInfoUpdated event: oldCreator=${oldCreator},\n
        newCreator=${newCreator}, id=${id}, royalty=${royalty},\n
        recipients=${recipients}, shares=${shares}, txHash=${transactionHash}`
      );
    }
  }
}

module.exports = CreatorsEventSync;
