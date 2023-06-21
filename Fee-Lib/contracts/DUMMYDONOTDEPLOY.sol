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

contract FeeOracle is FeeQuery {

    uint priceAverage = 1;

   uint justKeepAdding;

   function setRequiredReset(uint newReset) external {
       requiredReset = newReset;
   }

   //to check for changes caused by reset fee
   
   function setPriceAverage(uint newPriceAverage) external{
    priceAverage = newPriceAverage;
   }

    function consult() external view returns(uint amountOut) {
        return priceAverage;
    }
    
    function refreshOracle() external returns(bool success) {
        justKeepAdding = justKeepAdding + 8;
        return true;
    }

    function viewJustKeepAdding() external view returns(uint){
        return justKeepAdding;
    }
}