const Web3 = require("web3");
const creatorsABI = require("../../artifacts/contracts/RC3_Creators.sol/RC3_Creators.json");
const web3 = new Web3(
    new Web3.providers.WebsocketProvider(process.env.INFURA_URL)
  );
  const addresses = require("../../addresses/index.js");
  const { pool, TBL_CREATOR_LOGS } = require("../../db/db");
  const creators = new web3.eth.Contract(
    creatorsABI.abi,
    addresses.kovan.creators
  );

class CreatorEventWatcher{
    async watch(){
   try {
          await creators.events.NewToken().on("data", async (event) => {
            let { creator,id } = event.returnValues;

            const checkCreator=await pool.query(`SELECT * FROM ${TBL_CREATOR_LOGS} WHERE OCLAddress=?`,[creator]);
            if(checkCreator.length<1){
              const result = await pool.query(
                `INSERT INTO ${TBL_CREATOR_LOGS} (OCLAddress, OCLIDArray) VALUES ? `,
                [[[creator, id]]]
              );
            }else{
              if(!checkCreator[0].OCLIDArray.includes(id)){
                const result = await pool.query(
                  `UPDATE ${TBL_CREATOR_LOGS} SET OCLIDArray=CONCAT_WS(',',OCLIDArray,${id}) , OCLNON=OCLNON+1`,
                  [[[creator, id]]]
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

module.exports=CreatorEventWatcher;

