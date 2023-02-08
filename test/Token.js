const { ethers } = require("hardhat")
const { expect } = require("chai")

describe("Token Contract", () => {
    it("Has a name", async () => {
        // Fetch Token from Blockchain:
        let Token = await ethers.getContractFactory("Token")
        let token = await Token.deploy()
        // Read Token name:
        let name = await token.name()
        // Check that name is correct:
        expect(name).to.equal("My Token")
    })

    
    
})
