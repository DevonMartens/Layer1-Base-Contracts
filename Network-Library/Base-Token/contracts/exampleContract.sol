// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./HRC20.sol";

contract BaseHRC20 is HRC20 {

    constructor(
        string memory _name, 
        string memory _symbol, 
        uint8 decimals,
        address haven1Foundation, 
        address networkOperator
        ) 
        HRC20(_name, _symbol,  decimals, haven1Foundation, networkOperator) {

    }

    function mintToken(address to, uint256 amount) external onlyRole(OPERATOR_ROLE) {
        _mint(to, amount);
    }

      function burnToken(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}