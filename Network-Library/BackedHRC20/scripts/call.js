const {ethers} = require("hardhat");

async function main() {
//const address = '0x21b4b2a36e7829849D43d353fa7FD646bc2185E3'; //OG
//const address ="0xfBC036A84Ecc5788BAFA73Bd88518ef5710054D6"; //setUp
//const address = "0x7a612AfeF1Acb89f8FE12ba4084D83ecAbD8Fd3F";//unchained
//const address = "0xb5EF686d472B35faa2F09400f5b8c7DC756947B4"//unchained grant
//const address = "0x4A9FA21d39E75bB7772ea1E45A5BbC71dd3bBD96";//defual
const address = "0x35a8A0c17F39986A15a522c3A765e421006e5900";
  const Contract = await ethers.getContractFactory('BackedHRC20');
  const contract = await Contract.attach(address);
  const own = await contract.DEFAULT_ADMIN_ROLE();
  console.log(own)
   const log = await contract.issueBackedToken("0x7102dc57665234F8d68Fcf84F31f45263c59c3b3", 900);
   console.log(log)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })