const { expect } = require("chai");
const { ethers } = require("hardhat");

const { expectRevert } = require("@openzeppelin/test-helpers");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { makeGetInstanceFunction } = require("@openzeppelin/hardhat-upgrades/dist/admin");

describe("Staking Haven1 Token Contract", async () => {
  let ContractDeployer;
  let Address2;
  let StakingFactory;
  let StakingContract;
  let Address2SignsStaking;
  let AdminAddress;
  let RewardsToken;
  let StakedToken;
  let TokenFactory;
  beforeEach (async () => {
    const [owners, Address2s] = await ethers.getSigners();
    ContractDeployer = await owners.getAddress();
    Address2 = await Address2s.getAddress();
    TokenFactory = await ethers.getContractFactory("MyToken");
    StakedToken = await TokenFactory.deploy();
    RewardsToken = await TokenFactory.deploy()
    StakingFactory = await ethers.getContractFactory("NativeStaking");
    StakingContract = await upgrades.deployProxy(
      StakingFactory,
      [ContractDeployer, ContractDeployer, 9000000, StakedToken.address, RewardsToken.address, 9000000000],
      { initializer: "initialize"}
    );
    //getting Address2 ability to sign
    const secondAddressSigner = await ethers.getSigner(Address2);
    Address2SignsStaking= StakingContract.connect(secondAddressSigner);
    const currentImplementationAddress = await upgrades.erc1967.getImplementationAddress(StakingContract.address);
   AdminAddress = await upgrades.erc1967.getAdminAddress(StakingContract.address);
   await StakedToken.mint(ContractDeployer, 60);
   await StakedToken.mint(Address2, 60);
  });
  describe("View Functions", function () {
    it("Staking: The initialize function should only able to be called once.", async () => {
      await expectRevert(StakingContract.initialize(ContractDeployer, ContractDeployer, 9000000, StakedToken.address, RewardsToken.address, 9),
      "Initializable: contract is already initialized"
      );
    });
    it("Staking: The function lastTimeRewardApplicable() should return the block.timpstamp if it is less than the finish time or the finish time if it is has passed.", async () => {
      expect(await StakingContract.lastTimeRewardApplicable()).not.to.equal(
        0
      );
    });
    it("Staking: The function rewardPerToken() should return 0 if the contract does that have rewards tokens.", async () => {
      expect(await StakingContract.rewardPerToken()).to.equal(
       0
      );
    });
    it("Staking: The function earned() should return 0 if the address passed in has not staked anything yet.", async () => {
      expect(await StakingContract.earned(ContractDeployer)).to.equal(
        0
      );
    });
    it("Staking: The function getStakingDuration() should return the amount of duration passed into intializer.", async () => {
      expect(await StakingContract.getStakingDuration()).to.equal(
        9000000
      )
    });
  });
  describe("Testing Access Control and OpenZepplin approvals work as expected", function () {
    let ContractDeployerErrorMessageForAccessControl;
    let Address2ErrorMessageForAccessControl;
    let OPERATOR_ROLE;
    let DEFAULT_ADMIN_ROLE;
    let StakingHasDifferentAdmins;
    let StakingHasDifferentAdmins_DEFAULT_ADMIN_ROLE;
    beforeEach(async () => {
      Address2ErrorMessageForAccessControl = Address2.toLowerCase();
      ContractDeployerErrorMessageForAccessControl =
        ContractDeployer.toLowerCase();
      // Getting access control roles
      OPERATOR_ROLE = await StakingContract.OPERATOR_ROLE();
      DEFAULT_ADMIN_ROLE = await StakingContract.DEFAULT_ADMIN_ROLE();
      // Deploys another contract
      StakingHasDifferentAdmins = await upgrades.deployProxy(
        StakingFactory,
        [Address2, Address2, 18, Address2, Address2, 9000000000],
        { initializer: "initialize"}
      );
      StakingHasDifferentAdmins_DEFAULT_ADMIN_ROLE =
        await StakingHasDifferentAdmins.DEFAULT_ADMIN_ROLE();
    });
    it("Staking: Only the OPERATOR_ROLE should be able to call setRewardsDuration.", async () => {
      await expectRevert(
        Address2SignsStaking.setRewardsDuration(1),
        `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("Staking: Only the OPERATOR_ROLE should be able to pause and unpause the contract.", async () => {
      await expectRevert(
        Address2SignsStaking.pause(),
        `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
     await StakingContract.pause();
      await expectRevert(
        Address2SignsStaking.unpause(),
        `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
      await StakingContract.unpause();
    });
    it("Staking: Only the OPERATOR_ROLE should be able to call pause.", async () => {
      await expectRevert(
        Address2SignsStaking.pause(),
        `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("Staking: only the OPERATOR_ROLE should be able to call notifyRewardAmount.", async () => {
      await expectRevert(
        Address2SignsStaking.notifyRewardAmount(
          ContractDeployer
        ),
        `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("Staking: Only the OPERATOR_ROLE should be able to call issueBackedToken.", async () => {
      await expectRevert(
        Address2SignsStaking.recoverERC20(ContractDeployer, 70),
        `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${DEFAULT_ADMIN_ROLE}`
      );
    });
    it("Staking: Only the DEFAULT_ADMIN_ROLE should be able to grant roles.", async () => {
      await expectRevert(
        StakingHasDifferentAdmins.grantRole(
          OPERATOR_ROLE,
          ContractDeployer
        ),
        `AccessControl: account ${ContractDeployerErrorMessageForAccessControl} is missing role ${StakingHasDifferentAdmins_DEFAULT_ADMIN_ROLE}`
      );
    });
    it("Staking: Only the DEFAULT_ADMIN_ROLE should be able to call recoverERC20.", async () => {
      await expectRevert(
        StakingHasDifferentAdmins.recoverERC20(
          Address2,
          250
        ),
        `AccessControl: account ${ContractDeployerErrorMessageForAccessControl} is missing role ${StakingHasDifferentAdmins_DEFAULT_ADMIN_ROLE}`
      );
    });
  it("Staking: The proxy admin should be deployer.", async () => {

      const TransparentUpgradeableProxy = await ethers.getContractFactory("ProxyAdmin");
      const TransparentUpgradeableProxyInstance = TransparentUpgradeableProxy.attach(AdminAddress);
      const proxyAdminOwner = await TransparentUpgradeableProxyInstance.owner();
     
      expect(proxyAdminOwner).to.equal(ContractDeployer);
     // expect(AdminAddress).to.equal(Address2);
    });
  });
  describe("Staking and assicated functions.", function () {
    beforeEach (async () => {
      await StakedToken.mint(ContractDeployer, "90000000000000090009000000000000009000");
     await StakedToken.increaseAllowance(StakingContract.address, 30);
     await StakingContract.stake(30);
  
    });
    it("Staking: The function earned() should return the amount of tokens a user has earned over the duration.", async () => {
       await RewardsToken.mint(StakingContract.address, "90000000000000090009000000000000009000");
       await StakingContract.notifyRewardAmount(9000000);
      await time.increase(time.duration.years(1));
       expect(await StakingContract.earned(ContractDeployer)).to.equal(
        9000000
      );
     });
     it("Staking: The function setRewardsDuration should be callable after the original duration has passed.", async () => {
     await time.increase(time.duration.years(1));
      await StakingContract.setRewardsDuration(1);
    });
    it("Staking: The function setRewardsDuration will revert if the current staking duration has not passed.", async () => {
      StakingContract2 = await upgrades.deployProxy(
        StakingFactory,
        [ContractDeployer, ContractDeployer, 9000000, StakedToken.address, RewardsToken.address, 9000000000],
        { initializer: "initialize"}
      );
      const finishAt = await StakingContract2.getFinalizationTimestamp();
       await expectRevert(StakingContract2.setRewardsDuration(1),
       `RewardDurationNotFinished(${finishAt})`,);
     });
     it("Staking: The function withdraw should adjust user token balances by adding the original amount of tokens staked.", async () => {
      await RewardsToken.mint(StakingContract.address, "90000000000000090009000000000000009000");
      await StakingContract.notifyRewardAmount(9000000);
     await time.increase(time.duration.years(1));
    expect(
        await StakingContract.withdraw(30, 0)).to.changeTokenBalance(
        StakedToken.address,
        ContractDeployer,
        30
      );
    });
    it("Staking: The function getRewardPerTokenStored() should return rewards in contract / store amount. ", async () => {
      await RewardsToken.mint(StakingContract.address, "90000000000000090009000000000000009000");
      await StakingContract.notifyRewardAmount(9000000);
      await StakingContract.withdraw(2, 0);
      await time.increase(time.duration.years(20));
      await StakingContract.getReward();
      const stakingReward = await StakingContract.getRewardPerTokenStored();
     const stringReward  = stakingReward.toString();
     expect("321428569047619047619047").to.equal(stringReward);
});

  it("Staking: The function getUserRewards ", async () => {
    await RewardsToken.mint(StakingContract.address, "90000000000000090009000000000000009000");
    await StakedToken.increaseAllowance(StakingContract.address, "90009000000000000009000");
    await StakingContract.notifyRewardAmount(9000000);
    await StakingContract.stake(
      "90009000000000000008000");
    await time.increase(time.duration.years(20));
    await StakingContract.stake(
      4);
     const userRewards = await StakingContract.getUserRewards(ContractDeployer);
     const stringRewards = userRewards.toString();
     expect("8910891").to.equal(stringRewards);
});
it("Staking: The function getRewardPerTokenPaid() should display user rewards paid.", async () => {
  await RewardsToken.mint(StakingContract.address, "90000000000000090009000000000000009000");
  await RewardsToken.mint(ContractDeployer, "90009000000000000009000");
  await StakedToken.increaseAllowance(StakingContract.address, "90009000000000000009000");
  await StakingContract.notifyRewardAmount(9000000);
  await StakingContract.stake(
    "90009000000000000008000");
  await time.increase(time.duration.years(20));
  await StakingContract.stake(
    4);
   const userRewards = await StakingContract.getUserRewards(ContractDeployer);
   const stringRewards = userRewards.toString();
   expect("8910891").to.equal(stringRewards);
   await StakingContract.getReward();
   const perTokenPaid = await StakingContract.getUserRewardPerTokenPaid(ContractDeployer);
   expect(await perTokenPaid.toString()).to.equal("33333333333333432");
   console.log("PER TOKEN PAID", perTokenPaid);
});
it("Staking: The function getUserTokenAmountStaked() should display the amount of tokens a user has staked.", async () => {
    expect(await StakingContract.getUserTokenAmountStaked(ContractDeployer)).to.equal(30);
});
it("Staking: The function getUserH1AmountStaked(address account) should display the amount of H1 a user has staked.", async () => {
  await StakingContract.stake(0, {value: 40})
  expect(await StakingContract.getUserH1AmountStaked(ContractDeployer)).to.equal(40);
});
it("Staking: The function getTotalSupply() should return the staked tokens in the contract.", async () => {
    await RewardsToken.mint(StakingContract.address, "90000000000000090009000000000000009000");
    await StakingContract.notifyRewardAmount(9000000);
    // 30 - 2 = 28
    await StakingContract.withdraw(2, 0);
    await time.increase(time.duration.years(20));
    expect(await StakingContract.getTotalSupply()).to.equal(28);
});

    
  it("Staking: The function notifyRewardAmount() if block.timestamp >= finishAt will calculate the reward rate as the passed in `_amount` / duration.", async () => {
        await RewardsToken.mint(StakingContract.address, "90000000000000090009000000000000009000");
        await time.increase(time.duration.years(1));
        await StakingContract.notifyRewardAmount(9000000);
       
  });
  it("Staking: The function notifyRewardAmount() will revert if the calculated staked reward rate is 0.", async () => {
        await RewardsToken.mint(StakingContract.address, "90000000000000090009000000000000009000");
        await time.increase(time.duration.years(1));
        await expectRevert(StakingContract.notifyRewardAmount(0), "RewardRateEqualsZero()");      
 });
  it("Staking: The function notifyRewardAmount() will revert if the rewardRate * duration (payout) is higher than the amount of rewards tokens in the contract.", async () => {
        await time.increase(time.duration.years(1));
        await expectRevert(StakingContract.notifyRewardAmount(0), "RewardRateEqualsZero()");
  });
  });
  it("Staking: The function getReward should allow a user to recieve rewards.", async () => {
    StakingContract3 = await upgrades.deployProxy(
      StakingFactory,
      [ContractDeployer, ContractDeployer, 1, StakedToken.address, RewardsToken.address, 9000000000],
      { initializer: "initialize"}
    );
      await RewardsToken.mint(StakingContract3.address, "90000000000000090009000000000000009000");
      await StakedToken.increaseAllowance(StakingContract3.address, 30);
      await StakingContract3.stake(30, {value: 90});
     await time.increase(time.duration.years(17));
     const log = await StakingContract3.earned(ContractDeployer);
     console.log(log);

     await StakingContract3.notifyRewardAmount(9000000);
    expect( await StakingContract3.getReward()).to.changeTokenBalance(
        RewardsToken.address,
        ContractDeployer,
        9
      );
  });

  it("Staking: If the contract balance is too low notifyRewardAmount will revert.", async () => {
    await expectRevert(StakingContract.notifyRewardAmount(9000000),'RewardAmountGreaterThanContractBalance(9000000, 0)');
  });
  it("Staking: The function withdraw will return the amount of H1 requested if the caller has staked it.", async () => {
    await StakingContract.stake(0, {value: 100});
    await time.increase(time.duration.years(1));
    await StakingContract.withdraw(0, 100);
  });
  it("Staking: The stake function will not allow a 0 deposit.", async () => {
    await expectRevert(StakingContract.stake(0),`'NoDepositMade("${ContractDeployer}")'`);
  });
  it("Staking: Staking: The function getReward() revert if the caller has no funds staked in the contract.", async () => {
    await expectRevert(StakingContract.getReward(),`NoRewardToClaim("${ContractDeployer}")`);
  });
  it("Staking:  The function recoverERC20 will transfer the requested token from the contract.", async () => {
    const OtherToken = await TokenFactory.deploy();
    await OtherToken.mint(StakingContract.address, 60);
   await StakingContract.recoverERC20(OtherToken.address, 30);
  });
  it("Staking: The recoverERC20 will revert if the admin attempts to withdraw the reward token or staking token from the contract.", async () => {
   await expectRevert(StakingContract.recoverERC20(RewardsToken.address, 30),`'CannotRecoverStakingOrRewardsTokens("${StakedToken.address}", "${RewardsToken.address}", "${RewardsToken.address}")'`);
   await expectRevert(StakingContract.recoverERC20(StakedToken.address, 30),`'CannotRecoverStakingOrRewardsTokens("${StakedToken.address}", "${RewardsToken.address}", "${StakedToken.address}")'`);
  });
  it("Staking: The function withdraw will revert if the user does not have any staked tokens or H1 in the contract.", async () => {
    await expectRevert(StakingContract.withdraw(0,0),`NoAmountToWithdraw("${ContractDeployer}")`);
  });

  describe("Single withdraw with out tokens staking", function () {
    it("Staking: withdraw() will run if user only has H1 staked.", async () => {
    await RewardsToken.mint(StakingContract.address, "90000000000000090009000000000000009000");
    await StakingContract.stake(0, {value: 30});
    await StakingContract.withdraw(0, 30);
  });
  it("Staking: The withdraw() function will revert if there are not enough tokens or funds by the caller.", async () => {
    await expectRevert(StakingContract.withdraw(30, 30), `AmountUnavailableToWithdraw("${ContractDeployer}")`);
  });

});

describe("Ensure Functions Pause as Expected", function () {

it("Staking: The fucntion setRewardsDuration should not be possible when the contract is paused", async () => {
  await StakingContract.pause();
  await expectRevert(StakingContract.setRewardsDuration(30), 'Pausable: paused');
});
it("Staking: The function notifyRewardAmount() should not be possible when the contract is paused", async () => {
  await StakingContract.pause();
  await expectRevert(StakingContract.notifyRewardAmount(30), 'Pausable: paused');
});
it("Staking: The function stake() should not be possible when the contract is paused", async () => {
  await RewardsToken.mint(StakingContract.address, "90000000000000090009000000000000009000");
  await StakedToken.mint(ContractDeployer, 400);
  await StakedToken.increaseAllowance(StakingContract.address, 400);
  await StakingContract.pause();
  await expectRevert(StakingContract.stake(30), 'Pausable: paused');
});
//withdraw
it("Staking: The function withdraw() should not be possible when the contract is paused", async () => {
  await RewardsToken.mint(StakingContract.address, "90000000000000090009000000000000009000");
  await StakedToken.mint(ContractDeployer, 400);
  await StakedToken.increaseAllowance(StakingContract.address, 400);
  await StakingContract.stake(400);
  await StakingContract.pause();
  await expectRevert(StakingContract.withdraw(30, 0), 'Pausable: paused');
});
it("Staking: The function getReward() should not be possible when the contract is paused", async () => {
  await RewardsToken.mint(StakingContract.address, "90000000000000090009000000000000009000");
  await StakedToken.mint(ContractDeployer, 400);
  await StakedToken.increaseAllowance(StakingContract.address, 400);
  await StakingContract.stake(400);
  await StakingContract.pause();
  await expectRevert(StakingContract.getReward(), 'Pausable: paused');
});
//recoverERC20(address tokenAddress, uint256 tokenAmount) external whenNotPaused 
});

});