// SPDX-License-Identifier: ISC

// import "./FeeQuery.sol";
import "./Errors.sol";

pragma solidity ^0.8.0;

/*
@title H1NativeApplication
@notice This contract has a modifier that ensures fees are sent to the FeeContract.
@dev The primary function of this contract is to be used as an import for native building on Haven.
*/

interface IFeeContract {
    function getFee() external view returns (uint256);

}

contract H1NativeApplication {

    // Storage for fee contract address.
    address public FeeContract;
    

    // Modifier to send fees to the fee contract and to the developer in contracts.
    modifier applicationFee() {
        if (msg.value < callFee() && callFee() > 0) {
            revert(Errors.INSUFFICIENT_FUNDS);
        }
        (bool success, ) = FeeContract.call{value: callFee()}("");
        require(success, Errors.TRANSFER_FAILED);
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
    }

    /**
    @notice `callFee` this view function is to get the fee amount from the feeContract.
    @dev It returns a uint256 that is used in the applicationFee modifier.
    */

    function callFee() public view returns (uint256) {
        return IFeeContract(FeeContract).getFee();
    }
}
