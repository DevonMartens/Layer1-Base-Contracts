const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const { expectRevert } = require("@openzeppelin/test-helpers");

const SIX_H1 = ethers.utils.parseUnits("6", "ether");
const TWO_H1 = ethers.utils.parseUnits("2", "ether");
const ONE_H1 = ethers.utils.parseUnits("1", "ether");

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
        1,
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
        1,
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
    it("Fee Contract: The values passed into the contructor for wieghts and channels should match the view functions getWieght and getChannel.", async () => {
      expect(await FeeContract.getChannels()).to.deep.equal(
        ContractDeployerArray
      );
      expect(await FeeContract.getWeights()).to.deep.equal(SingleWeightArray);
    });
    it("Fee Contract: The values passed into the contructor for oracle, total contract shares, and lastDistribution should match the values recieved from the view functions getOracleAddress and getOracleAddress.", async () => {
      //gets oracle from Fee contract and ensures it is equal to Address2 the original inpul
      expect(await FeeContract.getOracleAddress()).to.equal(
        FeeOracleContract.address
      );
      //gets last distribution from contract and ensures its equal to deployment time
      expect(await FeeContract.getLastDistributionBlock()).to.equal(
        BlockTimeStampFeeContractDeployed
      );
    });
    it("Fee Contract: The initalize function should only be called upon deployment.", async () => {
      await expectRevert(
        FeeContract.initialize(
          1,
          ContractDeployer,
          ContractDeployerArray,
          SingleWeightArray,
          FeeOracleContract.address,
          FeeOracleContract.address
        ),
        "Initializable: contract is already initialized"
      );
    });
    it("Fee Contract: getFee should change the get the value fee.", async () => {
      expect(await FeeContract.getFee()).to.equal(1);
    });
    it("Fee Contract: updateFee() should adjust the fee to mirror the oracle.", async () => {
      expect(await FeeContract.getFee()).to.equal(1);
      await FeeOracleContract.setPriceAverage(100);
      await FeeContract.updateFee();
      expect(await FeeContract.getFee()).to.equal(100);
    });
  });
  describe("Fee Contract: Adding and adjusting wieghts and channels functions", function () {
    let ValidatorContract2;
    let ValidatorContract3;
    let ValidatorContract4;
    let ValidatorContract5;
    let ValidatorContract6;
    let max10ArrayWeight;
    let max10ArrayChannel;
    let FeeContractWithMaxAddressesAndWeights;
    let NinePositionArrayFeeContract;
    beforeEach(async () => {
      //addresses for using
      max10ArrayWeight = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5];
      //validator array that is too heavy
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
      ValidatorContract7 = await upgrades.deployProxy(
        ValidatorRewardsFactory,
        [
          ContractDeployerArray,
          SingleWeightArray,
          ContractDeployer,
          ContractDeployer,
        ],
        { initializer: "initialize", kind: "uups" }
      );
      ValidatorContract8 = await upgrades.deployProxy(
        ValidatorRewardsFactory,
        [
          ContractDeployerArray,
          SingleWeightArray,
          ContractDeployer,
          ContractDeployer,
        ],
        { initializer: "initialize", kind: "uups" }
      );
      ValidatorContract9 = await upgrades.deployProxy(
        ValidatorRewardsFactory,
        [
          ContractDeployerArray,
          SingleWeightArray,
          ContractDeployer,
          ContractDeployer,
        ],
        { initializer: "initialize", kind: "uups" }
      );
      ValidatorContract10 = await upgrades.deployProxy(
        ValidatorRewardsFactory,
        [
          ContractDeployerArray,
          SingleWeightArray,
          ContractDeployer,
          ContractDeployer,
        ],
        { initializer: "initialize", kind: "uups" }
      );
      ValidatorContract11 = await upgrades.deployProxy(
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
      max10ArrayChannel = [
        ValidatorContract.address,
        ValidatorContract2.address,
        ValidatorContract3.address,
        ValidatorContract4.address,
        ValidatorContract5.address,
        ValidatorContract6.address,
        ValidatorContract7.address,
        ValidatorContract8.address,
        ValidatorContract9.address,
        ValidatorContract10.address,
      ];

      // ValidatorContract = await ValidatorRewards.deploy(ContractDeployerArray, weight, ContractDeployer, ContractDeployer)
      FeeContractWithMaxAddressesAndWeights = await upgrades.deployProxy(
        FeeContractFactory,
        [
          1,
          Address2,
          max10ArrayChannel,
          max10ArrayWeight,
          ContractDeployer,
          ContractDeployer,
        ],
        { initializer: "initialize", kind: "uups" }
      );
      NinePositionsArrayOfChannels = [
        ValidatorContract.address,
        ValidatorContract2.address,
        ValidatorContract3.address,
        ValidatorContract4.address,
        ValidatorContract5.address,
        ValidatorContract6.address,
        ValidatorContract7.address,
        ValidatorContract8.address,
        ValidatorContract9.address,
      ];
      //Shorter Fee Contract
      NinePositionsArrayOfWeights = [1, 2, 3, 4, 5, 1, 2, 3, 4];
      NinePositionArrayFeeContract = await upgrades.deployProxy(
        FeeContractFactory,
        [
          1,
          Address2,
          NinePositionsArrayOfChannels,
          NinePositionsArrayOfWeights,
          ContractDeployer,
          ContractDeployer,
        ],
        { initializer: "initialize", kind: "uups" }
      );
    });

    it("Fee Contract: Deployment should allow a max of 10 addresses and 10 wieghts in the initalizer function.", async () => {
      const oversizedAddressArray = [
        ValidatorContract.address,
        ValidatorContract2.address,
        ValidatorContract3.address,
        ValidatorContract4.address,
        ValidatorContract5.address,
        ValidatorContract6.address,
        ValidatorContract7.address,
        ValidatorContract8.address,
        ValidatorContract9.address,
        ValidatorContract10.address,
        ValidatorContract11.address,
      ];
      const oversizedWieghtsArray = [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5];
      await expectRevert(
        upgrades.deployProxy(
          FeeContractFactory,
          [
            1,
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
    it("Fee Contract: The adjustChannel function should change the correct wieght and channel.", async () => {
      expect(
        await FeeContractWithMaxAddressesAndWeights.getTotalContractShares()
      ).to.equal(30);
      await FeeContractWithMaxAddressesAndWeights.adjustChannel(
        4,
        ValidatorContract11.address,
        6
      );
      const channel5ShouldHaveWeightOf6 =
        await FeeContractWithMaxAddressesAndWeights.getChannelWeightByIndex(4);
      //for wieght
      const weightOfChannel5 = await channel5ShouldHaveWeightOf6[1];
      expect(await weightOfChannel5).to.equal(6);
    });
    it("Fee Contract: The removeChannelAndWeightByIndex function remove wieght, channel and subtract the total contract shares.", async () => {
      await FeeContractWithMaxAddressesAndWeights.removeChannelAndWeightByIndex(
        9
      );
      const countingArray = [1, 2, 3, 4, 5, 1, 2, 3, 4];
      expect(
        await FeeContractWithMaxAddressesAndWeights.getChannels()
      ).to.deep.equal(NinePositionsArrayOfChannels);
      expect(
        await FeeContractWithMaxAddressesAndWeights.getWeights()
      ).to.deep.equal(countingArray);
      expect(
        await FeeContractWithMaxAddressesAndWeights.getTotalContractShares()
      ).to.equal(25);
    });
    it("Fee Contract: The removeChannelAndWeightByIndex function remove wieght, channel and subtract the total contract shares from any index.", async () => {
      await FeeContractWithMaxAddressesAndWeights.removeChannelAndWeightByIndex(
        1
      );
      const countingArray = [1, 3, 4, 5, 1, 2, 3, 4, 5];
      PositionIndexOneGoneArrayOfChannels = [
        ValidatorContract.address,
        ValidatorContract3.address,
        ValidatorContract4.address,
        ValidatorContract5.address,
        ValidatorContract6.address,
        ValidatorContract7.address,
        ValidatorContract8.address,
        ValidatorContract9.address,
        ValidatorContract10.address,
      ];
      expect(
        await FeeContractWithMaxAddressesAndWeights.getChannels()
      ).to.deep.equal(PositionIndexOneGoneArrayOfChannels);
      expect(
        await FeeContractWithMaxAddressesAndWeights.getWeights()
      ).to.deep.equal(countingArray);
      expect(
        await FeeContractWithMaxAddressesAndWeights.getTotalContractShares()
      ).to.equal(28);
    });
    it("Fee Contract: The adjustChannel function will revert if you input an existing channel.", async () => {
      await expectRevert(
        FeeContractWithMaxAddressesAndWeights.adjustChannel(
          4,
          ValidatorContract.address,
          6
        ),
        "123"
      );
    });
    it("Fee Contract: The addChannel function should revert if you input 0 address.", async () => {
      await expectRevert(
        NinePositionArrayFeeContract.addChannel(
          "0x0000000000000000000000000000000000000000",
          6
        ),
        "123"
      );
    });
    it("Fee Contract: The adjustChannel function should revert if you input 0.", async () => {
      await expectRevert(
        FeeContractWithMaxAddressesAndWeights.adjustChannel(
          4,
          "0x0000000000000000000000000000000000000000",
          6
        ),
        "123"
      );
    });
    it("Fee Contract: The adjustChannel function should revert if you input an index greater than 9.", async () => {
      await expectRevert(
        FeeContractWithMaxAddressesAndWeights.adjustChannel(
          17,
          ValidatorContract11.address,
          6
        ),
        "111"
      );
    });
    it("Fee Contract: The initalize function will fail if you put 6+ weights or addresses.", async () => {
      await max10ArrayWeight.push(4);

      await expectRevert(
        upgrades.deployProxy(
          FeeContractFactory,
          [
            1,
            Address2,
            max10ArrayChannel,
            max10ArrayWeight,
            ContractDeployer,
            ContractDeployer,
          ],
          { initializer: "initialize", kind: "uups" }
        ),
        "124"
      );
    });
    it("Fee Contract: The addChannel function should allow a new channel and wieght value the adjust the contract's total shares.", async () => {
      //gets original share amount to add to to confirm adjustments
      const originalShareAmount =
        await NinePositionArrayFeeContract.getTotalContractShares();
      //add 5
      const newExpectedShareAmount = originalShareAmount + 5;
      //add a channel 5th so this should be max
      await NinePositionArrayFeeContract.addChannel(
        ValidatorContract10.address,
        5
      );
      //expect 5 to be added to old total
      expect(
        await NinePositionArrayFeeContract.getTotalContractShares()
      ).to.equal(newExpectedShareAmount);
      //confirms array is has the values of our addition for position 4
      const positionNine =
        await NinePositionArrayFeeContract.getChannelWeightByIndex(4);
      const addressOfPositionNine = positionNine[0];
      const wieghtsOfPositionNine = positionNine[1];
      //address of position 4 should be Validator Contract 5
      expect(addressOfPositionNine).to.equal(ValidatorContract5.address);
      //wieghts of position 4 should be 5
      expect(5).to.equal(wieghtsOfPositionNine);
    });
    it("Fee Contract: The addChannel function should not allow duplicates.", async () => {
      await expectRevert(
        NinePositionArrayFeeContract.addChannel(ValidatorContract3.address, 6),
        "123"
      );
    });
    it("Fee Contract: The addChannel function should not allow more than 5 channels", async () => {
      await expectRevert(
        FeeContractWithMaxAddressesAndWeights.addChannel(
          ValidatorContract11.address,
          6
        ),
        "124"
      );
    });
  });
  describe("Fee Contract: Initail tests that require oracle feedback.", function () {
    it("Fee Contract: Confirm Oracle is giving correct data to fee contract.", async () => {
      const ValueOfQuery = await FeeContract.queryOracle();
      const Address4Value = await FeeOracleContract.consult();
      expect(ValueOfQuery).to.equal(Address4Value);
    });
    it("Fee Contract: The distributeFeesToChannels function is sending eth to validators.", async () => {
      await Address3SendsH1.sendTransaction({
        to: FeeContractWith3Validators.address,
        value: SIX_H1,
      });
      const ExpectedPayout =
        await FeeContractWith3Validators.amountPaidToUponNextDistribution(1);
      await time.increase(time.duration.days(1));
      expect(ExpectedPayout).to.equal(TWO_H1);
      expect(() =>
        FeeContractWith3Validators.distributeFeesToChannels()
      ).to.changeEtherBalance(ValidatorContract, ONE_H1);
    });
    it("Fee Contract: The distributeFeesToChannels function is requiring 24 hours or a Distributor role.", async () => {
      await Address3SendsH1.sendTransaction({
        to: FeeContractWith3Validators.address,
        value: SIX_H1,
      });
      const ExpectedPayout =
        await FeeContractWith3Validators.amountPaidToUponNextDistribution(1);
      expect(ExpectedPayout.toString()).to.equal(TWO_H1.toString());
      expectRevert(
        Address3SignsFeeContractWith3Validators.distributeFeesToChannels(),
        "121"
      );
      await FeeContractWith3Validators.distributeFeesToChannels();
    });
    it("Fee Contract: The distributeFeesToChannels function should require 24 hours between calls.", async () => {
      await Address3SendsH1.sendTransaction({
        to: FeeContractWith3Validators.address,
        value: SIX_H1,
      });
      await expectRevert(
        Address3SignsFeeContractWith3Validators.distributeFeesToChannels(),
        "121"
      );
      await time.increase(time.duration.days(1));
      await Address3SignsFeeContractWith3Validators.distributeFeesToChannels();
    });
    it("Fee Contract: Test distributeFeesToChannels should change the lastDistribution.", async () => {
      await Address3SendsH1.sendTransaction({
        to: FeeContract.address,
        value: SIX_H1,
      });
      const beforeLastDistribution =
        await FeeContract.getLastDistributionBlock();
      await FeeContract.distributeFeesToChannels();
      const afterLastDistribution =
        await FeeContract.getLastDistributionBlock();
      expect(afterLastDistribution.toString()).not.to.equal(
        beforeLastDistribution
      );
      const current = await time.latest();
      expect(afterLastDistribution.toString()).to.equal(current.toString());
    });
    it("Fee Contract: The forceFeeDistribution function should change the lastDistribution timestamp.", async () => {
      await Address3SendsH1.sendTransaction({
        to: FeeContract.address,
        value: SIX_H1,
      });
      const beforeLastDistribution =
        await FeeContract.getLastDistributionBlock();
      await FeeContract.forceFeeDistribution();
      const afterLastDistribution =
        await FeeContract.getLastDistributionBlock();
      expect(afterLastDistribution.toString()).not.to.equal(
        beforeLastDistribution
      );
      const current = await time.latest();
      expect(afterLastDistribution.toString()).to.equal(current.toString());
    });
    it("Fee Contract: The distributeFeesToChannels function should refresh the oracle.", async () => {
      await Address3SendsH1.sendTransaction({
        to: FeeContract.address,
        value: SIX_H1,
      });
      await time.increase(time.duration.days(1));
      await FeeContract.distributeFeesToChannels();
      expect(await FeeOracleContract.viewJustKeepAdding()).to.equal(8);
    });
    it("Fee Contract: The forceFeeDistribution function should send H1 to validators.", async () => {
      await Address3SendsH1.sendTransaction({
        to: FeeContractWith3Validators.address,
        value: SIX_H1,
      });
      expect(() =>
        FeeContractWith3Validators.forceFeeDistribution()
      ).to.changeEtherBalance(ValidatorContract, ONE_H1);
    });
  });
  describe("Fee Contract: General Getters and Setters", function () {
    let estimatedResetTime;
    beforeEach(async () => {
      const timestamp = await time.latest();
      estimatedResetTime = timestamp + 86400;
    });
    // it("Fee Contract: The resetFee() function should revert if it has not been 24 hours and the fee is NOT zero.", async () => {
    //   //sets fee so its not 0
    //   await FeeContract.resetFee();
    //   //checks that query oracle is equal to 1 the anticipated value
    //   expect(await FeeContract.queryOracle()).to.equal(1);
    //   //change the value
    //   await FeeOracleContract.setPriceAverage(TWO_H1);
    //   //reset fee
    //   await expectRevert(FeeContract.resetFee(), "121");
    //   //checks updated value
    // });
    // it("Fee Contract: The resetFee() function should change fee value, readable by querying the oracle.", async () => {
    //   //checks that query oracle is equal to 1 the anticipated value
    //   expect(await FeeContract.queryOracle()).to.equal(1);
    //   //change the value
    //   await FeeOracleContract.setPriceAverage(TWO_H1);
    //   //wait 24 hours
    //   await time.increase(time.duration.days(1));
    //   //reset fee
    //   await FeeContract.resetFee();
    //   //checks updated value
    //   expect(await FeeContract.queryOracle()).to.equal(TWO_H1);
    // });
    // it("Fee Contract: The resetFee() function should emit an event with the current timestamp and newResetFee.", async () => {
    //   const timestamp = await time.latest();
    //   const giveASecondTimestamp = timestamp + 1;
    //   const giveASecondEstimatedResetTime = estimatedResetTime + 1;
    //   await expect(FeeContract.resetFee())
    //     .to.emit(FeeContract, "FeeReset")
    //     .withArgs(giveASecondTimestamp, giveASecondEstimatedResetTime);
    // });
    // it("Fee Contract: The resetFee function should change the requiredReset time.", async () => {
    //   const reset = await FeeContract.getNextResetTime();
    //   // const testReset = reset.toString;
    //   expect(reset.toString()).to.be.equal(estimatedResetTime.toString());
    //   //wait 24 hours
    //   await time.increase(time.duration.days(1));
    //   //reset fee
    //   await FeeContract.resetFee();
    //   const newResetValue = await FeeContract.getNextResetTime();
    //   //add 1 second for time
    //   const newEstimatedResetTime = estimatedResetTime + 86401;
    //   //close to could be a few seconds off to account for txns
    //   expect(newResetValue.toString()).to.equal(
    //     newEstimatedResetTime.toString()
    //   );
    // });
    it("Fee Contract: The setOracle function should change the oracle address.", async () => {
      const firstOracle = await FeeContract.getOracleAddress();
      const OracleContractAddress = FeeOracleContract.address;
      expect(firstOracle.toString()).to.equal(OracleContractAddress.toString());
      await FeeContract.setOracle(Address2);
      const reset = await FeeContract.getOracleAddress();
      expect(reset.toString()).to.equal(Address2.toString());
    });
    it("Fee Contract: The setEpoch function should change the epochLength.", async () => {
      const firstepochLength = await FeeContract.epochLength();
      await FeeContract.setEpoch(1);
      const reset = await FeeContract.epochLength();
      expect(reset.toString()).to.equal("1");
      expect(firstepochLength.toString()).not.to.equal(reset.toString());
    });
    it("Fee Contract: The setMinFee function should change the change the minFee amount.", async () => {
      expect(await FeeContract.getMinimumAllottedFee()).to.equal(0);
      await FeeContract.setMinFee(1);
      expect(await FeeContract.getMinimumAllottedFee()).to.equal(1);
    });
    it("Fee Contract: The isTheAddressInTheChannelsArray function should return false if the address is in the array of channels.", async () => {
      const knownAddress = await FeeContract.isTheAddressInTheChannelsArray(
        ContractDeployer
      );
      expect(knownAddress).to.equal(false);
    });
    it("Fee Contract: The isTheAddressInTheChannelsArray function should return true if the address is in the array of channels.", async () => {
      const unknownAddress = await FeeContract.isTheAddressInTheChannelsArray(
        Address4
      );
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
    it("Fee Contract: Only addresses with OPERATOR_ROLE should be able call to setMinFee.", async () => {
      await expectRevert(
        FeeContract.connect(Address3SendsH1).setMinFee(1),
        `AccessControl: account ${Address3ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("Fee Contract: Only addresses with OPERATOR_ROLE should be able call to setEpoch.", async () => {
      await expectRevert(
        FeeContract.connect(Address3SendsH1).setEpoch(1),
        `AccessControl: account ${Address3ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("Fee Contract: updateFee() should adjust the fee to mirror the oracle.", async () => {
      await expectRevert(
        FeeContract.connect(Address3SendsH1).updateFee(),
        `AccessControl: account ${Address3ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("Fee Contract: Only addresses with OPERATOR_ROLE should be able to adjust channels.", async () => {
      await expectRevert(
        FeeContract.connect(Address3SendsH1).adjustChannel(1, Address4, 75),
        `AccessControl: account ${Address3ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("Fee Contract: Only addresses with OPERATOR_ROLE should be able to adjust channels.", async () => {
      await expectRevert(
        FeeContract.connect(Address3SendsH1).addChannel(Address4, 75),
        `AccessControl: account ${Address3ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("Fee Contract: Only addresses with OPERATOR_ROLE should be able to remove channels.", async () => {
      await expectRevert(
        FeeContract.connect(Address3SendsH1).removeChannelAndWeightByIndex(0),
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
    it("Fee Contract: The OPERATOR_ROLE should be the only one who can force fees to validators.", async () => {
      await expectRevert(
        FeeContract.connect(Address3SendsH1).forceFeeDistribution(),
        `AccessControl: account ${Address3ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("Fee Contract: The OPERATOR_ROLE should be the only one who can set the oracle address.", async () => {
      await expectRevert(
        FeeContract.connect(Address3SendsH1).setOracle(ContractDeployer),
        `AccessControl: account ${Address3ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("Fee Contract: Contract upgrades should only be allowed to be called by DEFAULT_ADMIN_ROLE.", async function () {
      const FeeContractHasADifferentUpgrader = await upgrades.deployProxy(
        FeeContractFactory,
        [
          1,
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
    it("Fee Contract: The forceFeeDistribution function should not distribute funds to validators if they all can't accept it.", async () => {
      const DummyContractFactory = await ethers.getContractFactory("FeeOracle");
      const DummyContract = await DummyContractFactory.deploy();
      const InputArray = [DummyContract.address, Address3, ContractDeployer];
      const NumberArray = [1, 2, 3, 4];
      const FeeContract = await ethers.getContractFactory("FeeContract");
      const FeeContractForTest = await upgrades.deployProxy(
        FeeContract,
        [
          1,
          DummyContract.address,
          InputArray,
          NumberArray,
          ContractDeployer,
          ContractDeployer,
        ],
        { initializer: "initialize", kind: "uups" }
      );
      await expectRevert(FeeContractForTest.forceFeeDistribution(), "112");
    });
    it("Fee Contract: The distributeFeesToChannels() function should revert if there is an unsuccessful transfer is made.", async () => {
      const DummyContractFactory = await ethers.getContractFactory("FeeOracle");
      const DummyContract = await DummyContractFactory.deploy();
      const InputArray = [DummyContract.address, Address3, ContractDeployer];
      const NumberArray = [1, 2, 3, 4];
      const FeeContract = await ethers.getContractFactory("FeeContract");
      const FeeContractForTest = await upgrades.deployProxy(
        FeeContract,
        [
          1,
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
        value: SIX_H1,
      });
      await expectRevert(FeeContractForTest.distributeFeesToChannels(), "112");
    });
    it("Fee Contract: THe distributeFeesToChannels() function should revert if there are no funds in the contract to rebate gas.", async () => {
      const DummyContractFactory = await ethers.getContractFactory("FeeOracle");
      const DummyContract = await DummyContractFactory.deploy();
      const InputArray = [DummyContract.address, Address3, ContractDeployer];
      const NumberArray = [1, 2, 3, 4];
      const FeeContract = await ethers.getContractFactory("FeeContract");
      const FeeContractForTest = await upgrades.deployProxy(
        FeeContract,
        [
          1,
          DummyContract.address,
          InputArray,
          NumberArray,
          ContractDeployer,
          ContractDeployer,
        ],
        { initializer: "initialize", kind: "uups" }
      );
      await expectRevert(FeeContractForTest.distributeFeesToChannels(), "122");
    });
  });
  // describe("WILL RENAME: FeeQuery Contract imports.", function () {
  //   let FeeQueryContract;
  //   beforeEach(async () => {
  //     const FeeQueryFactory = await ethers.getContractFactory("FeeQuery");
  //     FeeQueryContract = await FeeQueryFactory.deploy();
  //   });
  //   // it("FeeQuery Contract: Deployed independently with no contract inheriting it epochLength should be 0.", async () => {
  //   //   const epochLength = await FeeQueryContract.epochLength();
  //   //   expect(epochLength.toString()).to.deep.equal("0");
  //   // });
  //   // it("FeeQuery Contract: Deployed independently with no contract inheriting it the fee value should be 0.", async () => {
  //   //   const fee = await FeeQueryContract.fee();
  //   //   expect(fee.toString()).to.deep.equal("0");
  //   // });
  //   // it("FeeQuery Contract: Deployed independently with no contract inheriting it requiredReset should be 0.", async () => {
  //   //   const requiredReset = await FeeQueryContract.requiredReset();
  //   //   expect(requiredReset.toString()).to.equal("0");
  //   // });
  //   // it("FeeQuery Contract: Deployed independently with no contract inheriting it getFee() should return resetFee()", async () => {
  //   //   await expectRevert(FeeQueryContract.getFee(), "resetFee()");
  //   // });
  //   // let FeeOracleContract;
  //   // beforeEach(async () => {
  //   //   const FeeOracleFactory = await ethers.getContractFactory("FeeOracle");
  //   //   FeeOracleContract = await FeeOracleFactory.deploy();
  //   // });
  //   it("FeeQuery Contract: The function getFee with an oracle but no feeContract should return 0.", async () => {
  //     await FeeContract.setRequiredReset(3926785679272);
  //     const FeeFromContract = await FeeOracleContract.getFee();
  //     expect(FeeFromContract.toString()).to.deep.equal("0");
  //   });
  //   it("FeeQuery Contract: The function getFee will return the fee amount unless the requiredReset is more than the current timestamp.", async () => {
  //     await expectRevert(FeeOracleContract.getFee(), "resetFee()");
  //     await FeeOracleContract.setRequiredReset(3926785679272);
  //     const FeeFromContract = await FeeOracleContract.getFee();
  //     expect(FeeFromContract.toString()).to.deep.equal("0");
  //   });
  // });
});
