// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "./IPermissionsInterface.sol";
import "./UserInformation.sol";
import "./UserInformationPreventsOnExpiry.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
* @title Proof of Identity Framework
* @author Devon
* @notice This contract is responsible for the registering and updating of 
* users on Haven1, storing de-identified data for utilisation across the network
* @dev Nominated operator role(s) are responsible for authorising and minting 
* identity NFTs and storing information with registration calldata
* the contract interacts with the Quorum framework via the network level 
* permissions interface to approve accounts to transact. On the network
* the contract imports the OpenZeppelin ERC721 standard, overriding transfer 
* functions to prevent the Identity NFTs being transferred between accounts.
*/

contract ProofOfIdentity is
    UserInformation,
    UserInformationPreventsOnExpiry,
    Initializable, 
    ERC721Upgradeable, 
    AccessControlUpgradeable,
    UUPSUpgradeable
{

    // Tells the contract to use the counters library in counters upgradeable.
    using CountersUpgradeable for CountersUpgradeable.Counter;


    /** 
    * @dev The event is triggered during the `suspendAccountMaintainTokenAndIdentityBlob` function. 
    * It includes the tokenId and the reason. 
    * This will include temporary susepensions.
    */

    event AccountSuspendedTokenMaintained(
        address indexed account,
        string indexed reason
    );

    /** 
    * @dev The event is triggered when `isseIdentity` is called. 
    * It emits the account that was issued an identity and the tokenId.
    */
    event IdentityIssued(
        address indexed account, 
        uint256 indexed tokenId
        );

    /** 
    * @dev The event is triggered during the `updateIdentity` when an identity is updated 
    * it includes the address the token is minted to and the tokenId.
    */
    event IdentityUpdated(
        address indexed account, 
        uint256 indexed tokenId
        );
    
  	
    /**	
     * @dev The event is triggered when `updateTokenURI` is called. 
     * It emits the account the token is minted to, the tokenId and the new URI.	
     */
    event TokenURIUpdated(
        address indexed account,
        uint256 indexed tokenId,
        string indexed newURI
    );
    
    // Tracks tokenIds in a counter.
     CountersUpgradeable.Counter private _tokenIdCounter;

    // Stores the Quorum Network permissions interface address.
    IPermissionsInterface private _permissionsInterface;
	
    // Maps tokenId to custom URI.
    mapping(uint256 => string) private _tokenURI;

     // Stores keccak256 hash of OPERATOR_ROLE for access control.
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

     /**	
     * @notice `initalize` function is ran at the time of deployment to support the upgradable proxy, 
     * it defines the permissions interface and the default admin role for access control or "network operator".
     * @dev The function includes name and symbol to satisfy ERC721 contract requirements.
     * @param permissionsInterface address of the Quorum permissions interface contract.	
     * @param networkAdmin address of the Network Operator Multisig, to be declared as default admin for access control.	
     * @param networkOperator address that controls operations in the contract.
     */
    function initialize(
        address permissionsInterface,
        address networkAdmin,
        address networkOperator
    )
    external initializer
    {
         __AccessControl_init();
        __ERC721_init("Proof of Identity", "H1-ID");
        __UUPSUpgradeable_init();
        _permissionsInterface = IPermissionsInterface(permissionsInterface);
        _grantRole(DEFAULT_ADMIN_ROLE, networkAdmin);
        _grantRole(OPERATOR_ROLE, networkOperator);
    }

    /**	
     * @notice `issueIdentity` function is only callable by operator role, once an identity has been minted it is not transferable.	
     * @dev once identity is minted, the contract will call the permissions interface contract, 
     * adding role access via the `assignAccountRole` function.	
     * @param account address of the target user.	
     * @param countryCode is the users region identifier as defined by ISO3 standards - 
     * Visit https://docs.haven1.org/ for a comprehensive list of ISO3 country codes.	
     * @param userType is passed to assigned an account type - retail (0) or instituton (1), 
     * by not using an enum we allow for additional classes in the future.	
     * @param expiry is passed to assign an expiry time for the documents provided by the operator role, 
     * ensuring user documentation is in date if an application chooses to implement.	
     * @param level is passed to assign a KYC level to the user account, by combining the region code and KYC 
     * level we allow for specific regional restrictions to be implemented by developers.	
     * @param tokenUri is passed to provide a custom URI to the tokenId for future utilisation and expansion 
     * of proof of identity framework.	
     * @return tokenId the id of the token minted to the account.	
     */
    function issueIdentity(
        address account,
        string calldata countryCode,
        uint8 userType,
        uint8 level,
        uint256 expiry,
        string calldata tokenUri
    ) external onlyRole(OPERATOR_ROLE) returns(uint256) {
        require(balanceOf(account) == 0, Errors.PREVIOUSLY_VERIFIED);

        require(expiry > block.timestamp, Errors.ID_INVALID_EXPIRED);
         _tokenIdCounter.increment();

        uint256 tokenId = _tokenIdCounter.current();

        identityBlob[account] = IdentityBlob({
            tokenId: tokenId,
            countryCode: countryCode,
            userType: userType,
            level: level,
            expiry: expiry,
            competencyRating: 0
        });

        _safeMint(account, tokenId);
        _tokenURI[tokenId] = tokenUri;
        _permissionsInterface.assignAccountRole(account, "HAVEN1", "VTCALL");
        emit IdentityIssued(account, tokenId);
        return tokenId;
    }

    /**	
     * @notice `updateIdentity` function is only callable by operator role, 
     * its purpose is to update an identity for changing user details over time.	
     * @dev the function requires an ID to have been issued to the account, 
     * if the account does not have an ID it will revert.	
     * @param account address of the target user.	
     * @param countryCode is the users region identifier as defined by ISO3 standards - 
     * Visit https://docs.haven1.org/ for a comprehensive list of ISO3 country codes.	
     * @param userType is passed to assigned an account type - retail (0) or instituton (1), 
     * by not using an enum we allow for additional classes in the future.	
     * @param expiry is passed to assign an expiry time for the documents provided by the operator role, 
     * ensuring user documentation is in date if an application chooses to implement.	
     * @param level is passed to assign a KYC level to the user account, by combining the region code and 
     * KYC level we allow for specific regional restrictions to be implemented by developers.	
     * @param tokenUri is passed to provide a custom URI to the tokenId for future utilisation and 
     * expansion of proof of identity framework.	
     */	
    function updateIdentity(
        address account,
        string calldata countryCode,
        uint8 userType,
        uint8 level,
        uint256 expiry,
        uint8 competencyRating,
        string calldata tokenUri
    ) external onlyRole(OPERATOR_ROLE) {
        require(balanceOf(account) == 1, Errors.ID_DOES_NOT_EXIST);
        
        identityBlob[account] = IdentityBlob({
            tokenId: identityBlob[account].tokenId,
            countryCode: countryCode,
            userType: userType,
            level: level,
            expiry: expiry,
            competencyRating: competencyRating
        });
        _tokenURI[identityBlob[account].tokenId] = tokenUri;
        emit IdentityUpdated(account, identityBlob[account].tokenId);
    }

    /**
     * @notice `establishCompetencyRating` function allows operators to add or update a competency score for a user's account.
     * @dev This function can only be called by an address with the OPERATOR_ROLE.
     * @param account The address of the target user account.
     * @param score The competency score to be added or updated.
     */
    function establishCompetencyRating(
        address account, 
        uint8 score) 
        external onlyRole(OPERATOR_ROLE) {
            identityBlob[account].competencyRating = score;
    }

     /**	
     * @notice `updateTokenURI` function is only callable by operator role, 
     * its purpose is to update the tokenUri of an account.	
     * @param account the target account of the tokenUri to update.	
     * @param tokenUri the URI data to update for the token Id.	
     */
    function updateTokenURI(
        address account,
        uint256 tokenId,
        string calldata tokenUri
    ) external onlyRole(OPERATOR_ROLE) {
        require(_exists(tokenId), Errors.ID_DOES_NOT_EXIST);
        _tokenURI[tokenId] = tokenUri;
        emit TokenURIUpdated(account, tokenId, tokenUri);
    }

    /**
     * @notice `suspendAccountMaintainTokenAndIdentityBlob` function is only callable by operator role, 
     * it suspends the account via the permissions interface and maintains the tokenID 
     * and identity blog struct for the targets account.
     * @dev To unsuspend an account, a user must lodge a request with the operator, 
     * the ability to unsuspend accounts is not provided in this contract and requires intervention to resolve.
     * @param suspendAddress the address to suspend via the permissions interface, 
     * tokenID is assigned by the _tokenOfHolder mapping.
     * @param reason the reason the address is being suspended.
     */

    function suspendAccountMaintainTokenAndIdentityBlob(
        address suspendAddress,
        string calldata reason
    ) external onlyRole(OPERATOR_ROLE) {
        _permissionsInterface.updateAccountStatus("HAVEN1", suspendAddress, 1);
        emit AccountSuspendedTokenMaintained(suspendAddress, reason);
    }
    	
    /**	
     * @notice `totalSupply` function allows a call to view the count of 
     * issued tokens to monitor overall distribution.	
     * @return totalSupply provides total supply of tokenIds issued	
     */	
    function totalSupply() public view returns (uint256) {	
        return (_tokenIdCounter.current());	
    }

   	
     /**	
     * @notice `tokenURI` function allows tokenURI to be viewed.
     * @dev Overrides OpenZeppelins implementation with custom return logic.	
     * @param tokenId is passed to retrieve the mapped URI.	
     * @return tokenUri provides URI for specified tokenId passed.	
     */	
    function tokenURI(	
        uint256 tokenId	
    ) public view virtual override returns (string memory tokenUri) {	
        require(_exists(tokenId), Errors.ID_DOES_NOT_EXIST);	
        return _tokenURI[tokenId];	
    }	

    /**
    * @dev Overrides OpenZeppelin `_beforeTokenTransfer` implementation to prevent transferring of a token.
    */
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal virtual override {
        require(from == address(0), Errors.ID_NOT_TRANSFERABLE);
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
  	
    /**
    * @dev Overrides OpenZeppelin `_authorizeUpgrade` in order to ensure only the 
    * operator role can upgrade the contracts.
    */

   function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(DEFAULT_ADMIN_ROLE)
        override
    {}

   	/**
    * @dev Overrides OpenZeppelin `supportsInterface` implementation to 
    * ensure the same interfaces can support access control and ERC721.	
    */

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
