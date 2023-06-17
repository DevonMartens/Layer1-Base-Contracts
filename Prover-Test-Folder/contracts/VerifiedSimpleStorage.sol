// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./VerifiableIdentity.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VerifiedSimpleStorage is VerifiableIdentity, Ownable {
    mapping(string => bool) approvedCountries;
    uint public storedData;

    constructor(address proofContract) VerifiableIdentity(proofContract) {}

    function approveCountryCode(
        string memory countryCode
    ) public /*onlyOwner*/ {
        approvedCountries[countryCode] = true;
    }

    function set(uint x) public {
        IdentityBlob memory id = getUserIdentityData(msg.sender);
        bool approved = approvedCountries[id.countryCode];
        require(approved, "Err: countrycode not approved for this application");
        storedData = x;
    }

    function get() public view returns (uint retVal) {
        return storedData;
    }
}
