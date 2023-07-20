const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const { expectRevert } = require("@openzeppelin/test-helpers");

describe("Testing the the Verifiable Identity Prevents on Expiry output and reverts are as expected", function () {
  let ProofOfIdentityContract;
  let ContractDeployer;
  let Address2;
  let Address3;
  let VerifiableIdentityPreventsOnExpiry;
  let timestamp;
  beforeEach(async () => {
    const ProofOfIdentity = await ethers.getContractFactory("ProofOfIdentity");
    const IPermissionsInterface = await ethers.getContractFactory(
      "DummyPermissionsContract"
    );
    const IPermissionsInterfaceDummyInstance =
      await IPermissionsInterface.deploy();
    //get addresses for this test
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
  it("Verifiable Identity Prevents on Expiry Contract: After a token is expired the `getUserTypePreventOnExpiry`from the VerifiableIdentityPreventsOnExpiry contract should revert", async () => {
    const set = timestamp + 5;
    // TOKEN INFO: tokenId 1 country code "1" , userType 2 ,level 3, expiry block NOW, tokenURI - tokenONE
    await ProofOfIdentityContract.issueIdentity(
      Address2,
      "1",
      2,
      3,
      set,
      "tokenONE"
    );
    //time stamp was on mint so this should revert
    await time.increase(time.duration.days(2));
    //should revert and not return values 7 seconds past
    await expectRevert(
      VerifiableIdentityPreventsOnExpiry.getUserTypePreventOnExpiry(Address2),
      "103"
    );
  });
  //
  it("Verifiable Identity Prevents on Expiry Contract: Verifiable Identity Prevents on Expiry getUserExpiry should get the expiry or revert if expired", async () => {
    const set = timestamp + 5;
    await ProofOfIdentityContract.issueIdentity(
      Address2,
      "1",
      2,
      3,
      set,
      "tokenONE"
    );
    expect(
      await VerifiableIdentityPreventsOnExpiry.getUserExpiry(Address2)
    ).to.equal(set);
  });
  it("Verifiable Identity Prevents on Expiry Contract: The identity blobs in the Proof Of IdentityContract and Verifiable Identity Prevents on Expirey should be the same", async () => {
    const set = timestamp + 5;
    await ProofOfIdentityContract.issueIdentity(
      Address2,
      "1",
      2,
      3,
      set,
      "tokenONE"
    );
    expect(
      await ProofOfIdentityContract.getUserAccountIdentityBlob(Address2)
    ).to.deep.equal(
      await VerifiableIdentityPreventsOnExpiry.getUserIdentityData(Address2)
    );
  });
  it("Verifiable Identity Prevents on Expiry Contract: After a token is expired the `getUserAccountLevelPreventOnExpiry` from the VerifiableIdentityPreventsOnExpiry contract should revert", async () => {
    // current plus 5
    const set = timestamp + 5;
    // TOKEN INFO: tokenId 1 country code "1" , userType 2 ,level 3, expiry block NOW, tokenURI - tokenONE
    await ProofOfIdentityContract.issueIdentity(
      Address2,
      "1",
      2,
      3,
      set,
      "tokenONE"
    );
    await time.increase(time.duration.days(2));
    //should revert and not return values 7 seconds past
    await expectRevert(
      VerifiableIdentityPreventsOnExpiry.getUserLevelPreventOnExpiry(
        Address2
      ),
      "103"
    );
  });
  it("Verifiable Identity Prevents on Expiry Contract: After a token is expired the `getUserCompetencyRatingPreventOnExpir`from the VerifiableIdentityPreventsOnExpiry contract should revert", async () => {
    const set = timestamp + 5;
    // TOKEN INFO: tokenId 1 country code "1" , userType 2 ,level 3, expiry block NOW, tokenURI - tokenONE
    await ProofOfIdentityContract.issueIdentity(
      Address2,
      "1",
      2,
      3,
      set,
      "tokenONE"
    );
    await ProofOfIdentityContract.establishCompetencyRating(Address2, 1);
    //time stamp was on mint so this should revert
    await time.increase(time.duration.days(2));
    //should revert and not return values 7 seconds past
    await expectRevert(
      VerifiableIdentityPreventsOnExpiry.getUserCompetencyRatingPreventOnExpiry(
        Address2
      ),
      "103"
    );
  });
  it("Verifiable Identity Prevents on Expiry Contract: After a token is NOT expired the `getUserCompetencyRatingPreventOnExpiry` from the VerifiableIdentityPreventsOnExpiry contract contract should provide accurate information", async () => {
    // TOKEN INFO: tokenId 2 country code "4" , userType 5 ,level 6, expiry block - 78886932789, tokenURI tokenONE
    await ProofOfIdentityContract.issueIdentity(
      Address3,
      "4",
      5,
      6,
      78886932657,
      "tokenTWO"
    );
  await ProofOfIdentityContract.establishCompetencyRating(Address3, 1);
  //should revert and not return values 7 seconds past
  expect(await 
    VerifiableIdentityPreventsOnExpiry.getUserCompetencyRatingPreventOnExpiry(
      Address3
    )).to.equal(1);
});
  it("Verifiable Identity Prevents on Expiry Contract: After a token is expired the `getUserCountryCodePreventOnExpiry` from the VerifiableIdentityPreventsOnExpiry contract should revert", async () => {
    // current plus 5
    const set = timestamp + 5;
    // TOKEN INFO: tokenId 1 country code "1" , userType 2 ,level 3, expiry block NOW, tokenURI - tokenONE
    await ProofOfIdentityContract.issueIdentity(
      Address2,
      "1",
      2,
      3,
      set,
      "tokenONE"
    );
    //time stamp was on mint so this should revert
    await time.increase(time.duration.days(2));
    //should revert and not return values 7 seconds past
    await expectRevert(
      VerifiableIdentityPreventsOnExpiry.getUserCountryCodePreventOnExpiry(
        Address2
      ),
      "103"
    );
  });
  it("Verifiable Identity Prevents on Expiry Contract: If a token is NOT expired the `getUserAccountTypePreventExpiry`from the VerifiableIdentityPreventsOnExpiry contract should provide accurate information", async () => {
    // ensures block.timestamp provided is not expired by adding 5000 seconds
    const notExpiredTimeStamp = timestamp + 50000000;
    // TOKEN INFO: tokenId 2 country code "4" , userType 5 ,level 6, expiry block - 78886932789, tokenURI tokenONE
    await ProofOfIdentityContract.issueIdentity(
      Address3,
      "4",
      5,
      6,
      notExpiredTimeStamp,
      "tokenTWO"
    );
    //awaits information from Address3 whos token is not expired for 5000 seconds past the start of the test
    expect(
      await VerifiableIdentityPreventsOnExpiry.getUserTypePreventOnExpiry(
        Address3
      )
    ).to.equal(5);
  });
  it("Verifiable Identity Prevents on Expiry Contract: After a token is NOT expired the `getUserLevelPreventExpiry` from the VerifiableIdentityPreventsOnExpiry contract should provide accurate information", async () => {
    // ensures block.timestamp provided is not expired by adding 5000 seconds
    const notExpiredTimeStamp = timestamp + 500000;
    // TOKEN INFO: tokenId 2 country code "4" , userType 5 ,level 6, expiry block - 78886932789, tokenURI tokenONE
    await ProofOfIdentityContract.issueIdentity(
      Address3,
      "4",
      5,
      6,
      notExpiredTimeStamp,
      "tokenTWO"
    );
    //awaits information from Address3 whos token is not expired for 5000 seconds past the start of the test
    expect(
      await VerifiableIdentityPreventsOnExpiry.getUserLevelPreventOnExpiry(
        Address3
      )
    ).to.equal(6);
  });
  it("Verifiable Identity Prevents on Expiry Contract: After a token is NOT expired the `getUserCountryCodePreventExpiry` from the VerifiableIdentityPreventsOnExpiry contract contract should provide accurate information", async () => {
    //ensures block.timestamp provided is not expired by adding 5000 seconds
    const notExpiredTimeStamp = timestamp + 500000;
    // TOKEN INFO: tokenId 2 country code "4" , userType 5 ,level 6, expiry block - 78886932789, tokenURI tokenONE
    await ProofOfIdentityContract.issueIdentity(
      Address3,
      "4",
      5,
      6,
      notExpiredTimeStamp,
      "tokenTWO"
    );
    // awaits information from Address3 whos token is not expired for 5000 seconds past the start of the test
    expect(
      await VerifiableIdentityPreventsOnExpiry.getUserCountryCodePreventOnExpiry(
        Address3
      )
    ).to.equal("4");
  });
});
