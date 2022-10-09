const abiCreators = require("../artifacts/contracts/RC3_Creators.sol/RC3_Creators.json");
const abiRCDY = require("../artifacts/contracts/RCDY.sol/RCDY.json");
const abiMall = require("../artifacts/contracts/RC3_Mall.sol/RC3_Mall.json");
const { BigNumber } = require("@ethersproject/bignumber");

async function main() {
  const user1 = "0xf923d0f9f2d61dC7D538241305cB62c7f4BF8D3A";
  const user2 = "0x6dc168fC2163513942f159cDFd8a2B2b84C5c557";
  const user3 = "0xe542a6743C729dE7666d1B551Bf0537ECabCe25d";

  const rcdy = "0x378cd12990004356B3025a1BB7b57abecC870a46";
  const creators = "0x5bF78b986Faf3Ee0abBE73190e4a993816220263";
  const mall = "0x43DAF3D7336f822698078538e239E4744e4F578D";
  const id1 =
    "0x01559ae4021a99b0d373d7bc8a80504bad782367abe12c21373c83adc6bf6a7e";
  const id2 =
    "0x01559ae4021ac1396ad6a18f2307b8e8c3a0e071ae38ca60bcc2aa92a1a4fb5c";

  const id3 =
    "0x01559ae4021ac1396ad6a65f2307b8e8c3a0e071ae38ca60bcc2aa92a1a2db5c";
  const priceEth = ethers.utils.parseUnits("0.001", "ether");
  const priceRcdy = ethers.utils.parseUnits("100", "ether");

  // console.log("Deploying RCDY...");
  // const RCDY = await ethers.getContractFactory("RCDY");
  // const rcdy = await RCDY.deploy();
  // await rcdy.deployed();
  // console.log("RCDY Deployed to:", rcdy.address);

  // console.log("Deploying RC3_Creators...");
  // const RC3_Creators = await ethers.getContractFactory("RC3_Creators");
  // const creators = await RC3_Creators.deploy(user1);
  // await creators.deployed();
  // console.log("RC3_Creators Deployed to:", creators.address);

  // console.log("Deploying RC3_Mall...");
  // const RC3_Mall = await ethers.getContractFactory("RC3_Mall");
  // const mall = await upgrades.deployProxy(
  //   RC3_Mall,
  //   [user1, rcdy, user1, 2300, 2500],
  //   { initializer: "initialize" }
  // );
  // await mall.deployed();
  // console.log("RC3_Mall Deployed to:", mall.address);

  console.log("Compiling ethers contracts...");
  const provider = new ethers.providers.JsonRpcProvider(process.env.BSC_TEST);
  const signer1 = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const signer2 = new ethers.Wallet(process.env.PRIVATE_KEY2, provider);
  const signer3 = new ethers.Wallet(process.env.PRIVATE_KEY3, provider);

  const mallContract = new ethers.Contract(mall, abiMall.abi, provider);
  const creatorContrat = new ethers.Contract(
    creators,
    abiCreators.abi,
    provider
  );
  const rcdyContrat = new ethers.Contract(rcdy, abiRCDY.abi, provider);

  // // set market
  // let tx = await creatorContrat.connect(signer1).setMarket(mall, true);
  // console.log(`Set Market at: ${tx.hash}`);
  // await tx.wait();

  // // create first token
  // let category = await creatorContrat.categories();
  // let nature = await creatorContrat.natures();
  // tx = await creatorContrat
  //   .connect(signer1)
  //   .createToken(user1, id1, 5, 100, 1000, category[1], nature[1], {
  //     value: ethers.utils.parseEther("0.01"),
  //   });
  // console.log(`Created first NFT token at: ${tx.hash}`);
  // await tx.wait();

  // // set physical creator
  // tx = await creatorContrat.connect(signer1).setPhysicalCreator([user2], true);
  // console.log(`Set physical creator at: ${tx.hash}`);
  // await tx.wait();
  // tx = await creatorContrat.connect(signer1).setPhysicalCreator([user3], true);
  // console.log(`Set physical creator at: ${tx.hash}`);
  // await tx.wait();

  // // create second market
  // tx = await creatorContrat
  //   .connect(signer2)
  //   .createToken(user2, id2, 15, 100, 1500, category[0], nature[0], {
  //     value: ethers.utils.parseEther("0.01"),
  //   });
  // console.log(`Created second NFT token at: ${tx.hash}`);
  // await tx.wait();

  // // create third market
  // tx = await creatorContrat
  //   .connect(signer3)
  //   .createToken(user3, id3, 50, 100, 2000, category[0], nature[2], {
  //     value: ethers.utils.parseEther("0.01"),
  //   });
  // console.log(`Created third NFT token at: ${tx.hash}`);
  // await tx.wait();

  // // mint new token
  // tx = await creatorContrat.connect(signer2).mint(user2, id2, 5);
  // console.log(`Minted token at: ${tx.hash}`);
  // await tx.wait();

  // tx = await creatorContrat.connect(signer3).mint(user3, id3, 23);
  // console.log(`Minted token at: ${tx.hash}`);
  // await tx.wait();

  // //set royalty info
  // tx = await creatorContrat
  //   .connect(signer1)
  //   .setRoyaltyInfo(user1, [user1, user2], [300, 700], id1, 2500);
  // console.log(`Set royalty info at: ${tx.hash}`);
  // await tx.wait();

  // tx = await creatorContrat
  //   .connect(signer2)
  //   .setRoyaltyInfo(user2, [user2], [1000], id2, 500);
  // console.log(`Set royalty info at: ${tx.hash}`);
  // await tx.wait();

  // tx = await creatorContrat
  //   .connect(signer3)
  //   .setRoyaltyInfo(user3, [user3, user1, user2], [700, 270, 30], id3, 5000);
  // console.log(`Set royalty info at: ${tx.hash}`);
  // await tx.wait();

  // // //////////////////////////////////////////////////////////////////////////////////

  // // Listing Auction
  // tx = await mallContract
  //   .connect(signer1)
  //   .listAuction(creators, id1, 1, 0, 100, priceRcdy, 1);
  // console.log(`Listing Auction at: ${tx.hash}`);
  // await tx.wait();

  // let ans = ethers.BigNumber.from(priceRcdy).mul(4);
  // tx = await mallContract
  //   .connect(signer2)
  //   .listAuction(creators, id2, 4, 0, 86400 * 7, ans, 1);
  // console.log(`Listing Auction at: ${tx.hash}`);
  // await tx.wait();

  // ans = ethers.BigNumber.from(priceRcdy).mul(16);
  // tx = await mallContract
  //   .connect(signer3)
  //   .listAuction(creators, id3, 16, 86400 * 7, 86400 * 3, ans, 1);
  // console.log(`Listing Auction at: ${tx.hash}`);
  // await tx.wait();

  // // transfer and approval RCDY
  // tx = await rcdyContrat
  //   .connect(signer1)
  //   .transfer(user2, ethers.utils.parseEther("1000000"));
  // console.log(`Transfered tokens at: ${tx.hash}`);
  // await tx.wait();

  // tx = await rcdyContrat
  //   .connect(signer1)
  //   .transfer(user3, ethers.utils.parseEther("1000000"));
  // console.log(`Transfered tokens at: ${tx.hash}`);
  // await tx.wait();

  // ans = ethers.BigNumber.from(priceRcdy).mul(10000);
  // tx = await rcdyContrat.connect(signer1).approve(mall, ans);
  // console.log(`Approved mall of RCDY at: ${tx.hash}`);
  // await tx.wait();

  // tx = await rcdyContrat.connect(signer2).approve(mall, ans);
  // console.log(`Approved mall of RCDY at: ${tx.hash}`);
  // await tx.wait();

  // tx = await rcdyContrat.connect(signer3).approve(mall, ans);
  // console.log(`Approved mall of RCDY at: ${tx.hash}`);
  // await tx.wait();

  // // make a bid
  // ans = ethers.BigNumber.from(priceRcdy).mul(4);
  // tx = await mallContract.connect(signer3).bid(2, ans);
  // console.log(`Bidded at: ${tx.hash}`);
  // await tx.wait();

  // let tx = await mallContract.connect(signer2).closeBid(1);
  // console.log(`Bidded at: ${tx.hash}`);
  // await tx.wait();

  // // create market
  // tx = await mallContract
  //   .connect(signer1)
  //   .listMarket(creators, id1, 1, priceEth, 1, 0);
  // console.log(`Created market at: ${tx.hash}`);
  // await tx.wait();

  // ans = ethers.BigNumber.from(priceEth).mul(3);
  // tx = await mallContract
  //   .connect(signer2)
  //   .listMarket(creators, id2, 1, ans, 1, 0);
  // console.log(`Created market at: ${tx.hash}`);
  // await tx.wait();

  ans = ethers.BigNumber.from(priceRcdy).mul(2);
  // tx = await mallContract
  //   .connect(signer3)
  //   .listMarket(creators, id3, 1, ans, 1, 1);
  // console.log(`Created market at: ${tx.hash}`);
  // await tx.wait();

  tx = await mallContract
    .connect(signer3)
    .listMarket(creators, id3, 1, ans, 1, 1);
  console.log(`Created market at: ${tx.hash}`);
  await tx.wait();

  // buy market
  tx = await mallContract.connect(signer2).buyWithETH(1, {
    value: priceEth,
  });
  tx = await mallContract.connect(signer1).buyWithRCDY(4);

  tx = await mallContract.connect(signer3).delistMarket(3);
  console.log(`Delisted market at: ${tx.hash}`);
  await tx.wait();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

// Deploying RC3_Creators...
// RC3_Creators Deployed to: 0x5bF78b986Faf3Ee0abBE73190e4a993816220263
// Deploying RC3_Mall...
// RC3_Mall Deployed to: 0x43DAF3D7336f822698078538e239E4744e4F578D
// Compiling ethers contracts...
// Set Market at: 0x07d79e67ed84a7fa2d9725d7b2ad96ffffb6dd26a614d02225a9c58310a0144e
// Created first NFT token at: 0xc83627b28cc398664d09b07db6f03403b7314f3987378f4bb75f355be236e9a9
// Set physical creator at: 0x52ee68f3fab83dc5cf827e736a46df43a23a8d352765a0a64063c0dff2e3c001
// Set physical creator at: 0x7e609b183e45145923244e18a1501f89dec154df74bf5d72b8f400048a147ed9
// Created second NFT token at: 0x9a760d56348715a3712c53df3e323f2769f3a066d7d2cfee7c458e1e40840b46
// Created third NFT token at: 0x2acb4898f86c7e03b1484135b4d073c104649b8705221a7b6ad9bdd19f75694c
// Minted token at: 0xfd48a02d20f338d0e8af8e89f762d76f589bb86ff7dec09fb4c5dcc5ea191c0d
// Minted token at: 0x053927e435851e06ee16e1edb968263151bac359fad5cee6649e119ea5397e7b
// Set royalty info at: 0x970ef06afc6848093454e393e3d0836754ba2779cbb9654f815944e8965837dc
// Set royalty info at: 0xa0c7ab77145e17ff9bf8e16053544ef7b9d92cd84b2d8461b559040ae509048c
// Set royalty info at: 0x0cc9fdf34443de518f130ac846c15f79418ad554864b118559062ffdbdb7f5c5
// Listing Auction at: 0xef29fef65f05de7f60e18d8ebea5b074a9728e48bfde3fe84f22b0cb04ec6a0d
// Listing Auction at: 0x48a7face4a34a6cae8846bd5631f5301bcc0e5b7fcabe2ede74739a3ed45f6e3
// Listing Auction at: 0xa2d7f421db750ac6a89c22689c0efe2b93875e3481e5f2d018aa746d98c2b04b
// Transfered tokens at: 0x3fee40a55915aae003ff9285b8b239e662ac2e50c1d3c37eb239a2820bd153dc
// Transfered tokens at: 0xb6d479e1f602a266351a54c7deed83dc37c8a4d832fca6d8188f0f9f29bd63b4
// Approved mall of RCDY at: 0xf92289f60bc9bdeac6abc51102c8ad8ed3e0ace02a82c3dc3e3724eaa5c48e69
// Approved mall of RCDY at: 0x019544782aeb5a29c0e24b94fe148124f4658dfc3e29a96b308993a5926b4d35
// Approved mall of RCDY at: 0x735ca717ee22bd6de1ef68353c1e1d99a703e972b02b650e2bc93ca33c0bd886
// Bidded at: 0x1f23fd4082d0cd20fa3fde78beb3f8949773d79b810ded903a7c014d4a45a2b9
// Bidded at: 0xef594220c8f5f4f658c33dc8806d49b15e5330314af59079171b6c6e2117fe25
// Created market at: 0x60eb92f34ff4c1f90b40abd0d9a9a8486103b65b8a88f3e87ad572d4cde0fb5a
// Created market at: 0x7c87e13867dc3dc1dd542e10f6e66fe4e86837dbae745b0c2f8ea24be048055d
// Created market at: 0xe24b0b9736cb85ac17a3b0e5f3126b4f5e166046fcbb5487d88d25b7844b8eac
