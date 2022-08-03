const axios=require("axios");
const log = require("../../../config/log4js");


class PingServer{

    async ping(){
        if(process.env.PING_SERVER){
            setInterval(function(){
             axios.get(process.env.PING_SERVER).then(
               (response) => {
                 log.info(`✅ Ping successful`);
                 console.log(`✅ Ping successful`);
               },
               (error) => {
                 log.info(`🚩 Ping failed ${error}`);
               console.log(`🚩 Ping failed ${error}`);
               }
             );
           }, 3480000);
           }
    }
}


module.exports=PingServer;