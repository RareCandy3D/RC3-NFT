require("dotenv").config();
const admin = "0xf923d0f9f2d61dC7D538241305cB62c7f4BF8D3A";

async function main() {
  const FEE_DATA = {
    maxFeePerGas: ethers.utils.parseUnits("100", "gwei"),
    maxPriorityFeePerGas: ethers.utils.parseUnits("5", "gwei"),
  };

  // Wrap the provider so we can override fee data.
  const provider = new ethers.providers.FallbackProvider([ethers.provider], 1);
  provider.getFeeData = async () => FEE_DATA;
  // Create the signer for the PRIVATE KEY, connected to the provider with hardcoded fee data
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY).connect(provider);

  const RCDY = await ethers.getContractFactory("RCDY", signer);
  const RC3_Mall = await ethers.getContractFactory("RC3_Mall", signer);
  const RC3_Creators = await ethers.getContractFactory("RC3_Creators", signer);

  //deploy mock rcdy
  const rcdy = await RCDY.deploy();
  await rcdy.deployed();
  console.log("Mock RCDY deployed to:", rcdy.address); // replace wit mainnet address on production

  const creators = await RC3_Creators.deploy(admin);
  await creators.deployed();
  console.log("RC3_Creators deployed to:", creators.address);

  const mall = await upgrades.deployProxy(
    RC3_Mall,
    [admin, rcdy.address, admin, 2300, 2500],
    { initializer: "initialize" }
  );
  await mall.deployed();
  console.log("RC3_Mall deployed to:", mall.address);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// Mock RCDY deployed to: 0x98b850a402B975F065ab98Abc1bdc6b79445af42
// RC3_Creators deployed to: 0x3cD6bB22F1ae56dc4B4DA9E694a843bf2102ec15
// RC3_Mall deployed to: 0xEd59ad78e4B69d36d526cE6c22277E393f309Fcb
