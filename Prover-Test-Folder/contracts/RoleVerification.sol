// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Errors.sol";

/** 
@title RoleVerification
@notice This contract outlines the base layer of Haven1s provable identity framework
@dev The primary function of this contract is to establish and return a users account level "identity blob" for use within the identity framework
*/
abstract contract RoleVerification {
    
    // Mapping from account address to identity blob struct.
    mapping(address => IdentityBlob) public identityBlob;

    // Maps account and is set to true if an account is suspended.
    mapping(address => bool) public _accountIsSuspended;

    struct IdentityBlob {
        uint256 tokenId;
        string countryCode;
        uint8 userType;
        uint8 level;
        uint256 expiry;
    }


    /** 
    @notice Checks if an account has been suspended in the case that the token hasn't been burned and the identity blob has been mainted.
    @param accountToCheckSuspensionStatus address that we check to determine if it has infact been suspended.
    */

    function getAccountSuspendedStatus(address accountToCheckSuspensionStatus) public view returns(bool){
        return _accountIsSuspended[accountToCheckSuspensionStatus];
    }

    /**
    @notice getUserAccountIdentityBlob function returns struct IdentityBlob from the users account
    @param account address of the target user account
    */

    function getUserAccountIdentityBlob(
        address account
    ) public view returns (IdentityBlob memory userIdentityBlob) {
        return (identityBlob[account]);
    }

    /**
    @notice getUserAccountExpiry function returns only the expiry date from the users account
    @param account address of the target user account
    */

    function getUserAccountExpiry(
        address account
    ) public view returns (uint256 userAccountExpiry) {
        return (identityBlob[account].expiry);
    }
}
