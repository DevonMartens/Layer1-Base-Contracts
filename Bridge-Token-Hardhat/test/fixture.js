const { expect } = require("chai");
const { ethers } = require("hardhat");

const { expectRevert } = require("@openzeppelin/test-helpers");

// module.exports = (async () => {
//     const [owners, alices, randoms, bobs] = await ethers.getSigners();
//     const ContractDeployer = await owners.getAddress();
//     const  Address2 = await alices.getAddress();
//     const Address3 = await randoms.getAddress();
//     const Address4 = await bobs.getAddress();
//     const BackedHRC20Factory = await ethers.getContractFactory("BackedHRC20");
//     const  BackedHRC20OwnerAdminOperator = await upgrades.deployProxy(
//         BackedHRC20Factory,
//       ["HAVEN1", "HRC20", owner, owner],
//       { initializer: "initialize", kind: "uups" }
//     )
//     //getting alice ability to sign
//     const secondAddressSigner = await ethers.getSigner(Address2);
//     const Address2SignsBackedHRC20OwnerAdminOperator = BackedHRC20OwnerAdminOperator.connect(secondAddressSigner);
//     //getting FROM for accesscontrol errors
//     const Address2ErrorMessageForAccessControl= Address2.toLowerCase();
//     const ContractDeployerErrorMessageForAccessControl = ContractDeployer.toLowerCase();
//       //getting access control role
//     const OPERATOR_ROLE = await BackedHRC20OwnerAdminOperator.OPERATOR_ROLE();
//     const DEFAULT_ADMIN_ROLE = await BackedHRC20OwnerAdminOperator.DEFAULT_ADMIN_ROLE();
//     return {
//         BackedHRC20Factory,
//         BackedHRC20Contract,
//         ContractDeployer,
//         Address2,
//         Address3,
//         Address4,
//         Address2SignsBackedHRC20OwnerAdminOperator,
//         ContractDeployerErrorMessageForAccessControl,
//         Address2ErrorMessageForAccessControl,
//         OPERATOR_ROLE,
//         DEFAULT_ADMIN_ROLE
//     };
// })
// const DefineContract = async () => {
// //const  = () => {

//     const [owners, alices, randoms, bobs] = await ethers.getSigners();
//     const ContractDeployer = await owners.getAddress();
//     const  Address2 = await alices.getAddress();
//     const Address3 = await randoms.getAddress();
//     const Address4 = await bobs.getAddress();
//     const BackedHRC20Factory = await ethers.getContractFactory("BackedHRC20");
//     const  BackedHRC20Contract = await upgrades.deployProxy(
//         BackedHRC20Factory,
//       ["HAVEN1", "HRC20", ContractDeployer, ContractDeployer],
//       { initializer: "initialize", kind: "uups" }
//     )
//     //getting alice ability to sign
//     const secondAddressSigner = await ethers.getSigner(Address2);
//     const Address2SignsBackedHRC20 = BackedHRC20OContract.connect(secondAddressSigner);
//     //getting FROM for accesscontrol errors
//     const Address2ErrorMessageForAccessControl= Address2.toLowerCase();
//     const ContractDeployerErrorMessageForAccessControl = ContractDeployer.toLowerCase();
//       //getting access control role
//     const OPERATOR_ROLE = await BackedHRC20Contract.OPERATOR_ROLE();
//     const DEFAULT_ADMIN_ROLE = await BackedHRC20Contract.DEFAULT_ADMIN_ROLE();
//     return {
//         BackedHRC20Factory,
//         BackedHRC20Contract,
//         ContractDeployer,
//         Address2,
//         Address3,
//         Address4,
//         Address2SignsBackedHRC20,
//         ContractDeployerErrorMessageForAccessControl,
//         Address2ErrorMessageForAccessControl,
//         OPERATOR_ROLE,
//         DEFAULT_ADMIN_ROLE
//     };
//   }

// module.exports = { DefineContract  }
