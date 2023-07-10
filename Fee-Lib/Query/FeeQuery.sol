// SPDX-License-Identifier: ISC

pragma solidity ^0.8.0;

import "./Errors.sol";

/**
 * @title FeeQuery
 * @notice This contract consists of imports
 * to ensure that the functions and variables can be read across contracts to get correct fees.
 * @dev The primary function of this contract is to ensure that the fee amount can be read in each contract.
 */

interface IFeeOracle {
    function consult() external view returns (uint256 amountOut);

    function refreshOracle() external returns (bool success);
}


contract FeeQuery {

    /**
     * @dev The event is triggered during the `resetFee` function.
     * It emits the time of the new reset and current call.
     */
    event FeeReset(uint256 indexed currentTimestamp, uint256 indexed newReset);

    // Address used to consult to find fee amounts.
    address public oracle;

    // This is used to measure the time frame in which we wait to consult the oracle.
    uint256 public epochLength;

    // This is the block timestamp that the fee will need to be reset.
    uint256 public requiredReset;

    // Storage for the application fee.
    uint256 public fee;

    // Storage for minimum fee.
    uint256 public minFee;

    /**
    @notice `resetFee` is the call to get the correct value for the fee across all native applications.
    @dev This call queries the oracle to set a fee.
    @dev After that is complete it then sets the time that the oracle needs to be rechecked.
    */

    function resetFee() public returns(uint256){
        if (block.timestamp > requiredReset || fee == 0) {
            fee = queryOracle();
            requiredReset = block.timestamp + epochLength;
           emit FeeReset(block.timestamp, requiredReset);
            return fee;
         } else {
             revert(Errors.HOLD_TIME_IS_24_HOURS);
        }
    }


    /**
    @notice `getMinFee` function to retrieve the minimum dev fee allowed for developers.
    */
    function getMinFee() external view returns (uint256) {
        return minFee;
    }

    /**
    @notice `getFee` function consults the fee contract to get the fee.
    @dev The required reset means the fee must be updated every 24 hours.
    */
    function getFee() public returns (uint256) {
        if (requiredReset < block.timestamp) {
           uint256 newFee = resetFee();
            return newFee;
        } else {
            return fee;
        }
    }

      /**
    @notice `queryOracle` this function is to consult oracle to get a fee amount.
    */

    function queryOracle() public view returns (uint feeAmount) {
        return (IFeeOracle(oracle).consult());
    }

}
