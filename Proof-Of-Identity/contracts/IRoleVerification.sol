// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IRoleVerification interface for RoleVerification.
 * @author Devon.
 * @notice This contract outlines the base layer of Haven1s provable identity framework.
 * @dev The function of this contract is to establish and return a users account level "identity blob".
 */

interface IRoleVerification {
    
    /**
     * @notice The struct representing the user's identity blob.
     */
    struct IdentityBlob {
        string countryCode;
        uint8 userType;
        uint8 level;
        uint8 competencyRating;
        uint256 tokenId;
        uint256 expiry;  
    }

     /**
     * @notice `getUserAccountExpiry` function returns the expiry date from the users account.
     * @param account address of the target user account.
     */
    function getUserAccountExpiry(
        address account
    ) external view returns (uint256 userAccountExpiry);


     /**
     * @notice `getUserAccountIdentityBlob` function returns struct IdentityBlob from the users account.
     * @param account address of the target user account.
     */
    function getUserAccountIdentityBlob(
        address account
    ) external view returns (IdentityBlob memory userIdentityBlob);

    /**
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

    /**
    * @notice `getUserAccountCompetencyRating` gets the competency rating a user
    * earned testing.
    * @param account The address of the target user account.
    */
    function getUserAccountCompetencyRating(
        address account
    ) external view returns (uint8);
}