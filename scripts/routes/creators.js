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
        var result=await pool.query(`SELECT OCLId as id,OCLAddress as creatorAddress,OCLNON as numberOfNfts,OCLIDArray as creatorIdArray FROM ${TBL_CREATOR_LOGS} ORDER BY OCLNON DESC`,[]);
        
        if(result.length>=1){
          result.map((x,index)=>{
           result[index].creatorIdArray= x.creatorIdArray.split(",");
          });
        }

        output.flag = true;
        output.message = "Creators fetched successfully";
        output.data = result;
        return res.status(200).json(output);
    }catch(err){
      log.info(`Error fetching creator's list: ${err}`);
      console.log(`Error fetching creator's list: ${err}`);
        output.message = "Failed to fetch creator's list!";
        return res.status(400).json(output);
    }
  });

module.exports = router;