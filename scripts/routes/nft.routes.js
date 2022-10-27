const express = require("express");
const nftRouter = express.Router();
const multer = require("multer");
const Joi = require("joi");
const fs = require("fs");
const CIDTool = require("cid-tool");
const log = require("../../config/log4js");
const Web3 = require("web3");
require("dotenv").config();
const { RC3CAddr, RC3CABI } = require("../contracts/index");
const userDatabase = require("../models/user.model");
const collectionDatabase = require("../models/nft.model");
const mallDatabase = require("../models/mall.model");
let decimal = require("hexadecimal-to-decimal");
const request = require("request");

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.BSC_TEST));
const creators = new web3.eth.Contract(RC3CABI, RC3CAddr);

const postUploads = multer({ dest: "uploads/post_uploads" });
const uploadSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  nature: Joi.string().valid("PHYSICAL", "DIGITAL", "PHYGITAL").required(),
  category: Joi.string().required(),
  catalogueNo: Joi.string(),
  unlockableContentUrl: Joi.string(),
  unlockableContentDescription: Joi.string(),
});

//create new RC3_Creators token with ipfs
nftRouter.post(
  "/rc3Creators/create1",
  postUploads.single("media"),
  async (req, res) => {
    let output = { flag: false, message: "", data: {} };

    var { error, value } = uploadSchema.validate(req.body);
    if (error) {
      output.message = error.message;
      log.info(`Client Error creating re3Creators with ipfs logs: ${error}`);
      return res.status(400).json(output);
    }

    let path = req.file.path;

    let {
      name,
      description,
      nature,
      category,
      catalogueNo,
      unlockableContentUrl,
      unlockableContentDescription,
    } = req.body;

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
          name: name,
          description: description,
          image: `ipfs://${pinFile.path}`,
          catalogueNumber: catalogueNo,
          properties: {
            category: category,
            nature: nature,
            unlockable: unlockableContentUrl,
            description: unlockableContentDescription,
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
      output.data = {
        collectionId: decimal.decimal(newTokenId.toString()),
        image: `ipfs://${pinFile.path}`,
      };

      // fs.unlinkSync(path);
      return res.status(200).json(output);
    } catch (e) {
      fs.unlinkSync(path);
      output.message = e.message;
      log.info(`Client Error creating re3Creators with ipfs logs: ${e}`);
      return res.status(400).json(output);
    }
  }
);

nftRouter.post("/rc3Creators/create2", async (req, res) => {
  let output = { flag: false, message: "", data: {} };

  let {
    name,
    image,
    convertedInt,
    initialSupply,
    royalty,
    category,
    nature,
    unlockableContentUrl,
    unlockableContentDescription,
  } = req.body;

  const data = {
    address: RC3CAddr,
    name: name,
    supply: initialSupply,
    royalty: royalty,
    collectionId: convertedInt.toString(),
    image: image,
    typeOfNFT: "ERC1155",
    properties: {
      category: category,
      nature: nature,
      unlockable: unlockableContentUrl,
      description: unlockableContentDescription,
    },
  };

  try {
    const find = await collectionDatabase.findOne({
      address: RC3CAddr,
      collectionId: data.collectionId,
    });

    if (!find) {
      // update database
      const collection = new collectionDatabase({
        address: RC3CAddr,
        collectionId: convertedInt.toString(),
        name: name,
        supply: initialSupply,
        royalty: royalty,
        image: image,
        typeOfNFT: "ERC1155",
        properties: {
          category: category,
          nature: nature,
          unlockable: unlockableContentUrl,
          description: unlockableContentDescription,
        },
      });
      await collection.save();
    } else {
      await collectionDatabase.findOneAndUpdate(
        {
          address: RC3CAddr,
          collectionId: convertedInt.toString(),
        },
        {
          name: name,
          supply: initialSupply,
          royalty: royalty,
          image: image,
          typeOfNFT: "ERC1155",
          properties: {
            category: category,
            nature: nature,
            unlockable: unlockableContentUrl,
            description: unlockableContentDescription,
          },
        }
      );
    }
    output.flag = true;
    output.message = "NFT stored in database successfully";
    output.data = await collectionDatabase.findOne(
      {
        address: RC3CAddr,
        collectionId: data.collectionId,
      },
      { _id: 0, __v: 0 }
    );
    return res.status(200).json(output);
  } catch (e) {
    output.message = e.message;
    log.info(`Client Error storing re3Creators in database logs: ${e}`);
    return res.status(400).json(output);
  }
});

//get rc3Creators NFT
nftRouter.get("/rc3Creators", async (req, res) => {
  try {
    const data = await collectionDatabase.find({}, { _id: 0, __v: 0 });

    if (data.length === 0) {
      return res.status(404).json({
        error: "No collection found",
      });
    }
    return res.status(200).json(data);
  } catch (e) {
    log.info(`Client Error getting NFT: ${e}`);
    res.status(400).json({ message: e.message });
  }
});

nftRouter.get("/rc3Creators/image/:collectionId", async (req, res) => {
  const collectionId = req.params.collectionId;

  if (!collectionId) {
    return res.status(400).json({
      error: "Missing required property from client",
    });
  }

  try {
    const data = await collectionDatabase.findOne(
      {
        collectionId: collectionId.toString(),
        address: RC3CAddr,
      },
      { _id: 0, __v: 0 }
    );

    if (!data) {
      return res.status(404).json({
        error: "Collection id not found",
      });
    }

    const url = data["image"];

    if (url === "") {
      return res.status(404).json({
        error: "Collection image not found",
      });
    }

    request(
      {
        url: url,
        encoding: null,
      },
      (err, resp, buffer) => {
        if (!err && resp.statusCode === 200) {
          res.set("Content-Type", "image/jpeg");
          res.send(resp.body);
        }
      }
    );
  } catch (e) {
    log.info(`Client Error getting NFT: ${e}`);
    res.status(400).json({ message: error.message });
  }
});

//get rc3Creators NFT by collection id
nftRouter.get("/rc3Creators/collection/:collectionId", async (req, res) => {
  const collectionId = req.params.collectionId;

  if (!collectionId) {
    return res.status(400).json({
      error: "Missing required property from client",
    });
  }
  try {
    const data = await collectionDatabase.findOne(
      {
        $and: [
          { collectionId: { $eq: collectionId.toString() } },
          { address: { $eq: RC3CAddr } },
        ],
      },
      { _id: 0, __v: 0 }
    );

    if (!data) {
      return res.status(404).json({
        error: "Collection id not found",
      });
    }

    return res.status(200).json(data);
  } catch (e) {
    log.info(`Client Error getting NFT: ${e}`);
    res.status(400).json({ message: error.message });
  }
});

//get all creators based on number of created tokens
nftRouter.get("/rc3Creators/creators", async (req, res) => {
  let output = { flag: false, message: "", data: {} };
  try {
    const query = { numberOfTokensCreated: { $gte: 1 } };
    const sort = { numberOfTokensCreated: -1 }; // sort in descending (-1) order by numberOfTokensCreated

    const data = await userDatabase
      .find(query, { _id: 0, __v: 0 })
      .sort(sort)
      .limit(10)
      .skip(0);

    output.flag = true;
    output.message = "Creators fetched successfully";
    output.data = data;
    return res.status(200).json(output);
  } catch (e) {
    log.info(`Client Error fetching creator's list: ${e}`);
    output.message = "Failed to fetch creator's list!";
    return res.status(400).json(output);
  }
});

//get RC3 by categories
nftRouter.get("/rc3Creators/categories/:category", async (req, res) => {
  try {
    const query = {
      address: RC3CAddr,
      category: req.params.category,
    };
    const sort = { numberOfTimesTraded: -1, timeLastTraded: -1 };

    const data = await collectionDatabase
      .find(query, { _id: 0, __v: 0 })
      .sort(sort)
      .limit(10)
      .skip(0);

    if (data.length === 0) {
      return res.status(404).json({
        error: "Category not found",
      });
    }
    return res.status(200).json(data);
  } catch (e) {
    log.info(`Client Error getting re3Creators by categories: ${e}`);
    return res.status(400).json({ message: e.message });
  }
});

//get RC3 by natures
nftRouter.get("/rc3Creators/natures/:nature", async (req, res) => {
  try {
    const query = {
      address: RC3CAddr,
      nature: req.params.nature,
    };
    const sort = { numberOfTimesTraded: -1, timeLastTraded: -1 };

    const data = await collectionDatabase
      .find(query, { _id: 0, __v: 0 })
      .sort(sort)
      .limit(10)
      .skip(0);

    if (data.length === 0) {
      return res.status(404).json({
        error: "Nature not found",
      });
    }
    return res.status(200).json(data);
  } catch (e) {
    log.info(`Client Error getting re3Creators by natures: ${e}`);
    return res.status(400).json({ message: e.message });
  }
});

//get hot Nifties
nftRouter.get("/hotNFTs", async (req, res) => {
  try {
    const query = {};
    const sort = { numberOfTimesTraded: -1, timeLastTraded: -1 };
    const data = await collectionDatabase
      .find(query, { _id: 0, __v: 0 })
      .sort(sort)
      .limit(10)
      .skip(0);
    return res.status(200).json(data);
  } catch (e) {
    log.info(`Client Error getting hot nifties: ${e}`);
    return res.status(400).json({ message: e.message });
  }
});

//like and unlike collection
nftRouter.post("/likeAction", async (req, res) => {
  const data = req.body;
  if (!data.address || !data.collectionId || !data.userAddress) {
    return res.status(400).json({
      error: "Missing required property from client",
    });
  }
  try {
    const find = await collectionDatabase.find({
      address: data.address,
      collectionId: data.collectionId,
    });

    if (find.length === 1) {
      let isLiking = false;

      for (let i = 0; i < find[0]["peopleLiking"].length; i++) {
        if (find[0]["peopleLiking"][i] === data.userAddress) {
          isLiking = true;
        }
      }

      if (!isLiking) {
        await userDatabase.findOneAndUpdate(
          {
            address: data.userAddress,
          },
          {
            $inc: { numberOfLikes: 1 },
            $push: { likedCollections: data.collectionId },
          }
        );

        await collectionDatabase.findOneAndUpdate(
          {
            address: data.address,
            collectionId: data.collectionId,
          },
          {
            $inc: { numberOfLikes: 1 },
            $push: { peopleLiking: data.userAddress },
          }
        );
        return res
          .status(200)
          .json({ success: "Successfully liked collection" });
      } else {
        await userDatabase.findOneAndUpdate(
          {
            address: data.userAddress,
          },
          {
            $inc: { numberOfLikes: -1 },
            $pull: {
              likedCollections: data.collectionId,
            },
          }
        );

        await collectionDatabase.findOneAndUpdate(
          {
            address: data.address,
            collectionId: data.collectionId,
          },
          {
            $inc: { numberOfLikes: -1 },
            $pull: {
              peopleLiking: data.userAddress,
            },
          }
        );

        return res
          .status(200)
          .json({ success: "Successfully unliked collection" });
      }
    } else {
      return res.status(400).json({
        error: "Invalid address property from client",
      });
    }
  } catch (e) {
    log.info(`Client Error updating collection likes logs: ${e}`);
    return res.status(400).json({ message: e.message });
  }
});

//can create PHYSICAL and PHYGITAL
nftRouter.get("/rc3Creators/create1/:userAddress", async (req, res) => {
  const userAddress = req.params.userAddress;
  try {
    let data = { flag: false, message: "Not Authorized" };
    data.flag = await creators.methods.canCreatePhysical(userAddress).call();

    if (data.flag) {
      data.message = "Authorized";
    }

    return res.status(200).json(data);
  } catch (e) {
    log.info(`Client Error getting physical and phygital create access: ${e}`);
    return res.status(400).json({ message: e.message });
  }
});

//can mint nft
nftRouter.get(
  "/rc3Creators/mint/:userAddress/:collectionId",
  async (req, res) => {
    const userAddress = req.params.userAddress;
    const collectionId = req.params.collectionId;
    try {
      let data = { flag: false, message: "Not Authorized" };
      data.flag = await creators.methods
        .canMint(collectionId, userAddress)
        .call();

      if (data.flag) {
        data.message = "Authorized";
      }

      return res.status(200).json(data);
    } catch (e) {
      log.info(`Client Error getting mint access: ${e}`);
      return res.status(400).json({ message: e.message });
    }
  }
);

// get rc3Creators NFT by RCDY and ETH asset price
nftRouter.get("/rc3Creators/collection/price/:asset", async (req, res) => {
  const asset = req.params.asset;
  try {
    let arr;
    const directRCDYData = await mallDatabase.directDatabase
      .find({ tradeToken: asset, isClosed: false }, { _id: 0, __v: 0 })
      .sort({ floorPrice: 1 });

    if (asset === "ETH") {
      arr = directRCDYData;
    } else if (asset === "RCDY") {
      const auctionRCDYData = await mallDatabase.auctionDatabase
        .find({ isClosed: false }, { _id: 0, __v: 0 })
        .sort({ floorPrice: 1 });
      arr = directRCDYData.concat(auctionRCDYData);
    } else {
      return res.status(400).json({
        error: "Missing required property from client",
      });
    }

    arr.sort((a, b) => {
      return b["floorPrice"] - a["floorPrice"];
    });

    if (arr.length === 0) {
      return res.status(404).json({
        error: "Nothing in this list",
      });
    }
    return res.status(200).json(arr);
  } catch (e) {
    log.info(`Client Error getting NFT: ${e}`);
    res.status(400).json({ message: e.message });
  }
});

module.exports = nftRouter;
