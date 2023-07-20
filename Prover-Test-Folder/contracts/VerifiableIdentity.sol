//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IUserInformation.sol";


/**
* @title VerifiableIdentity
* @author Haven1 Development Team
* @notice This contract allows developers to access and utilise Haven1s Proof Of Identity Framework data.
* @dev Haven1s Proof Of Identity Framework data becomes available via the imported functions below.
The official Haven1 ProofOfIdentity.sol deployment address must be passed via the constructor.
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
        return (IUserInformation(proofOfIdentityContract).getUserAccountCompetencyRating(account));
    }

    /**
    @notice getUserCountryCode function returns the country code from the users account
    @param account address of the target user account
    */

    function getUserCountryCode(
        address account
    ) public view returns (string memory userAccountCountryCode) {
        return (IUserInformation(proofOfIdentityContract).getUserAccountCountryCode(account));
    }

    /**
    @notice getUserExpiry function returns only the expiry date from the users account
    @param account address of the target user account
    */

    function getUserExpiry(address account) public view returns (uint256) {
        return (IUserInformation(proofOfIdentityContract).getUserAccountExpiry(account));
    }

    /**
    @notice getUserIdentityData function returns struct IdentityBlob from the users account
    @param account address of the target user account
    */

    function getUserIdentityData(
        address account
    ) public view returns (IRoleVerification.IdentityBlob memory) {
        return (IRoleVerification(proofOfIdentityContract).getUserAccountIdentityBlob(account));
    }

    /**
    @notice getUserLevel function returns the verification level from the users account
    @param account address of the target user account
    */

    function getUserLevel(
        address account
    ) public view returns (uint8 userAccountLevel) {
        return (IUserInformation(proofOfIdentityContract).getUserAccountLevel(account));
    }

    /**
    @notice getUserType function returns the account type from the users account
    @param account address of the target user account
    */

    function getUserType(
        address account
    ) public view returns (uint8 userAccountType) {
        return (IUserInformation(proofOfIdentityContract).getUserAccountType(account));
    }
}