// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "./IPermissionsInterface.sol";
import "./new/NewUserInformation.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
* @title Proof of Identity Framework
* @author Devon
* @notice This contract is responsible for the registering and updating of 
* users on Haven1, storing de-identified data for utilisation across the network
* @dev Nominated operator role(s) are responsible for authorising and minting 
* identity NFTs and storing information with registration calldata
* the contract interacts with the Quroum framework via the network level 
* permissions interface to approve accounts to transact on the network
* the contract imports the OpenZeppelin ERC721 standard, overriding transfer 
* functions to prevent the Identity NFTs being transferred between accounts
*/

contract NewProofOfIdentity is
    NewUserInformation,
    Initializable, 
    ERC721Upgradeable, 
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    /** 
    * @dev The event is triggered during the `suspendAccountDeleteTokenAndIdentityBlob` 
    * it includes the account, tokenId, and reason for suspension.
    */
    event AccountSuspendedTokenBurned(
        address indexed account,
        uint256 indexed tokenId,
        string indexed reason
    );

    /** 
    * @dev The event is triggered during the suspendAccountMaintainTokenAndIdentityBlob function. 
    * It includes the tokenId and the reason. 
    * This will include temporary susepensions/
    */

    event AccountSuspendedTokenMaintained(
        address indexed account,
        string indexed reason
    );

    /** 
    * @dev The event is triggered when `updateIdentity` is called. 
    * It emits the account that was updated and the tokenId.
    */
    event IdentityIssued(
        address indexed account, 
        uint256 indexed tokenId
        );

    /** 
    * @dev The event is triggered during the updateIdentity when an identity is updated 
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
    
    // Tracks tokenIds
    CountersUpgradeable.Counter private _tokenIdCounter;

    // Stores the Quourum Network permissions interface address.
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
     * it defines the permissions interface and the default admin role for access control or "network operator"	
     * @dev The function includes name and symbol to satisfy ERC721 contract requirements.	
     * `_disableInitializers` called to prevent re-initialization as per OpenZeppelin recommendations.	
     * @param permissionsInterface address of the Quorum permissions interface contract.	
     * @param networkAdmin address of the Network Operator Multisig, to be declared as default admin for access control.	
     * @param networkOperator address that controls operations in the contract
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



 function issueIdentity(
        address account,
       IdentityBlob memory _identityBlob,
       string calldata tokenUri
    ) external onlyRole(OPERATOR_ROLE) returns(uint256) {
        require(balanceOf(account) == 0, Errors.PREVIOUSLY_VERIFIED);

        require(_identityBlob.expiry > block.timestamp, Errors.ID_INVALID_EXPIRED);
         _tokenIdCounter.increment();

        identityBlob[account] = _identityBlob;

        _safeMint(account, _tokenIdCounter.current());
        _tokenURI[_tokenIdCounter.current()] = tokenUri;
        _permissionsInterface.assignAccountRole(account, "HAVEN1", "VTCALL");
        emit IdentityIssued(account, _tokenIdCounter.current());
        return _tokenIdCounter.current();
    }

     /**	
     * @notice `updateTokenURI` function is only callable by operator role, 
     * its purpose is to update the tokenUri of an account.	
     * @param account the account of the tokenUri to update.	
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
     * @notice `suspendAccountMaintainTokenAndIdentityBlob` function is only callable by operator role, it suspends the account via the permissions interface and maintains the tokenID and identity blog struct for the targets account.
     * @dev To unsuspend an account, a user must lodge a request with the operator, the ability to unsuspend accounts is not provided in this contract and requires intervention to resolve.
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
     * @notice `totalSupply` function allows a call to view the count of issued tokens to monitor overall distribution.	
     * @return totalSupply provides total supply of tokenIds issued	
     */	
    function totalSupply() public view returns (uint256) {	
        return (_tokenIdCounter.current());	
    }

   	
     /**	
     * @notice `tokenURI` function allows tokenURI to be viewed	
     * @dev Overrides OpenZeppelins implementation with custom return logic	
     * @param tokenId is passed to retrieve the mapped URI	
     * @return tokenUri provides URI for specified tokenId passed	
     */	
    function tokenURI(	
        uint256 tokenId	
    ) public view virtual override returns (string memory tokenUri) {	
        require(_exists(tokenId), Errors.ID_DOES_NOT_EXIST);	
        return _tokenURI[tokenId];	
    }	


    /**
     * @dev See {IERC721-transferFrom}.
     *      The function reverts to keep the token soulbound.
     */

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public pure override (ERC721Upgradeable)  {
        revert(Errors.ID_NOT_TRANSFERABLE);
    }

    /**	
     * @dev Overrides OpenZeppelin `transferFrom` implementation to prevent transferring of token	
     */

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public pure override {
        revert(Errors.ID_NOT_TRANSFERABLE);
    }

  	
    /**	
     * @dev Overrides OpenZeppelin `safeTransferFrom` implementation to prevent transferring of token
     */

   function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(DEFAULT_ADMIN_ROLE)
        override
    {}

   	/**
    * @dev Overrides OpenZeppelin `supportsInterface` implementation to ensure the same interfaces can support access control and ERC721.	
    */

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
