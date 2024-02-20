// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


/**
 * @title RoleVerification
 * @author Devon
 * @notice This contract outlines the base layer of Haven1s provable identity framework.
 * @dev The function of this contract is to establish and return a user's account level "identity blob" 
 * for use within the identity framework.
 */

abstract contract RoleVerification {

    // internal mapping `identityBlob` maps account addresses to identityBlob struct storage.
    // identityBlob is utilised through inheritence of ProofOfIdentity.sol.
    mapping(address => IdentityBlob) internal identityBlob;

    // Storage for user identity data.
    struct IdentityBlob {
        string countryCode;
        uint8 userType;
        uint8 level;
        uint8 competencyRating;
        uint256 tokenId;
        uint256 expiry;  
    }

     /**
     * @notice `getUserAccountExpiry` function returns only the expiry date from the user's account.
     * @param account address of the target user account.
     * @return userAccountExpiry provides the account expiry for the account passed.
     */
    function getUserAccountExpiry(
        address account
    ) public view returns (uint256 userAccountExpiry) {
        return (identityBlob[account].expiry);
    }

     /**
     * @notice `getUserAccountIdentityBlob` function returns the struct IdentityBlob as it maps to a target user's account.
     * @param account address of the target user account.
     * @return userIdentityBlob provides the IdentityBlob struct for the account passed.
     */
    function getUserAccountIdentityBlob(
        address account
    ) public view returns (IdentityBlob memory userIdentityBlob) {
        return (identityBlob[account]);
    }

    /**
     * @notice `getUserAccountCompetencyRating` gets the competency rating a user
     * earned testing their De-Fi knowledge.
     * @param account The address of the target user account.
     * @return The competency rating for the specified account.
     */
    function getUserAccountCompetencyRating(
        address account
    ) public view returns (uint8) {
        return (identityBlob[account].competencyRating);
    }
    
    
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