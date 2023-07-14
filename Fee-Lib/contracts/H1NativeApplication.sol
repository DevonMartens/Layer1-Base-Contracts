// SPDX-License-Identifier: ISC

import "./Errors.sol";

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
    function updateFee() external;

}

contract H1NativeApplication {

    // Storage for fee contract address.
    address public FeeContract;

    // new variables
    uint256 public _fee;
    
    uint256 public _requiredFeeResetTime;
    
    uint256 resetBlock;

    uint256 priorFee;

    /**
     * @notice Constructor to initialize contract deployment.
     * @param _FeeContract address of fee contract to pay fees.
     */
    constructor(address _FeeContract) {
        if (_FeeContract == address(0)) {
            revert(Errors.INVALID_ADDRESS);
        }
        _requiredFeeResetTime = IFeeContract(_FeeContract).nextResetTime();
        _fee = IFeeContract(_FeeContract).getFee();
        FeeContract = _FeeContract;
        priorFee = IFeeContract(_FeeContract).getFee();
    }

    // Modifier to send fees to the fee contract and to the developer in contracts for non-payable functions.
    modifier applicationFee() {
        if (_requiredFeeResetTime <= block.timestamp) {
             _updateFeeAndCompleteFunction();
        }
         else if(resetBlock ==  block.number && resetBlock > 0) {
            _completeFunctionWithPriorFee();
        }
        else {
           _completeFunction();
        }
        _;
    }

    // Modifier to send fees to the fee contract and to the developer in contracts for payable functions.
    modifier applicationFeeWithPayment(uint256 H1PaymentToFunction) {
       if (_requiredFeeResetTime >= block.timestamp) {
           _updateFeeAndCompleteFunction();
            _completePaidFunctionWithPriorFee(H1PaymentToFunction);
       }
        else if(resetBlock ==  block.number && resetBlock > 0) {
             _completePaidFunctionWithPriorFee(H1PaymentToFunction);
        }
        else {
             _completePaidFunction(H1PaymentToFunction);
        }
        _;
    }

    /**
    * @notice `_updateFeeAndCompleteFunction` this function updates the state variables and disperses the priorFee 
    * the fee before the oracle updates the _fee variable in the contract. 
    * If there is an excess amount, it is returned to the sender.
    * @dev It throws Errors.INSUFFICIENT_FUNDS if the received value is less than the prior 
    * fee and priorFee is greater than 0.
    */
     function _updateFeeAndCompleteFunction() internal {
            uint256 updatedResetTime = IFeeContract(FeeContract).nextResetTime();
             if (updatedResetTime == _requiredFeeResetTime) {
                IFeeContract(FeeContract).updateFee();
             }
             priorFee = _fee;
             _fee = IFeeContract(FeeContract).getFee();
             _requiredFeeResetTime = IFeeContract(FeeContract).nextResetTime();
             resetBlock = block.number;
    }

    /**
    * @notice `_completeFunctionWithPriorFee` this function uses priorFee the fee before the oracle 
    * updates the _fee variable in the contract. 
    * the prior fee to the FeeContract.
    * @dev If there is an excess amount, it is returned to the sender.
    * @dev It throws Errors.INSUFFICIENT_FUNDS if the received value is less than the prior 
    * fee and priorFee is greater than 0.
    */
    function _completeFunctionWithPriorFee() internal {
            if (msg.value <  priorFee && priorFee > 0) {
                revert(Errors.INSUFFICIENT_FUNDS);
            }

            (bool success, ) = FeeContract.call{value: priorFee}("");
            require(success, Errors.TRANSFER_FAILED);

            if (msg.value - priorFee > 0) {
            uint256 overflow = (msg.value - priorFee);
            (bool returnOverflow, ) = payable(tx.origin).call{value: overflow}(
                ""
                );
            }
    }

    /**
    * @notice `_completeFunction` this function uses the _fee variable in the contract to determine 
    * the payment amounts.
    * @dev If there is an excess amount, it is returned to the sender.
    * @dev It throws Errors.INSUFFICIENT_FUNDS if the received value is less than the prior 
    * fee and priorFee is greater than 0.
    */

    function _completeFunction() internal {
         
        if (msg.value < _fee && _fee > 0) {
            revert(Errors.INSUFFICIENT_FUNDS);
        }

        (bool success, ) = FeeContract.call{value: _fee}("");
        require(success, Errors.TRANSFER_FAILED);

        if (msg.value - _fee > 0) {
            uint256 overflow = (msg.value - _fee);
            (bool returnOverflow, ) = payable(tx.origin).call{value: overflow}(
                ""
            );
        }

    }

     /**
    * @notice `_completeFunctionWithPriorFee` this function uses priorFee the fee before the oracle 
    * updates the _fee variable in the contract. 
    * the prior fee to the FeeContract.
    * @dev If there is an excess amount, it is returned to the sender.
    * @dev It throws Errors.INSUFFICIENT_FUNDS if the received value is less than the prior 
    * fee and priorFee is greater than 0.
    */

    function _completePaidFunctionWithPriorFee(uint256 H1PaymentToFunction) internal {
          if (msg.value <  priorFee && priorFee > 0) {
                revert(Errors.INSUFFICIENT_FUNDS);
            }
            (bool success, ) = FeeContract.call{value: priorFee}("");
            require(success, Errors.TRANSFER_FAILED);

            if (msg.value - priorFee > 0) {
            uint256 overflow = (msg.value - priorFee - H1PaymentToFunction);
            (bool returnOverflow, ) = payable(tx.origin).call{value: overflow}("");
            }
    }

    /**
    * @notice `_completeFunction` this function uses the _fee variable in the contract to determine 
    * the payment amounts.
    * @dev If there is an excess amount, it is returned to the sender.
    * @dev It throws Errors.INSUFFICIENT_FUNDS if the received value is less than the prior 
    * fee and priorFee is greater than 0.
    */

    function _completePaidFunction(uint256 H1PaymentToFunction) internal {
        if (msg.value < _fee && _fee > 0) {
            revert(Errors.INSUFFICIENT_FUNDS);
        }
       if (msg.value - _fee - H1PaymentToFunction > 0) {
            uint256 overflow = (msg.value - _fee - H1PaymentToFunction);
            (bool returnOverflow, ) = payable(tx.origin).call{value: overflow}("");
       }
        (bool success, ) = FeeContract.call{ value: _fee }("");
        require(success, Errors.TRANSFER_FAILED); 
    }

    /**
    @notice `callFee` this view function is to get the fee amount from the feeContract.
    @dev It returns a uint256 that is used in the applicationFee modifier.
    */

    function callFee() public view returns (uint256) {
        return IFeeContract(FeeContract).getFee();
    }
}