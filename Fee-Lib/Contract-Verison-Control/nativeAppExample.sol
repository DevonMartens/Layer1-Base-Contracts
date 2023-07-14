// SPDX-License-Identifier: ISC

// import "./FeeQuery.sol";
import './Errors.sol';

pragma solidity ^0.8.0;

/*
@title H1NativeApplication
@notice This contract has a modifier that ensures fees are sent to the FeeContract.
@dev The primary function of this contract is to be used as an import for native building on Haven.
*/

interface IFeeContract {
    function getFee() external view returns (uint256);

    
    //This function will need to be added to the fee contract, it returns lastDistribution + epoch time
    function nextResetTime() external view returns (uint256);
    

    //this function will need to update 'nextResetTime' on the fee contract

    function updateFee() external view returns (uint256);
    
}

contract H1NativeApplication {
    // Storage for fee contract address.
    address public FeeContract;

    // new variables
    uint256 private _fee;
    //setting public to call
    uint256 public _requiredFeeResetTime;

    // Modifier to send fees to the fee contract and to the developer in contracts for non-payable functions.
    modifier applicationFee() {
        if (msg.value < callFee() && callFee() > 0) {
            revert(Errors.INSUFFICIENT_FUNDS);
        }
        if (_requiredFeeResetTime < block.timestamp) {

            uint256 updatedResetTime = IFeeContract(fFeContract).nextResetTime();
            if (updatedResetTime == _requiredFeeResetTime) {
                IFeeContract(FeeContract).updateFee();
                updatedResetTime = IFeeContract(FeeContract).nextResetTime();
            }
            _requiredFeeResetTime = updatedResetTime;
        }
        (bool success, ) = FeeContract.call{value: callFee()}('');
        require(success, Errors.TRANSFER_FAILED);
        if (msg.value - callFee() > 0) {
            uint256 overflow = (msg.value - callFee());
            (bool returnOverflow, ) = payable(tx.origin).call{value: overflow}('');
        }
        _;
    }

    // Modifier to send fees to the fee contract and to the developer in contracts for payable functions.
    modifier applicationFeeWithPayment(uint256 H1PaymentToFunction) {
        if (msg.value < callFee() && callFee() > 0) {
            revert(Errors.INSUFFICIENT_FUNDS);
        }
        (bool success, ) = FeeContract.call{value: callFee()}('');
        require(success, Errors.TRANSFER_FAILED);
        if (msg.value - callFee() - H1PaymentToFunction > 0) {
            uint256 overflow = (msg.value - callFee() - H1PaymentToFunction);
            (bool returnOverflow, ) = payable(tx.origin).call{value: overflow}('');
        }
        _;
    }

    /**
     * @notice Constructor to initialize contract deployment.
     * @param _FeeContract address of fee contract to pay fees.
     */
    constructor(address _FeeContract) {
        if (_FeeContract == address(0)) {
            revert(Errors.INVALID_ADDRESS);
        }
        FeeContract = _FeeContract;
        _requiredFeeReset = IFeeContract(_FeeContract).nextResetTime();
        _fee = IFeeContract(_FeeContract).getFee();
    }

    /**
    @notice `callFee` this view function is to get the fee amount from the feeContract.
    @dev It returns a uint256 that is used in the applicationFee modifier.
    */

    function callFee() public view returns (uint256) {
        return _fee;
    }
}
