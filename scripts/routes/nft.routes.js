const express = require("express");
const nftRouter = express.Router();
const multer = require("multer");
const Joi = require("joi");
const fs = require("fs");
const CIDTool = require("cid-tool");
const log = require("../../config/log4js");
const Web3 = require("web3");
const _1155ABI = require("../../artifacts/contracts/RC3_1155.sol/RC3_1155.json");
const _721ABI = require("../../artifacts/contracts/RC3_721.sol/RC3_721.json");
const addresses = require("../../addresses/index.js");
require("dotenv").config();

const UserModel = require("../models/user.model");
const { CollectionModel, NftModel } = require("../models/nft.model");

const web3 = new Web3(
  new Web3.providers.WebsocketProvider(process.env.BSC_TEST)
);

const postUploads = multer({ dest: "uploads/post_uploads" });
const uploadSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  nature: Joi.string().valid("PHYSICAL", "DIGITAL", "PHYGITAL").required(),
  category: Joi.string().required(),
});

//create new RC3_Creators token with ipfs
nftRouter.post(
  "/rc3Creators/create",
  postUploads.single("media"),
  async (req, res) => {
    let output = { flag: false, message: "", data: {} };

    var { error, value } = uploadSchema.validate(req.body);
    if (error) {
      output.message = error.message;
      return res.status(400).json(output);
    }

    let { path, filename } = req.file;
    let { name, description, nature, category } = req.body;

    //pin image
    const readableStreamForFile = fs.createReadStream(path);

    const { create } = await import("ipfs-http-client");

    const client = create({
      host: "ipfs.infura.io",
      port: 5001,
      protocol: "https",
      headers: {
        authorization:
          "Basic " +
          Buffer.from(
            process.env.IPFS_ID + ":" + process.env.IPFS_SECRET
          ).toString("base64"),
      },
    });

    try {
      let pinFile = await client.add(readableStreamForFile, {
        cidVersion: 0,
      });

      //build json
      let pinJson = await client.add(
        JSON.stringify({
          name,
          description,
          image: `ipfs://${pinFile.path}`,
          "catalogue number": "",
          properties: {
            category,
            nature,
            "unlockable content": "URL link to unlockable",
            "unlockable content details":
              "string explaining what the unlockable content grants you access to",
          },
        }),
        {
          cidVersion: 1,
          hashAlg: "blake2b-208",
        }
      );

      var tokenId = CIDTool.format(pinJson.path, { base: "base16" }).split("");
      tokenId.splice(0, 2, "0", "x", "0");
      let newTokenId = tokenId.join("");

      output.flag = true;
      output.message = "NFT asset uploaded successfully";
      output.data = newTokenId;

      fs.unlinkSync(path);
      return res.status(200).json(output);
    } catch (error) {
      fs.unlinkSync(path);
      output.message = error.message;
      return res.status(400).json(output);
    }
  }
);

//get NFT
nftRouter.get("/nft", async (req, res) => {
  const address = req.params.address;
  const tokenId = req.params.tokenId;

  if (!address || !tokenId) {
    return res.status(400).json({
      error: "Missing required property from client",
    });
  }
  try {
    let nft = {
      name: "",
      description: "",
      image: "",
      properties: {
        category: "",
        nature: "",
        unlockableContentUrl: "",
        unlockableContentDescription: "",
      },
    };
    let uri;

    let tokenMulti = new web3.eth.Contract(_1155ABI.abi, address);

    if (tokenMulti) {
      let uri = await tokenMulti.methods.uri(tokenId).call();
      nft = {
        name: uri.name,
        description: uri.description,
        image: uri.image,
        properties: uri.properties,
      };
    } else {
      let tokenSingle = new web3.eth.Contract(_721ABI.abi, address);
      uri = await tokenSingle.methods.tokenURI(tokenId).call();

      if (uri) {
        nft = {
          name: uri.name,
          description: uri.description,
          image: uri.image,
          properties: uri.properties,
        };
      } else {
        return res.status(400).json({
          error: "NFT not found",
        });
      }
    }
    return res.status(200).json(nft);
  } catch (e) {
    res.status(400).json({ message: error.message });
  }
});

//get all creators based on number of created tokens
nftRouter.get("/rc3Creators/creators", async (req, res) => {
  let output = { flag: false, message: "", data: {} };
  try {
    const query = {};
    const sort = { numberOfTokensCreated: -1 }; // sort in descending (-1) order by numberOfTokensCreated

    const data = await UserModel.find(query).sort(sort).limit(10).skip(0);

    output.flag = true;
    output.message = "Creators fetched successfully";
    output.data = data;
    return res.status(200).json(output);
  } catch (e) {
    log.info(`Error fetching creator's list: ${e}`);
    console.log(`Error fetching creator's list: ${e}`);
    output.message = "Failed to fetch creator's list!";
    return res.status(400).json(output);
  }
});

//get all RC3_Creators collections
nftRouter.get("/rc3Creators/collections", async (req, res) => {
  try {
    const query = {
      address: addresses.kovan.creators,
    };
    const sort = { numberOfTimesTraded: -1, timeLastTraded: -1 }; // sort in descending (-1) order by numberOfTokensCreated

    const data = await CollectionModel.find(query).sort(sort).limit(10).skip(0);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(400).json({ message: error.message });
  }
});

//get all RC3_Originals
nftRouter.get("/rc3Originals/collections", async (req, res) => {
  try {
    const query = {
      address: addresses.kovan.originals,
    };
    const sort = { numberOfTimesTraded: -1, timeLastTraded: -1 };

    const data = await CollectionModel.find(query).sort(sort).limit(10).skip(0);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(400).json({ message: error.message });
  }
});

//get RC3 by categories
nftRouter.get("/rc3Creators/categories", async (req, res) => {
  try {
    const query = {
      address: addresses.kovan.creators,
      properties: {
        category: req.params.category,
      },
    };
    const sort = { numberOfTimesTraded: -1, timeLastTraded: -1 };

    const data = await CollectionModel.find(query).sort(sort).limit(10).skip(0);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(400).json({ message: error.message });
  }
});

//get RC3 by natures
nftRouter.get("/rc3Creators/natures", async (req, res) => {
  try {
    const query = {
      address: addresses.kovan.creators,
      properties: {
        nature: req.params.nature,
      },
    };
    const sort = { numberOfTimesTraded: -1, timeLastTraded: -1 };

    const data = await CollectionModel.find(query).sort(sort).limit(10).skip(0);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(400).json({ message: error.message });
  }
});

//get hot Nifties
nftRouter.get("/hotNFTs", async (req, res) => {
  try {
    const query = {};
    const sort = { timeLastTraded: -1 };
    const data = await CollectionModel.find(query).sort(sort).limit(10).skip(0);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = nftRouter;
