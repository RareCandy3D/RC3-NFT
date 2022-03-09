// hardhat.config.js
require("@nomiclabs/hardhat-ethers");
//require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-etherscan");
require('dotenv').config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.5.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          }
        }
      },
      {
        version: "0.8.6",
        settings: {
          metadata: {
            bytecodeHash: "none",
          },
          optimizer: {
            enabled: true,
            runs: 1000,
          }
        }
      }
    ]
  },

  networks: {
    
    rinkeby: {
      url: process.env.INFURA_URL_rinkeby,
      accounts: [process.env.PRIVATE_KEY]
    },

    hardhat: {
      forking: {
        url: process.env.MAINNET_URL,
        blockNumber: 14348871, // from specific block number, there will be balance corresponding to it
        runs: 1000
      },
    }
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
