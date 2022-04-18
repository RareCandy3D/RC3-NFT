// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const RCDY = await hre.ethers.getContractFactory("RCDY");
  const rcdy = await RCDY.deploy();
  await rcdy.deployed();
  console.log("RCDY Deployed to:", rcdy.address);

  const RC3_Originals = await hre.ethers.getContractFactory("RC3_Originals");
  const admin = "0xf923d0f9f2d61dC7D538241305cB62c7f4BF8D3A";
  const originals = await RC3_Originals.deploy(admin, "rarecandy.xyz");
  await originals.deployed();
  console.log("RC3_Originals Deployed to:", originals.address);

  const RC3_Creators = await hre.ethers.getContractFactory("RC3_Creators");
  const creators = await RC3_Creators.deploy(admin, "rarecandy.xyz");
  await creators.deployed();
  console.log("RC3_Creators Deployed to:", creators.address);

  const RC3_Mall = await hre.ethers.getContractFactory("RC3_Mall");
  const mall = await RC3_Mall.deploy(rcdy.address, admin, 2300, 2500);
  await mall.deployed();
  console.log("RC3_Mall Deployed to:", mall.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
