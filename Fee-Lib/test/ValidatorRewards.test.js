const ValidatorRewards = artifacts.require("ValidatorRewards");
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

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

contract("ValidatorRewards", async ([owner, alice, bob, random, joe, karen, yan]) => {


    describe("Token Management                   ", () => {
        /**  
        ================================================
        |        Inital Contract Values                |
        ================================================
        **/		
		

        it("ValidatorRewards should recieve ether", async () => {
            //example wieghts 100% of bounty 1/1
            const wieghts = [1, 2, 3];
            //address of validators in validator rewards
            const vadliadorAddressArray = [owner, random, bob]
            //this is the contract we are looking at Validator Rewards.
            const VR = await deployProxy(ValidatorRewards, [vadliadorAddressArray, wieghts, owner, owner], { initializer: 'initialize' });
            //Ether send by owner
            await web3.eth.sendTransaction({to:VR.address, from:joe, value: web3.utils.toWei('1')})
            
        });
        it("ValidatorRewards should distribute ether as intended - via releaseAll view function `released` also should track the distribution", async () => {
            //example wieghts 100% of bounty 1/1
            const wieghts = [1, 1];
            //address of validators in validator rewards
            const vadliadorAddressArray = [bob, random];
            //this is the contract we are looking at Validator Rewards.
            const VR = await deployProxy(ValidatorRewards, [vadliadorAddressArray, wieghts, owner, owner], { initializer: 'initialize' });
            //Ether send by owner
            await web3.eth.sendTransaction({to:VR.address, from:joe, value: web3.utils.toWei('10')});
            //contract balance
            const contractBalance = await web3.eth.getBalance(VR.address);
            //release funds
            await VR.releaseAll({from:joe});
            //get bobs info
            const check = await VR.released(bob);
            //stringfy bob info
            const strBobRel = check.toString();
            //get randoms info
            const check2 = await VR.released(random);
            //stringfy randoms info
            const strRandomRel = check2.toString();
            assert.equal(
                "5000000000000000000",
                strBobRel,
                strRandomRel
            );
            //example distributionWeights 100% of bounty 1/1
            const weights2 = [1, 2, 3];
            //address of validators in validator rewards
            const vadliadorAddressArray2 = [karen, alice, yan];
            //this is the contract we are looking at Validator Rewards.
            const VR2 = await deployProxy(ValidatorRewards, [vadliadorAddressArray2, weights2, owner, owner], { initializer: 'initialize' });
            //Ether send by owner
            await web3.eth.sendTransaction({to:VR2.address, from:joe, value: web3.utils.toWei('6')});
            //release funds
            await VR2.releaseAll({from:joe});
            //get karen info
            const checkkaren = await VR2.released(karen);
            //stringfy karen info
            const strkarenRel = checkkaren.toString();
            // 1/6 of "6000000000000000000"
            assert.equal(
                "1000000000000000000",
                strkarenRel,
            );
            //get alice info
            const checkAlice = await VR2.released(alice);
            //stringfy alice info
            const strAliceRel = checkAlice.toString();
            // 1/3 of "6000000000000000000"
            assert.equal(
                "2000000000000000000",
                strAliceRel,
            );
            //get yan info
            const checkyan = await VR2.released(yan);
            //stringfy randoms info
            const stryanRel = checkyan.toString();
            // 1/2 of "6000000000000000000"
            assert.equal(
                "3000000000000000000",
                stryanRel,
            );
        });
        it("ValidatorRewards should distribute ether as intended - via release function for a single user", async () => {
            //example distributionWeights 100% of bounty 1/1
            const wieghts = [1, 1];
            //address of validators in validator rewards
            const vadliadorAddressArray = [bob, random];
            //this is the contract we are looking at Validator Rewards.
            const VR = await deployProxy(ValidatorRewards, [vadliadorAddressArray, wieghts, owner, owner], { initializer: 'initialize' });
            //Ether send by owner
            await web3.eth.sendTransaction({to:VR.address, from:joe, value: web3.utils.toWei('2')});
            //contract balance
            const contractBalance = await web3.eth.getBalance(VR.address);
            //get releaseable info for bob
            const checkBob = await VR.released(bob);
            //stringfy karen info
            const strBobRel = checkBob.toString();
            // 1/2 of "2000000000000000000"
            assert.equal(
                "0",
                strBobRel,
            );
            //get alic
            //release funds
            await VR.release(bob, {from:joe});
            //get bobs info
            const checkAgain = await VR.released(bob);
            //stringfy bob info
            const strBobAgain = checkAgain.toString();
            //ensure 0 
            assert.equal(
                "1000000000000000000",
                strBobAgain
            );
        });
        it("ValidatorRewards validators function should return the validators address from the array indec", async () => {
            //example wieghts 100% of bounty 1/1
            const wieghts = [1, 1];
            //address of validators in validator rewards
            const vadliadorAddressArray = [bob, random];
            //this is the contract we are looking at Validator Rewards.
            const VR = await deployProxy(ValidatorRewards, [vadliadorAddressArray, wieghts, owner, owner], { initializer: 'initialize' });
            //check array
            const indexZip = await VR.validators(0);
            //asserts bob if the first index of the array
            assert.equal(
                bob,
                indexZip
            );
            //index 1
            const indexUno = await VR.validators(1);
            //asserts random is the seconindex of the array
            assert.equal(
                random,
                indexUno
            );
            
        });
    });
    describe("Testing the view functions                  ", () => {
        /**  
        ================================================
        |    View Function Scenerios and Return Values |
        ================================================
        **/		
		

        it("totalShares should return the sum of all of the shares", async () => {
            //example wieghts 100% of bounty 1/1
            const wieghts = [1, 2, 3];
            //address of validators in validator rewards
            const vadliadorAddressArray = [owner, random, bob]
            //this is the contract we are looking at Validator Rewards.
            const VR = await deployProxy(ValidatorRewards, [vadliadorAddressArray, wieghts, owner, owner], { initializer: 'initialize' });
            //Ether send by owner
            const num = await VR.totalShares();
            //num toString
            const check = num.toString();
            assert.equal(
                check,
                "6"
            );            
        });
        it("the view function totalReleased() should account for the amount of Ether distributed from the contract", async () => {
            //example wieghts 100% of bounty 1/1
            const wieghts = [1, 1];
            //address of validators in validator rewards
            const vadliadorAddressArray = [bob, random]
            //this is the contract we are looking at Validator Rewards.
            const VR = await deployProxy(ValidatorRewards, [vadliadorAddressArray, wieghts, owner, owner], { initializer: 'initialize' });
            //Ether send by owner to contract
            await web3.eth.sendTransaction({to:VR.address, from:joe, value: web3.utils.toWei('10')});
            //contract balance
            const contractBalance = await web3.eth.getBalance(VR.address);
            //make sure eth made it to contract
            assert.notEqual(
                0,
                contractBalance
            );
            //end funds
            await VR.releaseAll({from:joe});
            const totalReleased = await VR.totalReleased();
            const viewME = totalReleased.toString();
            //string contract balance
            const intendedRelease = web3.utils.toWei('10');
            const stringBalance = intendedRelease.toString();
            assert.equal(
                viewME,
                stringBalance
            );
        });
        it("the view function shares() should return the number of shares each account holds", async () => {
            //example wieghts 100% of bounty 1/1
            const wieghts = [1, 12];
            //address of validators in validator rewards
            const vadliadorAddressArray = [bob, random]
            //this is the contract we are looking at Validator Rewards.
            const VR = await deployProxy(ValidatorRewards, [vadliadorAddressArray, wieghts, owner, owner], { initializer: 'initialize' });
            //random shares
            const rShares = await VR.shares(random);
            //random shares to string
            const rSharesStr = rShares.toString();
            assert.equal(
                "12",
                rSharesStr
            );
            //random shares
            const bShares = await VR.shares(bob);
            //random shares to string
            const bSharesStr = bShares.toString();
            assert.equal(
                "1",
                bSharesStr
            );
        });
        it("the view function releasable() should return the amount of ether each reciepnt can get", async () => {
            //example wieghts 100% of bounty 1/1
            const wieghts = [1, 4];
            //address of validators in validator rewards
            const vadliadorAddressArray = [bob, random]
            //this is the contract we are looking at Validator Rewards.
            const VR = await deployProxy(ValidatorRewards, [vadliadorAddressArray, wieghts, owner, owner], { initializer: 'initialize' });
            //sends ether to contract
            await web3.eth.sendTransaction({to:VR.address, from:joe, value: web3.utils.toWei('5')});
            //bobs ether owned
            const bobGets = await VR.releasable(bob);
            //stringify
            const stringBobGets = bobGets.toString();
            //expect for bob
            const expectForBob = web3.utils.toWei('1').toString()
            //check expected = result
            assert.equal(
              stringBobGets,
              expectForBob  
            );
            //bobs ether owned
            const randomGets = await VR.releasable(random);
            //stringify
            const stringRandomGets = randomGets.toString();
            //expect for bob
            const expectForRandom = web3.utils.toWei('4').toString()
            //check expected = result
            assert.equal(
              stringRandomGets,
              expectForRandom  
            );
        });
    });
    describe("Validator Management                  ", () => {
        /**  
        ================================================
        |        Validator Management Functions        |
        ================================================
        **/		
		

        it("adjustValidatorShares should adjust validator shares and change the payment", async () => {
            //example wieghts 100% of bounty 1/1
            const wieghts = [1, 2, 2];
            //address of validators in validator rewards
            const vadliadorAddressArray = [owner, random, bob]
            //this is the contract we are looking at Validator Rewards.
            const VR = await deployProxy(ValidatorRewards, [vadliadorAddressArray, wieghts, owner, owner], { initializer: 'initialize' });
            //Ether send by owner
            const num = await VR.totalShares();
            //num toString
            const check = num.toString();
            assert.equal(
                check,
                "5"
            );  
            await VR.adjustValidatorShares(owner, 2);
            //Ether send by owner
            const newNum = await VR.totalShares();
            //num toString
            const checkAgain = newNum.toString();
            assert.equal(
                checkAgain,
                "6"
            );  
            const ownerNewShares = await VR.shares(owner);
            const ownerSharesToString = ownerNewShares.toString();
            assert.equal(
                "2",
                ownerSharesToString
            );
            //send eth to contract
            await web3.eth.sendTransaction({to:VR.address, from:joe, value: web3.utils.toWei('3')});
            //call release all
            await VR.releaseAll({from:joe});
            //get owner release info
            //get bobs info
            const checkOwner = await VR.released(owner);
            //stringfy bob info
            const strOwnerFunds = checkOwner.toString();
            //release to owner should be 1
            assert.equal(
                "1000000000000000000",
                strOwnerFunds
            );
            });
        it("adjustValidatorShares will revert if the address isnt already in the validaotors array", async () => {
            //example wieghts 100% of bounty 1/1
                const wieghts = [1, 2, 2];
                //address of validators in validator rewards
                const vadliadorAddressArray = [owner, random, bob]
                //this is the contract we are looking at Validator Rewards.
                const VR = await deployProxy(ValidatorRewards, [vadliadorAddressArray, wieghts, owner, owner], { initializer: 'initialize' });
                await expectRevert(
                    VR.adjustValidatorShares(
                        karen,
                        0
                    ),
                    "127"
                );
                });
            it("adjustValidatorAddress should adjust validator address that recieves payment", async () => {
                //example wieghts 100% of bounty 1/1
                const wieghts = [1, 1, 1];
                //address of validators in validator rewards
                const vadliadorAddressArray = [owner, random, bob]
                //this is the contract we are looking at Validator Rewards.
                const VR = await deployProxy(ValidatorRewards, [vadliadorAddressArray, wieghts, owner, owner], { initializer: 'initialize' });
                const ogOwnerShares = await VR.shares(owner);
                const ogOwnerSharesString = ogOwnerShares.toString();
                //checks that owner has a share
                assert.equal(
                    ogOwnerSharesString,
                    "1"
                ); 
                //giving owner shares to joe
                await VR.adjustValidatorAddress(0, joe);
                //checking owner shares
                const ownerNewShares = await VR.shares(owner);
                const ownerSharesToString = ownerNewShares.toString();
                //checks that it's 0
                assert.equal(
                    "0",
                    ownerSharesToString
                );
                //send eth to contract
                await web3.eth.sendTransaction({to:VR.address, from:joe, value: web3.utils.toWei('3')});
                //verify owner gets none of that
                const ownerGetsNone = await VR.releasable(owner);
                const ownerGetsNoneStr = ownerGetsNone.toString();
                //check that it's 0
                assert.equal(
                    "0",
                    ownerGetsNoneStr
                );
                //call release all
                await VR.releaseAll({from:karen});
                //checks what owner got - should be none
                const checkOwner = await VR.released(owner);
                //stringfy bob info
                const strOwnerFunds = checkOwner.toString();
                //release to owner should be 0
                assert.equal(
                    "0",
                    strOwnerFunds
                );
                //check that joe got eth
                //checks what owner got - should be none
                const checkJoe = await VR.released(joe);
                //stringfy bob info
                const strJoeFunds = checkJoe.toString();
                //release to owner should be 0
                assert.equal(
                    "1000000000000000000",
                    strJoeFunds
                );

        });
        it("Add validator should change the dispersed payments and totalShares amounts and correctly pay all validators", async () => {
            //example wieghts 100% of bounty 1/1
            const wieghts = [1, 1];
            //address of validators in validator rewards
            const vadliadorAddressArray = [bob, random]
            //this is the contract we are looking at Validator Rewards.
            const VR = await deployProxy(ValidatorRewards, [vadliadorAddressArray, wieghts, owner, owner], { initializer: 'initialize' });
            //sends ether to contract
            await web3.eth.sendTransaction({to:VR.address, from:owner, value: web3.utils.toWei('2')});
            //bobs ether owned
            const bobGets = await VR.releasable(bob);
            //stringify
            const stringBobGets = bobGets.toString();
            //expect for bob
            const expectForBob = web3.utils.toWei('1').toString()
            //check expected = result
            assert.equal(
              stringBobGets,
              expectForBob  
            );
            //random owed
            const randomGets = await VR.releasable(random);
            //stringify
            const stringRandomGets = randomGets.toString();
            //expect for bob
            const expectForAll = web3.utils.toWei('1').toString()
            //check expected = result
            assert.equal(
              stringRandomGets,
              expectForAll 
            );
            //brings contract to three eth so all expected splits are maintained
            await web3.eth.sendTransaction({to:VR.address, from:owner, value: web3.utils.toWei('1')});
            //adds yser
            
            await VR.addValidator(yan, 1);
            //gets expected splits for every user
            //bob owed
            const bobGetsNOW = await VR.releasable(bob);
            //stringify
            const stringBobGetsNOW = bobGetsNOW.toString();
            //yan owned
            const yanGets = await VR.releasable(yan);
            //stringify
            const stringYanGetsNOW  = yanGets.toString();
            //random
            //random owed
            const randomGetsNOW = await VR.releasable(random);
            //stringify
            const stringRandomGetsNOW = randomGetsNOW.toString();
            //checks everyones
            assert.equal(
                stringBobGetsNOW,
                stringYanGetsNOW,
                stringRandomGetsNOW,
                expectForAll 
              );
        });
    });
 });
