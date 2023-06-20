// SPDX-License-Identifier: MIT


pragma solidity ^0.8.2;


import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./FeeQuery.sol";
import "./Errors.sol";

/** 
@title FeeContract
@notice This contract outlines how fees are distributed by validators on Haven1.
@dev The primary function of this contract is to ensure proper distribution from Haven1 applications.
*/

interface IFeeOracle {
   function consult() external returns (uint amountOut);

   function refreshOracle() external returns (bool success);
}

contract FeeOracle is IFeeOracle {

    function consult() external override returns(uint amountOut) {
        return 8;
    }
    
    function refreshOracle() external override returns(bool success) {
        return true;
    }
}