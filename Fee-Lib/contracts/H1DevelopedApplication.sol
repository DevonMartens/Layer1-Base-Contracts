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
    
    function getMinimumAllottedFee() external view returns (uint256);

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
    address developerWallet;

    // Storage variable for the fee set by the developer.
    uint256 private devFee;

    // Storage Variable for baseFee 
    uint256 private baseFee;

    // Storage variable for when the contract state must be updated.
    uint256 public _requiredFeeResetTime;

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
        _requiredFeeResetTime = IFeeContract(_FeeContract).nextResetTime();
        FeeContract = _FeeContract;
        developerWallet = payable(walletToCollectFees);
        devFee = applicationFee * IFeeContract(_FeeContract).getFee();
        baseFee = applicationFee;
    }

    // Modifier to send fees to the fee contract and to the developer in contracts for non-payable functions.
    modifier devApplicationFee() {
        if (msg.value < calculateDevFee() && calculateDevFee() > 0) {
            revert(Errors.INSUFFICIENT_FUNDS);
        }
        if (_requiredFeeResetTime < block.timestamp) {

             uint256 updatedResetTime = IFeeContract(FeeContract).nextResetTime();
             if (updatedResetTime == _requiredFeeResetTime) {
                IFeeContract(FeeContract).updateFee();
             }
             uint256 feeInUSD = IFeeContract(FeeContract).getFee();
             devFee = feeInUSD * baseFee;
             _requiredFeeResetTime = updatedResetTime;
        
        }
        (bool success, ) = FeeContract.call{value: devFee / 10}("");
        require(success, Errors.TRANSFER_FAILED);
        bool sent = payable(developerWallet).send(devFee / 10 * 9);
        require(sent, Errors.TRANSFER_FAILED);
        if (msg.value - devFee > 0) {
            uint256 overflow = (msg.value - callFee());
            (bool returnOverflow, ) = payable(tx.origin).call{value: overflow}(
                ""
            );
        }
        _;
    }

    // Modifier to send fees to the fee contract and to the developer in contracts for payable functions.
    modifier devApplicationFeeWithPayment(uint256 H1PaymentToFunction) {
        if (msg.value < calculateDevFee() && calculateDevFee() > 0) {
            revert(Errors.INSUFFICIENT_FUNDS);
        }
         if (_requiredFeeResetTime < block.timestamp) {

             uint256 updatedResetTime = IFeeContract(FeeContract).nextResetTime();
             if (updatedResetTime == _requiredFeeResetTime) {
                IFeeContract(FeeContract).updateFee();
             }
             uint256 feeInUSD = IFeeContract(FeeContract).getFee();
             devFee = feeInUSD * baseFee;
             _requiredFeeResetTime = updatedResetTime;
        
        }
        (bool success, ) = FeeContract.call{value: devFee / 10}("");
        require(success, Errors.TRANSFER_FAILED);
        bool sent = payable(developerWallet).send(devFee / 10 * 9);
        require(sent, Errors.TRANSFER_FAILED);
        if (msg.value - devFee - H1PaymentToFunction > 0) {
            uint256 overflow = (msg.value - devFee - H1PaymentToFunction);
            (bool returnOverflow, ) = payable(tx.origin).call{value: overflow}(
                ""
            );
        }
        _;
    }

    /**
    @notice `setDevApplicationFee` sets the fee amount charged to utilize the application.
    @dev It is split 10% feeContract and 90% to the development team.
    */
    function setDevApplicationFee(uint256 newDevFee) external {
        require(msg.sender == developerWallet, Errors.INVALID_ADDRESS);
        require(callMinimumViableFee() < newDevFee, Errors.INVALID_FEE);
        uint256 feeInUSD = IFeeContract(FeeContract).getFee();
        baseFee = newDevFee;
        devFee = feeInUSD * newDevFee;
    }


    /**
    @notice `calculateDevFee` consults the oracle and gets the fee back in USD.
    */
    function calculateDevFee() public view returns (uint256 developerFeeFromApplication) {
        uint256 feeInUSD = IFeeContract(FeeContract).getFee();
        return feeInUSD * devFee;
    }

    /**
    @notice `callFee` gets the value for H1 in USD.
    */
    function callFee() public view returns (uint256 feeFromFeeContract) {
        return IFeeContract(FeeContract).getFee();
    }

    /**
    @notice `callMinimumViableFee` gets the minimum fee from the Fee contract.
    */
    function callMinimumViableFee() public view returns (uint256) {
        uint256 minFeeFromFeeContract = IFeeContract(FeeContract).getMinimumAllottedFee();
        if (minFeeFromFeeContract > devFee) {
            revert(Errors.INVALID_FEE);
        }
        return minFeeFromFeeContract;
    }
}
