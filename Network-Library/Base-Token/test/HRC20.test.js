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

describe("HRC20 Haven1 Token Contract", async () => {
  let ContractDeployer;
  let Address2;
  let BaseHRC20Factory;
  let BaseHRC20Contract;
  let Address2SignsBaseHRC20;
  beforeEach(async () => {
    const [owners, Address2s] = await ethers.getSigners();
    ContractDeployer = await owners.getAddress();
    Address2 = await Address2s.getAddress();
    BaseHRC20Factory = await ethers.getContractFactory("BaseHRC20");
    BaseHRC20Contract = await BaseHRC20Factory.deploy(
      "HAVEN1", "HRC20", 8, ContractDeployer, ContractDeployer);
    //getting Address2 ability to sign
    const secondAddressSigner = await ethers.getSigner(Address2);
    Address2SignsBaseHRC20 = BaseHRC20Contract.connect(secondAddressSigner);
  });
  describe("Testing the initial values to validate expected contract state", function () {
    it("HRC20: decimals() should return the amount of decimals passed into intializer", async () => {
      expect(await BaseHRC20Contract.decimals()).to.equal(
        8
      );
    });
    it("HRC20: name & symbol variables should match constructor input for the ERC20 token", async () => {
      //confirm they are equal to the value set in the constructor
      expect(await BaseHRC20Contract.name()).to.equal("HAVEN1");
      //confirm they are equal to the value set in the constructor
      expect(await BaseHRC20Contract.symbol()).to.equal("HRC20");
    });
    it("HRC20: the amount of tokens minted should equal totalSupply", async () => {
      expect(await BaseHRC20Contract.totalSupply()).to.equal(0);
    });
  });
  describe("Testing the mintToken, burnFrom, and burnToken functions", function () {
    beforeEach(async () => {
      await BaseHRC20Contract.mintToken(ContractDeployer, 900);
      await BaseHRC20Contract.mintToken(Address2, 900);
    });
    it("HRC20: the mintToken function should mint the correct amount of tokens to the designated wallet assigned when the function is called", async () => {
      expect(await BaseHRC20Contract.balanceOf(ContractDeployer)).to.equal(
        900
      );
      expect(await BaseHRC20Contract.balanceOf(Address2)).to.equal(900);
    });
    it("HRC20: the burnToken function should burn the correct amount of tokens from the designated wallet", async () => {
      await BaseHRC20Contract.burnToken(900);
      expect(await BaseHRC20Contract.balanceOf(ContractDeployer)).to.equal(0);
    });
    it("HRC20: the burnToken function should revert and give the error ERC20: burn amount exceeds balance if a request is made to burn more tokens than the balance of the address", async () => {
      await expectRevert(
        BaseHRC20Contract.burnToken(ContractDeployer),
        `ERC20: burn amount exceeds balance`
      );
    });
    it("HRC20: the burnToken function should burn the correct amount of tokens from the designated wallet", async () => {
      await Address2SignsBaseHRC20.burnToken(900);
      expect(await BaseHRC20Contract.balanceOf(Address2)).to.equal(0);
    });
    it("HRC20: the burnToken function should revert and give the error ERC20: burn amount exceeds balance if a request is made to withdraw more than the balance", async () => {
      await expectRevert(
        Address2SignsBaseHRC20.burnToken(Address2),
        `ERC20: burn amount exceeds balance`
      );
    });
    it("HRC20: burnFrom function should remove tokens from a wallet", async () => {
      await BaseHRC20Contract.burnFrom(Address2, 900, "YOU_STOLE_THAT");
      expect(await BaseHRC20Contract.balanceOf(Address2)).to.equal(0);
    });
  });
  describe("Testing the pause and unpause functions", function () {
    beforeEach(async () => {
      // mints tokens to ensure proper balances for functions attempted
      await BaseHRC20Contract.mintToken(Address2, 10000);
      await Address2SignsBaseHRC20.burnToken(450);
      // pauses contract
      await BaseHRC20Contract.pause();
    });
    it("HRC20: the pause function should stop all deposits from the mintToken function", async () => {
      await expectRevert(
        BaseHRC20Contract.mintToken(Address2, 900),
        "Pausable: paused"
      );
    });
    it("HRC20: the pause function should stop all users from calling burnToken", async () => {
      await expectRevert(
        Address2SignsBaseHRC20.burnToken(450),
        "Pausable: paused"
      );
    });
    it("HRC20: the pause function should stop all transfers", async () => {
      await expectRevert(
        BaseHRC20Contract.transfer(ContractDeployer, 450),
        "Pausable: paused"
      );
    });
  });
  describe("Testing Access Control and OpenZepplin approvals work as expected", function () {
    let ContractDeployerErrorMessageForAccessControl;
    let Address2ErrorMessageForAccessControl;
    let OPERATOR_ROLE;
    let DEFAULT_ADMIN_ROLE;
    let BaseHRC20HasDifferentAdmins;
    let BaseHRC20HasDifferentAdmins_DEFAULT_ADMIN_ROLE;
    beforeEach(async () => {
      Address2ErrorMessageForAccessControl = Address2.toLowerCase();
      ContractDeployerErrorMessageForAccessControl =
        ContractDeployer.toLowerCase();
      // Getting access control roles
      OPERATOR_ROLE = await BaseHRC20Contract.OPERATOR_ROLE();
      DEFAULT_ADMIN_ROLE = await BaseHRC20Contract.DEFAULT_ADMIN_ROLE();
      // Deploys another contract
      BaseHRC20HasDifferentAdmins = await BaseHRC20Factory.deploy("HAVEN1", "HRC20", 8, Address2, Address2);
      BaseHRC20HasDifferentAdmins_DEFAULT_ADMIN_ROLE =
        await BaseHRC20HasDifferentAdmins.DEFAULT_ADMIN_ROLE();
    });
    it("HRC20: only the OPERATOR_ROLE should be able to pause and unpause the contract", async () => {
      await expectRevert(
        Address2SignsBaseHRC20.pause(),
        `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
      await BaseHRC20Contract.pause();
      await expectRevert(
        Address2SignsBaseHRC20.unpause(),
        `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
      await BaseHRC20Contract.unpause();
    });
    it("HRC20: the operator role should be able to call pause", async () => {
      await expectRevert(
        Address2SignsBaseHRC20.pause(),
        `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
      await BaseHRC20Contract.grantRole(OPERATOR_ROLE, Address2);
      await Address2SignsBaseHRC20.pause();
    });
    it("HRC20: only the operator role should be able to call burnFrom ", async () => {
      await BaseHRC20Contract.mintToken(ContractDeployer, 70);
      await expectRevert(
        Address2SignsBaseHRC20.burnFrom(
          ContractDeployer,
          70,
          "I_WANT_TO_BURN_IT_ALL_DOWN!"
        ),
        `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("HRC20: only the operator role should be able to call mintToken", async () => {
      await expectRevert(
        Address2SignsBaseHRC20.mintToken(ContractDeployer, 70),
        `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("HRC20: only the DEFAULT_ADMIN_ROLE should be able to grant roles (not the contract deployer)", async () => {
      await expectRevert(
        BaseHRC20HasDifferentAdmins.grantRole(
          OPERATOR_ROLE,
          ContractDeployer
        ),
        `AccessControl: account ${ContractDeployerErrorMessageForAccessControl} is missing role ${BaseHRC20HasDifferentAdmins_DEFAULT_ADMIN_ROLE}`
      );
    });
    it("HRC20: If a user request to approve another user to move tokens via increaseAllowance the function should revert", async () => {
      await expectRevert(
        BaseHRC20Contract.increaseAllowance(Address2, 8),
        "OnlyApprovesContracts()"
      );
      expect(
        await BaseHRC20Contract.allowance(ContractDeployer, Address2)
      ).to.equal(0);
    });
    it("HRC20: an address that is not a contract should NOT be allowed to be approved by ERC20 function approve", async () => {
      await expectRevert(BaseHRC20Contract.approve(Address2, 8), "OnlyApprovesContracts()");
      expect(
        await BaseHRC20Contract.allowance(ContractDeployer, Address2)
      ).to.equal(0);
    });
    it("HRC20: A contract should not be allowed to be approved by the function increaseAllowance", async () => {
      await BaseHRC20Contract.increaseAllowance(
        BaseHRC20HasDifferentAdmins.address,
        8
      );
      expect(
        await BaseHRC20Contract.allowance(
          ContractDeployer,
          BaseHRC20HasDifferentAdmins.address
        )
      ).to.equal(8);
    });
    it("HRC20: A contract should not be allowed to be approved by the function approve", async () => {
      await BaseHRC20Contract.approve(
        BaseHRC20HasDifferentAdmins.address,
        8
      );
      expect(
        await BaseHRC20Contract.allowance(
          ContractDeployer,
          BaseHRC20HasDifferentAdmins.address
        )
      ).to.equal(8);
    });
    it("HRC20: The permit function should not allow contracts to be approved", async () => {
      const provider = hre.ethers.provider;
      const owner = defaultSender;
      const spender = Address2;
      const nonce = await BaseHRC20Contract.nonces(defaultSender);
      const maxDeadline = 49035734057903;
      //use keys
      const defaulAddressSigner = new Wallet(defaultKey, provider);
      const defaultSignsBaseHRC20 =
        BaseHRC20Contract.connect(defaulAddressSigner);
      const ContractDeployerSendsH1 = await ethers.getSigner(ContractDeployer);

      await BaseHRC20Contract.mintToken(defaultSender, 12);
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
        defaultSignsBaseHRC20.permit(owner, spender, 1, maxDeadline, v, r, s)
      );
    });
  });
});
