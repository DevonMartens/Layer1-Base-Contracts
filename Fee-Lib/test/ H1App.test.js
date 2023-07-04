
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const { expectRevert } = require("@openzeppelin/test-helpers");

ONE_H1 = ethers.utils.parseUnits("1", "ether");
NINE_H1 = ethers.utils.parseUnits("9", "ether");
TEN_H1 = ethers.utils.parseUnits("10", "ether");

describe("H1NativeApplication and Imported Modifier applicationFee()", function () {
  let owner;
  let FeeContract;
  let H1NativeApplicationDeployed;
  let SimpleStorageWithFeeDeployed;
  let SimpleStorageWithFeeFactory;
  let SimpleStorageBadFeeContract;
  let BadFeeContract;
  let FeeContractSigner;
  let H1NativeApplicationFactory;
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
    const BadFeeContractFactory = await ethers.getContractFactory(
      "HasNoRecieveFunctionForFailedTxns"
    );
    const FeeContractFactory = await ethers.getContractFactory("FeeContract");
    const OracleFactory = await ethers.getContractFactory("FeeOracle");
    H1NativeApplicationFactory = await ethers.getContractFactory(
      "H1NativeApplication"
    );
    SimpleStorageWithFeeFactory = await ethers.getContractFactory(
      "SimpleStorageWithFee"
    );
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
      [OracleContract.address, ValidatorArray, weightArray, owner, owner],
      { initializer: "initialize", kind: "uups" }
    );
    BadFeeContract = await
      BadFeeContractFactory.deploy(OracleContract.address, ValidatorArray, weightArray, owner, owner);
    randomSig = await ethers.getSigner(random);
    secondAddressSigner = await ethers.getSigner(random);
    randomAddressIsTheSigner = FeeContract.connect(secondAddressSigner);
    //H1NativeApplication contains modifer to import into all contracts for recieving funds
    H1NativeApplicationDeployed = await H1NativeApplicationFactory.deploy(
      FeeContract.address
    );
    //simple storage for testing
    SimpleStorageWithFeeDeployed = await SimpleStorageWithFeeFactory.deploy(
      FeeContract.address
    );
    SimpleStorageBadFeeContract = await SimpleStorageWithFeeFactory.deploy(
      BadFeeContract.address
    );
    FeeContractSigner = ethers.provider.getSigner(FeeContract.address);
  });
  //20,21,23,26,50
  it("H1NativeApplication should revert with insuffiecent funds if not enough H1 is passed into a function", async () => {
    await FeeContract.resetFee();
    await expectRevert(SimpleStorageWithFeeDeployed.set(1), "125");
    await SimpleStorageWithFeeDeployed.set(1, { value: 1 });
    
  });
  //SimpleStorageWithFeeFactory
  it("H1NativeApplication should revert if transfer to fee lib fails", async () => {
    await BadFeeContract.setAgainFee();
    await expectRevert(SimpleStorageBadFeeContract.set(1, { value: 1 }), "112");
  });

  it("H1NativeApplication should revert if transfer to fee lib fails", async () => {
    await BadFeeContract.setAgainFee();
    await expectRevert(SimpleStorageBadFeeContract.set(1, { value: 1 }), "112");
  });
  it("H1NativeApplication applicationFee() disperse ether to the Fee Contract", async () => {
    await OracleContract.setPriceAverage(TEN_H1);

    await FeeContract.resetFee();

    const TEN_H1_STRING = TEN_H1.toString();
    await expect(
      SimpleStorageWithFeeDeployed.connect(randomSig).set(1, { value: TEN_H1 })
    ).to.changeEtherBalance(FeeContractSigner, TEN_H1_STRING);
  });
  it("set in simple storage  should adjust get ", async () => {
    await SimpleStorageWithFeeDeployed.set(1);
    await FeeContract.resetFee();
    await SimpleStorageWithFeeDeployed.set(1, { value: 1 });
    expect(await SimpleStorageWithFeeDeployed.get()).to.equal(1);
  });
  it("H1NativeApplication applicationFee() should not if call fee is 0 and no value is sent but should if it is greater than", async () => {
    await OracleContract.setPriceAverage(ONE_H1);
    await FeeContract.resetFee();
    await expectRevert(SimpleStorageWithFeeDeployed.set(1), "125");
    expect(() =>
      SimpleStorageWithFeeDeployed.set(1, {
        value: ONE_H1,
      }).to.changeEtherBalance(FeeContract.address, ONE_H1)
    );
  });
  it("H1NativeApplication callFee should mirror fee contracts", async () => {
    expect(await H1NativeApplicationDeployed.callFee()).to.equal(0);
    await OracleContract.setPriceAverage(ONE_H1);
    await FeeContract.resetFee();
    const FeeFromFeeContract = await FeeContract.queryOracle();
    expect(FeeFromFeeContract.toString()).to.equal(ONE_H1.toString());
  });
  it("H1NativeApplication callFee should mirror fee contracts", async () => {
    expect(await H1NativeApplicationDeployed.FeeContract()).to.equal(
      FeeContract.address
    );
  });
  it("H1NativeApplication should not deploy if the fee contract address is set to 0", async () => {
    //use unspecified because cannot estimate gas will be returned
    await expectRevert(
      H1NativeApplicationFactory.deploy(
        "0x0000000000000000000000000000000000000000"
      ),
      "123"
    );
    it("The oracle should be requesting the amount from simple storage", async () => {
      await FeeContract.resetFee();
      await expectRevert(SimpleStorageWithFeeDeployed.set(1), "125");
      await SimpleStorageWithFeeDeployed.set(1, { value: 1 });
    });
    it("H1NativeApplication applicationFee() should not if call fee is 0 ", async () => {
      await SimpleStorageWithFeeDeployed.set(1);
    });
    it("H1NativeApplication applicationFee() should not if call fee is 0 and no value is sent but should if it is greater than", async () => {
      await SimpleStorageWithFeeDeployed.set(1);
      await FeeContract.resetFee();
      await expectRevert(SimpleStorageWithFeeDeployed.set(1), "125");
      await SimpleStorageWithFeeDeployed.set(1, { value: 1 });
    });
  
  });

});
