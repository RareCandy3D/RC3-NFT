const chai = require("chai");
const { expect } = require("chai");
const { solidity } = require("ethereum-waffle");
// const { recoverAddress } = require("ethers/lib/utils");

chai.use(solidity);

describe("RC3_Creators", function () {
  let rc3, addr0, addr1, addr2, addr3, RC3_Creators;

  before(async function () {
    [addr0, addr1, addr2, addr3] = await ethers.getSigners();
    RC3_Creators = await ethers.getContractFactory("RC3_Creators");
    rc3 = await RC3_Creators.deploy(addr0.address, "www.raecandy.xyz/");
    await rc3.deployed();
  });

  it("should deploy contract properly", async () => {
    const arrCat = await rc3.categories(1);
    const arrNat = await rc3.natures(2);
    expect(arrCat).to.equal(await rc3.stringToBytes32("MUSIC"));
    expect(arrNat).to.equal(await rc3.stringToBytes32("PHYGITAL"));

    const x = await rc3.stringToBytes32("FRIENDLY");
    expect("FRIENDLY").to.equal(await rc3.bytes32ToString(x));
    expect(await rc3.supportsInterface(0x2a55205a)).to.equal(true);
  });

  it("should behave properly when creating category", async () => {
    await expect(rc3.createCategory(rc3.categories(0))).to.revertedWith(
      "NON_CREATED_CATEGORY_ONLY"
    );
    await rc3.createCategory(await rc3.stringToBytes32("HARMONY"));
    expect(await rc3.categories(3)).to.equal(
      await rc3.stringToBytes32("HARMONY")
    );

    const arrCat = await rc3.categories(3);
    expect(arrCat).to.equal(await rc3.stringToBytes32("HARMONY"));
  });

  it("should respond properly for admin functions", async () => {
    await expect(
      rc3.connect(addr2).setFeeCollector(addr2.address)
    ).to.revertedWith("ERR_ADMIN_ONLY");

    await expect(rc3.connect(addr2).setURI("headache.com/")).to.revertedWith(
      "ERR_ADMIN_ONLY"
    );

    expect(await rc3.feeReceipient()).to.equal(
      "0x0000000000000000000000000000000000000000"
    );

    await rc3.setFeeCollector(addr3.address);
    await rc3.setURI("headache.com/");
    expect(await rc3.feeReceipient()).to.equal(addr3.address);

    //in real, would be a contract address of a market place
    expect(await rc3.isWhitelistedMarket(addr2.address)).to.equal(false);
    await expect(
      rc3.connect(addr1).setMarket(addr2.address, true)
    ).to.revertedWith("ERR_ADMIN_ONLY");

    await rc3.setMarket(addr2.address, true);
    expect(await rc3.isWhitelistedMarket(addr2.address)).to.equal(true);
    await rc3.setMarket(addr2.address, false);
  });

  it("should create token properly", async () => {
    await expect(
      rc3.createToken(
        addr0.address,
        10,
        5,
        1000,
        rc3.categories(3),
        rc3.natures(2),
        "typeone.com/",
        { value: ethers.utils.parseEther("0.01") }
      )
    ).to.revertedWith("SUPPLY_ERR");

    await expect(
      rc3.createToken(
        addr0.address,
        10,
        100,
        5100,
        rc3.categories(3),
        rc3.natures(2),
        "typeone.com/",
        { value: ethers.utils.parseEther("0.01") }
      )
    ).to.revertedWith("MAX_ROYALTY_EXCEEDED");

    await expect(
      rc3
        .connect(addr1)
        .createToken(
          addr0.address,
          10,
          100,
          1000,
          rc3.categories(3),
          rc3.natures(2),
          "typeone.com/",
          { value: ethers.utils.parseEther("0.009") }
        )
    ).to.revertedWith("FEE_NOT_SENT");

    expect(
      (await ethers.provider.getBalance(addr3.address)).toString()
    ).to.equal(ethers.utils.parseEther("10000"));

    expect(await rc3.exists(1)).to.equal(false);
    await expect(rc3.getInfo(1)).to.revertedWith("NON_EXISTENT_ID");

    await rc3
      .connect(addr1)
      .createToken(
        addr1.address,
        10,
        100,
        1000,
        rc3.categories(1),
        rc3.natures(2),
        "typeone.com/",
        { value: ethers.utils.parseEther("0.01") }
      );

    await rc3
      .connect(addr2)
      .createToken(
        addr1.address,
        10,
        100,
        1000,
        rc3.categories(0),
        rc3.natures(1),
        "typetwo.com/",
        { value: ethers.utils.parseEther("0.01") }
      );

    expect(await rc3.uri(1)).to.equal("typeone.com/");
    expect(
      (await ethers.provider.getBalance(addr3.address)).toString()
    ).to.equal(ethers.utils.parseEther("10000.02"));
    expect(await rc3.creator(1)).to.equal(addr1.address);
    expect(await rc3.exists(1)).to.equal(true);

    const info = await rc3.getInfo(1);
    expect(info[0]).to.equal(addr1.address);
    expect(info[1]).to.equal(await rc3.natures(2));
    expect(info[2]).to.equal(await rc3.categories(1));
    expect(info[3].toString()).to.equal("10");
    expect(info[4].toString()).to.equal("100");
    expect(info[5].toString()).to.equal("1000");
    expect(info[6]).to.equal("typeone.com/");

    const royalty = await rc3.royaltyInfo(1, 10000);
    expect(royalty[0]).to.equal(addr1.address);
    expect(royalty[1].toString()).to.equal("1000");
  });

  it("should respond properly for creator related functions", async () => {
    expect(await rc3.canMint(1, addr2.address)).to.equal(false);
    await expect(rc3.setMinter(1, addr2.address, true)).to.be.revertedWith(
      "ERR_ONLY_CREATOR"
    );
    await rc3.connect(addr1).setMinter(1, addr2.address, true);
    expect(await rc3.canMint(1, addr2.address)).to.equal(true);

    await expect(rc3.mint(addr3.address, 1, 1)).to.revertedWith(
      "ERR_ONLY_MINTER"
    );

    await expect(rc3.mint(addr3.address, 1, 1)).to.revertedWith(
      "ERR_ONLY_MINTER"
    );

    await expect(rc3.mintBatch(addr3.address, [1, 2], [1, 1])).to.revertedWith(
      "ERR_ONLY_MINTER"
    );

    await rc3.connect(addr2).mint(addr2.address, 1, 1);
    expect((await rc3.tokenSupply(1)).toString()).to.equal("11");

    await expect(rc3.setCustomURI(1, "www")).to.revertedWith(
      "ERR_ONLY_CREATOR"
    );
    await rc3.connect(addr1).setCustomURI(1, "");
    expect(await rc3.uri(1)).to.equal("headache.com/");

    await rc3.connect(addr1).setApprovalForAll(addr2.address, true);
    await rc3.connect(addr2).burn(addr1.address, 1, 5);
    expect((await rc3.tokenSupply(1)).toString()).to.equal("6");
    expect((await rc3.balanceOf(addr1.address, 1)).toString()).to.equal("5");
    let bal = await rc3.balanceOfBatch([addr1.address, addr2.address], [1, 1]);
    expect(bal[0].toString()).to.equal("5");
    expect(bal[1].toString()).to.equal("1");

    await rc3.connect(addr2).mintBatch(addr2.address, [1, 2], [1, 1]);
    bal = await rc3.balanceOfBatch([addr2.address, addr2.address], [1, 2]);
    expect(bal[0].toString()).to.equal("2");
    expect(bal[1].toString()).to.equal("1");

    await rc3.connect(addr2).burnBatch(addr2.address, [1, 2], [1, 1]);
    bal = await rc3.balanceOfBatch([addr2.address, addr2.address], [1, 2]);
    expect(bal[0].toString()).to.equal("1");
    expect(bal[1].toString()).to.equal("0");

    const info = await rc3.getInfo(1);
    expect(info[4].toString()).to.equal("94");

    await rc3
      .connect(addr1)
      .setRoyaltyInfo(
        addr1.address,
        [addr0.address, addr1.address],
        [300, 700],
        1,
        2000
      );

    const royinfo = await rc3.splitRoyaltyInfo(1, 1000);
    expect(royinfo[2].toString()).to.equal("200");

    const recipients = royinfo[0];
    const shares = royinfo[1];
    expect(recipients[0]).to.equal(addr0.address);
    expect(recipients[1]).to.equal(addr1.address);
    expect(shares[0].toString()).to.equal("300");
    expect(shares[1].toString()).to.equal("700");
  });
});
