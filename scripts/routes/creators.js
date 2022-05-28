const express = require("express");
const router = express.Router();
const {
    pool,
    TBL_CREATOR_LOGS
  } = require("../../db/db");
  const log = require("../../config/log4js");

  router.get("/",  async (req, res) => {
    let output = { flag: false, message: "", data: {} };

    try{
        let result=await pool.query(`SELECT OCLId as creatorId,OCLAddress as creatorAddress,COUNT(OCLId) as totalCount,COUNT(OCLInitialSupply) as totalInitialSupply,COUNT(OCLMaxSupply) as totalMaxSupply FROM ${TBL_CREATOR_LOGS}`,[]);
        output.flag = true;
        output.message = "Creators fetched successfully";
        output.data = result;
        return res.status(200).json(output);
    }catch(err){
        output.message = "Failed to fetch creator's list!";
        return res.status(400).json(output);
    }
  });

module.exports = router;