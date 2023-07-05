require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@nomiclabs/hardhat-solhint");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
  ganache: {
    url: "http://127.0.0.1:7545",
    chainId: "31337 ",
    accounts: [
      `0x3d50F2362150d3D34B0244D03c6be0b70f949fd2`,
      `0x610b97986aA98F8720D868a9B4A78014f4565418`,
      `0xbDA3e553DaD01b0D880eb6e22F2b80647164311F`,
      `0x27fC672857d8Cab5810D8C54a391273AF6df06f6`,
    ],
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
