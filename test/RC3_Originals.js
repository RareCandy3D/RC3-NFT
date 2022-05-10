const chai = require("chai");
const { expect } = require("chai");
const { solidity } = require("ethereum-waffle");
// const { recoverAddress } = require("ethers/lib/utils");

chai.use(solidity);

describe("RC3_Originals", function () {
  let rc3, addr0, addr1, addr2, RC3_Originals;

  before(async function () {
    [addr0, addr1, addr2] = await ethers.getSigners();
    RC3_Originals = await ethers.getContractFactory("RC3_Originals");
    rc3 = await RC3_Originals.deploy(addr0.address, "www.raecandy.xyz/");
    await rc3.deployed();
  });

  it("should deploy contract properly", async () => {
    expect(await rc3.baseTokenURI()).to.equal("www.raecandy.xyz/");
    const arrCat = await rc3.categories(1);
    const arrNat = await rc3.natures(2);
    expect(arrCat).to.equal(await rc3.stringToBytes32("MUSIC"));
    expect(arrNat).to.equal(await rc3.stringToBytes32("PHYGITAL"));

    const x = await rc3.stringToBytes32("ADMIN_ROLE");
    expect("ADMIN_ROLE").to.equal(await rc3.bytes32ToString(x));
    expect((await rc3.royalty()).toString()).to.equal("1500");
    expect(await rc3.supportsInterface(0x2a55205a)).to.equal(true);
  });

  it("should not mint if a wrong category or nature gets inputted", async () => {
    await expect(
      rc3.mint(
        "myownip.xyz/",
        addr1.address,
        rc3.categories(0),
        rc3.stringToBytes32("CHEMICAL")
      )
    ).to.revertedWith("ONLY_VALID_NATURE");

    expect((await rc3.totalSupply()).toString()).to.equal("0");

    await expect(
      rc3.mint(
        "myownip.xyz/",
        addr1.address,
        rc3.stringToBytes32("CHEMICAL"),
        rc3.natures(0)
      )
    ).to.revertedWith("ONLY_CREATED_CATEGORY");

    expect((await rc3.totalSupply()).toString()).to.equal("0");
  });

  it("should not mint if caller isn't a minter", async () => {
    await expect(
      rc3
        .connect(addr1)
        .mint("myownip.xyz/", addr1.address, rc3.categories(0), rc3.natures(2))
    ).to.revertedWith("MINTER_ONLY");

    expect((await rc3.totalSupply()).toString()).to.equal("0");
  });

  it("should mint proper", async () => {
    await rc3.grantRole(await rc3.MINTER_ROLE(), addr1.address);
    expect(await rc3.hasRole(await rc3.MINTER_ROLE(), addr1.address)).to.equal(
      true
    );
    await rc3
      .connect(addr1)
      .mint("myownip.xyz/", addr1.address, rc3.categories(0), rc3.natures(0));
    expect((await rc3.totalSupply()).toString()).to.equal("1");
    expect(await rc3.ownerOf(1)).to.equal(addr1.address);
    expect(await rc3.tokenURI(1)).to.equal("www.raecandy.xyz/myownip.xyz/");
    expect((await rc3.tokenByIndex(0)).toString()).to.equal("1");

    const info = await rc3.getInfo(1);
    expect(info[0]).to.equal(addr1.address);
    expect(info[1]).to.equal(await rc3.natures(0));
    expect(info[2]).to.equal(await rc3.categories(0));

    const royalty = await rc3.royaltyInfo(
      1,
      ethers.utils.parseUnits("10", "ether")
    );
    expect(royalty[0]).to.equal(addr1.address);
    expect(royalty[1].toString()).to.equal(
      ethers.utils.parseUnits("1.5", "ether").toString()
    );
  });

  it("should set royalty info properly", async () => {
    await expect(rc3.setRoyaltyInfo(1, addr2.address)).to.revertedWith(
      "UNAUTHORIZED_CALLER"
    );
    await rc3.connect(addr1).setRoyaltyInfo(1, addr2.address);

    const royalty = await rc3.royaltyInfo(1, 10000);
    expect(royalty[0]).to.equal(addr2.address);
  });

  it("should update markets properly", async () => {
    //in real, would be a contract address of a market place
    expect(await rc3.isWhitelistedMarket(addr2.address)).to.equal(false);
    await expect(
      rc3.connect(addr1).setMarket(addr2.address, true)
    ).to.revertedWith("ADMIN_ONLY");

    await rc3.setMarket(addr2.address, true);
    expect(await rc3.isWhitelistedMarket(addr2.address)).to.equal(true);
  });
});
