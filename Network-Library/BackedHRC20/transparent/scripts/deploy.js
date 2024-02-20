const { ethers, upgrades } = require("hardhat");

async function main() {
  BackedHRC20Factory = await ethers.getContractFactory("BackedHRC20");

  //Varaibles to go into the contract
  // dummy anmounts change as you see fit
  const NameOfToken = "TEST";
  const SymbolOfToken = "DMM";
  const HavenFoundationAddress = "0x7102dc57665234F8d68Fcf84F31f45263c59c3b3";
  const NetworkOperatorAddress = "0x7102dc57665234F8d68Fcf84F31f45263c59c3b3";

  BackedHRC20Contract = await upgrades.deployProxy(
    BackedHRC20Factory,
    [
      NameOfToken,
      SymbolOfToken,
      8,
      HavenFoundationAddress,
      NetworkOperatorAddress,
    ],
    {
      initializer: "initialize", proxy: {
        proxyContract: "OpenZeppelinTransparentProxy",
    } 
    }
  );


await BackedHRC20Contract.deployed();

const currentImplementationAddress = await upgrades.erc1967.getImplementationAddress(BackedHRC20Contract.address);
const AdminAddress = await upgrades.erc1967.getAdminAddress(BackedHRC20Contract.address);

  console.log(
    `BackedHRC20Contract deployed to ${BackedHRC20Contract.address}
    BackedHRC20Contract proxy address deployed to ${currentImplementationAddress}
    BackedHRC20Contract admin address is ${AdminAddress}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

