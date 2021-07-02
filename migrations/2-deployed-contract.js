const RC3NFT = artifacts.require("RC3NFT");

module.exports = async function(deployer) {
    deployer.deploy(RC3NFT);
};