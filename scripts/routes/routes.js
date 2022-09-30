const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Web3 = require("web3");
const _1155ABI = require("../../artifacts/contracts/RC3_1155.sol/RC3_1155.json");
const _721ABI = require("../../artifacts/contracts/RC3_721.sol/RC3_721.json");
const mallABI = require("../../addresses/mall_abi/RC3_Mall_Implementation.json");
const addresses = require("../../addresses/index.js");

const {
  AuctionModel,
  DirectModel,
  CollectionModel,
  NftModel,
  UserModel,
} = require("../models/models");

const web3 = new Web3(
  new Web3.providers.WebsocketProvider(process.env.INFURA_URL)
);

//get NFT

router.get("/nft", async (req, res) => {
  const address = req.params.address;
  const tokenId = Number(req.params.tokenId);

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

    let tokenMulti = new web3.eth.Contract(_1155ABI.abi, address);

    if (tokenMulti) {
      let uriMulti = await tokenMulti.methods.uri(tokenId).call();
      nft = {
        name: uriMulti.name,
        description: uriMulti.description,
        image: uriMulti.image,
        properties: uriMulti.properties,
      };
    } else {
      let tokenSingle = new web3.eth.Contract(_721ABI.abi, address);
      let uriSingle = await tokenSingle.methods.tokenURI(tokenId).call();

      if (uriSingle) {
        nft = {
          name: uriSingle.name,
          description: uriSingle.description,
          image: uriSingle.image,
          properties: uriSingle.properties,
        };
      } else {
        res.status(400).json({
          error: "NFT not found",
        });
      }
    }
    res.status(200).json(nft);
  } catch (e) {
    res.status(400).json({ message: error.message });
  }
});

//get all auctions
router.get("/auctions", async (req, res) => {
  try {
    const data = await AuctionModel.find().limit(10).skip(0);
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json({ message: error.message });
  }
});

//get active auctions
router.get("/auctions/active", async (req, res) => {
  try {
    const data = await AuctionModel.find({
      $and: [
        { startTime: { $gte: new Date.now() } },
        { endTime: { $lte: new Date.now() } },
      ],
    })
      .limit(10)
      .skip(0);
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json({ message: error.message });
  }
});

//get all direct markets
router.get("/markets", async (req, res) => {
  try {
    const data = await DirectModel.find({}).limit(10).skip(0);
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json({ message: error.message });
  }
});

//get active direct markets
router.get("/markets/active", async (req, res) => {
  try {
    const data = await DirectModel.find({ buyer: { $exists: false } })
      .limit(10)
      .skip(0);
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json({ message: error.message });
  }
});

//get all creators based on number of created tokens
router.get("/creators", async (req, res) => {
  try {
    const query = {};
    const sort = { numberOfTokensCreated: -1 }; // sort in descending (-1) order by numberOfTokensCreated

    const data = await UserModel.find(query).sort(sort).limit(10).skip(0);
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json({ message: error.message });
  }
});

//get user data
router.get("/user", async (req, res) => {
  try {
    const query = {
      address: req.params.address,
    };

    const data = await CollectionModel.find(query);
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json({ message: error.message });
  }
});

//get all RC3_Creators collections
router.get("/rc3Creators", async (req, res) => {
  try {
    const query = {
      address: addresses.kovan.creators,
      collectionId: req.params.collectionId,
    };
    const sort = { numberOfTimesTraded: -1, timeLastTraded: -1 }; // sort in descending (-1) order by numberOfTokensCreated

    const data = await CollectionModel.find(query).sort(sort).limit(10).skip(0);
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json({ message: error.message });
  }
});

//get all RC3_Originals
router.get("/rc3Originals", async (req, res) => {
  try {
    const query = {
      address: addresses.kovan.originals,
      collectionId: req.params.collectionId,
    };
    const sort = { numberOfTimesTraded: -1, timeLastTraded: -1 };

    const data = await CollectionModel.find(query).sort(sort).limit(10).skip(0);
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json({ message: error.message });
  }
});

//get RC3 by categories
router.get("/rc3Creators/categories", async (req, res) => {
  try {
    const query = {
      address: addresses.kovan.creators,
      properties: {
        category: req.params.category,
      },
    };
    const sort = { numberOfTimesTraded: -1, timeLastTraded: -1 };

    const data = await CollectionModel.find(query).sort(sort).limit(10).skip(0);
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json({ message: error.message });
  }
});

//get RC3 by natures
router.get("/rc3Creators/natures", async (req, res) => {
  try {
    const query = {
      address: addresses.kovan.creators,
      properties: {
        category: req.params.nature,
      },
    };
    const sort = { numberOfTimesTraded: -1, timeLastTraded: -1 };

    const data = await CollectionModel.find(query).sort(sort).limit(10).skip(0);
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json({ message: error.message });
  }
});

//get hot Nifties
router.get("/hotNFTs", async (req, res) => {
  try {
    const query = {};
    const sort = { timeLastTraded: -1 };
    const data = await CollectionModel.find(query).sort(sort).limit(10).skip(0);
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json({ message: error.message });
  }
});

//create new auction trade
router.post("/auctions/create", async (req, res) => {
  try {
    const data = new AuctionModel({
      auctionId: Number(req.body.auctionId),
      nftId: Number(req.body.nftId),
      nftAddress: req.body.nftAddress,
      seller: req.body.seller,
      floorPrice: req.body.floorPrice,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      tradeToken: req.body.tradeToken,
    });

    const dataToSave = await data.save();

    await UserModel.updateOne(
      { address: data.seller },
      {
        $push: { auctionIdsCreated: data.auctionId },
      }
    );

    res.status(200).json(dataToSave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//make bid
router.post("/auctions/bid", async (req, res) => {
  try {
    const data = {
      auctionId: req.body.auctionId,
      price: req.body.amount,
      address: req.body.userAddress,
    };

    const auction = await AuctionModel.updateOne(
      { auctionId: data.auctionId },
      { buyer: data.address, soldFor: data.price }
    );

    await CollectionModel.updateOne(
      { collectionId: auction.collectionId },
      {
        numberOfTimesTraded: auction.numberOfTimesTraded + 1,
        timeLastTraded: new Date.now(),
      }
    );

    await UserModel.updateOne(
      { address: data.address },
      {
        $push: { auctionIdsBidded: data.auctionId },
      }
    );
    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//close bid
router.post("/auctions/close", async (req, res) => {
  try {
    const data = {
      auctionId: req.body.auctionId,
    };

    const auction = await AuctionModel.updateOne(
      { auctionId: data.auctionId },
      { isClosed: true }
    );

    await UserModel.updateOne(
      { address: auction.buyer },

      {
        numberOfItemsBuys: numberOfItemsBuys + 1,
        amountSpent: amountSpent + auction.soldFor,
        $push: { auctionIdsBought: data.auctionId },
      }
    );

    await UserModel.updateOne(
      { address: auction.seller },

      {
        numberOfSells: numberOfSells + 1,
        amountReceived: amountReceived + auction.soldFor,
      }
    );
    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//create new direct trade
router.post("markets/create", async (req, res) => {
  try {
    const data = new DirectModel({
      marketId: req.body.marketId,
      nftId: req.body.nftId,
      nftAddress: req.body.nftAddress,
      seller: req.body.seller,
      floorPrice: req.body.floorPrice,
      tradeToken: req.body.tradeToken,
    });

    const dataToSave = await data.save();

    await UserModel.updateOne(
      { address: data.seller },
      {
        $push: { directIdsCreated: data.auctionId },
      }
    );

    res.status(200).json(dataToSave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//buy market
router.post("/markets/buy", async (req, res) => {
  try {
    const data = {
      marketId: req.body.marketId,
      price: req.body.amount,
      address: req.body.userAddress,
    };

    const market = await DirectModel.updateOne(
      { marketId: data.marketId },
      { buyer: data.address, soldFor: data.price, isClosed: true }
    );

    await CollectionModel.updateOne(
      { collectionId: market.collectionId },
      {
        numberOfTimesTraded: market.numberOfTimesTraded + 1,
        timeLastTraded: new Date.now(),
      }
    );

    await UserModel.updateOne(
      { address: data.address },

      {
        numberOfItemsBuys: numberOfItemsBuys + 1,
        amountSpent: amountSpent + data.price,
        $push: { directIdsBought: data.marketId },
      }
    );

    await UserModel.updateOne(
      { address: market.seller },

      {
        numberOfSells: numberOfSells + 1,
        amountReceived: amountReceived + data.price,
      }
    );

    const dataToSave = await data.save();
    res.status(200).json(dataToSave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//update user profile
router.post("/user/edit", async (req, res) => {
  try {
    const data = new UserModel({
      username: req.body.username,
      bio: req.body.bio,
      image: req.body.image,
      address: req.body.address,
    });
    await UserModel.updateOne(data);
    const dataToSave = await data.save();
    res.status(200).json(dataToSave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
