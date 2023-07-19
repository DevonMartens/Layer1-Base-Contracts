//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;



/**
* @title VerifiableIdentity
* @author Haven1 Development Team
* @notice This contract allows developers to access and utilise Haven1s Proof Of Identity Framework data.
* @dev Haven1s Proof Of Identity Framework data becomes available via the imported functions below.
The official Haven1 ProofOfIdentity.sol deployment address must be passed via the constructor.
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
     * @notice `getUserAccountCountryCode` function returns the country code from the users account.
     * @param account address of the target user account.
     * @return userAccountCountryCode provides the country code for the specified account passed.
     */

    function getUserAccountCountryCode(
        address account
    ) external view returns (string memory userAccountCountryCode);

    /**
     * @notice `getUserAccountLevel` function returns the verification level from the users account.
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

contract VerifiableIdentity {
    constructor(address _proofOfIdentityContract) {
      proofOfIdentityContract = _proofOfIdentityContract;
    }
    
    address private proofOfIdentityContract;

    /**
    @notice getUserCountryCode function returns the country code from the users account
    @param account address of the target user account
    */

    function getUserCountryCode(
        address account
    ) public view returns (string memory userAccountCountryCode) {
        return (IRoleVerification(proofOfIdentityContract).getUserAccountCountryCode(account));
    }

    /**
    @notice getUserExpiry function returns only the expiry date from the users account
    @param account address of the target user account
    */

    function getUserExpiry(address account) public view returns (uint256) {
        return (IRoleVerification(proofOfIdentityContract).getUserAccountExpiry(account));
    }

    /**
    @notice getUserLevel function returns the verification level from the users account
    @param account address of the target user account
    */

    function getUserLevel(
        address account
    ) public view returns (uint8 userAccountLevel) {
        return (IRoleVerification(proofOfIdentityContract).getUserAccountLevel(account));
    }

    /**
    @notice getUserType function returns the account type from the users account
    @param account address of the target user account
    */

    function getUserType(
        address account
    ) public view returns (uint8 userAccountType) {
        return (IRoleVerification(proofOfIdentityContract).getUserAccountType(account));
    }
}