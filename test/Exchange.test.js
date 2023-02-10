const { ethers } = require("hardhat")
const { expect, use } = require("chai")

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), "ether")
}

describe("Exhange Contract", () => {
    let deployer, feeAccount, exchange, token1, user1
    const feePercent = 10

    beforeEach(async () => {
        let Exchange = await ethers.getContractFactory("Exchange")
        let Token = await ethers.getContractFactory("Token")
        token1 = await Token.deploy("Dapp University", "DAPP", "1000000")
        

        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]
        user1 = accounts[2]

        let transaction = await token1.connect(deployer).transfer(user1.address, tokens(100))
        await transaction.wait()

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

    describe("Depositing Tokens", () => {
        let transaction, result
        let amount = tokens(10)
       
        describe("Success", () => {
            beforeEach(async () => {
                // Approve Token
                transaction = await token1.connect(user1).approve(exchange.address, amount)
                result = await transaction.wait()
                // Deposit Token
                transaction = await exchange.connect(user1).depositToken(token1.address, amount)
                result = await transaction.wait()
            })

            it("Tracks the token deposit", async () => {
                let token1Balance = await token1.balanceOf(exchange.address)
                expect(token1Balance).to.equal(amount)
                expect(await exchange.tokens(token1.address, user1.address)).to.equal(amount)
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
            })

            it("Emits a Deposit event", async () => {
                let event = result.events[1]
                expect(event.event).to.equal("Deposit")

                let args = event.args
                expect(args.token).to.equal(token1.address)
                expect(args.user).to.equal(user1.address)
                expect(args.amount).to.equal(amount)
                expect(args.balance).to.equal(amount)
            })
        })

        describe("Failure", () => {
            it("Fails when no Tokens are approved", async () => {
                await expect(exchange.connect(user1).depositToken(token1.address, amount)).to.be.reverted
            })
        })

    })

    describe("Withdrawing Tokens", () => {
        let transaction, result
        let amount = tokens(10)
       
        describe("Success", () => {
            beforeEach(async () => {
                // Deposit Tokens before withdraw

                // Approve Token
                transaction = await token1.connect(user1).approve(exchange.address, amount)
                result = await transaction.wait()
                // Deposit Token
                transaction = await exchange.connect(user1).depositToken(token1.address, amount)
                result = await transaction.wait()
                // Now withdraw Tokens
                transaction = await exchange.connect(user1).withdrawToken(token1.address, amount)
                result = await transaction.wait()
            })

            it("Withdraws token funds", async () => {
                let token1Balance = await token1.balanceOf(exchange.address)
                expect(token1Balance).to.equal(0)
                let exchangeTokens = await exchange.tokens(token1.address, user1.address)
                expect(exchangeTokens).to.equal(0)
                let exchangeBalance = await exchange.balanceOf(token1.address, user1.address)
                expect(exchangeBalance).to.equal(0)
            })

            it("Emits a Withdraw event", async () => {
                let event = result.events[1]
                expect(event.event).to.equal("Withdraw")

                let args = event.args
                expect(args.token).to.equal(token1.address)
                expect(args.user).to.equal(user1.address)
                expect(args.amount).to.equal(amount)
                expect(args.balance).to.equal(0)
            })
        })

        describe("Failure", () => {
            it("Fails for insufficient balances", async () => {
                // Attempt to withdraw tokens without depositing
                await expect(exchange.connect(user1).withdrawToken(token1.address, amount)).to.be.reverted
            })
        })
    })

    describe("Checking Balances", () => {
        let transaction, result
        let amount = tokens(1)

        beforeEach(async () => {
            // Approve Token
            transaction = await token1.connect(user1).approve(exchange.address, amount)
            result = await transaction.wait()
            // Deposit Token
            transaction = await exchange.connect(user1).depositToken(token1.address, amount)
            result = await transaction.wait()
        })

        it("Returns user balance", async () => {
            expect(await exchange.tokens(token1.address, user1.address)).to.equal(amount)
        })
    })

    


})