// SPDX-License-Identifier: ISC

import "./Errors.sol";

pragma solidity ^0.8.0;

/**
 * @title H1DevelopedApplication
 * @notice This contract has a modifier that ensures fees
 * are sent to the developer of an application and the FeeContract.
 * @dev The primary function of this contract is to be used as an import for developers building on Haven.
 */

interface IFeeContract {

    // This function retrieves the minimum value for a devFee allowed by this contract.
    function getMinimumAllottedFee() external view returns (uint256);

    // This function retrieves the value of H1 in USD.
    function getFee() external view returns (uint256);

    //This function will need to be added to the fee contract, it returns lastDistribution + epoch time
    function nextResetTime() external view returns (uint256);
    
    //this function will need to update 'nextResetTime' on the fee contract
    function updateFee() external;

}

contract H1DevelopedApplication {
    
    // Storage for fee contract address.
    address private FeeContract;

    // Address storage for developer wallet.
    address private developerWallet;

    // Storage variable for the fee set by the developer.
    uint256 private devFee;

    // Storage Variable for baseFee 
    uint256 private baseFee;

    // Storage variable for when the contract state must be updated.
    uint256 private _requiredFeeResetTime;

    // The block number in which the fee updated.
    uint256 private resetBlock;

    // The fee before the oralce updated.
    uint256 private priorFee;

    /**
     * @notice Constructor to initialize contract deployment.
     * @param _FeeContract address of fee contract to pay fees.
     * @param walletToCollectFees the address to receive 10% of the fees.
     */

    constructor(
        address _FeeContract,
        address walletToCollectFees,
        uint256 applicationFee
    ) {
        if (_FeeContract == address(0)) {
            revert(Errors.INVALID_ADDRESS);
        }
        uint256 minimumAllottedFee = IFeeContract(_FeeContract).getMinimumAllottedFee(); 
        if(minimumAllottedFee > applicationFee){
            revert(Errors.INVALID_FEE);
        }
        _requiredFeeResetTime = IFeeContract(_FeeContract).nextResetTime();
        FeeContract = _FeeContract;
        developerWallet = payable(walletToCollectFees);
        devFee = applicationFee * IFeeContract(_FeeContract).getFee();
        baseFee = applicationFee;
        priorFee = applicationFee;
      
    }

    // Modifier to send fees to the fee contract and to the developer in contracts for non-payable functions.
    modifier devApplicationFee() {

        if (_requiredFeeResetTime <= block.timestamp && resetBlock != block.number) {
            _updatesOracleValues();
           _completeFunctionWithPriorFee();
        }
        else if(resetBlock ==  block.number) {
            _completeFunctionWithPriorFee();
        }
        else {
            _completeFunction();
        }
        _;
    }

    // Modifier to send fees to the fee contract and to the developer in contracts for payable functions.
    modifier devApplicationFeeWithPaymentToContract(uint256 H1PaymentToFunction) {
         if (_requiredFeeResetTime <= block.timestamp && resetBlock != block.number) {
              _updatesOracleValues();
              _completePaidFunctionWithPriorFee(H1PaymentToFunction);
        
        }
        else if(resetBlock ==  block.number) {
          _completePaidFunctionWithPriorFee(H1PaymentToFunction);
        }
        else {
            _completePaidFunction(H1PaymentToFunction);
              }
        _;
    }

    /**
    @notice `setDevApplicationFee` sets the fee amount charged to utilize the application.
    @dev It is split 10% feeContract and 90% to the development team.
    */
    function setDevApplicationFee(uint256 newDevFee) external {
        require(msg.sender == developerWallet, Errors.INVALID_ADDRESS);
        uint256 feeInUSD = IFeeContract(FeeContract).getFee();
        if(newDevFee < callMinimumViableFee()){
            revert(Errors.INVALID_FEE);
        }
        baseFee = newDevFee;
        devFee = feeInUSD * newDevFee;
    }


    /**
    @notice `getDevFee` returns the devFee for the application.
    */
    function getDevFee() public view returns (uint256 developerFeeFromApplication) {
        return devFee;
    }

    /**
    @notice `getRequiredFeeResetTime` returns the devFee for the application.
    */
    function getRequiredFeeResetTime() public view returns (uint256 developerFeeFromApplication) {
        return devFee;
    }


    /**
    @notice `callFee` gets the value for H1 in USD from the Fee contract.
    */
    function callFee() public view returns (uint256 feeFromFeeContract) {
        return IFeeContract(FeeContract).getFee();
    }

    /**
    * @notice `_updatesOracleValues` this function retrieves the updated reset time from the FeeContract and checks
    * if it matches the required fee reset time.
    * @dev If the reset times match, the function calls the `FeeContract` to update the fee.
    * @dev The priorFee is set to the current devFee value.
    * @dev The feeInUSD is fetched from the FeeContract, and the devFee is recalculated as feeInUSD multiplied by the baseFee.
    * @dev The _requiredFeeResetTime is updated to the retrieved updated reset time.
    * @dev The resetBlock is set to the current block number.
    */

    function _updatesOracleValues() internal{
        uint256 updatedResetTime = IFeeContract(FeeContract).nextResetTime();
             
             if (updatedResetTime == _requiredFeeResetTime) {
                IFeeContract(FeeContract).updateFee();
             }
             
            priorFee = devFee;
             uint256 feeInUSD = IFeeContract(FeeContract).getFee();
             devFee = feeInUSD * baseFee;
             _requiredFeeResetTime = updatedResetTime;
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
         if (msg.value - priorFee > 0) {
            uint256 overflow = (msg.value - priorFee);
            payable(tx.origin).call{value: overflow}("");
        }
        (bool success, ) = FeeContract.call{value: priorFee / 10}("");
        require(success, Errors.TRANSFER_FAILED);
        bool sent = payable(developerWallet).send(priorFee / 10 * 9);
        require(sent, Errors.TRANSFER_FAILED);

    }

    /**
    * @notice `_completeFunction` this function uses the _fee variable in the contract to determine 
    * the payment amounts.
    * @dev If there is an excess amount, it is returned to the sender.
    * @dev It throws Errors.INSUFFICIENT_FUNDS if the received value is less than the prior 
    * fee and priorFee is greater than 0.
    */

    function _completeFunction() internal {

        if (msg.value < devFee && devFee > 0) {
            revert(Errors.INSUFFICIENT_FUNDS);
        }

        (bool success, ) = FeeContract.call{value: devFee / 10}("");
        require(success, Errors.TRANSFER_FAILED);
        bool sent = payable(developerWallet).send(devFee / 10 * 9);
        require(sent, Errors.TRANSFER_FAILED);

        if (msg.value - devFee > 0) {
            uint256 overflow = (msg.value - devFee);
            payable(tx.origin).call{value: overflow}(
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
            if (msg.value - priorFee > 0) {
            uint256 overflow = (msg.value - H1PaymentToFunction - priorFee);
            payable(tx.origin).call{value: overflow}(
                ""
                );
            }
            (bool success, ) = FeeContract.call{value: priorFee / 10}("");
            require(success, Errors.TRANSFER_FAILED);
            bool sent = payable(developerWallet).send(priorFee / 10 * 9);
            require(sent, Errors.TRANSFER_FAILED);
    }

       /**
    * @notice `_completeFunction` this function uses the _fee variable in the contract to determine 
    * the payment amounts.
    * @dev If there is an excess amount, it is returned to the sender.
    * @dev It throws Errors.INSUFFICIENT_FUNDS if the received value is less than the prior 
    * fee and priorFee is greater than 0.
    */

    function _completePaidFunction(uint256 H1PaymentToFunction) internal {
          if (msg.value < devFee && devFee > 0) {
                revert(Errors.INSUFFICIENT_FUNDS);
                }
                (bool success, ) = FeeContract.call{value: devFee / 10}("");
                require(success, Errors.TRANSFER_FAILED);
                bool sent = payable(developerWallet).send(devFee / 10 * 9);
                require(sent, Errors.TRANSFER_FAILED);
                if (msg.value - devFee - H1PaymentToFunction > 0) {
                    uint256 overflow = (msg.value - devFee - H1PaymentToFunction);
                    payable(tx.origin).call{value: overflow}("");
                    }
    }
    /**
    @notice `callMinimumViableFee` gets the minimum fee from the Fee contract.
    */
    function callMinimumViableFee() public view returns (uint256) {
        uint256 minFeeFromFeeContract = IFeeContract(FeeContract).getMinimumAllottedFee();
        return minFeeFromFeeContract;
    }
}