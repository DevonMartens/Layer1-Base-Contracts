// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./HRC20.sol";

contract BaseHRC20 is HRC20 {

    constructor(
        string memory _name, 
        string memory _symbol, 
        address networkAdmin, 
        address networkOperator
        ) 
        ERC20(_name, _symbol) ERC20Permit("MyToken") {
        _grantRole(DEFAULT_ADMIN_ROLE, networkAdmin);
        _grantRole(OPERATOR_ROLE, networkOperator);
    }

    function mintToken(address to, uint256 amount) external onlyRole(OPERATOR_ROLE) {
        _mint(to, amount);
    }

      function burnToken(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}