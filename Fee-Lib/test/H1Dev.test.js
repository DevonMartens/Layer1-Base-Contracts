const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const { expectRevert } = require("@openzeppelin/test-helpers");

ONE_H1 = ethers.utils.parseUnits("1", "ether");
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
      [OracleContract.address, ValidatorArray, weightArray, ContractDeployer, ContractDeployer],
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
  it("H1DevelopedApplication devApplicationFee() should not if call fee is 0 and no value is sent but should if it is greater than", async () => {
    await SimpleStorageWithDevAppFee.set(1);
    await FeeContract.resetFee();
    await expectRevert(SimpleStorageWithDevAppFee.set(1), "125");
    await SimpleStorageWithDevAppFee.set(1, { value: 1 });
  });
  it("H1DevelopedApplication devapplicationFee() should not allow a value less than the price", async () => {
    await OracleContract.setPriceAverage(ONE_H1);
    await FeeContract.resetFee();
    await expectRevert(SimpleStorageWithDevAppFee.set(1), "125");
    expect(() =>
      SimpleStorageWithDevAppFee.set(1, {
        value: ONE_H1,
      }).to.changeEtherBalance(FeeContract.address, ONE_H1)
    );
  });
  it("H1DevelopedApplication callFee should mirror fee contracts", async () => {
    expect(await H1DevelopedApplication.callFee()).to.equal(0);
    await OracleContract.setPriceAverage(ONE_H1);
    await FeeContract.resetFee();
    const FeeFromFeeContract = await FeeContract.queryOracle();
    expect(FeeFromFeeContract.toString()).to.equal(ONE_H1.toString());
  });
  it("H1DevelopedApplication callFee should mirror fee contracts", async () => {
    expect(await H1DevelopedApplication.FeeContract()).to.equal(
      FeeContract.address
    );
  });
  it("H1DevelopedApplication should not deploy if the fee contract address is set to 0", async () => {
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
  it("set in simple storage with dev fee should adjust get ", async () => {
    await SimpleStorageWithDevAppFee.set(1);
    await FeeContract.resetFee();
    await SimpleStorageWithDevAppFee.set(1, { value: 1 });
    expect(await SimpleStorageWithDevAppFee.get()).to.equal(1);
  });

  it("H1DevelopedApplication devApplicationFee() disperse ether to the dev wallet provided", async () => {
    await OracleContract.setPriceAverage(TEN_H1);
    await FeeContract.resetFee();
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
  it("SimpleStorageWithDevAppFee get function should get the variable stored data", async () => {
    await SimpleStorageWithDevAppFee.set(1);
    expect(await SimpleStorageWithDevAppFee.get()).to.equal(1);
  });
  it("H1DevelopedApplication should revert if transfer to fee lib fails", async () => {
    await BadFeeContract.setAgainFee();
    await expectRevert(SimpleStorageBadFeeContract.set(1, { value: 1 }), "112");
  });
  it("H1DevelopedApplication should revert if transfer to fee lib fails", async () => {
    await FeeContract.resetFee();
    await expectRevert(SimpleStorageBadDevWallet.set(1, { value: 1 }), "112");
  });
});
