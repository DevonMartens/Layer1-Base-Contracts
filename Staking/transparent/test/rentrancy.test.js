const { expect } = require("chai");
const { ethers } = require("hardhat");
const { expectRevert } = require('@openzeppelin/test-helpers');


const ONE_H1 = ethers.utils.parseUnits("1", "ether");

const TEN_H1 = ethers.utils.parseUnits("10", "ether");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ReentrancyAttack", function() {
    let StakingContract
    let malicious;
    //attacker, owner;

    beforeEach(async () => {
        StakingFactory = await ethers.getContractFactory("NativeStaking");
        MaliciousContract = await ethers.getContractFactory("ReentrancyAttack");

        TokenFactory = await ethers.getContractFactory("MyToken");
        StakedToken = await TokenFactory.deploy();
        RewardsToken = await TokenFactory.deploy();

        

        const [owners, Address2s] = await ethers.getSigners();
        ContractDeployer = await owners.getAddress();

        StakingContract = await upgrades.deployProxy(
            StakingFactory,
            [ContractDeployer, ContractDeployer, 9000000, StakedToken.address, RewardsToken.address, 9000000000],
            { initializer: "initialize"}
         );

       malicious = await MaliciousContract.deploy(StakingContract.address);
       const SendsH1 = await ethers.getSigner(ContractDeployer);
        
        // Assume the attacker has staked or deposited some tokens and Ether before initiating the attack.
        await StakingContract.stake(0, {value: ONE_H1});
        await RewardsToken.mint(StakingContract.address, "900000000000000000000000000")
     //  await SendsH1.sendTransaction({ to: malicious.address, value: ONE_H1 });
  /   await StakingContract.stake(0, {value: TEN_H1} );
        await time.increase(time.duration.years(1));
        
    });

    it("should perform a reentrancy attack on withdraw", async () => {
        await expectRevert.unspecified(malicious.attack(0, ONE_H1),"");
    });
    it("should perform a reentrancy attack on get rewards", async () => {
        await expectRevert(
            malicious.attackRewards(),
            `NoRewardToClaim("${malicious.address}")`
             );

    });
});
