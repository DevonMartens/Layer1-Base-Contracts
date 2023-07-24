// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Errors.sol";


interface IFeeOracle {
    function consult() external view returns (uint256 amountOut);

    function refreshOracle() external returns (bool success);
}


contract FeeQuery {

  
    event FeeReset(uint256 indexed currentTimestamp, uint256 indexed newReset);

  
    address public oracle;
    
    uint256 public epochLength;
 
    uint256 public requiredReset;

    uint256 public fee;

    uint256 public minFee;


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

    function getMinFee() external view returns (uint256) {
        return minFee;
    }

    function getFee() public returns (uint256) {
            return fee;
    }

    function queryOracle() public view returns (uint feeAmount) {
        return (IFeeOracle(oracle).consult());
    }

}

contract HasNoRecieveFunctionForFailedTxns is FeeQuery {
  
    event FeesDistributed(
        uint256 indexed timestamp,
        address indexed to,
        uint256 indexed amount
    );

    uint8 private CONTRACT_SHARES;

    address[] channels;

    uint8[] weights;

    uint256 private lastDistribution;

    address private mockAddress;

    address private mockAddress2;

    function getMinimumAllottedFee() public view returns (uint256){
        return 2;
    }

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

    function setAgainFee() external {
        if (block.timestamp > requiredReset || fee == 0) {
            fee = queryOracle();
            requiredReset = block.timestamp + epochLength;
        } else {
            revert(Errors.HOLD_TIME_IS_24_HOURS);
        }
    }

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

    function newEpoch(uint256 new_epochLength) external {
        epochLength = new_epochLength;
    }

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

    function newOracle(address _newOracle) external {
        oracle = _newOracle;
    }

    function isOriginalAddress(address channel) public view returns (bool) {
        for (uint i = 0; i < channels.length; i++) {
            if (channels[i] == channel) {
                return false;
            }
        }
        return true;
    }

    function getNextResetTime() public view returns (uint256) {
        return requiredReset;
    }


    function getChannels() public view returns (address[] memory) {
        return channels;
    }

    function getWieghts() public view returns (uint8[] memory) {
        return weights;
    }

    function getOracleAddress() public view returns (address) {
        return oracle;
    }

    function amountPaidToUponNextDistribution(
        uint8 index
    ) public view returns (uint256) {
        return (weights[index] * address(this).balance) / CONTRACT_SHARES;
    }

    function getChannelWeightByIndex(
        uint8 index
    ) public view returns (address, uint256) {
        address a = channels[index];
        uint8 b = weights[index];
        return (a, b);
    }

    function getTotalContractShares() public view returns (uint8) {
        return CONTRACT_SHARES;
    }

    function getLastDistributionBlock() public view returns (uint256) {
        return lastDistribution;
    }

   function updateFee() external returns(uint256) {
        fee = queryOracle();
        networkFeeResetTimestamp += 86400;
        
    }

    uint256 networkFeeResetTimestamp;
    function nextResetTime() public view returns (uint256){
        return networkFeeResetTimestamp;
    }

    function _refreshOracle() internal returns (bool success) {
        return (IFeeOracle(oracle).refreshOracle());
    }
}
