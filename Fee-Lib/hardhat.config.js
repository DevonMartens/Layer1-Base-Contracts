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
  // networks: {
  //   ropsten: {
  //     url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
  //     accounts: [process.env.PRI_KEY],
  //   },
  // },
  // etherscan: {
  //   apiKey: process.env.ETHERSCAN_API_KEY,
  // },
};
