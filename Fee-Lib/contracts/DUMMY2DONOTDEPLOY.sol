// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Errors.sol";

/** 
@title FeeContract
@notice This contract outlines how fees are distributed by validators on Haven1.
@dev The primary function of this contract is to ensure proper distribution from Haven1 applications.
*/


interface IFeeOracle {
    function consult() external view returns (uint256 amountOut);

    function refreshOracle() external returns (bool success);
}


contract FeeQuery {

    /**
     * @dev The event is triggered during the `resetFee` function.
     * It emits the time of the new reset and current call.
     */
    event FeeReset(uint256 indexed currentTimestamp, uint256 indexed newReset);

    // Address used to consult to find fee amounts.
    address public oracle;

    // This is used to measure the time frame in which we wait to consult the oracle.
    uint256 public epochLength;

    // This is the block timestamp that the fee will need to be reset.
    uint256 public requiredReset;

    // Storage for the application fee.
    uint256 public fee;

    // Storage for minimum fee.
    uint256 public minFee;

    /**
    @notice `resetFee` is the call to get the correct value for the fee across all native applications.
    @dev This call queries the oracle to set a fee.
    @dev After that is complete it then sets the time that the oracle needs to be rechecked.
    */

    function resetFee() public returns(uint256){
        if (block.timestamp > requiredReset || fee == 0) {
            fee = queryOracle();
            requiredReset = block.timestamp + epochLength;
           emit FeeReset(block.timestamp, requiredReset);
            return fee;
         } else {
             revert(Errors.HOLD_TIME_IS_24_HOURS);
        }
    }


    /**
    @notice `getMinFee` function to retrieve the minimum dev fee allowed for developers.
    */
    function getMinFee() external view returns (uint256) {
        return minFee;
    }

    /**
    @notice `getFee` function consults the fee contract to get the fee.
    @dev The required reset means the fee must be updated every 24 hours.
    */
    function getFee() public returns (uint256) {
            return fee;
    }

      /**
    @notice `queryOracle` this function is to consult oracle to get a fee amount.
    */

    function queryOracle() public view returns (uint feeAmount) {
        return (IFeeOracle(oracle).consult());
    }

}

contract HasNoRecieveFunctionForFailedTxns is FeeQuery {
    /**
     * @dev The event is triggered during the collectFee function.
     *It sends the time, the address receiving it, and the fee amount owed.
     */
    event FeesDistributed(
        uint256 indexed timestamp,
        address indexed to,
        uint256 indexed amount
    );

    // Used to divide an addresses shares by the total.
    uint8 private CONTRACT_SHARES;

    // // Address used to consult to find fee amounts.
    // address private oracle;

    // Array for address used to consult to find fee amounts.
    address[] channels;

    // Array for address used to consult to find fee amounts.
    uint8[] weights;

    // Amount of time between each distribution.
    uint256 private lastDistribution;

    // Address variables to aviod changes in constructor size since this is a dummy contract
    address private mockAddress;

    address private mockAddress2;


    function getMinimumAllottedFee() public view returns (uint256){
        return 2;
    }

    /**
   @notice The initialize is initiating variables during deployment.
   @param _oracle is the address for the oracle that is consulted to determine fees.
   @param _channels array channels are the channels that receive payments.
   @param _weights are the amount of shares each channel receive.
   @param havenFoundation the address that can add or revoke address priveledges/
   @param networkOperator operator address that manages functions.
   @dev lastDistribution is the current timestamp fees distributed every 24 hours.
   @dev There cannot be more than five channels.
   */

    constructor(
        address _oracle,
        address[] memory _channels,
        uint8[] memory _weights,
        address havenFoundation,
        address networkOperator
    ) {
        if (_channels.length > 5 || _weights.length > 5) {
            revert(Errors.CONTRACT_LIMIT_REACHED);
        }
        mockAddress = havenFoundation;
        mockAddress2 = networkOperator;
        lastDistribution = block.timestamp;
        epochLength = 86400;
        networkFeeResetTimestamp = block.timestamp + 86400;
        oracle = _oracle;
        for (uint i = 0; i < _channels.length; i++) {
            CONTRACT_SHARES += _weights[i];
            channels.push(_channels[i]);
            weights.push(_weights[i]);
        }
    }

    /**
   @notice This is the call to get the correct value for the fee across all native applications.
   @dev This call queries the oracle to set a fee.
   @dev After that is complete it then sets the time that the oracle needs to be rechecked.
   */

    function setAgainFee() external {
        if (block.timestamp > requiredReset || fee == 0) {
            fee = queryOracle();
            requiredReset = block.timestamp + epochLength;
        } else {
            revert(Errors.HOLD_TIME_IS_24_HOURS);
        }
    }

    /**
     * @dev Logic to add new channel with weight.
     * @notice We allow 5 contracts per Fee Contract to ensure distribution can
     * be managed we also don't allow duplicate addresses or zero addresses.
     * @notice The total weight is tracked by `CONTRACT_SHARES` which we use to send correct amounts to each channel.
     */
    function plusChannel(address _newChannelAddress, uint8 _weight) external {
        if (channels.length == 5) {
            revert(Errors.CONTRACT_LIMIT_REACHED);
        }
        if (
            isOriginalAddress(_newChannelAddress) == false ||
            address(0) == _newChannelAddress
        ) {
            revert(Errors.INVALID_ADDRESS);
        }
        channels.push(_newChannelAddress);
        weights.push(_weight);
        CONTRACT_SHARES += _weight;
    }

    /**
     * @notice  Logic to adjust a channel and its weight.
     * @param _index the index of the validator in the validators array.
     * @param _newChannelAddress the address of the validator replacing the old one.
     * @param _newWeight the amount of total shares the new address will receive.
     * @dev the index to avoid a work around to the 5 channel limit and for 0 address.
     * @dev The total weight is tracked by `CONTRACT_SHARES`
     * which we adjust here by subtracting the old number and adding the new.
     */

    function moveChannel(
        uint8 _index,
        address _newChannelAddress,
        uint8 _newWeight
    ) external {
        if (
            _newChannelAddress == address(0) ||
            isOriginalAddress(_newChannelAddress) == false
        ) {
            revert(Errors.INVALID_ADDRESS);
        }
        if (_index > 4) {
            revert(Errors.INCORRECT_INDEX);
        }
        channels[_index] = _newChannelAddress;
        CONTRACT_SHARES -= weights[_index];
        weights[_index] = _newWeight;
        CONTRACT_SHARES += _newWeight;
    }

    /**
   @notice This is to adjust the length of time between payouts from the contract.
   @param new_epochLength the length of time between payouts from the contract.
   */
    function newEpoch(uint256 new_epochLength) external {
        epochLength = new_epochLength;
    }

    /** 
   @notice Function triggered by collectFee in other contracts to disburse payment to distribute funds to channels.
   @dev Function can be called by a wallet every 24 hours, gas is rebated.
   @dev The balance of the contract is distributed to channels and an event is triggered FeesDistributed.
   @dev The function reverts should the function have been called less than 24 hours ago.
   */

    function grabFee() external {
        if (
            block.timestamp > lastDistribution + epochLength ||
            msg.sender == mockAddress2
        ) {
            uint rebateValue = queryOracle();
            (bool gasRebate, ) = payable(tx.origin).call{value: rebateValue}(
                ""
            );
            require(gasRebate, Errors.GAS_REBATE_FAILED);

            uint amount = address(this).balance;

            for (uint i = 0; i < channels.length; i++) {
                uint share = (amount * weights[i]) / CONTRACT_SHARES;
                (bool sent, ) = channels[i].call{value: share}("");
                require(sent, Errors.TRANSFER_FAILED);

                emit FeesDistributed(block.timestamp, channels[i], share);
            }
            lastDistribution = block.timestamp;
            _refreshOracle();
        } else {
            revert(Errors.HOLD_TIME_IS_24_HOURS);
        }
    }

    /** 
   @notice Function triggered to force distribution of funds to channels.
   */

    function pressureFee() external payable {
        uint amount = address(this).balance;
        for (uint i = 0; i < channels.length; i++) {
            uint share = (amount * weights[i]) / CONTRACT_SHARES;
            (bool success, ) = channels[i].call{value: share}("");
            require(success, Errors.TRANSFER_FAILED);
            emit FeesDistributed(block.timestamp, channels[i], share);
        }
        _refreshOracle();
        lastDistribution = block.timestamp;
    }

    /**
   @notice Setter function to adjust oracle address.
   @param _newOracle the new oracle address.
   */

    function newOracle(address _newOracle) external {
        oracle = _newOracle;
    }

    /**
   @notice This view function checks if the address is in the channels array.
   @dev It is used in functions above to ensure no duplicate addresses are added to the channels.
   */

    function isOriginalAddress(address channel) public view returns (bool) {
        for (uint i = 0; i < channels.length; i++) {
            if (channels[i] == channel) {
                return false;
            }
        }
        return true;
    }

    /**
   @notice Function to view when the fee will need to be reset by.
   */

    function getNextResetTime() public view returns (uint256) {
        return requiredReset;
    }

    /**
   @notice Function to allow ability to view all channels.
   */

    function getChannels() public view returns (address[] memory) {
        return channels;
    }

    /**
   @notice Function that allows ability to view all weights.
   */

    function getWieghts() public view returns (uint8[] memory) {
        return weights;
    }

    /**
   @notice Function that allows ability to view oracle address.
   */

    function getOracleAddress() public view returns (address) {
        return oracle;
    }

    /**
   @notice Function that allows ability to view the amount an address is supposed to be paid based on array position.
   @param index the number in the array of channels/weights representing the index.
   */

    function amountPaidToUponNextDistribution(
        uint8 index
    ) public view returns (uint256) {
        return (weights[index] * address(this).balance) / CONTRACT_SHARES;
    }

    /**
   @notice Allows ability to view a channel and its corresponding weight via index.
   @param index the number in the array of channels.
   */

    function getChannelWeightByIndex(
        uint8 index
    ) public view returns (address, uint256) {
        address a = channels[index];
        uint8 b = weights[index];
        return (a, b);
    }

    /**
   @notice View function to check the total number of shares that have been dispersed to addresses.
   */

    function getTotalContractShares() public view returns (uint8) {
        return CONTRACT_SHARES;
    }

    /**
   @notice View function to check the block in which the last distribution occured
   */

    function getLastDistributionBlock() public view returns (uint256) {
        return lastDistribution;
    }

    /**
   @notice Function to consult oracle to get fee amount.
   */

   function updateFee() external returns(uint256) {
        fee = queryOracle();
        networkFeeResetTimestamp += 86400;
        
    }

    uint256 networkFeeResetTimestamp;
    function nextResetTime() public view returns (uint256){
        return networkFeeResetTimestamp;
    }

    /**
   @notice Function to consult oracle to update.
   */

    function _refreshOracle() internal returns (bool success) {
        return (IFeeOracle(oracle).refreshOracle());
    }
}
