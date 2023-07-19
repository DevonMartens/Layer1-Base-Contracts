// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library Errors {
    string public constant PREVIOUSLY_VERIFIED = "100";
    string public constant ID_DOES_NOT_EXIST = "101";
    string public constant ID_NOT_TRANSFERABLE = "102";
    string public constant ID_INVALID_EXPIRED = "103";
    string public constant NOT_VALID_PROVER = "104";
    string public constant ZERO_ADDRESS_NOT_VALID_ARGUMENT = "105";
    string public constant INVALID_TOKEN_ID = "106";
    string public constant TOKEN_ID_ALREADY_EXISTS = "107";
}
