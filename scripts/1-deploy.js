const { ethers } = require("hardhat")


const main = async () => {
    const Token = await ethers.getContractFactory("Token")
    const token = await Token.deploy()
    await token.deployed()
    console.log(`Token deployed to address: ${token.address}`)

}


// Run:
main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })