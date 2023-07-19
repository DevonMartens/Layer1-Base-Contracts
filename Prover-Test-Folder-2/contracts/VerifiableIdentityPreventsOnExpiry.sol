// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Errors.sol";

/**
 * @title VerifiableIdentityPreventsOnExpiry
 * @author Haven1 Development Team
 * @notice This contract allows developers to access and utilise Haven1s Proof Of Identity Framework data.
 * It will revert if a user has expired documents and needs to update their account.
 * @dev Haven1s Proof Of Identity Framework data is available via the imported functions below.
 * The official Haven1 ProofOfIdentity.sol deployment address must be passed via the constructor.
 * UserInformationPreventsOnExpiry provides protected functions to ensure a users Account contains in date identity documents.
 */

 interface IRoleVerification {

    struct IdentityBlob {
        uint256[] largeNumbers;
        uint8[] smallNumbers;
        string[] strings;
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
     * @notice getUserAccountCountryCode function returns the country code from the users account.
     * @dev function reverts in the event the target account has expired.
     * @param account address of the target user account.
     * @return userAccountCountryCode provides the country code for the specified account passed in the event it has not expired.
     */

    function getUserAccountCountryCodePreventOnExpiry(
        address account
    ) external view returns (string memory userAccountCountryCode);

    /**
     * @notice `getUserAccountLevelPreventOnExpiry` function returns the verification level from the users account.
     * @dev function reverts in the event the target account has expired.
     * @param account address of the target user account.
     * @return userAccountLevel provides the verification level for the specified account passed in the event it has not expired.
     */

    function getUserAccountLevelPreventOnExpiry(
        address account
    ) external view returns (uint8);
    /**
     * @notice `getUserAccountTypePreventOnExpiry` function returns the account type from the users account.
     * @dev function reverts in the event the target account has expired.
     * @param account address of the target user account.
     * @return userAccountType provides the account type for the specified account passed in the event it has not expired.
     */

    function getUserAccountTypePreventOnExpiry(
        address account
    ) external view returns (uint8);

}

contract VerifiableIdentityPreventsOnExpiry {
    constructor(address _proofOfIdentityContract) {
      proofOfIdentityContract = _proofOfIdentityContract;
    }
    
    address private proofOfIdentityContract;

    /**
     * @notice `getUserCountryCodePreventOnExpiry` function returns the country code from the users account.
     * @dev call REVERTS in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp.
     * @param account address of the target user account.
     * @return userAccountCountryCode provides the country code for the specified account passed in the event it has not expired.
     */

    function getUserCountryCodePreventOnExpiry(
        address account
    ) public view returns (string memory userAccountCountryCode) { 
        return (
            IRoleVerification(proofOfIdentityContract).getUserAccountCountryCodePreventOnExpiry(account)
            );
    }
   

    /**
     * @notice `getUserExpiry` function returns only the expiry date from the users account.
     * @dev call will NOT REVERT in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp.
     * @param account address of the target user account
     * @return userAccountLevel provides the verification level for the specified account passed.
     */

    function getUserExpiry(address account) public view returns (uint256) {
        return (
            IRoleVerification(proofOfIdentityContract).getUserAccountExpiry(account)
        );
    }

    /**
     * @notice `getUserLevelPreventOnExpiry` function returns the verification level from the users account.
     * @dev call REVERTS in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp.
     * @param account address of the target user account.
     * @return userAccountLevel provides the verification level for the specified account passed in the event it has not expired.
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
     * @notice `getUserTypePreventOnExpiry` function returns the account type from the users account.
     * @dev call REVERTS in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp.
     * @param account address of the target user account.
     * @return userAccountType provides the account type for the specified account passed in the event it has not expired.
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