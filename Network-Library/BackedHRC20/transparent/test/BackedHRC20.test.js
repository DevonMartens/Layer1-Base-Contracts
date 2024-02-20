const { expect } = require("chai");
const { ethers } = require("hardhat");
const { Signer, Wallet } = require("ethers");
require("dotenv").config();

const { expectRevert } = require("@openzeppelin/test-helpers");

//permit test
const { fromRpcSig } = require("ethereumjs-util");
const web3 = require("web3");

const defaultSender = "0x7102dc57665234F8d68Fcf84F31f45263c59c3b3";
const defaultKey = process.env["PrivateKey"];
// second Builder default account
const ONE_ETH = ethers.utils.parseUnits("1", "ether");

describe("BackedHRC20 Haven1 Token Contract", async () => {
  let ContractDeployer;
  let Address2;
  let BackedHRC20Factory;
  let BackedHRC20Contract;
  let Address2SignsBackedHRC20;
  let AdminAddress;
  beforeEach(async () => {
    const [owners, Address2s] = await ethers.getSigners();
    ContractDeployer = await owners.getAddress();
    Address2 = await Address2s.getAddress();
    BackedHRC20Factory = await ethers.getContractFactory("BackedHRC20");
    BackedHRC20Contract = await upgrades.deployProxy(
      BackedHRC20Factory,
      ["HAVEN1", "HRC20", 8, ContractDeployer, ContractDeployer],
      { initializer: "initialize"}
    );
    //getting Address2 ability to sign
    const secondAddressSigner = await ethers.getSigner(Address2);
    Address2SignsBackedHRC20 = BackedHRC20Contract.connect(secondAddressSigner);
    const currentImplementationAddress = await upgrades.erc1967.getImplementationAddress(BackedHRC20Contract.address);
   AdminAddress = await upgrades.erc1967.getAdminAddress(BackedHRC20Contract.address);
  });
  describe("Testing the initial values to validate expected contract state", function () {
    it("Backed HRC20: name & symbol variables should match constructor input for the ERC20 token", async () => {
      //confirm they are equal to the value set in the constructor
      expect(await BackedHRC20Contract.name()).to.equal("HAVEN1");
      //confirm they are equal to the value set in the constructor
      expect(await BackedHRC20Contract.symbol()).to.equal("HRC20");
    });
    it("Backed HRC20: the amount of tokens minted should equal totalSupply", async () => {
      expect(await BackedHRC20Contract.totalSupply()).to.equal(0);
    });
    it("Backed HRC20: initialize should only be called upon deployment and afterwards it should not be possible to call", async () => {
      await expectRevert(
        BackedHRC20Contract.initialize(
          "HAVEN1",
          "HRC20",
          8,
          ContractDeployer,
          ContractDeployer
        ),
        "Initializable: contract is already initialized"
      );
    });
  });
  describe("Testing the issueToken, burnFrom, and redeemBackedToken functions", function () {
    beforeEach(async () => {
      await BackedHRC20Contract.issueBackedToken(ContractDeployer, 900);
      await BackedHRC20Contract.issueBackedToken(Address2, 900);
    });
    it("Backed HRC20: the issueBackedToken function should mint the correct amount of tokens to the designated wallet assigned when the function is called", async () => {
      expect(await BackedHRC20Contract.balanceOf(ContractDeployer)).to.equal(
        900
      );
      expect(await BackedHRC20Contract.balanceOf(Address2)).to.equal(900);
    });
    it("Backed HRC20: the redeemBackedToken function should burn the correct amount of tokens from the designated wallet", async () => {
      await BackedHRC20Contract.redeemBackedToken(900);
      expect(await BackedHRC20Contract.balanceOf(ContractDeployer)).to.equal(0);
    });
    it("Backed HRC20: the redeemBackedToken function should revert and give the error 'ERC20: burn amount exceeds balance' if a request is made to burn more tokens than the balance of the address", async () => {
      await expectRevert(
        BackedHRC20Contract.redeemBackedToken(ContractDeployer),
        'ERC20: burn amount exceeds balance'
      );
    });
    it("Backed HRC20: the redeemBackedToken function should burn the correct amount of tokens from the designated wallet", async () => {
      await Address2SignsBackedHRC20.redeemBackedToken(900);
      expect(await BackedHRC20Contract.balanceOf(Address2)).to.equal(0);
    });
    it("Backed HRC20: the redeemBackedToken function should revert and give the error 'ERC20: burn amount exceeds balance' if a request is made to withdraw more than the balance", async () => {
      await expectRevert(
        Address2SignsBackedHRC20.redeemBackedToken(Address2),
        'ERC20: burn amount exceeds balance'
      );
    });
    it("Backed HRC20: burnFrom function should remove tokens from a wallet", async () => {
      await BackedHRC20Contract.burnFrom(Address2, 900, "YOU_STOLE_THAT");
      expect(await BackedHRC20Contract.balanceOf(Address2)).to.equal(0);
    });
  });
  describe("Testing the pause and unpause functions", function () {
    beforeEach(async () => {
      // mints tokens to ensure proper balances for functions attempted
      await BackedHRC20Contract.issueBackedToken(Address2, 10000);
      await Address2SignsBackedHRC20.redeemBackedToken(450);
      // pauses contract
      await BackedHRC20Contract.pause();
    });
    it("Backed HRC20: the pause function should stop all deposits from the issueBackedToken function", async () => {
      await expectRevert(
        BackedHRC20Contract.issueBackedToken(Address2, 900),
        "Pausable: paused"
      );
    });
    it("Backed HRC20: the pause function should stop all users from calling redeemBackedToken", async () => {
      await expectRevert(
        Address2SignsBackedHRC20.redeemBackedToken(450),
        "Pausable: paused"
      );
    });
    it("Backed HRC20: the pause function should stop all transfers", async () => {
      await expectRevert(
        BackedHRC20Contract.transfer(ContractDeployer, 450),
        "Pausable: paused"
      );
    });
  });
  describe("Testing Access Control and OpenZepplin approvals work as expected", function () {
    let ContractDeployerErrorMessageForAccessControl;
    let Address2ErrorMessageForAccessControl;
    let OPERATOR_ROLE;
    let DEFAULT_ADMIN_ROLE;
    let BackedHRC20HasDifferentAdmins;
    let BackedHRC20HasDifferentAdmins_DEFAULT_ADMIN_ROLE;
    beforeEach(async () => {
      Address2ErrorMessageForAccessControl = Address2.toLowerCase();
      ContractDeployerErrorMessageForAccessControl =
        ContractDeployer.toLowerCase();
      // Getting access control roles
      OPERATOR_ROLE = await BackedHRC20Contract.OPERATOR_ROLE();
      DEFAULT_ADMIN_ROLE = await BackedHRC20Contract.DEFAULT_ADMIN_ROLE();
      // Deploys another contract
      BackedHRC20HasDifferentAdmins = await upgrades.deployProxy(
        BackedHRC20Factory,
        ["HAVEN1", "HRC20", 8, Address2, Address2],
        { initializer: "initialize"}
      );
      BackedHRC20HasDifferentAdmins_DEFAULT_ADMIN_ROLE =
        await BackedHRC20HasDifferentAdmins.DEFAULT_ADMIN_ROLE();
    });
    it("Backed HRC20: decimals() should return the amount of decimals passed into intializer", async () => {
      expect(await BackedHRC20Contract.decimals()).to.equal(
        8
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
    it("Backed HRC20: only the DEFAULT_ADMIN_ROLE should be able to grant roles (not the contract deployer)", async () => {
      await expectRevert(
        BackedHRC20HasDifferentAdmins.grantRole(
          OPERATOR_ROLE,
          ContractDeployer
        ),
        `AccessControl: account ${ContractDeployerErrorMessageForAccessControl} is missing role ${BackedHRC20HasDifferentAdmins_DEFAULT_ADMIN_ROLE}`
      );
    });
  it("Backed HRC20:: admin should be deployer", async () => {

      const TransparentUpgradeableProxy = await ethers.getContractFactory("ProxyAdmin");
      const TransparentUpgradeableProxyInstance = TransparentUpgradeableProxy.attach(AdminAddress);
      const proxyAdminOwner = await TransparentUpgradeableProxyInstance.owner();
     
      expect(proxyAdminOwner).to.equal(ContractDeployer);
     // expect(AdminAddress).to.equal(Address2);
    });
    it("Backed HRC20: If a user request to approve another user to move tokens via increaseAllowance the function should revert", async () => {
      await expectRevert(
        BackedHRC20Contract.increaseAllowance(Address2, 8),
        'OnlyApprovesContracts()'
      );
      expect(
        await BackedHRC20Contract.allowance(ContractDeployer, Address2)
      ).to.equal(0);
    });
    it("Backed HRC20: an address that is not a contract should NOT be allowed to be approved by ERC20 function approve", async () => {
      await expectRevert(BackedHRC20Contract.approve(Address2, 8), 'OnlyApprovesContracts()');
      expect(
        await BackedHRC20Contract.allowance(ContractDeployer, Address2)
      ).to.equal(0);
    });
    it("Backed HRC20: A contract should not be allowed to be approved by the function increaseAllowance", async () => {
      await BackedHRC20Contract.increaseAllowance(
        BackedHRC20HasDifferentAdmins.address,
        8
      );
      expect(
        await BackedHRC20Contract.allowance(
          ContractDeployer,
          BackedHRC20HasDifferentAdmins.address
        )
      ).to.equal(8);
    });
    it("Backed HRC20: A contract should not be allowed to be approved by the function approve", async () => {
      await BackedHRC20Contract.approve(
        BackedHRC20HasDifferentAdmins.address,
        8
      );
      expect(
        await BackedHRC20Contract.allowance(
          ContractDeployer,
          BackedHRC20HasDifferentAdmins.address
        )
      ).to.equal(8);
    });
    it("Backed HRC20: The permit function should not allow contracts to be approved", async () => {
      const provider = hre.ethers.provider;
      const owner = defaultSender;
      const spender = Address2;
      const nonce = await BackedHRC20Contract.nonces(defaultSender);
      const maxDeadline = 49035734057903;
      //use keys
      const defaulAddressSigner = new Wallet(defaultKey, provider);
      const defaultSignsBackedHRC20 =
        BackedHRC20Contract.connect(defaulAddressSigner);
      const ContractDeployerSendsH1 = await ethers.getSigner(ContractDeployer);

      await BackedHRC20Contract.issueBackedToken(defaultSender, 12);
      await ContractDeployerSendsH1.sendTransaction({
        to: defaultSender,
        value: ONE_ETH,
      });

      const message = web3.utils.soliditySha3(
        owner,
        spender,
        1,
        nonce,
        maxDeadline
      );

      const signatureObject = await web3.eth.accounts.sign(message, defaultKey);

      const { v, r, s } = fromRpcSig(signatureObject.signature);

      await expectRevert.unspecified(
        defaultSignsBackedHRC20.permit(owner, spender, 1, maxDeadline, v, r, s)
      );
    });
  });
});
