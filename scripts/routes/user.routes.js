const express = require("express");
const userRouter = express.Router();
const UserModel = require("../models/user.model");

//get user data
userRouter.get("/user", async (req, res) => {
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

//update user profile
userRouter.post("/user/edit", async (req, res) => {
  try {
    const data = {
      username: req.body.username,
      bio: req.body.bio,
      image: req.body.image,
      address: req.body.address,
    };
    await UserModel.updateOne(data);
    const dataToSave = await data.save();
    return res.status(200).json(dataToSave);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = userRouter;
