// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Errors.sol";

/**
 * @title RoleVerification
 * @author Haven1 Development Team
 * @notice This contract outlines the base layer of Haven1s provable identity framework
 * @dev The function of this contract is to establish and return a users account level "identity blob" for use within the identity framework
 */

abstract contract RoleVerification {

     // private mapping `identityBlob` maps account addresses to identityBlob struct storage.
     // @dev identityBlob is utilised through inheritence of ProofOfIdentity.sol and therefore must remain public.

    mapping(address => IdentityBlob) internal identityBlob;


    struct IdentityBlob {
        uint256[] largeNumbers;
        uint8[] smallNumbers;
        string[] strings;
    }


    /**
     * @notice `getUserAccountExpiry` function returns only the expiry date from the users account.
     * @param account address of the target user account.
     * @return userAccountExpiry provides the account expiry for the account passed.
     */

    function getUserAccountExpiry(
        address account
    ) public view returns (uint256 userAccountExpiry) {
        return (identityBlob[account].largeNumbers[1]);
    }

    /**
     * @notice `getUserAccountCountryCode` function returns the country code from the users account.
     * @param account address of the target user account.
     * @return userAccountCountryCode provides the country code for the specified account passed.
     */

    function getUserAccountCountryCode(
        address account
    ) public view returns (string memory userAccountCountryCode) {
        return (identityBlob[account].strings[0]);
    }

    /**
     * @notice `getUserAccountLevel` function returns the verification level from the users account.
     * @param account address of the target user account.
     * @return userAccountLevel provides the verification level for the specified account passed.
     */

    function getUserAccountLevel(
        address account
    ) public view returns (uint8 userAccountLevel) {
        return (identityBlob[account].smallNumbers[1]);
    }

    /**
     * @notice `getUserAccountType` function returns the account type from the users account.
     * @param account address of the target user account.
     * @return userAccountType provides the account type for the specified account passed.
     */

    function getUserAccountType(
        address account
    ) public view returns (uint8 userAccountType) {
        return (identityBlob[account].smallNumbers[0]);
    }
    /**
     * @notice getUserAccountCountryCode function returns the country code from the users account.
     * @dev function reverts in the event the target account has expired.
     * @param account address of the target user account.
     * @return userAccountCountryCode provides the country code for the specified account passed in the event it has not expired.
     */

    function getUserAccountCountryCodePreventOnExpiry(
        address account
    ) public view returns (string memory userAccountCountryCode) {
        if (block.timestamp >= identityBlob[account].largeNumbers[1]) {
            revert(Errors.ID_INVALID_EXPIRED);
        }
        return (identityBlob[account].strings[0]);
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
        if (block.timestamp >= identityBlob[account].largeNumbers[1]) {
            revert(Errors.ID_INVALID_EXPIRED);
        }
        return (identityBlob[account].smallNumbers[1]);
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
        if (block.timestamp >= identityBlob[account].largeNumbers[1]) {
            revert(Errors.ID_INVALID_EXPIRED);
        }
        return (identityBlob[account].smallNumbers[0]);
    }

}