// SPDX-License-Identifier: MIT


pragma solidity ^0.8.2;


import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./FeeQuery.sol";
import "./Errors.sol";

/** 
@title FeeContract
@notice This contract outlines how fees are distributed by validators on Haven1.
@dev The primary function of this contract is to ensure proper distribution from Haven1 applications.
*/

interface IFeeOracle {
   function consult() external view returns (uint amountOut);

   function refreshOracle() external returns (bool success);
}

contract FeeContract is 
FeeQuery, 
Initializable,
AccessControlUpgradeable {


   /** 
   * @dev The event is triggered during the collectFee function. It sends the time, the address receiving it, and the fee amount owed.
   */
   event FeesDistributed(
       uint256 indexed timestamp,
       address indexed to,
       uint256 indexed amount
   );

   // Used to divide an addresses shares by the total.
   uint8 private CONTRACT_SHARES;

   // Address used to consult to find fee amounts.
   address public oracle;

   // Array for address used to consult to find fee amounts.
   address[] channels;

   // Array for address used to consult to find fee amounts.
   uint8[] weights;

   // Amount of time between each distribution.
   uint256 private lastDistribution;

   //Role to control contract
   bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

   /**
   @notice The initialize is initiating variables during deployment.
   @param _oracle is the address for the oracle that is consulted to determine fees.
   @param _channels array channels are the channels that receive payments.
   @param _weights are the amount of shares each channel receive.
   @param admin the address that can add or revoke address priveledges/
   @param distributor address that manages functions.
   @dev lastDistribution is the current timestamp fees distributed every 24 hours.
   @dev There cannot be more than five channels.
   */

   function initialize(address _oracle, address[] memory _channels, uint8[] memory _weights, address admin, address distributor) external initializer {
       
       __AccessControl_init();
        _grantRole(
            DEFAULT_ADMIN_ROLE, 
            admin)
            ;
        _grantRole(
            DISTRIBUTOR_ROLE,
            distributor)
            ;
             _revokeRole(
            DEFAULT_ADMIN_ROLE,
            msg.sender)
            ;
       if(_channels.length > 5 || _weights.length > 5){
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
   @notice This function gives the contract the ability to receive H1 from external addresses msg.data must be empty.
   */
   receive() external payable {}

   /**
   @notice This is the call to get the correct value for the fee across all native applications.
   @dev This call queries the oracle to set a fee.
   @dev After that is complete it then sets the time that the oracle needs to be rechecked.
   */

   function _resetFee() external {
    if(block.timestamp > requiredReset){
      fee = queryOracle();
      requiredReset = block.timestamp + epochLength;
    } else {
      revert(Errors.HOLD_TIME_IS_24_HOURS);
    }
   }

   /** 
   @dev Logic to add new channel with weight.
   @notice We allow 5 contracts per Fee Contract to ensure distribution can be managed we also don't allow duplicate addresses or zero addresses.
   @notice The total weight is tracked by `CONTRACT_SHARES` which we use to send correct amounts to each channel.
   */
   function addChannel(
       address _newChannelAddress,
       uint8 _weight
   ) external onlyRole(DISTRIBUTOR_ROLE) {
       if(channels.length == 5){
           revert(Errors.CONTRACT_LIMIT_REACHED);
       }  
       if(isOriginalAddress(_newChannelAddress) == false || address(0) == _newChannelAddress){
           revert(Errors.INVALID_ADDRESS);
       }
       channels.push(_newChannelAddress);
       weights.push(_weight);
       CONTRACT_SHARES += _weight;
   }

    /**
   @notice  Logic to adjust a channel and its weight.
   @param _index the index of the validator in the validators array.
   @param _newChannelAddress the address of the validator replacing the old one.
   @param _newWeight the amount of total shares the new address will receive.
   @dev the index to avoid a work around to the 5 channel limit and for 0 address.
   @dev The total weight is tracked by `CONTRACT_SHARES` which we adjust here by subtracting the old number and adding the new.
   */

   function adjustChannel(
       uint8 _index,
       address _newChannelAddress,
       uint8 _newWeight
   ) external onlyRole(DISTRIBUTOR_ROLE) {
       if(_newChannelAddress == address(0) || isOriginalAddress(_newChannelAddress) == false){
           revert(Errors.INVALID_ADDRESS);
       }
       if(_index > 4){
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
   function setEpoch(uint256 new_epochLength) external onlyRole(DISTRIBUTOR_ROLE) {
       epochLength = new_epochLength;
   }
   
   /** 
   @notice Function triggered by collectFee in other contracts to disburse payment to distribute funds to channels.
   @dev Function can be called by a wallet every 24 hours, gas is rebated.
   @dev The balance of the contract is distributed to channels and an event is triggered FeesDistributed.
   @dev The function reverts should the function have been called less than 24 hours ago.
   */
  
   function collectFee() external payable {
   if (block.timestamp > lastDistribution + epochLength|| hasRole(DISTRIBUTOR_ROLE, msg.sender)) {
      uint rebateValue = queryOracle();
       (bool gasRebate, ) = payable(tx.origin).call{value: rebateValue}("");
       require(gasRebate, Errors.GAS_REBATE_FAILED);

       uint amount = address(this).balance;

       for (uint i = 0; i < channels.length; i++) {
           uint share = (amount * weights[i]) / CONTRACT_SHARES;
          (bool sent,) = channels[i].call{value: share}("");
           require(sent, Errors.TRANSFER_FAILED);

           emit FeesDistributed(block.timestamp, channels[i], share);
       }
       lastDistribution = block.timestamp;
       _refreshOracle();
   }
   else {
      revert(Errors.HOLD_TIME_IS_24_HOURS);
    }
   }

   /** 
   @notice Function triggered to force distribution of funds to channels.
   */

   function forceFee() external payable onlyRole(DISTRIBUTOR_ROLE) {
       uint amount = address(this).balance;
       for (uint i = 0; i < channels.length; i++) {
           uint share = (amount * weights[i]) / CONTRACT_SHARES;
           (bool success, ) = (channels[i]).call{value: share}(
               abi.encodeWithSignature("recieveFees()")
           );
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
  
   function setOracle(address _newOracle) external onlyRole(DISTRIBUTOR_ROLE) {
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
   @notice Function to allow ability to view all channels.
   */

   function getChannels()public view returns(address[] memory){
       return channels;
   }

   /**
   @notice Function that allows ability to view all weights.
   */

   function getWieghts()public view returns(uint8[] memory){
       return weights;
   }

   /**
   @notice Function that allows ability to view the amount an address is supposed to be paid based on array position.
   @param index the number in the array of channels/weights representing the index.
   */

   function amountPaidToUponNextDistribution(uint8 index)public view returns(uint256){
       return weights[index] * address(this).balance / CONTRACT_SHARES;
   }

   /**
   @notice Allows ability to view a channel and its corresponding weight via index.
   @param index the number in the array of channels.
   */

   function getChannelWeightByIndex(uint8 index) public view returns (address, uint256) {
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

   function queryOracle() public view returns (uint feeAmount) {
       return (IFeeOracle(oracle).consult());
   }

   /**
   @notice Function to consult oracle to update.
   */

   function _refreshOracle() internal returns (bool success) {
       return (IFeeOracle(oracle).refreshOracle());
   }
}
