// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./H1NativeApplication.sol";

contract SimpleStorageWithFee is H1NativeApplication {
    uint public storedData;
    uint public h1Stored;

    constructor(address _feeContract) H1NativeApplication(_feeContract) {}

    function set(uint x) external payable applicationFee {
        storedData = x;
    }

    function setAndPayForIt(uint x) external payable applicationFeeWithPayment(5) {
        require(msg.value > 5, "CHEAP");
        storedData = x;
    }

    function get() public view returns (uint retVal) {
        return storedData;
    }
}
