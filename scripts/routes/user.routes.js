const express = require("express");
const userRouter = express.Router();
const log = require("../../config/log4js");
const UserModel = require("../models/user.model");

//get user data
userRouter.get("/:address", async (req, res) => {
  try {
    const query = {
      address: req.params.address,
    };
    const data = await UserModel.findOne(query, { _id: 0, __v: 0 });
    return res.status(200).json(data);
  } catch (e) {
    log.info(`Client Error getting user data logs: ${e}`);
    return res.status(400).json({ message: error.message });
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

//register new user address
userRouter.post("/", async (req, res) => {
  const data = req.body;
  if (!data.address) {
    return res.status(400).json({
      error: "Missing required property from client",
    });
  }
  try {
    const find = await UserModel.find({
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
