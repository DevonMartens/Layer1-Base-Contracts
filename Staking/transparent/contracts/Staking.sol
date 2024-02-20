// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

/**
@title NativeStaking
@notice This contract allows users to stake a specific ERC20 token and native H1 to earn rewards.
@dev This is an upgradeable staking contract with pausing and access control functionalities.
*/
contract NativeStaking is 
    Initializable, 
    PausableUpgradeable, 
    AccessControlUpgradeable {
    
    // Storage to call on staking token functions.
    IERC20Upgradeable private stakingToken;

    // Storage to call on staking rewards functions.
    IERC20Upgradeable private rewardsToken;

    // Duration of rewards in seconds.
    uint256 private duration;

    // Timestamp of when the rewards finish staking.
    uint256 private finalizationTimestamp; 

    // Minimum timestamp either the last updated time or the reward finish time.
    uint256 private lastTimestampRewardApplicable; 

    // Reward to be paid out per second.
    uint256 private rewardRate; 

    // Stores the calculated "reward per token" for the entire contract.
    uint256 private rewardPerTokenStored; 

    // The total staked assets (stakingToken and H1) in this contract.
    uint256 private totalSupply; 

    // This mapping is used to store the last known `rewardPerTokenStored` for each user.
    //  It helps to avoid calculating rewards from the beginning of time
    // for each user, and instead allows us to start calculations from the last update point.
    mapping(address => uint256) private userRewardPerTokenPaid;

    // This mapping is used to keep track of the accumulated rewards to be claimed for a user.
    mapping(address => uint256) private rewards; 

    // This mapping is used to keep track of the amount of tokens a user has staked.
    mapping(address => uint256) private balanceOfToken; 

    // This mapping is used to keep track of the amount of H1 a user has staked.
    mapping(address => uint256) private balanceOfH1; 

    // Storage for the operator role to call functions in the contract.
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /**
    * @dev This event is triggered during the `stake` function.
    * It emits the address, amount of tokens, and/or amount of H1 staked.
    */
    event Staked(address indexed user, uint256 indexed amountToken, uint256 indexed amountH1);

    /**
    * @dev This event is triggered during the `withdraw` function.
    * It emits the address, amount of tokens, and/or amount of H1 withdrawn from the contract.
    */
    event Withdrawn(address indexed user, uint256 indexed amountToken, uint256 indexed amountH1);

    /**
    * @dev This event is triggered during the `getReward` function.
    * It emits the address receiving the reward and the amount of the reward.
    */
    event RewardPaid(address indexed user, uint256 indexed rewardAmount);

    // Error to inform the sender that there is no reward available for them to claim.
    error NoRewardToClaim(address sender);

    // Error to inform the sender they did not make a deposit.
    error NoDepositMade(address sender);

    // Error to inform the caller that the reward duration has not yet finished.
    error RewardDurationNotFinished(uint256 completeTime);

    // Error to inform the admin that the reward rate is set to zero.
    error RewardRateEqualsZero();

    // Error to inform the admin that the reward amount is greater than the contract balance.
    error RewardAmountGreaterThanContractBalance(uint256 amount, uint256 contractBalance);

    // Error to inform the admin that an attempt was made to recover the staking or rewards tokens.
    error CannotRecoverStakingOrRewardsTokens(address staked, address rewards, address userInput);

    // Error to inform the sender has no amount to withdraw.
    error NoAmountToWithdraw(address sender);

    // Error to inform the sender the amount that they have requested to withdraw is too high.
    error AmountUnavailableToWithdraw(address sender);

    /**
    @notice `initialize` function initializes the contract.
    @param haven1Foundation The address of the haven1 foundation.
    @param operator The address of the operator.
    @param _duration The duration of the rewards.
    @param _stakingToken The address of the staking token.
    @param _rewardToken The address of the reward token.
    */
    function initialize(
        address haven1Foundation,
        address operator,
        uint256 _duration,
        address _stakingToken,
        address _rewardToken,
        uint256 rewardAmount
    ) external initializer {
        stakingToken = IERC20Upgradeable(_stakingToken);
        rewardsToken = IERC20Upgradeable(_rewardToken);
        duration = _duration;
        finalizationTimestamp = block.timestamp + _duration;
        address(this).call(abi.encodeWithSignature("notifyRewardAmount(uint)", rewardAmount));
        
        __Pausable_init();
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, haven1Foundation);
        _grantRole(OPERATOR_ROLE, operator);
    }

    /**
    @notice `pause` pauses the contract.
    @dev Can only be called by an account with the OPERATOR_ROLE.
    */
    function pause() external onlyRole(OPERATOR_ROLE) {
        _pause();
    }

    /**
    @notice `unpause` unpauses the contract.
    @dev Can only be called by an account with the OPERATOR_ROLE.
    */
    function unpause() external onlyRole(OPERATOR_ROLE) {
        _unpause();
    }

    /**
    @notice `setRewardsDuration` sets the duration for rewards.
    @dev Can only be called by an account with the DEFAULT_ADMIN_ROLE.
    @param _duration is the duration in seconds.
    */
    function setRewardsDuration(
        uint256 _duration
    ) external whenNotPaused onlyRole(OPERATOR_ROLE) {
        if(finalizationTimestamp > block.timestamp){
            revert RewardDurationNotFinished(finalizationTimestamp);
        } 
        duration = _duration;
    }

    /**
    @notice `notifyRewardAmount` notifies the contract of the reward amount.
    @dev Can only be called by an account with the OPERATOR_ROLE.
    @param _amount The amount of rewards.
    */
    function notifyRewardAmount(
        uint256 _amount
    ) external whenNotPaused onlyRole(OPERATOR_ROLE)  {
        rewardPerTokenStored = rewardPerToken();
        lastTimestampRewardApplicable = lastTimeRewardApplicable();
        if (block.timestamp >= finalizationTimestamp) {
            rewardRate = _amount / duration;
        } else {
            uint256 remainingRewards = (finalizationTimestamp - block.timestamp) *
                rewardRate;
            rewardRate = (_amount + remainingRewards) / duration;
        }
        if(rewardRate == 0){
              revert RewardRateEqualsZero();
        }
        if(
            rewardRate * duration > rewardsToken.balanceOf(address(this)))
        {
            revert RewardAmountGreaterThanContractBalance(rewardRate * duration, rewardsToken.balanceOf(address(this)));
        }
      

        finalizationTimestamp = block.timestamp + duration;
        lastTimestampRewardApplicable = block.timestamp;
    }

    /**
    @notice `_min` returns the smaller of two uint256 numbers.
    @param x The first uint256 number.
    @param y The second uint256 number.
    @return The smaller of the two numbers `x` and `y`.
    */
    function _min(uint256 x, uint256 y) private pure returns (uint256) {
        return x <= y ? x : y;
    }
    
    /**
    * @notice `stake` allows users to stake tokens or H1. Staked tokens are transferred from the user's 
    *      address to this contract, and the staked H1 amount is associated with the sender's 
    *      address. The function also updates the rewards for the user. 
    *      Emits a {Staked} event.
    *
    * @param _amountToken The amount of tokens to be staked.
    * 
    * Requirements:
    * - Either `_amountToken` or `msg.value` should be greater than zero.
    * - The sender should have approved the contract to spend the `_amountToken`.
    */
    function stake(uint256 _amountToken) external whenNotPaused payable {
        _updateReward(msg.sender);
        if(_amountToken == 0 && msg.value == 0){
            revert NoDepositMade(msg.sender);
        }
        if (_amountToken > 0) {
            stakingToken.transferFrom(msg.sender, address(this), _amountToken);
            balanceOfToken[msg.sender] += _amountToken;
        }
        if (msg.value > 0) {
            balanceOfH1[msg.sender] += msg.value;
        }
        totalSupply += _amountToken + msg.value;

        emit Staked(msg.sender, _amountToken, msg.value);
    }

    /**
    @notice `withdraw` allows a user to withdraw staked tokens or H1.
    @param _amountToken The amount of staking tokens.
    @param _amountH1 The amount of native H1. 
    */
    function withdraw(uint256 _amountToken, uint256 _amountH1) external whenNotPaused  {
        _updateReward(msg.sender);
        if(_amountToken == 0 && _amountH1 == 0){
            revert NoAmountToWithdraw(msg.sender);
        } 
        if(balanceOfToken[msg.sender] < _amountToken && balanceOfH1[msg.sender] < _amountH1){
            revert AmountUnavailableToWithdraw(msg.sender);
        }
        if (_amountToken > 0) {
            balanceOfToken[msg.sender] -= _amountToken;
            stakingToken.transfer(msg.sender, _amountToken);
        }
        if (_amountH1 > 0) {
            balanceOfH1[msg.sender] -= _amountH1;
            AddressUpgradeable.sendValue(payable(msg.sender), _amountH1);
        }
        totalSupply -= _amountToken + _amountH1;
        emit Withdrawn(msg.sender, _amountToken, _amountH1);
    }

    /**
    @notice `getReward` allows a user to claim rewards.
    */
    function getReward() external whenNotPaused {
            _updateReward(msg.sender);
            uint256 reward = rewards[msg.sender];
            if(reward == 0){
                revert NoRewardToClaim(msg.sender);
            }
                rewards[msg.sender] = 0;
                rewardsToken.transfer(msg.sender, reward);
                emit RewardPaid(msg.sender, reward);
    }

    /**
    * @notice `recoverERC20` allows the contract's admin to recover any ERC20 token sent to the contract accidentally.
    * @dev This function allows the recovery of any ERC20 tokens except for the staking and rewards tokens.
    * The function will revert if an attempt is made to recover the staking or rewards tokens.
    * Only an account with the `DEFAULT_ADMIN_ROLE` can call this function.
    * @param tokenAddress The address of the ERC20 token to be recovered.
    * @param tokenAmount The amount of the ERC20 token to be recovered.
    */
    function recoverERC20(address tokenAddress, uint256 tokenAmount) external  onlyRole(DEFAULT_ADMIN_ROLE) {
        if(tokenAddress == address(stakingToken) || tokenAddress == address(rewardsToken)){
           revert CannotRecoverStakingOrRewardsTokens(address(stakingToken), address(rewardsToken), tokenAddress);
        } 

        IERC20Upgradeable(tokenAddress).transfer(msg.sender, tokenAmount);
    }

    /** 
    @notice `lastTimeRewardApplicable` gets the last time rewards were applicable.
    @return The last time rewards were applicable.
    */
    function lastTimeRewardApplicable() public view returns (uint256) {
        return _min(finalizationTimestamp, block.timestamp);
    }

    /** 
    @notice `getFinalizationTimestamp` gets the block timestamp tokens will no longer be staking.
    @return The timestamp rewards stop earning.
    */
    function getFinalizationTimestamp() public view returns(uint256) {
        return finalizationTimestamp;
    }

    /** 
    @notice `getStakingDuration` gets total duration tokens will be staking.
    @return The time in seconds that staking occurs.
    */
    function getStakingDuration() public view returns(uint256) {
        return duration;
    }

    /** 
    @notice `getRewardPerTokenStored` gets the calculated "reward per token" for the entire contract.
    @return The amount of rewards per token stored.
    */
    function getRewardPerTokenStored() public view returns(uint256){
        return rewardPerTokenStored;
    }

    /** 
    @notice `getTotalSupply` gets total staked assets (stakingToken and H1) in this contract.
    @return The amount of assets in the contract.
    */
    function getTotalSupply() public view returns(uint256){
        return totalSupply;
    }
    /** 
    @notice `getUserRewardPerTokenPaid` this function is used to view the last known `rewardPerTokenStored` a each user.
    @param account the account we want reward data on.
    */ 
    function getUserRewardPerTokenPaid(address account) public view returns(uint256){
        return userRewardPerTokenPaid[account];
    }

    /** 
    @notice `getUserRewards` this function is used to view the accumulated rewards to be claimed for a user.
    @param account the account we want to see the total rewards of.
    */ 
    function getUserRewards(address account) public view returns(uint256){
        return rewards[account];
    }

    /** 
    @notice `getUserTokenAmountStaked` this function is used to view the amount of tokens a user has staked.
    @param account the account we want to see the amount of tokens staked.
    */ 
    function getUserTokenAmountStaked(address account) public view returns(uint256){
        return balanceOfToken[account];
    }

    /** 
    @notice `getUserH1AmountStaked` this function is used to view the amount of H1 a user has staked.
    @param account the account we want to see the amount of H1 staked.
    */ 
    function getUserH1AmountStaked(address account) public view returns(uint256){
        return balanceOfH1[account];
    }

    /** 
    @notice `rewardPerToken` gets the rewards per token.
    @return The rewards per token.
    */
    function rewardPerToken() public view returns (uint256) {
        if (totalSupply == 0) {
            return rewardPerTokenStored;
        }

        return
            rewardPerTokenStored +
            (rewardRate * (lastTimeRewardApplicable() - lastTimestampRewardApplicable) * 1e18) /
            totalSupply;
    }

    /**
    @notice `earned` gets the earned rewards for an account.
    @param _account The address of the account.
    @return The earned rewards for the account.
    */
    function earned(address _account) public view returns (uint256) {
        return
            ((balanceOfToken[_account] + balanceOfH1[_account]) *
                (rewardPerToken() - userRewardPerTokenPaid[_account])) /
            1e18 +
            rewards[_account];
    }

    /**
    * @notice `_updateReward` updates the reward accounting for the specified account.
    * @dev This function calculates the latest rewards for the `_account`, 
    * updates when the rewards were last computed, and synchronizes the stored 
    * reward-per-token value for the user. It's crucial to call this function before 
    * any state-changing operations that might affect a user's reward to ensure 
    * their reward data is up-to-date.
    * @param _account The address of the account for which rewards need to be updated.
    */
    function _updateReward(address _account) internal {
            rewardPerTokenStored = rewardPerToken();
            lastTimestampRewardApplicable = lastTimeRewardApplicable();
            rewards[_account] = earned(_account);
            userRewardPerTokenPaid[_account] = rewardPerTokenStored;
    }
}


