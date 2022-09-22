const chai = require("chai");
const { expect } = require("chai");
const { solidity } = require("ethereum-waffle");

chai.use(solidity);

describe("RC3 Auction", () => {
  let mall,
    rcdy,
    rc3,
    rc33,
    addr0,
    addr1,
    addr2,
    addr3,
    addr4,
    addr5,
    addr6,
    amount,
    RCDY,
    RC3,
    RC33,
    RC3_Mall;

  before(async () => {
    [addr0, addr1, addr2, addr3, addr4, addr5, addr6] =
      await ethers.getSigners();
    RC3_Mall = await ethers.getContractFactory("RC3_Mall");
    RCDY = await ethers.getContractFactory("RCDY");
    RC3 = await ethers.getContractFactory("RC3_Originals");
    RC33 = await ethers.getContractFactory("RC3_1155");
    rcdy = await RCDY.deploy();
    rc3 = await RC3.deploy(addr0.address, "www.raecandy.xyz/");
    rc33 = await RC33.deploy("Name", "Symbol", "www.rarecandy.xyz/", 1000);

    await rc3.deployed();
    await rc33.deployed();
    await rcdy.deployed();

    mall = await RC3_Mall.deploy();
    await mall.deployed();
    await mall.initialize(
      addr0.address,
      rcdy.address,
      addr5.address,
      2300,
      2500
    );
    await rc3.mint(
      "myownip.xyz/",
      addr1.address,
      rc3.categories(0),
      rc3.natures(0)
    );
    await rc33.create(addr2.address, 4, 10, "mytoken.com/");
    await rc33.mint(addr3.address, 1, 4);
    expect(await rc3.ownerOf(1)).to.equal(addr1.address);
    expect(Number(await rc33.balanceOf(addr2.address, 1))).to.equal(4);
    await rc3.setMarket(mall.address, true);
    await rc33.setMarket(mall.address, true);
    amount = await ethers.utils.parseUnits("1000", "ether");
    await rcdy.transfer(addr3.address, amount);
    await rcdy.connect(addr3).approve(mall.address, amount);
    await rcdy.transfer(addr4.address, amount);
    await rcdy.connect(addr4).approve(mall.address, amount);
  });

  describe("RC3_Auction", () => {
    it("should deploy contract properly", async () => {
      expect((await mall.auctionId()).toString()).to.equal("0");
      expect((await mall.auctionsClosed()).toString()).to.equal("0");
      expect((await mall.feePercentage()).toString()).to.equal("2300");
      expect((await mall.feeRecipient()).toString()).to.equal(addr5.address);
    });

    it("should properly create an auction", async () => {
      let auc = await mall.getAuction(1);
      expect(auc[0].toString()).to.equal(
        "0x0000000000000000000000000000000000000000"
      );

      await mall
        .connect(addr1)
        .listAuction(
          rc3.address,
          1,
          0,
          1000,
          60 * 60 * 24,
          ethers.utils.parseUnits("1", "ether"),
          0
        );

      const [first, last] = await mall.bidTimeRemaining(1);
      expect(first.toString()).to.equal("1000");
      expect(last.toString()).to.equal("87400");

      await expect(
        mall
          .connect(addr2)
          .listAuction(
            rc33.address,
            1,
            0,
            1000,
            60 * 60 * 24,
            ethers.utils.parseUnits("1", "ether"),
            1
          )
      ).to.revertedWith("INVALID_AMOUNT");

      await mall
        .connect(addr2)
        .listAuction(
          rc33.address,
          1,
          4,
          1000,
          60 * 60 * 24,
          ethers.utils.parseUnits("1", "ether"),
          1
        );

      auc = await mall.getAuction(1);

      expect(auc[0].toString()).to.equal(addr1.address);
      expect(auc[1].toString()).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(auc[2].toString()).to.equal(rc3.address);
      expect(auc[3].toString()).to.equal("1");
      expect(auc[4].toString()).to.equal("1");
      expect(auc[5].toString()).to.equal(
        ethers.utils.parseUnits("1", "ether").toString()
      );
      expect(auc[6].toString()).to.equal("0");
      expect(auc[9].toString()).to.equal("0");
      expect(auc[10].toString()).to.equal("0");
      expect(auc[11].toString()).to.equal("0");

      await expect(mall.closeBid(1)).to.revertedWith("INVALID_TIME");
    });

    it("should bid properly", async () => {
      await expect(mall.bid(1, amount)).to.revertedWith("AUCTION_NOT_STARTED");
      await expect(mall.bid(3, amount)).to.revertedWith("AUCTION_ENDED");

      await hre.ethers.provider.send("evm_increaseTime", [1000]);
      expect((await mall.nextBidAmount(1)).toString()).to.equal(
        ethers.utils.parseUnits("1", "ether").toString()
      );

      await expect(mall.connect(addr1).bid(1, amount)).to.revertedWith(
        "OWNER_CANNOT_BID"
      );

      let amt = await mall.nextBidAmount(1);

      await mall.connect(addr3).bid(1, amt);
      let auc = await mall.getAuction(1);
      expect(auc[1]).to.equal(addr3.address);
      expect(auc[6].toString()).to.equal(amt.toString());
      expect(auc[9].toString()).to.equal("1");
      await expect(mall.connect(addr4).bid(1, amt)).to.revertedWith(
        "INVALID_INPUT_AMOUNT"
      );
      amt = await mall.nextBidAmount(1);
      await mall.connect(addr4).bid(1, amt);
      auc = await mall.getAuction(1);
      expect(auc[1]).to.equal(addr4.address);
      expect(auc[6].toString()).to.equal(amt.toString());
      expect(auc[9].toString()).to.equal("2");

      await expect(mall.closeBid(1)).to.revertedWith("INVALID_TIME");
      let [, eTime] = await mall.bidTimeRemaining(1);
      console.log(eTime.toString());

      await hre.ethers.provider.send("evm_increaseTime", [
        Number(eTime) - 2000,
      ]);
      amt = await mall.nextBidAmount(1);

      await mall.connect(addr3).bid(1, amt);
      auc = await mall.getAuction(1);
      expect(auc[1]).to.equal(addr3.address);
      expect(auc[6].toString()).to.equal(amt.toString());
      expect(auc[9].toString()).to.equal("3");

      let [, newETime] = await mall.bidTimeRemaining(1);
      expect(Number(newETime)).to.equal(2600);
    });

    it("should close bid properly", async () => {
      await hre.ethers.provider.send("evm_increaseTime", [5000]);
      expect((await rcdy.balanceOf(mall.address)).toString()).to.equal(
        ethers.utils.parseUnits("1.21", "ether").toString()
      );
      expect((await rc3.ownerOf(1)).toString()).to.equal(mall.address);
      expect((await rc33.balanceOf(mall.address, 1)).toString()).to.equal("4");
      await expect(
        mall.connect(addr3).bid(1, mall.nextBidAmount(1))
      ).to.revertedWith("AUCTION_ENDED");

      await mall.closeBid(1);
      await mall.closeBid(2);
      expect((await rcdy.balanceOf(mall.address)).toString()).to.equal("0");
      expect((await rc33.balanceOf(mall.address, 1)).toString()).to.equal("0");
      expect((await rc33.balanceOf(addr2.address, 1)).toString()).to.equal("4");
      expect((await rcdy.balanceOf(addr5.address)).toString()).to.equal(
        ethers.utils.parseUnits("0.02783", "ether").toString()
      );
      expect((await rcdy.balanceOf(addr1.address)).toString()).to.equal(
        ethers.utils.parseUnits("1.18217", "ether").toString()
      );
      expect((await rc3.ownerOf(1)).toString()).to.equal(addr3.address);
    });
  });

  describe("RC3_Mall", () => {
    it("should deploy contract properly", async () => {
      expect((await mall.marketId()).toString()).to.equal("0");
      expect((await mall.marketsSold()).toString()).to.equal("0");
      expect((await mall.marketsDelisted()).toString()).to.equal("0");
      expect((await mall.ethFee()).toString()).to.equal("2500");
    });

    it("should act properly for admin functions", async () => {
      await expect(
        mall.connect(addr1).setFeeRecipient(addr1.address)
      ).to.revertedWith("Ownable: caller is not the owner");
      await expect(mall.connect(addr1).setFeeRCDY(2000)).to.revertedWith(
        "Ownable: caller is not the owner"
      );
      await expect(mall.connect(addr1).setFeeETH(2300)).to.revertedWith(
        "Ownable: caller is not the owner"
      );

      await mall.setFeeRecipient(addr6.address);
      await mall.setFeeRCDY(2000);
      await mall.setFeeETH(2300);
      expect(await mall.feeRecipient()).to.equal(addr6.address);
      expect((await mall.feePercentage()).toString()).to.equal("2000");
      expect((await mall.ethFee()).toString()).to.equal("2300");
    });

    it("should properly create a listing and delisting", async () => {
      let trade = await mall.getMarket(1);
      expect(trade[0].toString()).to.equal(
        "0x0000000000000000000000000000000000000000"
      );

      await expect(
        mall.connect(addr3).listMarket(rc33.address, 1, 4, 0, 1, 0)
      ).to.revertedWith("INVALID_PRICE");

      await expect(
        mall.connect(addr3).listMarket(rc33.address, 1, 0, 5, 1, 0)
      ).to.revertedWith("INVALID_AMOUNT");

      await mall
        .connect(addr3)
        .listMarket(
          rc3.address,
          1,
          0,
          ethers.utils.parseUnits("1", "ether"),
          0,
          1
        );

      await mall
        .connect(addr3)
        .listMarket(
          rc33.address,
          1,
          4,
          ethers.utils.parseUnits("1", "ether"),
          1,
          0
        );

      trade = await mall.getMarket(1);
      expect(trade.length).to.equal(10);
      expect(trade[0]).to.equal(addr3.address);
      expect(trade[2].toString()).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(trade[3]).to.equal(0);
      expect(trade[4].toString()).to.equal(rc3.address);
      expect(trade[5].toString()).to.equal("1");
      expect(trade[8].toString()).to.equal(
        ethers.utils.parseUnits("1", "ether").toString()
      );
      expect(trade[6].toString()).to.equal("1");
      expect(trade[7].toString()).to.equal("1");

      expect((await mall.marketId()).toString()).to.equal("2");
      expect((await mall.marketsSold()).toString()).to.equal("0");
      expect((await mall.marketsDelisted()).toString()).to.equal("0");

      let arr = await mall.getListedMarkets();
      expect(arr.length).to.equal(2);

      let arr1 = arr[0];
      let arr2 = arr[1];

      expect(trade[0]).to.equal(arr1[0]);
      expect(trade[1]).to.equal(arr1[1]);
      expect(trade[2]).to.equal(arr1[2]);
      expect(trade[3]).to.equal(arr1[3]);
      expect(trade[4]).to.equal(arr1[4]);
      expect(trade[5]).to.equal(arr1[5]);
      expect(trade[6]).to.equal(arr1[6]);
      expect(trade[7]).to.equal(arr1[7]);
      expect(trade[8]).to.equal(arr1[8]);

      expect(arr2[0]).to.equal(addr3.address);
      expect(arr2[1].toString()).to.equal("1");

      trade = await mall.getMarket(2);
      expect(trade[0]).to.equal(arr2[0]);
      expect(trade[1]).to.equal(arr2[1]);
      expect(trade[2]).to.equal(arr2[2]);
      expect(trade[3]).to.equal(arr2[3]);
      expect(trade[4]).to.equal(arr2[4]);
      expect(trade[5]).to.equal(arr2[5]);
      expect(trade[6]).to.equal(arr2[6]);
      expect(trade[7]).to.equal(arr2[7]);
      expect(trade[8]).to.equal(arr2[8]);

      await rc3.mint(
        "myownip.xyz/",
        addr3.address,
        rc3.categories(2),
        rc3.natures(2)
      );

      expect(await rc3.ownerOf(1)).to.equal(mall.address);
      expect(await rc3.ownerOf(2)).to.equal(addr3.address);

      await mall
        .connect(addr3)
        .listMarket(
          rc3.address,
          2,
          0,
          ethers.utils.parseUnits("1", "ether"),
          0,
          1
        );

      arr = await mall.getListedMarkets();
      expect(arr.length).to.equal(3);

      await expect(mall.delistMarket(4)).to.revertedWith("UNAUTHORIZED_CALLER");
      await expect(mall.delistMarket(1)).to.revertedWith("UNAUTHORIZED_CALLER");

      let arr3 = arr[2];
      trade = await mall.getMarket(3);
      expect(trade[0]).to.equal(arr3[0]);
      expect(trade[1]).to.equal(arr3[1]);
      expect(trade[2]).to.equal(arr3[2]);
      expect(trade[3]).to.equal(arr3[3]);
      expect(trade[4]).to.equal(arr3[4]);
      expect(trade[5]).to.equal(arr3[5]);
      expect(trade[6]).to.equal(arr3[6]);
      expect(trade[7]).to.equal(arr3[7]);
      expect(trade[8]).to.equal(arr3[8]);
    });

    it("should buy markets properly", async () => {
      await expect(mall.buyWithRCDY(1)).to.revertedWith(
        "ERC20: insufficient allowance"
      );
      await expect(mall.connect(addr3).buyWithETH(2)).to.revertedWith(
        "OWNER_CANNOT_BUY"
      );

      await expect(
        mall
          .connect(addr2)
          .buyWithETH(3, { value: ethers.utils.parseUnits("10", "ether") })
      ).to.revertedWith("INVALID_PAYMENT_AMOUNT");

      expect(
        (await ethers.provider.getBalance(addr6.address)).toString()
      ).to.equal(ethers.utils.parseUnits("10000", "ether").toString());

      await mall
        .connect(addr4)
        .buyWithETH(3, { value: ethers.utils.parseUnits("1", "ether") });

      let trade = await mall.getMarket(3);
      expect(trade[2]).to.equal(addr4.address);

      expect(await rc3.ownerOf(2)).to.equal(addr4.address);
      expect(
        (await ethers.provider.getBalance(addr6.address)).toString()
      ).to.equal(ethers.utils.parseUnits("10000.023", "ether").toString());

      await mall.connect(addr4).buyWithRCDY(2);

      trade = await mall.getMarket(2);
      expect(trade[2]).to.equal(addr4.address);

      expect((await rc33.balanceOf(addr4.address, 1)).toString()).to.equal("4");
      expect((await rc33.balanceOf(mall.address, 1)).toString()).to.equal("0");
      expect((await rcdy.balanceOf(addr6.address)).toString()).to.equal(
        ethers.utils.parseUnits("0.02", "ether").toString()
      );

      expect((await mall.marketsSold()).toString()).to.equal("2");
      expect((await mall.marketsDelisted()).toString()).to.equal("0");

      const history = await mall.connect(addr4).myTradedNFTs();
      expect(history.length).to.equal(2);

      let arr1 = history[0];
      let arr2 = history[1];

      trade = await mall.getMarket(2);
      expect(arr1[2]).to.equal(trade[2]);

      trade = await mall.getMarket(3);
      expect(arr2[2]).to.equal(trade[2]);
    });
  });
});
