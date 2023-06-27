// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UserInformationPreventsOnExpiry.sol";

/**
 * @title UserInformationPreventsOnExpiry
 * @author Haven1 Development Team
 * @notice This contract allows developers to access and utilise Haven1s Proof Of Identity Framework data.
 * @dev Haven1s Proof Of Identity Framework data is available via the imported functions below.
 * The official Haven1 ProofOfIdentity.sol deployment address must be passed via the constructor.
 * UserInformationPreventsOnExpiry provides protected functions to ensure a users Account contains in date identity documents.
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
     * @notice `getUserCountryCodePreventOnExpiry` function returns the country code from the users account.
     * @dev call REVERTS in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp.
     * @param account address of the target user account.
     * @return userAccountCountryCode provides the country code for the specified account passed in the event it has not expired.
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
     * @notice `getUserExpiry` function returns only the expiry date from the users account.
     * @dev call will NOT REVERT in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp.
     * @param account address of the target user account
     * @return userAccountLevel provides the verification level for the specified account passed.
     */

    function getUserExpiry(address account) public view returns (uint256) {
        return (
            VERIFIABLE_IDENTITY_PREVENT_ON_EXPIRY.getUserAccountExpiry(account)
        );
    }

    /**
     * @notice `getUserIdentityData` function returns struct IdentityBlob from the users account.
     * @dev call will NOT REVERT in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp.
     * @param account address of the target user account.
     * @return userAccountIdentityBlob provides the IdentityBlob data for the specified account passed.
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
     * @notice `getUserLevelPreventOnExpiry` function returns the verification level from the users account.
     * @dev call REVERTS in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp.
     * @param account address of the target user account.
     * @return userAccountLevel provides the verification level for the specified account passed in the event it has not expired.
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
     * @notice `getUserTypePreventOnExpiry` function returns the account type from the users account.
     * @dev call REVERTS in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp.
     * @param account address of the target user account.
     * @return userAccountType provides the account type for the specified account passed in the event it has not expired.
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