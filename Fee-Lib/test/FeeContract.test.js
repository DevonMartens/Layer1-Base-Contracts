const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const { expectRevert } = require("@openzeppelin/test-helpers");

const SIX_ETH = ethers.utils.parseUnits("6", "ether");
const TWO_ETH = ethers.utils.parseUnits("2", "ether");
const ONE_ETH = ethers.utils.parseUnits("1", "ether");

describe("Fee Contract: Testing the initial values to validate expected contract state", function () {
  let ContractDeployer;
  let Address2;
  let Address3;
  let Address4;
  let ValidatorRewardsFactory;
  let ValidatorContract;
  let ValidatorContract2;
  let ValidatorContract3;
  let FeeContractFactory;
  let FeeContract;
  let FeeOracleContract;
  let BlockTimeStampFeeContractDeployed;
  let ContractDeployerArray;
  let SingleWeightArray;
  let Address3SendsH1;
  let Address3SignsFeeContractWith3Validators;
  beforeEach(async () => {
    // Gets all addresses and signers
    const [ContractDeployers, Address2s, Address3s, Address4s] =
      await ethers.getSigners();
    ContractDeployer = await ContractDeployers.getAddress();
    Address2 = await Address2s.getAddress();
    Address3 = await Address3s.getAddress();
    Address4 = await Address4s.getAddress();
    // Single Address Array to deploy contracts
    ContractDeployerArray = await [ContractDeployer];
    //example SingleWeightArray 100% of bounty 1/1
    SingleWeightArray = [1];
    // Get contract Factories
    ValidatorRewardsFactory = await ethers.getContractFactory(
      "ValidatorRewards"
    );
    FeeContractFactory = await ethers.getContractFactory("FeeContract");
    const FeeOracleFactory = await ethers.getContractFactory("FeeOracle");
    // Deploy needed Contracts
    FeeOracleContract = await FeeOracleFactory.deploy();
    ValidatorContract = await upgrades.deployProxy(
      ValidatorRewardsFactory,
      [
        ContractDeployerArray,
        SingleWeightArray,
        ContractDeployer,
        ContractDeployer,
      ],
      { initializer: "initialize", kind: "uups" }
    );
    ValidatorContract2 = await upgrades.deployProxy(
      ValidatorRewardsFactory,
      [
        ContractDeployerArray,
        SingleWeightArray,
        ContractDeployer,
        ContractDeployer,
      ],
      { initializer: "initialize", kind: "uups" }
    );
    ValidatorContract3 = await upgrades.deployProxy(
      ValidatorRewardsFactory,
      [
        ContractDeployerArray,
        SingleWeightArray,
        ContractDeployer,
        ContractDeployer,
      ],
      { initializer: "initialize", kind: "uups" }
    );
    const ThreeValidatorArray = [
      ValidatorContract.address,
      ValidatorContract2.address,
      ValidatorContract3.address,
    ];
    const ThreeWeightsArray = [1, 2, 3];
    FeeContractWith3Validators = await upgrades.deployProxy(
      FeeContractFactory,
      [
        FeeOracleContract.address,
        ThreeValidatorArray,
        ThreeWeightsArray,
        ContractDeployer,
        ContractDeployer,
      ],
      { initializer: "initialize", kind: "uups" }
    );
    FeeContract = await upgrades.deployProxy(
      FeeContractFactory,
      [
        FeeOracleContract.address,
        ContractDeployerArray,
        SingleWeightArray,
        ContractDeployer,
        ContractDeployer,
      ],
      { initializer: "initialize", kind: "uups" }
    );
    BlockTimeStampFeeContractDeployed = await time.latest();
    Address3SendsH1 = await ethers.getSigner(Address3);
    const Address3Signer = await ethers.getSigner(Address3);
    Address3SignsFeeContractWith3Validators =
      FeeContractWith3Validators.connect(Address3Signer);
  });
  describe("Fee Contract: Testing the initial values to validate expected contract state", function () {
    it("The FeeContract should have correct values for wieght and channel (view functions getWieght and getChannel also confirmed)", async () => {
      expect(await FeeContract.getChannels()).to.deep.equal(
        ContractDeployerArray
      );
      expect(await FeeContract.getWieghts()).to.deep.equal(SingleWeightArray);
    });
    it("Fee Contract:: have correct values for oracle, total contract shares, and lastDistribution", async () => {
      //gets oracle from Fee contract and ensures it is equal to Address2 the original inpul
      expect(await FeeContract.getOracleAddress()).to.equal(
        FeeOracleContract.address
      );
      //gets last distribution from contract and ensures its equal to deployment time
      expect(await FeeContract.getLastDistributionBlock()).to.equal(
        BlockTimeStampFeeContractDeployed
      );
    });
    it("Fee Contract:initalize should only be called upon deployment", async () => {
      await expectRevert(
        FeeContract.initialize(
          ContractDeployer,
          ContractDeployerArray,
          SingleWeightArray,
          FeeOracleContract.address,
          FeeOracleContract.address
        ),
        "Initializable: contract is already initialized"
      );
    });
  });
  describe("Fee Contract: Adding and adjusting wieghts and channels functions", function () {
    let ValidatorContract2;
    let ValidatorContract3;
    let ValidatorContract4;
    let ValidatorContract5;
    let ValidatorContract6;
    let max5ArrayWeight;
    let max5ArrayChannel;
    let FeeContractWithMaxAddressesAndWeights;
    let FourPositionArrayFeeContract;
    beforeEach(async () => {
      //addresses for using
      max5ArrayWeight = [1, 2, 3, 4, 5];
      //validator array that is too heavey
      ValidatorContract2 = await upgrades.deployProxy(
        ValidatorRewardsFactory,
        [
          ContractDeployerArray,
          SingleWeightArray,
          ContractDeployer,
          ContractDeployer,
        ],
        { initializer: "initialize", kind: "uups" }
      );
      ValidatorContract3 = await upgrades.deployProxy(
        ValidatorRewardsFactory,
        [
          ContractDeployerArray,
          SingleWeightArray,
          ContractDeployer,
          ContractDeployer,
        ],
        { initializer: "initialize", kind: "uups" }
      );
      ValidatorContract4 = await upgrades.deployProxy(
        ValidatorRewardsFactory,
        [
          ContractDeployerArray,
          SingleWeightArray,
          ContractDeployer,
          ContractDeployer,
        ],
        { initializer: "initialize", kind: "uups" }
      );
      ValidatorContract5 = await upgrades.deployProxy(
        ValidatorRewardsFactory,
        [
          ContractDeployerArray,
          SingleWeightArray,
          ContractDeployer,
          ContractDeployer,
        ],
        { initializer: "initialize", kind: "uups" }
      );
      ValidatorContract6 = await upgrades.deployProxy(
        ValidatorRewardsFactory,
        [
          ContractDeployerArray,
          SingleWeightArray,
          ContractDeployer,
          ContractDeployer,
        ],
        { initializer: "initialize", kind: "uups" }
      );
      //channel
      max5ArrayChannel = [
        ValidatorContract.address,
        ValidatorContract2.address,
        ValidatorContract3.address,
        ValidatorContract4.address,
        ValidatorContract5.address,
      ];

      // ValidatorContract = await ValidatorRewards.deploy(ContractDeployerArray, weight, ContractDeployer, ContractDeployer)
      FeeContractWithMaxAddressesAndWeights = await upgrades.deployProxy(
        FeeContractFactory,
        [
          Address2,
          max5ArrayChannel,
          max5ArrayWeight,
          ContractDeployer,
          ContractDeployer,
        ],
        { initializer: "initialize", kind: "uups" }
      );
      FourPositionsArrayOfChannels = [
        ValidatorContract.address,
        ValidatorContract2.address,
        ValidatorContract3.address,
        ValidatorContract4.address,
      ];
      //Shorter Fee Contract
      FourPositionsArrayOfWeights = [1, 2, 3, 4, 5];
      FourPositionArrayFeeContract = await upgrades.deployProxy(
        FeeContractFactory,
        [
          Address2,
          FourPositionsArrayOfChannels,
          FourPositionsArrayOfWeights,
          ContractDeployer,
          ContractDeployer,
        ],
        { initializer: "initialize", kind: "uups" }
      );
    });

    it("Fee Contract:: should allow a max of 5 addresses and 5 wieghts (representing validator rewards) in the initalizer", async () => {
      const oversizedAddressArray = [
        ValidatorContract.address,
        ValidatorContract2.address,
        ValidatorContract3.address,
        ValidatorContract4.address,
        ValidatorContract5.address,
        ValidatorContract6.address,
      ];
      const oversizedWieghtsArray = [1, 2, 3, 4, 5, 6];
      await expectRevert(
        upgrades.deployProxy(
          FeeContractFactory,
          [
            ContractDeployer,
            oversizedAddressArray,
            oversizedWieghtsArray,
            ContractDeployer,
            ContractDeployer,
          ],
          {
            initializer: "initialize",
          }
        ),
        "124"
      );
    });
    it("Fee Contract: adjustChannel should change the correct wieght and channel", async () => {
      expect(
        await FeeContractWithMaxAddressesAndWeights.getTotalContractShares()
      ).to.equal(15);
      await FeeContractWithMaxAddressesAndWeights.adjustChannel(
        4,
        ValidatorContract6.address,
        6
      );
      const channel5ShouldHaveWeightOf6 =
        await FeeContractWithMaxAddressesAndWeights.getChannelWeightByIndex(4);
      //for wieght
      const weightOfChannel5 = await channel5ShouldHaveWeightOf6[1];
      expect(await weightOfChannel5).to.equal(6);
    });
    it("Fee Contract: adjustChannel will revert if you input an existing channel", async () => {
      await expectRevert(
        FeeContractWithMaxAddressesAndWeights.adjustChannel(
          4,
          ValidatorContract.address,
          6
        ),
        "123"
      );
    });
    it("Fee Contract: addChannel should revert if you input 0 address", async () => {
      await expectRevert(
        FourPositionArrayFeeContract.addChannel(
          "0x0000000000000000000000000000000000000000",
          6
        ),
        "123"
      );
    });
    it("Fee Contract: adjustChannel should revert if you input 0", async () => {
      await expectRevert(
        FeeContractWithMaxAddressesAndWeights.adjustChannel(
          4,
          "0x0000000000000000000000000000000000000000",
          6
        ),
        "123"
      );
    });
    it("Fee Contract: adjustChannel should revert if you input an index greater than 4", async () => {
      await expectRevert(
        FeeContractWithMaxAddressesAndWeights.adjustChannel(
          7,
          ValidatorContract6.address,
          6
        ),
        "111"
      );
    });
    it("Fee Contract: Initalize will fail if you put 6+ weights or addresses", async () => {
      await max5ArrayWeight.push(4);

      await expectRevert(
        upgrades.deployProxy(
          FeeContractFactory,
          [
            Address2,
            max5ArrayChannel,
            max5ArrayWeight,
            ContractDeployer,
            ContractDeployer,
          ],
          { initializer: "initialize", kind: "uups" }
        ),
        "124"
      );
    });
    it("Fee Contract: addChannel should allow a new channel and wieght value the adjust the contract's total shares.", async () => {
      //gets original share amount to add to to confirm adjustments
      const originalShareAmount =
        await FourPositionArrayFeeContract.getTotalContractShares();
      //add 5
      const newExpectedShareAmount = originalShareAmount + 5;
      //add a channel 5th so this should be max
      await FourPositionArrayFeeContract.addChannel(
        ValidatorContract5.address,
        5
      );
      //expect 5 to be added to old total
      expect(
        await FourPositionArrayFeeContract.getTotalContractShares()
      ).to.equal(newExpectedShareAmount);
      //confirms array is has the values of our addition for position 4
      const positionFour =
        await FourPositionArrayFeeContract.getChannelWeightByIndex(4);
      const addressOfPositionFour = positionFour[0];
      const wieghtsOfPositionFour = positionFour[1];
      //address of position 4 should be Validator Contract 5
      expect(addressOfPositionFour).to.equal(ValidatorContract5.address);
      //wieghts of position 4 should be 5
      expect(5).to.equal(wieghtsOfPositionFour);
    });
    it("Fee Contract: addChannel should not allow duplicates.", async () => {
      //add a channel 5th so this should be max
      await expectRevert(
        FourPositionArrayFeeContract.addChannel(ValidatorContract3.address, 6),
        "123"
      );
    });
    it("Fee Contract: addChannel should not allow more than 5 channels", async () => {
      await expectRevert(
        FeeContractWithMaxAddressesAndWeights.addChannel(
          ValidatorContract5.address,
          6
        ),
        "124"
      );
    });
  });
  describe("Fee Contract: Initail tests that require oracle feedback", function () {
    it("Fee Contract: Confirm Oracle is giving correct data to fee contract", async () => {
      const ValueOfQuery = await FeeContract.queryOracle();
      const Address4Value = await FeeOracleContract.consult();
      expect(ValueOfQuery).to.equal(Address4Value);
    });
    it("Fee Contract: Test CollectFee Function is sending eth to validators", async () => {
      await Address3SendsH1.sendTransaction({
        to: FeeContractWith3Validators.address,
        value: SIX_ETH,
      });
      const ExpectedPayout =
        await FeeContractWith3Validators.amountPaidToUponNextDistribution(1);
      await time.increase(time.duration.days(1));
      expect(ExpectedPayout).to.equal(TWO_ETH);
      expect(() =>
        FeeContractWith3Validators.collectFee()
      ).to.changeEtherBalance(ValidatorContract, ONE_ETH);
    });
    it("Fee Contract: Test CollectFee Function is requiring 24 hours or a Distributor role", async () => {
      await Address3SendsH1.sendTransaction({
        to: FeeContractWith3Validators.address,
        value: SIX_ETH,
      });
      const ExpectedPayout =
        await FeeContractWith3Validators.amountPaidToUponNextDistribution(1);
      expect(ExpectedPayout.toString()).to.equal(TWO_ETH.toString());
      expectRevert(Address3SignsFeeContractWith3Validators.collectFee(), "121");
      await FeeContractWith3Validators.collectFee();
    });
    it("Fee Contract: Test CollectFee Function should requiring 24 hours between calls", async () => {
      await Address3SendsH1.sendTransaction({
        to: FeeContractWith3Validators.address,
        value: SIX_ETH,
      });
      await expectRevert(
        Address3SignsFeeContractWith3Validators.collectFee(),
        "121"
      );
      await time.increase(time.duration.days(1));
      await Address3SignsFeeContractWith3Validators.collectFee();
    });
    it("Fee Contract: Test collectFee Function is requiring 24 hours", async () => {
      await Address3SendsH1.sendTransaction({
        to: FeeContractWith3Validators.address,
        value: SIX_ETH,
      });
      const ExpectedPayout =
        await FeeContractWith3Validators.amountPaidToUponNextDistribution(1);
      await time.increase(time.duration.days(1));
      expect(ExpectedPayout.toString()).to.equal(TWO_ETH.toString());
      await Address3SignsFeeContractWith3Validators.collectFee();
    });
    it("Fee Contract: Test collectFee should change the lastDistribution", async () => {
      await Address3SendsH1.sendTransaction({
        to: FeeContract.address,
        value: SIX_ETH,
      });
      const beforeLastDistribution =
        await FeeContract.getLastDistributionBlock();
      await FeeContract.collectFee();
      const afterLastDistribution =
        await FeeContract.getLastDistributionBlock();
      expect(afterLastDistribution.toString()).not.to.equal(
        beforeLastDistribution
      );
      const current = await time.latest();
      expect(afterLastDistribution.toString()).to.equal(current.toString());
    });
    it("Fee Contract: Test forceFee Function should refresh the oracle", async () => {
      await Address3SendsH1.sendTransaction({
        to: FeeContract.address,
        value: SIX_ETH,
      });
      await FeeContract.forceFee();
      expect(await FeeOracleContract.viewJustKeepAdding()).to.equal(8);
    });
    it("Fee Contract: Test forceFee should change the lastDistribution", async () => {
      await Address3SendsH1.sendTransaction({
        to: FeeContract.address,
        value: SIX_ETH,
      });
      const beforeLastDistribution =
        await FeeContract.getLastDistributionBlock();
      await FeeContract.forceFee();
      const afterLastDistribution =
        await FeeContract.getLastDistributionBlock();
      expect(afterLastDistribution.toString()).not.to.equal(
        beforeLastDistribution
      );
      const current = await time.latest();
      expect(afterLastDistribution.toString()).to.equal(current.toString());
    });
    it("Test CollectFee Function should refresh the oracle", async () => {
      await Address3SendsH1.sendTransaction({
        to: FeeContract.address,
        value: SIX_ETH,
      });
      await time.increase(time.duration.days(1));
      await FeeContract.collectFee();
      expect(await FeeOracleContract.viewJustKeepAdding()).to.equal(8);
    });
    it("Test ForceFee Function is sending eth to validators", async () => {
      await Address3SendsH1.sendTransaction({
        to: FeeContractWith3Validators.address,
        value: SIX_ETH,
      });
      expect(() => FeeContractWith3Validators.forceFee()).to.changeEtherBalance(
        ValidatorContract,
        ONE_ETH
      );
    });
  });
  describe("Fee Contract: General Getters and Setters", function () {
    let estimatedResetTime;
    beforeEach(async () => {
      const timestamp = await time.latest();
      estimatedResetTime = timestamp + 86400;
    });
    it("Fee Contract: The Reset Fee should revert if it has not been 24 hours and the fee is NOT zero", async () => {
      //sets fee so its not 0
      await FeeContract.resetFee();
      //checks that query oracle is equal to 1 the anticipated value
      expect(await FeeContract.queryOracle()).to.equal(1);
      //change the value
      await FeeOracleContract.setPriceAverage(TWO_ETH);
      //reset fee
      await expectRevert(FeeContract.resetFee(), "121");
      //checks updated value
    });
    it("Fee Contract: The Reset Fee should change Fee Value", async () => {
      //checks that query oracle is equal to 1 the anticipated value
      expect(await FeeContract.queryOracle()).to.equal(1);
      //change the value
      await FeeOracleContract.setPriceAverage(TWO_ETH);
      //wait 24 hours
      await time.increase(time.duration.days(1));
      //reset fee
      await FeeContract.resetFee();
      //checks updated value
      expect(await FeeContract.queryOracle()).to.equal(TWO_ETH);
    });
    it("Fee Contract: The Reset Fee should change the requiredReset", async () => {
      const reset = await FeeContract.getNextResetTime();
      // const testReset = reset.toString;
      expect(reset.toString()).to.be.equal(estimatedResetTime.toString());
      //wait 24 hours
      await time.increase(time.duration.days(1));
      //reset fee
      await FeeContract.resetFee();
      const newResetValue = await FeeContract.getNextResetTime();
      //add 1 second for time
      const newEstimatedResetTime = estimatedResetTime + 86401;
      //close to could be a few seconds off to account for txns
      expect(newResetValue.toString()).to.equal(
        newEstimatedResetTime.toString()
      );
    });
    it("Fee Contract: setOracle should change the oracle address", async () => {
      const firstOracle = await FeeContract.getOracleAddress();
      const OracleContractAddress = FeeOracleContract.address;
      expect(firstOracle.toString()).to.equal(OracleContractAddress.toString());
      await FeeContract.setOracle(Address2);
      const reset = await FeeContract.getOracleAddress();
      expect(reset.toString()).to.equal(Address2.toString());
    });
    it("Fee Contract: setEpoch should change the epochLength", async () => {
      const firstepochLength = await FeeContract.epochLength();
      await FeeContract.setEpoch(1);
      const reset = await FeeContract.epochLength();
      expect(reset.toString()).to.equal("1");
      expect(firstepochLength.toString()).not.to.equal(reset.toString());
    });
    it("Fee Contract: isOriginalAddress should return false if the address is in the array", async () => {
      const knownAddress = await FeeContract.isOriginalAddress(
        ContractDeployer
      );
      expect(knownAddress).to.equal(false);
    });
    it("Fee Contract: isOriginalAddress should return true if the address is in the array", async () => {
      const unknownAddress = await FeeContract.isOriginalAddress(Address4);
      expect(unknownAddress).to.equal(true);
    });
    it("Fee Contract: isOriginalAddress if/else determines true/false", async () => {
      const knownAddress = await FeeContract.isOriginalAddress(
        ContractDeployer
      );
      expect(knownAddress).to.equal(false);
      const unknownAddress = await FeeContract.isOriginalAddress(Address4);
      expect(unknownAddress).to.equal(true);
    });
  });
  describe("Fee Contract: AccessControl", function () {
    let OPERATOR_ROLE;
    let DEFAULT_ADMIN_ROLE;
    let ContractDeployerErrorMessageForAccessControl;
    let Address3ErrorMessageForAccessControl;
    beforeEach(async () => {
      ContractDeployerErrorMessageForAccessControl =
        ContractDeployer.toLowerCase();
      Address3ErrorMessageForAccessControl = Address3.toLowerCase();
      deployBlockTimeStamp = await time.latest();
      OPERATOR_ROLE = await FeeContract.OPERATOR_ROLE();
      DEFAULT_ADMIN_ROLE = await FeeContract.DEFAULT_ADMIN_ROLE();
    });
    it("Fee Contract: only addresses with OPERATOR_ROLE should be able call to setEpoch.", async () => {
      await expectRevert(
        FeeContract.connect(Address3SendsH1).setEpoch(1),
        `AccessControl: account ${Address3ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("Fee Contract: OPERATOR_ROLE should be the only one to adjust channels.", async () => {
      await expectRevert(
        FeeContract.connect(Address3SendsH1).adjustChannel(1, Address4, 75),
        `AccessControl: account ${Address3ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("Fee Contract: OPERATOR_ROLE should be the only one to adjust channels.", async () => {
      await expectRevert(
        FeeContract.connect(Address3SendsH1).addChannel(Address4, 75),
        `AccessControl: account ${Address3ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("Fee Contract: The OPERATOR_ROLE and DEFAULT_ADMIN_ROLE roles should be set upon deployment.", async () => {
      expect(
        await FeeContract.hasRole(OPERATOR_ROLE, ContractDeployer)
      ).to.equal(true);
      expect(
        await FeeContract.hasRole(DEFAULT_ADMIN_ROLE, ContractDeployer)
      ).to.equal(true);
      expect(
        await FeeContract.hasRole(DEFAULT_ADMIN_ROLE, ContractDeployer)
      ).to.equal(true);
      expect(await FeeContract.hasRole(OPERATOR_ROLE, Address2)).to.equal(
        false
      );
      expect(await FeeContract.hasRole(DEFAULT_ADMIN_ROLE, Address2)).to.equal(
        false
      );
      expect(await FeeContract.hasRole(DEFAULT_ADMIN_ROLE, Address2)).to.equal(
        false
      );
    });
    it("Fee Contract: The DEFAULT_ADMIN_ROLE can grant roles post deployment.", async () => {
      await FeeContract.grantRole(OPERATOR_ROLE, Address2);
      await FeeContract.grantRole(DEFAULT_ADMIN_ROLE, Address2);
      await FeeContract.grantRole(DEFAULT_ADMIN_ROLE, Address2);
      expect(await FeeContract.hasRole(OPERATOR_ROLE, Address2)).to.equal(true);
      expect(await FeeContract.hasRole(DEFAULT_ADMIN_ROLE, Address2)).to.equal(
        true
      );
      expect(await FeeContract.hasRole(DEFAULT_ADMIN_ROLE, Address2)).to.equal(
        true
      );
    });
    it("OPERATOR_ROLE should be the only one who can force fees", async () => {
      await expectRevert(
        FeeContract.connect(Address3SendsH1).forceFee(),
        `AccessControl: account ${Address3ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("OPERATOR_ROLE should be the only one who can setOracle address", async () => {
      await expectRevert(
        FeeContract.connect(Address3SendsH1).setOracle(ContractDeployer),
        `AccessControl: account ${Address3ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("upgrades should only be allowed to be called by DEFAULT_ADMIN_ROLE", async function () {
      const FeeContractHasADifferentUpgrader = await upgrades.deployProxy(
        FeeContractFactory,
        [
          Address2,
          ContractDeployerArray,
          SingleWeightArray,
          Address2,
          Address2,
        ],
        { initializer: "initialize", kind: "uups" }
      );
      await expectRevert(
        upgrades.upgradeProxy(
          FeeContractHasADifferentUpgrader.address,
          FeeContractFactory,
          {
            kind: "uups",
          }
        ),
        `AccessControl: account ${ContractDeployerErrorMessageForAccessControl} is missing role ${DEFAULT_ADMIN_ROLE}`
      );
      await upgrades.upgradeProxy(FeeContract.address, FeeContractFactory, {
        kind: "uups",
      });
    });
    it("upgrades should only be allowed to be called by DEFAULT_ADMIN_ROLE", async function () {
      const FeeContractHasADifferentUpgrader = await upgrades.deployProxy(
        FeeContractFactory,
        [
          Address2,
          ContractDeployerArray,
          SingleWeightArray,
          Address2,
          Address2,
        ],
        { initializer: "initialize", kind: "uups" }
      );
      await expectRevert(
        upgrades.upgradeProxy(
          FeeContractHasADifferentUpgrader.address,
          FeeContractFactory,
          {
            kind: "uups",
          }
        ),
        `AccessControl: account ${ContractDeployerErrorMessageForAccessControl} is missing role ${DEFAULT_ADMIN_ROLE}`
      );
      await upgrades.upgradeProxy(FeeContract.address, FeeContractFactory, {
        kind: "uups",
      });
    });
  });
  describe("Fee Contract: Force and collect fee functions", function () {
    it("forceFee should distribute funds regardless of sucess or failure upon an address", async () => {
      const DummyContractFactory = await ethers.getContractFactory("FeeOracle");
      const DummyContract = await DummyContractFactory.deploy();
      const InputArray = [DummyContract.address, Address3, ContractDeployer];
      const NumberArray = [1, 2, 3, 4];
      const FeeContract = await ethers.getContractFactory("FeeContract");
      const FeeContractForTest = await upgrades.deployProxy(
        FeeContract,
        [
          DummyContract.address,
          InputArray,
          NumberArray,
          ContractDeployer,
          ContractDeployer,
        ],
        { initializer: "initialize", kind: "uups" }
      );
      await expectRevert(FeeContractForTest.forceFee(), "112");
    });
    it("Fee Contract: collectFee() should revert if there is an unsuccessful transfer made)", async () => {
      const DummyContractFactory = await ethers.getContractFactory("FeeOracle");
      const DummyContract = await DummyContractFactory.deploy();
      const InputArray = [DummyContract.address, Address3, ContractDeployer];
      const NumberArray = [1, 2, 3, 4];
      const FeeContract = await ethers.getContractFactory("FeeContract");
      const FeeContractForTest = await upgrades.deployProxy(
        FeeContract,
        [
          DummyContract.address,
          InputArray,
          NumberArray,
          ContractDeployer,
          ContractDeployer,
        ],
        { initializer: "initialize", kind: "uups" }
      );
      await Address3SendsH1.sendTransaction({
        to: FeeContractForTest.address,
        value: SIX_ETH,
      });
      await expectRevert(FeeContractForTest.collectFee(), "112");
    });
    it("Fee Contract: collectFee() should revert if there are no funds to rebate gas)", async () => {
      const DummyContractFactory = await ethers.getContractFactory("FeeOracle");
      const DummyContract = await DummyContractFactory.deploy();
      const InputArray = [DummyContract.address, Address3, ContractDeployer];
      const NumberArray = [1, 2, 3, 4];
      const FeeContract = await ethers.getContractFactory("FeeContract");
      const FeeContractForTest = await upgrades.deployProxy(
        FeeContract,
        [
          DummyContract.address,
          InputArray,
          NumberArray,
          ContractDeployer,
          ContractDeployer,
        ],
        { initializer: "initialize", kind: "uups" }
      );
      await expectRevert(FeeContractForTest.collectFee(), "122");
    });
  });
});
