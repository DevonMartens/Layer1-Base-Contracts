// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ISimpleStorageWithFee {

function set(uint) external payable;

function setAndPayForIt(uint) external payable;
}


contract DUMBCONTRACT {

    constructor(address _SimpleStorageWithFee) {
      //  SimpleStorageAddress  = 
        _SimpleStorageWithFee = SimpleStorageAddress;
    }

  address SimpleStorageAddress;  
    function setItTwice() external payable{
        ISimpleStorageWithFee(SimpleStorageAddress).set{value: 200}(1);
        ISimpleStorageWithFee(SimpleStorageAddress).set{value: 200}(1);
    }
    function setAndPayForItTwice() external payable{
        ISimpleStorageWithFee(SimpleStorageAddress).setAndPayForIt{value: 200}(1);
        ISimpleStorageWithFee(SimpleStorageAddress).setAndPayForIt{value: 200}(1);
    }
}