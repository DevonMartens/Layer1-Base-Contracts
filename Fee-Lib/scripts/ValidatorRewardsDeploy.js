const { ethers, upgrades } = require("hardhat");

async function main() {

    ValidatorRewardsFactory = await ethers.getContractFactory(
        "ValidatorRewards"
      );

  //Varaibles to go into the contract
  // dummy anmounts change as you see fit
  const ArrayOfValidatorAddresses = [0x21312, 0x123123];
  const ArrayOfValidatorWieghts = [1,2];
  const HavenFoundationAddress = 0x123;
  const NetworkOperatorAddress = 0x3423;

  
  ValidatorContract = await upgrades.deployProxy(
    ValidatorRewardsFactory,
    [
       ArrayOfValidatorAddresses,
       ArrayOfValidatorWieghts,
       HavenFoundationAddress,
       NetworkOperatorAddress
    ],
    { initializer: "initialize", kind: "uups" }
  );

  await ValidatorContract.deployed();

  console.log(
    `ValidatorContract deployed deployed to ${ValidatorContract.address}`
  );
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
