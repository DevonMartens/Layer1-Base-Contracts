// SPDX-License-Identifier: ISC

import "./FeeQuery.sol";
import "./Errors.sol";

pragma solidity ^0.8.2;

/// @title H1NativeApplication
/// @notice This contract has a modifer that ensures fees are sent the FeeContract.
/// @dev The primary function of this contract is to be used as an import for native building on Haven.
contract H1NativeApplication is FeeQuery {
    // Storage for fee contract address.
    address public FeeContract;
    // Storage to access FeeQuery functions.
    FeeQuery public FeeQueryNative;

    // Modifier to send fees to the fee contract and to the developer in contracts.
    modifier applicationFee() {
        if (msg.value < callFee() && callFee() > 0) {
            revert(Errors.INSUFFICIENT_FUNDS);
        }
        (bool success, ) = FeeContract.call{value: callFee()}("");
        _;
    }

    /**
     * @notice Constructor to initialize contract deployment.
     * @param _FeeContract address of fee contract to pay fees.
     * @dev For the param walletToCollectFees the deployer
     * of this wallet should consider a setter for this address in their dApp.
     */
    constructor(address _FeeContract) {
        if (_FeeContract == address(0)) {
            revert(Errors.INVALID_ADDRESS);
        }
        FeeContract = _FeeContract;
        FeeQueryNative = FeeQuery(_FeeContract);
        epochLength = 86400;
    }

    /**
   @notice This is the view function to get the fee amount from the feeContract.
   @dev It returns a uint256 that is used in the applicationFee modifier.
   */

    function callFee() public view returns (uint256) {
        return FeeQuery(FeeContract).getFee();
    }
}
