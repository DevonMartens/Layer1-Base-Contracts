const { ethers, upgrades } = require("hardhat");

async function main() {
  const FeeContractFactory = await hre.ethers.getContractFactory("FeeContract");

  // Variables to go into the contract
  // dummy amounts change as you see fit
  const DeploymentBaseFee = 12;
  const OracleContractAddress = 0x2432;
  const ArrayOfChannelAddresses = [0x21312, 0x123123];
  const ArrayOfInputWeights = [1, 2];
  const HavenFoundationAddress = 0x123;
  const NetworkOperatorAddress = 0x3423;

  //Param initialize function param 42
  const FeeContract = await upgrades.deployProxy(
    FeeContractFactory,
    [
      DeploymentBaseFee,
      OracleContractAddress,
      ArrayOfChannelAddresses,
      ArrayOfInputWeights,
      HavenFoundationAddress,
      NetworkOperatorAddress,
    ],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  await FeeContract.deployed();

  console.log(`FeeContract deployed deployed to ${FeeContract.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
