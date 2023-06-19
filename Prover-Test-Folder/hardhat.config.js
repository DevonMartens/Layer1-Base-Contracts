require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
// require("@nomicfoundation/hardhat-toolbox");


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.2",
    settings: {
                optimizer: {
                    enabled: true,
                    runs: 200
                },
          },
     ganache: {
            url: "http://127.0.0.1:7545",
            chainId: "31337 ",
            accounts: [
              `0xA2f721809Fc53337B841C6dDE1AaB0A115FDd3C9`,
              `0x6D8ad8c9590B1fC57dB9c9e4B93D2464525Ec87c`,
`0x7877E6c1B8cBfcBd3E5f9Ea3CC343AF0b44A43d2`
            ]

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