async function main() {
  const admin = "0xf923d0f9f2d61dC7D538241305cB62c7f4BF8D3A";
  const rcdy = "0xc32E5B6990E15dfCf0E8CeeD3f06f778FF6C9c33";

  const RC3_Mall = await hre.ethers.getContractFactory("RC3_Mall");

  console.log("Deploying Mall...");

  const mall = await upgrades.prepareUpgrade(
    "0x325f79eAC1E6036ECCCa21EfFCD6d3fBD93374E3",
    RC3_Mall
  );

  console.log("Upgrade Implementation address:", mall);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
