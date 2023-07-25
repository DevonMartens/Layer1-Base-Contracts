// SPDX-License-Identifier: ISC

import "./Errors.sol";

pragma solidity ^0.8.0;

/*
* @title H1NativeApplication
* @author Haven1 Development Team
* @notice This contract's purpose is to provide modifiers to functions that ensure fees are sent to the FeeContract.
* @dev The primary function of this contract is to be used as an import for application building on Haven1.
*/

interface IFeeContract {

    // This function retrieves the value of H1 in USD.
    function queryOracle() external view returns (uint256);

    //This function returns a timestamp that will tell the contract when to update the oracle.
    function nextResetTime() external view returns (uint256);
    

    // This function updates the fees in the fee contract to match the oracle values.
    function updateFee() external;

}

contract H1NativeApplication {

    // Storage for fee contract address.
    address private FeeContract;

    // Storage for the fee required to run transactions
    uint256 private _fee;
    
    // The timestamp in which the _fee must update.
    uint256 private _requiredFeeResetTime;
    
    // The block number in which the fee was last updated.
    uint256 private resetBlock;

    // The fee before the oracle updated.
    uint256 private priorFee;

    /**
     * @notice Constructor to initialize contract deployment.
     * @param _FeeContract address of FeeContract to pay fees to and to obtain network information from.
     */
    constructor(address _FeeContract) {
        if (_FeeContract == address(0)) {
            revert(Errors.INVALID_ADDRESS);
        }
        _requiredFeeResetTime = IFeeContract(_FeeContract).nextResetTime();
        _fee = IFeeContract(_FeeContract).queryOracle();
        FeeContract = _FeeContract;
        priorFee = IFeeContract(_FeeContract).queryOracle();
        resetBlock = block.number - 1;
    }

    // Modifier to send fees to the fee contract and to the developer in contracts for non-payable functions.
    modifier applicationFee() {
        if(_requiredFeeResetTime <= block.timestamp) {
            _updatesOracleValues();
             _payApplicationWithPriorFee();
        }
         else if(resetBlock == block.number) {
            _payApplicationWithPriorFee();
        }
        else {
           _payApplicationWithFee();
        }
        _;
    }

    // Modifier to send fees to the fee contract and to the developer in contracts for payable functions.
    modifier applicationFeeWithPaymentToContract(uint256 H1PaymentToFunction) {
       if (_requiredFeeResetTime <= block.timestamp) {
             _updatesOracleValues();
             _payApplicationWithPriorFeeAndContract(H1PaymentToFunction);
        }
        else if (resetBlock == block.number) {
          _payApplicationWithPriorFeeAndContract(H1PaymentToFunction);    
       }
        else {
             _payApplicationWithFeeAndContract(H1PaymentToFunction);
        }
        _;
    }

    /**
    * @notice `_updatesOracleValues` this function updates the state variables of this contract
    * and in the FeeContract if applicable. The information about the fee and _requiredFeeResetTime 
    * come from the FeeContract.
    * @dev The priorFee is the fee before the oracle updates the _fee variable in this contract. 
    * @dev The  _requiredFeeResetTime is set equal to the FeeContracts next reset time. A day
    * is added between intervals.
    * @dev The reset block is set in this function to ensure that the transactions set in the same block are 
    * equal to the priorFee to ensure transactions pass in the event the fee is larger after updating.
    */
     function _updatesOracleValues() internal {
            uint256 updatedResetTime = IFeeContract(FeeContract).nextResetTime();
             if (updatedResetTime == _requiredFeeResetTime) {
                IFeeContract(FeeContract).updateFee();
             }
             priorFee = _fee;
             _fee = IFeeContract(FeeContract).queryOracle();
             _requiredFeeResetTime = IFeeContract(FeeContract).nextResetTime();
             resetBlock = block.number;
    }

    /**
    * @notice `_payApplicationWithPriorFee` this function uses priorFee which is 
    * the fee before the oracle updates the _fee variable in the contract.
    * @dev If there is an excess amount of H1, it is returned to the sender.
    * @dev It throws Errors.INSUFFICIENT_FUNDS if the 
    * received value is less than the prior fee.
    */
    function _payApplicationWithPriorFee() internal {
            if (msg.value <  priorFee) {
                revert(Errors.INSUFFICIENT_FUNDS);
            }

            (bool success, ) = FeeContract.call{value: priorFee}("");
            require(success, Errors.TRANSFER_FAILED);

            if (msg.value - priorFee > 0) {
            uint256 overflow = (msg.value - priorFee);
            payable(tx.origin).call{value: overflow}(
                ""
                );
            }
    }

    /**
    * @notice `_payApplicationWithFee` this function uses the _fee variable in the contract to determine 
    * the payment amounts. The _fee is the current fee value from the oracle updated less than 24 hours ago.
    * @dev If there is an excess amount of H1 sent, it is returned to the sender.
    * @dev It throws Errors.INSUFFICIENT_FUNDS if the received value is less than the prior 
    * fee and priorFee is greater than 0.
    */

    function _payApplicationWithFee() internal {
         
        if (msg.value < _fee) {
            revert(Errors.INSUFFICIENT_FUNDS);
        }

        (bool success, ) = FeeContract.call{value: _fee}("");
        require(success, Errors.TRANSFER_FAILED);

        if (msg.value - _fee > 0) {
            uint256 overflow = (msg.value - _fee);
            payable(tx.origin).call{value: overflow}(
                ""
            );
        }

    }


     /**
    * @notice `_payApplicationWithPriorFeeAndContract` this function uses priorFee the fee before the oracle 
    * updates the _fee variable in the contract. 
    * @dev If there is an excess amount of H1 sent, it is returned to the sender.
    * @dev It throws Errors.INSUFFICIENT_FUNDS if the received value is less than the priorFee.
    */

    function _payApplicationWithPriorFeeAndContract(uint256 H1PaymentToFunction) internal {
    if (msg.value < priorFee + H1PaymentToFunction) {
        revert(Errors.INSUFFICIENT_FUNDS);
    }

    (bool success, ) = FeeContract.call{value: priorFee}("");
    require(success, Errors.TRANSFER_FAILED);

    if (msg.value > priorFee + H1PaymentToFunction) {
        uint256 overflow = msg.value - priorFee - H1PaymentToFunction;
        payable(tx.origin).call{value: overflow}("");
    }
}

    /**
    * @notice `_payApplicationWithFeeAndContract` this function uses the _fee variable in the contract to determine 
    * the payment amounts.
    * @dev If there is an excess amount of H1 sent, it is returned to the sender.
    * @dev It throws Errors.INSUFFICIENT_FUNDS if the received value is less than the prior 
    * fee and priorFee is greater than 0.
    */

    function _payApplicationWithFeeAndContract(uint256 H1PaymentToFunction) internal {
        if (msg.value < _fee) {
            revert(Errors.INSUFFICIENT_FUNDS);
        }
        
        (bool success, ) = FeeContract.call{ value: _fee }("");
        require(success, Errors.TRANSFER_FAILED); 
        
       if (msg.value > priorFee + H1PaymentToFunction) {
            uint256 overflow = (msg.value - _fee - H1PaymentToFunction);
            payable(tx.origin).call{value: overflow}("");
       }
    }

    /**
    @notice `callFee` this view function is to get the fee amount from the feeContract.
    @dev It returns a uint256 that is used in the applicationFee modifier.
    */

    function callFee() public view returns (uint256) {
        return IFeeContract(FeeContract).queryOracle();
    }
}