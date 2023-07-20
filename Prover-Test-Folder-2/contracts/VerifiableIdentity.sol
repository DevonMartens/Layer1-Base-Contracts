//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;




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
* @notice `getUserAccountExpiry` function returns only the expiry date from the user's account.
* @param account address of the target user account.
* @return userAccountExpiry provides the account expiry for the account passed.
*/


function getUserAccountExpiry(
address account
) external view returns (uint256 userAccountExpiry);


/**
* @notice `getUserAccountCompetencyRating` gets the competency rating a user
* earned testing.
* @param account The address of the target user account.
* @return The competency rating for the specified account.
*/


function getUserAccountCompetencyRating(
address account
) external view returns (uint8);




/**
* @notice `getUserAccountCountryCode` function returns the country code from the user's account.
* @param account address of the target user account.
* @return userAccountCountryCode provides the country code for the specified account passed.
*/


function getUserAccountCountryCode(
address account
) external view returns (string memory userAccountCountryCode);


/**
* @notice `getUserAccountLevel` function returns the verification level from the user's account.
* @param account address of the target user account.
* @return userAccountLevel provides the verification level for the specified account passed.
*/


function getUserAccountLevel(
address account
) external view returns (uint8 userAccountLevel);


/**
* @notice `getUserAccountType` function returns the account type from the users account.
* @param account address of the target user account.
* @return userAccountType provides the account type for the specified account passed.
*/


function getUserAccountType(
address account
) external view returns (uint8 userAccountType);


}




/**
* @title VerifiableIdentity
* @author Haven1 Development Team
* @notice This contract allows developers to access and to utilize Haven1s Proof Of Identity Framework data.
* @dev Haven1s Proof Of Identity Framework data becomes available via the imported functions below.
* The official Haven1 ProofOfIdentity.sol deployment address must be passed via the constructor.
*/




contract VerifiableIdentity {
constructor(address _proofOfIdentityContract) {
proofOfIdentityContract = _proofOfIdentityContract;
}
address private proofOfIdentityContract;


/**
* @notice `getUserCompetencyRating` gets the competency rating a user
* earned testing.
* @param account The address of the target user account.
* @return The competency rating for the specified account.
*/


function getUserCompetencyRating(
address account
) public view returns (uint8) {
return (IRoleVerification(proofOfIdentityContract).getUserAccountCompetencyRating(account));
}




/**
@notice `getUserCountryCode` function returns the country code from the users account
@param account address of the target user account
@return userAccountCountryCode of a specified account.
*/


function getUserCountryCode(
address account
) public view returns (string memory userAccountCountryCode) {
return (IRoleVerification(proofOfIdentityContract).getUserAccountCountryCode(account));
}


/**
@notice `getUserExpiry` function returns the expiry date from the users account.
@param account address of the target user account.
@return The expiry block timestamp of the user's account.
*/


function getUserExpiry(address account) public view returns (uint256) {
return (IRoleVerification(proofOfIdentityContract).getUserAccountExpiry(account));
}


/**
@notice `getUserLeve`l function returns the verification level from the users account.
@param account address of the target user account.
@return userAccountLevel of a user's account.
*/


function getUserLevel(
address account
) public view returns (uint8 userAccountLevel) {
return (IRoleVerification(proofOfIdentityContract).getUserAccountLevel(account));
}


/**
@notice `getUserType` function returns the account type from the users account.
@param account address of the target user account.
@return userAccountType of a account a user owns.
*/


function getUserType(
address account
) public view returns (uint8 userAccountType) {
return (IRoleVerification(proofOfIdentityContract).getUserAccountType(account));
}
}
