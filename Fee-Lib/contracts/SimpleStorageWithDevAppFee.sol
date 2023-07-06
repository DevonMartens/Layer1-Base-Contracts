// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./H1DevelopedApplication.sol";

contract SimpleStorageWithDevAppFee is H1DevelopedApplication {
    uint public storedData;
    uint public h1Stored;
    
    constructor
    (address _feeContract,address devWallet, uint256 fee
    ) 
    H1DevelopedApplication(_feeContract, devWallet, fee ) {}

     function set(uint x) public payable devApplicationFee() 
     {
        storedData = x;
    }


    function get() public view returns (uint retVal) {
        return storedData;
    }
}
