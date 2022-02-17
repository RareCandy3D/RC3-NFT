const { expect } = require('chai')

describe('RCDY Staking', function(){
    let staking, token, addr1, addr2, Mock_RCDY, RCDY_Staking

    before(async () => {
        Mock_RCDY = await ethers.getContractFactory("Mock_RCDY")
        RCDY_Staking = await ethers.getContractFactory('RCDY_Staking');
        [addr1, addr2] = await ethers.getSigners()
        token = await Mock_RCDY.deploy("Rarecandy3D", "RCDY", ethers.utils.parseUnits("1000000", "ether"))
        staking = await RCDY_Staking.deploy(token.address, 1000)
        await token.deployed()
        await staking.deployed()
    })

    it("Should deploy properly", async function () {
        expect(await token.balanceOf(addr1.address).toString()).to.equal(await token.totalSupply().toString())
        let rate = await staking.ratePerDay()
        expect(rate.toString()).to.equal(("1000"))
    })

    it("Should stake properly", async function () {
        await token.transfer(addr2.address, ethers.utils.parseUnits("10000", "ether"))
        const amt =  ethers.utils.parseUnits('10000', 'ether')
        await token.connect(addr2).approve(staking.address, amt)

        expect(Number(await token.allowance(addr2.address, staking.address))).to.equal(Number(amt))
        expect(Number(await staking.claimableRewards(addr2.address))).to.equal(0)

        await token.transfer(staking.address, ethers.utils.parseUnits("900000", "ether"))
        await staking.connect(addr2).stakeRCDY(amt)
        
        expect(Number(await token.balanceOf(addr2.address))).to.equal(0)
        expect(Number(await staking.getTotalStakes())).to.equal(Number(amt))

        const userInfo = await staking.getUserInfo(addr2.address)
        const blckno = await ethers.provider.getBlockNumber();
        expect(Number(userInfo[1])).to.equal(blckno)
        expect(Number(userInfo[0])).to.equal(Number(amt))
        
    })

    it("should claim properly", async function () {
        //await hre.ethers.provider.send('evm_increaseTime', [7 * 24 * 60 * 60]);
        await hre.ethers.provider.send("evm_mine")

        const claimable = await staking.claimableRewards(addr2.address)
        expect(Number(await token.balanceOf(addr2.address))).to.equal(0)
        
        
        
        await staking.connect(addr2).claim()

        const bal = await token.balanceOf(addr2.address)
        expect(Number(await staking.claimableRewards(addr2.address))).to.equal(0)
        expect(bal.toString()).to.equal(claimable.toString())
    })
    
})

describe('RC3 Staking', function(){
    
    let staking, token, nft, addr2, addr3, addr4, Mock_RCDY, RC3_Staking, Mock_RC3

    before(async function(){
        
        [, addr2, addr3, addr4] = await ethers.getSigners()

        Mock_RCDY = await ethers.getContractFactory('Mock_RCDY')
        RC3_Staking = await ethers.getContractFactory('RC3_Staking')
        Mock_RC3 = await ethers.getContractFactory('Mock_RC3')
        
        token = await Mock_RCDY.deploy("Rarecandy3D", "RCDY", ethers.utils.parseUnits("1000000", "ether"))
        await token.deployed()
        nft = await Mock_RC3.deploy()
        await nft.deployed()
        staking = await RC3_Staking.deploy(nft.address, token.address, ethers.utils.parseUnits("0.01", "ether"))
        await staking.deployed()

        await token.transfer(staking.address, ethers.utils.parseUnits("1000", "ether"))
        await nft.mintNFT(addr2.address)
        await nft.mintNFT(addr3.address)
        await nft.connect(addr2).setApprovalForAll(staking.address, 1)
        await nft.connect(addr3).setApprovalForAll(staking.address, 1)
    })

    it('should deploy and stake properly', async function(){
       
        expect(Number(await staking.dailyReward())).to.equal(Number(ethers.utils.parseUnits('0.01', 'ether')))
        expect(Number(await staking.BLOCKS_PER_DAY())).to.equal(5760)
       
        const sh = await staking.getNFTDetail(1)
        expect((sh[0]).toString()).to.equal('0x0000000000000000000000000000000000000000')
        
        await staking.connect(addr2).stakeRC3(1)
        const shh = await staking.getNFTDetail(1)
        expect(shh[0].toString()).to.equal(addr2.address)
    })

    it('should earn proper rewards', async function(){
        expect(Number(await staking.getClaimableRewards(1))).to.equal(0)
       // await ethers.provider.send('evm_mine')
        await hre.ethers.provider.send('evm_increaseTime', [7 * 24 * 60 * 60]);
        const available = Number(await staking.getClaimableRewards(1))
        //expect(await staking.connect(addr3).claimRCDY(1)).to.be.revertedWith('Only stakeholder can do this')
        staking.connect(addr2).claimRCDY(1)
        const sh = await staking.getNFTDetail(1)
        expect(Number(sh[2])).to.equal(available)
        expect(Number(await staking.getClaimableRewards(1))).to.equal(0)
    })

    it('should unstake properly', async function(){
        await staking.connect(addr2).unstakeRC3(1)
        const sh = await staking.getNFTDetail(1)
        expect((sh[0]).toString()).to.equal('0x0000000000000000000000000000000000000000')
    })

})

describe('Rarecandy Mall', function(){
    
    let mall, token, nft, addr1, addr2, addr3, addr4, Mock_RCDY, RarecandyMall, Mock_RC3

    before(async function() {

        [addr1, addr2, addr3, addr4] = await ethers.getSigners()
        RarecandyMall = await ethers.getContractFactory('RarecandyMall');
        Mock_RCDY = await ethers.getContractFactory('Mock_RCDY');
        Mock_RC3 = await ethers.getContractFactory('Mock_RC3');
        token = await Mock_RCDY.deploy("Rarecandy3D", "RCDY", ethers.utils.parseUnits("1000000", "ether"))
        nft = await Mock_RC3.deploy()
        await token.deployed()
        await nft.deployed()
        mall = await RarecandyMall.deploy(token.address, nft.address, addr4.address, 1000)
        await mall.deployed()
        await nft.batchMintNFT(addr1.address, 2)
        await nft.transferFrom(addr1.address, addr2.address, 1)
        await nft.transferFrom(addr1.address, addr2.address, 2)
        await nft.connect(addr2).setApprovalForAll(mall.address, 1)
        const amount = await ethers.utils.parseUnits('100', 'ether')
        await token.transfer(addr3.address, amount)
        await token.connect(addr3).approve(mall.address, amount)
    })

    it('should deploy contract properly', async function(){
        expect((await mall.listingFee()).toString()).to.equal('1000')
        expect(await mall.feeCollector()).to.equal(addr4.address)
    })

    it('should list item properly', async function(){

        await mall.connect(addr2).listItem(1, ethers.utils.parseUnits("100", "ether"))
        const itmes = await mall.getItem(1)
        const marketItems = await mall.getMarketItems()

        expect(itmes[0].toString()).to.equal('1')
        expect(Number(itmes[1])).to.equal(1)
        expect(itmes[2]).to.equal(addr2.address)
        expect(marketItems.length).to.be.equal(1)
        expect(itmes[3].toString()).to.equal('0x0000000000000000000000000000000000000000')
        expect(itmes[4].toString()).to.equal((ethers.utils.parseUnits("100", "ether")).toString())
    })

    it('should buy item properly', async function() {
        await mall.connect(addr3).buyItem(1)
        expect((await token.balanceOf(addr4.address)).toString()).to.equal((ethers.utils.parseUnits('1', 'ether')).toString())
        const item = await mall.getItem(1)
        expect(item[3]).to.equal(addr3.address)
    })
})

describe('RC3 Auction', function(){

    let auction, token, nft, addr1, addr2, addr3, addr4, addr5, Mock_RCDY, Mock_RC3, RC3_Auction

    before(async function() {

        [addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners()
        RC3_Auction = await ethers.getContractFactory('RC3_Auction');
        Mock_RCDY = await ethers.getContractFactory('Mock_RCDY');
        Mock_RC3 = await ethers.getContractFactory('Mock_RC3');
        token = await Mock_RCDY.deploy("Rarecandy3D", "RCDY", ethers.utils.parseUnits("1000000", "ether"))
        nft = await Mock_RC3.deploy()
        await token.deployed()
        await nft.deployed()
        auction = await RC3_Auction.deploy(nft.address, token.address, addr4.address, 2500)
        await auction.deployed()
        await nft.mintNFT(addr1.address)
        await nft.mintNFT(addr3.address)
        await nft.connect(addr1).setApprovalForAll(auction.address, 1)
        const amount = await ethers.utils.parseUnits('100', 'ether')
        await token.transfer(addr3.address, amount)
        await token.connect(addr3).approve(auction.address, amount)
        await token.transfer(addr5.address, amount)
        await token.connect(addr5).approve(auction.address, amount)
    })

    it('should deploy contract properly', async function() {

        expect((await auction.feePercentage()).toString()).to.equal('2500')
        expect((await auction.feeReceipient()).toString()).to.equal(addr4.address)
    })

    it('should properly create an auction', async function(){

        const auc = await auction.getAuction(1)

        expect(auc[0].toString()).to.equal('0x0000000000000000000000000000000000000000')
        await auction.newAuction(
            1,
            1000,
            1000,
            ethers.utils.parseUnits('1', 'ether')
        )

        await hre.ethers.provider.send('evm_increaseTime', [1500])

        const auc1 = await auction.getAuction(1)
        expect(auc1[0].toString()).to.equal(addr1.address)
        expect(auc1[1].toString()).to.equal(addr1.address)
        expect(auc1[2].toString()).to.equal('0x0000000000000000000000000000000000000000')
        expect(auc1[3].toString()).to.equal((ethers.utils.parseUnits('1', 'ether')).toString())
        expect(auc1[4].toString()).to.equal('0')
        expect(auc1[8]).to.equal(true)

        const [first,last] = await auction.bidTimeRemaining(1)
        expect(first.toString()).to.equal('1000')
        expect(last.toString()).to.equal('2000')
    })

    it('should bid properly', async function() {
        expect((await auction.nextBidAmount(1)).toString()).to.equal((ethers.utils.parseUnits('1', 'ether')).toString())
        await auction.connect(addr3).bid(1, await auction.nextBidAmount(1))
        const auc1 = await auction.getAuction(1)
        expect(auc1[2].toString()).to.equal(addr3.address)
        expect(auc1[3].toString()).to.equal((ethers.utils.parseUnits('1', 'ether')).toString())
        expect(auc1[4].toString()).to.equal((ethers.utils.parseUnits('1', 'ether')).toString())
        expect(auc1[7].toString()).to.equal('1')
        await auction.connect(addr5).bid(1, await auction.nextBidAmount(1))
        const auc = await auction.getAuction(1)
        expect(auc[2].toString()).to.equal(addr5.address)
        expect(auc[3].toString()).to.equal((ethers.utils.parseUnits('1', 'ether')).toString())
        expect(auc[4].toString()).to.equal((ethers.utils.parseUnits('1.1', 'ether')).toString())
        expect(auc[7].toString()).to.equal('2')
    })

    it('should close bid properly', async function(){
        await hre.ethers.provider.send('evm_increaseTime', [1800])
        await auction.closeBid(1)
        expect((await token.balanceOf(addr4.address)).toString()).to.equal(
            (ethers.utils.parseUnits('0.0275', 'ether')).toString()
        )
        expect((await token.balanceOf(addr1.address)).toString()).to.equal(
            (ethers.utils.parseUnits('999801.0725', 'ether')).toString()
        )
        expect((await nft.ownerOf(1)).toString()).to.equal(addr5.address)
    })
})