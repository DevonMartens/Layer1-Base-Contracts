// SPDX-License-Identifier: ISC

pragma solidity ^0.8.0;

/**
 * @title FeeQuery
 * @notice This contract consists of imports
 * to ensure that the functions and variables can be read across contracts to get correct fees.
 * @dev The primary function of this contract is to ensure that the fee amount can be read in each contract.
 */

interface IFeeContract {
    function queryOracle() external view returns (uint);
}

contract FeeQuery {
    // This is used to measure the time frame in which we wait to consult the oracle.
    uint256 public epochLength;

    // This is the block timestamp that the fee will need to be reset.
    uint256 public requiredReset;

    // Storage for the application fee.
    uint256 public fee;

    // Storage for minimum fee.
    uint256 public minFee;

    /**
    @notice `getMinFee` function to retrieve the minimum dev fee allowed for developers.
    */
    function getMinFee() public view returns (uint256) {
        return minFee;
    }

    /**
    @notice `getFee` function consults the fee contract to get the fee.
    @dev The required reset means the fee must be updated every 24 hours.
    */
    function getFee() public view returns (uint256) {
        if (requiredReset < block.timestamp) {
            revert("resetFee()");
        } else {
            return fee;
        }
    }
}
