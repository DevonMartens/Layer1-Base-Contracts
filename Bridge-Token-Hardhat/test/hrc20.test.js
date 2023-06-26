const { expect } = require("chai");
const { ethers } = require("hardhat");

const { expectRevert } = require("@openzeppelin/test-helpers");

let hrc20;

describe("Testing the initial values to validate expected contract state", function () {
  let H;
  let owner;
  beforeEach(async () => {
    const [owners] = await ethers.getSigners();
    owner = await owners.getAddress();
    const hrc20 = await ethers.getContractFactory("HRC20");
    H = await upgrades.deployProxy(
      hrc20,
      ["HAVEN1", "HRC20", owner, owner, owner, owner, false],
      { initializer: "initialize", kind: "uups" }
    );
  });
  it("The contract: have correct values for name & symbol", async () => {
    //confirm they are eqaul to the value set in the constructor
    expect(await H.name()).to.equal("HAVEN1");
    //confirm they are eqaul to the value set in the constructor
    expect(await H.symbol()).to.equal("HRC20");
  });
  it("Upon deployment no NFTs should be minted so the inital value should be 0 totalSupply", async () => {
    expect(await H.totalSupply()).to.equal(0);
  });
  it("initalize should only be called upon deployment", async () => {
    await expectRevert(
     H.initialize(
        "HAVEN1", "HRC20", owner, owner, owner, owner, false
      ),
      "Initializable: contract is already initialized"
    );
  });
});
describe("Testing the deposit and withdraw functions", function () {
  let hrc20;
  let H;
  let owner;
  let alice;
  beforeEach(async () => {
    const [owners, alices] = await ethers.getSigners();
    owner = await owners.getAddress();
    alice = await alices.getAddress();
    hrc20 = await ethers.getContractFactory("HRC20");
    H = await upgrades.deployProxy(
      hrc20,
      ["HAVEN1", "HRC20", owner, owner, owner, owner, false],
      { initializer: "initialize", kind: "uups" }
    );
    await H.deposit(alice, 900);
  });
  it("The contract: the deposit function should mint the correct amount of tokens to the designated wallet", async () => {
    expect(await H.balanceOf(alice)).to.equal(900);
  });
  it("The contract: the withdraw function should burn the correct amount of tokens from the designated wallet", async () => {
    await H.withdraw(alice, 900);
    expect(await H.balanceOf(alice)).to.equal(0);
  });
  it("The contract: the withdraw function should revert and give the error BALANCE_TOO_LOW if a request is made to withdraw more than the balance", async () => {
    await expectRevert(H.withdraw(alice, 1000), `109`);
  });
  it("The contract: function deposit function should not allow deposits if `isWhiteListContract` is true & address is not on whitelist ", async () => {
    const HRC20HasWhiteListAliceIsNotOn = await upgrades.deployProxy(
      hrc20,
      ["HAVEN1", "HRC20", owner, owner, owner, owner, true],
      { initializer: "initialize", kind: "uups" }
    );
    await expectRevert(
      HRC20HasWhiteListAliceIsNotOn.deposit(alice, 1000),
      "117"
    );
  });
});
describe("Testing the pause functionality", function () {
  let H;
  let owner;
  let alice;
  beforeEach(async () => {
    const [owners, alices] = await ethers.getSigners();
    owner = await owners.getAddress();
    alice = await alices.getAddress();
    hrc20 = await ethers.getContractFactory("HRC20");
    H = await upgrades.deployProxy(
      hrc20,
      ["HAVEN1", "HRC20", owner, owner, owner, owner, false],
      { initializer: "initialize", kind: "uups" }
    );
    await H.deposit(alice, 900);
    //confirms alice has balance
    expect(await H.balanceOf(alice)).to.equal(900);
    //now pause the contract
    await H.pause();
  });
  it("The contract: function pause function should stop all deposits", async () => {
    //try to withdraw
    await expectRevert(H.deposit(alice, 900), "Pausable: paused");
  });
  it("The contract: function pause function should stop all withdraws", async () => {
    //unpauses since paused in before each
    await H.unpause();
    //ensure withdraw works as expected
    await H.withdraw(alice, 450);
    //now pause the contract
    await H.pause();
    await expectRevert(H.withdraw(alice, 450), "Pausable: paused");
  });
  it("The contract: function pause function should stop all sends", async () => {
    await expectRevert(H.transfer(owner, 450), "Pausable: paused");
  });
});
describe("Testing Whitelist Functionality", function () {
  let HRCWithWhiteList;
  let owner;
  let alice;
  let random;
  let bob;
  beforeEach(async () => {
    const [owners, alices, randoms, bobs] = await ethers.getSigners();
    owner = await owners.getAddress();
    alice = await alices.getAddress();
    random = await randoms.getAddress();
    bob = await bobs.getAddress();
    hrc20 = await ethers.getContractFactory("HRC20");
    HRCWithWhiteList = await upgrades.deployProxy(
      hrc20,
      ["HAVEN1", "HRC20", owner, owner, owner, owner, true],
      { initializer: "initialize", kind: "uups" }
    );
  });
  it("If use whitelist is set to true than no address that isnt whitelisted should be able to deposit  ", async () => {
    await expectRevert(HRCWithWhiteList.deposit(alice, 900), "117");
  });
  it("If an address only whitelisted addresses via `setWhiteListAddres` it should be able to deposit tokens  ", async () => {
    await HRCWithWhiteList.setWhiteListAddress(alice, true);
    await HRCWithWhiteList.deposit(alice, 900);
  });
  it("If addresses are whitelisted addresses via `setMultipleWhiteListAddresses` they should be able to deposit tokens  ", async () => {
    await expectRevert(HRCWithWhiteList.deposit(random, 900), "117");
    await expectRevert(HRCWithWhiteList.deposit(owner, 900), "117");
    const friends = [owner, random];
    await HRCWithWhiteList.setMultipleWhiteListAddresses(friends);
    await HRCWithWhiteList.deposit(owner, 900);
    await HRCWithWhiteList.deposit(random, 900);
  });
  it("If using a contract using whitelist is set to false but toggled by `setWhiteListActive` impacting user abilities", async () => {
    await HRCWithWhiteList.setWhiteListActive(true);
    await expectRevert(HRCWithWhiteList.deposit(alice, 900), "117");
    await HRCWithWhiteList.setWhiteListAddress(alice, true);
    await HRCWithWhiteList.deposit(alice, 900);
    await expectRevert(HRCWithWhiteList.deposit(random, 900), "117");
    await expectRevert(HRCWithWhiteList.deposit(owner, 900), "117");
    const friends = [owner, random];
    await HRCWithWhiteList.setMultipleWhiteListAddresses(friends);
    await HRCWithWhiteList.deposit(owner, 900);
    await HRCWithWhiteList.deposit(random, 900);
    await HRCWithWhiteList.setWhiteListActive(true);
    await expectRevert(HRCWithWhiteList.deposit(bob, 900), "117");
    expect(await HRCWithWhiteList.balanceOf(bob)).to.equal(0);
  });
});
describe("Testing Blacklist Functionality", () => {
  let H;
  let owner;
  let alice;
  // let bob
  beforeEach(async () => {
    const [owners, randoms, alices, bobs] = await ethers.getSigners();
    owner = await owners.getAddress();
    alice = await alices.getAddress();
    random = await randoms.getAddress();
    bob = await bobs.getAddress();
    hrc20 = await ethers.getContractFactory("HRC20");
    H = await upgrades.deployProxy(
      hrc20,
      ["HAVEN1", "HRC20", owner, owner, owner, owner, false],
      { initializer: "initialize", kind: "uups" }
    );
    await H.deposit(alice, 900);
    expect(await H.balanceOf(alice)).to.equal(900);
    await H.withdraw(alice, 450);
    await H.connect(alices).transfer(owner, 225);
    await H.setBlackListAddress(alice, true);
  });

  it("The contract: an address should be allowed to transfer/have tokens minted to it/withdraw tokens unless it has been blacklisted ", async () => {
    await expectRevert(H.deposit(alice, 900), "115");
    await expectRevert(H.withdraw(alice, 10), "115");
    const secondAddressSigner = await ethers.getSigner(alice);
    const signerAlice = H.connect(secondAddressSigner);
    await expectRevert(signerAlice.transfer(owner, 225), "115");
  });
  it("The contract: an address should not be allowed to recieve tokens if it been blacklisted ", async () => {
    await H.deposit(owner, 900);
    await expectRevert(H.transfer(alice, 225), "115");
  });
  it("removing the blacklist should allow an address should be transfer/have tokens minted to it/withdraw tokens after it has been blacklisted     ", async () => {
    await expectRevert(H.deposit(alice, 900), "115");
    await expectRevert(H.withdraw(alice, 10), "115");
    const secondAddressSigner = await ethers.getSigner(alice);
    const signerAlice = H.connect(secondAddressSigner);
    await expectRevert(signerAlice.transfer(owner, 225), "115");
    await H.setBlackListAddress(alice, false);
    await H.deposit(alice, 900);
    await H.withdraw(alice, 450);
    await signerAlice.transfer(owner, 225);
  });
});
describe("Testing Access Control Functionality", function () {
  let H;
  let owner;
  let alice;
  let signerAlice;
  let FROM;
  let FromOwner;
  let DISTRIBUTOR_ROLE;
  let PAUSER_ROLE;
  let UPGRADER_ROLE;
  let hrc20;
  let secondAddressSigner;
  beforeEach(async () => {
    const [owners, alices, randoms, bobs] = await ethers.getSigners();
    owner = await owners.getAddress();
    alice = await alices.getAddress();
    random = await randoms.getAddress();
    bob = await bobs.getAddress();
    hrc20 = await ethers.getContractFactory("HRC20");
    H = await upgrades.deployProxy(
      hrc20,
      ["HAVEN1", "HRC20", owner, owner, owner, owner, false],
      { initializer: "initialize", kind: "uups" }
    );
    //getting alice ability to sign
    secondAddressSigner = await ethers.getSigner(alice);
    signerAlice = H.connect(secondAddressSigner);
    //getting FROM for accesscontrol errors
    FROM = alice.toLowerCase();
    FromOwner = owner.toLowerCase();
    //getting access control role
    DISTRIBUTOR_ROLE = await H.DISTRIBUTOR_ROLE();
    PAUSER_ROLE = await H.PAUSER_ROLE();
    UPGRADER_ROLE = await H.UPGRADER_ROLE();
  });
  it("The contract: minting/withdrawing/blacklisting/whitelsiting should only be allowed by the DISTRIBUTOR_ROLE     ", async () => {
    await H.deposit(alice, 900);
    await expectRevert(
      signerAlice.deposit(owner, 225),
      `AccessControl: account ${FROM} is missing role ${DISTRIBUTOR_ROLE}`
    );
    await expectRevert(
      signerAlice.setBlackListAddress(alice, true),
      `AccessControl: account ${FROM} is missing role ${DISTRIBUTOR_ROLE}`
    );
    await expectRevert(
      signerAlice.withdraw(alice, 225),
      `AccessControl: account ${FROM} is missing role ${DISTRIBUTOR_ROLE}`
    );
    await expectRevert(
      signerAlice.setWhiteListAddress(alice, true),
      `AccessControl: account ${FROM} is missing role ${DISTRIBUTOR_ROLE}`
    );
    const friends = [owner, random];
    await expectRevert(
      signerAlice.setMultipleWhiteListAddresses(friends),
      `AccessControl: account ${FROM} is missing role ${DISTRIBUTOR_ROLE}`
    );
    await expectRevert(
      signerAlice.setWhiteListActive(true),
      `AccessControl: account ${FROM} is missing role ${DISTRIBUTOR_ROLE}`
    );
  });
  it("only the PAUSER_ROLE should be able to pause unpause   ", async () => {
    await expectRevert(
      signerAlice.pause(),
      `AccessControl: account ${FROM} is missing role ${PAUSER_ROLE}`
    );
    await H.pause();
    await expectRevert(
      signerAlice.unpause(),
      `AccessControl: account ${FROM} is missing role ${PAUSER_ROLE}`
    );
    await H.unpause();
  });
  it("The contract: only the admin role should be able to grant roles   ", async () => {
    await expectRevert(
      signerAlice.pause(),
      `AccessControl: account ${FROM} is missing role ${PAUSER_ROLE}`
    );
    await H.grantRole(PAUSER_ROLE, alice);
    await signerAlice.pause();
  });
  it("upgrades should only be allowed to be called by UPGRADER_ROLE", async function () {
    const HRC20HasADifferentUpgrader = await upgrades.deployProxy(
      hrc20,
      ["HAVEN1", "HRC20", owner, owner, owner, alice, false],
      { initializer: "initialize", kind: "uups" }
    );
    await expectRevert(
      upgrades.upgradeProxy(HRC20HasADifferentUpgrader.address, hrc20, {
        kind: "uups",
      }),
      `AccessControl: account ${FromOwner} is missing role ${UPGRADER_ROLE}`
    );
    const HRC20V2 = await upgrades.upgradeProxy(H.address, hrc20, {
      kind: "uups",
    });
  });
});
describe("Testing the deposit and withdraw functions", function () {
  let hrc20;
  let H;
  let owner;
  let alice;
  beforeEach(async () => {
    const [owners, alices] = await ethers.getSigners();
    owner = await owners.getAddress();
    alice = await alices.getAddress();
    hrc20 = await ethers.getContractFactory("HRC20");
    H = await upgrades.deployProxy(
      hrc20,
      ["HAVEN1", "HRC20", owner, owner, owner, owner, false],
      { initializer: "initialize", kind: "uups" }
    );
    await H.deposit(alice, 900);
  });
  it("The contract: the deposit function should mint the correct amount of tokens to the designated wallet", async () => {
    expect(await H.balanceOf(alice)).to.equal(900);
  });
  it("The contract: the withdraw function should burn the correct amount of tokens from the designated wallet", async () => {
    await H.withdraw(alice, 900);
    expect(await H.balanceOf(alice)).to.equal(0);
  });
  it("The contract: the withdraw function should revert and give the error BALANCE_TOO_LOW if a request is made to withdraw more than the balance", async () => {
    await expectRevert(H.withdraw(alice, 1000), `109`);
  });
  it("The contract: function deposit function should not allow deposits if `isWhiteListContract` is true & address is not on whitelist ", async () => {
    const HRC20HasWhiteListAliceIsNotOn = await upgrades.deployProxy(
      hrc20,
      ["HAVEN1", "HRC20", owner, owner, owner, owner, true],
      { initializer: "initialize", kind: "uups" }
    );
    await expectRevert(
      HRC20HasWhiteListAliceIsNotOn.deposit(alice, 1000),
      "117"
    );
  });
});
describe("Testing approvals", function () {
  let hrc20;
  let H;
  let owner;
  let alice;
  let TestContractForApprovals;
  beforeEach(async () => {
    const [owners, alices] = await ethers.getSigners();
    owner = await owners.getAddress();
    alice = await alices.getAddress();
    hrc20 = await ethers.getContractFactory("HRC20");
    H = await upgrades.deployProxy(
      hrc20,
      ["HAVEN1", "HRC20", owner, owner, owner, owner, false],
      { initializer: "initialize", kind: "uups" }
    );

    TestContractForApprovals = await upgrades.deployProxy(
      hrc20,
      ["NOT_A_PROBLEM", "CONTRACT", owner, owner, owner, owner, false],
      { initializer: "initialize", kind: "uups" }
    );

    await H.deposit(owner, 900);
  });
  it("A wallet that is not a contract should not be allowed to be approved by the function increaseAllowance", async () => {
    await expectRevert(H.increaseAllowance(alice, 8), "116");
    expect(await H.allowance(owner, alice)).to.equal(0);
  });
  it("A wallet that is not a contract  not be allowed to be approved by the function approve", async () => {
    await expectRevert(H.approve(alice, 8), "116");
    expect(await H.allowance(owner, alice)).to.equal(0);
  });
  it("A contract should not be allowed to be approved by the function increaseAllowance", async () => {
    await H.increaseAllowance(TestContractForApprovals.address, 8);
    expect(await H.allowance(owner, TestContractForApprovals.address)).to.equal(
      8
    );
  });
  it("A contract should not be allowed to be approved by the function approve", async () => {
    await H.approve(TestContractForApprovals.address, 8);
    expect(await H.allowance(owner, TestContractForApprovals.address)).to.equal(
      8
    );
  });
});
