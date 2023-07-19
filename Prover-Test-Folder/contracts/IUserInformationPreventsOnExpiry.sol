// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IRoleVerification.sol";



/**
@title IUserInformationPreventsOnExpiry
@notice Interface for accessing user information and enforcing in-date identity documents for access to functions.
*/

interface IUserInformationPreventsOnExpiry is IRoleVerification {

/*
@notice `getUserAccountCountryCodePreventOnExpiry` retrieves the country code from the user's account.
@dev Reverts if the target account has expired.
@param account Address of the target user account.
@return Country code for the specified account if it has not expired.
*/

function getUserAccountCountryCodePreventOnExpiry(address account) external view returns (string memory);

/**
@notice `getUserAccountLevelPreventOnExpiry` retrieves the verification level from the user's account.
@dev Reverts if the target account has expired.
@param account Address of the target user account.
@return Verification level for the specified account if it has not expired.
*/

function getUserAccountLevelPreventOnExpiry(address account) external view returns (uint8);

/**
@notice `getUserAccountTypePreventOnExpiry` retrieves the account type from the user's account.
@dev Reverts if the target account has expired.
@param account Address of the target user account.
@return Account type for the specified account if it has not expired.
*/

function getUserAccountTypePreventOnExpiry(address account) external view returns (uint8);

}