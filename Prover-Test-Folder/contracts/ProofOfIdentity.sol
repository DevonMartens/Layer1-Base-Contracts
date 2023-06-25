// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "./IPermissionsInterface.sol";
import "./UserInformation.sol";
import "./Errors.sol";
import "./UserInformationPreventsOnExpiry.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
* @title Proof of Identity Framework
* @author Haven1 Development Team
* @notice This contract is responsible for the registering and updating of 
* users on Haven1, storing de-identified data for utilisation across the network
* @dev Nominated prover role(s) are responsible for authorising and minting 
* identity NFTs and storing information with registration calldata
* the contract interacts with the Quroum framework via the network level 
* permissions interface to approve accounts to transact on the network
* the contract imports the OpenZeppelin ERC721 standard, overriding transfer 
* functions to prevent the Identity NFTs being transferred between accounts
*/

contract ProofOfIdentity is
    UserInformation,
    UserInformationPreventsOnExpiry,
    Initializable, 
    ERC721Upgradeable, 
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

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
    * @dev The event is triggered during the mintIdentity 
    * it includes the address the token is minted to and the tokenId.
    */
    event IdentityMinted(
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
    * @dev The event is triggered during the updateTokenURI function. 
    * It includes the address the token is minted to, the tokenId and the new uri/
    */
    event TokenURIUpdated(
        address indexed account,
        uint256 indexed tokenId,
        string indexed newURI
    );

    // Storage so the contract can utilize the interface.
    IPermissionsInterface private _permissionsInterface;

    // Mappings to Track Relations for Identity.
    mapping(address => uint256) private _tokenOfHolder;

    // Maps tokenId to URI to allow custom settings.
    mapping(uint256 => string) private _tokenURI;

    // Storage for prover role.
    bytes32 public constant PROVER_ROLE = keccak256("PROVER_ROLE");

    // Role to upgrade contract
   bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    /**
    @notice initalizer function run on deployment. 
    @dev increments tokenId so we start at 1.
    @dev sets deploying address to both a prover role and a admin.
    @dev includes name and symbol to satisfy ERC721 contract requirments.
     */

    function initialize(
        address permissionsInterface,
        address admin,
        address prover,
        address upgrader
    )
    external initializer
    {
        _revokeRole(
            DEFAULT_ADMIN_ROLE,
            msg.sender)
            ;
        _grantRole(
            UPGRADER_ROLE,
            upgrader)
            ;
        _grantRole(
            DEFAULT_ADMIN_ROLE, 
            admin)
            ;
        _grantRole(
            PROVER_ROLE,
            prover)
            ;
         __AccessControl_init();
        __ERC721_init("Proof of Identity", "H1-ID");
        __UUPSUpgradeable_init();
        _permissionsInterface = IPermissionsInterface(permissionsInterface);
        _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PROVER_ROLE, prover);
        _grantRole(UPGRADER_ROLE,  upgrader);
        _tokenIdCounter.increment();
    }

    /**
    * @notice mintIdentity function is only callable by Prover node, 
    * once an identity has been minted it is not transferable
    * @dev once identity is minted, the contract will call the permissions interface contract, 
    * adding role access via the 'assignAccountRole' function
    * @param account address of the target user
    * @param countryCode is the users region identifier as defined by ISO3 standards 
    * @ https://wits.worldbank.org/wits/wits/witshelp/content/codes/country_codes.htm
    * @param userType is passed to assigned an account type - 
    * retail (0) or instituton (1), by not using an enum we allow for additional classes in the future
    * @param expiry is passed to assign an expiry time for the documents provided by the Prover node, 
    * ensuring user documentation is in date if an application chooses to implement
    * @param level is passed to assign a KYC level to the user account, by combining 
    * the region code and KYC level we allow for specific regional restrictions to be implemented by developers
    */

    function mintIdentity(
        address account,
        string calldata countryCode,
        uint8 userType,
        uint8 level,
        uint256 expiry,
        string calldata tokenUri
    ) public onlyRole(PROVER_ROLE) {
        require(balanceOf(account) == 0, Errors.PREVIOUSLY_VERIFIED);

        require(expiry > block.timestamp, Errors.ID_INVALID_EXPIRED);
        uint256 tokenId = _tokenIdCounter.current();

        identityBlob[account] = IdentityBlob({
            tokenId: tokenId,
            countryCode: countryCode,
            userType: userType,
            level: level,
            expiry: expiry
        });

        _tokenIdCounter.increment();
        _safeMint(account, tokenId);
        _tokenURI[tokenId] = tokenUri;
        _tokenOfHolder[account] = tokenId;
        _permissionsInterface.assignAccountRole(account, "HAVEN1", "VTCALL");
        emit IdentityMinted(account, tokenId);
    }

    /**
    * @notice updateIdentity function is only callable by Prover node, 
    * the intention is to update an identity for changing user details over time
    * @dev the function requires an ID to have been issued to the account, 
    * if the account does not have an ID it will revert
    * @param account address of the target user
    * @param countryCode is the users region identifier as defined by 
    * ISO3 standards @ https://wits.worldbank.org/wits/wits/witshelp/content/codes/country_codes.htm
    * @param userType is passed to assigned an account type - retail (0) or instituton (1), 
    * by not using an enum we allow for additional classes in the future
    * @param expiry is passed to assign an expiry time for the documents provided by the Prover node, 
    * ensuring user documentation is in date if an application chooses to implement
    * @param level is passed to assign a KYC level to the user account, by combining the region code and KYC 
    * level we allow for specific regional restrictions to be implemented by developers
    */

    function updateIdentity(
        address account,
        string calldata countryCode,
        uint8 userType,
        uint8 level,
        uint256 expiry
    ) external onlyRole(PROVER_ROLE) {
        require(balanceOf(account) == 1, Errors.ID_DOES_NOT_EXIST);

        uint256 tokenId = identityBlob[account].tokenId;
        identityBlob[account] = IdentityBlob({
            tokenId: tokenId,
            countryCode: countryCode,
            userType: userType,
            level: level,
            expiry: expiry
        });
        emit IdentityUpdated(account, tokenId);
    }

    /** 
    @notice This function adjusts the token URI of the user
    @param account the account of the token URI to update
    @param tokenUri the Uri data to update for the token ID
    */

    function updateTokenURI(
        address account,
        string calldata tokenUri
    ) external onlyRole(PROVER_ROLE) {
        uint256 tokenId = _tokenOfHolder[account];
        require(_exists(tokenId), Errors.ID_DOES_NOT_EXIST);
        _tokenURI[tokenId] = tokenUri;
        emit TokenURIUpdated(account, tokenId, tokenUri);
    }

    /** 
    * @notice This function reverses `mintIdentity` function by removing the identity blob 
    * struct and burning the token, suspending the account via the permissions interface
    * @param suspendAccount the address to suspend via the 
    * permissions interface, tokenID is assigned by the _tokenOfHolder mapping
    * @param reason the reason the address is being suspended
    */

    function suspendAccountDeleteTokenAndIdentityBlob(
        address suspendAccount,
        string calldata reason
    ) external onlyRole(PROVER_ROLE) {
        _permissionsInterface.updateAccountStatus(
            "HAVEN1",
            suspendAccount,
            1
        );
        uint256 tokenId = _tokenOfHolder[suspendAccount];
        _burn(tokenId);
        delete identityBlob[suspendAccount];
        emit AccountSuspendedTokenBurned(suspendAccount, tokenId, reason);
    }

    /** 
    * @notice This function suspends the account via the permissions 
    * interface and maintains the tokenID and identity blog struct for the targets account
    * @param suspendAddress the address to suspend via the permissions interface, 
    * tokenID is assigned by the _tokenOfHolder mapping
    * @param reason the reason the address is being suspended
    */

    function suspendAccountMaintainTokenAndIdentityBlob(
        address suspendAddress,
        string calldata reason
    ) external onlyRole(PROVER_ROLE) {
        _permissionsInterface.updateAccountStatus(
            "HAVEN1",
            suspendAddress,
            1
        );
        emit AccountSuspendedTokenMaintained(suspendAddress, reason);
    }

    /** 
    @notice Allows a call to view the current tokenId to monitor overall distribution.
    */

    function getCurrentTokenId() public view returns(uint256){
        return _tokenIdCounter.current();
    }

    /** 
    @notice Allows tokenURI to be viewed
    @dev Overrides OpenZeppelins 
    */

    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
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
    ) public override (ERC721Upgradeable)  {
        revert(Errors.ID_NOT_TRANSFERABLE);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     *      The function reverts to keep the token soulbound.
     */

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        revert(Errors.ID_NOT_TRANSFERABLE);
    }

    /**
   @notice Function to upgrade contract override to protect.
   @param newImplementation new implementation address.
   */

   function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}

    /**
    @notice Override to ensure the same interfaces can support access control and ERC721 from openzepplin.
    */

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
