// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./RoleVerification.sol";

/**
 * @title UserInformation
 * @author Haven1 Development Team
 * @notice This contract is imported by VerifiableIdentity.sol and allows developers to access and utilise Haven1s Proof Of Identity Framework data.
 * @dev UserInformation is accessible by importing VerifiableIdentity.sol.
 */

abstract contract UserInformation is RoleVerification {
    /**
     * @notice `getUserAccountCountryCode` function returns the country code from the users account.
     * @param account address of the target user account.
     * @return userAccountCountryCode provides the country code for the specified account passed.
     */

    function getUserAccountCountryCode(
        address account
    ) public view returns (string memory userAccountCountryCode) {
        return (identityBlob[account].countryCode);
    }

    /**
     * @notice `getUserAccountLevel` function returns the verification level from the users account.
     * @param account address of the target user account.
     * @return userAccountLevel provides the verification level for the specified account passed.
     */

    function getUserAccountLevel(
        address account
    ) public view returns (uint8 userAccountLevel) {
        return (identityBlob[account].level);
    }

    /**
     * @notice `getUserAccountType` function returns the account type from the users account.
     * @param account address of the target user account.
     * @return userAccountType provides the account type for the specified account passed.
     */

    function getUserAccountType(
        address account
    ) public view returns (uint8 userAccountType) {
        return (identityBlob[account].userType);
    }
}