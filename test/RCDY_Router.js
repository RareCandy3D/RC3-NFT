const { ethers } = require("hardhat")
const chai = require('chai');
const { expect } = require('chai');
const { solidity } = require("ethereum-waffle");

chai.use(solidity);

describe("Router contract testing", function () {

    let dai, router, addr, addr1, addr2, user1, rcdy

    before( async () =>{
        [addr, addr1, addr2] =  await ethers.getSigners()

        const Dai = await ethers.getContractFactory("Dai")
        const RCDY_Router = await ethers.getContractFactory("RCDY_Router")
        
        // Attaching token
        dai = await Dai.attach('0x6B175474E89094C44Da98b954EedeAC495271d0F')

        rcdy = '0x258B3D55941BC8BCE4a80e7AE7CF685D245A24dc'
        
        maker = await Dai.attach('0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2')

        router  = await RCDY_Router.deploy(
            '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', 
            '0x6B175474E89094C44Da98b954EedeAC495271d0F', 
            1000
        )
        await router.deployed()
    
        // Getting signer of DAI Holder 
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x7344e478574acbe6dac9de1077430139e17eec3d"],
        })

        user1 = await ethers.getSigner("0x7344e478574acbe6dac9de1077430139e17eec3d")

    })

    it('Should deploy correctly', async () => {
        expect((await router.swapFee()).toString()).to.equal('1000')
        expect((await router.claimableFee()).toString()).to.equal('0')
        expect((await dai.balanceOf(user1.address)).toString())
            .to.equal(ethers.utils.parseUnits('94365.380617076924546952', 'ether').toString())
        expect((await router.checkTokenBalance(
            rcdy, '0x7f2f37770b83c932bad75e669957fa38bb687a9b')).toString())
            .to.equal(ethers.utils.parseUnits('10000', '4').toString())
        expect((await router.checkTokenBalance(
            dai.address, user1.address)).toString())
            .to.equal(ethers.utils.parseUnits('94365.380617076924546952', 'ether').toString())
        expect((await router.checkEthBalance(user1.address)).toString()).to.equal('43873601208142315882')
    })

    it('Should should properly trade token to token', async () => {
        expect((await router.checkTokenBalance(dai.address, router.address)).toString()).to.equal('0')
        await router.connect(user1).swapETHForRCDY({value: ethers.utils.parseEther("0.02")})
        
        expect(Number(await router.checkTokenBalance(dai.address, user1.address)))
        .to.greaterThan(Number(ethers.utils.parseUnits('94365.380617076924546952', 'ether')))

        expect(Number(await router.checkTokenBalance(dai.address, router.address))).to.greaterThan(0)
        expect((await router.claimableFee()).toString()).to.equal('511822264371577346')
        
        expect((await maker.balanceOf(user1.address)).toString()).to.equal('14665000000000000000')
        await maker.connect(user1).approve(router.address, ethers.utils.parseEther("10000"))

        const bal = await router.checkTokenBalance(dai.address, user1.address)
        await router.connect(user1).swapTokensForRCDY(maker.address, ethers.utils.parseEther("10"), 1)
        expect(Number(await router.checkTokenBalance(dai.address, user1.address))).to.greaterThan(Number(bal))
        expect(Number(await router.checkTokenBalance(dai.address, router.address))).to.greaterThan(Number(511822264371577346))
        expect(await router.checkTokenBalance(dai.address, router.address)).to.equal(
            await router.claimableFee()
        )
    })

    it('Should claim fees', async () => {
        await expect(router.connect(user1).claimFee(addr1.address, 333)).to.revertedWith("Ownable: caller is not the owner")

        const amount = await router.claimableFee()
        await router.claimFee(addr1.address, amount)

        expect((await router.checkTokenBalance(dai.address, addr1.address)).toString()).to.equal(amount.toString())
        expect((await router.claimableFee()).toString()).to.equal('0')
        await expect(router.claimFee(addr1.address, 333)).to.revertedWith("Not enough available")

    })
})
