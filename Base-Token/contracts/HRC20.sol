// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "./Errors.sol";


/**
* @title HRC20
* @author Haven1 Development Team
* @notice This contract serves a vital purpose in facilitating token 
* transactions on Haven1 for users who prioritize the security of their cold storage vaults.
* @dev The core functionality of this contract is to be an import for developers who wish to build tokens.
*/
abstract contract HRC20 is ERC20, AccessControl, ERC20Permit, Pausable {

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
