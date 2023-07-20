const { expect } = require("chai");
const { ethers, hre } = require("hardhat");

let Sample, sample;

describe("Sample (proxy)", function () {
  it("retrieve returns a value previously initialized", async function () {
    Sample = await ethers.getContractFactory("Sample");
    sample = await upgrades.deployProxy(Sample, [42], {
      initializer: "initialize",
      kind: "uups",
    });
  });
  it("upgrades", async function () {
    Sample = await ethers.getContractFactory("Sample");
    sample = await upgrades.deployProxy(Sample, [42], {
      initializer: "initialize",
      kind: "uups",
    });
    const SampleV2 = await ethers.getContractFactory("SampleV2");
    samplev2 = await upgrades.upgradeProxy(sample.address, SampleV2, {
      kind: "uups",
    });
  });
});
