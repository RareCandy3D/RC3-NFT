const express = require("express");
const { generateNonce, ErrorTypes, SiweMessage } = require("siwe");
const log = require("../../config/log4js");
const UserModel = require("../models/user.model");
const userRouter = express.Router();

//get nonce
userRouter.get("/nonce", async function (req, res) {
  req.session.nonce = generateNonce();
  res.setHeader("Content-Type", "text/plain");
  res.status(200).send(req.session.nonce);
});

//verify signature
userRouter.post("/verify", async function (req, res) {
  try {
    if (!req.body.message) {
      res
        .status(422)
        .json({ message: "Expected prepareMessage object as body." });
      return;
    }

    let message = new SiweMessage(req.body.message);
    const fields = await message.validate(req.body.signature);
    if (fields.nonce !== req.session.nonce) {
      console.log(req.session);
      res.status(422).json({
        message: `Invalid nonce.`,
      });
      return;
    }
    req.session.siwe = fields;
    req.session.cookie.expires = new Date(fields.expirationTime);
    req.session.save(() => res.status(200).end());
  } catch (e) {
    req.session.siwe = null;
    req.session.nonce = null;
    console.error(e);
    switch (e) {
      case ErrorTypes.EXPIRED_MESSAGE: {
        req.session.save(() => res.status(440).json({ message: e.message }));
        break;
      }
      case ErrorTypes.INVALID_SIGNATURE: {
        req.session.save(() => res.status(422).json({ message: e.message }));
        break;
      }
      default: {
        req.session.save(() => res.status(500).json({ message: e.message }));
        break;
      }
    }
  }
});

//signed in info
userRouter.get("/personal_information", function (req, res) {
  if (!req.session.siwe) {
    res.status(401).json({ message: "You have to first sign_in" });
    return;
  }
  console.log("User is authenticated!");
  res.setHeader("Content-Type", "text/plain");
  res.send(
    `You are authenticated and your address is: ${req.session.siwe.address}`
  );
});

//get user data
userRouter.get("/:address", async (req, res) => {
  try {
    const query = {
      address: req.params.address,
    };
    if (!query.address) {
      return res.status(400).json({
        error: "Missing required property from client",
      });
    }
    const data = await UserModel.findOne(query, { _id: 0, __v: 0 });
    return res.status(200).json(data);
  } catch (e) {
    log.info(`Client Error getting user data logs: ${e}`);
    return res.status(400).json({ message: e.message });
  }
});

//get user dashboard
userRouter.get("/dashboard/:address", async (req, res) => {
  let result = { sales: 0, buys: 0, owned: 0, created: 0 };
  try {
    const query = {
      address: req.params.address,
    };
    if (!query.address) {
      return res.status(400).json({
        error: "Missing required property from client",
      });
    }
    let data = await UserModel.findOne(query);

    if (!data) {
      const newUser = new UserModel(query);
      await newUser.save();
      data = await UserModel.findOne(query);
    }

    result.sales = data["numberOfSells"];
    result.buys = data["numberOfItemsBuys"];
    result.created = data["numberOfTokensCreated"];

    const len = data["balances"].length;

    if (len > 0) {
      for (let i = 0; i < len; i++) {
        result.owned += data["balances"][i].balance;
      }
    }
    return res.status(200).json(result);
  } catch (e) {
    log.info(`Client Error getting user data logs: ${e}`);
    return res.status(400).json({ message: e.message });
  }
});

//get user balance by collections
userRouter.get("/dashboard/owned/:address", async (req, res) => {
  let result = [];
  try {
    const query = {
      address: req.params.address,
    };
    if (!query.address) {
      return res.status(400).json({
        error: "Missing required property from client",
      });
    }
    let data = await UserModel.findOne(query, { _id: 0, __v: 0 });

    if (!data) {
      const newUser = new UserModel(query);
      await newUser.save();
      data = await UserModel.findOne(query);
    }

    const feed = data["balances"];
    feed.map((res) => {
      let form = {
        collectionId: res.collectionId,
        address: res.address,
        balance: res.balance,
      };

      result.push(form);
    });

    return res.status(200).json(result);
  } catch (e) {
    log.info(`Client Error getting user data logs: ${e}`);
    return res.status(400).json({ message: e.message });
  }
});

//get user created collections
userRouter.get("/dashboard/created/:address", async (req, res) => {
  try {
    const query = {
      address: req.params.address,
    };
    if (!query.address) {
      return res.status(400).json({
        error: "Missing required property from client",
      });
    }
    const data = await UserModel.findOne(query, { _id: 0, __v: 0 });
    const results = { created: data["rc3CollectionIdsCreated"] };
    return res.status(200).json(results);
  } catch (e) {
    log.info(`Client Error getting user data logs: ${e}`);
    return res.status(400).json({ message: e.message });
  }
});

//get user mintable collections
userRouter.get("/dashboard/mintable/:address", async (req, res) => {
  try {
    const query = {
      address: req.params.address,
    };
    if (!query.address) {
      return res.status(400).json({
        error: "Missing required property from client",
      });
    }
    const data = await UserModel.findOne(query, { _id: 0, __v: 0 });
    const results = { mintable: data["mintableCollectionIds"] };
    return res.status(200).json(results);
  } catch (e) {
    log.info(`Client Error getting user data logs: ${e}`);
    return res.status(400).json({ message: e.message });
  }
});

//get all users
userRouter.get("/", async (req, res) => {
  try {
    const data = await UserModel.find({}, { _id: 0, __v: 0 });

    if (data.length === 0) {
      return res.status(404).json({
        error: "Users not found",
      });
    }
    return res.status(200).json(data);
  } catch (e) {
    log.info(`Client Error getting user data logs: ${e}`);
    return res.status(400).json({ message: error.message });
  }
});

//get if user is registered data
userRouter.get("/status/:address", async (req, res) => {
  let data = { flag: false, message: "User is not registered" };
  try {
    const query = {
      address: req.params.address,
    };
    const find = await UserModel.findOne(query);

    if (find) {
      data.flag = true;
      data.message = "User is registered";
    }
    return res.status(200).json(data);
  } catch (e) {
    log.info(`Client Error getting user registration logs: ${e}`);
    return res.status(400).json({ message: error.message });
  }
});

//register new user address
userRouter.post("/", async (req, res) => {
  const data = req.body;
  if (!data.address) {
    return res.status(400).json({
      error: "Missing required property from client",
    });
  }
  try {
    const find = await UserModel.findOne({
      address: data.address,
    });

    if (find) {
      return res.status(400).json({
        error: "Already a registered user",
      });
    }
    const newUser = new UserModel({
      address: data.address,
    });
    await newUser.save();
    return res.status(200).json(data);
  } catch (e) {
    log.info(`Client Error registering new user address: ${e}`);
    return res.status(400).json({ message: e.message });
  }
});

//update user profile username
userRouter.post("/username", async (req, res) => {
  const data = req.body;
  if (!data.address || !data.username) {
    return res.status(400).json({
      error: "Missing required property from client",
    });
  }
  try {
    const find = await UserModel.findOne({ address: data.address });
    if (find) {
      await UserModel.findOneAndUpdate(
        {
          address: data.address,
        },
        {
          username: data.username,
        }
      );
    } else {
      return res.status(400).json({
        error: "Invalid address property from client",
      });
    }
    return res.status(200).json(data);
  } catch (e) {
    log.info(`Client Error updating username data logs: ${e}`);
    return res.status(400).json({ message: e.message });
  }
});

//update user profile bio
userRouter.post("/bio", async (req, res) => {
  const data = req.body;
  if (!data.address || !data.bio) {
    return res.status(400).json({
      error: "Missing required property from client",
    });
  }
  try {
    const find = await UserModel.findOne({ address: data.address });
    if (find) {
      await UserModel.findOneAndUpdate(
        {
          address: data.address,
        },
        {
          bio: data.bio,
        }
      );
    } else {
      return res.status(400).json({
        error: "Invalid address property from client",
      });
    }
    return res.status(200).json(data);
  } catch (e) {
    log.info(`Client Error updating user bio data logs: ${e}`);
    return res.status(400).json({ message: e.message });
  }
});

//update user image
userRouter.post("/image", async (req, res) => {
  const data = req.body;
  if (!data.address || !data.image) {
    return res.status(400).json({
      error: "Missing required property from client",
    });
  }
  try {
    const find = await UserModel.findOne({ address: data.address });
    if (find) {
      await UserModel.findOneAndUpdate(
        {
          address: data.address,
        },
        {
          image: data.image,
        }
      );
    } else {
      return res.status(400).json({
        error: "Invalid address property from client",
      });
    }
    return res.status(200).json(data);
  } catch (e) {
    log.info(`Client Error updating user image data logs: ${e}`);
    return res.status(400).json({ message: e.message });
  }
});

//follow and unfollow user
userRouter.post("/followingAction", async (req, res) => {
  const data = req.body;
  if (!data.address1 || !data.address2) {
    return res.status(400).json({
      error: "Missing required property from client",
    });
  }
  try {
    const find = await UserModel.find({
      $or: [
        { address: { $eq: data.address1 } },
        { address: { $eq: data.address2 } },
      ],
    });

    if (find.length === 2) {
      let isFollowing = false;

      for (let i = 0; i < find[0]["userFollowing"].length; i++) {
        if (find[0]["userFollowing"][i] === data.address2) {
          isFollowing = true;
        }
      }

      if (!isFollowing) {
        await UserModel.findOneAndUpdate(
          {
            address: data.address1,
          },
          {
            $inc: { numberOfFollowing: 1 },
            $push: { userFollowing: data.address2 },
          }
        );

        await UserModel.findOneAndUpdate(
          {
            address: data.address2,
          },
          {
            $inc: { numberOfFollowers: 1 },
            $push: { peopleFollowing: data.address1 },
          }
        );
        return res.status(200).json({ success: "Successfully following" });
      } else {
        await UserModel.findOneAndUpdate(
          {
            address: data.address1,
          },
          {
            $inc: { numberOfFollowing: -1 },
            $pull: {
              userFollowing: data.address2,
            },
          }
        );

        await UserModel.findOneAndUpdate(
          {
            address: data.address2,
          },
          {
            $inc: { numberOfFollowers: -1 },
            $pull: {
              peopleFollowing: data.address1,
            },
          }
        );
        return res.status(200).json({ success: "Successfully unfollowing" });
      }
    } else {
      return res.status(400).json({
        error: "Invalid address property from client",
      });
    }
  } catch (e) {
    log.info(`Client Error updating followers logs: ${e}`);
    return res.status(400).json({ message: e.message });
  }
});

module.exports = userRouter;
