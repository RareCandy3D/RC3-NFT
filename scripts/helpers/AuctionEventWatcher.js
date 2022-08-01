const { pool, TBL_HOT_NFTS,TBL_HOT_ACTIVITIES } = require("../../db/db");
const log = require("../../config/log4js");

class AuctionEventWatcher {
  constructor(mall) {
    this.mall = mall;
  }
  async watch() {
    try {
      await this.mall.events.AuctionResulted().on("data", async (event) => {
        let { id, address } = event;
        let { caller, seller, highestBidder, nft } = event.returnValues;

        let buys = address == highestBidder ? 1 : 0;
        let sales = address == seller ? 1 : 0;

        const checkUserActivity = await pool.query(
          `SELECT * FROM ${TBL_HOT_ACTIVITIES} WHERE OUAUserAddress=?`,
          [address]
        );
        if (checkUserActivity.length < 1) {
          await pool.query(
            `INSERT INTO ${TBL_HOT_ACTIVITIES} (OUAUserAddress,OUABuys,OUASales) VALUES ?  `,
            [[[address, buys, sales]]]
          );
        } else {
          await pool.query(
            `UPDATE ${TBL_HOT_ACTIVITIES} SET OUABuys=OUABuys+?, OUASales=OUASales+? WHERE OUAUserAddress=?`,
            [buys, sales, address]
          );
        }

        const checkNFT = await pool.query(
          `SELECT * FROM ${TBL_HOT_NFTS} WHERE OHNNFTAddress=?`,
          [nft]
        );
        if (checkNFT.length < 1) {
          const result = await pool.query(
            `INSERT INTO ${TBL_HOT_NFTS} (OHNNFTAddress,OHNAuctions,OHNTotalRCDY,OHNIDArray) VALUES ?  `,
            [[[nft, 1, 1, id]]]
          );
        } else {
          if (!checkNFT[0].OHNIDArray.includes(id)) {
            const result = await pool.query(
              `UPDATE ${TBL_HOT_NFTS} SET OHNAuctions=OHNAuctions+1, OHNTotalRCDY=OHNTotalRCDY+1 WHERE OHNNFTAddress=?`,
              [nft]
            );
          }
        }
      });
    } catch (e) {
      log.info(`Error Inserting action logs: ${e}`);
      console.log(`Error Inserting auction logs: ${e}`);
    }
  }
}

module.exports = AuctionEventWatcher;
