const { ethers } = require("hardhat");

async function main() {
    const address = "0x394a3D9f6AE5e1cBeF39E811E1B42D2F6E4dF359";
    // Replace with your contract's name and the address where it's deployed
    const Contract = await ethers.getContractFactory('BackedHRC20');
    const contract = await Contract.attach(address);
    

    // Replace with the list of addresses you want to check
    const addressesToCheck = [
        "0x633BdE8f5247b8e1630Fb616eE9a4bE6f13CB567",
        "0xeDDf0682EdA46643b5ebF946e4b3e8Fa98dc4057",
        "0x0C0C865A6A0E14ac8b298C4349Dd3DC14fc52050",
        "0x7102dc57665234F8d68Fcf84F31f45263c59c3b3"
    ];

    console.log("Checking addresses for OPERATOR_ROLE...\n");

    for (let address of addressesToCheck) {
        const hasOperatorRole = await contract.hasRole(contract.OPERATOR_ROLE(), address);
        console.log(`Address ${address} has OPERATOR_ROLE: ${hasOperatorRole}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
