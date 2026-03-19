require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("@nomicfoundation/hardhat-chai-matchers");
require("hardhat-gas-reporter");
require("solidity-coverage");

require("dotenv").config();

const POLYGON_MUMBAI_RPC = process.env.POLYGON_MUMBAI_RPC || "https://rpc-mumbai.maticvigil.com";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    polygonMumbai: {
      url: POLYGON_MUMBAI_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 80001
    }
  },
  etherscan: {
    apiKey: {
      polygonMumbai: POLYGONSCAN_API_KEY
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "INR",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
