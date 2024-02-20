const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expectRevert } = require("@openzeppelin/test-helpers");

describe("Verifiable Identity Contract's ability to read the Proof Of Identity contract's identity blob.", function () {
  let ProofOfIdentityContract;
  let ContractDeployer;
  let Address2;
  let Address3;
  let Address4;
  let Address5;
  let VerifiableIdentity;
  let timestamp;
  beforeEach(async () => {
    const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity");
    const IPermissionsInterface = await ethers.getContractFactory(
      "DummyPermissionsContract"
    );
    const IPermissionsInterfaceDummyInstance =
      await IPermissionsInterface.deploy();
    const [ContractDeployers, Address2s, Address3s, Address4s, Address5s] = await ethers.getSigners();
    ContractDeployer = await ContractDeployers.getAddress();
    Address2 = await Address2s.getAddress();
    Address3 = await Address3s.getAddress();
    Address4 = await Address4s.getAddress();
    Address5 = await Address5s.getAddress();
    ProofOfIdentityContract = await upgrades.deployProxy(
      ProofOfIdentity,
      [
        IPermissionsInterfaceDummyInstance.address,
        ContractDeployer,
        ContractDeployer,
      ],
      { initializer: "initialize" }
    );
    //mints tokenid 1 to Address2 token 2 to Address3 to test
    // tokenId 1 country code "1" , userType 2 ,level 3, expiry block 78886932657, tokenURI - tokenONE
    await ProofOfIdentityContract.issueIdentity(
      Address2,
      "1",
      2,
      3,
      78886932657,
      "tokenONE"
    );
    // tokenId 2 country code "4" , userType 5 ,level 6, expiry block - 78886932789, tokenURI tokenONE
    await ProofOfIdentityContract.issueIdentity(
      Address3,
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
    timestamp = await time.latest();
  });
  it("Verifiable Identity Contract: The values for `country code` in a separate verifiable identity contract should match the values for the original proof of identity.", async () => {
    //check that the country code is the same in the original proof of identity
    expect(
      await ProofOfIdentityContract.getUserAccountCountryCode(Address2)
    ).to.equal("1");
    expect(await VerifiableIdentity.getUserCountryCode(Address3)).to.equal("4");
    //check that the country code is the same in the Verifiable Identity
    expect(
      await ProofOfIdentityContract.getUserAccountCountryCode(Address2)
    ).to.equal("1");
    expect(await VerifiableIdentity.getUserCountryCode(Address3)).to.equal("4");
    //checks against each Address3
    expect(await VerifiableIdentity.getUserCountryCode(Address2)).to.equal(
      await ProofOfIdentityContract.getUserAccountCountryCode(Address2)
    );
    expect(await VerifiableIdentity.getUserCountryCode(Address3)).to.equal(
      await ProofOfIdentityContract.getUserAccountCountryCode(Address3)
    );
  });
  it("Verifiable Identity Contract: The values for `Competency Rating` in a separate verifiable identity contract should match the values for the original proof of identity.", async () => {
    await ProofOfIdentityContract.establishCompetencyRating(Address3, 4);
    expect(await VerifiableIdentity.getUserCompetencyRating(Address3)).to.equal(
      await ProofOfIdentityContract.getUserAccountCompetencyRating(Address3)
    );
  });
  it("Verifiable Identity Contract: The identity blobs in the Proof Of IdentityContract and Verifiable Identity should be the same if a score is given.", async () => {
    await ProofOfIdentityContract.updateIdentity(
      Address2,
      "4",
      2,
      3,
      78886932657,
      "hi"
    );
    expect(
      await ProofOfIdentityContract.getUserAccountIdentityBlob(Address2)
    ).to.deep.equal(await VerifiableIdentity.getUserIdentityData(Address2));
  });
  it("Verifiable Identity Contract: The identity blobs in the Proof Of IdentityContract and Verifiable Identity should be the same.", async () => {
    expect(
      await ProofOfIdentityContract.getUserAccountIdentityBlob(Address2)
    ).to.deep.equal(await VerifiableIdentity.getUserIdentityData(Address2));
  });
  it("Verifiable Identity Contract: The values for `user type` in a separate verifiable identity contract should match the values for the original proof of identity.", async () => {
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
  it("Verifiable Identity Contract: The values for `level` in a separate verifiable identity contract should match the values for the original proof of identity.", async () => {
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
    ).to.equal(78886932789);
    //check that the level is the same in the Verifiable Identity
    expect(await VerifiableIdentity.getUserExpiry(Address2)).to.equal(
      78886932657
    );
    expect(await await VerifiableIdentity.getUserExpiry(Address3)).to.equal(
      78886932789
    );
    //checks against each Address3
    expect(await VerifiableIdentity.getUserExpiry(Address2)).to.equal(
      await ProofOfIdentityContract.getUserAccountExpiry(Address2)
    );
    expect(await VerifiableIdentity.getUserExpiry(Address3)).to.equal(
      await ProofOfIdentityContract.getUserAccountExpiry(Address3)
    );
  });
  it("Verifiable Identity Contract: The getUserAccountIdentityBlob function should return the proper values.", async () => {
    const levelBlob = await ProofOfIdentityContract.getUserAccountIdentityBlob(
      Address2
    );
    expect(levelBlob.level).to.equal(3);
  });
  it("Verifiable Identity Contract: The identity blobs in the Proof Of IdentityContract and Verifiable Identity Prevents on Expiry should be the same.", async () => {
    expect(
      await ProofOfIdentityContract.getUserAccountIdentityBlob(Address2)
    ).to.deep.equal(await VerifiableIdentity.getUserIdentityData(Address2));
  });
  it("Verifiable Identity Prevents on Expiry Contract: After a token is expired the `getUserTypePreventOnExpiry`from the VerifiableIdentity contract should revert", async () => {
    const set = timestamp + 5;
    // TOKEN INFO: tokenId 1 country code "1" , userType 2 ,level 3, expiry block NOW, tokenURI - tokenONE
    await ProofOfIdentityContract.issueIdentity(
      Address4,
      "1",
      2,
      3,
      set,
      "tokenONE"
    );
    //time stamp was on mint so this should revert
    await time.increase(time.duration.days(2));
    //should revert and not return values 7 seconds past
    await expectRevert.unspecified(
      VerifiableIdentity.getUserTypePreventOnExpiry(Address4),
      ""
    );
  });
  //
  it("Verifiable Identity Prevents on Expiry Contract: Verifiable Identity Prevents on Expiry getUserExpiry should get the expiry or revert if expired", async () => {
    const set = timestamp + 5;
    await ProofOfIdentityContract.issueIdentity(
      Address4,
      "1",
      2,
      3,
      set,
      "tokenONE"
    );
    expect(
      await VerifiableIdentity.getUserExpiry(Address4)
    ).to.equal(set);
  });
  it("Verifiable Identity Prevents on Expiry Contract: The identity blobs in the Proof Of IdentityContract and Verifiable Identity Prevents on Expiry should be the same", async () => {
    const set = timestamp + 5;
    await ProofOfIdentityContract.issueIdentity(
      Address4,
      "1",
      2,
      3,
      set,
      "tokenONE"
    );
    expect(
      await ProofOfIdentityContract.getUserAccountIdentityBlob(Address4)
    ).to.deep.equal(
      await VerifiableIdentity.getUserIdentityData(Address4)
    );
  });
  it("Verifiable Identity Prevents on Expiry Contract: After a token is expired the `getUserAccountLevelPreventOnExpiry` from the VerifiableIdentity contract should revert", async () => {
    // current plus 5
    const set = timestamp + 5;
    // TOKEN INFO: tokenId 1 country code "1" , userType 2 ,level 3, expiry block NOW, tokenURI - tokenONE
    await ProofOfIdentityContract.issueIdentity(
      Address4,
      "1",
      2,
      3,
      set,
      "tokenONE"
    );
    await time.increase(time.duration.days(2));
    //should revert and not return values 7 seconds past
    await expectRevert.unspecified(
      VerifiableIdentity.getUserLevelPreventOnExpiry(Address4),
      ""
    );
  });
  it("Verifiable Identity Prevents on Expiry Contract: After a token is expired the `getUserCompetencyRatingPreventOnExpir`from the VerifiableIdentity contract should revert", async () => {
    const set = timestamp + 5;
    // TOKEN INFO: tokenId 1 country code "1" , userType 2 ,level 3, expiry block NOW, tokenURI - tokenONE
    await ProofOfIdentityContract.issueIdentity(
      Address4,
      "1",
      2,
      3,
      set,
      "tokenONE"
    );
    await ProofOfIdentityContract.establishCompetencyRating(Address4, 1);
    //time stamp was on mint so this should revert
    await time.increase(time.duration.days(2));
    //should revert and not return values 7 seconds past
    await expectRevert.unspecified(
      VerifiableIdentity.getUserCompetencyRatingPreventOnExpiry(
        Address4
      ),
      ""
    );
  });
  it("Verifiable Identity Prevents on Expiry Contract: After a token is NOT expired the `getUserCompetencyRatingPreventOnExpiry` from the VerifiableIdentity contract contract should provide accurate information", async () => {
    // TOKEN INFO: tokenId 2 country code "4" , userType 5 ,level 6, expiry block - 78886932789, tokenURI tokenONE
    await ProofOfIdentityContract.issueIdentity(
      Address5,
      "4",
      5,
      6,
      78886932657,
      "tokenTWO"
    );
    await ProofOfIdentityContract.establishCompetencyRating(Address5, 1);
    //should revert and not return values 7 seconds past
    expect(
      await VerifiableIdentity.getUserCompetencyRatingPreventOnExpiry(
        Address5
      )
    ).to.equal(1);
  });
  it("Verifiable Identity Prevents on Expiry Contract: After a token is expired the `getUserCountryCodePreventOnExpiry` from the VerifiableIdentity contract should revert", async () => {
    // current plus 5
    const set = timestamp + 5;
    // TOKEN INFO: tokenId 1 country code "1" , userType 2 ,level 3, expiry block NOW, tokenURI - tokenONE
    await ProofOfIdentityContract.issueIdentity(
      Address4,
      "1",
      2,
      3,
      set,
      "tokenONE"
    );
    //time stamp was on mint so this should revert
    await time.increase(time.duration.days(2));
    //should revert and not return values 7 seconds past
    await expectRevert.unspecified(
      VerifiableIdentity.getUserCountryCodePreventOnExpiry(
        Address4
      ),
      ""
    );
  });
  it("Verifiable Identity Prevents on Expiry Contract: If a token is NOT expired the `getUserAccountTypePreventExpiry`from the VerifiableIdentity contract should provide accurate information", async () => {
    // ensures block.timestamp provided is not expired by adding 5000 seconds
    const notExpiredTimeStamp = timestamp + 50000000;
    // TOKEN INFO: tokenId 2 country code "4" , userType 5 ,level 6, expiry block - 78886932789, tokenURI tokenONE
    await ProofOfIdentityContract.issueIdentity(
      Address5,
      "4",
      5,
      6,
      notExpiredTimeStamp,
      "tokenTWO"
    );
    //awaits information from Address5 whos token is not expired for 5000 seconds past the start of the test
    expect(
      await VerifiableIdentity.getUserTypePreventOnExpiry(
        Address5
      )
    ).to.equal(5);
  });
  it("Verifiable Identity Prevents on Expiry Contract: After a token is NOT expired the `getUserLevelPreventExpiry` from the VerifiableIdentity contract should provide accurate information", async () => {
    // ensures block.timestamp provided is not expired by adding 5000 seconds
    const notExpiredTimeStamp = timestamp + 500000;
    // TOKEN INFO: tokenId 2 country code "4" , userType 5 ,level 6, expiry block - 78886932789, tokenURI tokenONE
    await ProofOfIdentityContract.issueIdentity(
      Address5,
      "4",
      5,
      6,
      notExpiredTimeStamp,
      "tokenTWO"
    );
    //awaits information from Address5 whos token is not expired for 5000 seconds past the start of the test
    expect(
      await VerifiableIdentity.getUserLevelPreventOnExpiry(
        Address5
      )
    ).to.equal(6);
  });
  it("Verifiable Identity Prevents on Expiry Contract: After a token is NOT expired the `getUserCountryCodePreventExpiry` from the VerifiableIdentity contract contract should provide accurate information", async () => {
    //ensures block.timestamp provided is not expired by adding 5000 seconds
    const notExpiredTimeStamp = timestamp + 500000;
    // TOKEN INFO: tokenId 2 country code "4" , userType 5 ,level 6, expiry block - 78886932789, tokenURI tokenONE
    await ProofOfIdentityContract.issueIdentity(
      Address5,
      "4",
      5,
      6,
      notExpiredTimeStamp,
      "tokenTWO"
    );
    // awaits information from Address5 whos token is not expired for 5000 seconds past the start of the test
    expect(
      await VerifiableIdentity.getUserCountryCodePreventOnExpiry(
        Address5
      )
    ).to.equal("4");
  });
});
