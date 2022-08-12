const express = require("express");
const router = express.Router();
const {
    pool,
    TBL_HOT_NFTS
  } = require("../../db/db");
  const log = require("../../config/log4js");

  router.get("/",  async (req, res) => {
    let output = { flag: false, message: "", data: {} };
    try{
        var result=await pool.query(`SELECT OHNId as id,OHNNFTAddress as nftAddress,OHNTrades as trades,OHNAuctions as auctions,OHNTotalEth as totalETH,OHNTotalRCDY as totalRCDY,OHNTrades+OHNAuctions as _MISC FROM ${TBL_HOT_NFTS} ORDER BY _MISC DESC`,[]);

        output.flag = true;
        output.message = "Hot NFTs fetched successfully";
        output.data = result;
        return res.status(200).json(output);
    }catch(err){
      log.info(`Error fetching hot nfts: ${err}`);
      console.log(`Error fetching hot nfts: ${err}`);
        output.message = "Failed to fetch hot nfts";
        return res.status(400).json(output);
    }
  });

module.exports = router;