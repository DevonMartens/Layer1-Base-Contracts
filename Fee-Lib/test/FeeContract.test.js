const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require('@nomicfoundation/hardhat-network-helpers');

let fee;

const {
    expectRevert
} = require("@openzeppelin/test-helpers");
const catchRevert = require("./exceptionsHelpers.js").catchRevert;

const SIX_ETH = ethers.utils.parseUnits("6","ether");
const THREE_ETH = ethers.utils.parseUnits("3","ether");
const TWO_ETH = ethers.utils.parseUnits("2","ether");
const ONE_ETH = ethers.utils.parseUnits("1","ether");

//add 24 hour increase, claim rewards and getter for "lastDistribution"




    describe("Testing the initial values to validate expected contract state", function () {
        let owner;
        let ValidatorContract;
        let Fee;
        let deployBlockTimeStamp;
        let ownerArray;
        let oracleFake;
        let weight;
        beforeEach(async() => {
            //example weight 100% of bounty 1/1
            weight = [1,];
            const [owners, alices] = await ethers.getSigners();
            owner = await owners.getAddress();
            oracleFake = await alices.getAddress();
            //address of validators in validator rewards
            ownerArray = await [owner,]
            const ValidatorRewards = await ethers.getContractFactory("ValidatorRewards")
            const FeeContract = await ethers.getContractFactory("FeeContract")
            ValidatorContract = await upgrades.deployProxy(ValidatorRewards, [ownerArray, weight, owner, owner], { initializer: 'initialize' });
            Fee = await upgrades.deployProxy(FeeContract, [oracleFake, ownerArray, weight, owner, owner], { initializer: 'initialize' });
            deployBlockTimeStamp = await time.latest();;
        });

        it("The FeeContract, ValidatorRewards contract, and H1 Native contracts", async () => {
            const H1NativeApplication = await ethers.getContractFactory("H1NativeApplication")
            await H1NativeApplication.deploy(Fee.address)
        });
        it("The FeeContract should have correct values for wieght and channel (view functions getWieght and getChannel also confirmed)", async () => {
            // const addressFromContract = await Fee.getChannels();
            // const wieghtFromContract = await Fee.getWieghts();
            expect(await Fee.getChannels()).to.deep.equal(ownerArray)
            expect(await Fee.getWieghts()).to.deep.equal(weight)
        });
        it("The contract: have correct values for oracle, total contract shares, and lastDistribution", async () => {
            //gets oracle from Fee contract and ensures it is equal to alice the original inpul
            expect(await Fee.oracle()).to.equal(oracleFake)
            //gets last distribution from contract and ensures its equal to deployment time
            expect(await Fee.getLastDistributionBlock()).to.equal(deployBlockTimeStamp);
        });
    });
    describe("Fee Contract Test: Adding and adjusting wieghts and channels functions", function () {
        let owner;
        let ValidatorContract;
        let ValidatorContract2;
        let ValidatorContract3;
        let ValidatorContract4;
        let ValidatorContract5;
        let ValidatorContract6;
        let Fee;
        let random;
        let max5ArrayWeight;
        let max5ArrayChannel;
        let FeeContract;
        beforeEach(async() => {
            //addresses for using
            max5ArrayWeight = [1, 2, 3, 4, 5];
            const [owners, alices, randoms] = await ethers.getSigners();
            owner = await owners.getAddress();
            alice = await alices.getAddress();
            random = await randoms.getAddress();
              //get contract factory
              const ValidatorRewards = await ethers.getContractFactory("ValidatorRewards")
            FeeContract = await ethers.getContractFactory("FeeContract")
             //turns it into an array
             const addressArray = [alice, owner, random,] 
             const weight = [1,]
             const weightArray = [1,2, 3];
             const ownerArray = [owner,];
              //validator array that is too heavey
            ValidatorContract = await upgrades.deployProxy(ValidatorRewards, [addressArray, weightArray, owner, owner], { initializer: 'initialize' });
            ValidatorContract2 = await upgrades.deployProxy(ValidatorRewards, [addressArray, weightArray, owner, owner], { initializer: 'initialize' });
            ValidatorContract3 = await upgrades.deployProxy(ValidatorRewards, [addressArray, weightArray, owner, owner], { initializer: 'initialize' });
            ValidatorContract4 = await upgrades.deployProxy(ValidatorRewards, [addressArray, weightArray, owner, owner], { initializer: 'initialize' });
            ValidatorContract5 = await upgrades.deployProxy(ValidatorRewards, [addressArray, weightArray, owner, owner], { initializer: 'initialize' });
            ValidatorContract6 = await upgrades.deployProxy(ValidatorRewards, [addressArray, weightArray, owner, owner], { initializer: 'initialize' });
            //channel
            max5ArrayChannel = [ValidatorContract.address, ValidatorContract2.address, ValidatorContract3.address, ValidatorContract4.address, ValidatorContract5.address]

            // ValidatorContract = await ValidatorRewards.deploy(ownerArray, weight, owner, owner)
            Fee = await upgrades.deployProxy(FeeContract, [alice, max5ArrayChannel, max5ArrayWeight, owner, owner], { initializer: 'initialize' });
        });

        it("The FeeContract should allow a max of 5 addresses and 5 wieghts (representing validator rewards) in the initalizer", async () => {
                const oversizedAddressArray = [ValidatorContract.address, ValidatorContract2.address, ValidatorContract3.address, ValidatorContract4.address, ValidatorContract5.address, ValidatorContract6.address];
                const oversizedWieghtsArray = [1, 2, 3, 4, 5, 6];
                await expectRevert(
                    upgrades.deployProxy(
                        FeeContract, 
                        [
                        owner, 
                        oversizedAddressArray, 
                        oversizedWieghtsArray, 
                        owner, 
                        owner], { 
                            initializer: 
                            'initialize' 
                        }),
                    "124"
                );

            await upgrades.deployProxy(FeeContract, [alice, max5ArrayChannel, max5ArrayWeight, owner, owner], { initializer: 'initialize' });
        });
        it("Fee Contract adjustChannel should change the correct wieght and channel", async () => {
            expect(await Fee.getTotalContractShares()).to.equal(15)
            await Fee.adjustChannel(4, ValidatorContract6.address, 6);
            const channel5ShouldHaveWeightOf6 = await Fee.getChannelWeightByIndex(4);
            //for wieght
            const weightOfChannel5 = await channel5ShouldHaveWeightOf6[1];
            expect(await weightOfChannel5).to.equal(6)
            

        });
        it("addChannel should allow a new channel and wieght value the adjust the contract's total shares." , async () => {
            await max5ArrayChannel.pop();
            await max5ArrayWeight.pop();
            const notAtMaxFiveFee = await upgrades.deployProxy(FeeContract, [alice, max5ArrayChannel, max5ArrayWeight, owner, owner], { initializer: 'initialize' });
            //gets original share amount to add to to confirm adjustments
            const originalShareAmount = await notAtMaxFiveFee.getTotalContractShares()
            //add 5
            const newExpectedShareAmount = originalShareAmount + 5
            //add a channel 5th so this should be max
            await notAtMaxFiveFee.addChannel(ValidatorContract5.address, 5)
            //expect 5 to be added to old total
            expect(await notAtMaxFiveFee.getTotalContractShares()).to.equal(newExpectedShareAmount)
            //confirms array is has the values of our addition for position 4
            const positionFour = await notAtMaxFiveFee.getChannelWeightByIndex(4);
            const addressOfPositionFour = positionFour[0]
            const wieghtsOfPositionFour = positionFour[1]
            //address of position 4 should be Validator Contract 5
            expect(addressOfPositionFour).to.equal(ValidatorContract5.address)
            //wieghts of position 4 should be 5
            expect(5).to.equal(wieghtsOfPositionFour)

        });
        it("addChannel should not allow duplicates." , async () => {
            await max5ArrayChannel.pop();
            await max5ArrayWeight.pop();
            const notAtMaxFiveFee = await upgrades.deployProxy(FeeContract, [alice, max5ArrayChannel, max5ArrayWeight, owner, owner], { initializer: 'initialize' });
            //add a channel 5th so this should be max
            await expectRevert(
                notAtMaxFiveFee.addChannel(
                    ValidatorContract3.address,
                    6
                ),
                "123"
            );
        });
            it("addChannel should not allow more than 5 channels" , async () => {
            await expectRevert(
                Fee.addChannel(
                    ValidatorContract5.address,
                    6
                ),
                "124"
            );
        });
    });
    describe("Initail tests that require oracle feedback", function () {
        let owner;
        let OracleContract;
        let ValidatorContract;
        let ValidatorContract2;
        let ValidatorContract3;
        let FeeContract;
        let random;
        let randomSig;
        let randomAddressIsTheSigner;
        beforeEach(async() => {
            //addresses for using
            const [owners, alices, randoms] = await ethers.getSigners();
            owner = await owners.getAddress();
            alice = await alices.getAddress();
            random = await randoms.getAddress();
            randomSig = ethers.provider.getSigner(random);
            //get contract factories
            const ValidatorRewardsFactory = await ethers.getContractFactory("ValidatorRewards")
            const FeeContractFactory = await ethers.getContractFactory("FeeContract")
            const OracleFactory = await ethers.getContractFactory('FeeOracle');
            //deploy Oracle
            OracleContract = await OracleFactory.deploy();
            //turns it into an array
            const addressArray = [alice, owner, random,] 
            const weightArray = [1,2, 3]
            //validator contracts printed out
            ValidatorContract = await upgrades.deployProxy(ValidatorRewardsFactory, [addressArray, weightArray, owner, owner], { initializer: 'initialize' });
            ValidatorContract2 = await upgrades.deployProxy(ValidatorRewardsFactory, [addressArray, weightArray, owner, owner], { initializer: 'initialize' });
            ValidatorContract3 = await upgrades.deployProxy(ValidatorRewardsFactory, [addressArray, weightArray, owner, owner], { initializer: 'initialize' });
            const ValidatorArray = [ValidatorContract.address, ValidatorContract2.address, ValidatorContract3.address];
            // Fee contract
            FeeContract = await upgrades.deployProxy(FeeContractFactory, [OracleContract.address, ValidatorArray , weightArray, owner, owner], { initializer: 'initialize' });
            randomSig = await ethers.getSigner(random)
            secondAddressSigner = await ethers.getSigner(random)
            randomAddressIsTheSigner = FeeContract.connect(secondAddressSigner);
        });

        it("Confirm Oracle is giving correct data to fee contract", async () => {
            const ValueOfQuery = await FeeContract.queryOracle();
            const otherValue = await OracleContract.consult();
            expect(ValueOfQuery).to.equal(otherValue);
        });
        it("Test CollectFee Function is sending eth to validators", async () => {
            await randomSig.sendTransaction({to:FeeContract.address, value: SIX_ETH});
            const ExpectedPayout = await FeeContract.amountPaidToUponNextDistribution(1);
            await time.increase(time.duration.days(1));
            expect(ExpectedPayout).to.equal(TWO_ETH);
            expect(() => FeeContract.collectFee())
            .to.changeEtherBalance(ValidatorContract, ONE_ETH);
        });
        it("Test CollectFee Function is requiring 24 hours or a Distributor role", async () => {
            await randomSig.sendTransaction({to:FeeContract.address, value: SIX_ETH});
            const ExpectedPayout = await FeeContract.amountPaidToUponNextDistribution(1);
            expect(ExpectedPayout).to.equal(TWO_ETH);
            expectRevert(randomAddressIsTheSigner.collectFee(), "121")
            await FeeContract.collectFee()
        });
        it("Test CollectFee Function is requiring 24 hours", async () => {
            await randomSig.sendTransaction({to:FeeContract.address, value: SIX_ETH});
            const ExpectedPayout = await FeeContract.amountPaidToUponNextDistribution(1);
             await time.increase(time.duration.days(1));
            expect(ExpectedPayout).to.equal(TWO_ETH);
            await randomAddressIsTheSigner.collectFee()
            //randomAddressIsTheSigner
        });
        it("Test ForceFee Function is sending eth to validators", async () => {
            await randomSig.sendTransaction({to:FeeContract.address, value: SIX_ETH});
            const ExpectedPayout = await FeeContract.amountPaidToUponNextDistribution(1);
            expect(ExpectedPayout).to.equal(TWO_ETH);
            expect(() => FeeContract.forceFee())
            .to.changeEtherBalance(ValidatorContract, ONE_ETH);
        });
});
describe("Fee Contract General Getters and Setters", function () {
    let owner;
    let ValidatorContract;
    let Fee;
    let deployBlockTimeStamp;
    let ownerArray;
    let oracleFake;
    let weight;
    beforeEach(async() => {
        //example weight 100% of bounty 1/1
        weight = [1,];
        const [owners, alices] = await ethers.getSigners();
        owner = await owners.getAddress();
        oracleFake = await alices.getAddress();
        //address of validators in validator rewards
        ownerArray = await [owner,]
        const ValidatorRewards = await ethers.getContractFactory("ValidatorRewards")
        const FeeContract = await ethers.getContractFactory("FeeContract")
        ValidatorContract = await upgrades.deployProxy(ValidatorRewards, [ownerArray, weight, owner, owner], { initializer: 'initialize' });
        Fee = await upgrades.deployProxy(FeeContract, [oracleFake, ownerArray, weight, owner, owner], { initializer: 'initialize' });
        deployBlockTimeStamp = await time.latest();;
    });

    it("The Reset Fee should change the last distribution annd ", async () => {
        const H1NativeApplication = await ethers.getContractFactory("H1NativeApplication")
        await H1NativeApplication.deploy(Fee.address)
    });
});
