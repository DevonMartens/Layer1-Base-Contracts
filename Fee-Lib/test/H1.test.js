const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const { expectRevert } = require("@openzeppelin/test-helpers");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

ONE_H1 = ethers.utils.parseUnits("1", "ether");
NINE_H1 = ethers.utils.parseUnits("9", "ether");
TEN_H1 = ethers.utils.parseUnits("10", "ether");

describe("H1NativeApplication and Imported Modifier applicationFee()", function () {
  let H1NativeApplicationFactory;
  let H1NativeApplicationDeployed;
  let SimpleStorageWithFeeDeployed;
  let SimpleStorageBadFeeContract;
  let FeeContract;
  let BadFeeContract;
  let FeeContractSignerForBalanceChecks;
  beforeEach(async () => {
    // Gets signers and addresses
    const [ContractDeployers, Address2s, Address3s] = await ethers.getSigners();
    ContractDeployer = await ContractDeployers.getAddress();
    Address2 = await Address2s.getAddress();
    Address3 = await Address3s.getAddress();
    Address3Sig = ethers.provider.getSigner(Address3);
    // Contract inputs
    const addressArray = [Address2, ContractDeployer, Address3];
    const weightArray = [1, 2, 3];
    // Gets Contract Factories
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
    // Deploys Contracts
    OracleContract = await OracleFactory.deploy();

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
        OracleContract.address,
        ValidatorArray,
        weightArray,
        ContractDeployer,
        ContractDeployer,
        2
      ],
      { initializer: "initialize", kind: "uups" }
    );
    BadFeeContract = await BadFeeContractFactory.deploy(
      OracleContract.address,
      ValidatorArray,
      weightArray,
      ContractDeployer,
      ContractDeployer
    );

    H1NativeApplicationDeployed = await H1NativeApplicationFactory.deploy(
      FeeContract.address
    );

    SimpleStorageWithFeeDeployed = await SimpleStorageWithFeeFactory.deploy(
      FeeContract.address
    );
    SimpleStorageBadFeeContract = await SimpleStorageWithFeeFactory.deploy(
      BadFeeContract.address
    );
    FeeContractSignerForBalanceChecks = ethers.provider.getSigner(
      FeeContract.address
    );
  });
  it("H1NativeApplication Contract: contracts importing the modifier applicationFee() will have functions that revert with 125 if not enough H1 is passed into a function.", async () => {
    await expectRevert(SimpleStorageWithFeeDeployed.set(1), "125");
    await SimpleStorageWithFeeDeployed.set(1, { value: 1 });
  });
  it("H1NativeApplication Contract: Functions using the modifier applicationFee() will revert if transfer to fee library fails", async () => {
    await BadFeeContract.setAgainFee();
    await expectRevert(SimpleStorageBadFeeContract.set(1, { value: 1 }), "112");
  });
  //
  it("H1NativeApplication Contract: Functions using the modifier applicationFeeWithPayment() will revert if transfer to fee library fails", async () => {
    await BadFeeContract.setAgainFee();
    await expectRevert(SimpleStorageBadFeeContract.setAndPayForIt(1, { value: 1 }), "112");
   
  });
  it("H1NativeApplication Contract: The modifer applicationFee() disperse ether to the Fee Contract.", async () => {
    await OracleContract.setPriceAverage(TEN_H1);
    await Address3Sig.sendTransaction({
      to: FeeContract.address,
      value: TEN_H1,
    });
    await time.increase(time.duration.days(2));
    const TEN_H1_STRING = TEN_H1.toString();
    //reading as 1 here
    await SimpleStorageWithFeeDeployed.set(1, {value: TEN_H1})
    await expect(
      SimpleStorageWithFeeDeployed.connect(Address3Sig).set(1, {
        value: TEN_H1,
      })
    ).to.changeEtherBalance(FeeContractSignerForBalanceChecks, TEN_H1_STRING);

    
  });
  it("H1NativeApplication Contract: Contracts importing H1NativeApplication will require the correct Fee to execute functions with the applicationFee() modifer.", async () => {
    // await SimpleStorageWithFeeDeployed.set(1);
    //
    await SimpleStorageWithFeeDeployed.set(1, { value: 1 });
    expect(await SimpleStorageWithFeeDeployed.get()).to.equal(1);
  });
  it("H1NativeApplication: The modifer applicationFee() should still work after 24 hours.", async () => {
    await OracleContract.setPriceAverage(ONE_H1);

    
    //send fees to contract then call function to disperse
    await Address3Sig.sendTransaction({
      to: FeeContract.address,
      value: TEN_H1,
    });
    await time.increase(time.duration.days(1));
    // txn reflects new price
    await SimpleStorageWithFeeDeployed.set(1, { value: ONE_H1 });
    //not enough H1
    await expectRevert(
      SimpleStorageWithFeeDeployed.set(1, { value: 343 }),
      "125"
    );
  });
  it("H1NativeApplication: The modifer applicationFeeWithPayment() should return extra values.", async () => {
    await SimpleStorageWithFeeDeployed.setAndPayForIt(1, { value: 6 });
    await SimpleStorageWithFeeDeployed.setAndPayForIt(1, { value: 27 });
  });
  it("H1NativeApplication: The modifer applicationFeeWithPayment() will revert if not enough fees are paid.", async () => {
    await expectRevert(SimpleStorageWithFeeDeployed.setAndPayForIt(1, { value: 0 }),"125");
  
  });
  it("H1NativeApplication: The modifer applicationFee() will return excess values.", async () => {
    await SimpleStorageWithFeeDeployed.set(1, { value: 2 });
  
  });
  it("H1NativeApplication Contract: The FeeContract() function should return the FeeContract address set in the constructor.", async () => {
    expect(await H1NativeApplicationDeployed.FeeContract()).to.equal(
      FeeContract.address
    );
  });
  it("H1NativeApplication Contract: The contract should not deploy if the fee contract address is set to 0.", async () => {
    //use unspecified because cannot estimate gas will be returned
    await expectRevert(
      H1NativeApplicationFactory.deploy(
        "0x0000000000000000000000000000000000000000"
      ),
      "123"
    );
  });
});
