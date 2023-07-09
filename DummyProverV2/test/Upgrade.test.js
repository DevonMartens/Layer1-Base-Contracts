const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const { expectRevert } = require("@openzeppelin/test-helpers");

describe("Proof of Identity Contract: Identity Blob struct after upgrades.", function () {
  let ProofOfIdentityContract;
  let ProofOfIdentityFactory;
  let IPermissionsInterfaceDummyInstance;
  let ContractDeployer;
  let Address2;
  let Address3;
  beforeEach(async () => {
    // Gets singers
    const [ContractDeployers, Address2s, Address3s] = await ethers.getSigners();
    ContractDeployer = await ContractDeployers.getAddress();
    Address2 = await Address2s.getAddress();
    Address3 = await Address3s.getAddress();
    // Gets contract factories for all Proof of Identity tests
    ProofOfIdentityFactory = await ethers.getContractFactory("ProofOfIdentity");
    // New Proof of Idenity Factory
    NewProofOfIdentityFactory = await ethers.getContractFactory(
      "NewProofOfIdentity"
    );
    //inputs for Proof of Identity
    const IPermissionsInterface = await ethers.getContractFactory(
      "DummyPermissionsContract"
    );
    IPermissionsInterfaceDummyInstance = await IPermissionsInterface.deploy();
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
    // gets information for deployment
    const VerifiableIdentityFactoryInfo = await ethers.getContractFactory(
      "VerifiableIdentity"
    );
    // deploy verifiable identity with proof of identity added to it to consult
    VerifiableIdentity = await VerifiableIdentityFactoryInfo.deploy(
      ProofOfIdentityContract.address
    );
    //mint one
    await ProofOfIdentityContract.issueIdentity(
      Address2,
      "1",
      2,
      3,
      78886932657,
      "tokenURI"
    );
  });
  it("User level should be maintained even after an upgrade occurs", async function () {
    // Upgrade the contract
    const ProofOfIdentityContractV2 = await upgrades.upgradeProxy(
      ProofOfIdentityContract.address,
      NewProofOfIdentityFactory,
      {
        kind: "uups",
      }
    );
    //const NewNewVerifiableIdentity
    const NewVerifiableIdentityFactory = await ethers.getContractFactory(
      "NewVerifiableIdentity"
    );

    const NewVerifiableIdentity = await NewVerifiableIdentityFactory.deploy(
      //even though the address would be the same really
      ProofOfIdentityContractV2.address
    );
    //call from old Verifiable Identity contract for legacy NFT
    expect(await VerifiableIdentity.getUserLevel(Address2)).to.equal(3);
    //call from new Verifiable Identity contract for legacy NFT
    expect(await NewVerifiableIdentity.getUserLevel(Address2)).to.equal(3);
  });
  it("Country code should be maintained even after an upgrade occurs", async function () {
    // Upgrade the contract
    const ProofOfIdentityContractV2 = await upgrades.upgradeProxy(
      ProofOfIdentityContract.address,
      NewProofOfIdentityFactory,
      {
        kind: "uups",
      }
    );
    //const NewNewVerifiableIdentity
    const NewVerifiableIdentityFactory = await ethers.getContractFactory(
      "NewVerifiableIdentity"
    );

    const NewVerifiableIdentity = await NewVerifiableIdentityFactory.deploy(
      //even though the address would be the same really
      ProofOfIdentityContractV2.address
    );
    //call from old Verifiable Identity contract for legacy NFT
    expect(await VerifiableIdentity.getUserCountryCode(Address2)).to.equal("1");
    //call from new Verifiable Identity contract for legacy NFT
    expect(await NewVerifiableIdentity.getUserCountryCode(Address2)).to.equal(
      "1"
    );
  });
  it("User type should be maintained even after an upgrade occurs", async function () {
    // Upgrade the contract
    const ProofOfIdentityContractV2 = await upgrades.upgradeProxy(
      ProofOfIdentityContract.address,
      NewProofOfIdentityFactory,
      {
        kind: "uups",
      }
    );
    //const NewNewVerifiableIdentity
    const NewVerifiableIdentityFactory = await ethers.getContractFactory(
      "NewVerifiableIdentity"
    );

    const NewVerifiableIdentity = await NewVerifiableIdentityFactory.deploy(
      //even though the address would be the same really
      ProofOfIdentityContractV2.address
    );
    //call from old Verifiable Identity contract for legacy NFT
    expect(await VerifiableIdentity.getUserType(Address2)).to.equal(2);
    //call from new Verifiable Identity contract for legacy NFT
    expect(await NewVerifiableIdentity.getUserType(Address2)).to.equal(2);
  });
  it("The identity blob struct should still return on calls", async function () {
    // Upgrade the contract
    const ProofOfIdentityContractV2 = await upgrades.upgradeProxy(
      ProofOfIdentityContract.address,
      NewProofOfIdentityFactory,
      {
        kind: "uups",
      }
    );
    //const NewNewVerifiableIdentity
    const NewVerifiableIdentityFactory = await ethers.getContractFactory(
      "NewVerifiableIdentity"
    );

    const NewVerifiableIdentity = await NewVerifiableIdentityFactory.deploy(
      //even though the address would be the same really
      ProofOfIdentityContractV2.address
    );

    const oldUserBlob = await VerifiableIdentity.getUserIdentityData(Address2);
    const newUserBlob = await NewVerifiableIdentity.getUserIdentityData(
      Address2
    );
    expect(oldUserBlob.level).to.equal(3);
    expect(newUserBlob.level).to.equal(3);
    expect(oldUserBlob.userType).to.equal(2);
    expect(newUserBlob.userType).to.equal(2);
    expect(oldUserBlob.countryCode).to.equal("1");
    expect(newUserBlob.countryCode).to.equal("1");

    expect(newUserBlob.name).to.equal("");
  });
  it("The identity blob struct should still be callable", async function () {
    // Upgrade the contract
    const ProofOfIdentityContractV2 = await upgrades.upgradeProxy(
      ProofOfIdentityContract.address,
      NewProofOfIdentityFactory,
      {
        kind: "uups",
      }
    );
    //const NewNewVerifiableIdentity
    const NewVerifiableIdentityFactory = await ethers.getContractFactory(
      "NewVerifiableIdentity"
    );

    const NewVerifiableIdentity = await NewVerifiableIdentityFactory.deploy(
      //even though the address would be the same really
      ProofOfIdentityContractV2.address
    );

    const oldUserBlob = await VerifiableIdentity.getUserIdentityData(Address2);
    const newUserBlob = await NewVerifiableIdentity.getUserIdentityData(
      Address2
    );
    expect(oldUserBlob.level).to.equal(3);
    expect(newUserBlob.level).to.equal(3);
    expect(oldUserBlob.userType).to.equal(2);
    expect(newUserBlob.userType).to.equal(2);
    expect(oldUserBlob.countryCode).to.equal("1");
    expect(newUserBlob.countryCode).to.equal("1");
    expect(await NewVerifiableIdentity.getUserName(Address2)).to.equal("REGISTER_NAME");
  });
  it("The new issueIdentity function should work", async function () {
       // Upgrade the contract
       const ProofOfIdentityContractV2 = await upgrades.upgradeProxy(
        ProofOfIdentityContract.address,
        NewProofOfIdentityFactory,
        {
          kind: "uups",
        }
      );
  
  const blob =  {
    tokenId: 2,
    countryCode: "1",
    userType: 2,
    level: 3,
    expiry: 9087790790797
  };
  
  await ProofOfIdentityContractV2.issueIdentity(
    
    Address3,
    blob,
    "tokenURI"
  );
  //const NewNewVerifiableIdentity
    const NewVerifiableIdentityFactory = await ethers.getContractFactory(
      "NewVerifiableIdentity"
    );

    const NewVerifiableIdentity = await NewVerifiableIdentityFactory.deploy(
      //even though the address would be the same really
      ProofOfIdentityContractV2.address
    );
  expect(await NewVerifiableIdentity.getUserCountryCode(Address3)).to.equal(
    "1"
  );
});
});
