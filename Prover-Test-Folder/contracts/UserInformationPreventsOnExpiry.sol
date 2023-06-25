// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./RoleVerification.sol";
import "./Errors.sol";

/**
* @title UserInformationPreventsOnExpiry
* @author Haven1 Development Team
* @notice This contract allows developers to utilise Haven1s Proof Of Identity Framework 
* to enforce in date identity documents for access to functions
* @dev UserInformationPreventsOnExpiry is accessible by importing VerifiableIdentityPreventsOnExpiry.sol to a contract
*/

abstract contract UserInformationPreventsOnExpiry is RoleVerification {
    /**
    @notice getUserAccountCountryCode function returns the country code from the users account
    @dev function reverts in the event the target account has expired
    @param account address of the target user account
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
    @notice getUserAccountType function returns the account type from the users account
    @dev function reverts in the event the target account has expired
    @param account address of the target user account
    */

    function getUserAccountTypePreventOnExpiry(
        address account
    ) public view returns (uint8) {
        if (block.timestamp >= identityBlob[account].expiry) {
            revert(Errors.ID_INVALID_EXPIRED);
        }
        return (identityBlob[account].userType);
    }

    /**
    @notice getUserAccountLevel function returns the verification level from the users account
    @dev function reverts in the event the target account has expired
    @param account address of the target user account
    */

    function getUserAccountLevelPreventOnExpiry(
        address account
    ) public view returns (uint8) {
        if (block.timestamp >= identityBlob[account].expiry) {
            revert(Errors.ID_INVALID_EXPIRED);
        }
        return (identityBlob[account].level);
    }
}
