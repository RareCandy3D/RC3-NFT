const chai = require('chai');
const { expect } = require('chai');
const { solidity } = require("ethereum-waffle");

chai.use(solidity);

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