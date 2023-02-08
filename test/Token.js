const { ethers } = require("hardhat")
const { expect } = require("chai")

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), "ether")
}

describe("Token Contract", () => {
    let token
    let accounts
    let deployer

    beforeEach(async () => {
        // Fetch Token from Blockchain:
        let Token = await ethers.getContractFactory("Token")
        token = await Token.deploy("Dapp University", "DAPP", "1000000")
        accounts = await ethers.getSigners()
        deployer = accounts[0]
    })

    describe("Deployment", () => {
        const nameInput = "Dapp University"
        const symbolInput = "DAPP"
        const decimalsInput = "18"
        const valueInput = tokens("1000000")
        

        it("Has correct name", async () => {
            let name = await token.name()
            expect(name).to.equal(nameInput)
        })
    
        it("Has correct symbol", async () => {
            let symbol = await token.symbol()
            expect(symbol).to.equal(symbolInput)
        })
    
        it("Has correct decimals", async () => {
            let decimals = await token.decimals()
            expect(decimals).to.equal(decimalsInput)
        })
    
        it("Has correct total supply", async () => {
            let totalSupply = await token.totalSupply()
            expect(totalSupply).to.equal(valueInput)
        })

        it("Assigns total supply to deployer", async () => {
            let balanceOfDeployer = await token.balanceOf(deployer.address)
            expect(balanceOfDeployer).to.equal(valueInput)
        })

    })

    



    
})
