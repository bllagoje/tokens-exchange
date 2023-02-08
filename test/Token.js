const { ethers } = require("hardhat")
const { expect } = require("chai")

describe("Token Contract", () => {
    let token

    beforeEach(async () => {
        // Fetch Token from Blockchain:
        let Token = await ethers.getContractFactory("Token")
        token = await Token.deploy()
    })

    it("Has correct name", async () => {
        let name = await token.name()
        expect(name).to.equal("My Token")
    })

    it("Has correct symbol", async () => {
        let symbol = await token.symbol()
        expect(symbol).to.equal("DAPP")
    })

    it("Has correct decimals", async () => {
        let decimals = await token.decimals()
        expect(decimals).to.equal("18")
    })

    it("Has correct total supply", async () => {
        let totalSupply = await token.totalSupply()
        expect(totalSupply).to.equal("1000000000000000000000000")
    })

    


    
})
