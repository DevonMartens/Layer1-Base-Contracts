// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;


import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./Errors.sol";

/** 
@title EscrowedH1 
@notice This contract is used for vesting H1 tokens.
@dev The purpose of this contract is to distribute vested tokens.
*/

contract EscrowedH1 is 
ReentrancyGuardUpgradeable, 
PausableUpgradeable,
AccessControlUpgradeable,
ERC20Upgradeable,
UUPSUpgradeable
{

      
    /**
    * @dev  Event fired off when H1 is claimed post it's vesting period from the contract.
    */

    event ClaimedH1(
        address indexed user,
        uint256 indexed amount,
        uint256 index
    );

    // Distributor can mint and withdraw.
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");


    // Amount of time for tokens to vest.
    uint256 public vestingDuration;

    // Deposit/Vesting Information stoage struct.
    struct VestingInfo {
        uint256 amount;
        uint256 depositTimestamp;
        uint256 lastClaimTimestamp;
        uint256 totalClaimed;
        bool finishedClaiming;
    }

    // Mapping from depositer's address to the vesting contract to the address to Deposit/Vesting Information stoage struct.
    mapping(address => VestingInfo[]) public userVesting;

    /**
    @notice Theses variables initalized when contract deploys.
    @param networkAdmin can remove/adddistrubutor roles.
    @param networkOperator can mint tokens and pause the contract.
    @dev The  OPERATOR_ROLE can be given after deployment by calling `grantRole(role, address)`
        Ex: `grantRole(OPERATOR_ROLE, 0x1d2B794563Bf90c6e53B56b215502b8aE4c42fF8)` 
    */

    function initialize(
        string memory name, 
        string memory symbol,
        address networkAdmin,
        address networkOperator,
        uint256 vestingTime
        ) 
        external initializer  {
        __ReentrancyGuard_init();
        __Pausable_init();
        __AccessControl_init();
        __ERC20_init(name, symbol);
        vestingDuration = vestingTime;
        _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, networkAdmin);
        _grantRole(OPERATOR_ROLE, networkOperator);      
    }

    /** 
    @notice Function to add H1 to the contract.
    */

    receive() external payable onlyRole(OPERATOR_ROLE){}

    /**
    @notice Function to pause contract.
    */

    function pause() external onlyRole(OPERATOR_ROLE) {
        _pause();
    }

    /**
    @notice Function to unpause contract.
    */
    function unpause() external onlyRole(OPERATOR_ROLE) {
        _unpause();
    }


    /** 
    @notice  An external address may call this function to take tokens held in thier wallet and vest them.
    @param amount is the number of tokens you put in burn to vest.
    @dev This function either creats a new struct or updates an address's existing vesting information.
    */
    function startVesting(uint256 amount) external whenNotPaused {
        require(balanceOf(msg.sender) >= amount, Errors.INSUFFICIENT_TOKEN_BALANCE);
        _burn(msg.sender, amount);
        userVesting[msg.sender].push(
            VestingInfo({
                amount: amount,
                depositTimestamp: block.timestamp,
                lastClaimTimestamp: block.timestamp,
                totalClaimed: 0,
                finishedClaiming: false
            })
        );
    }

    /**
    @notice Function for users to claim funds.
    @param index the index in the array holding the vesting tokens.
    @dev This function uses the view function calculateClaimableAmount to return the amount that a user may claim.
    @dev This function verifies the callers index first to ensure proper information is retrieved.
    - then it adds the claimable amount to totalClaimed 
    - checks if total claimed == amount deposited by user.
    - if yeah sets the finished claiming to true
    - emits ClaimedH1
    */
    function claim(uint256 index) external whenNotPaused  nonReentrant 
    {
        require(
            index < userVesting[msg.sender].length, Errors.INCORRECT_INDEX
        );
        uint256 returnAmount = calculateClaimableAmount(msg.sender, index);
        uint256 claimableAmount = returnAmount * 1 ether;
        require(claimableAmount > 0, Errors.INSUFFICIENT_TOKEN_BALANCE);
        userVesting[msg.sender][index].totalClaimed += returnAmount;
        //claimableAmount;
        userVesting[msg.sender][index].lastClaimTimestamp = block.timestamp;

        if (
            //userVesting[msg.sender][index].amount
            returnAmount ==
            userVesting[msg.sender][index].totalClaimed
        ) {
            userVesting[msg.sender][index].finishedClaiming = true;
}
        // _removeCompletedIndex(msg.sender);
        payable(msg.sender).transfer(claimableAmount);
        emit ClaimedH1(msg.sender, claimableAmount, index);
    }

    /**
    @notice This is meant to withdraw H1 sent to the contract.
    */

    function withdrawUnwrapped(address to) external onlyRole(OPERATOR_ROLE){
        (bool success,) = to.call{value:address(this).balance}("");
        require(success, Errors.TRANSFER_FAILED);
    } 

    
    /**
    @dev This is meant to withdraw escrowed H1 tokens that could be sent to the contract.
    */ 

    function withdrawWrapped(address to) external onlyRole(OPERATOR_ROLE){
        _transfer(address(this), to, balanceOf(address(this)));
    } 

    /**
    @dev This function is to mint tokens prior to vesting.
    @param recipient the address tha recieves the token to vest it.
    @param amount the amount of tokens you plan on recieving that you pay for.
    @notice will revert if amount is not high enough.
    */ 

    function mintEscrowedH1(
        address recipient,
        uint256 amount
    ) external payable whenNotPaused {
        require(msg.value == 1 ether * amount, Errors.H1_UNEQUAL_TO_DEPOSIT);
        _mint(recipient, amount);
    }

    /**
    @notice This function is to mint tokens prior to vesting for admin.
    @param recipient the address tha recieves the token to vest it.
    @param amount the amount of tokens you plan on recieving that you pay for.
    @notice will revert if a distributor doesn't call it.
    */ 

    function adminMintEscrowedH1(
        address recipient,
        uint256 amount
    ) external whenNotPaused onlyRole(OPERATOR_ROLE){
        _mint(recipient, amount);
    }

    /** 
    @notice Get struct back about a user specific deposit.
    @param user the wallet that made the deposit.
    @param index the deposit number from the array of totals. Starts at 0.
    */

    function getUserVestingByIndex(
        address user,
        uint256 index
    ) public view returns (VestingInfo memory) {
        return (userVesting[user][index]);
    }

    /** 
    @notice Returns array deposits from a user. 
    @param user the wallet that made the deposit.
    */

    function getUserVestingsByAddress(
        address user
    ) public view returns (VestingInfo[] memory userVestings) {
        return (userVesting[user]);
    }

    /** 
    @notice Gets the amount a user deposited when vesting at a specific time.
    @param user the wallet that made the deposit.
    @param index the deposit number from the array of totals. Starts at 0.
    */
    
   function getUserVestingAmountFromDepositIndex(
        address user,
        uint256 index
    ) public view returns (uint256) {
        return (userVesting[user][index].amount);
    }

    /** 
    @notice Gets the deposit timestamp from when a user started vesting.
    @param user the wallet that made the deposit.
    @param index the deposit number from the array of totals. Starts at 0.
    */

    function getUserVestingDepositTimestampFromIndex(
        address user,
        uint256 index
    ) public view returns (uint256) {
        return (userVesting[user][index].depositTimestamp);
    }

    /** 
    @notice Gets the deposit timestamp from when a user last claimed.
    @param user the wallet that made the deposit.
    @param index the deposit number from the array of totals. Starts at 0.
    */

    function getUserLastClaimTimestampFromIndex(
        address user,
        uint256 index
    ) public view returns (uint256) {
        return (userVesting[user][index].lastClaimTimestamp);
    }

    /** 
    @notice Gets the amount a user has claimed from a deposit.
    @param user the wallet that made the deposit.
    @param index the deposit number from the array of totals. Starts at 0.
    */

    function getUserVestingClaimedAmountFromIndex(
        address user,
        uint256 index
    ) public view returns (uint256) {
        return (userVesting[user][index].totalClaimed);
    }

    /** 
    @notice View function to return the amount that a user may claim.
    @param user the wallet that made the deposit.
    @param index the deposit number from the array of totals. Starts at 0.
    @dev Function steps:
        - Gets the users vesting information `vestingInfo` from the struct.
        - Gets the amount of time the tokens have been vesting since the last time a user claimed `elapsedTime`
        - Gets the amount `vestingPerSec` by taking the amount the user has deposited and dividing it by the vesting duration
    */

    function calculateClaimableAmount(
        address user,
        uint256 index
    ) public view returns (uint256 claimableAmount) {
        VestingInfo storage vestingInfo = userVesting[user][index];

        uint256 elapsedTime = block.timestamp -
            vestingInfo.lastClaimTimestamp;

        uint256 beforeDurationBreakDown = vestingInfo.amount * elapsedTime;
        claimableAmount = beforeDurationBreakDown / vestingDuration;

        if (claimableAmount > (vestingInfo.amount - vestingInfo.totalClaimed)) {
            return (vestingInfo.amount - vestingInfo.totalClaimed);
        }

        return claimableAmount;
    }

    /**  
    @notice Function to insert addresses and remove redundancies from array of structs that hold data on withdrawn deposits.
    @param finalized the address that has claimed all vested tokens.
    @dev Automatically called after claimed function.
    */
    // function _removeCompletedIndex(address finalized) internal {
    //   for (uint i = 0; i <  userVesting[finalized].length; i++) {
    //     if (userVesting[msg.sender][i].finishedClaiming == true && userVesting[msg.sender][i].amount == 0) {
    //       delete userVesting[finalized][i];
    //     }
    //   }
    // }

    /**
   @notice Function to upgrade contract override to protect.
   @param newImplementation new implementation address.
   */

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

}