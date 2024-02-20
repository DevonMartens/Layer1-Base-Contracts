// JavaScript
import { ethers, network, run } from "hardhat";

async function verifyContract() {
    const chainId = network.config.chainId;

    const simepleStorageFactory = await ethers.getContractFactory(
        "SimpleStorage"
    );

    const args = [];
    
    console.log(`Deploying...`);
    const simpleStorage = await simepleStorageFactory.deploy(args);
    await simpleStorage.deployed();
    console.log(`Deployed!`);
    console.log(`Simple Storage Address: ${simpleStorage.address}`);

    console.log(`Waiting for blocks confirmations...`);
    await simpleStorage.deployTransaction.wait(6);
    console.log(`Confirmed!`);

    // * only verify on testnets or mainnets.
    if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
        await verify(simpleStorage.address
            //, args
            );
    }
}

const verify = async (contractAddress
    //, args
    ) => {
    console.log("Verifying contract...");
    try {
        await run("verify:verify", {
            address: contractAddress,
            // constructorArguments: args,
        });
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already verified!");
        } else {
            console.log(e);
        }
    }
};

verifyContract()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });