const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const blobForAddress2 = {
  largeNumbers: [1, 78886932657],
  smallNumbers: [2, 3],
  strings: ["1"],
};

const blobForAddress3 = {
  largeNumbers: [2, 7888693278],
  smallNumbers: [5, 6],
  strings: ["1"],
};

describe("Verifiable Identity Contract's ability to read the Proof Of Identity contract's identity blob.", function () {
  let ProofOfIdentityContract;
  let ContractDeployer;
  let Address2;
  let Address3;
  let VerifiableIdentity;
  beforeEach(async () => {
    const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity");
    const IPermissionsInterface = await ethers.getContractFactory(
      "DummyPermissionsContract"
    );
    const IPermissionsInterfaceDummyInstance =
      await IPermissionsInterface.deploy();
    const [ContractDeployers, Address2s, Address3s] = await ethers.getSigners();
    ContractDeployer = await ContractDeployers.getAddress();
    Address2 = await Address2s.getAddress();
    Address3 = await Address3s.getAddress();
    ProofOfIdentityContract = await upgrades.deployProxy(
      ProofOfIdentity,
      [
        IPermissionsInterfaceDummyInstance.address,
        ContractDeployer,
        ContractDeployer,
      ],
      { initializer: "initialize", kind: "uups" }
    );
    //mints tokenid 1 to Address2 token 2 to Address3 to test
    // tokenId 1 country code "1" , userType 2 ,level 3, expiry block 78886932657, tokenURI - tokenONE
    await ProofOfIdentityContract.issueIdentity(
      Address2,
      blobForAddress2,
      "tokenONE"
    );
    // tokenId 2 country code "4" , userType 5 ,level 6, expiry block - 7888693278, tokenURI tokenONE
    await ProofOfIdentityContract.issueIdentity(
      Address3,
      blobForAddress3,
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
  it("Verifiable Identity Contract: The values for `Competency Rating` in a seperate verifiable identity contract should match the values for the original proof of identity.", async () => {
    await ProofOfIdentityContract.establishCompetencyRating(Address3, 4);
    expect(await VerifiableIdentity.getUserCompetencyRating(Address3)).to.equal(
      await ProofOfIdentityContract.getUserAccountCompetencyRating(Address3)
    );
  });
  it("Verifiable Identity Contract: The values for `country code` in a seperate verifiable identity contract should match the values for the original proof of identity.", async () => {
    //check that the country code is the same in the original proof of identity
    expect(
      await ProofOfIdentityContract.getUserAccountCountryCode(Address2)
    ).to.equal("1");
    expect(await VerifiableIdentity.getUserCountryCode(Address3)).to.equal("1");
    //check that the country code is the same in the Verifiable Identity
    expect(
      await ProofOfIdentityContract.getUserAccountCountryCode(Address2)
    ).to.equal("1");
    expect(await VerifiableIdentity.getUserCountryCode(Address3)).to.equal("1");
    //checks against each Address3
    expect(await VerifiableIdentity.getUserCountryCode(Address2)).to.equal(
      await ProofOfIdentityContract.getUserAccountCountryCode(Address2)
    );
    expect(await VerifiableIdentity.getUserCountryCode(Address3)).to.equal(
      await ProofOfIdentityContract.getUserAccountCountryCode(Address3)
    );
  });
  it("Verifiable Identity Contract: The values for `user type` in a seperate verifiable identity contract should match the values for the original proof of identity.", async () => {
    //check that the user type is the same in the original proof of identity
    expect(await ProofOfIdentityContract.getUserAccountType(Address2)).to.equal(
      2
    );
    expect(await ProofOfIdentityContract.getUserAccountType(Address3)).to.equal(
      5
    );
    //check that the user type is the same in the Verifiable Identity
    expect(await VerifiableIdentity.getUserType(Address2)).to.equal(2);
    expect(await VerifiableIdentity.getUserType(Address3)).to.equal(5);
    //checks against each Address3
    expect(await VerifiableIdentity.getUserType(Address2)).to.equal(
      await ProofOfIdentityContract.getUserAccountType(Address2)
    );
    expect(await VerifiableIdentity.getUserType(Address3)).to.equal(
      await ProofOfIdentityContract.getUserAccountType(Address3)
    );
  });
  it("Verifiable Identity Contract: The values for `level` in a seperate verifiable identity contract should match the values for the original proof of identity.", async () => {
    //check that the level is the same in the original proof of identity
    expect(
      await ProofOfIdentityContract.getUserAccountLevel(Address2)
    ).to.equal(3);
    expect(
      await ProofOfIdentityContract.getUserAccountLevel(Address3)
    ).to.equal(6);
    //check that the level is the same in the Verifiable Identity
    expect(await VerifiableIdentity.getUserLevel(Address2)).to.equal(3);
    expect(await await VerifiableIdentity.getUserLevel(Address3)).to.equal(6);
    //checks against each Address3
    expect(await VerifiableIdentity.getUserLevel(Address2)).to.equal(
      await ProofOfIdentityContract.getUserAccountLevel(Address2)
    );
    expect(await VerifiableIdentity.getUserLevel(Address3)).to.equal(
      await ProofOfIdentityContract.getUserAccountLevel(Address3)
    );
  });
  it("Verifiable Identity Contract: The values for `expiry` in the test caller contract should match the values for the original contract.", async () => {
    //check that the level is the same in the original proof of identity
    expect(
      await ProofOfIdentityContract.getUserAccountExpiry(Address2)
    ).to.equal(78886932657);
    expect(
      await ProofOfIdentityContract.getUserAccountExpiry(Address3)
    ).to.equal(7888693278);
    //check that the level is the same in the Verifiable Identity
    expect(await VerifiableIdentity.getUserExpiry(Address2)).to.equal(
      78886932657
    );
    expect(await VerifiableIdentity.getUserExpiry(Address3)).to.equal(
      7888693278
    );
    //checks against each Address3
    expect(await VerifiableIdentity.getUserExpiry(Address2)).to.equal(
      await ProofOfIdentityContract.getUserAccountExpiry(Address2)
    );
    expect(await VerifiableIdentity.getUserExpiry(Address3)).to.equal(
      await ProofOfIdentityContract.getUserAccountExpiry(Address3)
    );
  });
});
