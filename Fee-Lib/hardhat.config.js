require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@nomiclabs/hardhat-solhint");
require("solidity-docgen");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.2",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },

    docgen: {},
  },
  networks: {
    hardhat: {
      mining: {
        blockGasLimit: 100000000, // Set a high block gas limit
      },
    },
  },
};


