const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const { expectRevert } = require("@openzeppelin/test-helpers");

describe("Testing the initial values to validate expected contract state", function () {
  let ProofOfIdentityContract;
  beforeEach(async () => {
    const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity");
    const IPermissionsInterface = await ethers.getContractFactory("Dummy");
    const IPermissionsInterfaceDummyInstance =
      await IPermissionsInterface.deploy();
    const [ContractDeployers, alices] = await ethers.getSigners();
    const ContractDeployer = await ContractDeployers.getAddress();
    const alice = await alices.getAddress();
    ProofOfIdentityContract = await upgrades.deployProxy(
      ProofOfIdentity,
      [IPermissionsInterfaceDummyInstance.address, ContractDeployer, alice],
      { initializer: "initialize", kind: "uups" }
    );
  });

  it("The values for name & symbol should be the same as the ones passed in the constructor", async () => {
    expect(await ProofOfIdentityContract.name()).to.equal("Proof of Identity");
    expect(await ProofOfIdentityContract.symbol()).to.equal("H1-ID");
  });
  it("The totalSupply should start at 0.", async () => {
    expect(await ProofOfIdentityContract.totalSupply()).to.equal(0);
  });
});
describe("Testing the issueIdentity function", function () {
  let ProofOfIdentityContract;
  let ContractDeployer;
  let alice;
  let other;
  beforeEach(async () => {
    const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity");
    const IPermissionsInterface = await ethers.getContractFactory("Dummy");
    const IPermissionsInterfaceDummyInstance =
      await IPermissionsInterface.deploy();
    //get addresses for this test
    const [ContractDeployers, alices, others] = await ethers.getSigners();
    ContractDeployer = await ContractDeployers.getAddress();
    alice = await alices.getAddress();
    other = await others.getAddress();
    ProofOfIdentityContract = await upgrades.deployProxy(
      ProofOfIdentity,
      [IPermissionsInterfaceDummyInstance.address, ContractDeployer, ContractDeployer],
      { initializer: "initialize", kind: "uups" }
    );
    //mints tokenid 1 to alice
    // country code "1" , userType 2 ,level 3, expiry block, tokenURI
    await ProofOfIdentityContract.issueIdentity(
      alice,
      "1",
      2,
      3,
      78886932657,
      "tokenURI"
    );
  });
  it("The ProofOfIdentity contract's function issueIdentity should mint a token to the address it is requested to", async () => {
    //checks that alice owns token one
    expect(await ProofOfIdentityContract.ownerOf(1)).to.equal(alice);
  });
  it("The ProofOfIdentity contract's function issueIdentity should create an identity blob struct with correct values for country code", async () => {
    //checks that the country code is "1" as expected
    expect(
      await ProofOfIdentityContract.getUserAccountCountryCode(alice)
    ).to.equal("1");
  });
  it("The ProofOfIdentity contract's function issueIdentity should create an identity blob struct with correct values for userType", async () => {
    expect(await ProofOfIdentityContract.getUserAccountType(alice)).to.equal(2);
  });
  it("The ProofOfIdentity contract's functionissueIdentity should create an identity blob struct with correct values for level", async () => {
    expect(await ProofOfIdentityContract.getUserAccountLevel(alice)).to.equal(
      3
    );
  });
  it("The ProofOfIdentity contract's function issueIdentity should create an identity blob struct with correct values for expiry", async () => {
    expect(await ProofOfIdentityContract.getUserAccountExpiry(alice)).to.equal(
      78886932657
    );
  });
  it("The ProofOfIdentity contract's function issueIdentity should create multiple structs and mint multiple tokens", async () => {
    await ProofOfIdentityContract.issueIdentity(
      other,
      "1",
      2,
      3,
      78886932625,
      "tokenURI"
    );
    //calls expiry in struct to ensure formation
    expect(await ProofOfIdentityContract.getUserAccountExpiry(alice)).to.equal(
      78886932657
    );
    expect(await ProofOfIdentityContract.getUserAccountExpiry(other)).to.equal(
      78886932625
    );
    //call erc721 owner of to ensure tokens were placed
    expect(await ProofOfIdentityContract.ownerOf(1)).to.equal(alice);
    expect(await ProofOfIdentityContract.ownerOf(2)).to.equal(other);
  });
  it("The ProofOfIdentity contract's function issueIdentity should create a token with the custom input as it's URI", async () => {
    expect(await ProofOfIdentityContract.tokenURI(1)).to.equal("tokenURI");
  });
  it("The ProofOfIdentity contract's function issueIdentity should give an error 101 if the tokenId doesnt exist", async () => {
    await expectRevert(ProofOfIdentityContract.tokenURI(1444), "101");
  });
});
describe("Testing updateIdentity", function () {
  let ProofOfIdentityContract;
  let alice;
  let other;
  beforeEach(async () => {
    const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity");
    const IPermissionsInterface = await ethers.getContractFactory("Dummy");
    const IPermissionsInterfaceDummyInstance =
      await IPermissionsInterface.deploy();
    //get addresses for this test
    const [ContractDeployers, alices, others] = await ethers.getSigners();
    const ContractDeployer = await ContractDeployers.getAddress();
    alice = await alices.getAddress();
    other = await others.getAddress();
    ProofOfIdentityContract = await upgrades.deployProxy(
      ProofOfIdentity,
      [IPermissionsInterfaceDummyInstance.address, ContractDeployer, ContractDeployer],
      { initializer: "initialize", kind: "uups" }
    );
    //mints tokenid 1 to alice
    // country code "1" , userType 2 ,level 3, expiry block, tokenURI
    await ProofOfIdentityContract.issueIdentity(
      alice,
      "1",
      2,
      3,
      78886932657,
      "tokenURI"
    );
  });
  it("updateIdentity should alter a previously created identity's country code", async () => {
    //confirms original country code
    expect(
      await ProofOfIdentityContract.getUserAccountCountryCode(alice)
    ).to.equal("1");
    //updates
    await ProofOfIdentityContract.updateIdentity(
      alice,
      "4",
      2,
      3,
      78886932657,
      "hi"
    );
    //gets new code
    expect(
      await ProofOfIdentityContract.getUserAccountCountryCode(alice)
    ).to.equal("4");
  });
  it("updateIdentity should alter a previously created identity's account type", async () => {
    //checks original user type
    expect(await ProofOfIdentityContract.getUserAccountType(alice)).to.equal(2);
    //updates
    await ProofOfIdentityContract.updateIdentity(
      alice,
      1,
      5,
      3,
      78886932657,
      "hi"
    );
    //gets new code
    expect(await ProofOfIdentityContract.getUserAccountType(alice)).to.equal(5);
  });
  it("updateIdentity should alter a previously created identity's account level", async () => {
    expect(await ProofOfIdentityContract.getUserAccountLevel(alice)).to.equal(
      3
    );
    //updates account level to 6
    await ProofOfIdentityContract.updateIdentity(
      alice,
      1,
      6,
      6,
      78886932657,
      "hi"
    );
    //gets new code
    expect(await ProofOfIdentityContract.getUserAccountLevel(alice)).to.equal(
      6
    );
  });
  it("updateIdentity should alter a previously created identity's expiry date", async () => {
    expect(await ProofOfIdentityContract.getUserAccountExpiry(alice)).to.equal(
      78886932657
    );
    //updates  the expiry of the account
    await ProofOfIdentityContract.updateIdentity(
      alice,
      1,
      2,
      6,
      78886932658,
      "hi"
    );
    //gets new expiry
    expect(await ProofOfIdentityContract.getUserAccountExpiry(alice)).to.equal(
      78886932658
    );
  });
  it("updateIdentity should alter a previously created identities enitre struct", async () => {
    await ProofOfIdentityContract.issueIdentity(
      other,
      1,
      2,
      3,
      78886932657,
      "token"
    );
    //calls expiry in struct to ensure formation was done as expected
    expect(await ProofOfIdentityContract.getUserAccountExpiry(alice)).to.equal(
      78886932657
    );
    expect(await ProofOfIdentityContract.getUserAccountExpiry(other)).to.equal(
      78886932657
    );
    //update other and alices expiry
    await ProofOfIdentityContract.updateIdentity(
      alice,
      1,
      2,
      6,
      78886932658,
      "hi"
    );
    await ProofOfIdentityContract.updateIdentity(
      other,
      1,
      2,
      6,
      78886932658,
      "hi"
    );
    //calls expiry in struct to ensure formation was done as expected
    expect(await ProofOfIdentityContract.getUserAccountExpiry(alice)).to.equal(
      78886932658
    );
    expect(await ProofOfIdentityContract.getUserAccountExpiry(other)).to.equal(
      78886932658
    );
  });
  it("updateTokenURI should create a token with the custom input as it's URI and edit it if adjusted", async () => {
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
  let ContractDeployer;
  let alice;
  let other;
  let OPERATOR_ROLE;
  let FROM;
  let DEFAULT_ADMIN_ROLE;
  let signerAlice;
  let ProofOfIdentityFactory;
  let IPermissionsInterfaceDummyInstance;
  let FromContractDeployer;
  beforeEach(async () => {
    ProofOfIdentityFactory = await ethers.getContractFactory("ProofOfIdentity");
    const IPermissionsInterface = await ethers.getContractFactory("Dummy");
    IPermissionsInterfaceDummyInstance = await IPermissionsInterface.deploy();
    //get addresses for this test
    const [ContractDeployers, alices, others] = await ethers.getSigners();
    ContractDeployer = await ContractDeployers.getAddress();
    alice = await alices.getAddress();
    other = await others.getAddress();
    FromContractDeployer = ContractDeployer.toLowerCase();
    ProofOfIdentityContract = await upgrades.deployProxy(
      ProofOfIdentityFactory,
      [IPermissionsInterfaceDummyInstance.address, ContractDeployer, ContractDeployer],
      { initializer: "initialize", kind: "uups" }
    );
    //mints tokenid 1 to alice
    // country code "1" , userType 2 ,level 3, expiry block, tokenURI
    await ProofOfIdentityContract.issueIdentity(
      alice,
      "1",
      2,
      3,
      78886932657,
      "token"
    );
    //getting FROM for accesscontrol errors
    FROM = alice.toLowerCase();
    //getting access control role
    OPERATOR_ROLE = await ProofOfIdentityContract.OPERATOR_ROLE();
    DEFAULT_ADMIN_ROLE = await ProofOfIdentityContract.DEFAULT_ADMIN_ROLE();
    //allows alice to be the signer
    secondAddressSigner = await ethers.getSigner(alice);
    signerAlice = ProofOfIdentityContract.connect(secondAddressSigner);
  });
  it("initalize should only be called upon deployment", async () => {
    await expectRevert(
      ProofOfIdentityContract.initialize(
        IPermissionsInterfaceDummyInstance.address,
        other,
        other
      ),
      "Initializable: contract is already initialized"
    );
  });
  it("upgrades should only be allowed to be called by DEFAULT_ADMIN_ROLE", async function () {
    const ProofOfIdentityHasADifferentUpgrader = await upgrades.deployProxy(
      ProofOfIdentityFactory,
      [IPermissionsInterfaceDummyInstance.address, alice, alice],
      { initializer: "initialize", kind: "uups" }
    );
    await expectRevert(
      upgrades.upgradeProxy(
        ProofOfIdentityHasADifferentUpgrader.address,
        ProofOfIdentityFactory,
        {
          kind: "uups",
        }
      ),
      `AccessControl: account ${FromContractDeployer} is missing role ${DEFAULT_ADMIN_ROLE}`
    );
    const ProofOfIdentityContractV2 = await upgrades.upgradeProxy(
      ProofOfIdentityContract.address,
      ProofOfIdentityFactory,
      {
        kind: "uups",
      }
    );
  });
  //suspendAccountMaintainTokenAndIdentityBlob
  it("The proof of identity contract's function suspendAccountMaintainTokenAndIdentityBlob should only allow a OPERATOR_ROLE address to call it", async () => {
    await expectRevert(
      signerAlice.suspendAccountMaintainTokenAndIdentityBlob(other, "hi"),
      `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
    );
  });
  it("The proof of identity contract's function updateIdentity should only allow a OPERATOR_ROLE address to call it", async () => {
    await expectRevert(
      signerAlice.updateIdentity(other, 1, 2, 3, 78886932657, "hi"),
      `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
    );
  });
  it("The proof of identity contract's function issueIdentity should only allow a OPERATOR_ROLE address to call it", async () => {
    await expectRevert(
      signerAlice.issueIdentity(other, 1, 2, 3, 78886932657, "hi"),
      `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
    );
  });
  it("The proof of identity contract should only allow allow networkAdmin to grant OPERATOR_ROLE", async () => {
    await expectRevert(
      signerAlice.grantRole(OPERATOR_ROLE, other),
      `AccessControl: account ${FROM} is missing role ${DEFAULT_ADMIN_ROLE}`
    );
  });
  it("The proof of identity contract networkAdmin should be able to issue OPERATOR_ROLES", async () => {
    //ensures ContractDeployer can grant alice a role
    await ProofOfIdentityContract.grantRole(OPERATOR_ROLE, alice);
    //tests that alice can use her role
    await signerAlice.updateIdentity(alice, 1, 2, 3, 78886932657, "hi");
  });
  it("The proof of identity contract's function updateTokenURI should only be allowed to be called by a OPERATOR_ROLE", async () => {
    await expectRevert(
      signerAlice.updateTokenURI(alice, "Updated"),
      `AccessControl: account ${FROM} is missing role ${OPERATOR_ROLE}`
    );
    //confirms original value
    expect(await ProofOfIdentityContract.tokenURI(1)).to.equal("token");
  });
  it("Proof of Identity Contract: The contract deployer by default should not have the DEFAULT_ADMIN_ROLE", async () => {
    const ProofOfIdentityContractAddress2AsAdmin = await upgrades.deployProxy(
      ProofOfIdentityFactory,
      [IPermissionsInterfaceDummyInstance.address, alice, alice],
    { initializer: "initialize", kind: "uups" }
    );
    await expectRevert(ProofOfIdentityContractAddress2AsAdmin.grantRole(OPERATOR_ROLE, alice), 
    `AccessControl: account ${FromContractDeployer} is missing role ${DEFAULT_ADMIN_ROLE}`);
});
});
describe("Testing contracts that inhert OtherInformation and RoleVerification should view correct values for a set struct of identityBlob", function () {
  let ProofOfIdentityContract;
  let ContractDeployer;
  let alice;
  let other;
  let VerifiableIdentity;
  beforeEach(async () => {
    const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity");
    const IPermissionsInterface = await ethers.getContractFactory("Dummy");
    const IPermissionsInterfaceDummyInstance =
      await IPermissionsInterface.deploy();
    const [ContractDeployers, alices, others] = await ethers.getSigners();
    ContractDeployer = await ContractDeployers.getAddress();
    alice = await alices.getAddress();
    other = await others.getAddress();
    ProofOfIdentityContract = await upgrades.deployProxy(
      ProofOfIdentity,
      [IPermissionsInterfaceDummyInstance.address, ContractDeployer, ContractDeployer],
      { initializer: "initialize", kind: "uups" }
    );
    //mints tokenid 1 to alice token 2 to other to test
    // tokenId 1 country code "1" , userType 2 ,level 3, expiry block 78886932657, tokenURI - tokenONE
    await ProofOfIdentityContract.issueIdentity(
      alice,
      "1",
      2,
      3,
      78886932657,
      "tokenONE"
    );
    // tokenId 2 country code "4" , userType 5 ,level 6, expiry block - 78886932789, tokenURI tokenONE
    await ProofOfIdentityContract.issueIdentity(
      other,
      "4",
      5,
      6,
      78886932789,
      "tokenTWO"
    );
    // gets information for deployment
    const VerifiableIdentityFactoryInfo = await ethers.getContractFactory(
      "VerifiableIdentity"
    );
    // deploy verifiable identity with proof of identity added to it to consult
    VerifiableIdentity = await VerifiableIdentityFactoryInfo.deploy(
      ProofOfIdentityContract.address
    );
  });
  it("The values for `country code` in a seperate verifiable identity contract should match the values for the original proof of identity", async () => {
    //check that the country code is the same in the original proof of identity
    expect(
      await ProofOfIdentityContract.getUserAccountCountryCode(alice)
    ).to.equal("1");
    expect(await VerifiableIdentity.getUserCountryCode(other)).to.equal("4");
    //check that the country code is the same in the Verifiable Identity
    expect(
      await ProofOfIdentityContract.getUserAccountCountryCode(alice)
    ).to.equal("1");
    expect(await VerifiableIdentity.getUserCountryCode(other)).to.equal("4");
    //checks against each other
    expect(await VerifiableIdentity.getUserCountryCode(alice)).to.equal(
      await ProofOfIdentityContract.getUserAccountCountryCode(alice)
    );
    expect(await VerifiableIdentity.getUserCountryCode(other)).to.equal(
      await ProofOfIdentityContract.getUserAccountCountryCode(other)
    );
  });
  it("The identity blobs in the Proof Of IdentityContract and Verifiable Identity should be the same", async () => {
    expect(
      await ProofOfIdentityContract.getUserAccountIdentityBlob(alice)
    ).to.deep.equal(await VerifiableIdentity.getUserIdentityData(alice));
  });
  it("The values for `user type` in a seperate verifiable identity contract should match the values for the original  proof of identity", async () => {
    //check that the user type is the same in the original proof of identity
    expect(await ProofOfIdentityContract.getUserAccountType(alice)).to.equal(2);
    expect(await ProofOfIdentityContract.getUserAccountType(other)).to.equal(5);
    //check that the user type is the same in the Verifiable Identity
    expect(await VerifiableIdentity.getUserType(alice)).to.equal(2);
    expect(await VerifiableIdentity.getUserType(other)).to.equal(5);
    //checks against each other
    expect(await VerifiableIdentity.getUserType(alice)).to.equal(
      await ProofOfIdentityContract.getUserAccountType(alice)
    );
    expect(await VerifiableIdentity.getUserType(other)).to.equal(
      await ProofOfIdentityContract.getUserAccountType(other)
    );
  });
  it("The values for `level` in a seperate verifiable identity contract should match the values for the original  proof of identity", async () => {
    //check that the level is the same in the original proof of identity
    expect(await ProofOfIdentityContract.getUserAccountLevel(alice)).to.equal(
      3
    );
    expect(await ProofOfIdentityContract.getUserAccountLevel(other)).to.equal(
      6
    );
    //check that the level is the same in the Verifiable Identity
    expect(await VerifiableIdentity.getUserLevel(alice)).to.equal(3);
    expect(await await VerifiableIdentity.getUserLevel(other)).to.equal(6);
    //checks against each other
    expect(await VerifiableIdentity.getUserLevel(alice)).to.equal(
      await ProofOfIdentityContract.getUserAccountLevel(alice)
    );
    expect(await VerifiableIdentity.getUserLevel(other)).to.equal(
      await ProofOfIdentityContract.getUserAccountLevel(other)
    );
  });
  it("The contract: values for `expiry` in the test caller contract should match the values for the original contract", async () => {
    //check that the level is the same in the original proof of identity
    expect(await ProofOfIdentityContract.getUserAccountExpiry(alice)).to.equal(
      78886932657
    );
    expect(await ProofOfIdentityContract.getUserAccountExpiry(other)).to.equal(
      78886932789
    );
    //check that the level is the same in the Verifiable Identity
    expect(await VerifiableIdentity.getUserExpiry(alice)).to.equal(78886932657);
    expect(await await VerifiableIdentity.getUserExpiry(other)).to.equal(
      78886932789
    );
    //checks against each other
    expect(await VerifiableIdentity.getUserExpiry(alice)).to.equal(
      await ProofOfIdentityContract.getUserAccountExpiry(alice)
    );
    expect(await VerifiableIdentity.getUserExpiry(other)).to.equal(
      await ProofOfIdentityContract.getUserAccountExpiry(other)
    );
  });
  it("getUserAccountIdentityBlob should return the proper values", async () => {
    const levelBlob = await ProofOfIdentityContract.getUserAccountIdentityBlob(
      alice
    );
    expect(levelBlob.level).to.equal(3);
  });
  it("The identity blobs in the Proof Of IdentityContract and Verifiable Identity Prevents on Expirey should be the same", async () => {
    expect(
      await ProofOfIdentityContract.getUserAccountIdentityBlob(alice)
    ).to.deep.equal(await VerifiableIdentity.getUserIdentityData(alice));
  });
});
describe("Testing contracts that ERC721 Overrides Should not Allow Token Movement", function () {
  let ProofOfIdentityContract;
  let alice;
  let other;
  // let signerAlice;
  beforeEach(async () => {
    const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity");
    const IPermissionsInterface = await ethers.getContractFactory("Dummy");
    const IPermissionsInterfaceDummyInstance =
      await IPermissionsInterface.deploy();
    const [ContractDeployers, alices, others] = await ethers.getSigners();
    ContractDeployer = await ContractDeployers.getAddress();
    alice = await alices.getAddress();
    other = await others.getAddress();
    ProofOfIdentityContract = await upgrades.deployProxy(
      ProofOfIdentity,
      [IPermissionsInterfaceDummyInstance.address, ContractDeployer, ContractDeployer],
      { initializer: "initialize", kind: "uups" }
    );
    //allows alice to be the signer
    const secondAddressSigner = await ethers.getSigner(alice);
    signerAlice = ProofOfIdentityContract.connect(secondAddressSigner);
    // tokenId 1 country code "1" , userType 2 ,level 3, expiry block 78886932657, tokenURI - tokenONE
    await ProofOfIdentityContract.issueIdentity(
      alice,
      "1",
      2,
      3,
      78886932657,
      "tokenONE"
    );
  });
  it("The contract: ERC721 Overrides should not Allow transferFrom to move the token", async () => {
    await expectRevert(
      ProofOfIdentityContract.transferFrom(alice, other, 1),
      "102"
    );
  });
  it("SupportsInterface", async () => {
    expect(
      await ProofOfIdentityContract.supportsInterface("0x12345678")
    ).to.equal(false);
  });
});
describe("Testing the the Verifiable VerifiableIdentityPreventsOnExpiry output and reverts are as expected", function () {
  let ProofOfIdentityContract;
  let ContractDeployer;
  let alice;
  let other;
  let VerifiableIdentityPreventsOnExpiry;
  let timestamp;
  beforeEach(async () => {
    const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity");
    const IPermissionsInterface = await ethers.getContractFactory("Dummy");
    const IPermissionsInterfaceDummyInstance =
      await IPermissionsInterface.deploy();
    //get addresses for this test
    const [ContractDeployers, alices, others] = await ethers.getSigners();
    ContractDeployer = await ContractDeployers.getAddress();
    alice = await alices.getAddress();
    other = await others.getAddress();
    ProofOfIdentityContract = await upgrades.deployProxy(
      ProofOfIdentity,
      [IPermissionsInterfaceDummyInstance.address, ContractDeployer, ContractDeployer],
      { initializer: "initialize", kind: "uups" }
    );
    // gets information for deployment
    const VerifiableIdentityPreventsOnExpiryFactoryInfo =
      await ethers.getContractFactory("VerifiableIdentityPreventsOnExpiry");
    // deploy verifiable identity with proof of identity added to it to consult
    VerifiableIdentityPreventsOnExpiry =
      await VerifiableIdentityPreventsOnExpiryFactoryInfo.deploy(
        ProofOfIdentityContract.address
      );
    timestamp = await time.latest();
  });
  it("After a token is expired the `getUserTypePreventOnExpiry`from the VerifiableIdentityPreventsOnExpiry contract should revert", async () => {
    const set = timestamp + 5;
    // TOKEN INFO: tokenId 1 country code "1" , userType 2 ,level 3, expiry block NOW, tokenURI - tokenONE
    await ProofOfIdentityContract.issueIdentity(
      alice,
      "1",
      2,
      3,
      set,
      "tokenONE"
    );
    //time stamp was on mint so this should revert
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(10000);
    //should revert and not return values 7 seconds past
    await expectRevert(
      VerifiableIdentityPreventsOnExpiry.getUserAccountTypePreventOnExpiry(
        alice
      ),
      "103"
    );
  });
  //
  it("Verifiable Identity Prevents on Expiry getUserExpiry should get the expiry or revert if expired", async () => {
    const set = timestamp + 5;
    await ProofOfIdentityContract.issueIdentity(
      alice,
      "1",
      2,
      3,
      set,
      "tokenONE"
    );
    expect(
      await VerifiableIdentityPreventsOnExpiry.getUserExpiry(alice)
    ).to.equal(set);
  });
  it("The identity blobs in the Proof Of IdentityContract and Verifiable Identity Prevents on Expirey should be the same", async () => {
    const set = timestamp + 5;
    await ProofOfIdentityContract.issueIdentity(
      alice,
      "1",
      2,
      3,
      set,
      "tokenONE"
    );
    expect(
      await ProofOfIdentityContract.getUserAccountIdentityBlob(alice)
    ).to.deep.equal(
      await VerifiableIdentityPreventsOnExpiry.getUserIdentityData(alice)
    );
  });
  it("After a token is expired the `getUserAccountLevelPreventOnExpiry` from the VerifiableIdentityPreventsOnExpiry contract should revert", async () => {
    // current plus 5
    const set = timestamp + 5;
    // TOKEN INFO: tokenId 1 country code "1" , userType 2 ,level 3, expiry block NOW, tokenURI - tokenONE
    await ProofOfIdentityContract.issueIdentity(
      alice,
      "1",
      2,
      3,
      set,
      "tokenONE"
    );
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(7000);
    //should revert and not return values 7 seconds past
    await expectRevert(
      VerifiableIdentityPreventsOnExpiry.getUserAccountLevelPreventOnExpiry(
        alice
      ),
      "103"
    );
  });
  it("After a token is expired the `getUserAccountCountryCodePreventOnExpiry` from the VerifiableIdentityPreventsOnExpiry contract should revert", async () => {
    // current plus 5
    const set = timestamp + 5;
    // TOKEN INFO: tokenId 1 country code "1" , userType 2 ,level 3, expiry block NOW, tokenURI - tokenONE
    await ProofOfIdentityContract.issueIdentity(
      alice,
      "1",
      2,
      3,
      set,
      "tokenONE"
    );
    //time stamp was on mint so this should revert
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(7000);
    //should revert and not return values 7 seconds past
    await expectRevert(
      VerifiableIdentityPreventsOnExpiry.getUserAccountCountryCodePreventOnExpiry(
        alice
      ),
      "103"
    );
  });
  it("If a token is NOT expired the `getUserAccountTypePreventExpiry`from the VerifiableIdentityPreventsOnExpiry contract should provide accurate information", async () => {
    // ensures block.timestamp provided is not expired by adding 5000 seconds
    const notExpiredTimeStamp = timestamp + 50000000;
    // TOKEN INFO: tokenId 2 country code "4" , userType 5 ,level 6, expiry block - 78886932789, tokenURI tokenONE
    await ProofOfIdentityContract.issueIdentity(
      other,
      "4",
      5,
      6,
      notExpiredTimeStamp,
      "tokenTWO"
    );
    //awaits information from other whos token is not expired for 5000 seconds past the start of the test
    expect(
      await VerifiableIdentityPreventsOnExpiry.getUserTypePreventOnExpiry(other)
    ).to.equal(5);
  });
  it("After a token is NOT expired the `getUserLevelPreventExpiry` from the VerifiableIdentityPreventsOnExpiry contract should provide accurate information", async () => {
    // ensures block.timestamp provided is not expired by adding 5000 seconds
    const notExpiredTimeStamp = timestamp + 500000;
    // TOKEN INFO: tokenId 2 country code "4" , userType 5 ,level 6, expiry block - 78886932789, tokenURI tokenONE
    await ProofOfIdentityContract.issueIdentity(
      other,
      "4",
      5,
      6,
      notExpiredTimeStamp,
      "tokenTWO"
    );
    //awaits information from other whos token is not expired for 5000 seconds past the start of the test
    expect(
      await VerifiableIdentityPreventsOnExpiry.getUserLevelPreventOnExpiry(
        other
      )
    ).to.equal(6);
  });
  it("After a token is NOT expired the `getUserCountryCodePreventExpiry` from the VerifiableIdentityPreventsOnExpiry contract contract should provide accurate information", async () => {
    //ensures block.timestamp provided is not expired by adding 5000 seconds
    const notExpiredTimeStamp = timestamp + 500000;
    // TOKEN INFO: tokenId 2 country code "4" , userType 5 ,level 6, expiry block - 78886932789, tokenURI tokenONE
    await ProofOfIdentityContract.issueIdentity(
      other,
      "4",
      5,
      6,
      notExpiredTimeStamp,
      "tokenTWO"
    );
    // awaits information from other whos token is not expired for 5000 seconds past the start of the test
    expect(
      await VerifiableIdentityPreventsOnExpiry.getUserCountryCodePreventOnExpiry(
        other
      )
    ).to.equal("4");
  });
});
describe("Testing the User Privilege and Network Removal Functions", function () {
  let ProofOfIdentityContract;
  let alice;
  beforeEach(async () => {
    const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity");
    const IPermissionsInterface = await ethers.getContractFactory("Dummy");
    const IPermissionsInterfaceDummyInstance =
      await IPermissionsInterface.deploy();
    //get addresses for this test
    const [ContractDeployers, alices] = await ethers.getSigners();
    const ContractDeployer = await ContractDeployers.getAddress();
    alice = await alices.getAddress();
    ProofOfIdentityContract = await upgrades.deployProxy(
      ProofOfIdentity,
      [IPermissionsInterfaceDummyInstance.address, ContractDeployer, ContractDeployer],
      { initializer: "initialize", kind: "uups" }
    );
    //mints tokenid 1 to alice
    // country code "1" , userType 2 ,level 3, expiry block, tokenURI
    await ProofOfIdentityContract.issueIdentity(
      alice,
      "1",
      2,
      3,
      78886932657,
      "token"
    );
  });
  // it("The contract: function suspendAccountDeleteTokenAndIdentityBlob should reverse `issueIdentity` function by removing the `identity blob struct and burning the token.", async () => {
  //   //deletes both the token and the blob eliminating the codes and
  //   await ProofOfIdentityContract.suspendAccountDeleteTokenAndIdentityBlob(
  //     alice,
  //     "VALID_REASON"
  //   );
  //   //should rever at the blob does not exist
  //   // expect(await ProofOfIdentityContract.getUserAccountCountryCode(alice)).to.be.revertedWith("");
  //   expectRevert(
  //     await ProofOfIdentityContract.getUserAccountCountryCode(alice),
  //     ""
  //   );
  //   //should revert token was burned
  //   await expectRevert(
  //     ProofOfIdentityContract.ContractDeployerOf(0),
  //     `ERC721: invalid token ID`
  //   );
  // });
});
describe("Testing custom errors to ensure functions revert as expected", function () {
  let ProofOfIdentityContract;
  let alice;
  let lessThanCurrentBlockNumber;
  let greaterThanCurrentBlockNumber;
  let other;
  beforeEach(async () => {
    const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity");
    const IPermissionsInterface = await ethers.getContractFactory("Dummy");
    const IPermissionsInterfaceDummyInstance =
      await IPermissionsInterface.deploy();
    //get addresses for this test
    const [ContractDeployers, alices, others] = await ethers.getSigners();
    const ContractDeployer = await ContractDeployers.getAddress();
    alice = await alices.getAddress();
    other = await others.getAddress();
    ProofOfIdentityContract = await upgrades.deployProxy(
      ProofOfIdentity,
      [IPermissionsInterfaceDummyInstance.address, ContractDeployer, ContractDeployer],
      { initializer: "initialize", kind: "uups" }
    );
    //mints tokenid 1 to alice
    // country code "1" , userType 2 ,level 3, expiry block, tokenURI
    await ProofOfIdentityContract.issueIdentity(
      alice,
      "1",
      2,
      3,
      78886932657,
      "token"
    );
    //get current block from ethers
    const currentBlock = await ethers.provider.getBlockNumber();
    // gets current block number to subract from to create one that has already passed regardless of when this test is run
    let currentBlockTimestamp = (await ethers.provider.getBlock(currentBlock))
      .timestamp;

    //passed block
    lessThanCurrentBlockNumber = currentBlockTimestamp - 50;
    greaterThanCurrentBlockNumber = currentBlockTimestamp + 50;
  });
  it("Proof of identity contract `issueIdentity` should stop a wallet that has a token from getting another", async () => {
    await expectRevert(
      ProofOfIdentityContract.issueIdentity(
        alice,
        1,
        2,
        3,
        78886932657,
        "token"
      ),
      `100`
    );
  });
  it("Proof of identity contract issueIdentity should not allow expired tokens to be minted", async () => {
    await expectRevert(
      ProofOfIdentityContract.issueIdentity(
        other,
        1,
        2,
        3,
        lessThanCurrentBlockNumber,
        "token"
      ),
      `103`
    );
  });
  it("Proof of identity contract `updateIdentity` should not allow an account that doesnt have a token to updated the identity blob struct", async () => {
    await expectRevert(
      ProofOfIdentityContract.updateIdentity(
        other,
        1,
        2,
        3,
        greaterThanCurrentBlockNumber,
        "hi"
      ),
      `101`
    );
  });
  it("Proof of identity contract `updateTokenURI` should not allow an account's tokenURI to be updated if they dont have an id", async () => {
    await expectRevert(
      ProofOfIdentityContract.updateTokenURI(other, "token"),
      `101`
    );
  });
});
describe("Testing custom events to ensure they emit as expected", function () {
  let ProofOfIdentityContract;
  let ContractDeployer;
  let alice;
  let other;
  beforeEach(async () => {
    const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity");
    const IPermissionsInterface = await ethers.getContractFactory("Dummy");
    const IPermissionsInterfaceDummyInstance =
      await IPermissionsInterface.deploy();
    //get addresses for this test
    const [ContractDeployers, alices, others] = await ethers.getSigners();
    ContractDeployer = await ContractDeployers.getAddress();
    alice = await alices.getAddress();
    other = await others.getAddress();
    ProofOfIdentityContract = await upgrades.deployProxy(
      ProofOfIdentity,
      [IPermissionsInterfaceDummyInstance.address, ContractDeployer, ContractDeployer],
      { initializer: "initialize", kind: "uups" }
    );
    //mints tokenid 1 to alice
    // country code "1" , userType 2 ,level 3, expiry block, tokenURI
    await ProofOfIdentityContract.issueIdentity(
      alice,
      "1",
      2,
      3,
      78886932657,
      "token"
    );
  });
  it("AccountSuspendedTokenMaintained should emit with the address, reason in suspendAccountMaintainTokenAndIdentityBlob", async () => {
    await expect(
      ProofOfIdentityContract.suspendAccountMaintainTokenAndIdentityBlob(
        alice,
        "VALID_REASON"
      )
    )
      .to.emit(ProofOfIdentityContract, "AccountSuspendedTokenMaintained")
      .withArgs(alice, "VALID_REASON");
  });
  it("IdentityUpdated should emit in issueIdentity with an address and tokenId", async () => {
    await expect(
      ProofOfIdentityContract.issueIdentity(
        other,
        "1",
        2,
        3,
        78886932657,
        "token"
      )
    )
      .to.emit(ProofOfIdentityContract, "IdentityIssued")
      .withArgs(other, 2);
  });
  it("IdentityUpdated should emit in updateIdentity with the accound and token ID", async () => {
    await expect(
      ProofOfIdentityContract.updateIdentity(
        alice,
        "1",
        2,
        131,
        78886932657,
        "hi"
      )
    )
      .to.emit(ProofOfIdentityContract, "IdentityUpdated")
      .withArgs(alice, 1);
  });
  it("TokenURIUpdated should emit in updateTokenURI with the account and tokenId", async () => {
    await expect(ProofOfIdentityContract.updateTokenURI(alice, "NewURI"))
      .to.emit(ProofOfIdentityContract, "TokenURIUpdated")
      .withArgs(alice, 1, "NewURI");
  });
});

describe("Testing contracts that ERC721 Overrides Should not Allow Token Movement", function () {
  let ProofOfIdentityContract;
  let alice;
  let other;
  // let signerAlice;
  beforeEach(async () => {
    const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity");
    const IPermissionsInterface = await ethers.getContractFactory("Dummy");
    const IPermissionsInterfaceDummyInstance =
      await IPermissionsInterface.deploy();
    const [ContractDeployers, alices, others] = await ethers.getSigners();
    ContractDeployer = await ContractDeployers.getAddress();
    alice = await alices.getAddress();
    other = await others.getAddress();
    ProofOfIdentityContract = await upgrades.deployProxy(
      ProofOfIdentity,
      [IPermissionsInterfaceDummyInstance.address, ContractDeployer, ContractDeployer],
      { initializer: "initialize", kind: "uups" }
    );
    //allows alice to be the signer
    const secondAddressSigner = await ethers.getSigner(alice);
    signerAlice = ProofOfIdentityContract.connect(secondAddressSigner);
    // tokenId 1 country code "1" , userType 2 ,level 3, expiry block 78886932657, tokenURI - tokenONE
    await ProofOfIdentityContract.issueIdentity(
      alice,
      "1",
      2,
      3,
      78886932657,
      "tokenONE"
    );
  });
  it("The contract: ERC721 Overrides should not Allow safeTransferFrom to move the token", async () => {
    await expectRevert(
      ProofOfIdentityContract["safeTransferFrom(address,address,uint256)"](
        other,
        alice,
        1
      ),
      "102"
    );
    await ProofOfIdentityContract.totalSupply();
  });
  it("The contract: ERC721 Overrides should not Allow transferFrom to move the token", async () => {
    await expectRevert(
      ProofOfIdentityContract.transferFrom(alice, other, 1),
      "102"
    );
  });
});
