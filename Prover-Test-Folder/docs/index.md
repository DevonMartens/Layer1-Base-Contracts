# Solidity API

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

## IPermissionsInterface

### assignAccountRole

```solidity
function assignAccountRole(address _account, string _orgId, string _roleId) external
```

### updateAccountStatus

```solidity
function updateAccountStatus(string _orgId, address _account, uint256 _action) external
```

## IRoleVerification

This contract outlines the base layer of Haven1s provable identity framework.

_The function of this contract is to establish and return a users account level "identity blob"._

### IdentityBlob

```solidity
struct IdentityBlob {
  uint256 tokenId;
  string countryCode;
  uint8 userType;
  uint8 level;
  uint256 expiry;
  uint8 competencyRating;
}
```

### getUserAccountExpiry

```solidity
function getUserAccountExpiry(address account) external view returns (uint256 userAccountExpiry)
```

`getUserAccountExpiry` function returns the expiry date from the users account.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | address of the target user account. |

### getUserAccountIdentityBlob

```solidity
function getUserAccountIdentityBlob(address account) external view returns (struct IRoleVerification.IdentityBlob userIdentityBlob)
```

`getUserAccountIdentityBlob` function returns struct IdentityBlob from the users account.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | address of the target user account. |

## IUserInformation

_Interface for accessing user information from Haven1's Proof of Identity framework._

### getUserAccountCountryCode

```solidity
function getUserAccountCountryCode(address account) external view returns (string userAccountCountryCode)
```

### getUserAccountLevel

```solidity
function getUserAccountLevel(address account) external view returns (uint8 userAccountLevel)
```

`getUserAccountLevel` retrieves the verification level of a user's account.
    @param account The address of the user account.

### getUserAccountType

```solidity
function getUserAccountType(address account) external view returns (uint8 userAccountType)
```

`getUserAccountType` retrieves the account type of a user's account.
    @param account The address of the user account.

### getUserAccountCompetencyRating

```solidity
function getUserAccountCompetencyRating(address account) external view returns (uint8)
```

`getUserAccountCompetencyRating` gets the competency rating a user
earned testing.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the target user account. |

## IUserInformationPreventsOnExpiry

Interface for accessing user information and enforcing 
in-date identity documents for access to functions.

_All functions revert when the target account's identity has expired._

### getUserAccountCountryCodePreventOnExpiry

```solidity
function getUserAccountCountryCodePreventOnExpiry(address account) external view returns (string)
```

### getUserAccountLevelPreventOnExpiry

```solidity
function getUserAccountLevelPreventOnExpiry(address account) external view returns (uint8)
```

`getUserAccountLevelPreventOnExpiry` retrieves the verification level from the user's account.
    @param account Address of the target user account.

### getUserAccountTypePreventOnExpiry

```solidity
function getUserAccountTypePreventOnExpiry(address account) external view returns (uint8)
```

`getUserAccountTypePreventOnExpiry` retrieves the account type from the user's account.
    @param account Address of the target user account.

### getUserAccountCompetencyRatingPreventOnExpiry

```solidity
function getUserAccountCompetencyRatingPreventOnExpiry(address account) external view returns (uint8)
```

`getUserCompetencyRatingPreventOnExpiry` gets the competency rating a user
earned testing but access to it is prevented if the identity has expired.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the target user account. |

## ProofOfIdentity

This contract is responsible for the registering and updating of 
users on Haven1, storing de-identified data for utilisation across the network

_Nominated operator role(s) are responsible for authorising and minting 
identity NFTs and storing information with registration calldata
the contract interacts with the Quorum framework via the network level 
permissions interface to approve accounts to transact. On the network
the contract imports the OpenZeppelin ERC721 standard, overriding transfer 
functions to prevent the Identity NFTs being transferred between accounts._

### AccountSuspendedTokenMaintained

```solidity
event AccountSuspendedTokenMaintained(address account, string reason)
```

_The event is triggered during the `suspendAccountMaintainTokenAndIdentityBlob` function. 
It includes the tokenId and the reason. 
This will include temporary susepensions._

### IdentityIssued

```solidity
event IdentityIssued(address account, uint256 tokenId)
```

_The event is triggered when `isseIdentity` is called. 
It emits the account that was issued an identity and the tokenId._

### IdentityUpdated

```solidity
event IdentityUpdated(address account, uint256 tokenId)
```

_The event is triggered during the `updateIdentity` when an identity is updated 
it includes the address the token is minted to and the tokenId._

### TokenURIUpdated

```solidity
event TokenURIUpdated(address account, uint256 tokenId, string newURI)
```

_The event is triggered when `updateTokenURI` is called. 
It emits the account the token is minted to, the tokenId and the new URI._

### OPERATOR_ROLE

```solidity
bytes32 OPERATOR_ROLE
```

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize(address permissionsInterface, address networkAdmin, address networkOperator) external
```

`initalize` function is ran at the time of deployment to support the upgradable proxy, 
it defines the permissions interface and the default admin role for access control or "network operator".

_The function includes name and symbol to satisfy ERC721 contract requirements._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| permissionsInterface | address | address of the Quorum permissions interface contract. |
| networkAdmin | address | address of the Network Operator Multisig, to be declared as default admin for access control. |
| networkOperator | address | address that controls operations in the contract. |

### issueIdentity

```solidity
function issueIdentity(address account, string countryCode, uint8 userType, uint8 level, uint256 expiry, string tokenUri) external returns (uint256)
```

`issueIdentity` function is only callable by operator role, once an identity has been minted it is not transferable.

_once identity is minted, the contract will call the permissions interface contract, 
adding role access via the `assignAccountRole` function._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | address of the target user. |
| countryCode | string | is the users region identifier as defined by ISO3 standards -  Visit https://docs.haven1.org/ for a comprehensive list of ISO3 country codes. |
| userType | uint8 | is passed to assigned an account type - retail (0) or instituton (1),  by not using an enum we allow for additional classes in the future. |
| level | uint8 | is passed to assign a KYC level to the user account, by combining the region code and KYC  level we allow for specific regional restrictions to be implemented by developers. |
| expiry | uint256 | is passed to assign an expiry time for the documents provided by the operator role,  ensuring user documentation is in date if an application chooses to implement. |
| tokenUri | string | is passed to provide a custom URI to the tokenId for future utilisation and expansion  of proof of identity framework. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | tokenId the id of the token minted to the account. |

### updateIdentity

```solidity
function updateIdentity(address account, string countryCode, uint8 userType, uint8 level, uint256 expiry, uint8 competencyRating, string tokenUri) external
```

`updateIdentity` function is only callable by operator role, 
its purpose is to update an identity for changing user details over time.

_the function requires an ID to have been issued to the account, 
if the account does not have an ID it will revert._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | address of the target user. |
| countryCode | string | is the users region identifier as defined by ISO3 standards -  Visit https://docs.haven1.org/ for a comprehensive list of ISO3 country codes. |
| userType | uint8 | is passed to assigned an account type - retail (0) or instituton (1),  by not using an enum we allow for additional classes in the future. |
| level | uint8 | is passed to assign a KYC level to the user account, by combining the region code and  KYC level we allow for specific regional restrictions to be implemented by developers. |
| expiry | uint256 | is passed to assign an expiry time for the documents provided by the operator role,  ensuring user documentation is in date if an application chooses to implement. |
| competencyRating | uint8 |  |
| tokenUri | string | is passed to provide a custom URI to the tokenId for future utilisation and  expansion of proof of identity framework. |

### establishCompetencyRating

```solidity
function establishCompetencyRating(address account, uint8 score) external
```

`establishCompetencyRating` function allows operators to add or update a competency score for a user's account.

_This function can only be called by an address with the OPERATOR_ROLE._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the target user account. |
| score | uint8 | The competency score to be added or updated. |

### updateTokenURI

```solidity
function updateTokenURI(address account, uint256 tokenId, string tokenUri) external
```

`updateTokenURI` function is only callable by operator role, 
its purpose is to update the tokenUri of an account.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the target account of the tokenUri to update. |
| tokenId | uint256 |  |
| tokenUri | string | the URI data to update for the token Id. |

### suspendAccountMaintainTokenAndIdentityBlob

```solidity
function suspendAccountMaintainTokenAndIdentityBlob(address suspendAddress, string reason) external
```

`suspendAccountMaintainTokenAndIdentityBlob` function is only callable by operator role, 
it suspends the account via the permissions interface and maintains the tokenID 
and identity blog struct for the targets account.

_To unsuspend an account, a user must lodge a request with the operator, 
the ability to unsuspend accounts is not provided in this contract and requires intervention to resolve._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| suspendAddress | address | the address to suspend via the permissions interface,  tokenID is assigned by the _tokenOfHolder mapping. |
| reason | string | the reason the address is being suspended. |

### totalSupply

```solidity
function totalSupply() public view returns (uint256)
```

`totalSupply` function allows a call to view the count of 
issued tokens to monitor overall distribution.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | totalSupply provides total supply of tokenIds issued |

### tokenURI

```solidity
function tokenURI(uint256 tokenId) public view virtual returns (string tokenUri)
```

`tokenURI` function allows tokenURI to be viewed.

_Overrides OpenZeppelins implementation with custom return logic._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | is passed to retrieve the mapped URI. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenUri | string | provides URI for specified tokenId passed. |

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal virtual
```

_Overrides OpenZeppelin `_beforeTokenTransfer` implementation to prevent transferring of a token._

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address newImplementation) internal
```

_Overrides OpenZeppelin `_authorizeUpgrade` in order to ensure only the 
operator role can upgrade the contracts._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view returns (bool)
```

_Overrides OpenZeppelin `supportsInterface` implementation to 
ensure the same interfaces can support access control and ERC721._

## RoleVerification

This contract outlines the base layer of Haven1s provable identity framework.

_The function of this contract is to establish and return a user's account level "identity blob" 
for use within the identity framework._

### identityBlob

```solidity
mapping(address => struct RoleVerification.IdentityBlob) identityBlob
```

### IdentityBlob

```solidity
struct IdentityBlob {
  uint256 tokenId;
  string countryCode;
  uint8 userType;
  uint8 level;
  uint256 expiry;
  uint8 competencyRating;
}
```

### getUserAccountExpiry

```solidity
function getUserAccountExpiry(address account) public view returns (uint256 userAccountExpiry)
```

`getUserAccountExpiry` function returns only the expiry date from the user's account.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | address of the target user account. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAccountExpiry | uint256 | provides the account expiry for the account passed. |

### getUserAccountIdentityBlob

```solidity
function getUserAccountIdentityBlob(address account) public view returns (struct RoleVerification.IdentityBlob userIdentityBlob)
```

`getUserAccountIdentityBlob` function returns the struct IdentityBlob as it maps to a target user's account.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | address of the target user account. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| userIdentityBlob | struct RoleVerification.IdentityBlob | provides the IdentityBlob struct for the account passed. |

## UserInformation

This contract is imported by VerifiableIdentity.sol and allows developers to access and utilize 
Haven1's Proof Of Identity Framework data.

_UserInformation is accessible by importing VerifiableIdentity.sol._

### getUserAccountCompetencyRating

```solidity
function getUserAccountCompetencyRating(address account) public view returns (uint8)
```

`getUserAccountCompetencyRating` gets the competency rating a user
earned testing their De-Fi knowledge.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the target user account. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint8 | The competency rating for the specified account. |

### getUserAccountCountryCode

```solidity
function getUserAccountCountryCode(address account) public view returns (string userAccountCountryCode)
```

`getUserAccountCountryCode` function returns the country code from the users account.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | address of the target user account. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAccountCountryCode | string | provides the country code for the specified account passed. |

### getUserAccountLevel

```solidity
function getUserAccountLevel(address account) public view returns (uint8 userAccountLevel)
```

`getUserAccountLevel` function returns the verification level from the users account.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | address of the target user account. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAccountLevel | uint8 | provides the verification level for the specified account passed. |

### getUserAccountType

```solidity
function getUserAccountType(address account) public view returns (uint8 userAccountType)
```

`getUserAccountType` function returns the account type from the users account.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | address of the target user account. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAccountType | uint8 | provides the account type for the specified account passed. |

## UserInformationPreventsOnExpiry

This contract allows developers to utilize Haven1s Proof Of Identity Framework 
to enforce in date identity documents for access to functions.

_UserInformationPreventsOnExpiry is accessible by importing VerifiableIdentityPreventsOnExpiry.sol._

### getUserAccountCountryCodePreventOnExpiry

```solidity
function getUserAccountCountryCodePreventOnExpiry(address account) public view returns (string userAccountCountryCode)
```

getUserAccountCountryCode function returns the country code from the users account.

_function reverts in the event the target account has expired._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | address of the target user account. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAccountCountryCode | string | provides the country code for the specified account passed in the event it has not expired. |

### getUserAccountLevelPreventOnExpiry

```solidity
function getUserAccountLevelPreventOnExpiry(address account) public view returns (uint8)
```

`getUserAccountLevelPreventOnExpiry` function returns the verification level from the users account.

_function reverts in the event the target account has expired._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | address of the target user account. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint8 | userAccountLevel provides the verification level for the specified account passed in the event it has not expired. |

### getUserAccountTypePreventOnExpiry

```solidity
function getUserAccountTypePreventOnExpiry(address account) public view returns (uint8)
```

`getUserAccountTypePreventOnExpiry` function returns the account type from the users account.

_function reverts in the event the target account has expired._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | address of the target user account. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint8 | userAccountType provides the account type for the specified account passed in the event it has not expired. |

### getUserAccountCompetencyRatingPreventOnExpiry

```solidity
function getUserAccountCompetencyRatingPreventOnExpiry(address account) public view returns (uint8)
```

`getUserAccountCompetencyRatingPreventOnExpiry` gets the competency rating a user.
earned testing but access to it is prevented if the identity has expired.

_This function reverts if the target account's identity has expired._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the target user account. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint8 | The competency rating for the specified account, if the identity has not expired. |

## VerifiableIdentity

This contract allows developers to access and to utilize Haven1s Proof Of Identity Framework data.

_Haven1s Proof Of Identity Framework data becomes available via the imported functions below.
The official Haven1 ProofOfIdentity.sol deployment address must be passed via the constructor._

### constructor

```solidity
constructor(address _proofOfIdentityContract) public
```

### getUserCompetencyRating

```solidity
function getUserCompetencyRating(address account) public view returns (uint8)
```

`getUserCompetencyRating` gets the competency rating a user
earned testing.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the target user account. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint8 | The competency rating for the specified account account passed in. |

### getUserCountryCode

```solidity
function getUserCountryCode(address account) public view returns (string userAccountCountryCode)
```

getUserCountryCode function returns the country code from the users account
    @param account address of the target user account
    @return userAccountCountryCode provides the country code for the specified account passed in.

### getUserExpiry

```solidity
function getUserExpiry(address account) public view returns (uint256 userAccountExpiry)
```

`getUserExpiry` function returns the expiry date from the users account.
    @param account address of the target user account.
    @return userAccountExpiry the expiry block timestamp of the user's account.

### getUserIdentityData

```solidity
function getUserIdentityData(address account) public view returns (struct IRoleVerification.IdentityBlob)
```

getUserIdentityData function returns struct IdentityBlob from the users account.
    @param account address of the target user account.
    @return userAccountIdentityBlob provides the IdentityBlob data for the specified account passed.

### getUserLevel

```solidity
function getUserLevel(address account) public view returns (uint8 userAccountLevel)
```

getUserLevel function returns the verification level from the users account.
    @param account address of the target user account.
    @return userAccountLevel provides the verification level for the specified account.

### getUserType

```solidity
function getUserType(address account) public view returns (uint8 userAccountType)
```

getUserType function returns the account type from the users account.
    @param account address of the target user account.
    @return userAccountType provides the account type for the specified account passed.

## VerifiableIdentityPreventsOnExpiry

This contract allows developers to access and to utilize Haven1s Proof Of Identity Framework data.
It will revert if a user has expired documents and needs to update their account.

_Haven1s Proof Of Identity Framework data is available via the imported functions below.
The official Haven1 ProofOfIdentity.sol deployment address must be passed via the constructor.
UserInformationPreventsOnExpiry provides protected functions to ensure a users Account contains in date identity documents._

### constructor

```solidity
constructor(address _proofOfIdentityContract) public
```

### getUserCompetencyRatingPreventOnExpiry

```solidity
function getUserCompetencyRatingPreventOnExpiry(address account) public view returns (uint8)
```

`getUserAccountCompetencyRatingPreventOnExpiry` gets the competency rating a user
earned testing but access to it is prevented if the identity has expired.

_This function reverts if the target account's identity has expired._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the target user account. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint8 | The competency rating for the specified account, if the identity has not expired. |

### getUserCountryCodePreventOnExpiry

```solidity
function getUserCountryCodePreventOnExpiry(address account) public view returns (string userAccountCountryCode)
```

`getUserCountryCodePreventOnExpiry` function returns the country code from the users account.

_The call reverts in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the target user account. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAccountCountryCode | string | provides the country code for the specified account passed in the event it has not expired. |

### getUserExpiry

```solidity
function getUserExpiry(address account) public view returns (uint256)
```

`getUserExpiry` function returns only the expiry date from the users account.

_The call will not revert in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the target user account. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | userAccountLevel provides the verification level for the specified account passed in the event it has not expired. |

### getUserIdentityData

```solidity
function getUserIdentityData(address account) public view returns (struct IRoleVerification.IdentityBlob)
```

`getUserIdentityData` function returns struct IdentityBlob from the users account.

_The call will not revert in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the target user account. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct IRoleVerification.IdentityBlob | userAccountIdentityBlob provides the IdentityBlob data for the specified account passed in the event it has not expired. |

### getUserLevelPreventOnExpiry

```solidity
function getUserLevelPreventOnExpiry(address account) public view returns (uint8 userAccountLevel)
```

`getUserLevelPreventOnExpiry` function returns the verification level from the users account.

_The call reverts in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the target user account. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAccountLevel | uint8 | provides the verification level for the specified account passed in the event it has not expired. |

### getUserTypePreventOnExpiry

```solidity
function getUserTypePreventOnExpiry(address account) public view returns (uint8 userAccountType)
```

`getUserTypePreventOnExpiry` function returns the account type from the users account.

_The call reverts in the event the target accounts IdentityBlob.expiry is less than the current block.timestamp._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the target user account. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAccountType | uint8 | provides the account type for the specified account passed in the event it has not expired. |

## IPermissionsInterface

### assignAccountRole

```solidity
function assignAccountRole(address _account, string _orgId, string _roleId) external
```

## DummyPermissionsContract

### constructor

```solidity
constructor() public
```

### _accountRole

```solidity
mapping(address => struct DummyPermissionsContract.AccountRole) _accountRole
```

### AccountRole

```solidity
struct AccountRole {
  string orgId;
  string roleId;
}
```

### updateAccountStatus

```solidity
function updateAccountStatus(string reason, address account, uint256 number) public
```

### assignAccountRole

```solidity
function assignAccountRole(address _account, string _orgId, string _roleId) public
```

