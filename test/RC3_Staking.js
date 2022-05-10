const chai = require('chai');
const { expect } = require('chai');
const { solidity } = require("ethereum-waffle");

chai.use(solidity);

describe('RC3 Staking', function(){
    
    let staking, token, nft, addr2, addr3, addr4, Mock_RCDY, RC3_Staking, Mock_RC3

    before(async function(){
        
        [, addr2, addr3, addr4] = await ethers.getSigners()

        Mock_RCDY = await ethers.getContractFactory('Mock_RCDY')
        RC3_Staking = await ethers.getContractFactory('RC3_Staking')
        Mock_RC3 = await ethers.getContractFactory('RC3')
        
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
        await expect(staking.unstakeRC3(1)).to.revertedWith('Only stakeholder can do this')
        await staking.connect(addr2).unstakeRC3(1)
        const sh = await staking.getNFTDetail(1)
        expect((sh[0]).toString()).to.equal('0x0000000000000000000000000000000000000000')
    })

})
