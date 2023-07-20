// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Errors.sol";

/**
 * @title IRoleVerification interface for RoleVerification.
 * @author Haven1 Development Team.
 * @notice This contract outlines the base layer of Haven1s provable identity framework.
 * @dev The function of this contract is to establish and return a users account level "identity blob".
 */

interface IRoleVerification {
    /**
     * @notice A mapping that maps account addresses to IdentityBlob struct storage.
     */

    /**
     * @notice The struct representing the user's identity blob.
     */
    struct IdentityBlob {
        uint256 tokenId;
        string countryCode;
        uint8 userType;
        uint8 level;
        uint256 expiry;
        uint8 competencyRating;
    }

    /**
     * @notice `getUserAccountExpiry` function returns only the expiry date from the users account.
     * @param account address of the target user account.
     * @return userAccountExpiry provides the account expiry for the account passed.
     */

    function getUserAccountExpiry(
        address account
    ) external view returns (uint256 userAccountExpiry);


    /**
     * @notice `getUserAccountIdentityBlob` function returns struct IdentityBlob from the users account.
     * @param account address of the target user account.
     * @return userIdentityBlob provides the IdentityBlob struct for the account passed.
     */

    function getUserAccountIdentityBlob(
        address account
    ) external view returns (IdentityBlob memory userIdentityBlob);
}