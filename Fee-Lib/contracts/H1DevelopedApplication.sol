// SPDX-License-Identifier: ISC

import "./Errors.sol";
import "./FeeQuery.sol";

pragma solidity ^0.8.2;

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

    // Modifier to send fees to the fee contract and to the developer in contracts.
    modifier devApplicationFee() {
        if (msg.value < callFee() && callFee() > 0) {
            revert(Errors.INSUFFICIENT_FUNDS);
        }
        (bool success, ) = FeeContract.call{value: getHavenFee()}("");
        require(success, Errors.TRANSFER_FAILED);
        bool sent = payable(developerWallet).send(getDeveloperFee());
        _;
    }

    /**
   * @notice Constructor to initialize contract deployment.
   * @param _FeeContract address of fee contract to pay fees.
   * @param walletToCollectFees the address to receive 10% of the fees..
   * @dev For the param walletToCollectFees the deployer 
   * of this wallet should consider a setter for this address in their dApp.
   */

    constructor(address _FeeContract, address walletToCollectFees) {
        if (_FeeContract == address(0)) {
            revert(Errors.INVALID_ADDRESS);
        }
        FeeContract = _FeeContract;
        developerWallet = payable(walletToCollectFees);
    }

    /**
   @notice This is the view function to get the fee amount owed to the developer.
   @dev It is 90% of the contract balance.
   */
    function getDeveloperFee() public view returns (uint256 developerFee) {
        uint256 currentFee = callFee();
        developerFee = (currentFee / 10) * 9;
    }

    /**
   @notice This is the view function to get the fee amount owed to the FeeContract.
   @dev It is 10% of the contract balance.
   */

    function getHavenFee() public view returns (uint256 havenOneFee) {
        uint256 currentFee = callFee();
        havenOneFee = currentFee / 10;
    }

    //query fee function
    function callFee() public view returns (uint256) {
        uint256 currentFee = FeeQuery(FeeContract).getFee();
        return currentFee;
    }
}
