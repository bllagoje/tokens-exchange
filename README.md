# Tokens Exchange

This is a decentralized exchange platform where users can trade ERC-20 tokens with each other.

This project is built using Solidity programming language for creating smart contracts, Hardhat tool for deploying and testing smart contracts, and React for building the frontend.


## Getting Started

To get started with the project, follow the instructions below:

### Instalation

1. Clone the repository:
```bash
git clone https://github.com/bllagoje/tokens-exchange.git
```
2. Install the required dependencies:
```bash
cd tokens-exchange
npm install
```


### Usage
1. Run Hardhat node:
```
npx hardhat node
```
2. Deploy on localhost:
```
npx hardhat run --network localhost scripts/1-deploy.js
```
3. Seed Exchange:
```
npx hardhat run --network localhost scripts/2-seed-exchange.js
```
4. Run React server:
```
npm start
```


### Tests

To run the tests for the smart contracts, run the following command:
```
npx hardhat test
```


Project from DApp University Smart Contract Development Bootcamp
