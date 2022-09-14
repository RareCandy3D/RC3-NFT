const abiCreators = require("../artifacts/contracts/RC3_Creators.sol/RC3_Creators.json");
const abiRCDY = require("../artifacts/contracts/RCDY.sol/RCDY.json");
const abiMall = require("../artifacts/contracts/RC3_Mall.sol/RC3_Mall.json");

async function main() {
  const admin = "0xf923d0f9f2d61dC7D538241305cB62c7f4BF8D3A";
  const user = "0x6dc168fC2163513942f159cDFd8a2B2b84C5c557";
  const id1 =
    "0x01559ae4021a99b0d373d7bc8a80504bad782367abe12c21373c83adc6bf6a7e";
  const id2 =
    "0x01559ae4021ac1396ad6a18f2307b8e8c3a0e071ae38ca60bcc2aa92a1a4fb5c";
  const price = ethers.utils.parseUnits("1", "ether");

  console.log("Deploying RCDY...");
  const RCDY = await ethers.getContractFactory("RCDY");
  const rcdy = await RCDY.deploy();
  await rcdy.deployed();
  console.log("RCDY Deployed to:", rcdy.address);

  console.log("Deploying RC3_Creators...");
  const RC3_Creators = await ethers.getContractFactory("RC3_Creators");
  const creators = await RC3_Creators.deploy(admin);
  await creators.deployed();
  console.log("RC3_Creators Deployed to:", creators.address);

  console.log("Deploying RC3_Mall...");
  const RC3_Mall = await ethers.getContractFactory("RC3_Mall");
  const mall = await upgrades.deployProxy(
    RC3_Mall,
    [admin, rcdy.address, admin, 2300, 2500],
    { initializer: "initialize" }
  );
  await mall.deployed();
  console.log("RC3_Mall Deployed to:", mall.address);

  console.log("Compiling ethers contracts...");
  const provider = new ethers.providers.JsonRpcProvider(process.env.BSC_TEST);
  const signer1 = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const signer2 = new ethers.Wallet(process.env.PRIVATE_KEY2, provider);

  const mallContract = new ethers.Contract(mall.address, abiMall.abi, provider);
  const creatorContrat = new ethers.Contract(
    creators.address,
    abiCreators.abi,
    provider
  );
  const rcdyContrat = new ethers.Contract(rcdy.address, abiRCDY.abi, provider);

  // // set market
  let tx = await creatorContrat.connect(signer1).setMarket(mall.address, true);
  console.log(`Set Market at: ${tx.hash}`);
  await tx.wait();

  // create first token
  let category = await creatorContrat.categories(1);
  let nature = await creatorContrat.natures(1);
  tx = await creatorContrat
    .connect(signer1)
    .createToken(admin, id1, 5, 100, 1000, category, nature, {
      value: ethers.utils.parseEther("0.01"),
    });
  console.log(`Created first NFT token at: ${tx.hash}`);
  await tx.wait();

  // set physical creator
  tx = await creatorContrat.connect(signer1).setPhysicalCreator([user], true);
  console.log(`Set physical creator at: ${tx.hash}`);
  await tx.wait();

  // create second market
  category = await creatorContrat.categories(0);
  nature = await creatorContrat.natures(0);
  tx = await creatorContrat
    .connect(signer2)
    .createToken(admin, id2, 5, 100, 1500, category, nature, {
      value: ethers.utils.parseEther("0.01"),
    });
  console.log(`Created second NFT token at: ${tx.hash}`);
  await tx.wait();

  // mint new token
  tx = await creatorContrat.connect(signer2).mint(user, id2, 5);
  console.log(`Minted token at: ${tx.hash}`);
  await tx.wait();

  //set royalty info
  tx = await creatorContrat
    .connect(signer1)
    .setRoyaltyInfo(admin, [admin, user], [300, 700], id1, 500);
  console.log(`Set royalty info at: ${tx.hash}`);
  await tx.wait();

  //////////////////////////////////////////////////////////////////////////////////

  // Listing Auction
  tx = await mallContract
    .connect(signer1)
    .listAuction(creators.address, id1, 1, 0, 100, price, 1);
  console.log(`Listing Auction at: ${tx.hash}`);
  await tx.wait();

  // transfer and approval RCDY
  tx = await rcdyContrat
    .connect(signer1)
    .transfer(user, ethers.utils.parseEther("100000"));
  console.log(`Transfered tokens at: ${tx.hash}`);
  await tx.wait();

  tx = await rcdyContrat.connect(signer2).approve(mall.address, price);
  console.log(`Approved mall of RCDY at: ${tx.hash}`);
  await tx.wait();

  // make a bid
  tx = await mallContract.connect(signer2).bid(1, price);
  console.log(`Bidded at: ${tx.hash}`);
  await tx.wait();

  // create market
  tx = await mallContract
    .connect(signer2)
    .listMarket(
      creators.address,
      id2,
      1,
      ethers.utils.parseEther("0.00001"),
      1,
      0
    );
  console.log(`Created market at: ${tx.hash}`);
  await tx.wait();

  // // buy market
  // tx = await mallContract
  //   .connect(signer1)
  //   .buyWithETH(1, ethers.utils.parseEther("0.00001"));

  // //close bid
  // await new Promise(() => {
  //   const interval = setInterval(async () => {
  //     let [, newTime] = await mallContract.bidTimeRemaining(1);
  //     if (Number(newTime) === 0) {
  //       tx = await mallContract.connect(signer1).closeBid(1);
  //       clearInterval(interval);
  //     }
  //   }, 10000);
  // });
  // console.log(`Closed Bid at: ${tx.hash}`);
  // await tx.wait();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

// Deploying RCDY...
// RCDY Deployed to: 0x378cd12990004356B3025a1BB7b57abecC870a46
// Deploying RC3_Creators...
// RC3_Creators Deployed to: 0x1F721ffA29DB590127A6A219c3d4F78E4f8f87b6
// Deploying RC3_Mall...
// RC3_Mall Deployed to: 0xac104c2c05F57126BeE05b472aE52250F4366832 //implementation 0x4e6285EDD69EB5fD6000ea3B598557533286A919
// Compiling ethers contracts...
// Set Market at: 0x956120ee5e472bc308772c70129c657c75c2d5dc53a8ef5aa8f795614af9e34b
// Created first NFT token at: 0xa75238b9151249b5025cba528fcc4c63a9d5980b458b46da89da26e419d0cb92
// Set physical creator at: 0xaf1b3f49e84b31029a90df2701d569e5fdcbd4af6e6c0be15d1f3715626c8bb3
// Created second NFT token at: 0x6d57bb364bac672b64db43bb74cec9fbbc14256462c159828c0f9f87dae18b39
// Minted token at: 0xf2ccfd7113c4e0efe1ff665cd6811491b0d12b069c754446fd683d1c251c14aa
// Set royalty info at: 0xae870833a4d267088a8ccea426dd19437798cc714fb890a2854b5e4092d5cce4
// Listing Auction at: 0x7e33657b0f953c829ac9f47ebb97d3c397429f3b03e1d82002770ca70f60680a
// Transfered tokens at: 0x58fd3c492e7a473d01f52708bd5e2912f1a35147cdae168d8b19d5cb0418f509
// Approved mall of RCDY at: 0x67759e3734778de7907422cad2c60009178a196e8e9f6ae35d259946cb0abff7
// Bidded at: 0xcfabb5c32f150e622eecf394c70da360bf5f5d7f3162a4fde9eae6a2f96c111d
// Created market at: 0x0e162c4d6d38f9eb29cb8bcf79f5ebcb4f4547edf411f31202ecdfb52d5e4359
