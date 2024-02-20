# Solidity API

## BackedHRC20

This contract serves a vital purpose in facilitating token 
transactions on Haven1 for users who prioritize the security of their cold storage vaults.

_The core functionality of this contract revolves around minting and burning tokens, 
ensuring a seamless experience for users as they deposit and redeem assets on the Haven1 platform._

### OPERATOR_ROLE

```solidity
bytes32 OPERATOR_ROLE
```

### TokensBurnedFromAccount

```solidity
event TokensBurnedFromAccount(address account, uint256 amount, string reason)
```

_The event is triggered during the `burnFrom` function.
It includes the account, the amount of tokens, and the reason._

### TokensRedeemed

```solidity
event TokensRedeemed(address account, uint256 amount)
```

_The event is triggered during the `redeemBackedToken` function.
It includes the account and the amount of tokens._

### TokensIssued

```solidity
event TokensIssued(address account, uint256 amount)
```

_The event is triggered during the `issueBackedToken` function.
It includes the account and the amount of tokens._

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize(string name, string symbol, address havenFoundation, address networkOperator) external
```

`initialize` function gives values to variables when the contract deploys.

_The `OPERATOR_ROLE can be given after deployment by calling `grantRole(role, address)`
    Ex: `grantRole(OPERATOR_ROLE, 0x1d2B794563Bf90c6e53B56b215502b8aE4c42fF8)`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | the name of the token this contract distributes. |
| symbol | string | the symbol of the token this contract distributes. |
| havenFoundation | address | can remove/add operator roles. |
| networkOperator | address | can pause/unpause the contract set to true to allow an address to be whitelisted  or false to remove privileges. |

### pause

```solidity
function pause() external
```

`pause` is a function to pause sending/depositing/withdrawing of tokens from contract.
The `whenNotPaused` modifier will read the contract's state and not allow functions accordingly.

_Only operator role can do this given in constructor or by calling grantRole(OPERATOR_ROLE, <ADDRESS>)._

### unpause

```solidity
function unpause() external
```

`unpause` allows contract functions with the `whenNotPaused` modifier
to continue to run after the contract was previously paused and allow
sending/depositing/withdrawing tokens from the contract.

### redeemBackedToken

```solidity
function redeemBackedToken(uint256 amount) external
```

`redeemBackedToken` function to redeem backed tokens for Haven1.
It is managed by the network operator

_Function does not work when paused.
If  the amount is higher than the balance of the address an error reading "BALANCE_TOO_LOW" will be returned.
Only OPERATOR role can do this given in constructor or by calling grantRole(OPERATOR_ROLE, <ADDRESS>)._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | number of tokens to be redeemed. |

### burnFrom

```solidity
function burnFrom(address target, uint256 amount, string reason) external
```

`burnFrom` this function will be used to provide additional onChain security on Haven1.
The Haven1 Foundation will call it in case of theft or lost keys.

_TThe premise for this function to be called will be a support ticket submitted off chain.
The reason will be emitted in the event._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| target | address | the address that tokens will be burned from. |
| amount | uint256 | the amount of tokens that will be burned. |
| reason | string |  |

### issueBackedToken

```solidity
function issueBackedToken(address to, uint256 amount) external
```

`issueBackedToken` this function Function to issue backed tokens for Haven1, managed by the network operator.

_Function does not work when paused.
If an address is blacklisted via `setBlackListAddress` it cannot recieve tokens.
If isWhiteListContract is set to true addresses must be whitelisted via `setWhiteListAddress`.
Only THE OPERATOR role can do this an address can obtain that role in the initialize
function or by calling grantRole(OPERATOR_ROLE, <ADDRESS>)._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | address to receive the tokens. |
| amount | uint256 | number of tokens to be received. |

### isContract

```solidity
function isContract(address _addr) public view returns (bool isItAContract)
```

`isContract` this function checks an address to ensure it is a contract not a wallet.
    @param _addr the address to be checked for if it is a contract or not.
    @dev It returns true if the input is a contract.
    @dev Used to override approvals and increase allowance.

### _approve

```solidity
function _approve(address owner, address spender, uint256 amount) internal virtual
```

`_approve` overrides ERC-20's function to approve addresses.
This function does not allow wallets to be approved only contracts.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address |  |
| spender | address | is the address being approved to move other wallets tokens. |
| amount | uint256 | the number of tokens they send on behalf of the owner. |

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address newImplementation) internal
```

`_authorizeUpgrade` function to upgrade contract override to protect.
    @param newImplementation new implementation address.

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal
```

`_beforeTokenTransfer` is called when using ERC-20 standard transferring functions.
    @param from address to remove tokens from.
    @param to receiver of tokens.
    @param amount number of tokens to be sent.
    @dev Function does not work when paused.

## Errors

### INSUFFICIENT_TOKEN_BALANCE

```solidity
string INSUFFICIENT_TOKEN_BALANCE
```

### ONLY_APPROVES_CONTRACTS

```solidity
string ONLY_APPROVES_CONTRACTS
```

