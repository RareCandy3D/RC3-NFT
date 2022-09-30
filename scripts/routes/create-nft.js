const express = require("express");
const router = express.Router();
const multer = require("multer");
const Joi = require("joi");
const fs = require("fs");
const CIDTool = require("cid-tool");
const log = require("../../config/log4js");

const postUploads = multer({ dest: "uploads/post_uploads" });
const uploadSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  nature: Joi.string().valid("PHYSICAL", "DIGITAL", "PHYGITAL").required(),
  category: Joi.string().required(),
});

router.post("/", postUploads.single("media"), async (req, res) => {
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
    res.status(200).json(output);
  } catch (error) {
    fs.unlinkSync(path);
    output.message = error.message;
    res.status(400).json(output);
  }
});

module.exports = router;
