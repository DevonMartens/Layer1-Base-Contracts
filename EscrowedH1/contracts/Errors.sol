// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;


library Errors {
    //from prover <- comments here for review
    string public constant PREVIOUSLY_VERIFIED = "100";
    string public constant ID_DOES_NOT_EXIST = "101";
    string public constant ID_NOT_TRANSFERABLE = "102";
    string public constant ID_INVALID_EXPIRED = "103";
    string public constant NOT_VALID_PROVER = "104";
    string public constant ZERO_ADDRESS_NOT_VALID_ARGUMENT = "105";
    string public constant INVALID_TOKEN_ID = "106";
    string public constant TOKEN_ID_ALREADY_EXISTS = "107";
    string public constant SOULBOUND_TOKEN = "108";
    //from escrow - section? start @ 2??
    string public constant INSUFFICIENT_BALANCE  = "109";
    string public constant INSUFFICIENT_TOKEN_BALANCE  = "110"; //used in bridge too
    string public constant INCORRECT_INDEX  = "111"; // used in fee lib too
    string public constant TRANSFER_FAILED  = "112";
    string public constant H1_UNEQUAL_TO_DEPOSIT = "113";
    string public constant NO_AMOUNT_TO_CLAIM  = "114";
   //bridge
   string public constant ADDRESS_BLOCKED = "115"; //used here
   string public constant ONLY_APPROVED_CONTRACTS = "116";
   string public constant WHITELIST_ERROR = "117";
   //fee lib
   string public constant GAS_REBATE_ERROR = "118"; 
   string public constant DISTRIBUTION_ERROR = "119";
   // validator rewards - no new needed
   //h1 nativative 
   string public constant RESET_FEE = "120";
}