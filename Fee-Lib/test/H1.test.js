const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const { expectRevert } = require("@openzeppelin/test-helpers");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

ONE_H1 = ethers.utils.parseUnits("1", "ether");
NINE_H1 = ethers.utils.parseUnits("9", "ether");
TEN_H1 = ethers.utils.parseUnits("10", "ether");
TWENTY_H1 = ethers.utils.parseUnits("20", "ether");

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
    const [ContractDeployers, Address2s, Address3s, Address4s] = await ethers.getSigners();
    ContractDeployer = await ContractDeployers.getAddress();
    Address2 = await Address2s.getAddress();
    Address3 = await Address3s.getAddress();
    ContractDSig = ethers.provider.getSigner(ContractDeployer);
    Address2Sig = ethers.provider.getSigner(Address2);
    Address3Sig = ethers.provider.getSigner(Address3);
    Address4Sig = ethers.provider.getSigner(Address3);
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
        2,
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

    SecondSimpleStorageWithFeeDeployed = await SimpleStorageWithFeeFactory.deploy(
      FeeContract.address
    );

    SimpleStorageBadFeeContract = await SimpleStorageWithFeeFactory.deploy(
      BadFeeContract.address
    );
    FeeContractSignerForBalanceChecks = ethers.provider.getSigner(
      FeeContract.address
    );
  });
  it("H1NativeApplication: Contracts importing the modifier `applicationFee()` will have functions that revert with 125 if not enough H1 is passed into a function.", async () => {
    await expectRevert(SimpleStorageWithFeeDeployed.set(1), "125");
    await SimpleStorageWithFeeDeployed.set(1, { value: 1 });
  });
  it("H1NativeApplication: Functions using the modifier `applicationFee()` will revert if transfer to fee library fails.", async () => {
    await BadFeeContract.setAgainFee();
    await expectRevert(SimpleStorageBadFeeContract.set(1, { value: 1 }), "112");
  });
  it("H1NativeApplication: Contracts importing the modifier `applicationFeeWithPaymentToContract()` will have functions that revert with 125 if not enough H1 is passed into a function.", async () => {
    await time.increase(time.duration.days(2));
    await expectRevert(SimpleStorageWithFeeDeployed.setAndPayForIt(1), "125");
  });
  //
  it("H1NativeApplication: The internal function ` _payApplicationWithFeeAndContract` will revert if transfer to fee library fails", async () => {
    await time.increase(time.duration.days(2));
    await expectRevert(
      SimpleStorageBadFeeContract.setAndPayForIt(1, { value: 25 }),
      "112"
    );
  });
  it("H1NativeApplication: The modifer `applicationFee()` disperse H1 to the Fee Contract.", async () => {
    await OracleContract.setPriceAverage(78797);
    await Address3Sig.sendTransaction({
      to: FeeContract.address,
      value: TWENTY_H1,
    });
    const initialResetTime = await FeeContract.nextResetTime();
    const initalFee = await FeeContract.getFee();
    ContractDeployerSig = ethers.provider.getSigner(ContractDeployer);
    await time.increase(time.duration.days(1));
    // update fee
    await SimpleStorageWithFeeDeployed.set(8, { value: TEN_H1 });
    expect(
    await  SimpleStorageWithFeeDeployed.set(1, {
        value: TEN_H1,
      })
    ).to.changeEtherBalance(
      FeeContractSignerForBalanceChecks,
      TEN_H1
    );
    await time.increase(3600)
    const FinalFee = await FeeContract.getFee();
    const updatedResetTime = await FeeContract.nextResetTime();
    expect(initalFee).not.to.equal(FinalFee);
    expect(updatedResetTime).to.not.equal(initialResetTime);
  });
  it("H1NativeApplication: If the next reset time is equal to the updated time the fee contract should update.", async () => {
    await OracleContract.setPriceAverage(78797);
    await Address3Sig.sendTransaction({
      to: FeeContract.address,
      value: TWENTY_H1,
    });
    const initialResetTime = await FeeContract.nextResetTime();
    const initalFee = await FeeContract.getFee();
    ContractDeployerSig = ethers.provider.getSigner(ContractDeployer);
    await time.increase(time.duration.days(1));
    await SecondSimpleStorageWithFeeDeployed.set(8, { value: TEN_H1 });
    await SimpleStorageWithFeeDeployed.set(8, { value: TEN_H1 });
    const FinalFee = await FeeContract.getFee();
    const updatedResetTime = await FeeContract.nextResetTime();
    expect(initalFee).not.to.equal(FinalFee);
    expect(updatedResetTime).to.not.equal(initialResetTime);
  });
  it("H1NativeApplication: If the next reset time is not equal to the updated time only the H1Native should update in that txn.", async () => {
    await OracleContract.setPriceAverage(78797);
    await Address3Sig.sendTransaction({
      to: FeeContract.address,
      value: TWENTY_H1,
    });
    const initialResetTime = await FeeContract.nextResetTime();
    const initalFee = await FeeContract.getFee();
    ContractDeployerSig = ethers.provider.getSigner(ContractDeployer);
    await time.increase(time.duration.days(1));
    await SecondSimpleStorageWithFeeDeployed.set(8, { value: TEN_H1 });
    await SimpleStorageWithFeeDeployed.set(8, { value: TEN_H1 });
    const FinalFee = await FeeContract.getFee();
    const updatedResetTime = await FeeContract.nextResetTime();
    expect(initalFee).not.to.equal(FinalFee);
    expect(updatedResetTime).to.not.equal(initialResetTime);
  });
  it("H1NativeApplication: Contracts importing H1NativeApplication will require the correct Fee to execute functions with the applicationFee() modifer.", async () => {
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
    await time.increase(time.duration.days(2));
    // txn reflects new price
    await SimpleStorageWithFeeDeployed.set(1, { value: ONE_H1 });
    await time.increase(500);
    //not enough H1
    await expectRevert(
      SimpleStorageWithFeeDeployed.set(1, { value: 343 }),
      "125"
    );
  });
  it("H1NativeApplication: Overflow should be returned to sender on standard fees.", async () => {
    await time.increase(time.duration.days(1));
    await SimpleStorageWithFeeDeployed.set(1, { value: 1 });
    await SimpleStorageWithFeeDeployed.set(1, { value: 2 });
    expect(() =>
     SimpleStorageWithFeeDeployed.set(1, {
      value: ONE_H1,
    }).to.changeEtherBalance(ContractDeployer, -6)
  );
  expect(() =>
     SimpleStorageWithFeeDeployed.set(1, {
      value: 6,
    }).to.changeEtherBalance(ContractDeployer, -6)
  );
  expect(() =>
    SimpleStorageWithFeeDeployed.set(1, {
      value: ONE_H1,
    }).to.changeEtherBalance(SimpleStorageWithFeeDeployed.address, 5)
  );
  expect(() =>
    SimpleStorageWithFeeDeployed.set(1, {
      value: 6,
    }).to.changeEtherBalance(FeeContract.address, 1)
  );
});
it("H1NativeApplication: On the prior fee the contract will revert if funds to make it to the fee contract.", async () => {
  await time.increase(time.duration.days(1));
  await expectRevert(SimpleStorageBadFeeContract.set(1, {value: 1}), "112");
});
  it("H1NativeApplication: Overflow should be returned to sender on standard fees.", async () => {
    await SimpleStorageWithFeeDeployed.setAndPayForIt(1, { value: 6 });
    await SimpleStorageWithFeeDeployed.setAndPayForIt(1, { value: 7 });
    expect(() =>
    SimpleStorageWithFeeDeployed.setAndPayForIt(1, {
      value: ONE_H1,
    }).to.changeEtherBalance(ContractDeployer, -6)
  );
  expect(() =>
    SimpleStorageWithFeeDeployed.setAndPayForIt(1, {
      value: 6,
    }).to.changeEtherBalance(ContractDeployer, -6)
  );
  expect(() =>
    SimpleStorageWithFeeDeployed.setAndPayForIt(1, {
      value: ONE_H1,
    }).to.changeEtherBalance(SimpleStorageWithFeeDeployed.address, 5)
  );
  expect(() =>
    SimpleStorageWithFeeDeployed.setAndPayForIt(1, {
      value: 6,
    }).to.changeEtherBalance(FeeContract.address, 1)
  );
});
  it("H1NativeApplication: The modifier applicationFeeWithPayment() should allow multiple payments at prior fee", async () => {
    await OracleContract.setPriceAverage(ONE_H1);
 
    await time.increase(time.duration.days(1));
    await time.increase(500);

    await SimpleStorageWithFeeDeployed.connect(Address4Sig).set(1, { value: 6 });
   
   async function sendTransactionsWithFee() {
    const sigArray = [ContractDSig, Address2Sig, Address3Sig, Address4Sig ]
    for (let i = 0; i < sigArray.length; i++) {
      SimpleStorageWithFeeDeployed.connect(sigArray[i]).set(1, { value: 6 });
      console.log(`Transaction ${i + 1} sent.`);
    }
  }

  await sendTransactionsWithFee();

    await time.increase(time.duration.hours(1));
    await expectRevert(
      SimpleStorageWithFeeDeployed.set(1, { value: 6 }),
      "125"
    );
  });
  it("H1NativeApplication: The modifer applicationFeeWithPayment() should return extra values.", async () => {
    await SimpleStorageWithFeeDeployed.setAndPayForIt(1, { value: 11 });
    await SimpleStorageWithFeeDeployed.setAndPayForIt(1, { value: 27 });
  });
  it("H1NativeApplication: The modifer applicationFeeWithPayment() should return extra values.", async () => {
    await SimpleStorageWithFeeDeployed.set(1, { value: 11 });
    await SimpleStorageWithFeeDeployed.set(1, { value: 27 });
  });
  it("H1NativeApplication: The modifer applicationFeeWithPayment() will revert if not enough fees are paid.", async () => {
    await expectRevert(
      SimpleStorageWithFeeDeployed.setAndPayForIt(1, { value: 0 }),
      "125"
    );
  });
  it("H1NativeApplication: The modifer applicationFee() will return excess values.", async () => {
    await SimpleStorageWithFeeDeployed.set(1, { value: 2 });
  });
  it("H1NativeApplication: The internal function `_payApplicationWithFeeAndContract` will revert if the transfer to the fee contract fails.", async () => {
    await expectRevert(SimpleStorageBadFeeContract.setAndPayForIt(1, { value: 27 }), "112");
  });
  it("H1NativeApplication: The internal function `_payApplicationWithFeeAndContract` will revert if the transfer to the fee contract fails.", async () => {
    await expectRevert(SimpleStorageBadFeeContract.setAndPayForIt(1, { value: 27 }), "112");
  });
  it("H1NativeApplication: The internal function `_payApplicationWithPriorFeeAndContract` will return overflow values if sent", async () => {
    await time.increase(time.duration.days(2));
    expect(() =>
        SimpleStorageWithFeeDeployed.setAndPayForIt(1, {
          value: ONE_H1,
        }).to.changeEtherBalance(ContractDeployer, -6)
      );
      expect(() =>
      SimpleStorageWithFeeDeployed.setAndPayForIt(1, {
        value: ONE_H1,
      }).to.changeEtherBalance(FeeContract.address, 1)
    );
    await SimpleStorageWithFeeDeployed.setAndPayForIt(1, { value: 6});
    });
    it("H1NativeApplication: The internal function `payApplicationWithPriorFee` will return overflow values if sent", async () => {
      await time.increase(time.duration.days(2));
      expect(() =>
          SimpleStorageWithFeeDeployed.set(1, {
            value: ONE_H1,
          }).to.changeEtherBalance(ContractDeployer, -6)
        );
        expect(() =>
        SimpleStorageWithFeeDeployed.set(1, {
          value: ONE_H1,
        }).to.changeEtherBalance(FeeContract.address, 1)
      );
      await SimpleStorageWithFeeDeployed.set(1, { value: 67});
      });
  it("H1NativeApplication: callFee should return the fee", async () => {
    expect(await H1NativeApplicationDeployed.callFee()).to.equal(1);
  });
  it("H1NativeApplication: The contract should not deploy if the fee contract address is set to 0.", async () => {
    //use unspecified because cannot estimate gas will be returned
    await expectRevert(
      H1NativeApplicationFactory.deploy(
        "0x0000000000000000000000000000000000000000"
      ),
      "123"
    );
  });
  it("H1NativeApplication: should handle excess payment correctly on line 177.", async function () {
    await time.increase(time.duration.days(2));
    // Perform necessary setup for the test
    const priorFee = 3; // Set the prior fee value
    const H1PaymentToFunction = 15; // Set the H1 payment value

    // Call function 177 with the specified values
    await SimpleStorageWithFeeDeployed.setAndPayForIt(1, { value: 150 });
    await SimpleStorageWithFeeDeployed.setAndPayForIt(1, { value: 150 });
    await SimpleStorageWithFeeDeployed.setAndPayForIt(1, { value: 150 });
  
    // Get the balance of the contract after the function call
    const contractBalance = await ethers.provider.getBalance(FeeContract.address);
    const contract2Balance = await ethers.provider.getBalance(SimpleStorageWithFeeDeployed.address);
    // Assert the balance and the expected overflow value
    expect(contractBalance).to.equal(priorFee);
    expect(contract2Balance).to.equal(H1PaymentToFunction);
  });
});
