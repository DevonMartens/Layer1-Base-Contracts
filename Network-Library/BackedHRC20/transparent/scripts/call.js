const {ethers} = require("hardhat");

async function main() {
//const address = '0x21b4b2a36e7829849D43d353fa7FD646bc2185E3'; //OG
//const address ="0xfBC036A84Ecc5788BAFA73Bd88518ef5710054D6"; //setUp
//const address = "0x7a612AfeF1Acb89f8FE12ba4084D83ecAbD8Fd3F";//unchained
//const address = "0xb5EF686d472B35faa2F09400f5b8c7DC756947B4"//unchained grant
const address = '0xE588C684a97E6Bd71c71639DA02cDb412Dfc87E3';//defual
//const address = "0x633BdE8f5247b8e1630Fb616eE9a4bE6f13CB567";//

  const Box = await ethers.getContractFactory('BackedHRC20');
  const box = await Box.attach(address);
  const own = await box.DEFAULT_ADMIN_ROLE();
  console.log(own)
   const log = await box.issueBackedToken("0x7102dc57665234F8d68Fcf84F31f45263c59c3b3", 7);
   console.log(log)
}
//"0x7102dc57665234F8d68Fcf84F31f45263c59c3b3", 900


// BackedHRC20Contract deployed to 0xE588C684a97E6Bd71c71639DA02cDb412Dfc87E3
//     BackedHRC20Contract proxy address deployed to 0xaFc7d943Da3f841F6Bf6bDDF2aC6dcbC26C600c7
//     BackedHRC20Contract admin address is 0x038f13Ff5b4B9F08595E473F7e2aCF266d241d1F

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })