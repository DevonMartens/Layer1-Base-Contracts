// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IRoleVerification.sol";



/**
* @title IUserInformationPreventsOnExpiry
* @notice Interface for accessing user information and enforcing 
* in-date identity documents for access to functions.
* @dev All functions revert when the target account's identity has expired.
*/

interface IUserInformationPreventsOnExpiry is IRoleVerification {

    /*
    @notice `getUserAccountCountryCodePreventOnExpiry` retrieves the country code from the user's account.
    @param account Address of the target user account.
    */
    function getUserAccountCountryCodePreventOnExpiry(address account) external view returns (string memory);

    /**
    @notice `getUserAccountLevelPreventOnExpiry` retrieves the verification level from the user's account.
    @param account Address of the target user account.
    */
    function getUserAccountLevelPreventOnExpiry(address account) external view returns (uint8);

    /**
    @notice `getUserAccountTypePreventOnExpiry` retrieves the account type from the user's account.
    @param account Address of the target user account.
    */
    function getUserAccountTypePreventOnExpiry(address account) external view returns (uint8);

    /**
     * @notice `getUserCompetencyRatingPreventOnExpiry` gets the competency rating a user
     * earned testing but access to it is prevented if the identity has expired.
     * @param account The address of the target user account.
     */
     function getUserAccountCompetencyRatingPreventOnExpiry(
        address account
    ) external view returns (uint8);

}