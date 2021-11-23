const RC3NFT = artifacts.require("RC3NFT");
const Marketplace = artifacts.require("Marketplace");

module.exports = async function(deployer, _network) {
    await deployer.deploy(Marketplace);
    const market = await Marketplace.deployed();
    await deployer.deploy(RC3NFT, market.address);
};