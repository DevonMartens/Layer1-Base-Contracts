// const ProofOfIdentity = artifacts.require("ProofOfIdentity");
// const IPermissionsInterface = artifacts.require("Dummy");
// const VerifiableIdentity = artifacts.require("VerifiableIdentity");
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { getImplementationAddress } = require('@openzeppelin/upgrades-core');


const {
    expectRevert
} = require("@openzeppelin/test-helpers");
const catchRevert = require("./exceptionsHelpers.js").catchRevert;


require("./utils.js");




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
        let other;
        beforeEach(async() => {
            const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity")
            const IPermissionsInterface = await ethers.getContractFactory("Dummy")
            const IPermissionsInterfaceDummyInstance = await IPermissionsInterface.deploy();
            ProofOfIdentityContract = await upgrades.deployProxy(ProofOfIdentity, [IPermissionsInterfaceDummyInstance.address], { initializer: 'initialize' });
            //get addresses for this test
            const [owners, alices, others] = await ethers.getSigners();
            owner = await owners.getAddress();
            alice = await alices.getAddress();
            other = await others.getAddress();
            //mints tokenid 1 to alice
            // country code "1" , userType 2 ,level 3, expiry block, tokenURI
            await ProofOfIdentityContract.mintIdentity(alice, "1", 2, 3, 78886932657, "tokenURI");
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
            await ProofOfIdentityContract.mintIdentity(other, "1", 2, 3, 78886932625, "tokenURI");
            //calls expiry in struct to ensure formation
            expect(await ProofOfIdentityContract.getUserAccountExpiry(alice)).to.equal(78886932657)
            expect(await ProofOfIdentityContract.getUserAccountExpiry(other)).to.equal(78886932625)
            //call erc721 owner of to ensure tokens were placed
            expect(await ProofOfIdentityContract.ownerOf(1)).to.equal(alice)
            expect(await ProofOfIdentityContract.ownerOf(2)).to.equal(other)
        });
        it("The ProofOfIdentity contract's function mintIdentity should create a token with the custom input as it's URI", async () => {
            expect(await ProofOfIdentityContract.tokenURI(1)).to.equal("tokenURI")
        });
    });
    describe("Testing updateIdentity to validate expected contract state", function () {
        let ProofOfIdentityContract;
        let alice;
        let other;
        beforeEach(async() => {
            const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity")
            const IPermissionsInterface = await ethers.getContractFactory("Dummy")
            const IPermissionsInterfaceDummyInstance = await IPermissionsInterface.deploy();
            ProofOfIdentityContract = await upgrades.deployProxy(ProofOfIdentity, [IPermissionsInterfaceDummyInstance.address], { initializer: 'initialize' });
            //get addresses for this test
            const [owners, alices, others] = await ethers.getSigners();
            alice = await alices.getAddress();
            other = await others.getAddress();
            //mints tokenid 1 to alice
            // country code "1" , userType 2 ,level 3, expiry block, tokenURI
            await ProofOfIdentityContract.mintIdentity(alice, "1", 2, 3, 78886932657, "tokenURI");
        });
        it("The contract: function updateIdentity should alter a previously created identity through mintIdentity by adjusting the identity blob struct values for country code", async () => {
            //confirms original country code
            expect(await ProofOfIdentityContract.getUserAccountCountryCode(alice)).to.equal("1")
            //updates 
            await ProofOfIdentityContract.updateIdentity(alice, "4", 2, 3, 78886932657);
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
        it("The contract: function updateIdentity should alter a previously created identity through mintIdentity by adjusting identity blob struct values for level", async () => {
            expect(await ProofOfIdentityContract.getUserAccountLevel(alice)).to.equal(3)
            //updates account level to 6
            await ProofOfIdentityContract.updateIdentity(alice, 1, 6 , 6, 78886932657);
            //gets new code
            expect(await ProofOfIdentityContract.getUserAccountLevel(alice)).to.equal(6)
        });
        it("The contract: function updateIdentity should alter a previously created identity through mintIdentity by adjusting identity blob struct values for expiry", async () => {
            expect(await ProofOfIdentityContract.getUserAccountExpiry(alice)).to.equal(78886932657)
            //updates  the expiry of the account
            await ProofOfIdentityContract.updateIdentity(alice, 1, 2, 6, 78886932658);
            //gets new expiry
            expect(await ProofOfIdentityContract.getUserAccountExpiry(alice)).to.equal(78886932658);
        });
        it("The proof of identity contracts function updateIdentity should alter a previously created identity through mintIdentity by adjust multiple structs", async () => {
            await ProofOfIdentityContract.mintIdentity(other, 1, 2, 3, 78886932657, "token");
           //calls expiry in struct to ensure formation was done as expected
           expect(await ProofOfIdentityContract.getUserAccountExpiry(alice)).to.equal(78886932657);
           expect(await ProofOfIdentityContract.getUserAccountExpiry(other)).to.equal(78886932657);
           //update other and alices expiry
            await ProofOfIdentityContract.updateIdentity(alice, 1, 2, 6, 78886932658);
            await ProofOfIdentityContract.updateIdentity(other, 1, 2, 6, 78886932658);
            //calls expiry in struct to ensure formation was done as expected
           expect(await ProofOfIdentityContract.getUserAccountExpiry(alice)).to.equal(78886932658);
           expect(await ProofOfIdentityContract.getUserAccountExpiry(other)).to.equal(78886932658);
            
        });
        it("The proof of identity contracts function updateTokenURI should create a token with the custom input as it's URI and edit it if adjusted", async () => {
            //checks that the original tokenURI is tokenURI
            expect(await ProofOfIdentityContract.tokenURI(1)).to.equal("tokenURI");
            //updates the tokenURI
            await ProofOfIdentityContract.updateTokenURI(alice, "Updated");
            //checks that the token URI has updated to the anticpated URI
            expect(await ProofOfIdentityContract.tokenURI(1)).to.equal("Updated");
    });
});
    describe("Testing Function Permissions to ensure Access Control works as expected", function () {
        let ProofOfIdentityContract;
        let owner;
        let alice;
        let other;
        let PROVER_ROLE;
        let FROM;
        let DEFAULT_ADMIN_ROLE;
        let signerAlice;
        beforeEach(async() => {
            const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity")
            const IPermissionsInterface = await ethers.getContractFactory("Dummy")
            const IPermissionsInterfaceDummyInstance = await IPermissionsInterface.deploy();
            ProofOfIdentityContract = await upgrades.deployProxy(ProofOfIdentity, [IPermissionsInterfaceDummyInstance.address], { initializer: 'initialize' });
            //get addresses for this test
            const [owners, alices, others] = await ethers.getSigners();
            owner = await owners.getAddress();
            alice = await alices.getAddress();
            other = await others.getAddress();
            //mints tokenid 1 to alice
            // country code "1" , userType 2 ,level 3, expiry block, tokenURI
            await ProofOfIdentityContract.mintIdentity(alice, "1", 2, 3, 78886932657, "token");
            //getting FROM for accesscontrol errors
            FROM = alice.toLowerCase();
            //getting access control role
            PROVER_ROLE  = await ProofOfIdentityContract.PROVER_ROLE();
            DEFAULT_ADMIN_ROLE = await ProofOfIdentityContract.DEFAULT_ADMIN_ROLE();
            //allows alice to be the signer 
            secondAddressSigner = await ethers.getSigner(alice)
            signerAlice = ProofOfIdentityContract.connect(secondAddressSigner);
        }); 
        it("The proof of identity contract's function mintIdentity should only allow a PROVER_ROLE address to call it", async () => {
            await expectRevert(
                signerAlice.mintIdentity(
                    other,
                    1,
                    2,
                    3,
                    78886932657,
                    "token"
                ),
                `AccessControl: account ${FROM} is missing role ${PROVER_ROLE}`
            );
        });
        it("The proof of identity contract's function updateIdentity should only allow a PROVER_ROLE address to call it", async () => {
              await expectRevert(
                signerAlice.updateIdentity(
                    other,
                    1,
                    2,
                    3,
                    78886932657
                ),
                `AccessControl: account ${FROM} is missing role ${PROVER_ROLE}`
            );
        });
         it("The proof of identity contract should only allow allow admin to grant PROVER_ROLE", async () => {
            await expectRevert(
                ProofOfIdentityContract.grantRole(
                    other, PROVER_ROLE), 
                    `AccessControl: account ${FROM} is missing role ${DEFAULT_ADMIN_ROLE}`
                    );
        });
        it("The proof of identity contract admin should be the contract deployer that address will be able to issue PROVER_ROLES", async () => {
            //ensures owner can grant alice a role
            await ProofOfIdentityContract.grantRole(PROVER_ROLE, alice);
            //tests that alice can use her role
            await signerAlice.updateIdentity(
                    alice,
                    1,
                    2,
                    3,
                    78886932657
                );
        });
      it("The proof of identity contract's function updateTokenURI should only be allowed to be called by a PROVER_ROLE", async () => {
              
        await expectRevert(
            signerAlice.updateTokenURI(
                alice, 
                "Updated"
                ),
                `AccessControl: account ${FROM} is missing role ${PROVER_ROLE}`
            );
            //confirms original value
            expect(await ProofOfIdentityContract.tokenURI(1)).to.equal("tokenURI")

        });
        it("The proof of identity contract's function suspendAccountDeleteTokenAndIdentityBlob should only allow a PROVER_ROLE address to call it", async () => {
            await expectRevert(
                signerAlice.suspendAccountDeleteTokenAndIdentityBlob(
                    alice,
                    0
                ),
                `AccessControl: account ${FROM} is missing role ${PROVER_ROLE}`
            );
        });
        it("The contract: function deleteSingleHolderToken should only allow a PROVER_ROLE address to call it", async () => {
            //calls function and expects revert
            await expectRevert(
                signerAlice.suspendAccountMaintainTokenAndIdentityBlob(
                    alice,
                    "lying"
                ),
                `AccessControl: account ${FROM} is missing role ${PROVER_ROLE}`
            );
        });
        it("The contract: function suspendAccountDeleteTokenAndIdentityBlobshould only allow a PROVER_ROLE address to call it", async () => {
            //only owner has prover role so i anticpate this will reviwer
            await expectRevert(
                signerAlice.suspendAccountMaintainTokenAndIdentityBlob(
                    alice,
                    "lying"
                ),
                `AccessControl: account ${FROM} is missing role ${PROVER_ROLE}`
            );
        });
    });

    describe("Testing contracts that inhert OtherInformation and RoleVerification should view correct values for a set struct of identityBlob", function () {      
        let ProofOfIdentityContract;
        let owner;
        let alice;
        let other;
        let VerifiableIdentity;
        beforeEach(async() => {
            const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity")
            const IPermissionsInterface = await ethers.getContractFactory("Dummy")
            const IPermissionsInterfaceDummyInstance = await IPermissionsInterface.deploy();
            ProofOfIdentityContract = await upgrades.deployProxy(ProofOfIdentity, [IPermissionsInterfaceDummyInstance.address],
                 { initializer: 'initialize' })
                 .then((contract) => contract.deployed())
            //const implAddress = await hre.upgrades.erc1967.getImplementationAddress(ProofOfIdentityContract.address)
            const implAddress = await  getImplementationAddress(ProofOfIdentityContract.address)
            const [owners, alices, others] = await ethers.getSigners();
            owner = await owners.getAddress();
            alice = await alices.getAddress();
            other = await others.getAddress();
            //mints tokenid 1 to alice token 2 to other to test
            // tokenId 1 country code "1" , userType 2 ,level 3, expiry block 78886932657, tokenURI - tokenONE
            await ProofOfIdentityContract.mintIdentity(alice, "1", 2, 3, 78886932657, "tokenONE");
            // tokenId 2 country code "4" , userType 5 ,level 6, expiry block - 78886932789, tokenURI tokenONE
            await ProofOfIdentityContract.mintIdentity(other, "4", 5, 6, 78886932789, "tokenTWO");
            // gets information for deployment
            const VerifiableIdentityFactoryInfo = await ethers.getContractFactory("VerifiableIdentity")
            // deploy verifiable identity with proof of identity added to it to consult
            VerifiableIdentity = await VerifiableIdentityFactoryInfo.deploy(implAddress);       
        }); 
        it("The values for `country code` in a seperate verifiable identity contract should match the values for the original proof of identity", async () => {
            //check that the country code is the same in the original proof of identity
            expect(await ProofOfIdentityContract.getUserAccountCountryCode(alice)).to.equal("1")
            expect(await ProofOfIdentityContract.getUserAccountCountryCode(other)).to.equal("4")
            //check that the country code is the same in the Verifiable Identity
            expect(await VerifiableIdentity.getUserAccountCountryCode(alice)).to.equal("1")
            expect(await await VerifiableIdentity.getUserAccountCountryCode(other)).to.equal("4")
            //checks against each other
            expect(await VerifiableIdentity.getUserAccountCountryCode(alice)).to.equal(await ProofOfIdentityContract.getUserAccountCountryCode(alice))
            expect(await await VerifiableIdentity.getUserAccountCountryCode(other)).to.equal(await ProofOfIdentityContract.getUserAccountCountryCode(other))
    
        });
        it("The values for `user type` in a seperate verifiable identity contract should match the values for the original  proof of identity", async () => {
            //check that the user type is the same in the original proof of identity
            expect(await ProofOfIdentityContract.getUserAccountType(alice)).to.equal(2)
            expect(await ProofOfIdentityContract.getUserAccountType(other)).to.equal(5)
            //check that the user type is the same in the Verifiable Identity
            expect(await VerifiableIdentity.getUserAccountType(alice)).to.equal(2)
            expect(await await VerifiableIdentity.getUserAccountType(other)).to.equal(5)
            //checks against each other
            expect(await VerifiableIdentity.getUserAccountType(alice)).to.equal(await ProofOfIdentityContract.getUserAccountType(alice))
            expect(await await VerifiableIdentity.getUserAccountType(other)).to.equal(await ProofOfIdentityContract.getUserAccountType(other))
        });
        it("The values for `level` in a seperate verifiable identity contract should match the values for the original  proof of identity", async () => {
            //check that the level is the same in the original proof of identity
            expect(await ProofOfIdentityContract.getUserLevel(alice)).to.equal(3)
            expect(await ProofOfIdentityContract.getUserLevel(other)).to.equal(6)
            //check that the level is the same in the Verifiable Identity
            expect(await VerifiableIdentity.getUserLevel(alice)).to.equal(3)
            expect(await await VerifiableIdentity.getUserLevel(other)).to.equal(6)
            //checks against each other
            expect(await VerifiableIdentity.getUserLevel(alice)).to.equal(await ProofOfIdentityContract.getUserLevel(alice))
            expect(await await VerifiableIdentity.getUserLevel(other)).to.equal(await ProofOfIdentityContract.getUserLevel(other))
        });
        it("The contract: values for `expiry` in the test caller contract should match the values for the original contract", async () => {
            //check that the level is the same in the original proof of identity
            expect(await ProofOfIdentityContract.getUserAccountExpiry(alice)).to.equal(78886932657)
            expect(await ProofOfIdentityContract.getUserAccountExpiry(other)).to.equal(78886932789)
            //check that the level is the same in the Verifiable Identity
            expect(await VerifiableIdentity.getUserAccountExpiry(alice)).to.equal(78886932657)
            expect(await await VerifiableIdentity.getUserAccountExpiry(other)).to.equal(78886932789)
            //checks against each other
            expect(await VerifiableIdentity.getUserAccountExpiry(alice)).to.equal(await ProofOfIdentityContract.getUserAccountExpiry(alice))
            expect(await await VerifiableIdentity.getUserAccountExpiry(other)).to.equal(await ProofOfIdentityContract.getUserAccountExpiry(other))
        });

    });
    describe("Testing contracts that ERC721 Overrides Should not Allow Token Movement", function () {      
        let ProofOfIdentityContract;
        let alice;
        beforeEach(async() => {
            //deploys contracts
            const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity")
            const IPermissionsInterface = await ethers.getContractFactory("Dummy")
            const IPermissionsInterfaceDummyInstance = await IPermissionsInterface.deploy();
            ProofOfIdentityContract = await upgrades.deployProxy(ProofOfIdentity, [IPermissionsInterfaceDummyInstance.address], { initializer: 'initialize' });
            //get addresses for this test
            const [owners, alices] = await ethers.getSigners();
            alice = await alices.getAddress();
            // tokenId 1 country code "1" , userType 2 ,level 3, expiry block 78886932657, tokenURI - tokenONE
            await ProofOfIdentityContract.mintIdentity(alice, "1", 2, 3, 78886932657, "tokenONE");
        }); 
        it("The contract: ERC721 Overrides should not Allow safeTransferFrom to move the token", async () => {
              await expectRevert(
                ProofOfIdentityContract.safeTransferFrom(
                    alice,
                    other,
                    1,
                    {
                        from: FROM
                    }
                ),
                "102"
            );
        });
        it("The contract: ERC721 Overrides should not Allow transferFrom to move the token", async () => {
              await expectRevert(
                ProofOfIdentityContract.transferFrom(
                    alice,
                    other,
                    1,
                    {
                        from: FROM
                    }
                ),
                "102"
            );
        });
    });
    describe("Testing the the Verifiable VerifiableIdentityPreventsOnExpiry output and reverts are as expected", function () {      
        let ProofOfIdentityContract;
        let owner;
        let alice;
        let other;
        let VerifiableIdentityPreventsOnExpiry;
        let currentBlockTimestamp;
        beforeEach(async() => {
            const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity")
            const IPermissionsInterface = await ethers.getContractFactory("Dummy")
            const IPermissionsInterfaceDummyInstance = await IPermissionsInterface.deploy();
            ProofOfIdentityContract = await upgrades.deployProxy(ProofOfIdentity, [IPermissionsInterfaceDummyInstance.address], { initializer: 'initialize' });
            //get addresses for this test
            const [owners, alices, others] = await ethers.getSigners();
            owner = await owners.getAddress();
            alice = await alices.getAddress();
            other = await others.getAddress();
            // gets information for deployment
            const VerifiableIdentityPreventsOnExpiryFactoryInfo = await ethers.getContractFactory("VerifiableIdentityPreventsOnExpiry")
            // deploy verifiable identity with proof of identity added to it to consult
            VerifiableIdentityPreventsOnExpiry = await VerifiableIdentityPreventsOnExpiryFactoryInfo.deploy(ProofOfIdentityContract.address);  
            //gets current block
            const currentBlock = await ethers.provider.getBlockNumber();
            currentBlockTimestamp = (await ethers.provider.getBlock(currentBlock)).timestamp; 
            // NOTE: This token is expired (Alices). Others token will return values.
            // TOKEN INFO: tokenId 1 country code "1" , userType 2 ,level 3, expiry block NOW, tokenURI - tokenONE
            await ProofOfIdentityContract.mintIdentity(alice, "1", 2, 3, currentBlockTimestamp, "tokenONE");
            //ensures block.timestamp provided is not expired by adding 5000 seconds
            const notExpiredTimeStamp = currentBlockTimestamp + 5000;
            // TOKEN INFO: tokenId 2 country code "4" , userType 5 ,level 6, expiry block - 78886932789, tokenURI tokenONE
            await ProofOfIdentityContract.mintIdentity(other, "4", 5, 6, notExpiredTimeStamp, "tokenTWO");    
        }); 
        it("After a token is expired the `getUserUserTypePreventExpiry`from the VerifiableIdentityPreventsOnExpiry contract should revert", async () => {
            //time stamp was on mint so this should revert
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
            await delay(7000); 
            //should revert and not return values 7 seconds past
            await expectRevert(
                VerifiableIdentityPreventsOnExpiry.getUserTypeNonExpiry(
                    alice
                ),
                "100"
            );
            
        });
         it("After a token is expired the `getUserLevelPreventExpiry` from the VerifiableIdentityPreventsOnExpiry contract should revert", async () => {
             //time stamp was on mint so this should revert
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
            await delay(7000); 
            //should revert and not return values 7 seconds past
            await expectRevert(
                VerifiableIdentityPreventsOnExpiry.getUserLevelNonExpiry(
                    alice
                ),
                "100"
            );
            
        });
         it("After a token is expired the `getUserCountryCodePreventExpiry` from the VerifiableIdentityPreventsOnExpiry contract should revert", async () => {
            //time stamp was on mint so this should revert
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
            await delay(7000); 
            //should revert and not return values 7 seconds past
            await expectRevert(
                VerifiableIdentityPreventsOnExpiry.getUserCountryCodeNonExpiry(
                    alice
                ),
                "100"
            );
            
        });        
        it("If a token is NOT expired the `getUserUserTypePreventExpiry`from the VerifiableIdentityPreventsOnExpiry contract should provide accurate information", async () => {
            //awaits information from other whos token is not expired for 5000 seconds past the start of the test
            expect(await VerifiableIdentityPreventsOnExpiry.getUserTypeNonExpiry(other)).to.equal("4")
        });
         it("After a token is NOT expired the `getUserLevelPreventExpiry` from the VerifiableIdentityPreventsOnExpiry contract should provide accurate information", async () => {
            //awaits information from other whos token is not expired for 5000 seconds past the start of the test
            expect(await VerifiableIdentityPreventsOnExpiry.getUserLevelNonExpiry(other)).to.equal(5)
        });
         it("After a token is NOT expired the `getUserCountryCodePreventExpiry` from the VerifiableIdentityPreventsOnExpiry contract contract should provide accurate information", async () => {
            // awaits information from other whos token is not expired for 5000 seconds past the start of the test
            expect(await VerifiableIdentityPreventsOnExpiry.getUserCountryCodeNonExpiry(other)).to.equal(6) 
        });
    });
    describe("Testing the User Privilege and Network Removal Functions", function () {
        let ProofOfIdentityContract;
        let alice;
        beforeEach(async() => {
            const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity")
            const IPermissionsInterface = await ethers.getContractFactory("Dummy")
            const IPermissionsInterfaceDummyInstance = await IPermissionsInterface.deploy();
            ProofOfIdentityContract = await upgrades.deployProxy(ProofOfIdentity, [IPermissionsInterfaceDummyInstance.address], { initializer: 'initialize' });
            //get addresses for this test
            const [owners, alices] = await ethers.getSigners();
            alice = await alices.getAddress();
            //mints tokenid 1 to alice
            // country code "1" , userType 2 ,level 3, expiry block, tokenURI
            await ProofOfIdentityContract.mintIdentity(alice, "1", 2, 3, 78886932657, "token");
        }); 
        it("The contract: function suspendAccountDeleteTokenAndIdentityBlob should reverse `mintIdentity` function by removing the `identity blob struct and burning the token.", async () => {
            //deletes both the token and the blob eliminating the codes and 
            await ProofOfIdentityContract.suspendAccountDeleteTokenAndIdentityBlob(alice, 1);
            //should rever at the blob does not exist
            expect(await ProofOfIdentityContract.getCountryCode(alice)).to.be.revertedWith("");
            //should revert token was burned
            await expectRevert(
                ProofOfIdentityContract.ownerOf(
                    0,
                ),
                `VM Exception while processing transaction: revert ERC721: invalid token ID`
            );
        });
        it("The contract: function suspendAccountMaintainTokenAndIdentityBlob should reverse `mintIdentity` by burning the token.", async () => {
            //deletes token
            await ProofOfIdentityContract.suspendAccountMaintainTokenAndIdentityBlob(1, "VALID_REASON");
            //should revert no one owns token 1
            await expectRevert(
                ProofOfIdentityContract.ownerOf(
                    1,
                ),
                `VM Exception while processing transaction: revert ERC721: invalid token ID`
            );
            
        });
    });
    describe("Testing custom errors to ensure functions revert as expected", function () {
        let ProofOfIdentityContract;
        let alice;
        let lessThanCurrentBlockNumber;
        let other;
        beforeEach(async() => {
            const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity")
            const IPermissionsInterface = await ethers.getContractFactory("Dummy")
            const IPermissionsInterfaceDummyInstance = await IPermissionsInterface.deploy();
            ProofOfIdentityContract = await upgrades.deployProxy(ProofOfIdentity, [IPermissionsInterfaceDummyInstance.address], { initializer: 'initialize' });
            //get addresses for this test
            const [owners, alices, others] = await ethers.getSigners();
            // get alices address for this test
            alice = await alices.getAddress();
            other = await others.getAddress();
            //mints tokenid 1 to alice
            // country code "1" , userType 2 ,level 3, expiry block, tokenURI
            await ProofOfIdentityContract.mintIdentity(alice, "1", 2, 3, 78886932657, "token");
            //get current block from ethers
            const currentBlock = await ethers.provider.getBlockNumber();
            // gets current block number to subract from to create one that has already passed regardless of when this test is run
            let currentBlockTimestamp = (await ethers.provider.getBlock(currentBlock)).timestamp; 
            //passed block 
            lessThanCurrentBlockNumber = currentBlockTimestamp - 50;
        }); 
        it("Proof of identity contract `mintIdentity` should stop a wallet that has a token from getting another", async () => {
            await expectRevert(
                ProofOfIdentityContract.mintIdentity(
                    alice,
                    1,
                    2,
                    3,
                    78886932657,
                    "token",
                ),
                `100`
            );
        });
        it("Proof of identity contract mintIdentity should not allow expired tokens to be minted", async () => {
            await expectRevert(
                ProofOfIdentityContract.mintIdentity(
                    other,
                    1,
                    2,
                    3,
                    lessThanCurrentBlockNumber,
                ),
                `103`
            );
        });
        it("Proof of identity contract `updateIdentity` should not allow am account that doesnt have a token to updated the identity blob struct", async () => {
            await expectRevert(
                ProofOfIdentityContract.updateIdentity(
                    other,
                    1,
                    2,
                    3,
                    69824892845665249068024568,
                    "token",
                ),
                `101`
            );
        });
        it("Proof of identity contract `updateTokenURI` should not allow an account's tokenURI to be updated if they dont have an id", async () => {
            await expectRevert(
                ProofOfIdentityContract.updateTokenURI(
                    other,
                    "token",
                ),
                `101`
            );
        });
    });
    describe("Testing custom events to ensure they emit as expected", function () {
        let ProofOfIdentityContract;
        let owner;
        let alice;
        let other;       
        beforeEach(async() => {
            const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity")
            const IPermissionsInterface = await ethers.getContractFactory("Dummy")
            const IPermissionsInterfaceDummyInstance = await IPermissionsInterface.deploy();
            ProofOfIdentityContract = await upgrades.deployProxy(ProofOfIdentity, [IPermissionsInterfaceDummyInstance.address], { initializer: 'initialize' });
            //get addresses for this test
            const [owners, alices, others] = await ethers.getSigners();
            owner = await owners.getAddress();
            alice = await alices.getAddress();
            other = await others.getAddress();
            //mints tokenid 1 to alice
            // country code "1" , userType 2 ,level 3, expiry block, tokenURI
            await ProofOfIdentityContract.mintIdentity(alice, "1", 2, 3, 78886932657, "token");
            //getting FROM for accesscontrol errors
        }); 
        it("AccountSuspendedTokenBurned should emit with the address, tokenId, reason in suspendAccountDeleteTokenAndIdentityBlob", async () => {
            await expect(
                ProofOfIdentityContract.suspendAccountDeleteTokenAndIdentityBlob(
                alice,
                "VALID_REASON"
            ))
            .to.emit(ProofOfIdentityContract, "AccountSuspendedTokenBurned")
            .withArgs(alice, 1, "VALID_REASON");
        });
        it("AccountSuspendedTokenMaintained should emit with the address, reason in suspendAccountMaintainTokenAndIdentityBlob", async () => {
            await expect(ProofOfIdentityContract.suspendAccountMaintainTokenAndIdentityBlob())
            .to.emit(ProofOfIdentityContract, "AccountSuspendedTokenMaintained")
            .withArgs(alice, "VALID_REASON");
        });
        it("IdentityMinted should emit in mintIdentity with an address and tokenId", async () => {
            await expect(ProofOfIdentityContract.mintIdentity(other, "1", 2, 3, 78886932657, "token"))
            .to.emit(ProofOfIdentityContract, "IdentityMinted")
            .withArgs(other, 2);
        });
        it("IdentityUpdated should emit in updateIdentity with the accound and token ID", async () => {
            await expect(ProofOfIdentityContract.updateIdentity(alice, "1", 2, 131, 78886932657))
            .to.emit(ProofOfIdentityContract, "IdentityUpdated")
            .withArgs(alice, 1);
        });
        it("TokenURIUpdated should emit in updateTokenURI with the account and tokenId", async () => {
            await expect(ProofOfIdentityContract.updateTokenURI(alice, "NewURI"))
            .to.emit(ProofOfIdentityContract, "TokenURIUpdated")
            .withArgs(alice, 1, "NewURI");
        });

    });