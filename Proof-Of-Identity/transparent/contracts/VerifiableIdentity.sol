//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IRoleVerification.sol";


/**
* @title VerifiableIdentity
* @author Devon
* @notice This contract allows developers to access and to utilize Haven1s Proof Of Identity Framework data.
* @dev Haven1s Proof Of Identity Framework data becomes available via the imported functions below.
The official Haven1 ProofOfIdentity.sol deployment address must be passed via the constructor.
*/

contract VerifiableIdentity {
    constructor(address _proofOfIdentityContract) {
      proofOfIdentityContract = _proofOfIdentityContract;
    }
    
    // Storage for proof of identity contract.
    address private proofOfIdentityContract;

    // Error that occurs when a token is expired.
    error IDInvalidExpired();

    /**
    * @notice Modifier to prevent certain actions if the specified account's identity has expired.
    * @param account The address of the account to check for identity expiry.
    */
    modifier preventOnExpiry(address account) {
        if (block.timestamp >= getUserExpiry(account)) {
            revert IDInvalidExpired();
        }
        _;
    }

     /**
     * @notice `getUserCompetencyRating` gets the competency rating a user
     * earned testing.
     * @param account The address of the target user account.
     * @return The competency rating for the specified account account passed in.
     */
    function getUserCompetencyRating(
        address account
    ) public view returns (uint8) {
        return (IRoleVerification(proofOfIdentityContract).getUserAccountCompetencyRating(account));
    }

    /**
    @notice getUserCountryCode function returns the country code from the users account
    @param account address of the target user account
    @return userAccountCountryCode provides the country code for the specified account passed in.
    */
    function getUserCountryCode(
        address account
    ) public view returns (string memory userAccountCountryCode) {
        return (IRoleVerification(proofOfIdentityContract).getUserAccountCountryCode(account));
    }

    /**
    @notice `getUserExpiry` function returns the expiry date from the users account.
    @param account address of the target user account.
    @return userAccountExpiry the expiry block timestamp of the user's account.
    */ 
    function getUserExpiry(address account) public view returns (uint256 userAccountExpiry) {
        return (IRoleVerification(proofOfIdentityContract).getUserAccountExpiry(account));
    }

    /**
    @notice getUserIdentityData function returns struct IdentityBlob from the users account.
    @param account address of the target user account.
    @return userAccountIdentityBlob provides the IdentityBlob data for the specified account passed.
    */
    function getUserIdentityData(
        address account
    ) public view returns (IRoleVerification.IdentityBlob memory) {
        return (IRoleVerification(proofOfIdentityContract).getUserAccountIdentityBlob(account));
    }

    /**
    @notice getUserLevel function returns the verification level from the users account.
    @param account address of the target user account.
    @return userAccountLevel provides the verification level for the specified account.
    */
    function getUserLevel(
        address account
    ) public view returns (uint8 userAccountLevel) {
        return (IRoleVerification(proofOfIdentityContract).getUserAccountLevel(account));
    }

    /**
    @notice getUserType function returns the account type from the users account.
    @param account address of the target user account.
    @return userAccountType provides the account type for the specified account passed.
    */
    function getUserType(
        address account
    ) public view returns (uint8 userAccountType) {
        return (IRoleVerification(proofOfIdentityContract).getUserAccountType(account));
    }

    /**
     * @notice `getUserAccountCompetencyRatingPreventOnExpiry` gets the competency rating a user
     * earned testing but access to it is prevented if the identity has expired.
     * @param account The address of the target user account.
     * @return The competency rating for the specified account, if the identity has not expired.
     * @dev This function reverts if the target account's identity has expired.
     */
     function getUserCompetencyRatingPreventOnExpiry(
        address account
    ) public view preventOnExpiry(account) returns (uint8) {
        return (IRoleVerification(proofOfIdentityContract).getUserAccountCompetencyRating(account));
    }

    /**
     * @notice `getUserCountryCodePreventOnExpiry` function returns the country code from the users account.
     * @dev The call reverts in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp.
     * @param account The address of the target user account.
     * @return userAccountCountryCode provides the country code for the specified account passed in the event it has not expired.
     */
    function getUserCountryCodePreventOnExpiry(
        address account
    ) public view preventOnExpiry(account) returns (string memory userAccountCountryCode) {
        return (IRoleVerification(proofOfIdentityContract).getUserAccountCountryCode(account));
    }

    /**
     * @notice `getUserLevelPreventOnExpiry` function returns the verification level from the users account.
     * @dev The call reverts in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp.
     * @param account The address of the target user account.
     * @return userAccountLevel provides the verification level for the specified account passed in the event it has not expired.
     */
    function getUserLevelPreventOnExpiry(
        address account
    ) public view  preventOnExpiry(account) returns (uint8 userAccountLevel) {
        return (IRoleVerification(proofOfIdentityContract).getUserAccountLevel(account));
    }

    /**
     * @notice `getUserTypePreventOnExpiry` function returns the account type from the users account.
     * @dev The call reverts in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp.
     * @param account The address of the target user account.
     * @return userAccountType provides the account type for the specified account passed in the event it has not expired.
     */
    function getUserTypePreventOnExpiry(
        address account
    ) public view  preventOnExpiry(account) returns (uint8 userAccountType) {
        return (IRoleVerification(proofOfIdentityContract).getUserAccountType(account));
    }   
}