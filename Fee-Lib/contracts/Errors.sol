// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library Errors {
     string public constant ZERO_ADDRESS_NOT_VALID_ARGUMENT = "105"; 
     string public constant INCORRECT_INDEX = "111"; 
     string public constant TRANSFER_FAILED = "112"; 
     string public constant HOLD_TIME_IS_24_HOURS = "121";
     string public constant GAS_REBATE_FAILED = "122";
     string public constant INVALID_ADDRESS = "123";
     string public constant CONTRACT_LIMIT_REACHED = "124";
     string public constant INSUFFICIENT_FUNDS = "125";
     string public constant ACCOUNT_HAS_NO_SHARES = "126"; 
     string public constant NO_DUPLICATES = "127";
     string public constant ZERO_VARIABLE_NOT_ACCEPTED = "128";
     string public constant ADDRESS_ALREADY_HAS_A_VALUE = "129";
     string public constant INVALID_FEE = "131";
}
