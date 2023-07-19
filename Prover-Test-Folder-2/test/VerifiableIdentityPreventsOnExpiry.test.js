const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const { expectRevert } = require("@openzeppelin/test-helpers");



const blobForAddress3 =  {
  largeNumbers: [2, 7888693278],
  smallNumbers: [5, 6],
  strings: ["1",]
};

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
    const blobForAddress2ExpiresSoon =  {
      largeNumbers: [1, set],
      smallNumbers: [2, 3],
      strings: ["1",]
    };
    await ProofOfIdentityContract.issueIdentity(
      Address2,
      blobForAddress2ExpiresSoon,
      "tokenONE"
    );
    //time stamp was on mint so this should revert
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(10000);
    //should revert and not return values 7 seconds past
    await expectRevert(
      VerifiableIdentityPreventsOnExpiry.getUserTypePreventOnExpiry(
        Address2
      ),
      "103"
    );
  });
  //
  it("Verifiable Identity Prevents on Expiry Contract: Verifiable Identity Prevents on Expiry getUserExpiry should get the expiry or revert if expired", async () => {
    const set = timestamp + 5;
    const blobForAddress2ExpiresSoon =  {
      largeNumbers: [1, set],
      smallNumbers: [2, 3],
      strings: ["1",]
    };

    await ProofOfIdentityContract.issueIdentity(
      Address2,
      blobForAddress2ExpiresSoon,
      "tokenONE"
    );
    expect(
      await VerifiableIdentityPreventsOnExpiry.getUserExpiry(Address2)
    ).to.equal(set);
  });
  // it("Verifiable Identity Prevents on Expiry Contract: The identity blobs in the Proof Of IdentityContract and Verifiable Identity Prevents on Expirey should be the same", async () => {
  //   const set = timestamp + 5;
  //   const blobForAddress2ExpiresSoon =  {
  //     largeNumbers: [1, set],
  //     smallNumbers: [2, 3],
  //     strings: ["1",]
  //   };

  //   await ProofOfIdentityContract.issueIdentity(
  //     Address2,
  //     blobForAddress2ExpiresSoon,
  //     "tokenONE"
  //   );
  //   expect(
  //     await ProofOfIdentityContract.getUserAccountIdentityBlob(Address2)
  //   ).to.deep.equal(
  //     await VerifiableIdentityPreventsOnExpiry.getUserIdentityData(Address2)
  //   );
  // });
  it("Verifiable Identity Prevents on Expiry Contract: After a token is expired the `getUserAccountLevelPreventOnExpiry` from the VerifiableIdentityPreventsOnExpiry contract should revert", async () => {
    // current plus 5
    const set = timestamp + 5;
    const blobForAddress2ExpiresSoon =  {
      largeNumbers: [1, set],
      smallNumbers: [2, 3],
      strings: ["1",]
    };

    await ProofOfIdentityContract.issueIdentity(
      Address2,
      blobForAddress2ExpiresSoon,
      "tokenONE"
    );
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(8000);
    //should revert and not return values 7 seconds past
    await expectRevert(
      VerifiableIdentityPreventsOnExpiry.getUserLevelPreventOnExpiry(
        Address2
      ),
      "103"
    );
  });
  it("Verifiable Identity Prevents on Expiry Contract: After a token is expired the `getUserAccountCountryCodePreventOnExpiry` from the VerifiableIdentityPreventsOnExpiry contract should revert", async () => {
    // current plus 5
    const set = timestamp + 3;
    const blobForAddress2ExpiresSoon =  {
      largeNumbers: [1, set],
      smallNumbers: [2, 3],
      strings: ["1",]
    };

    await ProofOfIdentityContract.issueIdentity(
      Address2,
      blobForAddress2ExpiresSoon,
      "tokenONE"
    );
    //time stamp was on mint so this should revert
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(7000);
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
    // does not expire soon
    const blobForAddress3DoesNotExpiresSoon =  {
      largeNumbers: [1, notExpiredTimeStamp],
      smallNumbers: [5, 6],
      strings: ["4",]
    };

    // TOKEN INFO: tokenId 2 country code "4" , userType 5 ,level 6, expiry block - 78886932789, tokenURI tokenONE
    await ProofOfIdentityContract.issueIdentity(
      Address3,
      blobForAddress3DoesNotExpiresSoon,
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
 const notExpiredTimeStamp = timestamp + 50000000;
 // does not expire soon
 const blobForAddress3DoesNotExpiresSoon =  {
   largeNumbers: [1, notExpiredTimeStamp],
   smallNumbers: [5, 6],
   strings: ["4",]
 };

 // TOKEN INFO: tokenId 2 country code "4" , userType 5 ,level 6, expiry block - 78886932789, tokenURI tokenONE
 await ProofOfIdentityContract.issueIdentity(
   Address3,
   blobForAddress3DoesNotExpiresSoon,
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
    // ensures block.timestamp provided is not expired by adding 5000 seconds
    const notExpiredTimeStamp = timestamp + 50000000;
    // does not expire soon
    const blobForAddress3DoesNotExpiresSoon =  {
      largeNumbers: [1, notExpiredTimeStamp],
      smallNumbers: [5, 6],
      strings: ["4",]
    };

    // TOKEN INFO: tokenId 2 country code "4" , userType 5 ,level 6, expiry block - 78886932789, tokenURI tokenONE
    await ProofOfIdentityContract.issueIdentity(
      Address3,
      blobForAddress3DoesNotExpiresSoon,
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
