// SPDX-License-Identifier: ISC

import "./Errors.sol";

pragma solidity ^0.8.2;

/// @title H1DevelopedApplication
/// @notice This contract has a modifer that ensures fees are sent to the developer of an application and the FeeContract.
/// @dev The primary function of this contract is to be used as an import for developers building on Haven.

interface IFeeOracle {
    function consult() external returns (uint amountOut);

    function refreshOracle() external returns (bool success);
}

contract H1DevelopedApplication {
    // Storage for fee contract address.
    address FeeContract;
    // Storage to access fee query functions of fee contract.
    uint256 feeAmount;
    // Address storage for oracle
    address oracle;
    // Address storage for developer wallet.
    address developerWallet;

    // Modifier to send fees to the fee contract and to the developer in contracts.
    modifier applicationFee() {
        if (msg.value < feeAmount && feeAmount > 0) {
            revert(Errors.INSUFFICIENT_FUNDS);
        }
        uint256 havenFee = getHavenFee();
        (bool success, ) = FeeContract.call{value: havenFee}(
            abi.encodeWithSignature("receive()")
        );
        uint256 devFee = getDeveloperFee();
        bool sent = payable(developerWallet).send(devFee);
        _;
    }

    /**
   @notice Constructor to initialize contract deployment.
   @param _FeeContract address of fee contract to pay fees.
   @param walletToCollectFees the address to receive 10% of the fees..
   @param havenOracle the default address for the oracle.
   @dev For the param walletToCollectFees the deployer of this wallet should consider a setter for this address in their dApp.
   */

    constructor(
        address _FeeContract,
        address walletToCollectFees,
        address havenOracle
    ) {
        if (_FeeContract == address(0)) {
            revert(Errors.INVALID_ADDRESS);
        }
        FeeContract = _FeeContract;
        developerWallet = payable(walletToCollectFees);
        oracle = havenOracle;
    }

    /**
   @notice This is the view function to get the fee amount owed to the developer.
   @dev It is 90% of the contract balance.
   */
    function getDeveloperFee() public view returns (uint256 developerFee) {
        developerFee = (feeAmount / 10) * 9;
    }

    /**
   @notice This is the view function to get the fee amount owed to the FeeContract.
   @dev It is 10% of the contract balance.
   */

    function getHavenFee() public view returns (uint256 havenOneFee) {
        havenOneFee = address(this).balance / 10;
    }

    //query fee function
    function queryOracle() public returns (uint256 total) {
        return (IFeeOracle(oracle).consult());
    }
}
