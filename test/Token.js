const { ethers } = require("hardhat")
const { expect } = require("chai")

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), "ether")
}

describe("Token Contract", () => {
    let token
    let accounts
    let deployer
    let receiver

    beforeEach(async () => {
        // Fetch Token from Blockchain:
        let Token = await ethers.getContractFactory("Token")
        token = await Token.deploy("Dapp University", "DAPP", "1000000")
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        receiver = accounts[1]
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

    describe("Sending Tokens", () => {
        let amount
        let transaction
        let result

        describe("Success", () => {
            beforeEach(async () => {
                amount = tokens(100)
                // Transfer Tokens:            
                transaction = await token.connect(deployer).transfer(receiver.address, amount)
                result = await transaction.wait()
            })
    
            it("Transfers token balances", async () => {
                let deployerBalance = await token.balanceOf(deployer.address)
                let receiverBalance = await token.balanceOf(receiver.address)
                expect(deployerBalance).to.equal(tokens(999900))
                expect(receiverBalance).to.equal(amount)
            })
    
            it("Emits a Transfer event", async () => {
                let event = result.events[0]
                expect(event.event).to.equal("Transfer")
                let args = result.events[0].args
                expect(args.from).to.equal(deployer.address)
                expect(args.to).to.equal(receiver.address)
                expect(args.value).to.equal(amount)
            })
        })

        describe("Failure", () => {
            it("Rejects insufficient balances", async () => {
                // Transfer more tokens than deployer has
                let invalidAmount = tokens(100000000)
                await expect(token.connect(deployer).transfer(receiver.address, invalidAmount)).to.be.reverted
            })

            it("Rejects invalid recipient", async () => {
                let randomAmount = tokens(100)
                let randomAddress = "0x0000000000000000000000000000000000000000"
                await expect(token.connect(deployer).transfer(randomAddress, randomAmount)).to.be.reverted
            })
        })

        


    })



    
})
