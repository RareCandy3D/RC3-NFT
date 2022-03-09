const chai = require('chai');
const { expect } = require('chai');
const { solidity } = require("ethereum-waffle");

chai.use(solidity);

describe('Rarecandy Mall', function(){
    
    let mall, token, nft, addr1, addr2, addr3, addr4, Mock_RCDY, RarecandyMall, Mock_RC3

    before(async function() {

        [addr1, addr2, addr3, addr4] = await ethers.getSigners()
        RarecandyMall = await ethers.getContractFactory('RarecandyMall');
        Mock_RCDY = await ethers.getContractFactory('Mock_RCDY');
        Mock_RC3 = await ethers.getContractFactory('RC3');
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