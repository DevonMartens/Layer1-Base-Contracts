const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

let fee;

const {
    expectRevert
} = require("@openzeppelin/test-helpers");
const catchRevert = require("./exceptionsHelpers.js").catchRevert;


require("./utils");

//add 24 hour increase, claim rewards and getter for "lastDistribution"

contract("FeeContract", async ([alice, bob, random]) => {


    describe("Testing the initial values to validate expected contract state", function () {
        let owner;
        let ValidatorContract;
        let Fee;
        let deployBlockTimeStamp;
        beforeEach(async() => {
            //example weight 100% of bounty 1/1
            const weight = [1,];
            const [owners, alices] = await ethers.getSigners();
            owner = await owners.getAddress();
            oracelFake = await alices.getAddress();
            //address of validators in validator rewards
            const ownerArray = [owner,]
            const ValidatorRewards = await ethers.getContractFactory("ValidatorRewards")
            ValidatorContract = await ValidatorRewards.deploy(ownerArray, weight, owner, owner)
            FeeContract = await ethers.getContractFactory("FeeContract")
            Fee = await upgrades.deployProxy(FeeContract, [oracleFake, addressArray, weight, owner, owner], { initializer: 'initialize' });
            const block = await web3.eth.getBlock('latest');
            const deployBlockTimeStamp = block.timestamp;
        });

        it("The FeeContract, ValidatorRewards contract, and H1 Native contracts", async () => {
            const H1NativeApplication = await ethers.getContractFactory("H1NativeApplication")
            const FeeAddr = await ethers.getAddress(Fee)
            await H1NativeApplication.deploy(FeeAddr)
        });
        it("The FeeContract should have correct values for wieght and channel (view functions getWieght and getChannel also confirmed)", async () => {
            // const addressFromContract = await Fee.getChannels();
            // const wieghtFromContract = await Fee.getWieghts();
            expect(await Fee.getChannels()).to.equal(addressArray)
            expect(await Fee.getWieghts()).to.equal(weight)
        });
        it("The contract: have correct values for oracle, total contract shares, and lastDistribution", async () => {
            //gets oracle from Fee contract and ensures it is equal to alice the original inpul
            expect(await Fee.oracle()).to.equal(alice)
            //gets last distribution from contract and ensures its equal to deployment time
            expect(await Fee.lastDistribution()).to.equal(deployBlockTimeStamp)
            //checks that total contract shares = 1 the total of the wieghts
            expect(await Fee.CONTRACT_SHARES).to.equal(1)
        });
    });
    describe("Fee Contract Test: Adding and adjusting wieghts and channels functions", function () {
        let owner;
        let ValidatorContract;
        let Fee;
        let random;
        let oversizedAddressArray;
        let oversizedWieghtsArray;
        let max5ArrayChannel = [A, A1, A2, A3, A4];
        let max5ArrayWeight = [1, 2, 3, 4, 5];
        beforeEach(async() => {
            //addresses for using
            const [owners, alices, randoms] = await ethers.getSigners();
            owner = await owners.getAddress();
            alice = await alices.getAddress();
            random = await randoms.getAddress();
            //variables for deploying
            const weightArray = [1,2, 3];
            const ownerArray = [owner,];
            const mixredArray = [owner, alice, random];
            //get contract factory
            const ValidatorRewards = await ethers.getContractFactory("ValidatorRewards")
            FeeContract = await ethers.getContractFactory("FeeContract")
            //deploy 
            ValidatorContract = await ValidatorRewards.deploy(ownerArray, weight, owner, owner)
            Fee = await upgrades.deployProxy(FeeContract, [alice, mixedArray, weightArray, owner, owner], { initializer: 'initialize' });
            //validator array that is too heavey
            const VR = await ValidatorRewards.deploy(mixredArray, weight, owner, owner);
                const VR1 = await ValidatorRewards.deploy(mixredArray, weight, owner, owner);
                const VR2 = await ValidatorRewards.deploy(mixredArray, weight, owner, owner);
                const VR3 = await ValidatorRewards.deploy(mixredArray, weight, owner, owner);
                const VR4 = await ValidatorRewards.deploy(mixredArray, weight, owner, owner);
                const VR5 = await ValidatorRewards.deploy(mixredArray, weight, owner, owner);
                const A = VR.getAddress();
                const A1 = VR1.getAddress();
                const A2 = VR2.getAddress();
                const A3 = VR3.getAddress();
                const A4 = VR4.getAddress();
                const A5 = VR5.getAddress();
                //turns it into an array
                oversizedAddressArray = [A, A1, A2, A3, A4, A5];
                oversizedWieghtsArray = [1, 2, 3, 4, 5, 6];
                max5ArrayChannel = [A, A1, A2, A3, A4];
                max5ArrayWeight = [1, 2, 3, 4, 5];
        });

        it("The FeeContract should allow a max of 5 addresses and 5 wieghts (representing validator rewards) in the contructor", async () => {
                await expectRevert(
                    deployProxy(
                        fee, 
                        [
                        oracle, 
                        addressArray, 
                        oHWeight, 
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
            expect(await Fee.CONTRACT_SHARES).to.equal(15)
            await Fee.adjustChannel(4, A5, 6);
            const A45 = await Fee.getChannelWeightByIndex(4);
            const A5Check = A45[0];
            //for wieght
            const getWieghtNum = A45[1];
            expect(getWieghtNum).to.equal(6)
            expect(await FeeContract.CONTRACT_SHARES).to.equal(16)

        });
        it("addChannel should allow new channels and wieghts to be added adjust the CONTRACT shares but not allow duplicates or more than 5", async () => {
            const maxFiveFee = await upgrades.deployProxy(FeeContract, [alice, max5ArrayChannel, max5ArrayWeight, owner, owner], { initializer: 'initialize' });
            //add a channel 5th so this should be max
            await expectRevert(
                maxFiveFee.addChannel(
                    A3,
                    6
                ),
                "123"
            );
            await Fee.addChannel(A4, 5);
            await F.getChannelWeightByIndex(4);
            await expectRevert(
                Fee.addChannel(
                    A5,
                    6
                ),
                "124"
            );
            // const shares = await F.CONTRACT_SHARES();
            // const stringShares = shares.toString();
            // assert.equal(
            //     stringShares,
            //     "15"
            // );
        });
    });

 
 });
