// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./H1NativeApplication.sol";

contract SimpleStorageWithFee is H1NativeApplication {
    uint public storedData;
    uint public h1Stored;

    constructor(address _feeContract) H1NativeApplication(_feeContract) {}

    function set(uint x) public payable applicationFee {
        storedData = x;
    }

    function get() public view returns (uint retVal) {
        return storedData;
    }
}
