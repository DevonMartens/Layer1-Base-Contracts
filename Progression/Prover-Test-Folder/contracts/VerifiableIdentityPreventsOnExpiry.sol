// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IUserInformationPreventsOnExpiry.sol";

/**
 * @title VerifiableIdentityPreventsOnExpiry
 * @author Devon
 * @notice This contract allows developers to access and to utilize Haven1s Proof Of Identity Framework data.
 * It will revert if a user has expired documents and needs to update their account.
 * @dev Haven1s Proof Of Identity Framework data is available via the imported functions below.
 * The official Haven1 ProofOfIdentity.sol deployment address must be passed via the constructor.
 * UserInformationPreventsOnExpiry provides protected functions to ensure a users Account contains in date identity documents.
 */

contract VerifiableIdentityPreventsOnExpiry {
    constructor(address _proofOfIdentityContract) {
      proofOfIdentityContract = _proofOfIdentityContract;
    }
    
    address private proofOfIdentityContract;

     /**
     * @notice `getUserAccountCompetencyRatingPreventOnExpiry` gets the competency rating a user
     * earned testing but access to it is prevented if the identity has expired.
     * @param account The address of the target user account.
     * @return The competency rating for the specified account, if the identity has not expired.
     * @dev This function reverts if the target account's identity has expired.
     */

     function getUserCompetencyRatingPreventOnExpiry(
        address account
    ) public view returns (uint8) {
        return (IUserInformationPreventsOnExpiry(proofOfIdentityContract).getUserAccountCompetencyRatingPreventOnExpiry(account));
    }

    /**
     * @notice `getUserCountryCodePreventOnExpiry` function returns the country code from the users account.
     * @dev The call reverts in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp.
     * @param account The address of the target user account.
     * @return userAccountCountryCode provides the country code for the specified account passed in the event it has not expired.
     */

    function getUserCountryCodePreventOnExpiry(
        address account
    ) public view returns (string memory userAccountCountryCode) {
        return (
            IUserInformationPreventsOnExpiry(proofOfIdentityContract)
                .getUserAccountCountryCodePreventOnExpiry(account)
        );
    }

    /**
     * @notice `getUserExpiry` function returns only the expiry date from the users account.
     * @dev The call will not revert in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp.
     * @param account The address of the target user account.
     * @return userAccountLevel provides the verification level for the specified account passed in the event it has not expired.
     */

    function getUserExpiry(address account) public view returns (uint256) {
        return (
            IUserInformationPreventsOnExpiry(proofOfIdentityContract).getUserAccountExpiry(account)
        );
    }

    /**
     * @notice `getUserIdentityData` function returns struct IdentityBlob from the users account.
     * @dev The call will not revert in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp.
     * @param account The address of the target user account.
     * @return userAccountIdentityBlob provides the IdentityBlob data for the specified account passed in the event it has not expired.
     */

    function getUserIdentityData(
        address account
    ) public view returns (IRoleVerification.IdentityBlob memory) {
        return (
            IUserInformationPreventsOnExpiry(proofOfIdentityContract).getUserAccountIdentityBlob(
                account
            )
        );
    }

    /**
     * @notice `getUserLevelPreventOnExpiry` function returns the verification level from the users account.
     * @dev The call reverts in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp.
     * @param account The address of the target user account.
     * @return userAccountLevel provides the verification level for the specified account passed in the event it has not expired.
     */

    function getUserLevelPreventOnExpiry(
        address account
    ) public view returns (uint8 userAccountLevel) {
        return (
            IUserInformationPreventsOnExpiry(proofOfIdentityContract)
                .getUserAccountLevelPreventOnExpiry(account)
        );
    }

    /**
     * @notice `getUserTypePreventOnExpiry` function returns the account type from the users account.
     * @dev The call reverts in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp.
     * @param account The address of the target user account.
     * @return userAccountType provides the account type for the specified account passed in the event it has not expired.
     */

    function getUserTypePreventOnExpiry(
        address account
    ) public view returns (uint8 userAccountType) {
        return (
            IUserInformationPreventsOnExpiry(proofOfIdentityContract)
                .getUserAccountTypePreventOnExpiry(account)
        );
    }
}