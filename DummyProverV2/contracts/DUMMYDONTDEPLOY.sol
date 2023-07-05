// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

interface IPermissionsInterface {
    function assignAccountRole(
        address _account,
        string calldata _orgId,
        string calldata _roleId
    ) external;
}

contract DummyPermissionsContract is IPermissionsInterface {


    constructor(){}

    mapping(address => AccountRole) public _accountRole;



    struct AccountRole {
        string orgId;
        string roleId;
    }

function updateAccountStatus(
    string calldata reason,
    address account,
    uint256 number
        ) public {}


function assignAccountRole(
        address _account,
        string calldata _orgId,
        string calldata _roleId
) public override
{
    AccountRole storage accountRole = _accountRole[_account];
        accountRole.orgId = _orgId;
        accountRole.roleId = _roleId;

}

}