const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const { expectRevert } = require("@openzeppelin/test-helpers");

ONE_H1 = ethers.utils.parseUnits("1", "ether");
NINE_H1 = ethers.utils.parseUnits("9", "ether");
TEN_H1 = ethers.utils.parseUnits("10", "ether");

describe("Contract Interactions", function () {
  let owner;
  let ownerSigner;
  let OracleContract;
  let ValidatorContract;
  let ValidatorContract2;
  let ValidatorContract3;
  let FeeContract;
  let random;
  let randomSig;
  let randomAddressIsTheSigner;
  let H1NativeApplicationDeployed;
  let SimpleStorageWithFeeDeployed;
  let H1NativeApplicationFactory;
  let H1DevelopedApplication;
  let SimpleStorageWithDevAppFee;
  let H1DevelopedApplicationFactory;
  let FeeContractSigner;
  let SimpleStorageBadFeeContract;
  let BadFeeContract;
  let SimpleStorageBadDevWallet;
  beforeEach(async () => {
    //addresses for using
    const [owners, alices, randoms] = await ethers.getSigners();
    owner = await owners.getAddress();
    alice = await alices.getAddress();
    random = await randoms.getAddress();
    randomSig = ethers.provider.getSigner(random);
    ownerSigner = ethers.provider.getSigner(owner);
    //get contract factories
    const ValidatorRewardsFactory = await ethers.getContractFactory(
      "ValidatorRewards"
    );
    const FeeContractFactory = await ethers.getContractFactory("FeeContract");
    const OracleFactory = await ethers.getContractFactory("FeeOracle");
    const BadFeeContractFactory = await ethers.getContractFactory(
      "HasNoRecieveFunctionForFailedTxns"
    );
    H1NativeApplicationFactory = await ethers.getContractFactory(
      "H1NativeApplication"
    );
    const SimpleStorageWithFeeFactory = await ethers.getContractFactory(
      "SimpleStorageWithFee"
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
    //bad fee contract
    BadFeeContract = await 
      BadFeeContractFactory.deploy(
      OracleContract.address, ValidatorArray, weightArray, owner, owner
    );
    FeeContractSigner = ethers.provider.getSigner(FeeContract.address);
    secondAddressSigner = await ethers.getSigner(random);
    randomAddressIsTheSigner = FeeContract.connect(secondAddressSigner);
    //H1NativeApplication contains modifer to import into all contracts for recieving funds
    H1NativeApplicationDeployed = await H1NativeApplicationFactory.deploy(
      FeeContract.address
    );
    H1DevelopedApplication = await H1DevelopedApplicationFactory.deploy(
      FeeContract.address,
      owner
    );
    //simple storage for testing
    SimpleStorageWithFeeDeployed = await SimpleStorageWithFeeFactory.deploy(
      FeeContract.address
    );
    SimpleStorageWithDevAppFee = await SimpleStorageWithDevAppFeeFactory.deploy(
      FeeContract.address,
      owner
    );
    SimpleStorageBadFeeContract =
      await SimpleStorageWithDevAppFeeFactory.deploy(
        BadFeeContract.address,
        owner
      );
    SimpleStorageBadDevWallet = await SimpleStorageWithDevAppFeeFactory.deploy(
      FeeContract.address,
      BadFeeContract.address
    );
  });

  it("The oracle should be requesting the amount from simple storage", async () => {
    await FeeContract.resetFee();
    await expectRevert(SimpleStorageWithFeeDeployed.set(1), "125");
    await SimpleStorageWithFeeDeployed.set(1, { value: 1 });
  });
  //20,21,23,26,50
  it("H1NativeApplication applicationFee() should not if call fee is 0 ", async () => {
    await SimpleStorageWithFeeDeployed.set(1);
  });
  it("H1NativeApplication applicationFee() should not if call fee is 0 and no value is sent but should if it is greater than", async () => {
    await SimpleStorageWithFeeDeployed.set(1);
    await FeeContract.resetFee();
    await expectRevert(SimpleStorageWithFeeDeployed.set(1), "125");
    await SimpleStorageWithFeeDeployed.set(1, { value: 1 });
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
  });
  //Next
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
  it("H1NativeApplication callFee should mirror fee contracts", async () => {
    expect(await H1DevelopedApplication.FeeContract()).to.equal(
      FeeContract.address
    );
  });
  it("H1NativeApplication should not deploy if the fee contract address is set to 0", async () => {
    //use unspecified because cannot estimate gas will be returned
    await expectRevert(
      H1DevelopedApplicationFactory.deploy(
        "0x0000000000000000000000000000000000000000",
        owner
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
  it("set in simple storage  should adjust get ", async () => {
    await SimpleStorageWithFeeDeployed.set(1);
    await FeeContract.resetFee();
    await SimpleStorageWithFeeDeployed.set(1, { value: 1 });
    expect(await SimpleStorageWithFeeDeployed.get()).to.equal(1);
  });

  it("H1DevelopedApplication devApplicationFee() disperse ether to the dev wallet provided", async () => {
    await OracleContract.setPriceAverage(TEN_H1);
    await FeeContract.resetFee();
    const NINE_H1_STRING = NINE_H1.toString();
    const ONE_H1_STRING = ONE_H1.toString();
    await expect(
      SimpleStorageWithDevAppFee.connect(randomSig).set(1, { value: TEN_H1 })
    ).to.changeEtherBalances(
      [ownerSigner, FeeContractSigner],
      [NINE_H1_STRING, ONE_H1_STRING]
    );
    expect(await SimpleStorageWithDevAppFee.get()).to.equal(1);
  });
  it("H1NativeApplication applicationFee() disperse ether to the Fee Contract", async () => {
    await OracleContract.setPriceAverage(TEN_H1);

    await FeeContract.resetFee();

    const TEN_H1_STRING = TEN_H1.toString();
    await expect(
      SimpleStorageWithFeeDeployed.connect(randomSig).set(1, { value: TEN_H1 })
    ).to.changeEtherBalance(FeeContractSigner, TEN_H1_STRING);
  });
  it("SimpleStorageWithDevAppFee set function should set the variable stored data", async () => {
    await SimpleStorageWithDevAppFee.set(1);
  });
  it("SimpleStorageWithDevAppFee get function should get the variable stored data", async () => {
    await SimpleStorageWithDevAppFee.set(1);
    expect(await SimpleStorageWithDevAppFee.get()).to.equal(1);
  });
  it("H1NativeApplication should revert if transfer to fee lib fails", async () => {
    await FeeContract.resetFee();
    await expectRevert(SimpleStorageBadDevWallet.set(1, { value: 1 }), "112");
  });
  it("H1NativeApplication should revert if transfer to fee lib fails", async () => {
    await BadFeeContract.setAgainFee();
    await expectRevert(SimpleStorageBadFeeContract.set(1, { value: 1 }), "112");
  });
  //       it("H1NativeApplication applicationFee() should throw an error if the FeeContract Can't recieve funds", async () => {
  //          const OracleFactoryForTest = await ethers.getContractFactory('FeeOracle');
  //       //deploy Oracle
  //          const OracleContractForTest = await OracleFactoryForTest.deploy();
  //          const SimpleStorageWithFeeFactoryForTest = await ethers.getContractFactory("SimpleStorageWithFee");

  //          const SimpleStorageWithFeeInvalidFeeContract = await SimpleStorageWithFeeFactoryForTest.deploy(FeeContract.address);
  //          await OracleContractForTest.setPriceAverage(TEN_H1)
  //          await FeeContract.resetFee();

  //         await SimpleStorageWithFeeInvalidFeeContract.setFeeContract(OracleContractForTest.address)

  //          const TEN_H1_STRING = TEN_H1.toString();
  //       await expect(
  //          SimpleStorageWithFeeInvalidFeeContract.connect(randomSig).set(1, {value: TEN_H1})
  //        ).to.changeEtherBalance(FeeContractSigner, TEN_H1_STRING)
  //      });
  //      it("H1DevelopedApplication devApplicationFee() should throw an error if the FeeContract Can't recieve funds", async () => {
  //       const SimpleStorageWithDevAppFeeFactoryForTest = await ethers.getContractFactory("SimpleStorageWithDevAppFee");
  //       const SimpleStorageWithDevAppFeeInvalidFeeContract = await SimpleStorageWithDevAppFeeFactoryForTest.deploy(FeeContract.address, owner)
  //       await OracleContract.setPriceAverage(TEN_H1)

  //       await FeeContract.resetFee();

  //       const TEN_H1_STRING = TEN_H1.toString();
  //    await expect(
  //       SimpleStorageWithDevAppFeeInvalidFeeContract.connect(randomSig).set(1, {value: TEN_H1})
  //     ).to.changeEtherBalance(FeeContractSigner, TEN_H1_STRING)
  //   });
});
