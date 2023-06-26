// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "./Errors.sol";

/// @title ValidatorRewards
/// @notice This contract ensures fees are sent the validator addresses.
/// @dev The primary function of this contract is disperse funds from Haven applications.

contract ValidatorRewards is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    /**
     * @dev Event for when a new Validator is added. Includes their address and total shares.
     */
    event ValidatorAdded(address account, uint256 shares);

    /**
     * @dev Event for when shares are adjusted.
     */
    event SharesAdjusted(address validator, uint256 shares);

    /**
     * @dev Event for when the validator address is changed. Used in `adjustValidatorAddress`.
     */
    event UpdatedValidator(
        address indexed previousValidatorRewardAddress,
        address indexed newValidatorRewardAddress
    );

    /**
     * @dev Event for when a validator receives a payment.
     */
    event PaymentReleased(address indexed to, uint256 indexed amount);

    // Sum of all shares collectively held by addresses for division of H1.
    uint256 private _totalShares;

    // Sum of all H1 collectively released.
    uint256 private _totalReleased;

    // Mapping between an address and the number of shares of H1 it receives.
    // Payment = _shares/_totalShares * contract balance.
    mapping(address => uint256) private _shares;

    // Mapping between an address and how much H1 it has received.
    mapping(address => uint256) private _released;

    // Array of all the addresses that receive H1.
    address[] private _validators;

    // Role to control contract distribution.
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

    // Role to upgrade contract
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    /**
   @notice contract deploys with a list of validator addresses and their total shares.
   @param validatorsList an array of validators to accept fees.
   @param shares_ an array
   @param admin the address that can grant and remove permissions.
   @param distributor the address that calls restricted functions in the contract.
   @dev the shares for each address are the amount over the total amount for all addresses.
   */
    function initialize(
        address[] memory validatorsList,
        uint256[] memory shares_,
        address admin,
        address distributor,
        address upgrader
    ) external initializer {
        _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(DISTRIBUTOR_ROLE, distributor);
        _grantRole(UPGRADER_ROLE, upgrader);
        __AccessControl_init();
        __UUPSUpgradeable_init();
        for (uint256 i = 0; i < validatorsList.length; i++) {
            _validators.push(validatorsList[i]);
            _shares[validatorsList[i]] = shares_[i];
            _totalShares = _totalShares + shares_[i];
        }
    }

    /**
     * @notice Function to receive tokens.
     */
    receive() external payable {}

    /**
   @notice This function adjusts the total number of shares received by an address.
   @param account the address that the share number should be adjusted for.
   @param shares_ the new share number for the account.
   */

    function adjustValidatorShares(
        address account,
        uint256 shares_
    ) external onlyRole(DISTRIBUTOR_ROLE) {
        require(isOriginalAddress(account) == false, Errors.NO_DUPLICATES);
        require(shares_ > 0, Errors.ZERO_VARIABLE_NOT_ACCEPTED);
        _totalShares -= _shares[account];
        _totalShares += shares_;
        _shares[account] = shares_;
        emit SharesAdjusted(account, shares_);
    }

    /**
   @notice Trades out one validator for another.
   @param _index the index in the validator address in the array.
   @param _newValidatorRewardAddress The number of shares owned by the payee.
   */

    function adjustValidatorAddress(
        uint256 _index,
        address _newValidatorRewardAddress
    ) external onlyRole(DISTRIBUTOR_ROLE) {
        require(
            _newValidatorRewardAddress != address(0),
            Errors.INVALID_ADDRESS
        );
        address previousAddress = _validators[_index];
        uint256 sharesAdjusted = _shares[previousAddress];
        _shares[previousAddress] = 0;
        _shares[_newValidatorRewardAddress] = sharesAdjusted;
        _validators[_index] = _newValidatorRewardAddress;
        emit UpdatedValidator(previousAddress, _newValidatorRewardAddress);
    }

    /**
   @notice Add a new validator to the contract.
   @param account The address of the payee to add.
   @param shares_ The number of shares owned by the payee.
   */
    function addValidator(
        address account,
        uint256 shares_
    ) external onlyRole(DISTRIBUTOR_ROLE) {
        require(account != address(0), Errors.ZERO_ADDRESS_NOT_VALID_ARGUMENT);
        require(shares_ > 0, Errors.ZERO_VARIABLE_NOT_ACCEPTED);
        require(_shares[account] == 0, Errors.ADDRESS_ALREADY_HAS_A_VALUE);

        _validators.push(account);
        _shares[account] = shares_;
        _totalShares = _totalShares + shares_;
        emit ValidatorAdded(account, shares_);
    }

    /**
   @notice Getter for the total shares held by validators.
   */
    function totalShares() public view returns (uint256) {
        return _totalShares;
    }

    /**
   @notice Getter for the total amount of Wrapped H1 already released.
   */
    function totalReleased() public view returns (uint256) {
        return _totalReleased;
    }

    /**
   @notice Getter for the amount of shares held by an account.
   @param account the account to check the share amount.
   */
    function shares(address account) public view returns (uint256) {
        return _shares[account];
    }

    /**
   @notice Getter for the amount of Wrapped H1 already released to a payee.
   @param account is the account to check the share amount.
   */
    function released(address account) public view returns (uint256) {
        return _released[account];
    }

    /**
   @notice Getter for the address of the validator number position of the array of validators.
   @param index the index in the array.
   */
    function validators(uint256 index) public view returns (address) {
        return _validators[index];
    }

    /**
   @notice Getter for the amount of validator's Wrapped H1 in contract.
   @param account the account to check the amount of total received and released amount.
   */
    function releasable(address account) public view returns (uint256) {
        uint256 totalReceived = address(this).balance + totalReleased();
        return _pendingPayment(account, totalReceived, released(account));
    }

    /**
     * @notice Triggers a transfer to `account` of the amount of Wrapped H1 they are owed,
     * according to their percentage of the total shares and their previous withdrawals.
     * @param account the account to check the amount of total received and released amount.
     */

    function release(address payable account) public {
        require(_shares[account] > 0, Errors.ACCOUNT_HAS_NO_SHARES);
        uint256 payment = releasable(account);

        _totalReleased += payment;
        unchecked {
            _released[account] += payment;
        }

        Address.sendValue(account, payment);
        emit PaymentReleased(account, payment);
    }

    /**
     * @dev Triggers a transfer to all validators of the amount of
     * Wrapped H1 they are owed, according to their percentage of the total shares and their previous withdrawals.
     */

    function releaseAll() external {
        for (uint i; i < _validators.length; i++) {
            uint256 payment = releasable(_validators[i]);
            _totalReleased += payment;
            unchecked {
                _released[_validators[i]] += payment;
            }
            address payable account = payable(address(_validators[i]));
            Address.sendValue(account, payment);
            emit PaymentReleased(_validators[i], payment);
        }
    }

    /**
   @notice This view function checks if the address is in the validatorList array.
   @param validator the address for in the validatorsList.
   @dev It is used in functions above to ensure no duplicate addresses are added to the validatorList.
   */

    function isOriginalAddress(address validator) public view returns (bool) {
        for (uint i = 0; i < _validators.length; i++) {
            if (_validators[i] == validator) {
                return false;
            }
        }
        return true;
    }

    /**
   @notice Function to upgrade contract override to protect.
   @param newImplementation new implementation address.
   */

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}

    /**
     * @notice internal logic for computing the pending payment of an `account`
     * given the token historical balances and already released amounts.
     * @param account the account to check the amount of total received and released amount.
     * @param totalReceived the account to check the amount of total received and released amount.
     * @param alreadyReleased the account to check the amount of total received and released amount.
     */

    function _pendingPayment(
        address account,
        uint256 totalReceived,
        uint256 alreadyReleased
    ) private view returns (uint256) {
        return
            (totalReceived * _shares[account]) / _totalShares - alreadyReleased;
    }
}
