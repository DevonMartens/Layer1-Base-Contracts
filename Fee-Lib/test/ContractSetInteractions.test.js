const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");


const {
    expectRevert
} = require("@openzeppelin/test-helpers");
const catchRevert = require("./exceptionsHelpers.js").catchRevert;
// 
const ether = require("@openzeppelin/test-helpers/src/ether");


ONE_H1 = ethers.utils.parseUnits("1","ether");

    describe("Contract Interactions", function () {
        let owner;
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
            H1NativeApplicationFactory = await ethers.getContractFactory("H1NativeApplication");
            const SimpleStorageWithFeeFactory = await ethers.getContractFactory("SimpleStorageWithFee");
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
             //H1NativeApplication contains modifer to import into all contracts for recieving funds
             H1NativeApplicationDeployed = await H1NativeApplicationFactory.deploy(FeeContract.address);
             //simple storage for testing
            SimpleStorageWithFeeDeployed = await SimpleStorageWithFeeFactory.deploy(FeeContract.address);
             
        });

        it("The oracle should be requesting the amount from simple storage", async () => {
            await FeeContract.resetFee();
           await expectRevert(SimpleStorageWithFeeDeployed.set(1), "125")
           await SimpleStorageWithFeeDeployed.set(1, {value: 1})
        });
        //20,21,23,26,50
        it("H1NativeApplication applicationFee() should not if call fee is 0 ", async () => {
           await SimpleStorageWithFeeDeployed.set(1)
        });
        it("H1NativeApplication applicationFee() should not if call fee is 0 and no value is sent but should if it is greater than", async () => {
            await SimpleStorageWithFeeDeployed.set(1)
            await FeeContract.resetFee();
            await expectRevert(SimpleStorageWithFeeDeployed.set(1), "125")
            await SimpleStorageWithFeeDeployed.set(1, {value: 1})
         });
         it("H1NativeApplication applicationFee() should not if call fee is 0 and no value is sent but should if it is greater than", async () => {
            await OracleContract.setPriceAverage(ONE_H1)
            await FeeContract.resetFee();
            await expectRevert(SimpleStorageWithFeeDeployed.set(1), "125")
            expect(() => SimpleStorageWithFeeDeployed.set(1, {value: ONE_H1})
            .to.changeEtherBalance(FeeContract.address, ONE_H1));
         });
         it("H1NativeApplication callFee should mirror fee contracts", async () => {
            expect(await H1NativeApplicationDeployed.callFee()).to.equal(0)
            await OracleContract.setPriceAverage(ONE_H1)
            await FeeContract.resetFee();
            const FeeFromFeeContract = await FeeContract.queryOracle();
            expect(FeeFromFeeContract.toString()).to.equal(ONE_H1.toString())
         });
         it("H1NativeApplication callFee should mirror fee contracts", async () => {
            expect(await H1NativeApplicationDeployed.FeeContract()).to.equal(FeeContract.address)
         });
         it("H1NativeApplication should not deploy if ", async () => {
            //use unspecified because cannot estimate gas will be returned
            await expectRevert(H1NativeApplicationFactory.deploy("0x0000000000000000000000000000000000000000"), '123')
         });
		
    });
