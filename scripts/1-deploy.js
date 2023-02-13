const { ethers } = require("hardhat")


const main = async () => {
    console.log(`Preparing deployment...\n`)
    // Fetch contracts to deploy
    const Token = await ethers.getContractFactory("Token")
    const Exchange = await ethers.getContractFactory("Exchange")
    // Fetch accounts
    const accounts = await ethers.getSigners()
    console.log(`Accounts fetched: \n${accounts[0].address}\n${accounts[1].address}\n`)
    // Deploy contracts
    // Token1
    const token1 = await Token.deploy("Token1", "T1", "1000000")
    await token1.deployed()
    console.log(`Token1 deployed to address: ${token1.address}`)
    // Token2
    const mETH = await Token.deploy("mETH", "mETH", "1000000")
    await mETH.deployed()
    console.log(`mETH deployed to address: ${mETH.address}`)
    // Token3
    const mDAI = await Token.deploy("mDAI", "mDAI", "1000000")
    await mDAI.deployed()
    console.log(`mDAI deployed to address: ${mDAI.address}`)
    // Exchange
    const exchange = await Exchange.deploy(accounts[1].address, 10)
    await exchange.deployed()
    console.log(`Exchange deployed to address: ${exchange.address}`)
}


// Run:
main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })