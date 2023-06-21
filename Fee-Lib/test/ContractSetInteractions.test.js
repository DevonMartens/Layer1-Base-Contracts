const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");


const {
    expectRevert
} = require("@openzeppelin/test-helpers");
const catchRevert = require("./exceptionsHelpers.js").catchRevert;
const ether = require("@openzeppelin/test-helpers/src/ether");



require("./utils.js");




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
            const H1NativeApplicationFactory = await ethers.getContractFactory("H1NativeApplication");
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
             // get address of H1NativeApplicationDeployed 
             const  H1NativeApplicationDeployedAddress = H1NativeApplicationDeployed.address;
             //simple storage for testing
            SimpleStorageWithFeeDeployed = await SimpleStorageWithFeeFactory.deploy(FeeContract.address);
             
        });

        it("NOT A TEST", async () => {
            await FeeContract.resetFee();
           await expectRevert(SimpleStorageWithFeeDeployed.set(1), "125")
           await SimpleStorageWithFeeDeployed.set(1, {value: 1})
        });
		
    });
