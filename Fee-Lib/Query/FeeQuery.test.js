const { expect } = require("chai");
const { ethers } = require("hardhat");

const { expectRevert } = require("@openzeppelin/test-helpers");

describe("FeeQuery Contract", function () {
  describe("WILL RENAME: FeeQuery Contract imports.", function () {
    let FeeQueryContract;
    beforeEach(async () => {
      const FeeQueryFactory = await ethers.getContractFactory("FeeQuery");
      FeeQueryContract = await FeeQueryFactory.deploy();
    });
    it("FeeQuery Contract: Deployed independently with no contract inheriting it epochLength should be 0.", async () => {
      const epochLength = await FeeQueryContract.epochLength();
      expect(epochLength.toString()).to.deep.equal("0");
    });
    it("FeeQuery Contract: Deployed independently with no contract inheriting it the fee value should be 0.", async () => {
      const fee = await FeeQueryContract.fee();
      expect(fee.toString()).to.deep.equal("0");
    });
    it("FeeQuery Contract: Deployed independently with no contract inheriting it requiredReset should be 0.", async () => {
      const requiredReset = await FeeQueryContract.requiredReset();
      expect(requiredReset.toString()).to.equal("0");
    });
    it("FeeQuery Contract: Deployed independently with no contract inheriting it getFee() should return resetFee()", async () => {
      await expectRevert(FeeQueryContract.getFee(), "resetFee()");
    });
    let FeeOracleContract;
    beforeEach(async () => {
      const FeeOracleFactory = await ethers.getContractFactory("FeeOracle");
      FeeOracleContract = await FeeOracleFactory.deploy();
    });
    it("FeeQuery Contract: The function getFee with an oracle but no feeContract should return 0.", async () => {
      await FeeOracleContract.setRequiredReset(3926785679272);
      const FeeFromContract = await FeeOracleContract.getFee();
      expect(FeeFromContract.toString()).to.deep.equal("0");
    });
    it("FeeQuery Contract: The function getFee will return the fee amount unless the requiredReset is more than the current timestamp.", async () => {
      await expectRevert(FeeOracleContract.getFee(), "resetFee()");
      await FeeOracleContract.setRequiredReset(3926785679272);
      const FeeFromContract = await FeeOracleContract.getFee();
      expect(FeeFromContract.toString()).to.deep.equal("0");
    });
  });
});
