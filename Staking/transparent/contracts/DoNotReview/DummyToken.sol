// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract MyToken is Initializable, ERC20Upgradeable  {
    function initialize() initializer public {
        __ERC20_init("MyToken", "MTK");
    }


    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}