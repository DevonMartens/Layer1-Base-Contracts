// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Errors.sol";

/**
 * @title RoleVerification
 * @author Haven1 Development Team
 * @notice This contract outlines the base layer of Haven1s provable identity framework
 * @dev The function of this contract is to establish and return a users account level "identity blob" for use within the identity framework
 */

abstract contract NewRoleVerification {
    /**
     * @notice public mapping `identityBlob` maps account addresses to identityBlob struct storage.
     * @dev identityBlob is utilised through inheritence of ProofOfIdentity.sol and therefore must remain public.
     */

    mapping(address => IdentityBlob) public identityBlob;

    struct IdentityBlob {
        uint256 tokenId;
        string countryCode;
        uint8 userType;
        uint8 level;
        uint256 expiry;
        //random additions testing first in the middle of struct
        string name;
    }

    /**
     * @notice `getUserAccountExpiry` function returns only the expiry date from the users account.
     * @param account address of the target user account.
     * @return userAccountExpiry provides the account expiry for the account passed.
     */

    function getUserAccountExpiry(
        address account
    ) public view returns (uint256 userAccountExpiry) {
        return (identityBlob[account].expiry);
    }

    /**
     * @notice `getUserAccountIdentityBlob` function returns struct IdentityBlob from the users account.
     * @param account address of the target user account.
     * @return userIdentityBlob provides the IdentityBlob struct for the account passed.
     */

    function getUserAccountIdentityBlob(
        address account
    ) public view returns (IdentityBlob memory userIdentityBlob) {
        return (identityBlob[account]);
    }
}