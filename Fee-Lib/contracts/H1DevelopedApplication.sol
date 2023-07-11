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

}

contract H1DevelopedApplication {
    
    // Storage for fee contract address.
    address public FeeContract;

    // Address storage for developer wallet.
    address developerWallet;

    // Storage variable for the fee set by the developer.
    uint256 devFee;

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
        FeeContract = _FeeContract;
        developerWallet = payable(walletToCollectFees);
        devFee = applicationFee;
    }

    // Modifier to send fees to the fee contract and to the developer in contracts.
    modifier devApplicationFee() {
        if (msg.value < calculateDevFee() && calculateDevFee() > 0) {
            revert(Errors.INSUFFICIENT_FUNDS);
        }
        (bool success, ) = FeeContract.call{value: getHavenFee()}("");
        require(success, Errors.TRANSFER_FAILED);
        bool sent = payable(developerWallet).send(getDeveloperPayment());
        require(sent, Errors.TRANSFER_FAILED);
        if (msg.value - calculateDevFee() > 0) {
            uint256 overflow = (msg.value - callFee());
            (bool returnOverflow, ) = payable(tx.origin).call{value: overflow}(
                ""
            );
        }
        _;
    }

    // Modifier to send fees to the fee contract and to the developer in contracts.
    modifier devApplicationFeeWithPayment(uint256 H1PaymentToFunction) {
        if (msg.value < calculateDevFee() && calculateDevFee() > 0) {
            revert(Errors.INSUFFICIENT_FUNDS);
        }
        (bool success, ) = FeeContract.call{value: getHavenFee()}("");
        require(success, Errors.TRANSFER_FAILED);
        bool sent = payable(developerWallet).send(getDeveloperPayment());
        require(sent, Errors.TRANSFER_FAILED);
        if (msg.value - calculateDevFee() - H1PaymentToFunction > 0) {
            uint256 overflow = (msg.value - callFee() - H1PaymentToFunction);
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
        devFee = newDevFee;
    }

    /**
     * @notice `getDeveloperPayment` the  function
     * is to get the fee amount payed to the developer.
     * @dev It is 90% of the fee balance.
     */
    function getDeveloperPayment() public view returns (uint256 developerFee) {
        uint256 currentFee = calculateDevFee();
        developerFee = (currentFee / 10) * 9;
    }

    /**
    @notice `getHavenFee` gets the fee amount owed to the FeeContract.
    @dev It is 10% of the fee balance.
    */

    function getHavenFee() public view returns (uint256 havenOneFee) {
        uint256 currentFee = calculateDevFee();
        havenOneFee = currentFee / 10;
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
