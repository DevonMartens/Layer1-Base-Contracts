require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@nomiclabs/hardhat-solhint");
require("hardhat-contract-sizer");
require("solidity-docgen");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  docgen: {},
  solidity: {
    version: "0.8.2",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  }
};
