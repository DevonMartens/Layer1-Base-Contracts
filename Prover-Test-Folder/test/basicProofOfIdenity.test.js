// const ProofOfIdentity = artifacts.require("ProofOfIdentity");
// const IPermissionsInterface = artifacts.require("Dummy");
// const VerifiableIdentity = artifacts.require("VerifiableIdentity");
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");


const {
    expectRevert
} = require("@openzeppelin/test-helpers");
const catchRevert = require("./exceptionsHelpers.js").catchRevert;


require("./utils.js");

const _BN = web3.utils.BN;
const BN = (value) => {
    return new _BN(value)
}


contract("ProofOfIdentityContracts", async ([owner, alice, random]) => {


    describe("Testing the initial values to validate expected contract state", function () {
        let ProofOfIdentityContract;
        beforeEach(async() => {
            const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity")
            const IPermissionsInterface = await ethers.getContractFactory("Dummy")
            const IPermissionsInterfaceDummyInstance = await IPermissionsInterface.deploy();
            ProofOfIdentityContract = await upgrades.deployProxy(ProofOfIdentity, [IPermissionsInterfaceDummyInstance.address], { initializer: 'initialize' });
        });

        it("The contract: have correct values for name & symbol", async () => {
            expect(await ProofOfIdentityContract.name()).to.equal("Proof of Identity")
            expect(await ProofOfIdentityContract.symbol()).to.equal("H1-ID")
      
        });
        it("The contract: should have 1 value for _tokenIdCounter", async () => {
            expect(await ProofOfIdentityContract.getCurrentTokenId()).to.equal(1)
 
        });
    });
    describe("Testing the mintIdentity to validate expected contract state", function () {
        let ProofOfIdentityContract;
        let owner;
        let alice;
        beforeEach(async() => {
            const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity")
            const IPermissionsInterface = await ethers.getContractFactory("Dummy")
            const IPermissionsInterfaceDummyInstance = await IPermissionsInterface.deploy();
            ProofOfIdentityContract = await upgrades.deployProxy(ProofOfIdentity, [IPermissionsInterfaceDummyInstance.address], { initializer: 'initialize' });
            //get addresses for this test
            const [owners, alices] = await ethers.getSigners();
            owner = await owners.getAddress();
            alice = await alices.getAddress();
            //mints tokenid 1 to alice
            // country code "1" , userType 2 ,level 3, expiry block, tokenURI
            await ProofOfIdentityContract.mintIdentity(alice, "1", 2, 3, 78886932657, "token");
        });
        it("The ProofOfIdentity contract's function mintIdentity should mint a token to the address it is requested to", async () => {
            //checks that alice owns token one
            expect(await ProofOfIdentityContract.ownerOf(1)).to.equal(alice)
        });
        it("The ProofOfIdentity contract's function mintIdentity should create an identity blob struct with correct values for country code", async () => {
            //checks that the country code is "1" as expected
            expect(await ProofOfIdentityContract.getUserAccountCountryCode(alice)).to.equal("1")
        });
        it("The ProofOfIdentity contract's function mintIdentity should create an identity blob struct with correct values for userType", async () => {
            expect(await ProofOfIdentityContract.getUserAccountType(alice)).to.equal(2)
        });
        it("The ProofOfIdentity contract's function mintIdentity should create an identity blob struct with correct values for level", async () => {
            expect(await ProofOfIdentityContract.getUserAccountLevel(alice)).to.equal(3)
        });
        it("The ProofOfIdentity contract's function mintIdentity should create an identity blob struct with correct values for expiry", async () => {
            expect(await ProofOfIdentityContract.getUserAccountExpiry(alice)).to.equal(78886932657)
        });
        it("The ProofOfIdentity contract's function mintIdentity should create multiple structs and mint multiple tokens", async () => {
            await ProofOfIdentityContract.mintIdentity(random, 1, 2, 3, 78886932625, "token");
            //calls expiry in struct to ensure formation
            expect(await ProofOfIdentityContract.getUserAccountExpiry(alice)).to.equal(78886932657)
            expect(await ProofOfIdentityContract.getUserAccountExpiry(random)).to.equal(78886932625)
            //call erc721 owner of to ensure tokens were placed
            expect(await ProofOfIdentityContract.ownerOf(1)).to.equal(alice)
            expect(await ProofOfIdentityContract.getUserAccountExpiry(2)).to.equal(random)
        });
        it("The ProofOfIdentity contract's function mintIdentity should create a token with the custom input as it's URI", async () => {
            expect(await ProofOfIdentityContract.tokenURI(1)).to.equal("tokenURI")
        });
    });
    describe("Testing updateIdentity to validate expected contract state", function () {
        let ProofOfIdentityContract;
        let owner;
        let alice;
        beforeEach(async() => {
            const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity")
            const IPermissionsInterface = await ethers.getContractFactory("Dummy")
            const IPermissionsInterfaceDummyInstance = await IPermissionsInterface.deploy();
            ProofOfIdentityContract = await upgrades.deployProxy(ProofOfIdentity, [IPermissionsInterfaceDummyInstance.address], { initializer: 'initialize' });
            //get addresses for this test
            const [owners, alices] = await ethers.getSigners();
            owner = await owners.getAddress();
            alice = await alices.getAddress();
            //mints tokenid 1 to alice
            // country code "1" , userType 2 ,level 3, expiry block, tokenURI
            await ProofOfIdentityContract.mintIdentity(alice, "1", 2, 3, 78886932657, "token");
        });
		
        it("The contract: function updateIdentity should alter a previously created identity through mintIdentity by adjusting the identity blob struct values for country code", async () => {
            //confirms original country code
            expect(await ProofOfIdentityContract.getUserAccountCountryCode(alice)).to.equal("1")
            //updates 
            await DV.updateIdentity(alice, "4", 2, 3, 78886932657);
            //gets new code
            expect(await ProofOfIdentityContract.getUserAccountCountryCode(alice)).to.equal("4")
        });
        it("The contract: function updateIdentity should alter a previously created identity through mintIdentity by adjusting identity blob struct values for userType", async () => {
            //checks original user type
            expect(await ProofOfIdentityContract.getUserAccountType(alice)).to.equal(2)
            //updates 
            await ProofOfIdentityContract.updateIdentity(alice, 1, 5, 3, 78886932657);
            //gets new code
            expect(await ProofOfIdentityContract.getUserAccountType(alice)).to.equal(5)
        });
        it("The contract: ffunction updateIdentity should alter a previously created identity through mintIdentity by adjusting identity blob struct values for level", async () => {
            expect(await ProofOfIdentityContract.getUserAccountLevel(alice)).to.equal(3)
            //updates account level to 6
            await ProofOfIdentityContract.updateIdentity(alice, 1, 6 , 6, 78886932657);
            //gets new code
            const NewLevelOfUser = await DV.getUserAccountType(alice);
            //checks old country code
             assert.equal(
                NewLevelOfUser,
                   6
            );
        });
        it("The contract: function updateIdentity should alter a previously created identity through mintIdentity by adjusting identity blob struct values for expiry", async () => {
            const P = await IPermissionsInterface.new();
            const DV = await deployProxy(ProofOfIdentity, [P.address], { initializer: 'initialize' });
            await DV.mintIdentity(alice, 1, 2, 3, 78886932657, "token");
           const tokenOwner = await DV.ownerOf(1);
            const ExpiryOfUser = await DV.getUserAccountExpiry(alice);
             assert.equal(
                ExpiryOfUser,
                   78886932657
            );
             //updates 
            await DV.updateIdentity(alice, 1, 2, 6, 78886932658);
            //gets new code
            const NewExpiryOfUser = await DV.getUserAccountExpiry(alice);
            //checks old country code
             assert.equal(
                NewExpiryOfUser,
                   78886932658
            );
        });
        it("The contract: function updateIdentity should alter a previously created identity through mintIdentity by adjust multiple structss", async () => {
            //deploys permissions to get address
            const P = await IPermissionsInterface.new();
            //sets up contract
            const DV = await deployProxy(ProofOfIdentity, [P.address], { initializer: 'initialize' });
            //mints two tokens
            await DV.mintIdentity(alice, 1, 2, 3, 78886932657, "token");
            await DV.mintIdentity(random, 1, 2, 3, 78886932657, "token");
           //calls expiry in struct to ensure formation
            const ExpiryOfAlice = await DV.getUserAccountExpiry(alice);
            const ExpiryOfRandom = await DV.getUserAccountExpiry(random);
            //turns expiry to string for last call
            const stringExpiryRandom = await ExpiryOfRandom.toString();
            const stringExpiryAlice = await ExpiryOfAlice.toString();
             assert.equal(
                ExpiryOfAlice,
                   78886932657
            );
            assert.equal(
                78886932657,
                ExpiryOfRandom
            );
            
            assert.equal(
                stringExpiryRandom,
                stringExpiryAlice

            );
            //updates
            await DV.updateIdentity(alice, 1, 2, 6, 78886932658);
            await DV.updateIdentity(random, 1, 2, 6, 78886932658);
            //gets new values from contract
           //calls expiry in struct to ensure formation
            const NewExpiryOfAlice = await DV.getUserAccountExpiry(alice);
            const NewExpiryOfRandom = await DV.getUserAccountExpiry(random);
            //turns expiry to string for last call
            const stringOfNewExpiryRandom = await NewExpiryOfRandom.toString();
            const stringOfNewExpiryAlice = await NewExpiryOfAlice.toString();
             assert.equal(
                NewExpiryOfAlice,
                   78886932658
            );
            assert.equal(
                78886932658,
                NewExpiryOfRandom
            );
            
            assert.equal(
                stringOfNewExpiryRandom,
                stringOfNewExpiryAlice

            );
            
        });
        it("The contract: function updateTokenURI should create a token with the custom input as it's URI and edit it if adjusted", async () => {
            const P = await IPermissionsInterface.new();
            const DV = await deployProxy(ProofOfIdentity, [P.address], { initializer: 'initialize' });
            await DV.mintIdentity(alice, 1, 2, 3, 78886932657, "token");
            const URI  = await DV.tokenURI(1);
             assert.equal(
                URI,
                "token"
            );
            await DV.updateTokenURI(alice, "Updated", {from: owner});
            const newURI = await DV.tokenURI(1);
            assert.equal(
                newURI,
                "Updated"
            );
        });
    });
    describe("Testing Function Permissions to ensure Access Control works as expected           ", () => {
        /**  
        ================================================
        |                 Access Control               |
        ================================================
        **/
		

        it("The contract: function mintIdentity should only allow a PROVER_ROLE address to call it", async () => {
            const P = await IPermissionsInterface.new();
            const DV = await deployProxy(ProofOfIdentity, [P.address], { initializer: 'initialize' });
            await DV.mintIdentity(alice, "1", 2, 3, 78886932657, "token");
           const tokenOwner = await DV.ownerOf(1);
            const CountryCode = await DV.getUserAccountCountryCode(alice);
            //for address and role retrieval
            const FROM = alice.toLowerCase();
            const PROVER_ROLE = await DV.PROVER_ROLE();
            //checks old country code
             assert.equal(
                CountryCode,
                   "1"
            );
            await expectRevert(
                DV.mintIdentity(
                    alice,
                    1,
                    2,
                    3,
                    78886932657,
                    "token",
                    {
                        from: FROM
                    }
                ),
                `AccessControl: account ${FROM} is missing role ${PROVER_ROLE}`
            );
        });
        it("The contract: function updateIdentity should only allow a PROVER_ROLE address to call it", async () => {
            const P = await IPermissionsInterface.new();
            const DV = await deployProxy(ProofOfIdentity, [P.address], { initializer: 'initialize' });
            await DV.mintIdentity(alice, 1, 2, 3, 78886932657, "token");
           const tokenOwner = await DV.ownerOf(1);
            const UserType = await DV.getUserAccountType(alice);
             assert.equal(
                UserType,
                   2
            );
            //for address and role retrieval
            const FROM = alice.toLowerCase();
            const PROVER_ROLE = await DV.PROVER_ROLE();
            //updates 
              await expectRevert(
                DV.updateIdentity(
                    alice,
                    1,
                    2,
                    3,
                    78886932657,
                    {
                        from: FROM
                    }
                ),
                `AccessControl: account ${FROM} is missing role ${PROVER_ROLE}`
            );
        });
         it("The contract: should allow admin to grant PROVER_ROLE", async () => {
            const P = await IPermissionsInterface.new();
            const DV = await deployProxy(ProofOfIdentity, [P.address], { initializer: 'initialize' });
            await DV.mintIdentity(alice, 1, 2, 3, 78886932657, "token");
           const tokenOwner = await DV.ownerOf(1);
            const UserType = await DV.getUserAccountType(alice);
             assert.equal(
                UserType,
                   2
            );
            //for address and role retrieval
            const FROM = alice.toLowerCase();
            const PROVER_ROLE = await DV.PROVER_ROLE();
            //updates 
              await expectRevert(
                DV.updateIdentity(
                    alice,
                    1,
                    2,
                    3,
                    78886932657,
                    {
                        from: FROM
                    }
                ),
                `AccessControl: account ${FROM} is missing role ${PROVER_ROLE}`
            );
        });
        it("The contract: admin should be the contract deployer that address will be able to issue PROVER_ROLES", async () => {
            const P = await IPermissionsInterface.new();
            const DV = await deployProxy(ProofOfIdentity, [P.address], { initializer: 'initialize' });
            await DV.mintIdentity(alice, 1, 2, 3, 78886932657, "token");
           const tokenOwner = await DV.ownerOf(1);
            const UserType = await DV.getUserAccountType(alice);
             assert.equal(
                UserType,
                   2
            );
            //for address and role retrieval
            const FROM = alice.toLowerCase();
            const PROVER_ROLE = await DV.PROVER_ROLE();
            //updates 
              await expectRevert(
                DV.updateIdentity(
                    alice,
                    1,
                    2,
                    3,
                    78886932657,
                    {
                        from: FROM
                    }
                ),
                `AccessControl: account ${FROM} is missing role ${PROVER_ROLE}`
            );
            await DV.grantRole(PROVER_ROLE, FROM);
            await DV.updateIdentity(
                    alice,
                    1,
                    2,
                    3,
                    78886932657,
                    {
                        from: FROM
                    }
                );

        });
        it("The contract: only ADMIN should grant roles", async () => {
            const P = await IPermissionsInterface.new();
            const DV = await deployProxy(ProofOfIdentity, [P.address], { initializer: 'initialize' });
            //for address and role retrieval
            const FROM = alice.toLowerCase();
            const PROVER_ROLE = await DV.PROVER_ROLE();
            const DEFAULT_ADMIN_ROLE = await DV.DEFAULT_ADMIN_ROLE();
            //updates 
              await expectRevert(
                DV.grantRole(PROVER_ROLE, FROM,
                    {
                        from: FROM
                    }
                ),
                `AccessControl: account ${FROM} is missing role ${DEFAULT_ADMIN_ROLE}`
            );
        });
      it("The contract: function updateTokenURI should only be allowed to be called by a PROVER_ROLE", async () => {
            const P = await IPermissionsInterface.new();
            const DV = await deployProxy(ProofOfIdentity, [P.address], { initializer: 'initialize' });
            await DV.mintIdentity(alice, 1, 2, 3, 78886932657, "token");
            const URI  = await DV.tokenURI(1);
             assert.equal(
                URI,
                "token"
            );
            
            //for address and role retrieval
            const FROM = alice.toLowerCase();
            const PROVER_ROLE = await DV.PROVER_ROLE();
            //updates 
              await expectRevert(
                   DV.updateTokenURI(alice, "Updated",
                    {
                        from: alice
                        // FROM
                    }
                ),
                `AccessControl: account ${FROM} is missing role ${PROVER_ROLE}`
            );

            const newURI = await DV.tokenURI(1);
            assert.notEqual(
                newURI,
                "Updated"
            );

        });
        it("The contract: function suspendAccountDeleteTokenAndIdentityBlob should only allow a PROVER_ROLE address to call it", async () => {
            const P = await IPermissionsInterface.new();
            const DV = await deployProxy(ProofOfIdentity, [P.address], { initializer: 'initialize' });
            await DV.mintIdentity(alice, "1", 2, 3, 78886932657, "token");
           const tokenOwner = await DV.ownerOf(1);
            const CountryCode = await DV.getUserAccountCountryCode(alice);
            //for address and role retrieval
            const FROM = alice.toLowerCase();
            const PROVER_ROLE = await DV.PROVER_ROLE();
            //checks old country code
             assert.equal(
                CountryCode,
                   "1"
            );
            await expectRevert(
                DV.suspendAccountDeleteTokenAndIdentityBlob(
                    alice,
                    0,
                    {
                        from: FROM
                    }
                ),
                `AccessControl: account ${FROM} is missing role ${PROVER_ROLE}`
            );
        });
        it("The contract: function deleteSingleHolderToken should only allow a PROVER_ROLE address to call it", async () => {
            const P = await IPermissionsInterface.new();
            const DV = await deployProxy(ProofOfIdentity, [P.address], { initializer: 'initialize' });
            await DV.mintIdentity(alice, "1", 2, 3, 78886932657, "token");
           const tokenOwner = await DV.ownerOf(1);
            const CountryCode = await DV.getUserAccountCountryCode(alice);
            //for address and role retrieval
            const FROM = alice.toLowerCase();
            const PROVER_ROLE = await DV.PROVER_ROLE();
            //checks old country code
             assert.equal(
                CountryCode,
                   "1"
            );
            await expectRevert(
                DV.suspendAccountMaintainTokenAndIdentityBlob(
                    alice,
                    "lying",
                    {
                        from: FROM
                    }
                ),
                `AccessControl: account ${FROM} is missing role ${PROVER_ROLE}`
            );
        });
        it("The contract: function suspendAccountDeleteTokenAndIdentityBlobshould only allow a PROVER_ROLE address to call it", async () => {
            const P = await IPermissionsInterface.new();
            const DV = await deployProxy(ProofOfIdentity, [P.address], { initializer: 'initialize' });
            await DV.mintIdentity(alice, "1", 2, 3, 78886932657, "token");
           const tokenOwner = await DV.ownerOf(1);
            const CountryCode = await DV.getUserAccountCountryCode(alice);
            //for address and role retrieval
            const FROM = alice.toLowerCase();
            const PROVER_ROLE = await DV.PROVER_ROLE();
            //checks old country code
             assert.equal(
                CountryCode,
                   "1"
            );
            await expectRevert(
                DV.suspendAccountMaintainTokenAndIdentityBlob(
                    alice,
                    "lying",
                    {
                        from: FROM
                    }
                ),
                `AccessControl: account ${FROM} is missing role ${PROVER_ROLE}`
            );
        });
    });

    describe("Testing contracts that inhert OtherInformation and RoleVerification should view correct values for a set struct of identityBlob         ", () => {
        it("The contract: values for `country code` in the test caller contract should match the values for the original contract", async () => {
            const P = await IPermissionsInterface.new();
            const DV = await deployProxy(ProofOfIdentity, [P.address], { initializer: 'initialize' });
            const TC = await VerifiableIdentity.new(DV.address);
            await DV.mintIdentity(alice, "1", 2, 3, 78886932657, "token");
            const tokenOwner = await DV.ownerOf(1);
            const CountryCode = await DV.getUserAccountCountryCode(alice);
             assert.equal(
                CountryCode,
                   "1"
            );
           const TCCountryCode = await TC.getUserAccountCountryCodeVerifiableIdentity(alice);
           assert.equal(
                TCCountryCode,
                   "1"
            );

        });
        it("The contract: values for `user type` in the test caller contract should match the values for the original contract", async () => {
            const P = await IPermissionsInterface.new();
            const DV = await deployProxy(ProofOfIdentity, [P.address], { initializer: 'initialize' });
            const TC = await VerifiableIdentity.new(DV.address);
            await DV.mintIdentity(alice, "1", 2, 3, 78886932657, "token");
            const UserType = await DV.getUserAccountType(alice);
            const checkUserT = UserType.toString();
             assert.equal(
                checkUserT,
                  "2"
            );
           const TCUserType  = await TC.getUserAccountCountryCodeVerifiableIdentity(alice);
           const doubleCheckAcc = TCUserType.toString();
           assert.equal(
            doubleCheckAcc,
                   "1"
            );
        });
        it("The contract: values for `level` in the test caller contract should match the values for the original contract", async () => {
            const P = await IPermissionsInterface.new();
            const DV = await deployProxy(ProofOfIdentity, [P.address], { initializer: 'initialize' });
            await DV.mintIdentity(alice, 1, 2, 3, 78886932657, "token");
            const TC = await VerifiableIdentity.new(DV.address);
            const tokenOwner = await DV.ownerOf(1);
            const LevelOfUser = await DV.getUserAccountLevel(alice);
             assert.equal(
                LevelOfUser,
                   3
            );
            const TCLevelOfUser  = await TC.getUserLevel(alice);
            assert.equal(
                TCLevelOfUser,
                   3
            );
        });
        it("The contract: values for `expiry` in the test caller contract should match the values for the original contract", async () => {
            const P = await IPermissionsInterface.new();
            const DV = await deployProxy(ProofOfIdentity, [P.address], { initializer: 'initialize' });
            await DV.mintIdentity(alice, 1, 2, 3, 78886932657, "token");
            const TC = await VerifiableIdentity.new(DV.address);
            const tokenOwner = await DV.ownerOf(1);
            const ExpiryOfUser = await DV.getUserAccountExpiry(alice);
             assert.equal(
                ExpiryOfUser,
                   78886932657
            );
            const TCExpiry  = await TC.getUserExpiry(alice);
            assert.equal(
                TCExpiry,
                   78886932657
            );
        });

    });
    describe("Testing contracts that ERC721 Overrides Should not Allow Token Movement         ", () => {
        it("The contract: ERC721 Overrides should not Allow safeTransferFrom to move the token", async () => {
            const P = await IPermissionsInterface.new();
            const DV = await deployProxy(ProofOfIdentity, [P.address], { initializer: 'initialize' });
            await DV.mintIdentity(alice, 1, 2, 3, 78886932657, "token");
            const tokenOwner = await DV.ownerOf(1);
            const CountryCode = await DV.getUserAccountCountryCode(alice);
            const FROM = alice.toLowerCase();
              await expectRevert(
                DV.safeTransferFrom(
                    alice,
                    random,
                    1,
                    {
                        from: FROM
                    }
                ),
                "102"
            );
        });
        it("The contract: ERC721 Overrides should not Allow transferFrom to move the token", async () => {
            const P = await IPermissionsInterface.new();
            const DV = await deployProxy(ProofOfIdentity, [P.address], { initializer: 'initialize' });
            await DV.mintIdentity(alice, 1, 2, 3, 78886932657, "token");
            const tokenOwner = await DV.ownerOf(1);
            const CountryCode = await DV.getUserAccountCountryCode(alice);
            const FROM = alice.toLowerCase();
              await expectRevert(
                DV.transferFrom(
                    alice,
                    random,
                    1,
                    {
                        from: FROM
                    }
                ),
                "102"
            );
        });
    });
  
});
