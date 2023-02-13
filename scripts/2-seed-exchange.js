const { ethers } = require("hardhat");
const config = require("../src/config.json")

// Helper function
const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), "ether")
}

// Wait function
const wait = (seconds) => {
    let miliseconds = seconds * 1000
    return new Promise(resolve => setTimeout(resolve, miliseconds))
}

// -------------------------------------------------------------------------------
async function main() {
    // Fetch accounts from wallet
    const accounts = await ethers.getSigners()

    // Fetch network
    const { chainId } = await ethers.provider.getNetwork()
    console.log(`Using chainID: ${chainId}`)

    // Fetch deployed tokens
    const token1 = await ethers.getContractAt("Token", config[chainId].token1.address)
    console.log(`Token1 fetched: ${token1.address}\n`)
    const mETH = await ethers.getContractAt("Token", config[chainId].mETH.address)
    console.log(`mETH fetched: ${mETH.address}\n`)
    const mDAI = await ethers.getContractAt("Token", config[chainId].mDAI.address)
    console.log(`mDAI fetched: ${mDAI.address}\n`)

    // Fetch deployed exchange
    const exchange = await ethers.getContractAt("Exchange", config[chainId].exchange.address)
    console.log(`Exchange fetched: ${exchange.address}\n`)

    // Give tokens to Account[1]
    const sender = accounts[0]
    const receiver = accounts[1]
    let amount = tokens(10000)

    // User1 (sender) transfers 10.000 mETH to User2 (receiver)
    let transaction, result
    transaction = await mETH.connect(sender).transfer(receiver.address, amount)
    result = await transaction.wait()
    console.log(`Transferred: ${amount} mETH from: ${sender.address} to: ${receiver.address}\n`)

    // Set up Exchange users
    const user1 = accounts[0]
    const user2 = accounts[1]
    amount = tokens(10000)

    // User1 approves 10.000 token1
    transaction = await token1.connect(user1).approve(exchange.address, amount)
    await transaction.wait()
    console.log(`Approved: ${amount} tokens from: ${user1.address}\n`)

    // User1 deposits 10.000 token1
    transaction = await exchange.connect(user1).depositToken(token1.address, amount)
    await transaction.wait()
    console.log(`Deposited: ${amount} token1 from: ${user1.address}\n`)

    // User2 approves 10.000 mETH
    transaction = await mETH.connect(user2).approve(exchange.address, amount)
    await transaction.wait()
    console.log(`Approved: ${amount} tokens from: ${user2.address}\n`)

    // User2 deposits mETH
    transaction = await exchange.connect(user2).depositToken(mETH.address, amount)
    await transaction.wait()
    console.log(`Deposited: ${amount} token1 from: ${user2.address}\n`)
    
    // -------------------------------------------------------------------------------
    // Seed cancelled order
    // User1 makes order to get tokens
    let orderId
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), token1.address, tokens(5))
    result = await transaction.wait()
    console.log(`Made order from: ${user1.address}\n`)
    
    // User1 cancels order
    console.log(result)
    orderId = result.events[0].args.id
    transaction = await exchange.connect(user1).cancelOrder(orderId)
    result = await transaction.wait()
    console.log(`Cancelled order from: ${user1.address}\n`)

    // Wait 1 second
    await wait(1)

    // -------------------------------------------------------------------------------
    // Seed filled orders
    // User1 makes order
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), token1.address, tokens(10))
    result = await transaction.wait()
    console.log(`Made order from: ${user1.address}\n`)

    // User2 fills order
    orderId = result.events[0].args.id
    transaction = await exchange.connect(user2).fillOrder(orderId)
    result = await transaction.wait()
    console.log(`Filled order from: ${user2.address}\n`)

    // Wait 1 second
    await wait(1)

    // User1 makes another order
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(50), token1.address, tokens(15))
    result = await transaction.wait()
    console.log(`Made order from: ${user1.address}\n`)

    // User2 fills another order
    orderId = result.events[0].args.id
    transaction = await exchange.connect(user2).fillOrder(orderId)
    result = await transaction.wait()
    console.log(`Filled order from: ${user2.address}\n`)

    // Wait 1 second
    await wait(1)

    // User1 makes final order
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(200), token1.address, tokens(20))
    result = await transaction.wait()
    console.log(`Made order from: ${user1.address}\n`)

    // User2 fills final order
    orderId = result.events[0].args.id
    transaction = await exchange.connect(user2).fillOrder(orderId)
    result = await transaction.wait()
    console.log(`Filled order from: ${user2.address}\n`)

    // Wait 1 second
    await wait(1)

    // -------------------------------------------------------------------------------
    // Seed open orders
    // User1 makes 10 orders
    for (let i = 1; i <= 10; i++) {
        transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(10 * i), token1.address, tokens(10))
        result = await transaction.wait()
        console.log(`Made order from: ${user1.address}`)
        // Wait 1 second
        await wait(1)
    }

    // User2 makes 10 orders
    for (let i = 1; i <= 10; i++) {
        transaction = await exchange.connect(user2).makeOrder(token1.address, tokens(10), mETH.address, tokens(10 * i))
        result = await transaction.wait()
        console.log(`Made order from: ${user2.address}`)
        // Wait 1 second
        await wait(1)
    }




}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
