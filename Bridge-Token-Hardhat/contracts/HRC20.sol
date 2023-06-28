// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "./Errors.sol";

contract HRC20 is
    Initializable,
    ERC20Upgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    /**
     * @dev Emitted when and address is blacklisted from sending/recieving tokens.
     */
    event AddressBlackListed(
        address indexed blockedAddress,
        bool indexed blockStatus
    );

    /**
     * @dev Emitted when and address is whitelisted to sending/recieving tokens.
     */
    event AddressWhiteListed(
        address indexed permissionedAddress,
        bool indexed approvalStatus
    );

    event WhiteListSetToActive(
        bool indexed isActive
        );

    // Mapping will return false by default, if set to true address cant withdraw/deposit/send/recieve tokens.
    mapping(address => bool) public _blockedMembers;

    // Modifer on fuctions to check if address is blocked.
    modifier blackListBlocked(address requester) {
        require(_blockedMembers[requester] == false, Errors.ADDRESS_BLOCKED);
        _;
    }

    // Role created via access control that interacts with the contract
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /** 
    @notice variables initalized when the contract deploys.
    @param useWhiteList sets the storage `bool` `isWhiteListContract` if true no account that is not approved can have tokens minted to them.
    @param networkAdmin can remove/add operator roles.
    @param networkOperator can pause/unpause the contract set to true to allow an address to be whitelisted or false to remove privledges.
    @dev The `OPERATOR_ROLE can be given after deployment by calling `grantRole(role, address)`
        Ex: `grantRole(OPERATOR_ROLE, 0x1d2B794563Bf90c6e53B56b215502b8aE4c42fF8)` 
    */

    function initialize(
        string memory name,
        string memory symbol,
        address networkAdmin,
        address networkOperator,
        bool useWhiteList
    ) external initializer {
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ERC20_init(name, symbol);
        isWhiteListContract = useWhiteList;
        _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, networkAdmin);
        _grantRole(OPERATOR_ROLE, networkOperator);
    }

    /** 
    @notice This function sets an address to be blacklisted or remove a blacklist.
    @param blockedAddress address we want to block or unblock from sending/recieving/withdrawing/depositing tokens.
    @param blockStatus set to true this blocks the address from using tokens, faulse unblocks it.
    */

    function setBlackListAddress(
        address blockedAddress,
        bool blockStatus
    ) external onlyRole(OPERATOR_ROLE) {
        _blockedMembers[blockedAddress] = blockStatus;
        emit AddressBlackListed(blockedAddress, blockStatus);
    }

    // If this variable is true address that are not approved cannot recieve tokens.
    bool isWhiteListContract;

    // Mapping will return false by default this is used to determine is an address is approved to mint tokens.
    mapping(address => bool) public _whiteListApproved;

    /**
    @notice Function to an addresses to whitelist or remove it.
    @param permissionedAddress an  address we want to allow to whitelist.
    @param approvalStatus whether we want to approve or remove address from whitelist.
    */

    function setWhiteListAddress(
        address permissionedAddress,
        bool approvalStatus
    ) external onlyRole(OPERATOR_ROLE) {
        _whiteListApproved[permissionedAddress] = approvalStatus;
        emit AddressWhiteListed(permissionedAddress, approvalStatus);
    }

    /**
    @notice Function to multiple addresseses t0 whitelist.
    @param permissionedAddresses an array of addresses we want to allow to whitelist.
    */

    function setMultipleWhiteListAddresses(
        address[] calldata permissionedAddresses
    ) external onlyRole(OPERATOR_ROLE) {
        for (uint i = 0; i < permissionedAddresses.length; i++) {
            _whiteListApproved[permissionedAddresses[i]] = true;
            emit AddressWhiteListed(permissionedAddresses[i], true);
        }
    }

    /** 
    @notice Function to enforce or remove the requirement for a whitelist.
    @param isActive if set to true enforces restrictions is false removes.
    */
    function setWhiteListActive(
        bool isActive
    ) external onlyRole(OPERATOR_ROLE) {
        isWhiteListContract = isActive;
        emit WhiteListSetToActive(isActive);
    }

    /** 
    @notice Function to pause sending/depositing/withdrawing of tokens from contract.
    @dev Only operator role can do this given in contructor or by calling grantRole(OPERATOR_ROLE, <ADDRESS>).
    */

    function pause() external onlyRole(OPERATOR_ROLE) {
        _pause();
    }

    /**
    @notice Function to unpause (if paused) and allow sending/depositing/withdrawing of tokens from contract.
    */

    function unpause() external onlyRole(OPERATOR_ROLE) {
        _unpause();
    }

    /**
    @notice This function checks an address to ensure it is a contract NOT a wallet.
    @param _addr the address to be checked for if it is a contract or not.
    @dev retruns true if the input is a contract.
    @dev Used to override approvals and increase allowance.
    */

    function isContract(
        address _addr
    ) public view returns (bool isItAContract) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }

    /**
    @notice Same as ERC-20's function but does not allow wallets to be approved only contracts.
    @param spender is the address being approved to move another wallets tokens.
    @param amount the number of tokens the  send on belhalf of the owner.
    */

    function approve(
        address spender,
        uint256 amount
    ) public virtual override returns (bool) {
        require(isContract(spender) == true, Errors.ONLY_APPROVES_CONTRACTS);
        address owner = _msgSender();
        _approve(owner, spender, amount);
        return true;
    }

    /**
    @notice Same as ERC-20's function but does not allow wallets to be approved only contracts.
    @param spender is the address being approved to move another wallets tokens.
    @param addedValue the number of tokens added to the original number that the spender is approved to send on belhalf of the owner.
    */

    function increaseAllowance(
        address spender,
        uint256 addedValue
    ) public virtual override returns (bool) {
        require(isContract(spender) == true, Errors.ONLY_APPROVES_CONTRACTS);
        address owner = _msgSender();
        _approve(owner, spender, allowance(owner, spender) + addedValue);
        return true;
    }

    /**
    @notice Function to deposit tokens for Haven1 via Yield App.
    @param to address to recieve token.
    @param amount number of tokens to be recieved.
    @dev Function does not work when paused.
    @dev If an address is blacklisted via `setBlackListAddress` it cannot recieve tokens.
    @dev If isWhiteListContract is set to true addresses must be whitelisted via `setWhiteListAddress`.
    @dev Only OPERATOR role can do this given in contructor or by calling grantRole(OPERATOR_ROLE, <ADDRESS>).
    */

    function deposit(
        address to,
        uint256 amount
    ) external whenNotPaused blackListBlocked(to) onlyRole(OPERATOR_ROLE) {
        require(
            isWhiteListContract == false || _whiteListApproved[to] == true,
            Errors.WHITELIST_ERROR
        );
        _mint(to, amount);
    }

    /**
    @notice  Function to withdraw tokens for Haven1 via Yield App.
    @param from address to remove tokens from.
    @param amount number of tokens to be withdrawn.
    @dev Function does not work when paused.
    @dev If an address is blacklisted via `setBlackListAddress` it cannot withdraw tokens.
    @dev If  the amount is higher than the balance of the address an error reading "BALANCE_TOO_LOW" will be returned.
    @dev Only OPERATOR role can do this given in contructor or by calling grantRole(OPERATOR_ROLE, <ADDRESS>).
    */

    function withdraw(
        address from,
        uint256 amount
    ) external whenNotPaused blackListBlocked(from) onlyRole(OPERATOR_ROLE) {
        require(balanceOf(from) >= amount, Errors.INSUFFICIENT_BALANCE);
        _burn(from, amount);
    }

    /**
    @notice Function to upgrade contract override to protect.
    @param newImplementation new implementation address.
    */

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    /**
    @notice Function called when using ERC-20 standard transfering functions.
    @param from address to remove tokens from.
    @param to reciever of tokens.
    @param amount number of tokens to be sent.
    @dev Function does not work when paused.
    @dev If an address is blacklisted via `setBlackListAddress` it cannot transfer/recieve tokens.
    */

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    )
        internal
        override
        whenNotPaused
        blackListBlocked(from)
        blackListBlocked(to)
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}
