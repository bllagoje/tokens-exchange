// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Token {
    string public name = "My Token";
    string public symbol = "DAPP";
    uint public decimals = 18;
    uint public totalSupply = 1000000 * (10 ** decimals); 
    


}

