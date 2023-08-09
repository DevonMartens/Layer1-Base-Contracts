const { ethers, upgrades } = require("hardhat");

async function main() {
  
  const permissionsInterface = 0x21312;
  const HavenFoundationAddress = 0x123;
  const NetworkOperatorAddress = 0x3423;

  ProofOfIdentityFactory = await ethers.getContractFactory("ProofOfIdentity");

  ProofOfIdentityContract = await upgrades.deployProxy(
    ProofOfIdentityFactory,
    [
      permissionsInterface,
      HavenFoundationAddress,
      NetworkOperatorAddress,
    ],
    { initializer: "initialize", kind: "uups" }
  );


  await ProofOfIdentityContract.deployed();

  console.log(
    `ProofOfIdentityContract deployed deployed to ${ProofOfIdentityContract.address}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});