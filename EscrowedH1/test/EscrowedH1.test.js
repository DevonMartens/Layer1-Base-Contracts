const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

const { expectRevert } = require("@openzeppelin/test-helpers");

const FIVE_H1 = ethers.utils.parseUnits("5", "ether");
const SIX_H1 = ethers.utils.parseUnits("6", "ether");
const TWENTY_H1 = ethers.utils.parseUnits("20", "ether");

describe("Vesting inputs working", function () {
  let owner;
  let alice;
  let Vesting;
  let year;
  beforeEach(async () => {
    const [owners, alices] = await ethers.getSigners();
    owner = await owners.getAddress();
    alice = await alices.getAddress();
    year = 31536000;
    const Escrow = await ethers.getContractFactory("EscrowedH1");
    Vesting = await upgrades.deployProxy(
      Escrow,
      ["EscrowedH1", "esH1", owner, owner, year],
      { initializer: "initialize", kind: "uups" }
    );
    await Vesting.mintEscrowedH1(owner, 5, { value: FIVE_H1 });
  });

  it("Escrow Contract Should mint tokens", async () => {
    const ownerBalance = await Vesting.balanceOf(owner);
    const vestingTotalSupply = await Vesting.totalSupply();
    expect(ownerBalance.toString()).to.equal(vestingTotalSupply.toString());
    expect(ownerBalance.toString()).to.equal("5");
  });
  it("Escrow should burn vested tokens", async () => {
    expect(await Vesting.balanceOf(owner)).to.equal(5);
    await Vesting.startVesting(5);
    expect(await Vesting.balanceOf(owner)).to.equal(0);
    //check for event
  });
  it("Vested tokens should be tracked by the contract and should be retrieved from `getUserVestingAmountFromDepositIndex`", async () => {
    //const ownerVestingAmountFromDepositIndex = await Vesting.getUserVestingAmountFromDepositIndex(owner, 0)
    await Vesting.startVesting(5);
    expect(
      await Vesting.getUserVestingAmountFromDepositIndex(owner, 0)
    ).to.equal(5);
  });
  it("Claimed tokens should be tracked by the contract and should be retrieved from `getUserVestingClaimedAmountFromIndex`", async () => {
    await Vesting.startVesting(5);
    expect(
      await Vesting.getUserVestingClaimedAmountFromIndex(owner, 0)
    ).to.equal(0);
  });
  it("A timestamp when the vesting begins callable by getUserVestingDepositTimestampFromIndex", async () => {
    await Vesting.startVesting(5);
    const timeNow = await time.latest();
    const benchMark = await Vesting.getUserVestingDepositTimestampFromIndex(owner, 0);
    expect(
          benchMark.toString()
        ).to.equal(timeNow.toString());
});
it("The amount a user vested should be callable via getUserVestingAmountFromDepositIndex", async () => {
  await Vesting.startVesting(5);
  expect(
    await Vesting.getUserVestingAmountFromDepositIndex(owner, 0)
      ).to.equal(5);
});
//
it("the information from a users vesting inputs callable via getUserVestingsByAddress", async () => {
  await Vesting.startVesting(5);
  await Vesting.mintEscrowedH1(owner, 6, { value: SIX_H1 });
  await Vesting.startVesting(6);
  const inputs = await Vesting.getUserVestingsByAddress(owner)
  
  expect(inputs[0].finishedClaiming).to.equal(false)
  expect(inputs[1].finishedClaiming).to.equal(false)
  
  const inputOneAmount = inputs[0].amount
  const inputTwoAmount = inputs[1].amount

  expect(inputOneAmount.toString()).to.equal("5") 
  expect(inputTwoAmount.toString()).to.equal("6")
 });
 it("the information from a users vesting input callable via getUserVestingByIndex", async () => {
  await Vesting.startVesting(5);
  await Vesting.mintEscrowedH1(owner, 6, { value: SIX_H1 });
  await Vesting.startVesting(6);

  const inputsNumberOne = await Vesting.getUserVestingByIndex(owner, 0)
  const inputsNumberTwo = await Vesting.getUserVestingByIndex(owner, 1)
  
  expect(inputsNumberOne.finishedClaiming).to.equal(false)
  expect(inputsNumberTwo.finishedClaiming).to.equal(false)
  
  const inputOneAmount = inputsNumberOne.amount
  const inputTwoAmount = inputsNumberTwo.amount

  expect(inputOneAmount.toString()).to.equal("5") 
  expect(inputTwoAmount.toString()).to.equal("6")
 });
 it("the information from a users vesting input callable via getUserVestingByIndex", async () => {
  await Vesting.startVesting(5);
  await time.increase(time.duration.years(1))
  await Vesting.claim(0)

  const inputsNumberOne = await Vesting.getUserVestingByIndex(owner, 0)
  
  expect(inputsNumberOne.finishedClaiming).to.equal(true)
  
 });
 it("the information about when a user last withdrew is callable via getUserLastClaimTimestampFromIndex", async () => {
  // await Vesting.startVesting(5);
  // await Vesting.mintEscrowedH1(owner, 6, { value: SIX_H1 });
  await Vesting.mintEscrowedH1(owner, 20, { value: TWENTY_H1 });
  await Vesting.startVesting(20);
  //get 1/2 year to claim 10 but maintain blob
  const sixMonths = time.duration.years(1) / 2;
    //increase time
  await time.increase(sixMonths);
  //collect
  await Vesting.claim(0);
  const timeNow = await time.latest();
  const timeWithDrawn = await Vesting.getUserLastClaimTimestampFromIndex(owner, 0)
  expect(timeWithDrawn.toString()).to.equal(timeNow.toString()) 
 });
});

describe("Withdraws/admin functions", function () {
  let owner;
  let alice;
  let Vesting;
  let year;
  let OPERATOR_ROLE;
  let FROM;
  let signerAlice;
  beforeEach(async () => {
    const [owners, alices] = await ethers.getSigners();
    owner = await owners.getAddress();
    alice = await alices.getAddress();
    year = 31536000;
    const Escrow = await ethers.getContractFactory("EscrowedH1");
    Vesting = await upgrades.deployProxy(
      Escrow,
      ["EscrowedH1", "esH1", owner, owner, year],
      { initializer: "initialize", kind: "uups" }
    );
    await Vesting.mintEscrowedH1(owner, 5, { value: FIVE_H1 });
    //get role
    OPERATOR_ROLE = await Vesting.OPERATOR_ROLE();
    FROM = alice.toLowerCase();
    const secondAddressSigner = await ethers.getSigner(alice);
    signerAlice = Vesting.connect(secondAddressSigner);
  });

  it("If an H1 is sent to the contract it should be able to be withdrawn via withdrawUnwrapped", async () => {
    //await Vesting.withdrawUnwrapped();
    FIVE_H1_STRING = FIVE_H1.toString();
    const ownerCompare = await ethers.getSigner(owner);
    await expect(() => Vesting.withdrawUnwrapped()).to.changeEtherBalance(
      ownerCompare,
      FIVE_H1_STRING
    );
  });
  it("If tokens sent to the contract they should be able to be withdrawn via withdrawWrapped", async () => {
    await Vesting.transfer(Vesting.address, 5);
    //checks tokens in contract
    const initalBalance = await Vesting.balanceOf(Vesting.address)
    expect(initalBalance.toString()).to.equal("5");
    //withdraws to owner
    await Vesting.withdrawWrapped();
    const postBalanceOwner = await Vesting.balanceOf(owner);
    //final balance of owner should be 5
    expect(postBalanceOwner.toString()).to.equal("5");
    //check contract
    const postBalance = await Vesting.balanceOf(Vesting.address);
    //final balance of owner should be 5
    expect(postBalance.toString()).to.equal("0");
  });
  it("Only distributor role should be able to call withdraws", async () => {
    await Vesting.transfer(Vesting.address, 5);
    //checks tokens in contract
    expect(await Vesting.balanceOf(Vesting.address)).to.equal(5);

    //withdraws to owner
    await expectRevert(
      signerAlice.withdrawWrapped(),
      `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
    );
    //send eth to conttact for test
    await Vesting.mintEscrowedH1(owner, 5, { value: FIVE_H1 });
    await await expectRevert(
      signerAlice.withdrawUnwrapped(),
      `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
    );
  });
  it("Only distributor role admin should be able to deposit unwrapped H1", async () => {
    await expectRevert(
      signerAlice.withdrawWrapped(),
      `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
    );
  });
  it("Anyone can mint tokens if they pay via mintEscrowedH1", async () => {
    await signerAlice.mintEscrowedH1(owner, 5, { value: FIVE_H1 });
    expect(await Vesting.balanceOf(owner)).to.equal(10);
    expect(await Vesting.totalSupply()).to.equal(10);
  });
  //adminMintEscrowedH1
  it("Only distributor role admin  can mint tokens via adminMintEscrowedH1", async () => {
    await expectRevert(
      signerAlice.adminMintEscrowedH1(owner, 5),
      `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
    );
    await Vesting.adminMintEscrowedH1(owner, 5);
  });
});
//await time.latest()).add(time.duration.weeks(1));
describe("Claiming tokens", function () {
  let owner;
  let alice;
  let Vesting;
  beforeEach(async () => {
    const [owners, alices] = await ethers.getSigners();
    owner = await owners.getAddress();
    alice = await alices.getAddress();
    const year = 31536000;
    const Escrow = await ethers.getContractFactory("EscrowedH1");
    Vesting = await upgrades.deployProxy(
      Escrow,
      ["EscrowedH1", "esH1", owner, owner, year],
      { initializer: "initialize", kind: "uups" }
    );
    await Vesting.mintEscrowedH1(owner, 5, { value: FIVE_H1 });
  });
  it("get claimable amount should be duration * amount / years", async () => {
    await Vesting.startVesting(5)
    await time.increase(time.duration.years(1));
    // asserts the correct output for the year duaration is claimable
    expect(await Vesting.calculateClaimableAmount(owner, 0)).to.equal(5)
  });
  it("asserts claimable amount does not surpass input", async () => {
    await Vesting.startVesting(5)
    //adds 32 years of increased time
    await time.increase(time.duration.years(32));
    expect(await Vesting.calculateClaimableAmount(owner, 0)).to.equal(5)
  });
  it("Test claim function and asserts correct amounts are withdrawn", async () => {
    await Vesting.startVesting(5)
    //increase time
    await time.increase(time.duration.years(1));
    const ContractBalanceOfH1 = await ethers.provider.getBalance(Vesting.address);
    //checks eqaul
    expect(ContractBalanceOfH1.toString()).to.equal("5000000000000000000")
    await Vesting.claim(0);
    const PostClaimContractBalance = await ethers.provider.getBalance(Vesting.address);
    expect(PostClaimContractBalance.toString()).to.equal("0")
  });
  it("Test 6 month claim is 1/2 input", async () => {
    // 5 + 45 = 50 => 5 in before each
    await Vesting.mintEscrowedH1(owner, 45, { value: "45000000000000000000" });
    await Vesting.startVesting(50);
    const sixMonths = time.duration.years(1) / 2;
    //increase time
    await time.increase(sixMonths);
    // asserts the correct output for the year duaration is claimable
    expect(await Vesting.calculateClaimableAmount(owner, 0)).to.equal(25)
    //checks balance
    const ContractBalanceOfH1 = await ethers.provider.getBalance(Vesting.address);
    expect(await ContractBalanceOfH1.toString()).to.equal("50000000000000000000")
    await Vesting.claim(0);
    const PostClaimContractBalance = await ethers.provider.getBalance(Vesting.address);
    expect(await PostClaimContractBalance.toString()).to.equal("25000000000000000000")
  });
  it("if a user makes multiple deposits they should be indexed differently and claimed differently", async () => {
    await Vesting.startVesting(5);
    //increase time
    await time.increase(time.duration.years(1));
    // asserts the correct output for the year duaration is claimable
    const indexOwnerFirstDeposit = await Vesting.calculateClaimableAmount(owner, 0);
    expect(await indexOwnerFirstDeposit.toString()).to.equal("5");
    const ContractBalanceOfH1 = await ethers.provider.getBalance(Vesting.address);
    expect(await ContractBalanceOfH1.toString()).to.equal("5000000000000000000");
    //withdraws
    await Vesting.claim(0);
    //checks balance transfered
    const PostClaimContractBalance = await ethers.provider.getBalance(Vesting.address);
    expect(await PostClaimContractBalance.toString()).to.equal("0");
    //makes a new purchase + deposit
    await Vesting.mintEscrowedH1(owner, 10, { value: "10000000000000000000" });
    await Vesting.startVesting(10);
    //adds 10 years and assures time is correctly multiplied
    //increase time
    await time.increase(time.duration.years(10));
    // asserts the correct output for the year duaration is claimable - ON INDEX 1 because 0 was taken
    expect(await PostClaimContractBalance.toString()).to.equal("0");
    const indexOwnerSecondDeposit = await Vesting.calculateClaimableAmount(owner, 1);
    expect(await indexOwnerSecondDeposit.toString()).to.equal("10");
    //checks that 0 is = 0 because it was withdrawn
 //  await expectRevert.unspecified( Vesting.calculateClaimableAmount(owner, 0));
  

    await Vesting.claim(1);
  });
  it("after a claim, the index will revert if called", async () => {
    await Vesting.startVesting(5);
    //increase time
    await time.increase(time.duration.years(1));
    // asserts the correct output for the year duaration is claimable
    const indexOwnerFirstDeposit = await Vesting.calculateClaimableAmount(owner, 0);;
    expect(await indexOwnerFirstDeposit.toString()).to.equal("5");
    //withdraws
    await Vesting.claim(0);
    //checks balance transfered
    const balance = await ethers.provider.getBalance(Vesting.address);
    expect(await balance.toString()).to.equal("0");
    //makes a new purchase + deposit
    await Vesting.mintEscrowedH1(owner, 10, { value: "10000000000000000000" });
    await Vesting.startVesting(10);
    //adds 10 years and assures time is correctly multiplied
    //increase time
    await time.increase(time.duration.years(10));
    // asserts the correct output for the year duaration is claimable - ON INDEX 1 because 0 was taken
    const indexOwnerSecondDeposit = await Vesting.calculateClaimableAmount(owner, 1);
    expect(await indexOwnerSecondDeposit.toString()).to.equal("10");
    //checks that 0 is = 0 because it was withdrawn
   // await expectRevert.unspecified(Vesting.calculateClaimableAmount(owner, 0));
    await Vesting.claim(1);
  });
});
//"Pausable: paused"
describe("Pausing of contract", function () {
  let owner;
  let alice;
  let Vesting;
  let OPERATOR_ROLE;
  let FROM;
  let signerAlice;
  beforeEach(async () => {
    const [owners, alices] = await ethers.getSigners();
    owner = await owners.getAddress();
    alice = await alices.getAddress();
    //get role
    OWNER = owner.toLowerCase();
    FROM = alice.toLowerCase();
    const year = 31536000;
    const Escrow = await ethers.getContractFactory("EscrowedH1");
    Vesting = await upgrades.deployProxy(
      Escrow,
      ["EscrowedH1", "esH1", alice, alice, year],
      { initializer: "initialize", kind: "uups" }
    );
    await Vesting.mintEscrowedH1(owner, 5, { value: FIVE_H1 });
    OPERATOR_ROLE = await Vesting.OPERATOR_ROLE();
    const secondAddressSigner = await ethers.getSigner(alice);
    signerAlice = Vesting.connect(secondAddressSigner);
  });
  it("pausing should stop all vesting/claiming/minting functions", async () => {
    await Vesting.startVesting(5);
    await time.increase(time.duration.years(1));
    // asserts the correct output for the year duaration is claimable
    // asserts the correct output for the year duaration is claimable
    const indexOwnerFirstDeposit = await Vesting.calculateClaimableAmount(owner, 0);;
    expect(await indexOwnerFirstDeposit.toString()).to.equal("5");
    //gets 5 more to test claim
    await Vesting.mintEscrowedH1(owner, 5, { value: FIVE_H1 });
    await Vesting.startVesting(5);
    await expectRevert(
      Vesting.pause(),
      `AccessControl: account ${OWNER} is missing role ${OPERATOR_ROLE}`
    );
    await signerAlice.pause(),
      await expectRevert(
        Vesting.mintEscrowedH1(alice, 1000),
        "Pausable: paused"
      );

    await expectRevert(Vesting.startVesting(5), "Pausable: paused");
    await expectRevert(Vesting.claim(5), "Pausable: paused");
  });
  it("unpausing should resume all vesting/claiming/minting functions", async () => {
    await signerAlice.pause();
    await signerAlice.unpause();
    await Vesting.mintEscrowedH1(owner, 5, { value: FIVE_H1 });
    await Vesting.startVesting(5);
    await time.increase(time.duration.years(1));
    await Vesting.claim(0);
  });
});
