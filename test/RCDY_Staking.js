//const { expectRevert, time } = require('@openzeppelin/test-helpers')
const { expect } = require('chai')
const { ethers } = require("hardhat")

describe("RCDY Staking", () => {
    let staking, token, addr1, addr2, addr3, addr4, Mock_RCDY, RCDY_Staking

    before(async () => {
        Mock_RCDY = await ethers.getContractFactory("Mock_RCDY")
        RCDY_Staking = await ethers.getContractFactory('RCDY_Staking');
        [addr1, addr2, addr3, addr4] = await ethers.getSigners()
        token = await Mock_RCDY.deploy("Rarecandy3D", "RCDY", ethers.utils.parseEther("1000000"))
        staking = await RCDY_Staking.deploy(token.address, 1000)
    })

    describe("Deployment", async function () {
        it("Should deploy properly", async function () {
            expect(await token.balanceOf(addr1.address).toString()).to.equal(await token.totalSupply().toString())
            expect(Number(await staking.ratePerDay())).to.equal(1000)
        })
    })

    describe("Staking", async function () {
        
        it("Should stake properly", async function () {
            await token.transfer(addr2.address, ethers.utils.parseEther("10000"))
            const amt = await ethers.utils.parseEther("10000")
            await token.connect(addr2).approve(staking.address, amt)

            expect(Number(await token.allowance(addr2.address, staking.address))).to.equal(Number(amt))
            expect(Number(await staking.claimableRewards(addr2.address))).to.equal(0)

            await staking.connect(addr2).stakeRCDY(amt)
            expect(Number(await token.balanceOf(addr2.address))).to.equal(0)
            expect(Number(await staking.totalStakes())).to.equal(Number(amt))

            const userInfo = await staking.getUserInfo(addr2.address)
            const blckno = await ethers.provider.getBlockNumber();
            expect(Number(userInfo[1])).to.equal(blckno)
            expect(Number(userInfo[0])).to.equal(Number(amt))
        })

        it("should claim properly", async function () {
            await ethers.provider.send('evm_mine');
            await ethers.provider.send('evm_mine');

            expect(Number(await token.balanceOf(addr2.address))).to.equal(0)
            const claimable = Number(await staking.claimableRewards(addr2.address))
            await staking.connect(addr2).claim()
            expect(Number(await staking.claimableRewards(addr2.address))).to.equal(0)
            expect(Number(await token.balanceOf(addr2.address))).to.equal(claimable)

        })
    })
})