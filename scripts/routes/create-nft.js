const express = require("express");
const router = express.Router();
const multer = require("multer");
const Joi = require("joi");
const fs = require('fs');
const CIDTool = require('cid-tool');
const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK(process.env.PINATA_KEY, process.env.PINATA_PRIVATE_KEY);
const log = require("../../config/log4js");
pinata.testAuthentication().then((result) => {
        log.info(`Authenticated with Pinata`);
        console.log(`Authenticated with Pinata`);
     }).catch((err) => {
        log.info(`Authentication with Pinata failed`);
        console.log(`Authentication with Pinata failed`);
});
const postUploads = multer({ dest: "uploads/post_uploads"});
const uploadSchema = Joi.object({
name: Joi.string().required(),
description: Joi.string().required(),
nature:Joi.string().valid("PHYSICAL","DIGITAL", "PHYGITAL").required(),
category:Joi.string().required()
});





  router.post("/", postUploads.single("media"), async (req, res) => {
    let output = { flag: false, message: "", data: {} };

    var { error, value } = uploadSchema.validate(req.body);
    if (error) {
      output.message = error.message;
      return res.status(400).json(output);
    }

        let {path,filename}=req.file;

        let {name,description,nature,category}=req.body;
           //pin image
            const readableStreamForFile = fs.createReadStream(path);  

    try {
        let pinFile= await pinata.pinFileToIPFS(readableStreamForFile, {
            pinataMetadata: {
            name: filename,
            },
            pinataOptions: {
            cidVersion: 0
            }
        });

           let {IpfsHash}=pinFile;

           //build json pinata
            let pinJson= await pinata.pinJSONToIPFS(
                {
                    name,
                    description,
                    image: `ipfs://${IpfsHash}`,
                    "catalogue number": "",
                    properties: {
                    category,
                    nature,
                    "unlockable content": "URL link to unlockable",
                    "unlockable content details": "string explaining what the unlockable content grants you access to"
                    }
                },
                    {
                    pinataMetadata: {
                        name: filename
                    },
                    pinataOptions: {
                        cidVersion: 1
                    }
                    }
            );
           
        var tokenId=CIDTool.format(pinJson.IpfsHash, { base: 'base16' }).split('');
        tokenId.splice(0,2,"0","x","0");
        let newTokenId=tokenId.join('');
        output.flag=true;
        output.message="NFT asset uploaded successfully";
        output.data=newTokenId;
        fs.unlinkSync(path);
        res.status(200).json(output);
    } catch (error) {
        fs.unlinkSync(path);
        output.message=error.message;                                                                                                                 
        res.status(400).json(output);
    }
  });

module.exports = router;