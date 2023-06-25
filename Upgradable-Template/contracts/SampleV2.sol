// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";


contract SampleV2 
is Initializable, UUPSUpgradeable
{
    uint public value;
    
    function inc(uint _value) external{
            value = _value;
    }
     function _authorizeUpgrade(address newImplementation)
        internal
        override
    {}

}