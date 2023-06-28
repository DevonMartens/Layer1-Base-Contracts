const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const { expectRevert } = require("@openzeppelin/test-helpers");

const SIX_ETH = ethers.utils.parseUnits("6", "ether");
const TWO_ETH = ethers.utils.parseUnits("2", "ether");
const ONE_ETH = ethers.utils.parseUnits("1", "ether");

//add 24 hour increase, claim rewards and getter for "lastDistribution"

describe("Fee Contract: Testing the initial values to validate expected contract state", function () {
  let owner;
  let ValidatorContract;
  let Fee;
  let deployBlockTimeStamp;
  let ownerArray;
  let oracleFake;
  let weight;
  beforeEach(async () => {
    //example weight 100% of bounty 1/1
    weight = [1];
    const [owners, alices] = await ethers.getSigners();
    owner = await owners.getAddress();
    oracleFake = await alices.getAddress();
    //address of validators in validator rewards
    ownerArray = await [owner];
    const ValidatorRewards = await ethers.getContractFactory(
      "ValidatorRewards"
    );
    const FeeContract = await ethers.getContractFactory("FeeContract");
    ValidatorContract = await upgrades.deployProxy(
      ValidatorRewards,
      [ownerArray, weight, owner, owner],
      { initializer: "initialize", kind: "uups" }
    );
    Fee = await upgrades.deployProxy(
      FeeContract,
      [oracleFake, ownerArray, weight, owner, owner],
      { initializer: "initialize", kind: "uups" }
    );
    deployBlockTimeStamp = await time.latest();
  });

  it("The FeeContract, ValidatorRewards contract, and H1 Native contracts", async () => {
    const H1NativeApplication = await ethers.getContractFactory(
      "H1NativeApplication"
    );
    await H1NativeApplication.deploy(Fee.address);
  });
  it("The FeeContract should have correct values for wieght and channel (view functions getWieght and getChannel also confirmed)", async () => {
    // const addressFromContract = await Fee.getChannels();
    // const wieghtFromContract = await Fee.getWieghts();
    expect(await Fee.getChannels()).to.deep.equal(ownerArray);
    expect(await Fee.getWieghts()).to.deep.equal(weight);
  });
  it("The contract: have correct values for oracle, total contract shares, and lastDistribution", async () => {
    //gets oracle from Fee contract and ensures it is equal to alice the original inpul
    expect(await Fee.getOracleAddress()).to.equal(oracleFake);
    //gets last distribution from contract and ensures its equal to deployment time
    expect(await Fee.getLastDistributionBlock()).to.equal(deployBlockTimeStamp);
  });
  it("initalize should only be called upon deployment", async () => {
    await expectRevert(
      Fee.initialize(
        owner,
        ownerArray,
        weight,
        oracleFake,
        oracleFake
      ),
      "Initializable: contract is already initialized"
    );
  });
});
describe("Fee Contract:  Test: Adding and adjusting wieghts and channels functions", function () {
  let owner;
  let ValidatorContract;
  let ValidatorContract2;
  let ValidatorContract3;
  let ValidatorContract4;
  let ValidatorContract5;
  let ValidatorContract6;
  let Fee;
  let random;
  let max5ArrayWeight;
  let max5ArrayChannel;
  let FeeContract;
  beforeEach(async () => {
    //addresses for using
    max5ArrayWeight = [1, 2, 3, 4, 5];
    const [owners, alices, randoms] = await ethers.getSigners();
    owner = await owners.getAddress();
    alice = await alices.getAddress();
    random = await randoms.getAddress();
    //get contract factory
    const ValidatorRewards = await ethers.getContractFactory(
      "ValidatorRewards"
    );
    FeeContract = await ethers.getContractFactory("FeeContract");
    //turns it into an array
    const addressArray = [alice, owner, random];
    const weight = [1];
    const weightArray = [1, 2, 3];
    const ownerArray = [owner];
    //validator array that is too heavey
    ValidatorContract = await upgrades.deployProxy(
      ValidatorRewards,
      [addressArray, weightArray, owner, owner],
      { initializer: "initialize", kind: "uups" }
    );
    ValidatorContract2 = await upgrades.deployProxy(
      ValidatorRewards,
      [addressArray, weightArray, owner, owner],
      { initializer: "initialize", kind: "uups" }
    );
    ValidatorContract3 = await upgrades.deployProxy(
      ValidatorRewards,
      [addressArray, weightArray, owner, owner],
      { initializer: "initialize", kind: "uups" }
    );
    ValidatorContract4 = await upgrades.deployProxy(
      ValidatorRewards,
      [addressArray, weightArray, owner, owner],
      { initializer: "initialize", kind: "uups" }
    );
    ValidatorContract5 = await upgrades.deployProxy(
      ValidatorRewards,
      [addressArray, weightArray, owner, owner],
      { initializer: "initialize", kind: "uups" }
    );
    ValidatorContract6 = await upgrades.deployProxy(
      ValidatorRewards,
      [addressArray, weightArray, owner, owner],
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

    // ValidatorContract = await ValidatorRewards.deploy(ownerArray, weight, owner, owner)
    Fee = await upgrades.deployProxy(
      FeeContract,
      [alice, max5ArrayChannel, max5ArrayWeight, owner, owner],
      { initializer: "initialize", kind: "uups" }
    );
  });

  it("The FeeContract should allow a max of 5 addresses and 5 wieghts (representing validator rewards) in the initalizer", async () => {
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
        FeeContract,
        [
          owner,
          oversizedAddressArray,
          oversizedWieghtsArray,
          owner,
          owner,
        ],
        {
          initializer: "initialize",
        }
      ),
      "124"
    );

    await upgrades.deployProxy(
      FeeContract,
      [alice, max5ArrayChannel, max5ArrayWeight, owner, owner],
      { initializer: "initialize", kind: "uups" }
    );
  });
  it("Fee Contract adjustChannel should change the correct wieght and channel", async () => {
    expect(await Fee.getTotalContractShares()).to.equal(15);
    await Fee.adjustChannel(4, ValidatorContract6.address, 6);
    const channel5ShouldHaveWeightOf6 = await Fee.getChannelWeightByIndex(4);
    //for wieght
    const weightOfChannel5 = await channel5ShouldHaveWeightOf6[1];
    expect(await weightOfChannel5).to.equal(6);
  });
  it("Fee Contract adjustChannel will revert if you input an existing channel", async () => {
    await expectRevert(
      Fee.adjustChannel(4, ValidatorContract.address, 6),
      "123"
    );
  });
  it("Fee Contract addChannel should revert if you input 0 address", async () => {
    await max5ArrayChannel.pop();
    await max5ArrayWeight.pop();
    const notAtMaxFiveFee = await upgrades.deployProxy(
      FeeContract,
      [alice, max5ArrayChannel, max5ArrayWeight, owner, owner],
      { initializer: "initialize", kind: "uups" }
    );
    await expectRevert(
      notAtMaxFiveFee.addChannel(
        "0x0000000000000000000000000000000000000000",
        6
      ),
      "123"
    );
  });
  it("Fee Contract adjustChannel should revert if you input 0", async () => {
    await expectRevert(
      Fee.adjustChannel(4, "0x0000000000000000000000000000000000000000", 6),
      "123"
    );
  });
  it("Fee Contract adjustChannel should revert if you input an index greater than 4", async () => {
    await expectRevert(
      Fee.adjustChannel(7, ValidatorContract6.address, 6),
      "111"
    );
  });
  it("Initalize will fail if you put 6+ weights or addresses", async () => {
    await max5ArrayWeight.push(4);

    await expectRevert(
      upgrades.deployProxy(
        FeeContract,
        [alice, max5ArrayChannel, max5ArrayWeight, owner, owner],
        { initializer: "initialize", kind: "uups" }
      ),
      "124"
    );
  });
  it("addChannel should allow a new channel and wieght value the adjust the contract's total shares.", async () => {
    await max5ArrayChannel.pop();
    await max5ArrayWeight.pop();
    const notAtMaxFiveFee = await upgrades.deployProxy(
      FeeContract,
      [alice, max5ArrayChannel, max5ArrayWeight, owner, owner],
      { initializer: "initialize", kind: "uups" }
    );
    //gets original share amount to add to to confirm adjustments
    const originalShareAmount = await notAtMaxFiveFee.getTotalContractShares();
    //add 5
    const newExpectedShareAmount = originalShareAmount + 5;
    //add a channel 5th so this should be max
    await notAtMaxFiveFee.addChannel(ValidatorContract5.address, 5);
    //expect 5 to be added to old total
    expect(await notAtMaxFiveFee.getTotalContractShares()).to.equal(
      newExpectedShareAmount
    );
    //confirms array is has the values of our addition for position 4
    const positionFour = await notAtMaxFiveFee.getChannelWeightByIndex(4);
    const addressOfPositionFour = positionFour[0];
    const wieghtsOfPositionFour = positionFour[1];
    //address of position 4 should be Validator Contract 5
    expect(addressOfPositionFour).to.equal(ValidatorContract5.address);
    //wieghts of position 4 should be 5
    expect(5).to.equal(wieghtsOfPositionFour);
  });
  it("addChannel should not allow duplicates.", async () => {
    await max5ArrayChannel.pop();
    await max5ArrayWeight.pop();
    const notAtMaxFiveFee = await upgrades.deployProxy(
      FeeContract,
      [alice, max5ArrayChannel, max5ArrayWeight, owner, owner],
      { initializer: "initialize", kind: "uups" }
    );
    //add a channel 5th so this should be max
    await expectRevert(
      notAtMaxFiveFee.addChannel(ValidatorContract3.address, 6),
      "123"
    );
  });
  it("addChannel should not allow more than 5 channels", async () => {
    await expectRevert(Fee.addChannel(ValidatorContract5.address, 6), "124");
  });
});
describe("Fee Contract: Initail tests that require oracle feedback", function () {
  let owner;
  let OracleContract;
  let ValidatorContract;
  let ValidatorContract2;
  let ValidatorContract3;
  let FeeContract;
  let random;
  let randomSig;
  let randomAddressIsTheSigner;
  beforeEach(async () => {
    //addresses for using
    const [owners, alices, randoms] = await ethers.getSigners();
    owner = await owners.getAddress();
    alice = await alices.getAddress();
    random = await randoms.getAddress();
    randomSig = ethers.provider.getSigner(random);
    //get contract factories
    const ValidatorRewardsFactory = await ethers.getContractFactory(
      "ValidatorRewards"
    );
    const FeeContractFactory = await ethers.getContractFactory("FeeContract");
    const OracleFactory = await ethers.getContractFactory("FeeOracle");
    //deploy Oracle
    OracleContract = await OracleFactory.deploy();
    //turns it into an array
    const addressArray = [alice, owner, random];
    const weightArray = [1, 2, 3];
    //validator contracts printed out
    ValidatorContract = await upgrades.deployProxy(
      ValidatorRewardsFactory,
      [addressArray, weightArray, owner, owner],
      { initializer: "initialize", kind: "uups" }
    );
    ValidatorContract2 = await upgrades.deployProxy(
      ValidatorRewardsFactory,
      [addressArray, weightArray, owner, owner],
      { initializer: "initialize", kind: "uups" }
    );
    ValidatorContract3 = await upgrades.deployProxy(
      ValidatorRewardsFactory,
      [addressArray, weightArray, owner, owner],
      { initializer: "initialize", kind: "uups" }
    );
    const ValidatorArray = [
      ValidatorContract.address,
      ValidatorContract2.address,
      ValidatorContract3.address,
    ];
    // Fee contract
    FeeContract = await upgrades.deployProxy(
      FeeContractFactory,
      [
        OracleContract.address,
        ValidatorArray,
        weightArray,
        owner,
        owner,
      ],
      { initializer: "initialize", kind: "uups" }
    );
    randomSig = await ethers.getSigner(random);
    secondAddressSigner = await ethers.getSigner(random);
    randomAddressIsTheSigner = FeeContract.connect(secondAddressSigner);
  });

  it("Confirm Oracle is giving correct data to fee contract", async () => {
    const ValueOfQuery = await FeeContract.queryOracle();
    const otherValue = await OracleContract.consult();
    expect(ValueOfQuery).to.equal(otherValue);
  });
  it("Test CollectFee Function is sending eth to validators", async () => {
    await randomSig.sendTransaction({
      to: FeeContract.address,
      value: SIX_ETH,
    });
    const ExpectedPayout = await FeeContract.amountPaidToUponNextDistribution(
      1
    );
    await time.increase(time.duration.days(1));
    expect(ExpectedPayout).to.equal(TWO_ETH);
    expect(() => FeeContract.collectFee()).to.changeEtherBalance(
      ValidatorContract,
      ONE_ETH
    );
  });
  it("Test CollectFee Function is requiring 24 hours or a Distributor role", async () => {
    await randomSig.sendTransaction({
      to: FeeContract.address,
      value: SIX_ETH,
    });
    const ExpectedPayout = await FeeContract.amountPaidToUponNextDistribution(
      1
    );
    expect(ExpectedPayout).to.equal(TWO_ETH);
    expectRevert(randomAddressIsTheSigner.collectFee(), "121");
    await FeeContract.collectFee();
  });
  it("Test CollectFee Function should requiring 24 hours between calls", async () => {
    await randomSig.sendTransaction({
      to: FeeContract.address,
      value: SIX_ETH,
    });
    await expectRevert(randomAddressIsTheSigner.collectFee(), "121");
    await time.increase(time.duration.days(1));
    await randomAddressIsTheSigner.collectFee();
    //randomAddressIsTheSigner
  });
  it("Test collectFee Function is requiring 24 hours", async () => {
    await randomSig.sendTransaction({
      to: FeeContract.address,
      value: SIX_ETH,
    });
    const ExpectedPayout = await FeeContract.amountPaidToUponNextDistribution(
      1
    );
    await time.increase(time.duration.days(1));
    expect(ExpectedPayout).to.equal(TWO_ETH);
    await randomAddressIsTheSigner.collectFee();
    //randomAddressIsTheSigner
  });
  it("Test collectFee should change the lastDistribution", async () => {
    await randomSig.sendTransaction({
      to: FeeContract.address,
      value: SIX_ETH,
    });
    const beforeLastDistribution = await FeeContract.getLastDistributionBlock();
    await FeeContract.collectFee();
    const afterLastDistribution = await FeeContract.getLastDistributionBlock();
    expect(afterLastDistribution.toString()).not.to.equal(
      beforeLastDistribution
    );
    const current = await time.latest();
    expect(afterLastDistribution.toString()).to.equal(current.toString());
  });
  it("Test forceFee Function should refresh the oracle", async () => {
    await randomSig.sendTransaction({
      to: FeeContract.address,
      value: SIX_ETH,
    });
    await FeeContract.forceFee();
    expect(await OracleContract.viewJustKeepAdding()).to.equal(8);
  });
  it("Test forceFee should change the lastDistribution", async () => {
    await randomSig.sendTransaction({
      to: FeeContract.address,
      value: SIX_ETH,
    });
    const beforeLastDistribution = await FeeContract.getLastDistributionBlock();
    await FeeContract.forceFee();
    const afterLastDistribution = await FeeContract.getLastDistributionBlock();
    expect(afterLastDistribution.toString()).not.to.equal(
      beforeLastDistribution
    );
    const current = await time.latest();
    expect(afterLastDistribution.toString()).to.equal(current.toString());
  });
  it("Test CollectFee Function should refresh the oracle", async () => {
    await randomSig.sendTransaction({
      to: FeeContract.address,
      value: SIX_ETH,
    });
    await time.increase(time.duration.days(1));
    await FeeContract.collectFee();
    expect(await OracleContract.viewJustKeepAdding()).to.equal(8);
  });
  it("Test ForceFee Function is sending eth to validators", async () => {
    await randomSig.sendTransaction({
      to: FeeContract.address,
      value: SIX_ETH,
    });
    const ExpectedPayout = await FeeContract.amountPaidToUponNextDistribution(
      1
    );
    expect(ExpectedPayout).to.equal(TWO_ETH);
    expect(() => FeeContract.forceFee()).to.changeEtherBalance(
      ValidatorContract,
      ONE_ETH
    );
  });
});
describe("Fee Contract: General Getters and Setters", function () {
  let owner;
  let alice;
  let ValidatorContract;
  let FeeContract;
  let weight;
  let FeeOracleContract;
  let estimatedResetTime;
  let other;
  beforeEach(async () => {
    //example weight 100% of bounty 1/1
    weight = [1, 2, 3];
    const [owners, alices, randoms, others] = await ethers.getSigners();
    //address for contract inputs
    const owner = await owners.getAddress();
    alice = await alices.getAddress();
    const random = await randoms.getAddress();
    other = await others.getAddress();
    //address of validators in validator rewards
    const ValidatorRewards = await ethers.getContractFactory(
      "ValidatorRewards"
    );
    const FeeContractFactory = await ethers.getContractFactory("FeeContract");
    const FeeOracleFactory = await ethers.getContractFactory("FeeOracle");
    //addrees for contracts
    const addressArray = await [owner, alice, random];
    FeeOracleContract = await FeeOracleFactory.deploy();
    ValidatorContract = await upgrades.deployProxy(
      ValidatorRewards,
      [addressArray, weight, owner, owner],
      { initializer: "initialize", kind: "uups" }
    );
    FeeContract = await upgrades.deployProxy(
      FeeContractFactory,
      [FeeOracleContract.address, addressArray, weight, owner, owner],
      { initializer: "initialize", kind: "uups" }
    );
    const timestamp = await time.latest();
    estimatedResetTime = timestamp + 86400;
  });

  it("The Reset Fee should revert if it has not been 24 hours and the fee is NOT zero", async () => {
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
  it("The Reset Fee should change Fee Value", async () => {
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
  it("The Reset Fee should change the requiredReset", async () => {
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
    expect(newResetValue.toString()).to.equal(newEstimatedResetTime.toString());
  });
  it("setOracle should change the oracle address", async () => {
    const firstOracle = await FeeContract.getOracleAddress();
    const OracleContractAddress = FeeOracleContract.address;
    expect(firstOracle.toString()).to.equal(OracleContractAddress.toString());
    await FeeContract.setOracle(alice);
    const reset = await FeeContract.getOracleAddress();
    expect(reset.toString()).to.equal(alice.toString());
  });
  it("setEpoch should change the epochLength", async () => {
    const firstepochLength = await FeeContract.epochLength();
    await FeeContract.setEpoch(1);
    const reset = await FeeContract.epochLength();
    expect(reset.toString()).to.equal("1");
    expect(firstepochLength.toString()).not.to.equal(reset.toString());
  });
  it("isOriginalAddress should return false if the address is in the array", async () => {
    const knownAddress = await FeeContract.isOriginalAddress(alice);
    expect(knownAddress).to.equal(false);
  });
  it("isOriginalAddress should return true if the address is in the array", async () => {
    const unknownAddress = await FeeContract.isOriginalAddress(other);
    expect(unknownAddress).to.equal(true);
  });
  it("isOriginalAddress if/else determines true/false", async () => {
    const knownAddress = await FeeContract.isOriginalAddress(alice);
    expect(knownAddress).to.equal(false);
    const unknownAddress = await FeeContract.isOriginalAddress(other);
    expect(unknownAddress).to.equal(true);
  });
  //isOriginalAddress
});
describe("Fee Contract: AccessControl", function () {
  let owner;
  let ValidatorContract;
  let Fee;
  let deployBlockTimeStamp;
  let ownerArray;
  let oracleFake;
  let OPERATOR_ROLE;
  let weight;
  let randomSig;
  let FROM;
  let other;
  let random;
  let FromOwner;
  let DEFAULT_ADMIN_ROLE;
  let FeeContractFactory;
  beforeEach(async () => {
    //example weight 100% of bounty 1/1
    weight = [1];
    const [owners, alices, randoms, others] = await ethers.getSigners();
    owner = await owners.getAddress();
    oracleFake = await alices.getAddress();
    other = await others.getAddress();
    random = await randoms.getAddress();
    randomSig = ethers.provider.getSigner(random);
    //address of validators in validator rewards
    ownerArray = await [owner];
    FROM = random.toLowerCase();
    FromOwner = owner.toLowerCase();
    const ValidatorRewards = await ethers.getContractFactory(
      "ValidatorRewards"
    );
    FeeContractFactory = await ethers.getContractFactory("FeeContract");
    ValidatorContract = await upgrades.deployProxy(
      ValidatorRewards,
      [ownerArray, weight, owner, owner],
      { initializer: "initialize", kind: "uups" }
    );
    Fee = await upgrades.deployProxy(
      FeeContractFactory,
      [oracleFake, ownerArray, weight, owner, owner],
      { initializer: "initialize", kind: "uups" }
    );
    deployBlockTimeStamp = await time.latest();
    OPERATOR_ROLE = await Fee.OPERATOR_ROLE();
    DEFAULT_ADMIN_ROLE = await Fee.DEFAULT_ADMIN_ROLE();
  });
  //setEpoch
  it("OPERATOR_ROLE should be the only one to setEpoch", async () => {
    await expectRevert(
      Fee.connect(randomSig).setEpoch(1),
      `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
    );
  });

  it("OPERATOR_ROLE should be the only one to adjust channels", async () => {
    await expectRevert(
      Fee.connect(randomSig).adjustChannel(1, other, 75),
      `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
    );
  });
  it("OPERATOR_ROLE should be the only one to adjust channels", async () => {
    await expectRevert(
      Fee.connect(randomSig).addChannel(other, 75),
      `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
    );
  });
  it("roles should be set upon deployment", async () => {
    expect(await Fee.hasRole(OPERATOR_ROLE, owner)).to.equal(true);
    expect(await Fee.hasRole(DEFAULT_ADMIN_ROLE, owner)).to.equal(true);
    expect(await Fee.hasRole(DEFAULT_ADMIN_ROLE, owner)).to.equal(true);
    expect(await Fee.hasRole(OPERATOR_ROLE, oracleFake)).to.equal(false);
    expect(await Fee.hasRole(DEFAULT_ADMIN_ROLE, oracleFake)).to.equal(false);
    expect(await Fee.hasRole(DEFAULT_ADMIN_ROLE, oracleFake)).to.equal(false);
  });
  it("roles should be set upon deployment", async () => {
    await Fee.grantRole(OPERATOR_ROLE, oracleFake);
    await Fee.grantRole(DEFAULT_ADMIN_ROLE, oracleFake);
    await Fee.grantRole(DEFAULT_ADMIN_ROLE, oracleFake);
    expect(await Fee.hasRole(OPERATOR_ROLE, oracleFake)).to.equal(true);
    expect(await Fee.hasRole(DEFAULT_ADMIN_ROLE, oracleFake)).to.equal(true);
    expect(await Fee.hasRole(DEFAULT_ADMIN_ROLE, oracleFake)).to.equal(true);
  });
  it("OPERATOR_ROLE should be the only one who can force fees", async () => {
    await expectRevert(
      Fee.connect(randomSig).forceFee(),
      `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
    );
  });
  it("OPERATOR_ROLE should be the only one who can setOracle address", async () => {
    await expectRevert(
      Fee.connect(randomSig).setOracle(owner),
      `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
    );
  });
  it("upgrades should only be allowed to be called by DEFAULT_ADMIN_ROLE", async function () {
    const FeeContractHasADifferentUpgrader = await upgrades.deployProxy(
      FeeContractFactory,
      [oracleFake, ownerArray, weight, alice, alice],
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
      `AccessControl: account ${FromOwner} is missing role ${DEFAULT_ADMIN_ROLE}`
    );
    await upgrades.upgradeProxy(Fee.address, FeeContractFactory, {
      kind: "uups",
    });
  });
  it("upgrades should only be allowed to be called by DEFAULT_ADMIN_ROLE", async function () {
    const FeeContractHasADifferentUpgrader = await upgrades.deployProxy(
      FeeContractFactory,
      [oracleFake, ownerArray, weight, alice, alice],
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
      `AccessControl: account ${FromOwner} is missing role ${DEFAULT_ADMIN_ROLE}`
    );
    await upgrades.upgradeProxy(Fee.address, FeeContractFactory, {
      kind: "uups",
    });
  });
  describe("Fee Contract: Force and collect fee functions", function () {
    let owner;
    let ValidatorContract;
    let Fee;
    let deployBlockTimeStamp;
    let ownerArray;
    let oracleFake;
    let weight;
    let randomSig;
    let FROM;
    let other;
    let random;
    beforeEach(async () => {
      //example weight 100% of bounty 1/1
      weight = [1];
      const [owners, alices, randoms, others] = await ethers.getSigners();
      owner = await owners.getAddress();
      oracleFake = await alices.getAddress();
      other = await others.getAddress();
      random = await randoms.getAddress();
      randomSig = ethers.provider.getSigner(random);
      //address of validators in validator rewards
      ownerArray = await [owner];
      FROM = random.toLowerCase();
      const ValidatorRewards = await ethers.getContractFactory(
        "ValidatorRewards"
      );
      FeeContractFactory = await ethers.getContractFactory("FeeContract");
      ValidatorContract = await upgrades.deployProxy(
        ValidatorRewards,
        [ownerArray, weight, owner, owner],
        { initializer: "initialize", kind: "uups" }
      );
      Fee = await upgrades.deployProxy(
        FeeContractFactory,
        [oracleFake, ownerArray, weight, owner, owner],
        { initializer: "initialize", kind: "uups" }
      );
      deployBlockTimeStamp = await time.latest();
    });
    it("forceFee should distribute funds regardless of sucess or failure upon an address", async () => {
      const DummyContractFactory = await ethers.getContractFactory("FeeOracle");
      const DummyContract = await DummyContractFactory.deploy();
      const InputArray = [DummyContract.address, random, owner];
      const NumberArray = [1, 2, 3, 4];
      const FeeContract = await ethers.getContractFactory("FeeContract");
      const FeeContractForTest = await upgrades.deployProxy(
        FeeContract,
        [DummyContract.address, InputArray, NumberArray, owner, owner],
        { initializer: "initialize", kind: "uups" }
      );
      await expectRevert(FeeContractForTest.forceFee(), "112");
    });
    it("Fee contract collectFee() should revert if there is an unsuccessful transfer made)", async () => {
      const DummyContractFactory = await ethers.getContractFactory("FeeOracle");
      const DummyContract = await DummyContractFactory.deploy();
      const InputArray = [DummyContract.address, random, owner];
      const NumberArray = [1, 2, 3, 4];
      const FeeContract = await ethers.getContractFactory("FeeContract");
      const FeeContractForTest = await upgrades.deployProxy(
        FeeContract,
        [DummyContract.address, InputArray, NumberArray, owner, owner],
        { initializer: "initialize", kind: "uups" }
      );
      await randomSig.sendTransaction({
        to: FeeContractForTest.address,
        value: SIX_ETH,
      });
      await expectRevert(FeeContractForTest.collectFee(), "112");
    });
    it("Fee contract collectFee() should revert if there are no funds to rebate gas)", async () => {
      const DummyContractFactory = await ethers.getContractFactory("FeeOracle");
      const DummyContract = await DummyContractFactory.deploy();
      const InputArray = [DummyContract.address, random, owner];
      const NumberArray = [1, 2, 3, 4];
      const FeeContract = await ethers.getContractFactory("FeeContract");
      const FeeContractForTest = await upgrades.deployProxy(
        FeeContract,
        [DummyContract.address, InputArray, NumberArray, owner, owner],
        { initializer: "initialize", kind: "uups" }
      );
      await expectRevert(FeeContractForTest.collectFee(), "122");
    });
    // it("The contract: have correct values for oracle, total contract shares, and lastDistribution", async () => {
    //     //gets oracle from Fee contract and ensures it is equal to alice the original inpul
    //     expect(await Fee.getOracleAddress()).to.equal(oracleFake)
    //     //gets last distribution from contract and ensures its equal to deployment time
    //     expect(await Fee.getLastDistributionBlock()).to.equal(deployBlockTimeStamp);
    // });
  });
});
