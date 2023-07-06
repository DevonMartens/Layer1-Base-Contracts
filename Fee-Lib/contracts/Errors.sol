// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library Errors {
    string public constant PREVIOUSLY_VERIFIED = "100";
    string public constant ID_DOES_NOT_EXIST = "101";
    string public constant ID_NOT_TRANSFERABLE = "102";
    string public constant ID_INVALID_EXPIRED = "103";
    string public constant NOT_VALID_PROVER = "104";
    string public constant ZERO_ADDRESS_NOT_VALID_ARGUMENT = "105"; // VR
    string public constant INVALID_TOKEN_ID = "106";
    string public constant TOKEN_ID_ALREADY_EXISTS = "107";
    string public constant SOULBOUND_TOKEN = "108";

    string public constant INSUFFICIENT_BALANCE = "109";
    string public constant INSUFFICIENT_TOKEN_BALANCE = "110";
    string public constant INCORRECT_INDEX = "111"; //used
    string public constant TRANSFER_FAILED = "112"; //used
    string public constant H1_UNEQUAL_TO_DEPOSIT = "113";
    string public constant NO_AMOUNT_TO_CLAIM = "114";

    string public constant ADDRESS_BLOCKED = "115";
    string public constant ONLY_APPROVES_CONTRACTS = "116";
    string public constant WHITELIST_ERROR = "117";

    string public constant GAS_REBATE_ERROR = "118";
    string public constant DISTRIBUTION_ERROR = "119";

    string public constant RESET_FEE = "120";
    string public constant HOLD_TIME_IS_24_HOURS = "121";
    string public constant GAS_REBATE_FAILED = "122";
    string public constant INVALID_ADDRESS = "123";
    string public constant CONTRACT_LIMIT_REACHED = "124";

    string public constant INSUFFICIENT_FUNDS = "125";
    string public constant ACCOUNT_HAS_NO_SHARES = "126"; // VR
    string public constant NO_DUPLICATES = "127";
    string public constant ZERO_VARIABLE_NOT_ACCEPTED = "128";
    string public constant ADDRESS_ALREADY_HAS_A_VALUE = "129";
    string public constant INVALID_INDEX = "130";
    string public constant INVALID_FEE = "131";
}
