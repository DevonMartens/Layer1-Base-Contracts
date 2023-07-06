// SPDX-License-Identifier: ISC

import "./Errors.sol";
import "./FeeQuery.sol";

pragma solidity ^0.8.0;

/**
 * @title H1DevelopedApplication
 * @notice This contract has a modifer that ensures fees
 * are sent to the developer of an application and the FeeContract.
 * @dev The primary function of this contract is to be used as an import for developers building on Haven.
 */

contract H1DevelopedApplication is FeeQuery {
    // Storage for fee contract address.
    address public FeeContract;
    // Address storage for developer wallet.
    address developerWallet;
    // Stoarge variable for the fee set by the developer.
    uint256 devFee;

    /**
     * @notice Constructor to initialize contract deployment.
     * @param _FeeContract address of fee contract to pay fees.
     * @param walletToCollectFees the address to receive 10% of the fees..
     * @dev For the param walletToCollectFees the deployer
     * of this wallet should consider a setter for this address in their dApp.
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
        _;
    }

     /**
   @notice `setDevApplicationFee` sets the fee amount charged to the consumer.
   @dev It is split 10% feeContract and 90% to the development team.
   */
    function setDevApplicationFee(uint256 newDevFee) external {
        require(msg.sender == developerWallet, Errors.INVALID_ADDRESS);
        require(callMiniumFee() < newDevFee, Errors.INVALID_FEE);
        devFee = newDevFee;
    }

    /**
   * @notice `getDeveloperPayment` the view function 
   * is to get the fee amount owed to the developer.
   * @dev It is 90% of the contract balance.
   */
    function getDeveloperPayment() public view returns (uint256 developerFee) {
        uint256 currentFee = calculateDevFee();
        developerFee = (currentFee / 10) * 9;
    }

    /**
   @notice `getHavenFee` gets the fee amount owed to the FeeContract.
   @dev It is 10% of the contract balance.
   */

    function getHavenFee() public view returns (uint256 havenOneFee) {
        uint256 currentFee = calculateDevFee();
        havenOneFee = currentFee / 10;
    }

    /**
   @notice `calculateDevFee` consults the oracle and gets the fee back in USD.
   */
    function calculateDevFee() public view returns (uint256) {
        uint256 devFeeInUSD = (callFee() * devFee);
        return devFeeInUSD;
    }

    /**
   @notice `callFee` gets the value for H1 in USD.
   */
    function callFee() public view returns (uint256) {
        uint256 currentFeePrice = FeeQuery(FeeContract).getFee();
        return currentFeePrice;
    }

    /**
   @notice `callMiniumFee` gets the minium fee from the Fee contract.
   */
    function callMiniumFee() public view returns (uint256) {
        uint256 minFeeFromFeeContract = FeeQuery(FeeContract).getMinFee();
        if (minFeeFromFeeContract > devFee) {
            revert(Errors.INVALID_FEE);
        }
        return minFeeFromFeeContract;
    }
}
