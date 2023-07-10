// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract FeeOracle  {
    uint priceAverage = 1;

    uint justKeepAdding;

    // This is the block timestamp that the fee will need to be reset.
    uint256 public requiredReset;


    function setRequiredReset(uint newReset) external {
        requiredReset = newReset;
    }

    //to check for changes caused by reset fee

    function setPriceAverage(uint newPriceAverage) external {
        priceAverage = newPriceAverage;
    }

    function consult() external view returns (uint amountOut) {
        return priceAverage;
    }

    function refreshOracle() external returns (bool success) {
        justKeepAdding = justKeepAdding + 8;
        return true;
    }

    function viewJustKeepAdding() external view returns (uint) {
        return justKeepAdding;
    }
}
