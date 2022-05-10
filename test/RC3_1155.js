const chai = require("chai");
const { expect } = require("chai");
const { solidity } = require("ethereum-waffle");
// const { recoverAddress } = require("ethers/lib/utils");

chai.use(solidity);

describe("RC3_1155", function () {
  let rc3, addr0, addr1, addr2, addr3, RC3_1155;

  before(async function () {
    [addr0, addr1, addr2, addr3] = await ethers.getSigners();
    RC3_1155 = await ethers.getContractFactory("RC3_1155");
    rc3 = await RC3_1155.deploy("TokenName", "TNM", "www.raecandy.xyz/", 1000);
    await rc3.deployed();
  });

  it("should deploy contract properly", async () => {
    expect(await rc3.name()).to.equal("TokenName");
    expect(await rc3.symbol()).to.equal("TNM");
    expect(Number(await rc3.royalty())).to.equal(1000);
    await expect(rc3.uri(1)).to.revertedWith(
      "ERC1155Tradable#uri: NONEXISTENT_TOKEN"
    );
    expect(await rc3.supportsInterface(0x2a55205a)).to.equal(true);
  });

  it("should respond properly for admin functions", async () => {
    await expect(rc3.connect(addr2).setURI("/")).to.revertedWith(
      "UNAUTHORIZED_CALLER"
    );

    await rc3.setURI("headache.com/");

    //in real, would be a contract address of a market place
    expect(await rc3.isWhitelistedMarket(addr2.address)).to.equal(false);
    await expect(
      rc3.connect(addr1).setMarket(addr2.address, true)
    ).to.revertedWith("UNAUTHORIZED_CALLER");

    await rc3.setMarket(addr2.address, true);
    expect(await rc3.isWhitelistedMarket(addr2.address)).to.equal(true);
    expect(await rc3.isApprovedForAll(addr0.address, addr2.address)).to.equal(
      true
    );
    await rc3.setMarket(addr2.address, false);
    expect(await rc3.isApprovedForAll(addr0.address, addr2.address)).to.equal(
      false
    );

    await expect(
      rc3.create(
        "0x0000000000000000000000000000000000000000",
        3,
        2,
        "mytoken.com/"
      )
    ).to.revertedWith("SUPPLY_ERR");

    await expect(
      rc3
        .connect(addr1)
        .create(
          "0x0000000000000000000000000000000000000000",
          1,
          2,
          "mytoken.com/"
        )
    ).to.revertedWith("UNAUTHORIZED_CALLER");

    await expect(
      rc3.create(
        "0x0000000000000000000000000000000000000000",
        1,
        2,
        "mytoken.com/"
      )
    ).to.revertedWith("ERC1155: mint to the zero address");

    await rc3.create(addr1.address, 4, 10, "mytoken.com/");
    expect(await rc3.exists(1)).to.equal(true);
    expect(await rc3.uri(1)).to.equal("mytoken.com/");
    expect(Number(await rc3.maxSupply(1))).to.equal(10);
    expect(Number(await rc3.totalSupply(1))).to.equal(4);

    const royalty = await rc3.royaltyInfo(1, 10000);
    expect(royalty[0]).to.equal(addr0.address);
    expect(royalty[1].toString()).to.equal("1000");

    await rc3.setCreator(addr1.address, [1]);
    expect(await rc3.creators(1)).to.equal(addr1.address);
  });

  it("should respond properly for creator related functions", async () => {
    await expect(rc3.setCreator(addr1.address, [1])).to.revertedWith(
      "ONLY_CREATOR_ALLOWED"
    );

    await expect(rc3.mint(addr3.address, 1, 1)).to.revertedWith(
      "ONLY_CREATOR_ALLOWED"
    );

    await rc3.create(addr1.address, 1, 10, "mytoken2.com/");
    await rc3.setCreator(addr1.address, [2]);

    await expect(rc3.mintBatch(addr3.address, [1, 2], [1, 1])).to.revertedWith(
      "ONLY_CREATOR_ALLOWED"
    );

    await rc3.connect(addr1).mintBatch(addr2.address, [1, 2], [1, 1]);
    await rc3.connect(addr1).mint(addr2.address, 1, 1);
    expect((await rc3.totalSupply(1)).toString()).to.equal("6");
    expect((await rc3.totalSupply(2)).toString()).to.equal("2");

    await expect(rc3.setCustomURI(1, "www")).to.revertedWith(
      "ONLY_CREATOR_ALLOWED"
    );
    await rc3.connect(addr1).setCustomURI(1, "");
    expect(await rc3.uri(1)).to.equal("headache.com/");

    await rc3.connect(addr1).setApprovalForAll(addr2.address, true);
    await rc3.connect(addr2).burn(addr1.address, 1, 3);
    expect(Number(await rc3.maxSupply(1))).to.equal(7);
    expect((await rc3.totalSupply(1)).toString()).to.equal("3");
    expect((await rc3.balanceOf(addr1.address, 1)).toString()).to.equal("1");
    let bal = await rc3.balanceOfBatch([addr1.address, addr2.address], [1, 1]);
    expect(bal[0].toString()).to.equal("1");
    expect(bal[1].toString()).to.equal("2");

    await rc3.connect(addr2).burnBatch(addr1.address, [1, 2], [1, 1]);
    expect(Number(await rc3.maxSupply(2))).to.equal(9);
    bal = await rc3.balanceOfBatch([addr1.address, addr1.address], [1, 2]);
    expect(bal[0].toString()).to.equal("0");
    expect(bal[1].toString()).to.equal("0");
  });
});
