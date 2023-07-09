// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./FeeQuery.sol";
import "./Errors.sol";

// force distro
/**
@title FeeContract
@notice This contract collects and distributes application fees from user application transactions.
@dev The primary function of this contract is to ensure proper distribution from Haven1 applications to distribution channels.
*/

interface IFeeQuery {
    function consult() external view returns (uint256 amountOut);

    function refreshOracle() external returns (bool success);
}

contract FeeContract is
    FeeQuery,
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    
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
     * @dev The event is triggered during the `resetFee` function.
     * It emits the time of the new reset and current call.
     */
    event FeeReset(uint256 indexed currentTimestamp, uint256 indexed newReset);

    /**
     * @dev The event is triggered during the addChannel function.
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
        address indexed addjustedChannel,
        uint256 indexed newChannelWeight,
        uint256 indexed currentContractShares
    );

    /**
     * @dev The event is triggered during the removeChannel function.
     * It sends the address that is no longer a channel
     * and the new total shares amount of the contract.
     */
    event ChannelRemoved(
        address indexed channelRemoved,
        uint256 indexed newTotalSharesAmount
    );

    // The total amount that we divide an addresses shares by to compute payments.
    uint8 private CONTRACT_SHARES;

    // Address used to consult to find fee amounts.
    address private oracle;

    // Array of addresses stored for fee distribution.
    address[] channels;

    // Array of corresponding weights to the channels array for distribution amounts.
    uint8[] weights;

    // The time of last fee distribution.
    uint256 private lastDistribution;

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
        address networkOperator
    ) external initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, havenFoundation);
        _grantRole(OPERATOR_ROLE, networkOperator);
        if (_channels.length > 10 || _weights.length > 10) {
            revert(Errors.CONTRACT_LIMIT_REACHED);
        }
        lastDistribution = block.timestamp;
        epochLength = 86400;
        requiredReset = block.timestamp + 86400;
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
    receive() external payable {}

    /**
    @notice `resetFee` is the call to get the correct value for the fee across all native applications.
    @dev This call queries the oracle to set a fee.
    @dev After that is complete it then sets the time that the oracle needs to be rechecked.
    */

    function resetFee() external {
        if (block.timestamp > requiredReset || fee == 0) {
            fee = queryOracle();
            requiredReset = block.timestamp + epochLength;
            emit FeeReset(block.timestamp, requiredReset);
        } else {
            revert(Errors.HOLD_TIME_IS_24_HOURS);
        }
    }

    /**
     * @notice `addChannel` includes the logic to add a new channel with weight.
     * @dev We allow 10 contracts per Fee Contract to ensure distribution can
     * be managed we also don't allow duplicate addresses or zero addresses.
     * @dev The total weight is tracked by `CONTRACT_SHARES` which we use to
     * divide each address's shares by sending correct amounts to each channel.
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
     * @param _index the index of the channels and weights array.
     * @param _newChannelAddress the address of the validator replacing the old one.
     * @param _newWeight the amount of total shares the new address will receive.
     * @dev the index to avoid a work around to the 5 channel limit and for 0 address.
     * @dev The total weight is tracked by `CONTRACT_SHARES`
     * which we adjust here by subtracting the old number and adding the new.
     */

    function adjustChannel(
        uint8 _index,
        address _newChannelAddress,
        uint8 _newWeight
    ) external onlyRole(OPERATOR_ROLE) {
        if (
            _newChannelAddress == address(0) ||
            isTheAddressInTheChannelsArray(_newChannelAddress) == false
        ) {
            revert(Errors.INVALID_ADDRESS);
        }
        if (_index > 10) {
            revert(Errors.INCORRECT_INDEX);
        }
        CONTRACT_SHARES -= weights[_index];
        weights[_index] = _newWeight;
        CONTRACT_SHARES += _newWeight;
        emit ChannelAdjusted(_newChannelAddress, _newWeight, CONTRACT_SHARES);
    }

    /**
     * @notice `removeChannelAndWeightByIndex` is the logic to remove a channel and its weight.
     * @param index the index of the channels and weights array.
     * @dev The total weight is tracked by `CONTRACT_SHARES`
     * which we subtract the value from in the middle of this function.
     */
    function removeChannelAndWeightByIndex(
        uint index
    ) external onlyRole(OPERATOR_ROLE) {
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
    @param new_epochLength the length of time between payouts from the contract.
    */
    function setEpoch(
        uint256 new_epochLength
    ) external onlyRole(OPERATOR_ROLE) {
        epochLength = new_epochLength;
    }

    /**
    @notice `distributeFeesToChannels` to disburse payment to distribute funds to channels.
    @dev Function can be called by a wallet every 24 hours.
    @dev The balance of the contract is distributed to channels and an event is triggered FeesDistributed.
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
    @notice `forceFeeDistribution` function triggered to force distribution of funds to channels.
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
    @param miniumAmount is the lowest amount a developer can charge to run their applications.
    */
    function setMinFee(uint256 miniumAmount) external onlyRole(OPERATOR_ROLE) {
        minFee = miniumAmount;
    }

    /**
    @notice `setOracle` this setter function to adjust oracle address.
    @param _newOracle the new oracle address.
    */

    function setOracle(address _newOracle) external onlyRole(OPERATOR_ROLE) {
        oracle = _newOracle;
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
     * @notice `getNextResetTime` this view function will
     * tell when the fee will need to be reset via the timestamp.
     */

    function getNextResetTime() public view returns (uint256) {
        return requiredReset;
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
     * @param index the number in the array of channels/weights representing the index.
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
        address a = channels[index];
        uint8 b = weights[index];
        return (a, b);
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
    @notice `queryOracle` this function is to consult oracle to get a fee amount.
    */

    function queryOracle() public view returns (uint feeAmount) {
        return (IFeeOracle(oracle).consult());
    }

    /**
    @notice `_refreshOracle` this function to consult oracle to update.
    */

    function _refreshOracle() internal returns (bool success) {
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
