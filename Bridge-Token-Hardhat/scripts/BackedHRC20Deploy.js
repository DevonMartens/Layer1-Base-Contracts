const { ethers, upgrades } = require("hardhat");

async function main() {
  BackedHRC20Factory = await ethers.getContractFactory("BackedHRC20");

  //Varaibles to go into the contract
  // dummy anmounts change as you see fit
  const NameOfToken = "DEVON MARGARET MARTENS";
  const SymbolOfToken = "DMM";
  const HavenFoundationAddress = 0x123;
  const NetworkOperatorAddress = 0x3423;

  BackedHRC20Contract = await upgrades.deployProxy(
    BackedHRC20Factory,
    [
      NameOfToken,
      SymbolOfToken,
      HavenFoundationAddress,
      NetworkOperatorAddress,
    ],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  await BackedHRC20Contract.deployed();

  console.log(
    `BackedHRC20Contract deployed deployed to ${BackedHRC20Contract.address}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
