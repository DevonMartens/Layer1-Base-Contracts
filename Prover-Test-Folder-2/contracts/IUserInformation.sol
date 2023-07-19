
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "./IRoleVerification.sol";

/**
@title IUserInformation
@dev Interface for accessing user information from Haven1's Proof of Identity framework.
*/
interface IUserInformation is IRoleVerification {

/*
@notice `getUserAccountCountryCode` retrieves the country code associated with a user's account.
@param account The address of the user account.
*/

function getUserAccountCountryCode(address account) external view returns (string memory userAccountCountryCode);

/**
@notice `getUserAccountLevel` retrieves the verification level of a user's account.
@param account The address of the user account.
*/

function getUserAccountLevel(address account) external view returns (uint8 userAccountLevel);

/**
@notice `getUserAccountType` retrieves the account type of a user's account.
@param account The address of the user account.
*/

function getUserAccountType(address account) external view returns (uint8 userAccountType);

}