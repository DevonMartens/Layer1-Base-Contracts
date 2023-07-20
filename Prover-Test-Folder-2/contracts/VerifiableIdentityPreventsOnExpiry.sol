// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "./Errors.sol";


/**
* @title IRoleVerification
* @author Haven1 Development Team
* @notice This contract is an interface for the RoleVerification portion of the Proof of Identity
* it provides VerifiableIdentityPreventsOnExpiry the ability to call these functions.
*/
interface IRoleVerification {


struct IdentityBlob {
uint256[] largeNumbers;
uint8[] smallNumbers;
string[] strings;
}


/**
* @notice `getUserAccountExpiry` this function returns the expiry date from the users account.
* @param account address of the target user account.
* @return userAccountExpiry provides the account expiry for the account passed.
*/
function getUserAccountExpiry(
address account
) external view returns (uint256 userAccountExpiry);


/**
* @notice `getUserAccountCountryCode` provides the country code for the 
* specified account passed in the event it has not expired.
* @dev function reverts in the event the target account has expired.
* @param account address of the target user account.
*/
function getUserAccountCountryCodePreventOnExpiry(
address account
) external view returns (string memory userAccountCountryCode);


/**
* @notice `getUserAccountLevelPreventOnExpiry` function returns the verification level from the user's account.
* @dev function reverts in the event the target account has expired.
* @param account address of the target user account.
* @return userAccountLevel provides the verification level for the specified account passed in the event it has not expired.
*/
function getUserAccountLevelPreventOnExpiry(
address account
) external view returns (uint8);

/**
* @notice `getUserAccountTypePreventOnExpiry` function returns the account type from the user's account.
* @dev function reverts in the event the target account has expired.
* @param account address of the target user account.
* @return userAccountType provides the account type for the specified account passed in the event it has not expired.
*/
function getUserAccountTypePreventOnExpiry(
address account
) external view returns (uint8);


/**
* @notice `getUserCompetencyRatingPreventOnExpiry` gets the competency rating a user
* earned testing but access to it is prevented if the identity has expired.
* @param account The address of the target user account.
* @return The competency rating for the specified account, if the identity has not expired.
* @dev This function reverts if the target account's identity has expired.
*/


function getUserAccountCompetencyRatingPreventOnExpiry(
address account
) external view returns (uint8);


}


/**
* @title VerifiableIdentityPreventsOnExpiry
* @author Haven1 Development Team
* @notice This contract allows developers to access and to utilize Haven1s Proof Of Identity Framework data.
* It will revert if a user has expired documents and needs to update their account.
* @dev Haven1s Proof Of Identity Framework data is available via the imported functions below.
* The official Haven1 ProofOfIdentity.sol deployment address must be passed via the constructor.
* UserInformationPreventsOnExpiry provides protected functions to ensure a user's Account contains in date identity documents.
*/


    contract VerifiableIdentityPreventsOnExpiry {
    constructor(address _proofOfIdentityContract) {
    proofOfIdentityContract = _proofOfIdentityContract;
    }

    // Storage for the 
    address private proofOfIdentityContract;


    /**
    * @notice `getUserCountryCodePreventOnExpiry` function returns the country code from the user's account.
    * @dev call reverts in the event the target accounts expiry is less than the current block.timestamp.
    * @param account address of the target user account.
    * @return userAccountCountryCode provides the country code for the specified account passed in the event it has not expired.
    * @dev This function reverts if the target account's identity has expired./
    */


    function getUserCountryCodePreventOnExpiry(
    address account
    ) public view returns (string memory userAccountCountryCode) {
    return (
    IRoleVerification(proofOfIdentityContract).getUserAccountCountryCodePreventOnExpiry(account)
    );
    }


    /**
    * @notice `getUserExpiry` function returns the expiry date from the user's account.
    * @param account address of the target user account
    * @return userAccountLevel provides the verification level for the specified account passed in the event it has not expired.
    * @dev This function reverts if the target account's identity has expired.
    */


    function getUserExpiry(address account) public view returns (uint256) {
    return (
    IRoleVerification(proofOfIdentityContract).getUserAccountExpiry(account)
    );
    }


    /**
    * @notice `getUserLevelPreventOnExpiry` function returns the verification level from the user's account.
    * @dev call reverts in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp.
    * @param account address of the target user account.
    * @return userAccountLevel provides the verification level for the specified account passed in the event it has not expired.'
    * @dev This function reverts if the target account's identity has expired.
    */


    function getUserLevelPreventOnExpiry(
    address account
    ) public view returns (uint8 userAccountLevel) {
    return (
    IRoleVerification(proofOfIdentityContract)
    .getUserAccountLevelPreventOnExpiry(account)
    );
    }


    /**
    * @notice `getUserCompetencyRatingPreventOnExpiry` gets the competency rating a user
    * earned testing but access to it is prevented if the identity has expired.
    * @param account The address of the target user account.
    * @return The competency rating for the specified account, if the identity has not expired.
    * @dev This function reverts if the target account's identity has expired.
    */


    function getUserCompetencyRatingPreventOnExpiry(
    address account
    ) public view returns (uint8) {
    return (
    IRoleVerification(proofOfIdentityContract)
    .getUserAccountCompetencyRatingPreventOnExpiry(account)
    );
    }


    /**
    * @notice `getUserTypePreventOnExpiry` function returns the account type from the user's account.
    * @dev call reverts in the event the target accounts expiry is less than the current block.timestamp.
    * @param account address of the target user account.
    * @return userAccountType provides the account type for the specified account passed in the event it has not expired.
    * @dev This function reverts if the target account's identity has expired.
    */


    function getUserTypePreventOnExpiry(
    address account
    ) public view returns (uint8 userAccountType) {
    return (
    IRoleVerification(proofOfIdentityContract)
    .getUserAccountTypePreventOnExpiry(account)
    );
    }
    }
