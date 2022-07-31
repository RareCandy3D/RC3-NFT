const { pool, TBL_CREATOR_LOGS } = require("../../db/db");
const log = require("../../config/log4js");
class CreatorEventWatcher {
  constructor(creators) {
    this.creators = creators;
  }
  async watch() {
    try {
      await this.creators.events.NewToken().on("data", async (event) => {
        let { creator, id } = event.returnValues;

        const checkCreator = await pool.query(
          `SELECT * FROM ${TBL_CREATOR_LOGS} WHERE OCLAddress=?`,
          [creator]
        );
        if (checkCreator.length < 1) {
          const result = await pool.query(
            `INSERT INTO ${TBL_CREATOR_LOGS} (OCLAddress, OCLIDArray) VALUES ? `,
            [[[creator, id]]]
          );
        } else {
          if (!checkCreator[0].OCLIDArray.includes(id)) {
            const result = await pool.query(
              `UPDATE ${TBL_CREATOR_LOGS} SET OCLIDArray=CONCAT_WS(',',OCLIDArray,${id}) , OCLNON=OCLNON+1 WHERE OCLAddress=?`,
              [creator]
            );
          }
        }
      });
    } catch (e) {
      log.info(`Error Inserting creator logs: ${e}`);
      console.log(`Error Inserting creator logs: ${e}`);
    }
  }
}

module.exports = CreatorEventWatcher;
