// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./RoleVerification.sol";

/**
 * @title UserInformationPreventsOnExpiry
 * @author Haven1 Development Team
 * @notice This contract allows developers to utilize Haven1s Proof Of Identity Framework to enforce in date identity documents for access to functions.
 * @dev UserInformationPreventsOnExpiry is accessible by importing VerifiableIdentityPreventsOnExpiry.sol.
 */

abstract contract UserInformationPreventsOnExpiry is RoleVerification {
    /**
     * @notice getUserAccountCountryCode function returns the country code from the users account.
     * @dev function reverts in the event the target account has expired.
     * @param account address of the target user account.
     * @return userAccountCountryCode provides the country code for the specified account passed in the event it has not expired.
     */

    function getUserAccountCountryCodePreventOnExpiry(
        address account
    ) public view returns (string memory userAccountCountryCode) {
        if (block.timestamp >= identityBlob[account].expiry) {
            revert(Errors.ID_INVALID_EXPIRED);
        }
        return (identityBlob[account].countryCode);
    }

    /**
     * @notice `getUserAccountLevelPreventOnExpiry` function returns the verification level from the users account.
     * @dev function reverts in the event the target account has expired.
     * @param account address of the target user account.
     * @return userAccountLevel provides the verification level for the specified account passed in the event it has not expired.
     */

    function getUserAccountLevelPreventOnExpiry(
        address account
    ) public view returns (uint8) {
        if (block.timestamp >= identityBlob[account].expiry) {
            revert(Errors.ID_INVALID_EXPIRED);
        }
        return (identityBlob[account].level);
    }

    /**
     * @notice `getUserAccountTypePreventOnExpiry` function returns the account type from the users account.
     * @dev function reverts in the event the target account has expired.
     * @param account address of the target user account.
     * @return userAccountType provides the account type for the specified account passed in the event it has not expired.
     */

    function getUserAccountTypePreventOnExpiry(
        address account
    ) public view returns (uint8) {
        if (block.timestamp >= identityBlob[account].expiry) {
            revert(Errors.ID_INVALID_EXPIRED);
        }
        return (identityBlob[account].userType);
    }
}
