// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UserInformationPreventsOnExpiry.sol";

/**  
@title UserInformationPreventsOnExpiry
@author Haven1 Development Team
@notice This contract allows developers to access and utilise Haven1s Proof Of Identity Framework data
@dev Haven1s Proof Of Identity Framework data becomes available via the imported functions below
The official Haven1 ProofOfIdentity.sol deployment address must be passed via the constructor
UserInformationPreventsOnExpiry provides protected functions to ensure a users Account contains in date identity documents
*/

contract VerifiableIdentityPreventsOnExpiry is UserInformationPreventsOnExpiry {
    constructor(address proofContract) {
        VERIFIABLE_IDENTITY_PREVENT_ON_EXPIRY = UserInformationPreventsOnExpiry(
            proofContract
        );
    }

    UserInformationPreventsOnExpiry
        private VERIFIABLE_IDENTITY_PREVENT_ON_EXPIRY;

    /**
    @notice getUserIdentityData function returns struct IdentityBlob from the users account
    @param account address of the target user account
    */

    function getUserIdentityData(
        address account
    ) public view returns (IdentityBlob memory userAccountIdentityBlob) {
        return (
            VERIFIABLE_IDENTITY_PREVENT_ON_EXPIRY.getUserAccountIdentityBlob(
                account
            )
        );
    }

    /**
    @notice getUserCountryCode function returns the country code from the users account
    @dev function reverts in the event the target account has expired
    @param account address of the target user account
    */

    function getUserCountryCodePreventOnExpiry(
        address account
    ) public view returns (string memory userAccountCountryCode) {
        return (
            VERIFIABLE_IDENTITY_PREVENT_ON_EXPIRY
                .getUserAccountCountryCodePreventOnExpiry(account)
        );
    }

    /**
    @notice getUserLevel function returns the verification level from the users account
    @dev function reverts in the event the target account has expired
    @param account address of the target user account
    */

    function getUserLevelPreventOnExpiry(
        address account
    ) public view returns (uint8 userAccountLevel) {
        return (
            VERIFIABLE_IDENTITY_PREVENT_ON_EXPIRY
                .getUserAccountLevelPreventOnExpiry(account)
        );
    }

    /**
    @notice getUserExpiry function returns only the expiry date from the users account
    @param account address of the target user account
    */

    function getUserExpiry(address account) public view returns (uint256) {
        return (
            VERIFIABLE_IDENTITY_PREVENT_ON_EXPIRY.getUserAccountExpiry(account)
        );
    }

    /**
    @notice getUserType function returns the account type from the users account
    @dev function reverts in the event the target account has expired
    @param account address of the target user account
    */

    function getUserTypePreventOnExpiry(
        address account
    ) public view returns (uint8 userAccountType) {
        return (
            VERIFIABLE_IDENTITY_PREVENT_ON_EXPIRY
                .getUserAccountTypePreventOnExpiry(account)
        );
    }
}
