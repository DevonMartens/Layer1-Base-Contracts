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
    { initializer: "initialize",  proxy: {
        proxyContract: "OpenZeppelinTransparentProxy",
    } 
      } 
  );


  await ProofOfIdentityContract.deployed();

  const currentImplementationAddress = await upgrades.erc1967.getImplementationAddress(ProofOfIdentityContract.address);
  const AdminAddress = await upgrades.erc1967.getAdminAddress(ProofOfIdentityContract.address);

  console.log(
    `ProofOfIdentityContract deployed to ${ProofOfIdentityContract.address}
       ProofOfIdentityContract proxy address deployed to ${currentImplementationAddress}
       ProofOfIdentityContract admin address is ${AdminAddress}
    `
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});