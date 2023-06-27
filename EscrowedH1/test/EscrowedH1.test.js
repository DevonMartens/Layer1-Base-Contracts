const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

const { expectRevert } = require("@openzeppelin/test-helpers");

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
    Vesting = await upgrades.upgradeProxy(
      Escrow,
      ["EscrowedH1", "esH1", owner, owner, owner, year],
      { initializer: "initialize" }
    );
    await Vesting.mintEscrowedH1(owner, 5, { value: FIVE_ETH });
  });

  it("Escrow Contract Should mint tokens", async () => {
    expect(await Vesting.balanceOf(owner)).to.equal(Vesting.totalSupply());
    expect(await Vesting.balanceOf(owner)).to.equal(5);
  });
  it("Escrow should burn vested tokens", async () => {
    expect(await Vesting.balanceOf(owner)).to.equal(5);
    await Vesting.startVesting(5);
    expect(await Vesting.balanceOf(owner)).to.equal(0);
    //check for event
  });
  it("Vested tokens should be tracked by the contract and should be retrieved from `getUserVestingAmountFromDepositIndex`", async () => {
    expect(
      await Vesting.getUserVestingAmountFromDepositIndex(owner, 0)
    ).to.equal(5);
  });
  //getUserVestingClaimedAmountFromIndex
  it("Vested tokens should be tracked by the contract and should be retrieved from `getUserVestingClaimedAmountFromIndex`", async () => {
    expect(
      await Vesting.getUserVestingClaimedAmountFromIndex(owner, 0)
    ).to.equal(0);
  });
  it("Vested multiple token inputs ", async () => {
    await Vesting.startVesting(5);
    expect(
      await Vesting.getUserVestingClaimedAmountFromIndex(owner, 0)
    ).to.equal(5);
  });
});

describe("Withdraws/admin functions", function () {
  let owner;
  let alice;
  let Vesting;
  let year;
  let DISTRIBUTOR_ROLE;
  let FROM;
  beforeEach(async () => {
    const [owners, alices] = await ethers.getSigners();
    owner = await owners.getAddress();
    alice = await alices.getAddress();
    year = 31536000;
    Vesting = await upgrades.upgradeProxy(
      Escrow,
      ["EscrowedH1", "esH1", owner, owner, owner, year],
      { initializer: "initialize" }
    );
    await Vesting.mintEscrowedH1(owner, 5, { value: FIVE_ETH });
    //get role
    DISTRIBUTOR_ROLE = await Vesting.DISTRIBUTOR_ROLE();
    FROM = alice.toLowerCase();
  });

  it("If an H1 is sent to the contract it should be able to be withdrawn via withdrawUnwrapped", async () => {
    //await Vesting.withdrawUnwrapped();
    FIVE_ETH_STRING = FIVE_ETH.toString();
    await expect(() => esting.withdrawUnwrapped()).to.changeEtherBalance(
      owner,
      FIVE_ETH_STRING
    );
  });
  it("If tokens sent to the contract they should be able to be withdrawn via withdrawWrapped", async () => {
    await Vesting.transfer(Vesting.address, 5);
    //checks tokens in contract
    expect(await Vesting.balanceOf(Vesting.address)).to.equal(5);
    //withdraws to owner
    await expect(Vesting.withdrawWrapped()).to.changeTokenBalance(
      token,
      account,
      1
    );
    await Vesting.withdrawWrapped();
    //final balance of owner should be 5
    expect(await Vesting.balanceOf(Vesting.balanceOf(owner))).to.equal(5);
  });
  it("Only distributor role admin should be able to call withdraws", async () => {
    await Vesting.transfer(vestingAddress, 5);
    //checks tokens in contract
    expect(await Vesting.balanceOf(Vesting.address)).to.equal(5);

    //withdraws to owner
    await expectRevert(
      Vesting.withdrawWrapped({ from: FROM }),
      `AccessControl: account ${FROM} is missing role ${DISTRIBUTOR_ROLE}`
    );
    //send eth to conttact for test
    await Vesting.mintEscrowedH1(owner, 5, { value: FIVE_ETH });
    await await expectRevert(
      Vesting.withdrawUnwrapped({ from: FROM }),
      `AccessControl: account ${FROM} is missing role ${DISTRIBUTOR_ROLE}`
    );
  });
  it("Only distributor role admin should be able to deposit unwrapped H1", async () => {
    await expectRevert(
      Vesting.sendTransaction({ from: FROM, value: FIVE_ETH }),
      `AccessControl: account ${FROM} is missing role ${DISTRIBUTOR_ROLE}`
    );
  });
  it("Anyone can mint tokens if they pay via mintEscrowedH1", async () => {
    await Vesting.mintEscrowedH1(owner, 5, { from: FROM, value: FIVE_ETH });
    expect(await Vesting.balanceOf(Vesting.address)).to.equal(5);
    expect(await Vesting.balanceOf(owner)).to.equal(5);
    expect(await Vesting.totalSupply()).to.equal(5);
  });
  //adminMintEscrowedH1
  it("Only distributor role admin  can mint tokens via adminMintEscrowedH1", async () => {
    await expectRevert(
      Vesting.adminMintEscrowedH1(owner, 5, { from: FROM }),
      `AccessControl: account ${FROM} is missing role ${DISTRIBUTOR_ROLE}`
    );
    await Vesting.adminMintEscrowedH1(owner, 5);
  });
});
//await time.latest()).add(time.duration.weeks(1));
describe("Claiming tokens             ", () => {
  it("get claimable amount should be duration * amount / years", async () => {
    const year = 31536000;
    const Vesting = await upgrades.upgradeProxy(
      Escrow,
      ["EscrowedH1", "esH1", owner, owner, owner, year],
      { initializer: "initialize" }
    );
    await Vesting.mintEscrowedH1(owner, 5, { value: FIVE_ETH });
    await Vesting.startVesting(5);
    // await time.latest();
    //increase time
    await time.increase(time.duration.years(1));
    // asserts the correct output for the year duaration is claimable
    const indexOwner = await Vesting.calculateClaimableAmount(owner, 0);
    const strIndexOwner = indexOwner.toString();
    assert.equal(strIndexOwner, "5");
    //adds 32 years and assures time is correctly multiplied
    //increase time
    await time.increase(time.duration.years(32));
    // asserts the correct output for the year duaration is claimable
    const indexOwner2 = await Vesting.calculateClaimableAmount(owner, 0);
    const strIndexOwner2 = indexOwner2.toString();
    assert.equal(strIndexOwner2, "5");
  });
  it("Test claim function for correct amounts on a simple one year run", async () => {
    const Vesting = await upgrades.upgradeProxy(
      Escrow,
      ["EscrowedH1", "esH1", owner, owner, owner, year],
      { initializer: "initialize" }
    );
    await Vesting.mintEscrowedH1(owner, 5, { value: FIVE_ETH });
    await Vesting.startVesting(5);
    await time.latest();
    //increase time
    await time.increase(time.duration.years(1));
    const Ogbalance = await web3.eth.getBalance(Vesting.address);
    const strB = Ogbalance.toString();
    assert.equal(strB, "5000000000000000000");
    await Vesting.claim(0);
    const balance = await web3.eth.getBalance(Vesting.address);
    assert.equal(balance, "0");
  });
  it("Test 6 month claim", async () => {
    const Vesting = await upgrades.upgradeProxy(
      Escrow,
      ["EscrowedH1", "esH1", owner, owner, owner, year],
      { initializer: "initialize" }
    );
    await Vesting.mintEscrowedH1(owner, 50, { value: "50000000000000000000" });
    await Vesting.startVesting(50);
    await time.latest();
    const sixMonths = time.duration.years(1) / 2;
    //increase time
    await time.increase(sixMonths);
    // asserts the correct output for the year duaration is claimable
    const indexOwner = await Vesting.calculateClaimableAmount(owner, 0);
    const strIndexOwner = indexOwner.toString();
    assert.equal(strIndexOwner, "25");
    //checks balance
    const Ogbalance = await web3.eth.getBalance(Vesting.address);
    const strB = Ogbalance.toString();
    assert.equal(strB, "50000000000000000000");
    await Vesting.claim(0);
    const balance = await web3.eth.getBalance(Vesting.address);
    const balanceS = balance.toString();
    assert.equal(balanceS, "25000000000000000000");
    // assert.equal(balance, "0")
  });
  it("if a user makes multiple deposits they should be indexed differently and claimed differently", async () => {
    const Vesting = await upgrades.upgradeProxy(
      Escrow,
      ["EscrowedH1", "esH1", owner, owner, owner, year],
      { initializer: "initialize" }
    );
    await Vesting.mintEscrowedH1(owner, 5, { value: FIVE_ETH });
    await Vesting.startVesting(5);
    await time.latest();
    //increase time
    await time.increase(time.duration.years(1));
    // asserts the correct output for the year duaration is claimable
    const indexOwner = await Vesting.calculateClaimableAmount(owner, 0);
    const strIndexOwner = indexOwner.toString();
    assert.equal(strIndexOwner, "5");
    const Ogbalance = await web3.eth.getBalance(Vesting.address);
    const strB = Ogbalance.toString();
    assert.equal(strB, "5000000000000000000");
    //withdraws
    await Vesting.claim(0);
    //checks balance transfered
    const balance = await web3.eth.getBalance(Vesting.address);
    assert.equal(balance, "0");
    //makes a new purchase + deposit
    await Vesting.mintEscrowedH1(owner, 10, { value: "10000000000000000000" });
    await Vesting.startVesting(10);
    //adds 10 years and assures time is correctly multiplied
    //increase time
    await time.increase(time.duration.years(10));
    // asserts the correct output for the year duaration is claimable - ON INDEX 1 because 0 was taken
    const indexOwner2 = await Vesting.calculateClaimableAmount(owner, 1);
    const strIndexOwner2 = indexOwner2.toString();
    assert.equal(strIndexOwner2, "10");
    //checks that 0 is = 0 because it was withdrawn
    // const checkBalanceIsWithdrawn = await Vesting.calculateClaimableAmount(owner, 0);
    // const checkBalanceIsWithdrawnStr = checkBalanceIsWithdrawn.toString();
    // assert.equal(checkBalanceIsWithdrawnStr, "0");

    await Vesting.claim(1);
  });
  it("after a claim, the index will revert if called", async () => {
    const Vesting = await upgrades.upgradeProxy(
      Escrow,
      ["EscrowedH1", "esH1", owner, owner, owner, year],
      { initializer: "initialize" }
    );
    await Vesting.mintEscrowedH1(owner, 5, { value: FIVE_ETH });
    await Vesting.startVesting(5);
    await time.latest();
    //increase time
    await time.increase(time.duration.years(1));
    // asserts the correct output for the year duaration is claimable
    const indexOwner = await Vesting.calculateClaimableAmount(owner, 0);
    const strIndexOwner = indexOwner.toString();
    assert.equal(strIndexOwner, "5");
    const Ogbalance = await web3.eth.getBalance(Vesting.address);
    const strB = Ogbalance.toString();
    assert.equal(strB, "5000000000000000000");
    //withdraws
    await Vesting.claim(0);
    //checks balance transfered
    const balance = await web3.eth.getBalance(Vesting.address);
    assert.equal(balance, "0");
    //makes a new purchase + deposit
    await Vesting.mintEscrowedH1(owner, 10, { value: "10000000000000000000" });
    await Vesting.startVesting(10);
    //adds 10 years and assures time is correctly multiplied
    //increase time
    await time.increase(time.duration.years(10));
    // asserts the correct output for the year duaration is claimable - ON INDEX 1 because 0 was taken
    const indexOwner2 = await Vesting.calculateClaimableAmount(owner, 1);
    const strIndexOwner2 = indexOwner2.toString();
    assert.equal(strIndexOwner2, "10");
    //checks that 0 is = 0 because it was withdrawn
    await expectRevert.unspecified(Vesting.calculateClaimableAmount(owner, 0));

    await Vesting.claim(1);
  });
});
//"Pausable: paused"
describe("Pauser Role              ", () => {
  it("pausing should stop all vesting/claiming/minting functions", async () => {
    const Vesting = await upgrades.upgradeProxy(
      Escrow,
      ["EscrowedH1", "esH1", owner, owner, alice, year],
      { initializer: "initialize" }
    );
    await Vesting.mintEscrowedH1(owner, 5, { value: FIVE_ETH });
    await Vesting.startVesting(5);
    await time.increase(time.duration.years(1));
    // asserts the correct output for the year duaration is claimable
    const indexOwner = await Vesting.calculateClaimableAmount(owner, 0);
    const strIndexOwner = indexOwner.toString();
    assert.equal(strIndexOwner, "5");
    //gets 5 more to test claim
    await Vesting.mintEscrowedH1(owner, 5, { value: FIVE_ETH });
    await Vesting.startVesting(5);
    //gets 5b more to test vest
    await Vesting.mintEscrowedH1(owner, 5, { value: FIVE_ETH });
    //get role
    const PAUSER_ROLE = await Vesting.PAUSER_ROLE();
    const OWNER = owner.toLowerCase();
    const FROM = alice.toLowerCase();
    await expectRevert(
      Vesting.pause(),
      `AccessControl: account ${OWNER} is missing role ${PAUSER_ROLE}`
    );
    await Vesting.pause({ from: FROM }),
      await expectRevert(
        Vesting.mintEscrowedH1(alice, 1000),
        "Pausable: paused"
      );

    await expectRevert(Vesting.startVesting(5), "Pausable: paused");
    await expectRevert(Vesting.claim(5), "Pausable: paused");
  });
  it("unpausing should resume all vesting/claiming/minting functions", async () => {
    const Vesting = await upgrades.upgradeProxy(
      Escrow,
      ["EscrowedH1", "esH1", owner, owner, alice, year],
      { initializer: "initialize" }
    );
    //gets 5 more to test claim
    await Vesting.mintEscrowedH1(owner, 5, { value: FIVE_ETH });
    await Vesting.startVesting(5);
    //gets 5b more to test vest
    await Vesting.mintEscrowedH1(owner, 5, { value: FIVE_ETH });
    //get role
    const FROM = alice.toLowerCase();
    await Vesting.pause({ from: FROM });
    await Vesting.unpause({ from: FROM });
    await Vesting.mintEscrowedH1(owner, 5, { value: FIVE_ETH });
    await Vesting.startVesting(5);
    await time.increase(time.duration.years(1));
    await Vesting.claim(0);
  });
});
