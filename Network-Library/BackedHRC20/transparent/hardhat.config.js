require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@nomiclabs/hardhat-solhint");
require("solidity-docgen");
require('hardhat-storage-layout');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    networks: {
      haven1: {
        url: "https://apne1-goquorum-rpcnode0.dev.haven1.org/",
        chainId: 810,
        accounts: ['d77bd78404c88cf07a3388f3e8303479e4ee46ce320e9352c8111a56fb17a0ae'],
      },
      sepolia: {
        url: "https://sepolia.infura.io/v3/ec98a7d5eedc49e2a2810d6eef5d418e",
        accounts: ['d77bd78404c88cf07a3388f3e8303479e4ee46ce320e9352c8111a56fb17a0ae']
      }
      },


  solidity: "0.8.19",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  docgen: {},
  },
  etherscan: {
    apiKey: {
    haven1: "xx"
  },
  customChains: [
    {
      network: "haven1",
      chainId: 810,
      urls: {
        apiURL: "https://blockex.yldint.com/api/v1",
        browserURL: "https://dev-explore.haven1.org/"
      }
    }
  ]
}
};