// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract MyToken is Initializable, ERC20Upgradeable, UUPSUpgradeable  {
    function initialize() initializer public {
        __ERC20_init("MyToken", "MTK");
    }


    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
    {}
}
