// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "./Errors.sol";


/**
* @title BackedHRC20
* @author Devon
* @notice This contract serves a vital purpose in facilitating token 
* transactions on Haven1 for users who prioritize the security of their cold storage vaults.
* @dev The core functionality of this contract revolves around minting and burning tokens, 
* ensuring a seamless experience for users as they deposit and redeem assets on the Haven1 platform.
*/
contract BackedHRC20 is
    Initializable,
    ERC20Upgradeable,
    ERC20PermitUpgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    // Role created via access control that interacts with the contract
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /**
     * @dev The event is triggered during the `burnFrom` function.
     * It includes the account, the amount of tokens, and the reason.
     */

    event TokensBurnedFromAccount(
        address indexed account,
        uint256 indexed amount,
        string indexed reason
    );

    /**
     * @dev The event is triggered during the `redeemBackedToken` function.
     * It includes the account and the amount of tokens.
     */

    event TokensRedeemed(
        address indexed account,
        uint256 indexed amount
    );

    /**
     * @dev The event is triggered during the `issueBackedToken` function.
     * It includes the account and the amount of tokens.
     */

    event TokensIssued(
        address indexed account,
        uint256 indexed amount
    );


    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /** 
    * @notice `initialize` function gives values to variables when the contract deploys.
    * @param name the name of the token this contract distributes.
    * @param symbol the symbol of the token this contract distributes.
    * @param havenFoundation can remove/add operator roles.
    * @param networkOperator can pause/unpause the contract set to true to allow an address to be whitelisted 
    * or false to remove privileges.
    * @dev The `OPERATOR_ROLE can be given after deployment by calling `grantRole(role, address)`
    *     Ex: `grantRole(OPERATOR_ROLE, 0x1d2B794563Bf90c6e53B56b215502b8aE4c42fF8)` 
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
     * @notice `pause` is a function to pause sending/depositing/withdrawing of tokens from contract.
     * The `whenNotPaused` modifier will read the contract's state and not allow functions accordingly.
     * @dev Only operator role can do this given in constructor or by calling grantRole(OPERATOR_ROLE, <ADDRESS>).
     */

    function pause() external onlyRole(OPERATOR_ROLE) {
        _pause();
    }

    /**
     * @notice `unpause` allows contract functions with the `whenNotPaused` modifier
     * to continue to run after the contract was previously paused and allow
     * sending/depositing/withdrawing tokens from the contract.
     */

    function unpause() external onlyRole(OPERATOR_ROLE) {
        _unpause();
    }

    /**
     * @notice `redeemBackedToken` function to redeem backed tokens for Haven1.
     * It is managed by the network operator
     * @param amount number of tokens to be redeemed.
     * @dev Function does not work when paused.
     * @dev If  the amount is higher than the balance of the address an error reading "BALANCE_TOO_LOW" will be returned.
     * @dev Only OPERATOR role can do this given in constructor or by calling grantRole(OPERATOR_ROLE, <ADDRESS>).
     */

    function redeemBackedToken(uint256 amount) external whenNotPaused {
        require(
            balanceOf(msg.sender) >= amount,
            Errors.INSUFFICIENT_TOKEN_BALANCE
        );
        _burn(msg.sender, amount);
        emit TokensRedeemed(msg.sender, amount);
    }

    /**
     * @notice `burnFrom` this function will be used to provide additional onChain security on Haven1.
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
     * @notice `issueBackedToken` this function Function to issue backed tokens for Haven1, managed by the network operator.
     * @param to address to receive the tokens.
     * @param amount number of tokens to be received.
     * @dev Function does not work when paused.
     * @dev If an address is blacklisted via `setBlackListAddress` it cannot recieve tokens.
     * @dev If isWhiteListContract is set to true addresses must be whitelisted via `setWhiteListAddress`.
     * @dev Only THE OPERATOR role can do this an address can obtain that role in the initialize
     * function or by calling grantRole(OPERATOR_ROLE, <ADDRESS>).
     */
    function issueBackedToken(
        address to,
        uint256 amount
    ) external whenNotPaused onlyRole(OPERATOR_ROLE) {
        _mint(to, amount);
        emit TokensIssued(to, amount);
    }

    /**
    @notice `isContract` this function checks an address to ensure it is a contract not a wallet.
    @param _addr the address to be checked for if it is a contract or not.
    @dev It returns true if the input is a contract.
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
     * @notice `_approve` overrides ERC-20's function to approve addresses.
     * This function does not allow wallets to be approved only contracts.
     * @param spender is the address being approved to move other wallets tokens.
     * @param amount the number of tokens they send on behalf of the owner.
     */
    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal virtual override {
        require(isContract(spender) == true, Errors.ONLY_APPROVES_CONTRACTS);
        super._approve(owner, spender, amount);
    }

    /**
    @notice `_authorizeUpgrade` function to upgrade contract override to protect.
    @param newImplementation new implementation address.
    */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    /**
    @notice `_beforeTokenTransfer` is called when using ERC-20 standard transferring functions.
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
