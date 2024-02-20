const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const { expectRevert } = require("@openzeppelin/test-helpers");

describe("Proof of Identity Contract", function () {
  let ProofOfIdentityContract;
  let ProofOfIdentityFactory;
  let IPermissionsInterfaceDummyInstance;
  let ContractDeployer;
  let Address2;
  let Address3;
  beforeEach(async () => {
    // Gets contract factories for all Proof of Identity tests
    ProofOfIdentityFactory = await ethers.getContractFactory("ProofOfIdentity");
    const IPermissionsInterface = await ethers.getContractFactory(
      "DummyPermissionsContract"
    );
    IPermissionsInterfaceDummyInstance = await IPermissionsInterface.deploy();
    // Gets signers
    const [ContractDeployers, Address2s, Address3s] = await ethers.getSigners();
    ContractDeployer = await ContractDeployers.getAddress();
    Address2 = await Address2s.getAddress();
    Address3 = await Address3s.getAddress();
    // Deploys Proof of Identity Contract with ContractDeployer as Operator and Admin
    ProofOfIdentityContract = await upgrades.deployProxy(
      ProofOfIdentityFactory,
      [
        IPermissionsInterfaceDummyInstance.address,
        ContractDeployer,
        ContractDeployer,
      ],
      { initializer: "initialize", kind: "uups" }
    );
    const currentImplementationAddress = await upgrades.erc1967.getImplementationAddress(ProofOfIdentityContract.address, "getImplementationAddress");
    AdminAddress = await upgrades.erc1967.getAdminAddress(ProofOfIdentityContract.address, "getAdminAddress");
  });
  describe("Testing the Proof of Identity Contract initial values upon deployment.", function () {
    it("Proof of Identity Contract: The values for name & symbol should be the same as the values passed in the constructor", async () => {
      expect(await ProofOfIdentityContract.name()).to.equal(
        "Proof of Identity"
      );
      expect(await ProofOfIdentityContract.symbol()).to.equal("H1-ID");
    });
    it("Proof of Identity Contract: The totalSupply should start at 0.", async () => {
      expect(await ProofOfIdentityContract.totalSupply()).to.equal(0);
    });
  });
  describe("Testing the issueIdentity function and that minting happens as expected.", function () {
    beforeEach(async () => {
      // Issues the second signer address an NFT and assigns it an identity
      // By default this is tokenId 1.
      await ProofOfIdentityContract.issueIdentity(
        Address2,
        "1",
        2,
        3,
        78886932657,
        "tokenURI"
      );
    });
    it("Proof of Identity Contract: The establishCompetencyRating should change the competency rating of a user from 0.", async () => {
      await ProofOfIdentityContract.establishCompetencyRating(Address2, 5);
      const blobOfAddress2 =
        await ProofOfIdentityContract.getUserAccountIdentityBlob(Address2);
      const rating = blobOfAddress2.competencyRating;
      expect(rating).to.equal(5);
    });
    it("Proof of Identity Contract: The totalSupply should be equal to 1 after a token is minted.", async () => {
      expect(await ProofOfIdentityContract.totalSupply()).to.equal(1);
    });
    it("Proof of Identity Contract: The issueIdentity function should mint a token to the address it is requested to", async () => {
      //checks that Address2 owns token one
      expect(await ProofOfIdentityContract.ownerOf(1)).to.equal(Address2);
    });
    it("Proof of Identity Contract: The issueIdentity function should create an identity blob struct with correct values for country code", async () => {
      //checks that the country code is "1" as expected
      expect(
        await ProofOfIdentityContract.getUserAccountCountryCode(Address2)
      ).to.equal("1");
    });
    it("Proof of Identity Contract: The issueIdentity function should create an identity blob struct with correct values for userType", async () => {
      // Checks that the User Account Type is the same as the function input
      expect(
        await ProofOfIdentityContract.getUserAccountType(Address2)
      ).to.equal(2);
    });
    it("Proof of Identity Contract: The issueIdentity function should create an identity blob struct with correct values for level", async () => {
      // Checks that the User Account Level is the same as the function input
      expect(
        await ProofOfIdentityContract.getUserAccountLevel(Address2)
      ).to.equal(3);
    });
    it("Proof of Identity Contract: The issueIdentity function should create an identity blob struct with correct values for expiry", async () => {
      // Checks that the expiry is the same as the function input
      expect(
        await ProofOfIdentityContract.getUserAccountExpiry(Address2)
      ).to.equal(78886932657);
    });
    it("Proof of Identity Contract: The issueIdentity function should create multiple structs and mint multiple tokens", async () => {
      await ProofOfIdentityContract.issueIdentity(
        Address3,
        "1",
        2,
        3,
        78886932625,
        "tokenURI"
      );
      //calls expiry in struct to ensure formation
      expect(
        await ProofOfIdentityContract.getUserAccountExpiry(Address2)
      ).to.equal(78886932657);
      expect(
        await ProofOfIdentityContract.getUserAccountExpiry(Address3)
      ).to.equal(78886932625);
      //call erc721 owner of to ensure tokens were placed
      expect(await ProofOfIdentityContract.ownerOf(1)).to.equal(Address2);
      expect(await ProofOfIdentityContract.ownerOf(2)).to.equal(Address3);
    });
    it("Proof of Identity Contract: The issueIdentity function should create a token with the custom input as it's URI", async () => {
      expect(await ProofOfIdentityContract.tokenURI(1)).to.equal("tokenURI");
    });
    it("Proof of Identity Contract: The tokenURI function should give an error 101 if the tokenId doesn't exist", async () => {
      await expectRevert(ProofOfIdentityContract.tokenURI(1444), 'IDDoesNotExist()');
    });
  });
  describe("Testing the updateIdentity functions ability to alter tokens and identity blobs.", function () {
    beforeEach(async () => {
      // country code "1" , userType 2 ,level 3, expiry block, tokenURI
      await ProofOfIdentityContract.issueIdentity(
        Address2,
        "1",
        2,
        3,
        78886932657,
        "tokenURI"
      );
    });
    it("Proof of Identity Contract: The updateIdentity function should alter a previously created identity's country code", async () => {
      //confirms original country code
      expect(
        await ProofOfIdentityContract.getUserAccountCountryCode(Address2)
      ).to.equal("1");
      //updates
      await ProofOfIdentityContract.updateIdentity(
        Address2,
        "4",
        2,
        3,
        78886932657,
        "hi"
      );
      //gets new code
      expect(
        await ProofOfIdentityContract.getUserAccountCountryCode(Address2)
      ).to.equal("4");
    });
    it("Proof of Identity Contract: The updateIdentity function should alter a previously created identity's account type", async () => {
      //checks original user type
      expect(
        await ProofOfIdentityContract.getUserAccountType(Address2)
      ).to.equal(2);
      //updates
      await ProofOfIdentityContract.updateIdentity(
        Address2,
        1,
        5,
        3,
        78886932657,
        "hi"
      );
      //gets new code
      expect(
        await ProofOfIdentityContract.getUserAccountType(Address2)
      ).to.equal(5);
    });
    it("Proof of Identity Contract: The updateIdentity function should alter a previously created identity's account level", async () => {
      expect(
        await ProofOfIdentityContract.getUserAccountLevel(Address2)
      ).to.equal(3);
      //updates account level to 6
      await ProofOfIdentityContract.updateIdentity(
        Address2,
        1,
        6,
        6,
        78886932657,
        "hi"
      );
      //gets new code
      expect(
        await ProofOfIdentityContract.getUserAccountLevel(Address2)
      ).to.equal(6);
    });
    it("Proof of Identity Contract: The updateIdentity function should alter a previously created identity's expiry date", async () => {
      expect(
        await ProofOfIdentityContract.getUserAccountExpiry(Address2)
      ).to.equal(78886932657);
      //updates  the expiry of the account
      await ProofOfIdentityContract.updateIdentity(
        Address2,
        1,
        2,
        6,
        78886932658,
        "hi"
      );
      //gets new expiry
      expect(
        await ProofOfIdentityContract.getUserAccountExpiry(Address2)
      ).to.equal(78886932658);
    });
    it("Proof of Identity Contract: The updateIdentity function should alter a previously created identities entire struct", async () => {
      await ProofOfIdentityContract.issueIdentity(
        Address3,
        1,
        2,
        3,
        78886932657,
        "token"
      );
      //calls expiry in struct to ensure formation was done as expected
      expect(
        await ProofOfIdentityContract.getUserAccountExpiry(Address2)
      ).to.equal(78886932657);
      expect(
        await ProofOfIdentityContract.getUserAccountExpiry(Address3)
      ).to.equal(78886932657);
      //update Address3 and Address2s expiry
      await ProofOfIdentityContract.updateIdentity(
        Address2,
        1,
        2,
        6,
        78886932658,
        "hi"
      );
      await ProofOfIdentityContract.updateIdentity(
        Address3,
        1,
        2,
        6,
        78886932658,
        "hi"
      );
      //calls expiry in struct to ensure formation was done as expected
      expect(
        await ProofOfIdentityContract.getUserAccountExpiry(Address2)
      ).to.equal(78886932658);
      expect(
        await ProofOfIdentityContract.getUserAccountExpiry(Address3)
      ).to.equal(78886932658);
    });
    it("Proof of Identity Contract: The updateIdentity function should create a token with the custom input as it's URI and edit it if adjusted", async () => {
      //checks that the original tokenURI is tokenURI
      expect(await ProofOfIdentityContract.tokenURI(1)).to.equal("tokenURI");
      //updates the tokenURI
      await ProofOfIdentityContract.updateTokenURI(Address2, 1, "Updated");
      //checks that the token URI has updated to the anticipated URI
      expect(await ProofOfIdentityContract.tokenURI(1)).to.equal("Updated");
    });
  });
  describe("Testing Function Permissions to ensure Access Control works as expected.", function () {
    let OPERATOR_ROLE;
    let DEFAULT_ADMIN_ROLE;
    let Address2SignsProofOfIdentityContract;
    let ContractDeployerErrorMessageForAccessControl;
    let Address2ErrorMessageForAccessControl;
    let ProofOfIdentityHasADifferentUpgraderAndAdmin;
    beforeEach(async () => {
      // country code "1" , userType 2 ,level 3, expiry block, tokenURI
      await ProofOfIdentityContract.issueIdentity(
        Address2,
        "1",
        2,
        3,
        78886932657,
        "token"
      );
      // getting error messages for accesscontrol errors
      Address2ErrorMessageForAccessControl = Address2.toLowerCase();
      ContractDeployerErrorMessageForAccessControl =
        ContractDeployer.toLowerCase();
      //getting access control role
      OPERATOR_ROLE = await ProofOfIdentityContract.OPERATOR_ROLE();
      DEFAULT_ADMIN_ROLE = await ProofOfIdentityContract.DEFAULT_ADMIN_ROLE();
      //allows Address2 to be the signer
      secondAddressSigner = await ethers.getSigner(Address2);
      Address2SignsProofOfIdentityContract =
        ProofOfIdentityContract.connect(secondAddressSigner);
      // Second Proof of Identity Contract where address 2 is the admin
      ProofOfIdentityHasADifferentUpgraderAndAdmin = await upgrades.deployProxy(
        ProofOfIdentityFactory,
        [IPermissionsInterfaceDummyInstance.address, Address2, Address2],
        { initializer: "initialize", kind: "uups" }
      );
    });
    it("Proof of Identity Contract: The initialize should only be called upon deployment.", async () => {
      await expectRevert(
        ProofOfIdentityContract.initialize(
          IPermissionsInterfaceDummyInstance.address,
          Address3,
          Address3
        ),
        "Initializable: contract is already initialized"
      );
    });
    it("Proof of Identity Contract: Contract upgrades should only be allowed to be called by DEFAULT_ADMIN_ROLE", async function () {
      // Calls the new contract where Address2 is the ADMIN and OPERATOR
      await expectRevert(
        upgrades.upgradeProxy(
          ProofOfIdentityHasADifferentUpgraderAndAdmin.address,
          ProofOfIdentityFactory,
          {
            kind: "uups",
          }
        ),
        `AccessControl: account ${ContractDeployerErrorMessageForAccessControl} is missing role ${DEFAULT_ADMIN_ROLE}`
      );
      // Calls the original not the one where Address2 is the ADMIN and OPERATOR
      ProofOfIdentityContractV2 = await upgrades.upgradeProxy(
        ProofOfIdentityContract.address,
        ProofOfIdentityFactory,
        {
          kind: "uups",
        }
      );
    });
    it("Proof of Identity Contract: The function suspendAccountMaintainTokenAndIdentityBlob should only allow a OPERATOR_ROLE address to call it", async () => {
      await expectRevert(
        Address2SignsProofOfIdentityContract.suspendAccountMaintainTokenAndIdentityBlob(
          Address3,
          "hi"
        ),
        `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("Proof of Identity Contract: The function updateIdentity should only allow a OPERATOR_ROLE address to call it", async () => {
      await expectRevert(
        Address2SignsProofOfIdentityContract.updateIdentity(
          Address3,
          1,
          2,
          3,
          78886932657,
          "2"
        ),
        `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("Proof of Identity Contract: The function issueIdentity should only allow a OPERATOR_ROLE address to call it", async () => {
      await expectRevert(
        Address2SignsProofOfIdentityContract.issueIdentity(
          Address3,
          1,
          2,
          3,
          78886932657,
          "hi"
        ),
        `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
    it("Proof of Identity Contract: Only the Haven1 Foundation should have the ability to grant OPERATOR_ROLE", async () => {
      await expectRevert(
        Address2SignsProofOfIdentityContract.grantRole(OPERATOR_ROLE, Address3),
        `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${DEFAULT_ADMIN_ROLE}`
      );
    });
    it("Proof of Identity Contract: The Haven1 Foundation should be able to issue OPERATOR_ROLES", async () => {
      //ensures ContractDeployer can grant Address2 a role
      await ProofOfIdentityContract.grantRole(OPERATOR_ROLE, Address2);
      //tests that Address2 can use her role
      await Address2SignsProofOfIdentityContract.updateIdentity(
        Address2,
        1,
        2,
        3,
        78886932657,
        "hi"
      );
    });
    it("Proof of Identity Contract: The proof of identity contract's function updateTokenURI should only be allowed to be called by a OPERATOR_ROLE", async () => {
      await expectRevert(
        Address2SignsProofOfIdentityContract.updateTokenURI(
          Address2,
          1,
          "Updated"
        ),
        `AccessControl: account ${Address2ErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
      expect(await ProofOfIdentityContract.tokenURI(1)).to.equal("token");
    });
    it("Proof of Identity Contract: The contract deployer by default should not have the DEFAULT_ADMIN_ROLE", async () => {
      await expectRevert(
        ProofOfIdentityHasADifferentUpgraderAndAdmin.grantRole(
          OPERATOR_ROLE,
          Address2
        ),
        `AccessControl: account ${ContractDeployerErrorMessageForAccessControl} is missing role ${DEFAULT_ADMIN_ROLE}`
      );
    });
    //establishCompetencyRating
    it("Proof of Identity Contract: The `establishCompetencyRating` should only be called by the OPERATOR_ROLE", async () => {
      await expectRevert(
        ProofOfIdentityHasADifferentUpgraderAndAdmin.establishCompetencyRating(
          Address2,
          1
        ),
        `AccessControl: account ${ContractDeployerErrorMessageForAccessControl} is missing role ${OPERATOR_ROLE}`
      );
    });
  });
  describe("Testing contracts that ERC721 overrides on the transfer functions prevents the sending of tokens.", function () {
    beforeEach(async () => {
      // tokenId 1 country code "1" , userType 2 ,level 3, expiry block 78886932657, tokenURI - tokenONE
      await ProofOfIdentityContract.issueIdentity(
        Address2,
        "1",
        2,
        3,
        78886932657,
        "tokenONE"
      );
    });
    it("Proof of Identity Contract: ERC721 Overrides should not Allow transferFrom to transfer the token to another address.", async () => {
      await ProofOfIdentityContract.issueIdentity(
        ContractDeployer,
        "1",
        2,
        3,
        78886932657,
        "tokenONE"
      );
      await expectRevert(
        ProofOfIdentityContract.transferFrom(ContractDeployer, Address3, 2),
        'IDNotTransferable()'
      );
    });
    it("Proof of Identity Contract: ERC721 Overrides should not Allow safeTransferFrom to transfer the token to another address.", async () => {
      await ProofOfIdentityContract.issueIdentity(
        ContractDeployer,
        "1",
        2,
        3,
        78886932657,
        "tokenONE"
      );
      await expectRevert(
        ProofOfIdentityContract["safeTransferFrom(address,address,uint256)"](
          ContractDeployer,
          Address2,
          2
        ),
        'IDNotTransferable()'
      );
      await ProofOfIdentityContract.totalSupply();
    });
    it("Proof of Identity Contract: The SupportsInterface function should only return true on the contract's that are specified.'", async () => {
      expect(
        await ProofOfIdentityContract.supportsInterface("0x12345678")
      ).to.equal(false);
    });
  });
  describe("Testing custom errors in updateTokenURI, issueIdentity, and updateIdentity to ensure functions revert as expected.", function () {
    let lessThanCurrentBlockNumber;
    let greaterThanCurrentBlockNumber;
    beforeEach(async () => {
      // Mints tokenid 1 to Address2 the country code is "1" , userType 2 ,level 3, expiry block, tokenURI
      await ProofOfIdentityContract.issueIdentity(
        Address2,
        "1",
        2,
        3,
        78886932657,
        "token"
      );
      //get current block from ethers
      const currentBlock = await ethers.provider.getBlockNumber();
      // gets current block number to subtract from to create one that has already passed regardless of when this test is run
      let currentBlockTimestamp = (await ethers.provider.getBlock(currentBlock))
        .timestamp;

      //passed block
      lessThanCurrentBlockNumber = currentBlockTimestamp - 50;
      greaterThanCurrentBlockNumber = currentBlockTimestamp + 50;
    });
    it("Proof of Identity Contract: `issueIdentity` should stop a wallet that has a token from minting another token.", async () => {
      await expectRevert(
        ProofOfIdentityContract.issueIdentity(
          Address2,
          1,
          2,
          3,
          78886932657,
          "token"
        ),
        'PreviouslyVerified()'
      );
    });
    it("Proof of Identity Contract: issueIdentity should not allow expired tokens to be minted.", async () => {
      await expectRevert(
        ProofOfIdentityContract.issueIdentity(
          Address3,
          1,
          2,
          3,
          lessThanCurrentBlockNumber,
          "token"
        ),
        'IDInvalidExpired()'
      );
    });
    it("Proof of Identity Contract: `updateIdentity` should not allow an account that doesn't have a token to the updated the identity blob struct.", async () => {
      await expectRevert(
        ProofOfIdentityContract.updateIdentity(
          Address3,
          1,
          2,
          3,
          greaterThanCurrentBlockNumber,
          "hi"
        ),
        'IDDoesNotExist()'
      );
    });
    it("Proof of Identity Contract:  `updateTokenURI` should not allow an account's tokenURI to be updated if they don't have an id.", async () => {
      await expectRevert(
        ProofOfIdentityContract.updateTokenURI(Address3, 2, "token"),
        'IDDoesNotExist()'
      );
    });
  });
  describe("Testing custom events to ensure they emit as expected", function () {
    beforeEach(async () => {
      // Mints tokenid 1 to Address2 country code "1" , userType 2 ,level 3, expiry block, tokenURI
      await ProofOfIdentityContract.issueIdentity(
        Address2,
        "1",
        2,
        3,
        78886932657,
        "token"
      );
    });
    it("Proof of Identity Contract: The event AccountSuspendedTokenMaintained should emit with the address that is suspended and reason in the function suspendAccountMaintainTokenAndIdentityBlob.", async () => {
      await expect(
        ProofOfIdentityContract.suspendAccountMaintainTokenAndIdentityBlob(
          Address2,
          "VALID_REASON"
        )
      )
        .to.emit(ProofOfIdentityContract, "AccountSuspendedTokenMaintained")
        .withArgs(Address2, "VALID_REASON");
    });
    it("Proof of Identity Contract: The event IdentityUpdated should emit in issueIdentity function with an address of the updated token and it's tokenId.", async () => {
      await expect(
        ProofOfIdentityContract.issueIdentity(
          Address3,
          "1",
          2,
          3,
          78886932657,
          "token"
        )
      )
        .to.emit(ProofOfIdentityContract, "IdentityIssued")
        .withArgs(Address3, 2);
    });
    it("Proof of Identity Contract: The TokenURIUpdated event should emit in updateTokenURI with the account and tokenId.", async () => {
      await expect(
        ProofOfIdentityContract.updateTokenURI(Address2, 1, "NewURI")
      )
        .to.emit(ProofOfIdentityContract, "TokenURIUpdated")
        .withArgs(Address2, 1, "NewURI");
    });
  });
});
