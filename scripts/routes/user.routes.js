const express = require("express");
const userRouter = express.Router();
const UserModel = require("../models/user.model");

//get user data
userRouter.get("/:address", async (req, res) => {
  try {
    const query = {
      address: req.params.address,
    };

    const data = await UserModel.find(query);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(400).json({ message: error.message });
  }
});

//update user profile username
userRouter.post("/", async (req, res) => {
  const data = req.body;
  if (!data.address || !data.username) {
    return res.status(400).json({
      error: "Missing required property from client",
    });
  }
  try {
    await UserModel.updateOne(
      {
        address: data.address,
      },
      {
        username: data.username,
      }
    );
    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

//update user profile bio
userRouter.post("/", async (req, res) => {
  const data = req.body;
  if (!data.address || !data.bio) {
    return res.status(400).json({
      error: "Missing required property from client",
    });
  }
  try {
    await UserModel.updateOne(
      {
        address: data.address,
      },
      {
        bio: data.bio,
      }
    );
    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

//update user profile picture
userRouter.post("/", async (req, res) => {
  const data = req.body;
  if (!data.address || !data.image) {
    return res.status(400).json({
      error: "Missing required property from client",
    });
  }
  try {
    await UserModel.updateOne(
      {
        address: data.address,
      },
      {
        image: data.image,
      }
    );
    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = userRouter;
