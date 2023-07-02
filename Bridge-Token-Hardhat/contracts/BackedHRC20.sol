// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "./Errors.sol";

contract BackedHRC20 is
    Initializable,
    ERC20Upgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    // Role created via access control that interacts with the contract
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /**
     * @dev The event is triggered during the suspendAccountMaintainTokenAndIdentityBlob function.
     * It includes the tokenId and the reason.
     * This will include temporary susepensions/
     */

    event TokensBurnedFromAccount(
        address indexed account,
        uint256 indexed amount,
        string indexed reason
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /** 
    @notice variables initalized when the contract deploys.
    @param havenFoundation can remove/add operator roles.
    @param networkOperator can pause/unpause the contract set to true to allow an address to be whitelisted or false to remove privledges.
    @dev The `OPERATOR_ROLE can be given after deployment by calling `grantRole(role, address)`
        Ex: `grantRole(OPERATOR_ROLE, 0x1d2B794563Bf90c6e53B56b215502b8aE4c42fF8)` 
    */

    function initialize(
        string memory name,
        string memory symbol,
        address havenFoundation,
        address networkOperator
    ) external initializer {
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ERC20_init(name, symbol);
        _grantRole(DEFAULT_ADMIN_ROLE, havenFoundation);
        _grantRole(OPERATOR_ROLE, networkOperator);
    }

    /** 
    @notice Function to pause sending/depositing/withdrawing of tokens from contract.
    @dev Only operator role can do this given in constructor or by calling grantRole(OPERATOR_ROLE, <ADDRESS>).
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
    @dev returns true if the input is a contract.
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
    @param spender is the address being approved to move other wallets tokens.
    @param amount the number of tokens they send on behalf of the owner.
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
    @param addedValue the number of tokens added to the original number that the spender is approved to send on behalf of the owner.
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

    function issueBackedToken(
        address to,
        uint256 amount
    ) external whenNotPaused onlyRole(OPERATOR_ROLE) {
        _mint(to, amount);
    }

    /**
    @notice Function to redeem backed tokens for Haven1, managed  by the network operator
    @param amount number of tokens to be redeemed.
    @dev Function does not work when paused.
    @dev If  the amount is higher than the balance of the address an error reading "BALANCE_TOO_LOW" will be returned.
    @dev Only OPERATOR role can do this given in contructor or by calling grantRole(OPERATOR_ROLE, <ADDRESS>).
    */

    function redeemBackedToken(uint256 amount) external whenNotPaused {
        require(
            balanceOf(msg.sender) >= amount,
            Errors.INSUFFICIENT_TOKEN_BALANCE
        );
        _burn(msg.sender, amount);
    }

    /**
     * @notice This function will be used to provide additional onChain security on Haven1.
     * The Haven1 Foundation will call it in case of theft or lost keys.
     * @param target the address that tokens will be burned from.
     * @param amount the amount of tokens that will be burned.
     * @dev TThe premise for this function to be called will be a support ticket submitted off chain.
     * The reason will be emitted in the event.
     */

    function burnFrom(
        address target,
        uint256 amount,
        string calldata reason
    ) external onlyRole(OPERATOR_ROLE) {
        _burn(target, amount);
        emit TokensBurnedFromAccount(target, amount, reason);
    }

    /**
    @notice Function to upgrade contract override to protect.
    @param newImplementation new implementation address.
    */

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    /**
    @notice Function called when using ERC-20 standard transferring functions.
    @param from address to remove tokens from.
    @param to receiver of tokens.
    @param amount number of tokens to be sent.
    @dev Function does not work when paused.
    */

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}
