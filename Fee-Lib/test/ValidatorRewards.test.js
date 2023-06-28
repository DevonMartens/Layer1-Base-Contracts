const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const { expectRevert } = require("@openzeppelin/test-helpers");

const TEN_H1 = ethers.utils.parseUnits("10", "ether");
const SEVEN_H1 = ethers.utils.parseUnits("7", "ether");
const SIX_H1 = ethers.utils.parseUnits("6", "ether");
const FIVE_H1 = ethers.utils.parseUnits("5", "ether");
const THREE_H1 = ethers.utils.parseUnits("3", "ether");
const TWO_H1 = ethers.utils.parseUnits("2", "ether");
const ONE_H1 = ethers.utils.parseUnits("1", "ether");

describe("Validator Rewards: H1 Management", function () {
  let owner;
  let ValidatorContract;
  let randomSig;
  let randomAddressIsTheSigner;
  let bob;
  let random;
  let other;
  beforeEach(async () => {
    //example wieghts 100% of bounty 1/1
    const wieghts = [1, 2, 3];
    //address of validators in validator rewards
    const [owners, randoms, bobs, others] = await ethers.getSigners();
    owner = await owners.getAddress();
    random = await randoms.getAddress();
    bob = await bobs.getAddress();
    other = await others.getAddress();
    //signiture for sending H!
    randomSig = ethers.provider.getSigner(random);
    const vadlidatorAddressArray = [owner, random, bob];
    //this is the contract we are looking at Validator Rewards.
    const ValidatorRewards = await ethers.getContractFactory(
      "ValidatorRewards"
    );
    ValidatorContract = await upgrades.deployProxy(
      ValidatorRewards,
      [vadlidatorAddressArray, wieghts, owner, owner,],
      { initializer: "initialize", kind: "uups" }
    );
    // ValidatorContract.address = await   s();
    //get randoms signiture
    secondAddressSigner = await ethers.getSigner(random);
    randomAddressIsTheSigner = ValidatorContract.connect(secondAddressSigner);
  });
  it("ValidatorRewards should recieve H1", async () => {
    await randomSig.sendTransaction({
      to: ValidatorContract.address,
      value: ethers.utils.parseEther("1.0"), // Sends exactly 1.0 ether
    });
  });
  it("ValidatorRewards should distribute H1 as intended - via releaseAll view function `released` also should track the distribution", async () => {
    await randomSig.sendTransaction({
      to: ValidatorContract.address,
      value: TEN_H1,
    });
    //contract balance
    const contractBalance = await ethers.provider.getBalance(
      ValidatorContract.address
    );
    //release funds
    await randomAddressIsTheSigner.releaseAll();
    //get bobs info
    expect(await ValidatorContract.released(bob)).to.equal(FIVE_H1);
  });
  it("ValidatorRewards should distribute H1 as intended - via release function for a single user", async () => {
    // send two eth to the contract
    await randomSig.sendTransaction({
      to: ValidatorContract.address,
      value: TWO_H1,
    });
    //check contract balance
    expect(
      await ethers.provider.getBalance(ValidatorContract.address)
    ).to.equal(TWO_H1);
    expect(await ValidatorContract.released(bob)).to.equal(0);
    // //release funds
    await randomAddressIsTheSigner.release(bob);
    // get bobs info afer release
    expect(await ValidatorContract.released(bob)).to.equal(ONE_H1);
  });
  it("ValidatorRewards release function should revert if the user has no shares", async () => {
    await expectRevert(randomAddressIsTheSigner.release(other), "126");
  });
  it("ValidatorRewards validators function should return the validators address from the array index", async () => {
    expect(await ValidatorContract.validators(0)).to.equal(owner);
    expect(await ValidatorContract.validators(1)).to.equal(random);
  });
});
describe("Validator Rewards: Testing the view functions ", function () {
  let owner;
  let bob;
  let random;
  let other;
  let ValidatorContract;
  let randomAddressIsTheSigner;
  let randomSig;
  beforeEach(async () => {
    //example wieghts 100% of bounty 1/1
    const wieghts = [1, 2, 3];
    //address of validators in validator rewards
    const [owners, randoms, bobs, others] = await ethers.getSigners();
    owner = await owners.getAddress();
    random = await randoms.getAddress();
    bob = await bobs.getAddress();
    other = await others.getAddress();
    const vadlidatorAddressArray = [owner, bob, random];
    //this is the contract we are looking at Validator Rewards.
    const ValidatorRewards = await ethers.getContractFactory(
      "ValidatorRewards"
    );
    ValidatorContract = await upgrades.deployProxy(
      ValidatorRewards,
      [vadlidatorAddressArray, wieghts, owner, owner,],
      { initializer: "initialize", kind: "uups" }
    );
    randomSig = ethers.provider.getSigner(random);
    //get randoms signiture for contract txns
    randomSig = await ethers.getSigner(random);
    randomAddressIsTheSigner = ValidatorContract.connect(secondAddressSigner);
  });
  it("totalShares should return the sum of all of the shares", async () => {
    expect(await ValidatorContract.totalShares()).to.equal(6);
  });
  it("the view function totalReleased() should account for the amount of Ether distributed from the contract", async () => {
    await randomSig.sendTransaction({
      to: ValidatorContract.address,
      value: TEN_H1,
    });
    //contract balance
    const contractBalance = await ethers.provider.getBalance(
      ValidatorContract.address
    );
    //end funds
    await randomAddressIsTheSigner.releaseAll();
    const hi = await ValidatorContract.totalReleased();
    //   expect(ethers.BigNumber.from(await ValidatorContract.totalReleased())).to.be.closeTo(TEN_H1)
  });
  it("the view function shares() should return the number of shares each account holds", async () => {
    expect(await ValidatorContract.shares(owner)).to.equal(1);
    expect(await ValidatorContract.shares(random)).to.equal(3);
    expect(await ValidatorContract.shares(bob)).to.equal(2);
  });
  it("the view function releasable() should return the amount of ether each reciepnt can get", async () => {
    await randomSig.sendTransaction({
      to: ValidatorContract.address,
      value: SIX_H1,
    });
    //checks how much owner bob and random should get
    expect(await ValidatorContract.releasable(random)).to.equal(THREE_H1);
    expect(await ValidatorContract.releasable(bob)).to.equal(TWO_H1);
    expect(await ValidatorContract.releasable(owner)).to.equal(ONE_H1);
  });
  it("the view isOriginalAddress should return false if the address is in the validators array", async () => {
    expect(await ValidatorContract.isOriginalAddress(random)).to.equal(false);
    expect(await ValidatorContract.isOriginalAddress(other)).to.equal(true);
  });
});
describe("Validator Rewards: Validator Management", function () {
  let owner;
  let ValidatorContract;
  let randomAddressIsTheSigner;
  let randomSig;
  let random;
  let bob;
  let other;
  beforeEach(async () => {
    //example wieghts 100% of bounty 1/1
    const wieghts = [1, 2, 3];
    //address of validators in validator rewards
    const [owners, randoms, bobs, otherAddress] = await ethers.getSigners();
    owner = await owners.getAddress();
    random = await randoms.getAddress();
    other = await otherAddress.getAddress();
    bob = await bobs.getAddress();
    const vadlidatorAddressArray = [owner, bob, random];
    //this is the contract we are looking at Validator Rewards.
    const ValidatorRewards = await ethers.getContractFactory(
      "ValidatorRewards"
    );
    ValidatorContract = await upgrades.deployProxy(
      ValidatorRewards,
      [vadlidatorAddressArray, wieghts, owner, owner,],
      { initializer: "initialize", kind: "uups" }
    );
    randomSig = ethers.provider.getSigner(random);
    //get randoms signiture
    secondAddressSigner = await ethers.getSigner(random);
    randomAddressIsTheSigner = ValidatorContract.connect(secondAddressSigner);
  });
  it("adjustValidatorShares should adjust validator shares and change the payment", async () => {
    expect(await ValidatorContract.totalShares()).to.equal(6);
    await ValidatorContract.adjustValidatorShares(owner, 2);
    expect(await ValidatorContract.totalShares()).to.equal(7);
    expect(await ValidatorContract.shares(owner)).to.equal(2);
    await randomSig.sendTransaction({
      to: ValidatorContract.address,
      value: SEVEN_H1,
    });
    //call release all
    await randomAddressIsTheSigner.releaseAll();
    //get owner release info
    expect(await ValidatorContract.released(owner)).to.equal(TWO_H1);
  });
  it("adjustValidatorShares will revert if the address is already in the validaotors array", async () => {
    await expectRevert(
      ValidatorContract.adjustValidatorShares(other, 23),
      "127"
    );
  });
  it("adjustValidatorShares will revert if someoneone puts in a zero for share numbers", async () => {
    await expectRevert(ValidatorContract.adjustValidatorShares(bob, 0), "128");
  });
  it("adjustValidatorAddress should adjust validator address that recieves payment", async () => {
    expect(await ValidatorContract.shares(bob)).to.equal(2);
    //giving owner shares to joe
    await ValidatorContract.adjustValidatorAddress(1, other);
    //checking owner shares to ensure they are gone, because other has them
    expect(await ValidatorContract.shares(bob)).to.equal(0);

    await randomSig.sendTransaction({
      to: ValidatorContract.address,
      value: THREE_H1,
    });
    //verify owner gets none of that - no releaseable H1
    expect(await ValidatorContract.releasable(bob)).to.equal(0);
    await ValidatorContract.releaseAll();
    //checks what owner got - should be none
    expect(await ValidatorContract.released(bob)).to.equal(0);
    // //checks what other got - should be one eth
    expect(await ValidatorContract.released(other)).to.equal(ONE_H1);
  });
  it("adjustValidatorAddress should adjust validator address that recieves payment", async () => {
    await expectRevert(
      ValidatorContract.adjustValidatorAddress(
        1,
        "0x0000000000000000000000000000000000000000"
      ),
      "123"
    );
  });
  it("addValidator should change the dispersed payments and totalShares amounts and correctly pay all validators", async () => {
    await randomSig.sendTransaction({
      to: ValidatorContract.address,
      value: SIX_H1,
    });
    //bobs ether owned
    expect(await ValidatorContract.releasable(bob)).to.equal(TWO_H1);
    // //random owed
    expect(await ValidatorContract.releasable(random)).to.equal(THREE_H1);
    //brings contract to three eth so all expected splits are maintained
    await randomSig.sendTransaction({
      to: ValidatorContract.address,
      value: ONE_H1,
    });
    await ValidatorContract.addValidator(other, 1);
    // gets expected splits for every user
    expect(await ValidatorContract.releasable(bob)).to.equal(TWO_H1);
    // //random owed
    expect(await ValidatorContract.releasable(random)).to.equal(THREE_H1);
    //other
    expect(await ValidatorContract.releasable(other)).to.equal(ONE_H1);
    // //owner owed
    expect(await ValidatorContract.releasable(owner)).to.equal(ONE_H1);
  });
  it("addValidator should revert if someone tries to add a 0 address", async () => {
    await expectRevert(
      ValidatorContract.addValidator(
        "0x0000000000000000000000000000000000000000",
        1
      ),
      "105"
    );
  });
  it("addValidator should revert if someone tries to add a 0 shares", async () => {
    await expectRevert(ValidatorContract.addValidator(other, 0), "128");
  });
  it("addValidator should revert if an address already has shares", async () => {
    await expectRevert(ValidatorContract.addValidator(owner, 1), "129");
  });
});
describe("Validator Rewards: Adjustments in Validators impact on dispursement of funds", function () {
  let owner;
  let ValidatorContract;
  let randomSig;
  let randomAddressIsTheSigner;
  let bob;
  let random;
  let other;
  beforeEach(async () => {
    //example wieghts 100% of bounty 1/1
    const wieghts = [1, 2, 3];
    //address of validators in validator rewards
    const [owners, randoms, bobs, others, sams] = await ethers.getSigners();
    owner = await owners.getAddress();
    random = await randoms.getAddress();
    bob = await bobs.getAddress();
    other = await others.getAddress();
    //signiture for sending H!
    randomSig = ethers.provider.getSigner(random);
    const vadlidatorAddressArray = [owner, random, bob];
    //this is the contract we are looking at Validator Rewards.
    const ValidatorRewards = await ethers.getContractFactory(
      "ValidatorRewards"
    );
    ValidatorContract = await upgrades.deployProxy(
      ValidatorRewards,
      [vadlidatorAddressArray, wieghts, owner, owner,],
      { initializer: "initialize", kind: "uups" }
    );
    // ValidatorContract.address = await   s();
    //get randoms signiture
    secondAddressSigner = await ethers.getSigner(random);
    randomAddressIsTheSigner = ValidatorContract.connect(secondAddressSigner);
  });
  it("adjusting validator should adjust the releasable function", async () => {
    await randomSig.sendTransaction({
      to: ValidatorContract.address,
      value: SIX_H1,
    });
    await ValidatorContract.adjustValidatorAddress(0, other);
    expect(await ValidatorContract.releasable(other)).not.to.be.equal(
      await ValidatorContract.releasable(owner)
    );
  });
});
describe("Validator Rewards: AccessControl In the contract", function () {
  let owner;
  let bob;
  let random;
  let other;
  let ValidatorContract;
  let randomSig;
  let OPERATOR_ROLE;
  let FROM;
  let wieghts;
  let vadlidatorAddressArray;
  let DEFAULT_ADMIN_ROLE;
  let ValidatorRewards;
  let FromOwner;
  beforeEach(async () => {
    //example wieghts 100% of bounty 1/1
    wieghts = [1, 2, 3];
    //address of validators in validator rewards
    const [owners, randoms, bobs, others, sams] = await ethers.getSigners();
    owner = await owners.getAddress();
    random = await randoms.getAddress();
    bob = await bobs.getAddress();
    other = await others.getAddress();
    //signiture for sending H!
    randomSig = ethers.provider.getSigner(random);
    vadlidatorAddressArray = [owner, random, bob];
    //this is the contract we are looking at Validator Rewards.
    ValidatorRewards = await ethers.getContractFactory("ValidatorRewards");
    ValidatorContract = await upgrades.deployProxy(
      ValidatorRewards,
      [vadlidatorAddressArray, wieghts, owner, owner,],
      { initializer: "initialize", kind: "uups" }
    );
    // for error message for signers
    FROM = random.toLowerCase();
    FromOwner = owner.toLowerCase();
    OPERATOR_ROLE = await ValidatorContract.OPERATOR_ROLE();
    DEFAULT_ADMIN_ROLE = await ValidatorContract.DEFAULT_ADMIN_ROLE();
  });
  it("initalize should only be called upon deployment", async () => {
    await expectRevert(
      ValidatorContract.initialize(
        vadlidatorAddressArray,
        wieghts,
        other,
        other
      ),
      "Initializable: contract is already initialized"
    );
  });
  it("upgrades should only be allowed to be called by DEFAULT_ADMIN_ROLE", async function () {
    const ValidatorContractHasADifferentUpgrader = await upgrades.deployProxy(
      ValidatorRewards,
      [vadlidatorAddressArray, wieghts, alice, alice],
      { initializer: "initialize", kind: "uups" }
    );
    await expectRevert(
      upgrades.upgradeProxy(
        ValidatorContractHasADifferentUpgrader.address,
        ValidatorRewards,
        {
          kind: "uups",
        }
      ),
      `AccessControl: account ${FromOwner} is missing role ${DEFAULT_ADMIN_ROLE}`
    );
    const ValidatorContractV2 = await upgrades.upgradeProxy(
      ValidatorContract.address,
      ValidatorRewards,
      {
        kind: "uups",
      }
    );
  });
  it("adjusting validator should only be called by OPERATOR_ROLE", async () => {
    await expectRevert(
      ValidatorContract.connect(randomSig).adjustValidatorShares(owner, 2),
      `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
    );
  });
  it("adjusting validator should adjust the shars of an address", async () => {
    await ValidatorContract.adjustValidatorShares(owner, 2);
    expect(await ValidatorContract.shares(owner)).to.equal(2);
  });
  it("adjustValidatorAddress validator should only be called by OPERATOR_ROLE", async () => {
    await expectRevert(
      ValidatorContract.connect(randomSig).adjustValidatorAddress(0, random),
      `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
    );
  });
  it("addValidator validator should only be called by OPERATOR_ROLE", async () => {
    await expectRevert(
      ValidatorContract.connect(randomSig).addValidator(other, 75),
      `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
    );
  });
  it("If an address is not the DEFAULT_ADMIN_ROLE it should not be able to adjust the OPERATOR_ROLE", async () => {
    const DEFAULT_ADMIN_ROLE = await ValidatorContract.DEFAULT_ADMIN_ROLE();
    await expectRevert(
      ValidatorContract.connect(randomSig).grantRole(OPERATOR_ROLE, bob),
      `AccessControl: account ${FROM} is missing role ${DEFAULT_ADMIN_ROLE}`
    );
  });
  it("If an address is not the DEFAULT_ADMIN_ROLE it should not be able to adjust the OPERATOR_ROLE", async () => {
    const ValidatorRewards = await ethers.getContractFactory(
      "ValidatorRewards"
    );
    const ValidatorContractForTest = await upgrades.deployProxy(
      ValidatorRewards,
      [vadlidatorAddressArray, wieghts, random, owner],
      { initializer: "initialize", kind: "uups" }
    );
    const DEFAULT_ADMIN_ROLE =
      await ValidatorContractForTest.DEFAULT_ADMIN_ROLE();
    expect(
      await ValidatorContractForTest.connect(randomSig).hasRole(
        DEFAULT_ADMIN_ROLE,
        owner
      )
    ).to.equal(false);
    //, `AccessControl: account ${FROM} is missing role ${DEFAULT_ADMIN_ROLE}`)
  });
});
