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
  // const RCDY = await hre.ethers.getContractFactory("RCDY");
  // const rcdy = await RCDY.deploy();
  // await rcdy.deployed();
  // console.log("RCDY Deployed to:", rcdy.address);
  const rcdy = "0xc32E5B6990E15dfCf0E8CeeD3f06f778FF6C9c33";

  const RC3_Originals = await hre.ethers.getContractFactory("RC3_Originals");
  const admin = "0xf923d0f9f2d61dC7D538241305cB62c7f4BF8D3A";
  const originals = await RC3_Originals.deploy(admin, "rarecandy.xyz/");
  await originals.deployed();
  console.log("RC3_Originals Deployed to:", originals.address);

  const RC3_Creators = await hre.ethers.getContractFactory("RC3_Creators");
  const creators = await RC3_Creators.deploy(admin, "rarecandy.xyz/");
  await creators.deployed();
  console.log("RC3_Creators Deployed to:", creators.address);

  const RC3_721_Factory = await hre.ethers.getContractFactory(
    "RC3_721_Factory"
  );
  const _721_Factory = await RC3_721_Factory.deploy(
    ethers.utils.parseUnits("0.001", "ether"),
    admin
  );
  await _721_Factory.deployed();
  console.log("RC3_721_Factory Deployed to:", _721_Factory.address);

  const RC3_1155_Factory = await hre.ethers.getContractFactory(
    "RC3_1155_Factory"
  );
  const _1155_Factory = await RC3_1155_Factory.deploy(
    ethers.utils.parseUnits("0.001", "ether"),
    admin
  );
  await _1155_Factory.deployed();
  console.log("RC3_1155_Factory Deployed to:", _1155_Factory.address);

  const RC3_Mall = await hre.ethers.getContractFactory("RC3_Mall");
  const mall = await upgrades.deployProxy(
    RC3_Mall,
    [admin, rcdy, admin, 2300, 2500],
    { initializer: "initialize" }
  );
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

// Kovan deployments
// RCDY Deployed to: 0xc32E5B6990E15dfCf0E8CeeD3f06f778FF6C9c33
// RC3_Originals Deployed to: 0x70Daf5e02fe60C38D307c8b1cE00821614673C4a
// RC3_Creators Deployed to: 0x5360950b5Dc5Cd6837671a02F7Efb5c4F257e98a
// RC3_721_Factory Deployed to: 0x9B3Ba25B9def8BbFC7AaD22A35d5443052044010
// RC3_1155_Factory Deployed to: 0xeeDEe4111a954DA6Ee4326A15C22B49E1d4369e3
// RC3_Mall Deployed to: 0x325f79eAC1E6036ECCCa21EfFCD6d3fBD93374E3
