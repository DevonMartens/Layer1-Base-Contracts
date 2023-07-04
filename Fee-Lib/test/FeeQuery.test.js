const { expect } = require("chai");
const { ethers } = require("hardhat");

const { expectRevert } = require("@openzeppelin/test-helpers");

describe("FeeQuery Basic Expectations", function () {
  let FeeQueryContract;
  beforeEach(async () => {
    const FeeQueryFactory = await ethers.getContractFactory("FeeQuery");
    FeeQueryContract = await FeeQueryFactory.deploy();
  });
  it("With out another contract inherited epochLength should be 0", async () => {
    const epochLength = await FeeQueryContract.epochLength();
    expect(epochLength.toString()).to.deep.equal("0");
  });
  it("With out another contract inherited fee should be 0", async () => {
    const fee = await FeeQueryContract.fee();
    expect(fee.toString()).to.deep.equal("0");
  });
  it("With out another contract inherited requiredReset should be 0", async () => {
    const requiredReset = await FeeQueryContract.requiredReset();
    expect(requiredReset.toString()).to.deep.equal("0");
  });
  it("With out another contract inherited getFee() should return resetFee(", async () => {
    await expectRevert(FeeQueryContract.getFee(), "resetFee()");
  });
});
describe("FeeQuery Basic Expectations", function () {
  let FeeOracleContract;
  beforeEach(async () => {
    const FeeOracleFactory = await ethers.getContractFactory("FeeOracle");
    FeeOracleContract = await FeeOracleFactory.deploy();
  });
  it("With out another contract inherited epochLength should be 0", async () => {
    await FeeOracleContract.setRequiredReset(3926785679272);
    const FeeFromContract = await FeeOracleContract.getFee();
    expect(FeeFromContract.toString()).to.deep.equal("0");
  });
  it("If the requiredReset is less than the timestamp revert with resetFee else return fee", async () => {
    await expectRevert(FeeOracleContract.getFee(), "resetFee()");
    await FeeOracleContract.setRequiredReset(3926785679272);
    const FeeFromContract = await FeeOracleContract.getFee();
    expect(FeeFromContract.toString()).to.deep.equal("0");
  });
});
