const { ethers, upgrades } = require("hardhat");

//Get proxy address
const PROXY = "";

//deploy function
async function main() {
  const SampleV2 = await hre.ethers.getContractFactory("SampleV2");
  await upgrades.upgradeProxy(PROXY, SampleV2);

  console.log(`Sample upgraded to sample V2`);
}

// this will send 3 transactions
// implementation "Sample" - verify script
// npx hardhat verify network NETWORK 0x...
// Initialize function will be in storage contract
// - to get this you tell the explorer this is a proxy contract and give the location of implementation - do we have proxy contract verification
// does the explorer have read/write as proxy tabs
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
