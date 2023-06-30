const { expect } = require("chai");
const { ethers } = require("hardhat");
const {loadFixture} = require("ethereum-waffle");

const { expectRevert } = require("@openzeppelin/test-helpers");


describe("Testing the initial values to validate expected contract state", function () {
  let H;
  let ContractDeployer;
  let BackedHRC20Factory;
  beforeEach(async () => {
  const [owners, alices, randoms, bobs] = await ethers.getSigners();
  ContractDeployer = await owners.getAddress();
  Address2 = await alices.getAddress();
  Address3 = await randoms.getAddress();
  Address4 = await bobs.getAddress();
  BackedHRC20Factory = await ethers.getContractFactory("BackedHRC20");
  BackedHRC20OwnerAdminOperator = await upgrades.deployProxy(
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
  });
 
  it("The contract: have correct values for name & symbol", async () => {
    //confirm they are eqaul to the value set in the constructor
    expect(await BackedHRC20Contract.name()).to.equal("HAVEN1");
    //confirm they are eqaul to the value set in the constructor
    expect(await DBackedHRC20Contract.symbol()).to.equal("HRC20");
  });
  it("Upon deployment no NFTs should be minted so the inital value should be 0 totalSupply", async () => {
    expect(await BackedHRC20Contract.totalSupply()).to.equal(0);
  });
  it("initalize should only be called upon deployment", async () => {
    await expectRevert(
      BackedHRC20Contract.initialize("HAVEN1", "HRC20", owner, owner),
      "Initializable: contract is already initialized"
    );
  });
});
describe("Testing the deposit and withdraw functions", function () {
  let hrc20;
  let H;
  let owner;
  let alice;
  beforeEach(async () => {
    const [owners, alices] = await ethers.getSigners();
    owner = await owners.getAddress();
    alice = await alices.getAddress();
    hrc20 = await ethers.getContractFactory("BackedHRC20");
    H = await upgrades.deployProxy(hrc20, ["HAVEN1", "HRC20", owner, owner], {
      initializer: "initialize",
      kind: "uups",
    });
    await BackedHRC20Contract.issueBackedToken(owner, 900);
  });
  it("The contract: the deposit function should mint the correct amount of tokens to the designated wallet", async () => {
    expect(await BackedHRC20Contract.balanceOf(owner)).to.equal(900);
  });
  it("The contract: the withdraw function should burn the correct amount of tokens from the designated wallet", async () => {
    await BackedHRC20Contract.redeemBackedToken(900);
    expect(await BackedHRC20Contract.balanceOf(owner)).to.equal(0);
  });
  it("The contract: the withdraw function should revert and give the error INSUFFICENT_BALANCE if a request is made to withdraw more than the balance", async () => {
    await expectRevert(BackedHRC20Contract.redeemBackedToken(owner), `110`);
  });
  // it("The contract: function deposit function should not allow deposits if `isWhiteListContract` is true & address is not on whitelist ", async () => {
  //   const HRC20HasWhiteListAliceIsNotOn = await upgrades.deployProxy(
  //     hrc20,
  //     ["HAVEN1", "HRC20", owner, owner, true],
  //     { initializer: "initialize", kind: "uups" }
  //   );
  //   await expectRevert(
  //     HRC20HasWhiteListAliceIsNotOn.deposit(alice, 1000),
  //     "117"
  //   );
  // });
});
describe("Testing the pause functionality", function () {
  let H;
  let owner;
  let alice;
  let signerAlice;
  beforeEach(async () => {
    const [owners, alices] = await ethers.getSigners();
    owner = await owners.getAddress();
    alice = await alices.getAddress();
    hrc20 = await ethers.getContractFactory("BackedHRC20");
    H = await upgrades.deployProxy(hrc20, ["HAVEN1", "HRC20", owner, owner], {
      initializer: "initialize",
      kind: "uups",
    });
    //alice signer information
    const secondAddressSigner = await ethers.getSigner(alice);
    signerAlice = BackedHRC20Contract.connect(secondAddressSigner);
    await BackedHRC20Contract.issueBackedToken(alice, 900);
    //confirms alice has balance
    expect(await BackedHRC20Contract.balanceOf(alice)).to.equal(900);
    //now pause the contract
    await BackedHRC20Contract.pause();
  });
  it("The contract: function pause function should stop all deposits", async () => {
    //try to withdraw
    await expectRevert(BackedHRC20Contract.issueBackedToken(alice, 900), "Pausable: paused");
  });
  it("The contract: function pause function should stop all withdraws", async () => {
    //unpauses since paused in before each
    await BackedHRC20Contract.unpause();
    //ensure withdraw works as expected
    await signerAlice.redeemBackedToken(450);
    //now pause the contract
    await BackedHRC20Contract.pause();
    await expectRevert(signerAlice.redeemBackedToken(450), "Pausable: paused");
  });
  it("The contract: function pause function should stop all sends", async () => {
    await expectRevert(BackedHRC20Contract.transfer(owner, 450), "Pausable: paused");
  });
});
describe("Testing Access Control Functionality", function () {
  let H;
  let owner;
  let alice;
  let signerAlice;
  let FROM;
  let FromOwner;
  let OPERATOR_ROLE;
  let DEFAULT_ADMIN_ROLE;
  let hrc20;
  let secondAddressSigner;
  beforeEach(async () => {
    const [owners, alices, randoms, bobs] = await ethers.getSigners();
    owner = await owners.getAddress();
    alice = await alices.getAddress();
    random = await randoms.getAddress();
    bob = await bobs.getAddress();
    hrc20 = await ethers.getContractFactory("BackedHRC20");
    H = await upgrades.deployProxy(hrc20, ["HAVEN1", "HRC20", owner, owner], {
      initializer: "initialize",
      kind: "uups",
    });
    //getting alice ability to sign
    secondAddressSigner = await ethers.getSigner(alice);
    signerAlice = H.connect(secondAddressSigner);
    //getting FROM for accesscontrol errors
    FROM = alice.toLowerCase();
    FromOwner = owner.toLowerCase();
    //getting access control role
    OPERATOR_ROLE = await H.OPERATOR_ROLE();
    DEFAULT_ADMIN_ROLE = await H.DEFAULT_ADMIN_ROLE();
  });
  // it("The contract: minting/withdrawing/blacklisting/whitelsiting should only be allowed by the OPERATOR_ROLE     ", async () => {
  //   await H.issueBackedToken(alice, 900);
  //   await expectRevert(
  //     signerAlice.issueBackedToken(owner, 225),
  //     `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
  //   );
  // await expectRevert(
  //   signerAlice.setBlackListAddress(alice, true),
  //   `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
  // );
  // await expectRevert(
  //   signerAlice.withdraw(225),
  //   `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
  // );
  // await expectRevert(
  //   signerAlice.setWhiteListAddress(alice, true),
  //   `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
  // );
  //   const friends = [owner, random];
  //   await expectRevert(
  //     signerAlice.setMultipleWhiteListAddresses(friends),
  //     `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
  //   );
  //   await expectRevert(
  //     signerAlice.setWhiteListActive(true),
  //     `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
  //   );
  // });
  it("only the OPERATOR_ROLE should be able to pause unpause   ", async () => {
    await expectRevert(
      signerAlice.pause(),
      `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
    );
    await H.pause();
    await expectRevert(
      signerAlice.unpause(),
      `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
    );
    await H.unpause();
  });
  it("the operator role should be able to call pause", async () => {
    await expectRevert(
      signerAlice.pause(),
      `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
    );
    await H.grantRole(OPERATOR_ROLE, alice);
    await signerAlice.pause();
  });
  //hi
  it("The contract: only the operator role should be able to call burnFrom ", async () => {
    await H.issueBackedToken(owner, 70);
    await expectRevert(
      signerAlice.burnFrom(owner, 70, "I_WANT_TO_BURN_IT_ALL_DOWN!"),
      `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
    );
  });
  it("The contract: only the operator role should be able to call issueBackedToken", async () => {
    await expectRevert(
      signerAlice.issueBackedToken(owner, 70),
      `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
    );
  });
  it("upgrades should only be allowed to be called by DEFAULT_ADMIN_ROLE", async function () {
    const HRC20HasADifferentUpgrader = await upgrades.deployProxy(
      hrc20,
      ["HAVEN1", "HRC20", alice, alice],
      { initializer: "initialize", kind: "uups" }
    );
    await expectRevert(
      upgrades.upgradeProxy(HRC20HasADifferentUpgrader.address, hrc20, {
        kind: "uups",
      }),
      `AccessControl: account ${FromOwner} is missing role ${DEFAULT_ADMIN_ROLE}`
    );
    const HRC20V2 = await upgrades.upgradeProxy(H.address, hrc20, {
      kind: "uups",
    });
  });
});
describe("Testing the deposit and withdraw functions", function () {
  let hrc20;
  let H;
  let owner;
  let alice;
  let signerAlice;
  beforeEach(async () => {
    const [owners, alices] = await ethers.getSigners();
    owner = await owners.getAddress();
    alice = await alices.getAddress();
    hrc20 = await ethers.getContractFactory("BackedHRC20");
    H = await upgrades.deployProxy(hrc20, ["HAVEN1", "HRC20", owner, owner], {
      initializer: "initialize",
      kind: "uups",
    });
    await H.issueBackedToken(alice, 900);
    secondAddressSigner = await ethers.getSigner(alice);
    signerAlice = H.connect(secondAddressSigner);
  });
  it("The contract: the deposit function should mint the correct amount of tokens to the designated wallet", async () => {
    expect(await H.balanceOf(alice)).to.equal(900);
  });
  it("The contract: the withdraw function should burn the correct amount of tokens from the designated wallet", async () => {
    await signerAlice.redeemBackedToken(900);
    expect(await H.balanceOf(alice)).to.equal(0);
  });
  it("The contract: the withdraw function should revert and give the error BALANCE_TOO_LOW if a request is made to withdraw more than the balance", async () => {
    await expectRevert(signerAlice.redeemBackedToken(alice), `110`);
  });
  it("The contract: burnFrom function should remove tokens from a wallet", async () => {
    await H.burnFrom(alice, 900, "YOU_STOLE_THAT");
    expect(await H.balanceOf(alice)).to.equal(0);
  });
  //function burnFrom(address target, uint256 amount) external onlyRole(OPERATOR_ROLE) {
  // _burn(target, amount);
  //}
});
//   it("The contract: function deposit function should not allow deposits if `isWhiteListContract` is true & address is not on whitelist ", async () => {
//     const HRC20HasWhiteListAliceIsNotOn = await upgrades.deployProxy(
//       hrc20,
//       ["HAVEN1", "HRC20", owner, owner, true],
//       { initializer: "initialize", kind: "uups" }
//     );
//     await expectRevert(
//       HRC20HasWhiteListAliceIsNotOn.deposit(alice, 1000),
//       "117"
//     );
//   });
// });
describe("Testing approvals", function () {
  let hrc20;
  let H;
  let owner;
  let alice;
  let TestContractForApprovals;
  beforeEach(async () => {
    const [owners, alices] = await ethers.getSigners();
    owner = await owners.getAddress();
    alice = await alices.getAddress();
    hrc20 = await ethers.getContractFactory("BackedHRC20");
    H = await upgrades.deployProxy(hrc20, ["HAVEN1", "HRC20", owner, owner], {
      initializer: "initialize",
      kind: "uups",
    });

    TestContractForApprovals = await upgrades.deployProxy(
      hrc20,
      ["NOT_A_PROBLEM", "CONTRACT", owner, alice],
      { initializer: "initialize", kind: "uups" }
    );

    await H.issueBackedToken(owner, 900);
  });
  it("A wallet that is not a contract should not be allowed to be approved by the function increaseAllowance", async () => {
    await expectRevert(H.increaseAllowance(alice, 8), "116");
    expect(await H.allowance(owner, alice)).to.equal(0);
  });
  it("A wallet that is not a contract  not be allowed to be approved by the function approve", async () => {
    await expectRevert(H.approve(alice, 8), "116");
    expect(await H.allowance(owner, alice)).to.equal(0);
  });
  it("A contract should not be allowed to be approved by the function increaseAllowance", async () => {
    await H.increaseAllowance(TestContractForApprovals.address, 8);
    expect(await H.allowance(owner, TestContractForApprovals.address)).to.equal(
      8
    );
  });
  it("A contract should not be allowed to be approved by the function approve", async () => {
    await H.approve(TestContractForApprovals.address, 8);
    expect(await H.allowance(owner, TestContractForApprovals.address)).to.equal(
      8
    );
  });
});
