// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./Errors.sol";



/**
@title FeeContract
@notice This contract collects and distributes application fees from user application transactions.
@dev The primary function of this contract is to ensure proper distribution from Haven1 applications to distribution channels.
*/

interface IFeeOracle {
    function consult() external view returns (uint256 amountOut);

    function refreshOracle() external returns (bool success);
}

contract FeeContract is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{

    /**
     * @dev The event is triggered during the `receive` function.
     * It emits the time, the address sending the funds, and amount payed.
     */
    event FeesReceived(
        uint256 indexed timestamp,
        address indexed from,
        uint256 indexed amount
    );
    
    /**
     * @dev The event is triggered during the `distributeFeesToChannels` function.
     * It emits the time, the address receiving it, and the fee amount owed.
     */
    event FeesDistributed(
        uint256 indexed timestamp,
        address indexed to,
        uint256 indexed amount
    );

    /**
     * @dev The event is triggered during the `addChannel` function.
     * It emits the address, shares, and total shares of the contract.
     */
    event ChannelAdded(
        address indexed newChannelAddress,
        uint256 indexed channelWeight,
        uint256 indexed contractShares
    );

    /**
     * @dev The event is triggered during the `adjustChannel` function.
     * It emits address of the adjusted channel it's old and current share amount and
     * the new total shares amount of the contract.
     */
    event ChannelAdjusted(
        address indexed adjustedChannel,
        uint256 indexed newChannelWeight,
        uint256 indexed currentContractShares
    );

    /**
     * @dev The event is triggered during the `removeChannel` function.
     * It sends the address that is no longer a channel
     * and the new total shares amount of the contract.
     */
    event ChannelRemoved(
        address indexed channelRemoved,
        uint256 indexed newTotalSharesAmount
    );

    /**
     * @dev The event is triggered during the `resetFee` function.
     * It emits the time of the new reset and current call.
     */
    event FeeReset(uint256 indexed newFee);

    // Address used to consult to find fee amounts.
    address private oracle;

    // This is used to measure the time frame in which we wait to consult the oracle.
    uint256 public epochLength;

    // Storage for the application fee.
    uint256 private fee;

    // Storage for minimum fee.
    uint256 private minimumFeeAllowedForDevs;

    // The total amount that we divide an addresses shares by to compute payments.
    uint8 private CONTRACT_SHARES;

    // Array of addresses stored for fee distribution.
    address[] channels;

    // Array of corresponding weights to the channels array for distribution amounts.
    uint8[] weights;

    // The time of last fee distribution.
    uint256 private lastDistribution;

    // The timestamp in which the fee needs to be reset accross the network.
    uint256 private networkFeeResetTimestamp;

    // Role to control the contract.
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /**
    @notice `initialize` is initiating variables during deployment.
    @param _oracle is the address for the oracle that is consulted to determine fees.
    @param _channels array channels are the channels that receive payments.
    @param _weights are the amount of shares each channel receives.
    @param havenFoundation the address that can add or revoke address privileges.
    @param networkOperator operator address that manages functions.
    @dev lastDistribution is the current timestamp fees distributed every 24 hours.
    @dev There cannot be more than ten channels.
    */
    function initialize(
        address _oracle,
        address[] memory _channels,
        uint8[] memory _weights,
        address havenFoundation,
        address networkOperator,
        uint256 minimumFeeAllowedForBuilders
    ) external initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, havenFoundation);
        _grantRole(OPERATOR_ROLE, networkOperator);
        if (_channels.length > 10 || _weights.length > 10) {
            revert(Errors.CONTRACT_LIMIT_REACHED);
        }
        minimumFeeAllowedForDevs = minimumFeeAllowedForBuilders;
        fee = IFeeOracle(_oracle).consult();
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
    @notice `receive` gives the contract the ability to receive H1 from external addresses msg.data must be empty.
    */
    receive() external payable {
        emit FeesReceived(block.timestamp, tx.origin, msg.value);
    }


    /**
     * @notice `addChannel` includes the logic to add a new channel with weight.
     * @dev We allow 10 contracts per FeeContract to ensure distribution can
     * be managed. The check ensures that there are no duplicate addresses or zero addresses.
     * @dev The total weight is tracked by `CONTRACT_SHARES` which we use to
     * divide each address's shares to then send the correct amounts to each channel.
     */
    function addChannel(
        address _newChannelAddress,
        uint8 _weight
    ) external onlyRole(OPERATOR_ROLE) {
        if (channels.length == 10) {
            revert(Errors.CONTRACT_LIMIT_REACHED);
        }
        if (
            isTheAddressInTheChannelsArray(_newChannelAddress) == false ||
            address(0) == _newChannelAddress
        ) {
            revert(Errors.INVALID_ADDRESS);
        }
        channels.push(_newChannelAddress);
        weights.push(_weight);
        CONTRACT_SHARES += _weight;
        emit ChannelAdded(_newChannelAddress, _weight, CONTRACT_SHARES);
    }

    /**
     * @notice `adjustChannel` includes the logic to adjust a channel and its weight.
     * @param _oldChannelAddress the address of the current channel in the channels and weights array.
     * @param _newChannelAddress the address of the channel replacing the old one.
     * @param _newWeight the amount of total shares the new address will receive.
     * @dev The sum of all the channel's weights is tracked by `CONTRACT_SHARES`
     * which we adjust here by subtracting the old weight number and adding the new one.
     */

    function adjustChannel(
        address _oldChannelAddress,
        address _newChannelAddress,
        uint8 _newWeight
    ) external onlyRole(OPERATOR_ROLE) {
        if (
            _newChannelAddress == address(0) ||
            isTheAddressInTheChannelsArray(_newChannelAddress) == false
        ) {
            revert(Errors.INVALID_ADDRESS);
        }
        uint256 index = _findIndexPosition(_oldChannelAddress);
        CONTRACT_SHARES -= weights[index];
        weights[index] = _newWeight;
        CONTRACT_SHARES += _newWeight;
        emit ChannelAdjusted(_newChannelAddress, _newWeight, CONTRACT_SHARES);
    }

    /**
     * @notice `removeChannel` is the logic to remove a channel and its weight.
     * @param _channel the address being removed.
     * @dev The total weight is tracked by `CONTRACT_SHARES`.
     * which we subtract the value from in the middle of this function.
     */
    function removeChannel(
        address _channel
    ) external onlyRole(OPERATOR_ROLE) {
        uint256 index =  _findIndexPosition(_channel);
        address removedAddress = channels[index];
        for (uint i = index; i < channels.length - 1; i++) {
            channels[i] = channels[i + 1];
        }
        channels.pop();
        CONTRACT_SHARES -= weights[index];
        weights[index] = weights[weights.length - 1];
        for (uint i = index; i < weights.length - 1; i++) {
            weights[i] = weights[i + 1];
        }
        weights.pop();
        emit ChannelRemoved(removedAddress, CONTRACT_SHARES);
    }

    /**
    @notice `setEpoch` is to adjust the length of time between payouts from the contract.
    @param newEpochLength the length of the new time between payouts from the contract.
    */
    function setEpoch(
        uint256 newEpochLength
    ) external onlyRole(OPERATOR_ROLE) {
        epochLength = newEpochLength;
    }

    /**
    @notice `distributeFeesToChannels` is to disburse payment by distributing contract held funds to channels.
    @dev This function can be called every 24 hours.
    @dev The balance of the contract is distributed to channels and an event is triggered `FeesDistributed` 
    then the `FeeReset` event is emitted decalring the new fee amount.
    */

    function distributeFeesToChannels() external payable {
        if (
            block.timestamp > lastDistribution + epochLength ||
            hasRole(OPERATOR_ROLE, msg.sender)
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
    * @notice `forceFeeDistribution` function triggered to force distribution of funds to channels.
    * @dev It can only be called by an operator. In case something is wrong with the oracle or funds need to be be
    * distributed immediately.
    */

    function forceFeeDistribution() external payable onlyRole(OPERATOR_ROLE) {
        uint amount = address(this).balance;
        for (uint i = 0; i < channels.length; i++) {
            uint share = (amount * weights[i]) / CONTRACT_SHARES;
            (bool success, ) = channels[i].call{value: share}("");
            require(success, Errors.TRANSFER_FAILED);
            emit FeesDistributed(block.timestamp, channels[i], share);
        }
        lastDistribution = block.timestamp;
    }

    /**
    @notice `setMinFee` is a setter function to set the minimum fee for developer applications.
    @param minimumAmount is the lowest amount a developer can charge to run functions in their applications.
    */
    function setMinFee(uint256 minimumAmount) external onlyRole(OPERATOR_ROLE) {
        minimumFeeAllowedForDevs = minimumAmount;
    }

    /**
    @notice `setOracle` this setter function to adjust oracle address.
    @param newOracle the new oracle address.
    */

    function setOracle(address newOracle) external onlyRole(OPERATOR_ROLE) {
        oracle = newOracle;
    }


    /**
    * @notice `updateFee` updates the networkFeeResetTimestamp and the fee.
    * @dev It can be called anyone that wants to call it.
    * H1Developed or Native applications will call it every 24 hours.
    */
    function updateFee() external {
        fee = queryOracle();
        networkFeeResetTimestamp = 86400 + networkFeeResetTimestamp;
        emit FeeReset(fee);
    }
    

    /**
    @notice `nextResetTime` function returns the networkFeeResetTimestamp.
    */
    function nextResetTime() public view returns (uint256){
        return networkFeeResetTimestamp;
    }

    /**
    * @notice `getFee` function returns the fee value updated by
    * oracle at least every 24 hours.
    */
    function getFee() public view returns (uint256) {
            return fee;
    }

    /**
    @notice `_findIndexPosition` this view function checks the address to obtain the index in the array.
    @dev It is used to change the arrays of weights and channels.
    */

    function _findIndexPosition(
        address channel
    ) public view returns (uint256) {
        for (uint i = 0; i < channels.length; i++) {
            if (channels[i] == channel) {
                return i;
            }
    }
    }

    /**
    @notice `isTheAddressInTheChannelsArray` this view function checks if the address is in the channels array.
    @dev It is used in functions above to ensure no duplicate addresses are added to the channels.
    */

    function isTheAddressInTheChannelsArray(
        address channel
    ) public view returns (bool) {
        for (uint i = 0; i < channels.length; i++) {
            if (channels[i] == channel) {
                return false;
            }
        }
        return true;
    }

    /**
    @notice `getChannels` this function to allow the ability to view all channels.
    */

    function getChannels() public view returns (address[] memory) {
        return channels;
    }

    /**
    @notice `getWeights` this function that allows the ability to view all weights.
    */

    function getWeights() public view returns (uint8[] memory) {
        return weights;
    }

    /**
    @notice `getOracleAddress` this function that allows the ability to view oracle addresses.
    */

    function getOracleAddress() public view returns (address) {
        return oracle;
    }

    /**
     * @notice `amountPaidToUponNextDistribution` this function allows the
     * ability to view the amount an address is supposed to be paid based on array position.
     * @param index the number representing the position
     * in the array of channels/weights representing the index.
     */

    function amountPaidToUponNextDistribution(
        uint8 index
    ) public view returns (uint256) {
        return (weights[index] * address(this).balance) / CONTRACT_SHARES;
    }

    /**
     * @notice `getChannelWeightByIndex` this function allows ability to view a channel
     * and its corresponding weight via index.
     * @param index the number in the array of channels.
     */

    function getChannelWeightByIndex(
        uint8 index
    ) public view returns (address, uint256) {
        address channelOfIndex = channels[index];
        uint8 weightOfIndex = weights[index];
        return (channelOfIndex, weightOfIndex);
    }

    /**
     * @notice `getTotalContractShares` this view function to check the total
     * number of shares that have been dispersed to addresses.
     */

    function getTotalContractShares() public view returns (uint8) {
        return CONTRACT_SHARES;
    }

    /**
     * @notice `getLastDistributionBlock` this view function to
     * check the block in which the last distribution occurred
     */

    function getLastDistributionBlock() public view returns (uint256) {
        return lastDistribution;
    }

    /**
    @notice `getMinimumAllottedFee` function to retrieve the minimum dev fee allowed for developers.
    */
    function getMinimumAllottedFee() public view returns (uint256) {
        return minimumFeeAllowedForDevs;
    }

    /**
    @notice `queryOracle` this function is to consult oracle to get a fee amount.
    */

    function queryOracle() public view returns (uint feeAmount) {
        return (IFeeOracle(oracle).consult());
    }

    /**
    @notice `_refreshOracle` this function to consult oracle to update.
    */

    function _refreshOracle() public returns (bool success) {
        return (IFeeOracle(oracle).refreshOracle());
    }

    /**
    @notice `_authorizeUpgrade` this function to upgrade contract override to protect.
    @param newImplementation new implementation address.
    */

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

}
