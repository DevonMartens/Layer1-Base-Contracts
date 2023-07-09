const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const { expectRevert } = require("@openzeppelin/test-helpers");

ONE_H1 = ethers.utils.parseUnits("1", "ether");
NINE_H1 = ethers.utils.parseUnits("9", "ether");
TEN_H1 = ethers.utils.parseUnits("10", "ether");

describe("H1NativeApplication and Imported Modifier applicationFee()", function () {
  let H1NativeApplicationFactory;
  let H1NativeApplicationDeployed;
  let SimpleStorageWithFeeDeployed;
  let FeeContract;
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
      ],
      { initializer: "initialize", kind: "uups" }
    );
    H1NativeApplicationDeployed = await H1NativeApplicationFactory.deploy(
      FeeContract.address
    );

    SimpleStorageWithFeeDeployed = await SimpleStorageWithFeeFactory.deploy(
      FeeContract.address
    );
  });
  it("H1NativeApplication Contract: The callFee function value should match fee contracts queryOracle() value.", async () => {
    // Starts with callFee - since fee contract was just deployed this is 0.
    expect(await H1NativeApplicationDeployed.callFee()).to.equal(0);
    // sets the price to one H1 
    await OracleContract.setPriceAverage(ONE_H1);
    // Fee contract runs resetFee
    await FeeContract.resetFee();
    //confirms its been reset
    const FeeFromFeeContract = await FeeContract.queryOracle();
    expect(FeeFromFeeContract.toString()).to.equal(ONE_H1.toString());
    // Cool simple storage works we expect this
    await SimpleStorageWithFeeDeployed.set(1, { value: ONE_H1 });
    // 24 hours aka epotch wait time
    await time.increase(time.duration.days(1));
    // You're right this will revert until someone calls reset fee
    await expectRevert(SimpleStorageWithFeeDeployed.set(1, { value: ONE_H1 }), "resetFee()");
    await FeeContract.resetFee();
    await SimpleStorageWithFeeDeployed.set(1, { value: ONE_H1 });
  });
});
