const web3=require("web3");

class Web3Helper{

         fromWei(value){
            var value=value.toString();
            return web3.utils.fromWei(value);
        }

        toWei(value){
            var value=value.toString();
            return web3.utils.toWei(value);
        }
}


module.exports=Web3Helper;