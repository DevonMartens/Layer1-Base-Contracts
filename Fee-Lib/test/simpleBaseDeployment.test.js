
//This test test the splitters of all contracts
const ValidatorRewards = artifacts.require("ValidatorRewards");
// This contract distriubutes fees to the validators  and consults the oracle contract
const FeeContract = artifacts.require("FeeContract");
//this is the fake oracle contract 
const H1NativeApplication = artifacts.require("H1NativeApplication");
//test application
const SimpleStorageWithFee = artifacts.require("SimpleStorageWithFee");



const {
    expectRevert
} = require("@openzeppelin/test-helpers");
const catchRevert = require("./exceptionsHelpers.js").catchRevert;


require("./utils.js");

const _BN = web3.utils.BN;
const BN = (value) => {
    return new _BN(value)
}

/**  
================================================
| Begin contract test  & obtains user addresses|
================================================
**/

contract("SimpleStorageWithFee", async ([owner, alice, bob, random, joe, rhys, yan]) => {


    describe("Ether Management                   ", () => {
        /**  
        ================================================
        |        Inital Contract Values                |
        ================================================
        **/		

        it("All contracts should deploy", async () => {
            //example weight 100% of bounty 1/1
            //This is needed for both validator rewards and fee contract
            //it is the wieght of distribution
            const distributionWeights = [1,];
            //address of validators in validator rewards
            const vadliadorAddressArray = [owner,]
            const ValidatorRewardsContractDeployed = await ValidatorRewards.new(vadliadorAddressArray, distributionWeights, owner, owner);
            //to deploy the FeeContract we first need a fake oracle that will return the values
            const FakeOracleContractAddress = alice;
            //const oracle = "0x168E920888BEc539Fc136EF08cA3B4335E6c2066";
            //address array is a channel so the validator rewards contract works for this 
            const ValidatorRewardsContractAddress = ValidatorRewardsContractDeployed.address;
            //turns it into an array
            const validatorRewardsContractAddressArray = [ValidatorRewardsContractAddress,];
            //F is for fee contract


            const FeeContractDeployed = await FeeContract.new(FakeOracleContractAddress, validatorRewardsContractAddressArray, distributionWeights, owner, owner);
            //gets address of FeeContractDeployed
            const FeeContractDeployedAddress = FeeContractDeployed.address;
            //H1NativeApplication contains modifer to import into all contracts for recieving funds
            const H1NativeApplicationDeployed = await H1NativeApplication.new(FeeContractDeployedAddress);
            // get address of H1NativeApplicationDeployed 
            const H1NativeApplicationDeployedAddress = H1NativeApplicationDeployed.address;
            //simple storage for testing
            const SimpleStorageWithFeeDeployed = await SimpleStorageWithFee.new(H1NativeApplicationDeployedAddress);
            
            
           
            
        });
		
    });
 });

