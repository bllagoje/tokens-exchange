const { ethers } = require("hardhat")
const { expect } = require("chai")

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), "ether")
}

describe("Exhange Contract", () => {
    let deployer, feeAccount, exchange
    const feePercent = 10

    beforeEach(async () => {
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]
        let Exchange = await ethers.getContractFactory("Exchange")
        exchange = await Exchange.deploy(feeAccount.address, feePercent)
    })

    describe("Deployment", () => {
        
        it("Tracks the fee account", async () => {
            expect(await exchange.feeAccount()).to.equal(feeAccount.address)
        })
    
        it("Tracks the fee percent", async () => {
            let feePercentFunc = await exchange.feePercent()
            expect(feePercentFunc).to.equal(feePercent)
        })

        
    })

})