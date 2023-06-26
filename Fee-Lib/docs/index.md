# Solidity API

## IFeeOracle

This contract outlines how fees are distributed by validators on Haven1.

_The primary function of this contract is to ensure proper distribution from Haven1 applications._

### consult

```solidity
function consult() external returns (uint256 amountOut)
```

### refreshOracle

```solidity
function refreshOracle() external returns (bool success)
```

## FeeOracle

### priceAverage

```solidity
uint256 priceAverage
```

### justKeepAdding

```solidity
uint256 justKeepAdding
```

### setRequiredReset

```solidity
function setRequiredReset(uint256 newReset) external
```

### setPriceAverage

```solidity
function setPriceAverage(uint256 newPriceAverage) external
```

### consult

```solidity
function consult() external view returns (uint256 amountOut)
```

### refreshOracle

```solidity
function refreshOracle() external returns (bool success)
```

### viewJustKeepAdding

```solidity
function viewJustKeepAdding() external view returns (uint256)
```

## Errors

### PREVIOUSLY_VERIFIED

```solidity
string PREVIOUSLY_VERIFIED
```

### ID_DOES_NOT_EXIST

```solidity
string ID_DOES_NOT_EXIST
```

### ID_NOT_TRANSFERABLE

```solidity
string ID_NOT_TRANSFERABLE
```

### ID_INVALID_EXPIRED

```solidity
string ID_INVALID_EXPIRED
```

### NOT_VALID_PROVER

```solidity
string NOT_VALID_PROVER
```

### ZERO_ADDRESS_NOT_VALID_ARGUMENT

```solidity
string ZERO_ADDRESS_NOT_VALID_ARGUMENT
```

### INVALID_TOKEN_ID

```solidity
string INVALID_TOKEN_ID
```

### TOKEN_ID_ALREADY_EXISTS

```solidity
string TOKEN_ID_ALREADY_EXISTS
```

### SOULBOUND_TOKEN

```solidity
string SOULBOUND_TOKEN
```

### INSUFFICIENT_BALANCE

```solidity
string INSUFFICIENT_BALANCE
```

### INSUFFICIENT_TOKEN_BALANCE

```solidity
string INSUFFICIENT_TOKEN_BALANCE
```

### INCORRECT_INDEX

```solidity
string INCORRECT_INDEX
```

### TRANSFER_FAILED

```solidity
string TRANSFER_FAILED
```

### H1_UNEQUAL_TO_DEPOSIT

```solidity
string H1_UNEQUAL_TO_DEPOSIT
```

### NO_AMOUNT_TO_CLAIM

```solidity
string NO_AMOUNT_TO_CLAIM
```

### ADDRESS_BLOCKED

```solidity
string ADDRESS_BLOCKED
```

### ONLY_APPROVES_CONTRACTS

```solidity
string ONLY_APPROVES_CONTRACTS
```

### WHITELIST_ERROR

```solidity
string WHITELIST_ERROR
```

### GAS_REBATE_ERROR

```solidity
string GAS_REBATE_ERROR
```

### DISTRIBUTION_ERROR

```solidity
string DISTRIBUTION_ERROR
```

### RESET_FEE

```solidity
string RESET_FEE
```

### HOLD_TIME_IS_24_HOURS

```solidity
string HOLD_TIME_IS_24_HOURS
```

### GAS_REBATE_FAILED

```solidity
string GAS_REBATE_FAILED
```

### INVALID_ADDRESS

```solidity
string INVALID_ADDRESS
```

### CONTRACT_LIMIT_REACHED

```solidity
string CONTRACT_LIMIT_REACHED
```

### INSUFFICIENT_FUNDS

```solidity
string INSUFFICIENT_FUNDS
```

### ACCOUNT_HAS_NO_SHARES

```solidity
string ACCOUNT_HAS_NO_SHARES
```

### NO_DUPLICATES

```solidity
string NO_DUPLICATES
```

### ZERO_VARIABLE_NOT_ACCEPTED

```solidity
string ZERO_VARIABLE_NOT_ACCEPTED
```

### ADDRESS_ALREADY_HAS_A_VALUE

```solidity
string ADDRESS_ALREADY_HAS_A_VALUE
```

### INVALID_INDEX

```solidity
string INVALID_INDEX
```

## IFeeOracle

This contract outlines how fees are distributed by validators on Haven1.

_The primary function of this contract is to ensure proper distribution from Haven1 applications._

### consult

```solidity
function consult() external view returns (uint256 amountOut)
```

### refreshOracle

```solidity
function refreshOracle() external returns (bool success)
```

## FeeContract

### FeesDistributed

```solidity
event FeesDistributed(uint256 timestamp, address to, uint256 amount)
```

_The event is triggered during the collectFee function.
It sends the time, the address receiving it, and the fee amount owed._

### channels

```solidity
address[] channels
```

### weights

```solidity
uint8[] weights
```

### DISTRIBUTOR_ROLE

```solidity
bytes32 DISTRIBUTOR_ROLE
```

### UPGRADER_ROLE

```solidity
bytes32 UPGRADER_ROLE
```

### initialize

```solidity
function initialize(address _oracle, address[] _channels, uint8[] _weights, address upgrader, address admin, address distributor) external
```

The initialize is initiating variables during deployment.
@param \_oracle is the address for the oracle that is consulted to determine fees.
@param \_channels array channels are the channels that receive payments.
@param \_weights are the amount of shares each channel receive.
@param admin the address that can add or revoke address priveledges/
@param distributor address that manages functions.
@dev lastDistribution is the current timestamp fees distributed every 24 hours.
@dev There cannot be more than five channels.

### receive

```solidity
receive() external payable
```

This function gives the contract the ability to receive H1 from external addresses msg.data must be empty.

### resetFee

```solidity
function resetFee() external
```

This is the call to get the correct value for the fee across all native applications.
@dev This call queries the oracle to set a fee.
@dev After that is complete it then sets the time that the oracle needs to be rechecked.

### addChannel

```solidity
function addChannel(address _newChannelAddress, uint8 _weight) external
```

We allow 5 contracts per Fee Contract to ensure distribution can
be managed we also don't allow duplicate addresses or zero addresses.
The total weight is tracked by `CONTRACT_SHARES` which we use to send correct amounts to each channel.

_Logic to add new channel with weight._

### adjustChannel

```solidity
function adjustChannel(uint8 _index, address _newChannelAddress, uint8 _newWeight) external
```

Logic to adjust a channel and its weight.

_the index to avoid a work around to the 5 channel limit and for 0 address.
The total weight is tracked by `CONTRACT_SHARES`
which we adjust here by subtracting the old number and adding the new._

#### Parameters

| Name                | Type    | Description                                              |
| ------------------- | ------- | -------------------------------------------------------- |
| \_index             | uint8   | the index of the validator in the validators array.      |
| \_newChannelAddress | address | the address of the validator replacing the old one.      |
| \_newWeight         | uint8   | the amount of total shares the new address will receive. |

### setEpoch

```solidity
function setEpoch(uint256 new_epochLength) external
```

This is to adjust the length of time between payouts from the contract.
@param new_epochLength the length of time between payouts from the contract.

### collectFee

```solidity
function collectFee() external payable
```

Function triggered by collectFee in other contracts to disburse payment to distribute funds to channels.
@dev Function can be called by a wallet every 24 hours, gas is rebated.
@dev The balance of the contract is distributed to channels and an event is triggered FeesDistributed.
@dev The function reverts should the function have been called less than 24 hours ago.

### forceFee

```solidity
function forceFee() external payable
```

Function triggered to force distribution of funds to channels.

### setOracle

```solidity
function setOracle(address _newOracle) external
```

Setter function to adjust oracle address.
@param \_newOracle the new oracle address.

### isOriginalAddress

```solidity
function isOriginalAddress(address channel) public view returns (bool)
```

This view function checks if the address is in the channels array.
@dev It is used in functions above to ensure no duplicate addresses are added to the channels.

### getNextResetTime

```solidity
function getNextResetTime() public view returns (uint256)
```

Function to view when the fee will need to be reset by.

### getChannels

```solidity
function getChannels() public view returns (address[])
```

Function to allow ability to view all channels.

### getWieghts

```solidity
function getWieghts() public view returns (uint8[])
```

Function that allows ability to view all weights.

### getOracleAddress

```solidity
function getOracleAddress() public view returns (address)
```

Function that allows ability to view oracle address.

### amountPaidToUponNextDistribution

```solidity
function amountPaidToUponNextDistribution(uint8 index) public view returns (uint256)
```

Function that allows ability to view the amount an address is supposed to be paid based on array position.
@param index the number in the array of channels/weights representing the index.

### getChannelWeightByIndex

```solidity
function getChannelWeightByIndex(uint8 index) public view returns (address, uint256)
```

Allows ability to view a channel and its corresponding weight via index.
@param index the number in the array of channels.

### getTotalContractShares

```solidity
function getTotalContractShares() public view returns (uint8)
```

View function to check the total number of shares that have been dispersed to addresses.

### getLastDistributionBlock

```solidity
function getLastDistributionBlock() public view returns (uint256)
```

View function to check the block in which the last distribution occured

### queryOracle

```solidity
function queryOracle() public view returns (uint256 feeAmount)
```

Function to consult oracle to get fee amount.

### \_refreshOracle

```solidity
function _refreshOracle() internal returns (bool success)
```

Function to consult oracle to update.

### \_authorizeUpgrade

```solidity
function _authorizeUpgrade(address newImplementation) internal
```

Function to upgrade contract override to protect.
@param newImplementation new implementation address.

## IFeeContract

This contract consists of imports
to ensure that the functions and variables can be read accross contracts to get correct fees.
@dev The primary function of this contract is to ensure that the fee amount can be read in each contract.

### queryOracle

```solidity
function queryOracle() external view returns (uint256)
```

## FeeQuery

### epochLength

```solidity
uint256 epochLength
```

### requiredReset

```solidity
uint256 requiredReset
```

### fee

```solidity
uint256 fee
```

### getFee

```solidity
function getFee() public view returns (uint256)
```

This is the function the modifier consults to view the fee from the fee contract.
@dev The required reset means the fee updates every 24 hours.

## H1DevelopedApplication

This contract has a modifer that ensures fees
are sent to the developer of an application and the FeeContract.

_The primary function of this contract is to be used as an import for developers building on Haven._

### FeeContract

```solidity
address FeeContract
```

### developerWallet

```solidity
address developerWallet
```

### devApplicationFee

```solidity
modifier devApplicationFee()
```

### constructor

```solidity
constructor(address _FeeContract, address walletToCollectFees) public
```

Constructor to initialize contract deployment.

_For the param walletToCollectFees the deployer
of this wallet should consider a setter for this address in their dApp._

#### Parameters

| Name                | Type    | Description                              |
| ------------------- | ------- | ---------------------------------------- |
| \_FeeContract       | address | address of fee contract to pay fees.     |
| walletToCollectFees | address | the address to receive 10% of the fees.. |

### getDeveloperFee

```solidity
function getDeveloperFee() public view returns (uint256 developerFee)
```

This is the view function to get the fee amount owed to the developer.
@dev It is 90% of the contract balance.

### getHavenFee

```solidity
function getHavenFee() public view returns (uint256 havenOneFee)
```

This is the view function to get the fee amount owed to the FeeContract.
@dev It is 10% of the contract balance.

### callFee

```solidity
function callFee() public view returns (uint256)
```

## H1NativeApplication

This contract has a modifer that ensures fees are sent the FeeContract.

_The primary function of this contract is to be used as an import for native building on Haven._

### FeeContract

```solidity
address FeeContract
```

### FeeQueryNative

```solidity
contract FeeQuery FeeQueryNative
```

### applicationFee

```solidity
modifier applicationFee()
```

### constructor

```solidity
constructor(address _FeeContract) public
```

Constructor to initialize contract deployment.

_For the param walletToCollectFees the deployer
of this wallet should consider a setter for this address in their dApp._

#### Parameters

| Name          | Type    | Description                          |
| ------------- | ------- | ------------------------------------ |
| \_FeeContract | address | address of fee contract to pay fees. |

### callFee

```solidity
function callFee() public view returns (uint256)
```

This is the view function to get the fee amount from the feeContract.
@dev It returns a uint256 that is used in the applicationFee modifier.

## SimpleStorageWithDevAppFee

### storedData

```solidity
uint256 storedData
```

### h1Stored

```solidity
uint256 h1Stored
```

### constructor

```solidity
constructor(address _feeContract, address devWallet) public
```

### set

```solidity
function set(uint256 x) public payable
```

### get

```solidity
function get() public view returns (uint256 retVal)
```

## SimpleStorageWithFee

### storedData

```solidity
uint256 storedData
```

### h1Stored

```solidity
uint256 h1Stored
```

### constructor

```solidity
constructor(address _feeContract) public
```

### set

```solidity
function set(uint256 x) public payable
```

### get

```solidity
function get() public view returns (uint256 retVal)
```

## ValidatorRewards

This contract ensures fees are sent the validator addresses.

_The primary function of this contract is disperse funds from Haven applications._

### ValidatorAdded

```solidity
event ValidatorAdded(address account, uint256 shares)
```

_Event for when a new Validator is added. Includes their address and total shares._

### SharesAdjusted

```solidity
event SharesAdjusted(address validator, uint256 shares)
```

_Event for when shares are adjusted._

### UpdatedValidator

```solidity
event UpdatedValidator(address previousValidatorRewardAddress, address newValidatorRewardAddress)
```

_Event for when the validator address is changed. Used in `adjustValidatorAddress`._

### PaymentReleased

```solidity
event PaymentReleased(address to, uint256 amount)
```

_Event for when a validator receives a payment._

### DISTRIBUTOR_ROLE

```solidity
bytes32 DISTRIBUTOR_ROLE
```

### UPGRADER_ROLE

```solidity
bytes32 UPGRADER_ROLE
```

### initialize

```solidity
function initialize(address[] validatorsList, uint256[] shares_, address admin, address distributor, address upgrader) external
```

contract deploys with a list of validator addresses and their total shares.
@param validatorsList an array of validators to accept fees.
@param shares\_ an array
@param admin the address that can grant and remove permissions.
@param distributor the address that calls restricted functions in the contract.
@dev the shares for each address are the amount over the total amount for all addresses.

### receive

```solidity
receive() external payable
```

Function to receive tokens.

### adjustValidatorShares

```solidity
function adjustValidatorShares(address account, uint256 shares_) external
```

This function adjusts the total number of shares received by an address.
@param account the address that the share number should be adjusted for.
@param shares\_ the new share number for the account.

### adjustValidatorAddress

```solidity
function adjustValidatorAddress(uint256 _index, address _newValidatorRewardAddress) external
```

Trades out one validator for another.
@param \_index the index in the validator address in the array.
@param \_newValidatorRewardAddress The number of shares owned by the payee.

### addValidator

```solidity
function addValidator(address account, uint256 shares_) external
```

Add a new validator to the contract.
@param account The address of the payee to add.
@param shares\_ The number of shares owned by the payee.

### totalShares

```solidity
function totalShares() public view returns (uint256)
```

Getter for the total shares held by validators.

### totalReleased

```solidity
function totalReleased() public view returns (uint256)
```

Getter for the total amount of Wrapped H1 already released.

### shares

```solidity
function shares(address account) public view returns (uint256)
```

Getter for the amount of shares held by an account.
@param account the account to check the share amount.

### released

```solidity
function released(address account) public view returns (uint256)
```

Getter for the amount of Wrapped H1 already released to a payee.
@param account is the account to check the share amount.

### validators

```solidity
function validators(uint256 index) public view returns (address)
```

Getter for the address of the validator number position of the array of validators.
@param index the index in the array.

### releasable

```solidity
function releasable(address account) public view returns (uint256)
```

Getter for the amount of validator's Wrapped H1 in contract.
@param account the account to check the amount of total received and released amount.

### release

```solidity
function release(address payable account) public
```

Triggers a transfer to `account` of the amount of Wrapped H1 they are owed,
according to their percentage of the total shares and their previous withdrawals.

#### Parameters

| Name    | Type            | Description                                                            |
| ------- | --------------- | ---------------------------------------------------------------------- |
| account | address payable | the account to check the amount of total received and released amount. |

### releaseAll

```solidity
function releaseAll() external
```

_Triggers a transfer to all validators of the amount of
Wrapped H1 they are owed, according to their percentage of the total shares and their previous withdrawals._

### isOriginalAddress

```solidity
function isOriginalAddress(address validator) public view returns (bool)
```

This view function checks if the address is in the validatorList array.
@param validator the address for in the validatorsList.
@dev It is used in functions above to ensure no duplicate addresses are added to the validatorList.

### \_authorizeUpgrade

```solidity
function _authorizeUpgrade(address newImplementation) internal
```

Function to upgrade contract override to protect.
@param newImplementation new implementation address.
