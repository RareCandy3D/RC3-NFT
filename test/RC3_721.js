const chai = require("chai");
const { expect } = require("chai");
const { solidity } = require("ethereum-waffle");

chai.use(solidity);

describe("RC3_721", function () {
  let rc3, addr0, addr1, addr2, RC3_721;

  before(async function () {
    [addr0, addr1, addr2] = await ethers.getSigners();
    RC3_721 = await ethers.getContractFactory("RC3_721");
    rc3 = await RC3_721.deploy(
      "Token Name",
      "TNM",
      "www.raecandy.xyz/",
      addr0.address,
      1500
    );
  });

  it("should deploy contract properly", async () => {
    expect(await rc3.baseURI()).to.equal("www.raecandy.xyz/");

    expect((await rc3.royalty()).toString()).to.equal("1500");
    expect(await rc3.supportsInterface(0x2a55205a)).to.equal(true);
  });

  it("should not mint if caller isn't a minter", async () => {
    await expect(rc3.connect(addr1).mint(addr1.address)).to.revertedWith(
      "UNAUTHORIZED_CALLER"
    );

    expect((await rc3.totalSupply()).toString()).to.equal("0");
  });

  it("should mint proper", async () => {
    await rc3.mint(addr1.address);
    expect((await rc3.totalSupply()).toString()).to.equal("1");
    expect(await rc3.ownerOf(1)).to.equal(addr1.address);
    expect(await rc3.tokenURI(1)).to.equal("www.raecandy.xyz/1");
    expect((await rc3.tokenByIndex(0)).toString()).to.equal("1");

    const royalty = await rc3.royaltyInfo(1000);
    expect(royalty[0]).to.equal(addr0.address);
    expect(royalty[1].toString()).to.equal("150");
  });

  it("should set royalty info properly", async () => {
    await expect(
      rc3.connect(addr1).setRoyaltyInfo(addr2.address)
    ).to.revertedWith("UNAUTHORIZED_CALLER");
    await rc3.setRoyaltyInfo(addr2.address);

    const royalty = await rc3.royaltyInfo(10000);
    expect(royalty[0]).to.equal(addr2.address);
    expect(royalty[1].toString()).to.equal("1500");
  });

  it("should update markets properly", async () => {
    //in real, would be a contract address of a market place
    expect(await rc3.isWhitelistedMarket(addr2.address)).to.equal(false);
    await expect(
      rc3.connect(addr1).setMarket(addr2.address, true)
    ).to.revertedWith("UNAUTHORIZED_CALLER");

    await rc3.setMarket(addr2.address, true);
    expect(await rc3.isWhitelistedMarket(addr2.address)).to.equal(true);
  });
});
