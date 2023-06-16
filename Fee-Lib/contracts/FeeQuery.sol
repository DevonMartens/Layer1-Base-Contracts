// SPDX-License-Identifier: ISC

pragma solidity ^0.8.2;

/// @title FeeQuery
/// @notice This contract consists of imports to ensure that the functions and variables can be read accross contracts to get correct fees.
/// @dev The primary function of this contract is to ensure that the fee amount can be read in each contract.

interface IFeeContract {
   function queryOracle() external view returns (uint);
}

contract FeeQuery {
  
   // This is used to measure the time frame in which we wait to consult the oracle.
   uint256 public dayMark;
   // This is the block timestamp that the fee will need to be reset.
   uint256 public requiredReset;
   // Storage for the application fee.
   uint256 public  fee;

   /**
   @notice This is the function the modifier consults to view the fee from the fee contract.
   @dev The required reset means the fee updates every 24 hours.
    */
   function getFee() public view returns(uint256){
      if(requiredReset < block.timestamp){
       revert("_resetFee()");
      }
      else {
          return fee;
      }
   }  
}
