// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Errors.sol";

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
        uint256 tokenId;
        string countryCode;
        uint8 userType;
        uint8 level;
        uint256 expiry;
        uint8 competencyRating;
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
}