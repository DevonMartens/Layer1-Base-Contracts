const { expect } = require("chai");
const { ethers } = require("hardhat");

const { expectRevert } = require("@openzeppelin/test-helpers");

describe("Testing the initial values to validate expected contract state", function () {
  let ContractDeployer;
  let Address2;
  let BackedHRC20Factory;
  let BackedHRC20Contract;
  let Address2SignsBackedHRC20;
  let ContractDeployerErrorMessageForAccessControl;
  let Address2ErrorMessageForAccessControl;
  let OPERATOR_ROLE;
  let DEFAULT_ADMIN_ROLE;
  beforeEach(async () => {
    const [owners, alices] = await ethers.getSigners();
    ContractDeployer = await owners.getAddress();
    Address2 = await alices.getAddress();
    BackedHRC20Factory = await ethers.getContractFactory("BackedHRC20");
    BackedHRC20Contract = await upgrades.deployProxy(
      BackedHRC20Factory,
      ["HAVEN1", "HRC20", ContractDeployer, ContractDeployer],
      { initializer: "initialize", kind: "uups" }
    );
    //getting Address2 ability to sign
    const secondAddressSigner = await ethers.getSigner(Address2);
    Address2SignsBackedHRC20 = BackedHRC20Contract.connect(secondAddressSigner);
    //getting FROM for accesscontrol errors
    Address2ErrorMessageForAccessControl = Address2.toLowerCase();
    ContractDeployerErrorMessageForAccessControl =
      ContractDeployer.toLowerCase();
    //getting access control role
    OPERATOR_ROLE = await BackedHRC20Contract.OPERATOR_ROLE();
    DEFAULT_ADMIN_ROLE = await BackedHRC20Contract.DEFAULT_ADMIN_ROLE();
    await BackedHRC20Contract.issueBackedToken(ContractDeployer, 900);
  });
  it("Backed HRC20: name & symbol variables should match constructor input for the ERC20 token", async () => {
    //confirm they are eqaul to the value set in the constructor
    expect(await BackedHRC20Contract.name()).to.equal("HAVEN1");
    //confirm they are eqaul to the value set in the constructor
    expect(await BackedHRC20Contract.symbol()).to.equal("HRC20");
  });
  it("Backed HRC20: the amount of tokens minted should equal totalSupply", async () => {
    expect(await BackedHRC20Contract.totalSupply()).to.equal(900);
  });
  it("Backed HRC20: initalize should only be called upon deployment and afterwards it should not be possible to call", async () => {
    await expectRevert(
      BackedHRC20Contract.initialize(
        "HAVEN1",
        "HRC20",
        ContractDeployer,
        ContractDeployer
      ),
      "Initializable: contract is already initialized"
    );
  });

  it("Backed HRC20: the issueBackedToken function should mint the correct amount of tokens to the designated wallet assigned when the function is called", async () => {
    expect(await BackedHRC20Contract.balanceOf(ContractDeployer)).to.equal(900);
  });
  it("Backed HRC20: the redeemBackedTokenfunction should burn the correct amount of tokens from the designated wallet", async () => {
    await BackedHRC20Contract.redeemBackedToken(900);
    expect(await BackedHRC20Contract.balanceOf(ContractDeployer)).to.equal(0);
  });
  it("Backed HRC20: the redeemBackedToken function should revert and give the error INSUFFICENT_BALANCE if a request is made to burn more tokens than the balance of the address", async () => {
    await expectRevert(
      BackedHRC20Contract.redeemBackedToken(ContractDeployer),
      `110`
    );
  });
  it("Backed HRC20: function pause function should stop all deposits from the issueBackedToken function", async () => {
    await BackedHRC20Contract.pause();
    await expectRevert(
      BackedHRC20Contract.issueBackedToken(Address2, 900),
      "Pausable: paused"
    );
  });
  it("Backed HRC20: function pause function should stop all users from calling redeemBackedToken", async () => {
    await BackedHRC20Contract.issueBackedToken(Address2, 900);
    //ensure withdraw works as expected
    await Address2SignsBackedHRC20.redeemBackedToken(450);
    //now pause the contract
    await BackedHRC20Contract.pause();
    await expectRevert(
      Address2SignsBackedHRC20.redeemBackedToken(450),
      "Pausable: paused"
    );
  });
  it("Backed HRC20: function pause function should stop all transfers", async () => {
    await BackedHRC20Contract.pause();
    await expectRevert(
      BackedHRC20Contract.transfer(ContractDeployer, 450),
      "Pausable: paused"
    );
  });
  it("Backed HRC20: only the OPERATOR_ROLE should be able to pause and unpause the contract", async () => {
    await expectRevert(
      Address2SignsBackedHRC20.pause(),
      `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
    );
    await BackedHRC20Contract.pause();
    await expectRevert(
      Address2SignsBackedHRC20.unpause(),
      `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
    );
    await BackedHRC20Contract.unpause();
  });
  it("Backed HRC20: the operator role should be able to call pause", async () => {
    await expectRevert(
      Address2SignsBackedHRC20.pause(),
      `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
    );
    await BackedHRC20Contract.grantRole(OPERATOR_ROLE, Address2);
    await Address2SignsBackedHRC20.pause();
  });
  it("Backed HRC20: only the operator role should be able to call burnFrom ", async () => {
    await BackedHRC20Contract.issueBackedToken(ContractDeployer, 70);
    await expectRevert(
      Address2SignsBackedHRC20.burnFrom(
        ContractDeployer,
        70,
        "I_WANT_TO_BURN_IT_ALL_DOWN!"
      ),
      `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
    );
  });
  it("Backed HRC20: only the operator role should be able to call issueBackedToken", async () => {
    await expectRevert(
      Address2SignsBackedHRC20.issueBackedToken(ContractDeployer, 70),
      `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
    );
  });
  it("Backed HRC20: upgrades should only be allowed to be called by DEFAULT_ADMIN_ROLE", async function () {
    const HRC20HasADifferentUpgrader = await upgrades.deployProxy(
      BackedHRC20Factory,
      ["HAVEN1", "HRC20", Address2, Address2],
      { initializer: "initialize", kind: "uups" }
    );
    await expectRevert(
      upgrades.upgradeProxy(
        HRC20HasADifferentUpgrader.address,
        BackedHRC20Factory,
        {
          kind: "uups",
        }
      ),
      `AccessControl: account ${ContractDeployerErrorMessageForAccessControl} is missing role ${DEFAULT_ADMIN_ROLE}`
    );
    await upgrades.upgradeProxy(
      BackedHRC20Contract.address,
      BackedHRC20Factory,
      {
        kind: "uups",
      }
    );
  });
  it("Backed HRC20: the issueBackedToken function should mint the correct amount of tokens to the designated wallet", async () => {
    await BackedHRC20Contract.issueBackedToken(Address2, 900);
    expect(await BackedHRC20Contract.balanceOf(Address2)).to.equal(900);
  });
  it("Backed HRC20: the withdraw function should burn the correct amount of tokens from the designated wallet", async () => {
    await BackedHRC20Contract.issueBackedToken(Address2, 900);
    await Address2SignsBackedHRC20.redeemBackedToken(900);
    expect(await BackedHRC20Contract.balanceOf(Address2)).to.equal(0);
  });
  it("Backed HRC20: the redeemBackedTokenfunction should revert and give the error INSUFFICIENT_BALANCE if a request is made to withdraw more than the balance", async () => {
    await expectRevert(
      Address2SignsBackedHRC20.redeemBackedToken(Address2),
      `110`
    );
  });
  it("Backed HRC20: burnFrom function should remove tokens from a wallet", async () => {
    await BackedHRC20Contract.issueBackedToken(Address2, 900);
    await BackedHRC20Contract.burnFrom(Address2, 900, "YOU_STOLE_THAT");
    expect(await BackedHRC20Contract.balanceOf(Address2)).to.equal(0);
  });
  it("Backed HRC20: If a user request to approve another user to move tokens via increaseAllowance the function should revert", async () => {
    await expectRevert(
      BackedHRC20Contract.increaseAllowance(Address2, 8),
      "116"
    );
    expect(
      await BackedHRC20Contract.allowance(ContractDeployer, Address2)
    ).to.equal(0);
  });
  it("Backed HRC20: an address that is not a contract should NOT be allowed to be approved by ERC20 function approve", async () => {
    await expectRevert(BackedHRC20Contract.approve(Address2, 8), "116");
    expect(
      await BackedHRC20Contract.allowance(ContractDeployer, Address2)
    ).to.equal(0);
  });
  it("Backed HRC20: A contract should not be allowed to be approved by the function increaseAllowance", async () => {
    const BackedHRC20ContractAlternateAdminAndOperators =
      await upgrades.deployProxy(
        BackedHRC20Factory,
        ["HAVEN1", "HRC20", ContractDeployer, ContractDeployer],
        { initializer: "initialize", kind: "uups" }
      );
    await BackedHRC20Contract.increaseAllowance(
      BackedHRC20ContractAlternateAdminAndOperators.address,
      8
    );
    expect(
      await BackedHRC20Contract.allowance(
        ContractDeployer,
        BackedHRC20ContractAlternateAdminAndOperators.address
      )
    ).to.equal(8);
  });
  it("Backed HRC20: A contract should not be allowed to be approved by the function approve", async () => {
    const BackedHRC20ContractAlternateAdminAndOperators =
      await upgrades.deployProxy(
        BackedHRC20Factory,
        ["HAVEN1", "HRC20", ContractDeployer, ContractDeployer],
        { initializer: "initialize", kind: "uups" }
      );
    await BackedHRC20Contract.approve(
      BackedHRC20ContractAlternateAdminAndOperators.address,
      8
    );
    expect(
      await BackedHRC20Contract.allowance(
        ContractDeployer,
        BackedHRC20ContractAlternateAdminAndOperators.address
      )
    ).to.equal(8);
  });
});
