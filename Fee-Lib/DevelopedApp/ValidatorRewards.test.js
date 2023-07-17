const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const { expectRevert } = require("@openzeppelin/test-helpers");

const TWLEVE_H1 = ethers.utils.parseUnits("12", "ether");
const TEN_H1 = ethers.utils.parseUnits("10", "ether");
const SEVEN_H1 = ethers.utils.parseUnits("7", "ether");
const SIX_H1 = ethers.utils.parseUnits("6", "ether");
const FIVE_H1 = ethers.utils.parseUnits("5", "ether");
const FOUR_H1 = ethers.utils.parseUnits("4", "ether");
const THREE_H1 = ethers.utils.parseUnits("3", "ether");
const TWO_H1 = ethers.utils.parseUnits("2", "ether");
const ONE_H1 = ethers.utils.parseUnits("1", "ether");

describe("Validator Rewards Contract", function () {
  let ContractDeployer;
  let Address3;
  let Address2;
  let Address4;
  let Address2SignsValidatorRewardsContract;
  let ValidatorRewardsFactory;
  let ValidatorContract;
  let ContractWithThreeValidatorsWeights;
  let ContractWithThreeValidatorsWeightsAddressArray;
  beforeEach(async () => {
    // Gets all Signers
    const [ContractDeployers, Address2s, Address3s, Address4s] =
      await ethers.getSigners();
    // Gets all addresses
    ContractDeployer = await ContractDeployers.getAddress();
    Address2 = await Address2s.getAddress();
    Address3 = await Address3s.getAddress();
    Address4 = await Address4s.getAddress();
    // Signiture for Address2 to sign validator rewards contract
    Address2SendsH1 = ethers.provider.getSigner(Address2);
    // Weights and Addresses for contract
    ContractWithThreeValidatorsWeights = [1, 2, 3];
    ContractWithThreeValidatorsWeightsAddressArray = [
      ContractDeployer,
      Address2,
      Address3,
    ];
    // Contract Factory
    ValidatorRewardsFactory = await ethers.getContractFactory(
      "ValidatorRewards"
    );
    ValidatorContract = await upgrades.deployProxy(
      ValidatorRewardsFactory,
      [
        ContractWithThreeValidatorsWeightsAddressArray,
        ContractWithThreeValidatorsWeights,
        ContractDeployer,
        ContractDeployer,
      ],
      { initializer: "initialize", kind: "uups" }
    );
    // ValidatorContract.address = await   s();
    //get Address2s signiture
    secondAddressSigner = await ethers.getSigner(Address2);
    Address2SignsValidatorRewardsContract =
      ValidatorContract.connect(secondAddressSigner);
  });
  describe("Validator Rewards: H1 Management", function () {
    beforeEach(async () => {
      await Address2SendsH1.sendTransaction({
        to: ValidatorContract.address,
        value: TEN_H1,
      });
    });
    it("Validator Rewards: Contract should be able to recieve H1.", async () => {
      await Address2SendsH1.sendTransaction({
        to: ValidatorContract.address,
        value: ethers.utils.parseEther("1.0"), // Sends exactly 1.0 ether
      });
    });
    it("Validator Rewards: Contract function should disperseAllPaymentsToValidators() should distribute H1 as intended - via disperseAllPaymentsToValidators view function `dispersed` also should track the distribution.", async () => {
      //release funds
      await Address2SignsValidatorRewardsContract.disperseAllPaymentsToValidators();
      //get Address3s info
      expect(await ValidatorContract.dispersed(Address3)).to.equal(FIVE_H1);
    });
    it("Validator Rewards: Contract should distribute H1 as intended - via disperseSinglePaymentToValidator function for a single user.", async () => {
      // send two eth to the contract
      await Address2SendsH1.sendTransaction({
        to: ValidatorContract.address,
        value: TWO_H1,
      });
      //check contract balance
      expect(
        await ethers.provider.getBalance(ValidatorContract.address)
      ).to.equal(TWLEVE_H1);
      // Checks if any H1 was dispered
      expect(await ValidatorContract.dispersed(Address3)).to.equal(0);
      // //release funds
      await Address2SignsValidatorRewardsContract.disperseSinglePaymentToValidator(
        Address3
      );
      // get Address3s info afer release 1/ = 2/12
      expect(await ValidatorContract.dispersed(Address3)).to.equal(SIX_H1);
    });
    it("Validator Rewards: Contract function disperseSinglePaymentToValidator should revert if the user has no shares.", async () => {
      await expectRevert(
        Address2SignsValidatorRewardsContract.disperseSinglePaymentToValidator(
          Address4
        ),
        "126"
      );
    });
    it("Validator Rewards: The validators function should return the validators address from the array index.", async () => {
      expect(await ValidatorContract.validators(0)).to.equal(ContractDeployer);
      expect(await ValidatorContract.validators(1)).to.equal(Address2);
    });
  });
  describe("Validator Rewards: Testing the view functions ", function () {
    it("Validator Rewards: The function totalShares should return the sum of all of the shares.", async () => {
      expect(await ValidatorContract.totalShares()).to.equal(6);
    });
    it("Validator Rewards: The view function totalH1Issued() should account for the amount of Ether distributed from the contract.", async () => {
      await Address2SendsH1.sendTransaction({
        to: ValidatorContract.address,
        value: TEN_H1,
      });
      // Sends funds to validators reward contract
      await Address2SignsValidatorRewardsContract.disperseAllPaymentsToValidators();
      const totalH1IssuedFromValidatorRewards =
        await ValidatorContract.totalH1Issued();
      // 10 H1 minus gas from sending is "9999999999999999999" to aviod big compared via strings
      expect(totalH1IssuedFromValidatorRewards.toString()).to.equal(
        "9999999999999999999"
      );
    });
    it("Validator Rewards: The view function shares() should return the number of shares each account holds.", async () => {
      expect(await ValidatorContract.shares(ContractDeployer)).to.equal(1);
      expect(await ValidatorContract.shares(Address2)).to.equal(2);
      expect(await ValidatorContract.shares(Address3)).to.equal(3);
    });
    it("Validator Rewards: The view function releasable() should return the amount of ether each reciepnt can get.", async () => {
      // Sends contracts funds so that funds can be dispersed
      await Address2SendsH1.sendTransaction({
        to: ValidatorContract.address,
        value: SIX_H1,
      });
      //checks how much ContractDeployer Address2 and Address3 should get
      expect(await ValidatorContract.releasable(ContractDeployer)).to.equal(
        ONE_H1
      );
      expect(await ValidatorContract.releasable(Address2)).to.equal(TWO_H1);
      expect(await ValidatorContract.releasable(Address3)).to.equal(THREE_H1);
    });
    it("Validator Rewards: The view isTheAddressInTheValidatorsArray should return false if the address is in the validators array.", async () => {
      expect(
        await ValidatorContract.isTheAddressInTheValidatorsArray(Address2)
      ).to.equal(false);
      expect(
        await ValidatorContract.isTheAddressInTheValidatorsArray(Address4)
      ).to.equal(true);
    });
  });
  describe("Validator Rewards: Validator management adding (addValidator) and adjusting functions (adjustValidator).", function () {
    it("Validator Rewards: The adjustValidatorShares function  should adjust the totalShares, validator shares, and pay the new address.", async () => {
      // Confirms that the current state of the contract has 6 shares total.
      expect(await ValidatorContract.totalShares()).to.equal(6);
      // Adjusts Contract Deployers shares from 1 to 2
      await ValidatorContract.adjustValidatorShares(ContractDeployer, 2);
      // Checks updated state and value for totalShares
      expect(await ValidatorContract.totalShares()).to.equal(7);
      // Confirms Contract deployers shares changed
      expect(await ValidatorContract.shares(ContractDeployer)).to.equal(2);
    });
    it("Validator Rewards: The adjustValidatorShares function should change the diserpsal of H1 payments.", async () => {
      // Adjusts Contract Deployers shares from 1 to 2
      await ValidatorContract.adjustValidatorShares(ContractDeployer, 2);
      // Sends H1 to the contract.
      await Address2SendsH1.sendTransaction({
        to: ValidatorContract.address,
        value: SEVEN_H1,
      });
      //call release all
      await Address2SignsValidatorRewardsContract.disperseAllPaymentsToValidators();
      //get ContractDeployer release info
      expect(await ValidatorContract.dispersed(ContractDeployer)).to.equal(
        TWO_H1
      );
    });
    it("Validator Rewards: The adjustValidatorShares will revert if the address is already in the validaotors array.", async () => {
      await expectRevert(
        ValidatorContract.adjustValidatorShares(Address4, 23),
        "127"
      );
    });
    it("Validator Rewards: The adjustValidatorShares will revert if someoneone puts in a zero for share numbers.", async () => {
      await expectRevert(
        ValidatorContract.adjustValidatorShares(Address3, 0),
        "128"
      );
    });
    it("Validator Rewards: The adjustValidatorAddress should adjust validator address that recieves payment.", async () => {
      expect(await ValidatorContract.shares(Address3)).to.equal(3);
      //giving ContractDeployer shares to joe
      await ValidatorContract.adjustValidatorAddress(2, Address4);
      //checking ContractDeployer shares to ensure they are gone, because Address4 has them
      expect(await ValidatorContract.shares(Address3)).to.equal(0);
      await Address2SendsH1.sendTransaction({
        to: ValidatorContract.address,
        value: SIX_H1,
      });
      //verify ContractDeployer gets none of that - no releaseable H1
      expect(await ValidatorContract.releasable(Address3)).to.equal(0);
      await ValidatorContract.disperseAllPaymentsToValidators();
      //checks what ContractDeployer got - should be none
      expect(await ValidatorContract.dispersed(Address3)).to.equal(0);
      // //checks what Address4 got - should be one eth
      expect(await ValidatorContract.dispersed(Address4)).to.equal(THREE_H1);
    });
    it("Validator Rewards: The adjustValidatorAddress should adjust validator address that recieves payment.", async () => {
      await expectRevert(
        ValidatorContract.adjustValidatorAddress(
          1,
          "0x0000000000000000000000000000000000000000"
        ),
        "123"
      );
    });
    it("Validator Rewards: The addValidator should change the dispersed payments and totalShares amounts and correctly pay all validators.", async () => {
      await Address2SendsH1.sendTransaction({
        to: ValidatorContract.address,
        value: SIX_H1,
      });
      //Address3s ether owned
      expect(await ValidatorContract.releasable(Address3)).to.equal(THREE_H1);
      // //Address2 owed
      expect(await ValidatorContract.releasable(Address2)).to.equal(TWO_H1);
      //brings contract to three eth so all expected splits are maintained
      await Address2SendsH1.sendTransaction({
        to: ValidatorContract.address,
        value: FOUR_H1,
      });
      await ValidatorContract.addValidator(Address4, 4);
      // ContractDeployer owed
      expect(await ValidatorContract.releasable(ContractDeployer)).to.equal(
        ONE_H1
      );
      //Address2 owed
      expect(await ValidatorContract.releasable(Address2)).to.equal(TWO_H1);
      // gets expected splits for every user
      expect(await ValidatorContract.releasable(Address3)).to.equal(THREE_H1);
      //Address4
      expect(await ValidatorContract.releasable(Address4)).to.equal(FOUR_H1);
    });
    it("Validator Rewards: The Validator Rewards: removeValidator should change the array position of validators.", async () => {
      await ValidatorContract.removeValidator(Address2, 1);
      //Address2 owed
      expect(await ValidatorContract.validators(1)).not.to.equal(Address2);
      //check total shares should be 3
      expect(await ValidatorContract.validators(1)).to.equal(Address3);
    });
    it("Validator Rewards: The removeValidator should change the dispersed payments and totalShares amounts and correctly pay all validators.", async () => {
      await Address2SendsH1.sendTransaction({
        to: ValidatorContract.address,
        value: SIX_H1,
      });
      //Address3s ether owned
      expect(await ValidatorContract.releasable(Address3)).to.equal(THREE_H1);
      // //Address2 owed
      expect(await ValidatorContract.releasable(Address2)).to.equal(TWO_H1);
      //removes address three at position 2
      await ValidatorContract.removeValidator(Address3, 2);
      // ContractDeployer owed
      expect(await ValidatorContract.releasable(ContractDeployer)).to.equal(
        TWO_H1
      );
      //Address2 owed
      expect(await ValidatorContract.releasable(Address2)).to.equal(FOUR_H1);
      //check total shares should be 3
      expect(await ValidatorContract.totalShares()).to.equal(3);
    });
    it("Validator Rewards: The removeValidator should change the dispersed payments and totalShares amounts and correctly pay all validators.", async () => {
      //removes address four which is not in the array
      await expectRevert(ValidatorContract.removeValidator(Address4, 2), "123");
      // ContractDeployer owed
    });
    it("Validator Rewards: The addValidator should revert if someone tries to add a 0 address.", async () => {
      await expectRevert(
        ValidatorContract.addValidator(
          "0x0000000000000000000000000000000000000000",
          1
        ),
        "105"
      );
    });
    it("Validator Rewards: The addValidator should revert if someone tries to add a 0 shares.", async () => {
      await expectRevert(ValidatorContract.addValidator(Address4, 0), "128");
    });
    it("Validator Rewards: The addValidator should revert if an address already has shares.", async () => {
      await expectRevert(
        ValidatorContract.addValidator(ContractDeployer, 1),
        "129"
      );
    });
  });
  describe("Validator Rewards: AccessControl in the contract.", function () {
    let OPERATOR_ROLE;
    let Address2ErrorMessageForAccessControl;
    let DEFAULT_ADMIN_ROLE;
    let FromContractDeployer;
    beforeEach(async () => {
      Address2ErrorMessageForAccessControl = Address2.toLowerCase();
      FromContractDeployer = ContractDeployer.toLowerCase();
      OPERATOR_ROLE = await ValidatorContract.OPERATOR_ROLE();
      DEFAULT_ADMIN_ROLE = await ValidatorContract.DEFAULT_ADMIN_ROLE();
    });
    it("Validator Rewards: The initalize should only be called upon deployment.", async () => {
      await expectRevert(
        ValidatorContract.initialize(
          ContractWithThreeValidatorsWeightsAddressArray,
          ContractWithThreeValidatorsWeights,
          Address4,
          Address4
        ),
        "Initializable: contract is already initialized"
      );
    });
    it("Validator Rewards: Contract upgrades should only be allowed to be called by DEFAULT_ADMIN_ROLE.", async function () {
      const ValidatorContractHasADifferentUpgrader = await upgrades.deployProxy(
        ValidatorRewardsFactory,
        [
          ContractWithThreeValidatorsWeightsAddressArray,
          ContractWithThreeValidatorsWeights,
          Address2,
          Address2,
        ],
        { initializer: "initialize", kind: "uups" }
      );
      await expectRevert(
        upgrades.upgradeProxy(
          ValidatorContractHasADifferentUpgrader.address,
          ValidatorRewardsFactory,
          {
            kind: "uups",
          }
        ),
        `AccessControl: account ${FromContractDeployer} is missing role ${DEFAULT_ADMIN_ROLE}`
      );
      await upgrades.upgradeProxy(
        ValidatorContract.address,
        ValidatorRewardsFactory,
        {
          kind: "uups",
        }
      );
    });
    it("Validator Rewards: The adjustValidatorShares function should only be called by an address with the OPERATOR_ROLE.", async () => {
      await expectRevert(
        Address2SignsValidatorRewardsContract.adjustValidatorShares(
          ContractDeployer,
          2
        ),
        `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("Validator Rewards: The removeValidator function should only be successfully called by the OPERATOR_ROLE.", async () => {
      await expectRevert(
        Address2SignsValidatorRewardsContract.removeValidator(
          ContractDeployer,
          2
        ),
        `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("Validator Rewards: The adjustValidatorShares function should adjust the shars of an address.", async () => {
      await ValidatorContract.adjustValidatorShares(ContractDeployer, 2);
      expect(await ValidatorContract.shares(ContractDeployer)).to.equal(2);
    });
    it("Validator Rewards: The adjustValidatorAddress function should only be called by OPERATOR_ROLE.", async () => {
      await expectRevert(
        Address2SignsValidatorRewardsContract.adjustValidatorAddress(
          0,
          Address2
        ),
        `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("Validator Rewards: The addValidator function should only be called by OPERATOR_ROLE", async () => {
      await expectRevert(
        Address2SignsValidatorRewardsContract.addValidator(Address4, 75),
        `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("Validator Rewards: If an address is not the DEFAULT_ADMIN_ROLE it should not be able to adjust the OPERATOR_ROLE.", async () => {
      await expectRevert(
        Address2SignsValidatorRewardsContract.grantRole(
          OPERATOR_ROLE,
          Address3
        ),
        `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${DEFAULT_ADMIN_ROLE}`
      );
    });
  });
});
