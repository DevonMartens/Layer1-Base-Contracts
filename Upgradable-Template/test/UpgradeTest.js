const { expect } = require('chai')

let Sample, sample

describe('Sample (proxy)', function () {

  it('retrieve returns a value previously initialized', async function () {
    Sample = await ethers.getContractFactory("Sample")
    sample = await upgrades.deployProxy(Sample, [42], {
      initializer: "initialize",
    })

  })
  it('upgrades', async function () {
    const SampleV2 = await ethers.getContractFactory("SampleV2")
    sample = await upgrades.upgradeProxy(sample.address, SampleV2)
  })
})