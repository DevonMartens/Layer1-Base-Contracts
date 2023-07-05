//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./new/NewUserInformation.sol";

/**
* @title VerifiableIdentity
* @author Haven1 Development Team
* @notice This contract allows developers to access and utilise Haven1s Proof Of Identity Framework data.
* @dev Haven1s Proof Of Identity Framework data becomes available via the imported functions below.
The official Haven1 ProofOfIdentity.sol deployment address must be passed via the constructor.
*/

contract NewVerifiableIdentity is NewUserInformation {
    constructor(address proofContract) {
        VERIFIABLE_IDENTITY = NewUserInformation(proofContract);
    }

    NewUserInformation private VERIFIABLE_IDENTITY;

    //dummy function
    function getUserName(
        address account
    ) public view returns (string memory userName) {
        return (VERIFIABLE_IDENTITY.getUserAccountName(account));
    }


    /**
    @notice getUserCountryCode function returns the country code from the users account
    @param account address of the target user account
    */

    function getUserCountryCode(
        address account
    ) public view returns (string memory userAccountCountryCode) {
        return (VERIFIABLE_IDENTITY.getUserAccountCountryCode(account));
    }

    /**
    @notice getUserExpiry function returns only the expiry date from the users account
    @param account address of the target user account
    */

    function getUserExpiry(address account) public view returns (uint256) {
        return (VERIFIABLE_IDENTITY.getUserAccountExpiry(account));
    }

    /**
    @notice getUserIdentityData function returns struct IdentityBlob from the users account
    @param account address of the target user account
    */

    function getUserIdentityData(
        address account
    ) public view returns (IdentityBlob memory userAccountIdentityBlob) {
        return (VERIFIABLE_IDENTITY.getUserAccountIdentityBlob(account));
    }

    /**
    @notice getUserLevel function returns the verification level from the users account
    @param account address of the target user account
    */

    function getUserLevel(
        address account
    ) public view returns (uint8 userAccountLevel) {
        return (VERIFIABLE_IDENTITY.getUserAccountLevel(account));
    }

    /**
    @notice getUserType function returns the account type from the users account
    @param account address of the target user account
    */

    function getUserType(
        address account
    ) public view returns (uint8 userAccountType) {
        return (VERIFIABLE_IDENTITY.getUserAccountType(account));
    }
}