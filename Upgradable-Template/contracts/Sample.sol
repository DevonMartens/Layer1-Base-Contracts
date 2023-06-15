// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Sample is Initializable {
    uint public value;
    
    function initialize(uint _value) public initializer {
            value = _value;
    }

}
