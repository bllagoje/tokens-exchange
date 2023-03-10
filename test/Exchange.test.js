const { ethers } = require("hardhat")
const { expect, use } = require("chai")

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), "ether")
}

describe("Exhange Contract", () => {
    let deployer, feeAccount, exchange, token1, user1, token2, user2
    const feePercent = 10

    beforeEach(async () => {
        let Exchange = await ethers.getContractFactory("Exchange")
        let Token = await ethers.getContractFactory("Token")

        token1 = await Token.deploy("Dapp University", "DAPP", "1000000")
        token2 = await Token.deploy("Mock DAI", "mDAI", "1000000")

        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]
        user1 = accounts[2]
        user2 = accounts[3]

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

    describe("Making Orders", () => {
        let transaction, result
        let amount = tokens(1)

        describe("Success", () => {
            beforeEach(async () => {
                // Approve Token
                transaction = await token1.connect(user1).approve(exchange.address, amount)
                result = await transaction.wait()
                // Deposit Token
                transaction = await exchange.connect(user1).depositToken(token1.address, amount)
                result = await transaction.wait()
                // Make Order
                transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
                result = await transaction.wait()
            })

            it("Tracks newly created order", async () => {
                let orderCount = await exchange.orderCount()
                expect(orderCount).to.equal(1)
            })

            it("Emits an Order event", async () => {
                const event = result.events[0]
                expect(event.event).to.equal("Order")

                let args = event.args
                expect(args.id).to.equal(1)
                expect(args.user).to.equal(user1.address)
                expect(args.tokenGet).to.equal(token2.address)
                expect(args.amountGet).to.equal(tokens(1))
                expect(args.tokenGive).to.equal(token1.address)
                expect(args.amountGive).to.equal(tokens(1))
                expect(args.timestamp).to.at.least(1)
            })
        })

        describe("Failure", () => {
            it("Rejects orders with no balance", async () => {
                await expect(exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)).to.be.reverted
            })
        })
    })

    describe("Order Actions", () => {
        let transaction, result
        let amount = tokens(1)

        beforeEach(async () => {
            // User1 approve tokens
            transaction = await token1.connect(user1).approve(exchange.address, amount)
            result = await transaction.wait()
            // User1 deposit tokens
            transaction = await exchange.connect(user1).depositToken(token1.address, amount)
            result = await transaction.wait()
            // Give tokens to User2
            transaction = await token2.connect(deployer).transfer(user2.address, tokens(100))
            result = await transaction.wait()
            // User2 approve tokens
            transaction = await token2.connect(user2).approve(exchange.address, tokens(2))
            result = await transaction.wait()
            // User2 deposit tokens
            transaction = await exchange.connect(user2).depositToken(token2.address, tokens(2))
            result = await transaction.wait()
            // Make an order
            transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
            result = await transaction
        })

        describe("Cancelling orders", () => {
            describe("Success", () => {
                beforeEach(async () => {
                    transaction = await exchange.connect(user1).cancelOrder(1)
                    result = await transaction.wait()
                })

                it("Updates canceled orders", async () => {
                    let orderCanceled = await exchange.orderCancelled(1)
                    expect(orderCanceled).to.equal(true)
                })

                it("Emits an Cancel event", async () => {
                    const event = result.events[0]
                    expect(event.event).to.equal("Cancel")
    
                    let args = event.args
                    expect(args.id).to.equal(1)
                    expect(args.user).to.equal(user1.address)
                    expect(args.tokenGet).to.equal(token2.address)
                    expect(args.amountGet).to.equal(tokens(1))
                    expect(args.tokenGive).to.equal(token1.address)
                    expect(args.amountGive).to.equal(tokens(1))
                    expect(args.timestamp).to.at.least(1)
                })
            })

            describe("Failure", () => {
                beforeEach(async () => {
                    // User1 approve tokens
                    transaction = await token1.connect(user1).approve(exchange.address, amount)
                    result = await transaction.wait()
                    // User1 deposit tokens
                    transaction = await exchange.connect(user1).depositToken(token1.address, amount)
                    result = await transaction.wait()
                    // Make an order
                    transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
                    result = await transaction
                })

                it("Rejects invalid order IDs", async () => {
                    let invalidOrderID = 9999
                    await expect(exchange.connect(user1).cancelOrder(invalidOrderID)).to.be.reverted
                })

                it("Rejects unauthorized cancelation", async () => {
                    await expect(exchange.connect(user2).cancelOrder(1)).to.be.reverted
                })


            })
        })

        describe("Filling orders", () => {
            describe("Success", () => {
                beforeEach(async () => {
                    // User2 fills order
                    transaction = await exchange.connect(user2).fillOrder("1")
                    result = await transaction.wait()
                })
    
                it("Excecutes the trade and charge fees", async () => {
                    // Token give
                    expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(tokens(0))
                    expect(await exchange.balanceOf(token1.address, user2.address)).to.equal(tokens(1))
                    expect(await exchange.balanceOf(token1.address, feeAccount.address)).to.equal(tokens(0))
                    // Token get
                    expect(await exchange.balanceOf(token2.address, user1.address)).to.equal(tokens(1))
                    expect(await exchange.balanceOf(token2.address, user2.address)).to.equal(tokens(0.9))
                    expect(await exchange.balanceOf(token2.address, feeAccount.address)).to.equal(tokens(0.1))
                })
    
                it("Updates filled orders", async () => {
                    expect(await exchange.orderFilled(1)).to.equal(true)
                })
    
                it("Emits a Trade event", async () => {
                    const event = result.events[0]
                    expect(event.event).to.equal("Trade")
    
                    let args = event.args
                    expect(args.id).to.equal(1)
                    expect(args.user).to.equal(user2.address)
                    expect(args.tokenGet).to.equal(token2.address)
                    expect(args.amountGet).to.equal(tokens(1))
                    expect(args.tokenGive).to.equal(token1.address)
                    expect(args.amountGive).to.equal(tokens(1))
                    expect(args.creator).to.equal(user1.address)
                    expect(args.timestamp).to.at.least(1)
                })
            })

            describe("Failure", () => {
                it("Rejects invalid order IDs", async () => {
                    let invalidOrderID = 9999
                    await expect(exchange.connect(user2).fillOrder(invalidOrderID)).to.be.reverted
                })

                it("Rejects already filled orders", async () => {
                    transaction = await exchange.connect(user2).fillOrder(1)
                    await transaction.wait()
                    await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted
                })

                it("Rejects canceled orders", async () => {
                    transaction = await exchange.connect(user1).cancelOrder(1)
                    await transaction.wait()
                    await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted
                })
            })
        })
    })

    
})