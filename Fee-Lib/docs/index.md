# Solidity API

## Errors

### ZERO_ADDRESS_NOT_VALID_ARGUMENT

```solidity
string ZERO_ADDRESS_NOT_VALID_ARGUMENT
```

### INCORRECT_INDEX

```solidity
string INCORRECT_INDEX
```

### TRANSFER_FAILED

```solidity
string TRANSFER_FAILED
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

### INVALID_FEE

```solidity
string INVALID_FEE
```

## IFeeContract

### queryOracle

```solidity
function queryOracle() external view returns (uint256)
```

### nextResetTime

```solidity
function nextResetTime() external view returns (uint256)
```

### updateFee

```solidity
function updateFee() external
```

## H1NativeApplication

### constructor

```solidity
constructor(address _FeeContract) public
```

Constructor to initialize contract deployment.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _FeeContract | address | address of FeeContract to pay fees to and to obtain network information from. |

### applicationFee

```solidity
modifier applicationFee()
```

### applicationFeeWithPaymentToContract

```solidity
modifier applicationFeeWithPaymentToContract(uint256 H1PaymentToFunction)
```

### _updatesOracleValues

```solidity
function _updatesOracleValues() internal
```

`_updatesOracleValues` this function updates the state variables of this contract
and in the FeeContract if applicable. The information about the fee and _requiredFeeResetTime 
come from the FeeContract.

_The priorFee is the fee before the oracle updates the _fee variable in this contract. 
The  _requiredFeeResetTime is set equal to the FeeContracts next reset time. A day
is added between intervals.
The reset block is set in this function to ensure that the transactions set in the same block are 
equal to the priorFee to ensure transactions pass in the event the fee is larger after updating._

### _payApplicationWithPriorFee

```solidity
function _payApplicationWithPriorFee() internal
```

`_payApplicationWithPriorFee` this function uses priorFee which is 
the fee before the oracle updates the _fee variable in the contract.

_If there is an excess amount of H1, it is returned to the sender.
It throws Errors.INSUFFICIENT_FUNDS if the 
received value is less than the prior fee._

### _payApplicationWithFee

```solidity
function _payApplicationWithFee() internal
```

`_payApplicationWithFee` this function uses the _fee variable in the contract to determine 
the payment amounts. The _fee is the current fee value from the oracle updated less than 24 hours ago.

_If there is an excess amount of H1 sent, it is returned to the sender.
It throws Errors.INSUFFICIENT_FUNDS if the received value is less than the prior 
fee and priorFee is greater than 0._

### _payApplicationWithPriorFeeAndContract

```solidity
function _payApplicationWithPriorFeeAndContract(uint256 H1PaymentToFunction) internal
```

`_payApplicationWithPriorFeeAndContract` this function uses priorFee the fee before the oracle 
updates the _fee variable in the contract.

_If there is an excess amount of H1 sent, it is returned to the sender.
It throws Errors.INSUFFICIENT_FUNDS if the received value is less than the priorFee._

### _payApplicationWithFeeAndContract

```solidity
function _payApplicationWithFeeAndContract(uint256 H1PaymentToFunction) internal
```

`_payApplicationWithFeeAndContract` this function uses the _fee variable in the contract to determine 
the payment amounts.

_If there is an excess amount of H1 sent, it is returned to the sender.
It throws Errors.INSUFFICIENT_FUNDS if the received value is less than the prior 
fee and priorFee is greater than 0._

### callFee

```solidity
function callFee() public view returns (uint256)
```

`callFee` this view function is to get the fee amount from the feeContract.
    @dev It returns a uint256 that is used in the applicationFee modifier.

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
function set(uint256 x) external payable
```

### setAndPayForIt

```solidity
function setAndPayForIt(uint256 x) external payable
```

### get

```solidity
function get() public view returns (uint256 retVal)
```

## IFeeOracle

### consult

```solidity
function consult() external view returns (uint256 amountOut)
```

### refreshOracle

```solidity
function refreshOracle() external returns (bool success)
```

## FeeQuery

### FeeReset

```solidity
event FeeReset(uint256 currentTimestamp, uint256 newReset)
```

### oracle

```solidity
address oracle
```

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

### minFee

```solidity
uint256 minFee
```

### resetFee

```solidity
function resetFee() public returns (uint256)
```

### getMinFee

```solidity
function getMinFee() external view returns (uint256)
```

### getFee

```solidity
function getFee() public returns (uint256)
```

### queryOracle

```solidity
function queryOracle() public view returns (uint256 feeAmount)
```

## HasNoRecieveFunctionForFailedTxns

### FeesDistributed

```solidity
event FeesDistributed(uint256 timestamp, address to, uint256 amount)
```

### channels

```solidity
address[] channels
```

### weights

```solidity
uint8[] weights
```

### getMinimumAllottedFee

```solidity
function getMinimumAllottedFee() public view returns (uint256)
```

### constructor

```solidity
constructor(address _oracle, address[] _channels, uint8[] _weights, address havenFoundation, address networkOperator) public
```

### setAgainFee

```solidity
function setAgainFee() external
```

### plusChannel

```solidity
function plusChannel(address _newChannelAddress, uint8 _weight) external
```

### moveChannel

```solidity
function moveChannel(uint8 _index, address _newChannelAddress, uint8 _newWeight) external
```

### newEpoch

```solidity
function newEpoch(uint256 new_epochLength) external
```

### grabFee

```solidity
function grabFee() external
```

### pressureFee

```solidity
function pressureFee() external payable
```

### newOracle

```solidity
function newOracle(address _newOracle) external
```

### isOriginalAddress

```solidity
function isOriginalAddress(address channel) public view returns (bool)
```

### getNextResetTime

```solidity
function getNextResetTime() public view returns (uint256)
```

### getChannels

```solidity
function getChannels() public view returns (address[])
```

### getWieghts

```solidity
function getWieghts() public view returns (uint8[])
```

### getOracleAddress

```solidity
function getOracleAddress() public view returns (address)
```

### amountPaidToUponNextDistribution

```solidity
function amountPaidToUponNextDistribution(uint8 index) public view returns (uint256)
```

### getChannelWeightByIndex

```solidity
function getChannelWeightByIndex(uint8 index) public view returns (address, uint256)
```

### getTotalContractShares

```solidity
function getTotalContractShares() public view returns (uint8)
```

### getLastDistributionBlock

```solidity
function getLastDistributionBlock() public view returns (uint256)
```

### updateFee

```solidity
function updateFee() external returns (uint256)
```

### networkFeeResetTimestamp

```solidity
uint256 networkFeeResetTimestamp
```

### nextResetTime

```solidity
function nextResetTime() public view returns (uint256)
```

### _refreshOracle

```solidity
function _refreshOracle() internal returns (bool success)
```

## IFeeOracle

This contract collects and distributes application 
fees from user application transactions.

_The primary function of this contract is to ensure 
proper distribution from Haven1 applications to distribution channels._

### consult

```solidity
function consult() external view returns (uint256 amountOut)
```

### refreshOracle

```solidity
function refreshOracle() external returns (bool success)
```

## FeeContract

### FeesReceived

```solidity
event FeesReceived(uint256 timestamp, address from, uint256 amount)
```

_The event is triggered during the `receive` function.
It emits the time, the address sending the funds, and amount paid._

### FeesDistributed

```solidity
event FeesDistributed(uint256 timestamp, address to, uint256 amount)
```

_The event is triggered during the `distributeFeesToChannels` function.
It emits the time, the address receiving it, and the fee amount owed._

### ChannelAdded

```solidity
event ChannelAdded(address newChannelAddress, uint256 channelWeight, uint256 contractShares)
```

_The event is triggered during the `addChannel` function.
It emits the address, shares, and total shares of the contract._

### ChannelAdjusted

```solidity
event ChannelAdjusted(address adjustedChannel, uint256 newChannelWeight, uint256 currentContractShares)
```

_The event is triggered during the `adjustChannel` function.
It emits address of the adjusted channel it's old and current share amount and
the new total shares amount of the contract._

### ChannelRemoved

```solidity
event ChannelRemoved(address channelRemoved, uint256 newTotalSharesAmount)
```

_The event is triggered during the `removeChannel` function.
It sends the address that is no longer a channel
and the new total shares amount of the contract._

### FeeReset

```solidity
event FeeReset(uint256 newFee)
```

_The event is triggered during the `resetFee` function.
It emits the time of the new reset and current call._

### epochLength

```solidity
uint256 epochLength
```

### channels

```solidity
address[] channels
```

### weights

```solidity
uint8[] weights
```

### OPERATOR_ROLE

```solidity
bytes32 OPERATOR_ROLE
```

### initialize

```solidity
function initialize(address _oracle, address[] _channels, uint8[] _weights, address havenFoundation, address networkOperator, uint256 minimumFeeAllowedForBuilders) external
```

`initialize` is initiating variables during deployment.
    @param _oracle is the address for the oracle that is consulted to determine fees.
    @param _channels array channels are the channels that receive payments.
    @param _weights are the amount of shares each channel receives.
    @param havenFoundation the address that can add or revoke address privileges.
    @param networkOperator operator address that manages functions.
    @dev lastDistribution is the timestamp that fees were last distributed 
It occurs every 24 hours.
    @dev There cannot be more than ten channels.

### receive

```solidity
receive() external payable
```

`receive` gives the contract the ability to receive H1 from external addresses msg.data must be empty.

### addChannel

```solidity
function addChannel(address _newChannelAddress, uint8 _weight) external
```

`addChannel` includes the logic to add a new channel with weight.

_We allow 10 contracts per FeeContract to ensure distribution can
be managed. The check ensures that there are no duplicate addresses or zero addresses.
The total weight is tracked by `CONTRACT_SHARES` which we use to
divide each address's shares to then send the correct amounts to each channel._

### adjustChannel

```solidity
function adjustChannel(address _oldChannelAddress, address _newChannelAddress, uint8 _newWeight) external
```

`adjustChannel` includes the logic to adjust a channel and its weight.

_The sum of all the channel's weights is tracked by `CONTRACT_SHARES`
which we adjust here by subtracting the old weight number and adding the new one._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _oldChannelAddress | address | the address of the current channel in the channels and weights array. |
| _newChannelAddress | address | the address of the channel replacing the old one. |
| _newWeight | uint8 | the amount of total shares the new address will receive. |

### removeChannel

```solidity
function removeChannel(address _channel) external
```

`removeChannel` is the logic to remove a channel and its weight.

_The total weight is tracked by `CONTRACT_SHARES`.
which we subtract the value from in the middle of this function._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _channel | address | the address being removed. |

### setEpoch

```solidity
function setEpoch(uint256 newEpochLength) external
```

`setEpoch` is to adjust the length of time between payouts from the contract.
    @param newEpochLength the length of the new time between payouts from the contract.

### distributeFeesToChannels

```solidity
function distributeFeesToChannels() external payable
```

`distributeFeesToChannels` is to disburse payment by distributing contract held funds to channels.
    @dev This function can be called every 24 hours.
    @dev The balance of the contract is distributed to channels and an event is triggered `FeesDistributed` 
    then the `FeeReset` event is emitted declaring the new fee amount.

### forceFeeDistribution

```solidity
function forceFeeDistribution() external payable
```

`forceFeeDistribution` function triggered to force distribution of funds to channels.

_It can only be called by an operator. In case the funds need to be distributed immediately._

### setMinFee

```solidity
function setMinFee(uint256 minimumAmount) external
```

`setMinFee` is a setter function to set the minimum fee for developer applications.
    @param minimumAmount is the lowest amount a developer can charge to run functions in their applications.

### setOracle

```solidity
function setOracle(address newOracle) external
```

`setOracle` this setter function to adjust oracle address.
    @param newOracle the new oracle address.

### updateFee

```solidity
function updateFee() external
```

`updateFee` updates the networkFeeResetTimestamp and the fee.

_It can be called anyone that wants to call it.
H1Developed or Native applications will call it every 24 hours._

### nextResetTime

```solidity
function nextResetTime() public view returns (uint256)
```

`nextResetTime` function returns the networkFeeResetTimestamp.

### getFee

```solidity
function getFee() public view returns (uint256)
```

`getFee` function returns the fee value updated by
oracle at least every 24 hours.

### _findIndexPosition

```solidity
function _findIndexPosition(address channel) public view returns (uint256)
```

`_findIndexPosition` this view function checks the address to obtain the index in the array.
    @dev It is used to change the arrays of weights and channels.

### isTheAddressInTheChannelsArray

```solidity
function isTheAddressInTheChannelsArray(address channel) public view returns (bool)
```

`isTheAddressInTheChannelsArray` this view function checks if the address is in the channels array.
    @dev It is used in functions above to ensure no duplicate addresses are added to the channels.

### getChannels

```solidity
function getChannels() public view returns (address[])
```

`getChannels` this function to allow the ability to view all channels.

### getWeights

```solidity
function getWeights() public view returns (uint8[])
```

`getWeights` this function that allows the ability to view all weights.

### getOracleAddress

```solidity
function getOracleAddress() public view returns (address)
```

`getOracleAddress` this function that allows the ability to view oracle addresses.

### amountPaidToUponNextDistribution

```solidity
function amountPaidToUponNextDistribution(uint8 index) public view returns (uint256)
```

`amountPaidToUponNextDistribution` this function allows the
ability to view the amount an address is supposed to be paid based on array position.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint8 | the number representing the position in the array of channels/weights representing the index. |

### getChannelWeightByIndex

```solidity
function getChannelWeightByIndex(uint8 index) public view returns (address, uint256)
```

`getChannelWeightByIndex` this function allows ability to view a channel
and its corresponding weight via index.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint8 | the number in the array of channels. |

### getTotalContractShares

```solidity
function getTotalContractShares() public view returns (uint8)
```

`getTotalContractShares` this view function to check the total
number of shares that have been dispersed to addresses.

### getLastDistributionBlock

```solidity
function getLastDistributionBlock() public view returns (uint256)
```

`getLastDistributionBlock` this view function to
check the block in which the last distribution occurred

### getMinimumAllottedFee

```solidity
function getMinimumAllottedFee() public view returns (uint256)
```

`getMinimumAllottedFee` function to retrieve the minimum dev fee allowed for developers.

### queryOracle

```solidity
function queryOracle() public view returns (uint256 feeAmount)
```

`queryOracle` this function is to consult oracle to get a fee amount.

### _refreshOracle

```solidity
function _refreshOracle() public returns (bool success)
```

`_refreshOracle` this function to consult oracle to update.

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address newImplementation) internal
```

`_authorizeUpgrade` this function is to upgrade the contract. 
It is overridden to protect the contract from someone who is not authorized
initiating an upgrade.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newImplementation | address | new implementation address. |

## IFeeContract

This contract has a modifier that ensures fees
are sent to the developer of an application and the FeeContract.

_The primary function of this contract is to be used as an import for developers building on Haven._

### getMinimumAllottedFee

```solidity
function getMinimumAllottedFee() external view returns (uint256)
```

### getFee

```solidity
function getFee() external view returns (uint256)
```

### nextResetTime

```solidity
function nextResetTime() external view returns (uint256)
```

### updateFee

```solidity
function updateFee() external
```

## H1DevelopedApplication

### constructor

```solidity
constructor(address _FeeContract, address walletToCollectFees, uint256 applicationFee) public
```

Constructor to initialize contract deployment.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _FeeContract | address | address of fee contract to pay fees. |
| walletToCollectFees | address | the address to receive 10% of the fees. |
| applicationFee | uint256 |  |

### devApplicationFee

```solidity
modifier devApplicationFee()
```

### devApplicationFeeWithPaymentToContract

```solidity
modifier devApplicationFeeWithPaymentToContract(uint256 H1PaymentToFunction)
```

### setDevApplicationFee

```solidity
function setDevApplicationFee(uint256 newDevFee) external
```

`setDevApplicationFee` sets the fee amount charged to utilize the application.
    @dev It is split 10% feeContract and 90% to the development team.

### getDevFee

```solidity
function getDevFee() public view returns (uint256 developerFeeFromApplication)
```

`getDevFee` returns the devFee for the application.

### getRequiredFeeResetTime

```solidity
function getRequiredFeeResetTime() public view returns (uint256 developerFeeFromApplication)
```

`getRequiredFeeResetTime` returns the devFee for the application.

### callFee

```solidity
function callFee() public view returns (uint256 feeFromFeeContract)
```

`callFee` gets the value for H1 in USD from the Fee contract.

### _updatesOracleValues

```solidity
function _updatesOracleValues() internal
```

`_updatesOracleValues` this function retrieves the updated reset time from the FeeContract and checks
if it matches the required fee reset time.

_If the reset times match, the function calls the `FeeContract` to update the fee.
The priorFee is set to the current devFee value.
The feeInUSD is fetched from the FeeContract, and the devFee is recalculated as feeInUSD multiplied by the baseFee.
The _requiredFeeResetTime is updated to the retrieved updated reset time.
The resetBlock is set to the current block number._

### _completeFunctionWithPriorFee

```solidity
function _completeFunctionWithPriorFee() internal
```

`_completeFunctionWithPriorFee` this function uses priorFee the fee before the oracle 
updates the _fee variable in the contract. 
the prior fee to the FeeContract.

_If there is an excess amount, it is returned to the sender.
It throws Errors.INSUFFICIENT_FUNDS if the received value is less than the prior 
fee and priorFee is greater than 0._

### _completeFunction

```solidity
function _completeFunction() internal
```

`_completeFunction` this function uses the _fee variable in the contract to determine 
the payment amounts.

_If there is an excess amount, it is returned to the sender.
It throws Errors.INSUFFICIENT_FUNDS if the received value is less than the prior 
fee and priorFee is greater than 0._

### _completePaidFunctionWithPriorFee

```solidity
function _completePaidFunctionWithPriorFee(uint256 H1PaymentToFunction) internal
```

`_completeFunctionWithPriorFee` this function uses priorFee the fee before the oracle 
updates the _fee variable in the contract. 
the prior fee to the FeeContract.

_If there is an excess amount, it is returned to the sender.
It throws Errors.INSUFFICIENT_FUNDS if the received value is less than the prior 
fee and priorFee is greater than 0._

### _completePaidFunction

```solidity
function _completePaidFunction(uint256 H1PaymentToFunction) internal
```

`_completeFunction` this function uses the _fee variable in the contract to determine 
the payment amounts.

_If there is an excess amount, it is returned to the sender.
It throws Errors.INSUFFICIENT_FUNDS if the received value is less than the prior 
fee and priorFee is greater than 0._

### callMinimumViableFee

```solidity
function callMinimumViableFee() public view returns (uint256)
```

`callMinimumViableFee` gets the minimum fee from the Fee contract.

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
constructor(address _feeContract, address devWallet, uint256 fee) public
```

### set

```solidity
function set(uint256 x) external payable
```

### setAndPayForIt

```solidity
function setAndPayForIt(uint256 x) external payable
```

### get

```solidity
function get() public view returns (uint256 retVal)
```

## ValidatorRewards

This contract ensures fees are sent to the validator addresses.

_The primary function of this contract is to disburse funds from Haven applications._

### ValidatorAdded

```solidity
event ValidatorAdded(address account, uint256 shares)
```

_The event is triggered during the `addValidator` function.
It emits the validator address and their total shares._

### SharesAdjusted

```solidity
event SharesAdjusted(address validator, uint256 shares)
```

_The event is triggered during the `adjustValidatorShares` function.
It emits the validator address and the new number of thier shares._

### ValidatorRemoved

```solidity
event ValidatorRemoved(address account, uint256 shares, uint256 newTotalSharesAmount)
```

_The event is triggered during the `removeValidator` function.
It emits the validator address, how many shares it used to hold, and 
the new total shares for the contract._

### UpdatedValidator

```solidity
event UpdatedValidator(address previousValidatorRewardAddress, address newValidatorRewardAddress)
```

_The event is triggered in the `adjustValidatorAddress` function.
It emits the new old validator address and the address it has been updated to._

### PaymentReleased

```solidity
event PaymentReleased(address to, uint256 amount)
```

_Event for when a validator receives a payment._

### OPERATOR_ROLE

```solidity
bytes32 OPERATOR_ROLE
```

### initialize

```solidity
function initialize(address[] validatorsList, uint256[] shares, address havenFoundation, address networkOperator) external
```

`initialize` occurs when the contract deploys with a list of validator addresses and their total shares.
   @param validatorsList an array of validators to accept fees.
   @param shares is an array of shares that is part of the total amount distributed from the contract.
   @param havenFoundation is the address that can grant and remove permissions aka the DEFAULT_ADMIN_ROLE.
   @param networkOperator the address that calls restricted functions in the contract aka OPERATOR_ROLE.
   @dev The shares for each address are the amount over the total amount for all addresses.

### receive

```solidity
receive() external payable
```

Function to receive tokens.

### adjustValidatorShares

```solidity
function adjustValidatorShares(address account, uint256 shares) external
```

`adjustValidatorShares` adjusts the total number of shares received by an address.
   @param account the address that the share number should be adjusted for.
   @param shares the new share number for the account.

### adjustValidatorAddress

```solidity
function adjustValidatorAddress(uint256 index, address newValidatorRewardAddress) external
```

`adjustValidatorAddress` trades out one validator for another.
   @param index the index in the validator address in the array.
   @param newValidatorRewardAddress The number of shares owned by the payee.

### addValidator

```solidity
function addValidator(address account, uint256 shares) external
```

`addValidator` adds a new validator to the contract.
   @param account The address of the payee to add.
   @param shares The number of shares owned by the payee.

### removeValidator

```solidity
function removeValidator(address account, uint256 index) external
```

`removeValidator` removes existing validator information from the contract.
   @param account The address of the validator to remove.
   @param index is the index that the validator is in the validatorsAddressArray.

### totalShares

```solidity
function totalShares() public view returns (uint256)
```

`totalShares` is the getter for the total shares held by validators.

### totalH1Issued

```solidity
function totalH1Issued() public view returns (uint256)
```

`totalH1Issued` is the getter for the total amount of Wrapped H1 already dispersed.

### shares

```solidity
function shares(address account) public view returns (uint256)
```

`shares` is the getter for the amount of shares held by an account.
   @param account the account to check the share amount.

### dispersed

```solidity
function dispersed(address account) public view returns (uint256)
```

`dispersed` is the getter for the amount of wrapped H1 already dispersed to a payee.
   @param account is the account to check the share amount.

### validators

```solidity
function validators(uint256 index) public view returns (address)
```

`validators` is the getter for the address of the validator number position of the array of validators.
   @param index the index in the array.

### releasable

```solidity
function releasable(address account) public view returns (uint256)
```

`releasable` is the getter for the amount of validator's wrapped H1 in contract.
   @param account the account to check the amount of total received and dispersed amount.

### disperseSinglePaymentToValidator

```solidity
function disperseSinglePaymentToValidator(address payable account) public
```

`disperseSinglePaymentToValidator` triggers a transfer to a single `account` of the amount of wrapped H1 they are owed,
according to their percentage of the total shares and their previous withdrawals.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address payable | the account to check the amount of total received and dispersed amount. |

### disperseAllPaymentsToValidators

```solidity
function disperseAllPaymentsToValidators() external
```

`disperseAllPaymentsToValidators` triggers a transfer to all validators of the amount of
Wrapped H1 they are owed, according to their percentage of the total shares and their previous withdrawals.

### isTheAddressInTheValidatorsArray

```solidity
function isTheAddressInTheValidatorsArray(address validator) public view returns (bool)
```

`isTheAddressInTheValidatorsArray` this view function checks if the address is in the validatorList array.
   @param validator the address for in the validatorsList.
   @dev It is used in functions above to ensure no duplicate addresses are added to the validatorList.

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address newImplementation) internal
```

`_authorizeUpgrade` function to upgrade contract override to protect.
   @param newImplementation new implementation address.

## FeeOracle

### priceAverage

```solidity
uint256 priceAverage
```

### justKeepAdding

```solidity
uint256 justKeepAdding
```

### requiredReset

```solidity
uint256 requiredReset
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

