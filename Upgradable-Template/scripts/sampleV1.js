const { ethers, upgrades } = require("hardhat");

async function main() {

  const Sample = await hre.ethers.getContractFactory("Sample");

  //Param initalize function param 42
  const sample = await upgrades.deployProxy(Sample, [42], {
    initializer: "initialize", kind: 'uups'
  });

  await sample.deployed();

  console.log(
    `Sample deployed deployed to ${sample.address}`
  );
}

// this will send 3 transactions
// implementation "Sample" - verify script 
  // npx hardhat verify network NETWORK 0x...
// Initialize function will be in storage contract
 // - to get this you tell the explorer this is a proxy contract and give the location of implementation - do we have proxy contract verification

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
