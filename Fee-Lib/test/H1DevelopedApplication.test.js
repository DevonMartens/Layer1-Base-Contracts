const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const { expectRevert } = require("@openzeppelin/test-helpers");

ONE_H1 = ethers.utils.parseUnits("1", "ether");
SIX_H1 = ethers.utils.parseUnits("6", "ether");
NINE_H1 = ethers.utils.parseUnits("9", "ether");
TEN_H1 = ethers.utils.parseUnits("10", "ether");

describe("H1DevelopedApplication and Imported Modifier devApplicationFee() ", function () {
  let ContractDeployer;
  let ContractDeployerSigner;
  let OracleContract;
  let FeeContract;
  let Address3Sig;
  let H1DevelopedApplication;
  let SimpleStorageWithDevAppFee;
  let H1DevelopedApplicationFactory;
  let FeeContractSigner;
  let SimpleStorageBadFeeContract;
  let BadFeeContract;
  let SimpleStorageBadDevWallet;
  beforeEach(async () => {
    //addresses for using
    const [ContractDeployers, Address2s, Address3s] = await ethers.getSigners();
    ContractDeployer = await ContractDeployers.getAddress();
    Address2 = await Address2s.getAddress();
    Address3 = await Address3s.getAddress();
    Address3Sig = ethers.provider.getSigner(Address3);
    ContractDeployerSigner = ethers.provider.getSigner(ContractDeployer);
    //get contract factories
    const ValidatorRewardsFactory = await ethers.getContractFactory(
      "ValidatorRewards"
    );
    const FeeContractFactory = await ethers.getContractFactory("FeeContract");
    const OracleFactory = await ethers.getContractFactory("FeeOracle");
    const BadFeeContractFactory = await ethers.getContractFactory(
      "HasNoRecieveFunctionForFailedTxns"
    );

    H1DevelopedApplicationFactory = await ethers.getContractFactory(
      "H1DevelopedApplication"
    );
    const SimpleStorageWithDevAppFeeFactory = await ethers.getContractFactory(
      "SimpleStorageWithDevAppFee"
    );
    //deploy Oracle
    OracleContract = await OracleFactory.deploy();
    //turns it into an array
    const addressArray = [Address2, ContractDeployer, Address3];
    const weightArray = [1, 2, 3];
    //validator contracts printed out
    ValidatorContract = await upgrades.deployProxy(
      ValidatorRewardsFactory,
      [addressArray, weightArray, ContractDeployer, ContractDeployer],
      { initializer: "initialize", kind: "uups" }
    );
    ValidatorContract2 = await upgrades.deployProxy(
      ValidatorRewardsFactory,
      [addressArray, weightArray, ContractDeployer, ContractDeployer],
      { initializer: "initialize", kind: "uups" }
    );
    ValidatorContract3 = await upgrades.deployProxy(
      ValidatorRewardsFactory,
      [addressArray, weightArray, ContractDeployer, ContractDeployer],
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
        1,
        OracleContract.address,
        ValidatorArray,
        weightArray,
        ContractDeployer,
        ContractDeployer,
      ],
      { initializer: "initialize", kind: "uups" }
    );
    //bad fee contract
    BadFeeContract = await BadFeeContractFactory.deploy(
      OracleContract.address,
      ValidatorArray,
      weightArray,
      ContractDeployer,
      ContractDeployer
    );
    FeeContractSigner = ethers.provider.getSigner(FeeContract.address);

    H1DevelopedApplication = await H1DevelopedApplicationFactory.deploy(
      FeeContract.address,
      ContractDeployer,
      1
    );
    SimpleStorageWithDevAppFee = await SimpleStorageWithDevAppFeeFactory.deploy(
      FeeContract.address,
      ContractDeployer,
      1
    );
    SimpleStorageBadFeeContract =
      await SimpleStorageWithDevAppFeeFactory.deploy(
        BadFeeContract.address,
        ContractDeployer,
        1
      );
    SimpleStorageBadDevWallet = await SimpleStorageWithDevAppFeeFactory.deploy(
      FeeContract.address,
      BadFeeContract.address,
      1
    );
  });
  it("H1DevelopedApplication: The modifer devApplicationFee() should not allow a function to execute if the fee is 0 and no value is sent to the function.", async () => {
    SimpleStorageWithDevAppFee.set(1, { value: 1 });

    await expectRevert(SimpleStorageWithDevAppFee.set(1), "125");
    await SimpleStorageWithDevAppFee.set(1, { value: 1 });
  });
  it("H1DevelopedApplication: The modifer devApplicationFee() should return extra values.", async () => {
    await SimpleStorageWithDevAppFee.setAndPayForIt(1, { value: 6 });
    await SimpleStorageWithDevAppFee.setAndPayForIt(1, { value: 27 });
  });
  it("H1DevelopedApplication: The modifer devApplicationFee() will revert if not enough fees are paid.", async () => {
    await expectRevert(SimpleStorageWithDevAppFee.setAndPayForIt(1, { value: 0 }),"125");
  
  });
  it("H1DevelopedApplication: The modifer devApplicationFee() will return excess values.", async () => {
    await SimpleStorageWithDevAppFee.set(1, { value: 2 });
  
  });
  it("H1DevelopedApplication: The modifer devapplicationFee() should not allow a value less than the price to be sent to the function.", async () => {
    await OracleContract.setPriceAverage(ONE_H1);

    await expectRevert(SimpleStorageWithDevAppFee.set(1), "125");
    expect(() =>
      SimpleStorageWithDevAppFee.set(1, {
        value: ONE_H1,
      }).to.changeEtherBalance(FeeContract.address, ONE_H1)
    );
  });
  it("H1DevelopedApplication: The callFee function should return the fee contracts value for the fee.", async () => {
    expect(await H1DevelopedApplication.callFee()).to.equal(1);
    await OracleContract.setPriceAverage(ONE_H1);

    const FeeFromFeeContract = await FeeContract.queryOracle();
    expect(FeeFromFeeContract.toString()).to.equal(ONE_H1.toString());
  });
  it("H1DevelopedApplication: The callFee function should mirror fee contracts address set in the constructor.", async () => {
    expect(await H1DevelopedApplication.FeeContract()).to.equal(
      FeeContract.address
    );
  });
  it("H1DevelopedApplication: The contract should not deploy if the fee contract address is set to 0.", async () => {
    //use unspecified because cannot estimate gas will be returned
    await expectRevert(
      H1DevelopedApplicationFactory.deploy(
        "0x0000000000000000000000000000000000000000",
        ContractDeployer,
        1
      ),
      "123"
    );
  });
  it("H1DevelopedApplication: The set function in simple storage with dev fee should the value for the function get.", async () => {
    await SimpleStorageWithDevAppFee.set(1, { value: 1 });
    expect(await SimpleStorageWithDevAppFee.get()).to.equal(1);
  });
  it("H1DevelopedApplication: The set function should not allow values lower than the oracle value.", async () => {
    await SimpleStorageWithDevAppFee.set(1, { value: 1 });
    //here
    await OracleContract.setPriceAverage(100);

    await time.increase(time.duration.days(2));
    await Address3Sig.sendTransaction({
      to: FeeContract.address,
      value: SIX_H1,
    });
    await FeeContract.distributeFeesToChannels();
    await expectRevert(SimpleStorageWithDevAppFee.set(1, { value: 99 }), "125");
    await SimpleStorageWithDevAppFee.set(1, { value: 100 });
    expect(await SimpleStorageWithDevAppFee.get()).to.equal(1);
  });
  it("H1DevelopedApplication: The function setDevApplicationFee should run with out error if called above the the minium fee and by the right address.", async () => {
    await H1DevelopedApplication.setDevApplicationFee(100);
  });
  it("H1DevelopedApplication: The function callMinimumViableFee() should revert if the devFee is too low.", async () => {
    await FeeContract.setMinFee(100);
    await expectRevert(H1DevelopedApplication.callMinimumViableFee(), "131");
  });
  it("H1DevelopedApplication: The function calculateDevFee() should return devFee * USD.", async () => {
    await H1DevelopedApplication.setDevApplicationFee(1);
  });
  it("H1DevelopedApplication: The function setDevApplicationFee() should only be callabe by the developerWallet.", async () => {
    await expectRevert(
      H1DevelopedApplication.connect(Address3Sig).setDevApplicationFee(89),
      "123"
    );
  });
  //
  it("H1DevelopedApplication: The function setDevApplicationFee() should only not allow values less than the fee contract permits.", async () => {
    await FeeContract.setMinFee(100);
    await expectRevert(H1DevelopedApplication.setDevApplicationFee(89), "131");
  });
  it("H1DevelopedApplication: Contracts that import and use devApplicationFee() disperse H1 to the dev wallet provided.", async () => {
    await SimpleStorageWithDevAppFee.setDevApplicationFee(TEN_H1);

    const NINE_H1_STRING = NINE_H1.toString();
    const ONE_H1_STRING = ONE_H1.toString();
    await expect(
      SimpleStorageWithDevAppFee.connect(Address3Sig).set(1, { value: TEN_H1 })
    ).to.changeEtherBalances(
      [ContractDeployerSigner, FeeContractSigner],
      [NINE_H1_STRING, ONE_H1_STRING]
    );
    expect(await SimpleStorageWithDevAppFee.get()).to.equal(1);
  });
  it("H1DevelopedApplication: The example contract SimpleStorageWithDevAppFee get function should get the variable stored data.", async () => {
    SimpleStorageWithDevAppFee.set(1, { value: 1 });
    expect(await SimpleStorageWithDevAppFee.get()).to.equal(1);
  });
  it("H1DevelopedApplication: The imported devApplicationFee( modifer should revert if transfer to fee contract fails.", async () => {
    await BadFeeContract.setAgainFee();
    await expectRevert(SimpleStorageBadFeeContract.set(1, { value: 1 }), "112");
  });
  it("H1DevelopedApplication: The modifer devApplicationFee() should cause a revert if transfer to the developer wallet fails.", async () => {
    await expectRevert(SimpleStorageBadDevWallet.set(1, { value: 1 }), "112");
  });
  it("H1DevelopedApplication: The imported devApplicationFeeWithPayment modifer should revert if transfer to fee contract fails.", async () => {
    await BadFeeContract.setAgainFee();
    await expectRevert(SimpleStorageBadFeeContract.setAndPayForIt(1, { value: 1 }), "112");
  });
  it("H1DevelopedApplication: The modifer devApplicationFeeWithPayment() should cause a revert if transfer to the developer wallet fails.", async () => {
    await expectRevert(SimpleStorageBadDevWallet.setAndPayForIt(1, { value: 1 }), "112");
  });
});
