const { pool, TBL_HOT_NFTS,TBL_HOT_ACTIVITIES } = require("../../db/db");

class MarketSaleEventWatcher {
  constructor(mall) {
    this.mall = mall;
  }
  async watch() {
    try {
      await this.mall.events.MarketSale().on("data", async (event) => {
        let { id,address } = event;
        let { caller, seller, nft, asset } = event.returnValues;
        var totalEth=0, totalRCDY=0;
    
          totalRCDY =asset === "1" ? 1 : 0;
          totalEth = asset === "1" ?  0 : 1;
        

        let buys=address==buyer ? 1 : 0;
        let sales=address==seller ? 1 : 0;

        const checkUserActivity = await pool.query(
            `SELECT * FROM ${TBL_HOT_ACTIVITIES} WHERE OUAUserAddress=?`,
            [address]
          );
          if (checkUserActivity.length < 1) {
            await pool.query(
                `INSERT INTO ${TBL_HOT_ACTIVITIES} (OUAUserAddress,OUABuys,OUASales) VALUES ?  `,
                [[[address,buys,sales]]]
              );
          }else{
            await pool.query(
                `UPDATE ${TBL_HOT_ACTIVITIES} SET OUABuys=OUABuys+?, OUASales=OUASales+? WHERE OUAUserAddress=?`,
                [[[buys,sales,address]]]
              );
          }

        const checkNFT = await pool.query(
          `SELECT * FROM ${TBL_HOT_NFTS} WHERE OHNNFTAddress=?`,
          [nft]
        );
        if (checkNFT.length < 1) {
          const result = await pool.query(
            `INSERT INTO ${TBL_HOT_NFTS} (OHNNFTAddress,OHNTrades,OHNTotalEth,OHNTotalRCDY,OHNIDArray) VALUES ? `,
            [[[nft, 1, totalEth, totalRCDY, id]]]
          );
        } else {
          if (!checkNFT[0].OHNIDArray.includes(id)) {
            const result = await pool.query(
              `UPDATE ${TBL_HOT_NFTS} SET OHNTrades=OHNTrades+1,OHNTotalEth=OHNTotalEth+? OHNTotalRCDY=OHNTotalRCDY+? WHERE OHNNFTAddress=?`,
              [[[totalEth, totalRCDY, nft]]]
            );
          }
        }
      });
    } catch (e) {
      log.info(`Error Inserting market sale  logs: ${e}`);
      console.log(`Error Inserting market sale logs: ${e}`);
    }
  }
}

module.exports = MarketSaleEventWatcher;
