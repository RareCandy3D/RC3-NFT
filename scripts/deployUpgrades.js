async function main() {
  const admin = "0xf923d0f9f2d61dC7D538241305cB62c7f4BF8D3A";
  const rcdy = "0xc32E5B6990E15dfCf0E8CeeD3f06f778FF6C9c33";

  const RC3_Mall = await hre.ethers.getContractFactory("RC3_Mall");

  console.log("Deploying Mall...");

  const mall = await upgrades.deployProxy(
    RC3_Mall,
    [admin, rcdy, admin, 2300, 2500],
    { initializer: "initialize" }
  );

  await mall.deployed();
  console.log("RC3_Mall Deployed to:", mall.address);

  // GNOSIS Admin

  //   const safe = "0x8BAE99c6E191242Fb45F3e10e695A43AC4AFF818";
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
