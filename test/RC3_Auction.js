const chai = require('chai');
const { expect } = require('chai');
const { solidity } = require("ethereum-waffle");

chai.use(solidity);

describe('RC3 Auction', function(){

    let auction, token, nft, addr1, addr2, addr3, addr4, addr5, Mock_RCDY, Mock_RC3, RC3_Auction

    before(async function() {

        [addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners()
        RC3_Auction = await ethers.getContractFactory('RC3_Auction');
        Mock_RCDY = await ethers.getContractFactory('Mock_RCDY');
        Mock_RC3 = await ethers.getContractFactory('RC3');
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