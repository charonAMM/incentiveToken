const { ethers } = require("hardhat");
const web3 = require('web3');
const { expect, assert } = require("chai");
const h = require("usingtellor/test/helpers/helpers.js");

describe("incentive token - function tests", function() {
    let incentiveToken,token,accounts,tellor,oracle,cfc;
    beforeEach(async function () {
        accounts = await ethers.getSigners();
        let fac = await ethers.getContractFactory("MockERC20");
        token = await fac.deploy("mock token", "MT");
        await token.deployed();
        fac = await ethers.getContractFactory("MockCFC");
        cfc = await fac.deploy(token.address,accounts[1].address);
        await cfc.deployed();
        fac = await ethers.getContractFactory("Auction");
        incentiveToken = await fac.deploy(token.address,web3.utils.toWei("2000"),86400*7,cfc.address,"Charon Incentive Token","CIT",web3.utils.toWei("100000"));
        await incentiveToken.deployed();
    });
    it("constructor()", async function() {
        console.log("Auction.sol")
        assert(await incentiveToken.bidToken() == token.address, "token should be set")
        assert(await incentiveToken.mintAmount() == web3.utils.toWei("2000"), "mint amount should be set")
        assert(await incentiveToken.auctionFrequency() == 86400*7, "auction frequency should be set")
        assert(await incentiveToken.charonFeeContract() == cfc.address, "cfc should be set")
        assert(await incentiveToken.endDate() > 0 , "first end date should be set")
        assert(await incentiveToken.balanceOf(accounts[0].address) == web3.utils.toWei("100000"), "init supply should be minted")
        assert(await incentiveToken.name() == "Charon Incentive Token", "name should be set")
        assert(await incentiveToken.symbol() == "CIT", "symbol should be set")
    });
    it("bid()", async function() {
        await token.mint(accounts[2].address, web3.utils.toWei("300"));
        await token.connect(accounts[2]).approve(incentiveToken.address,web3.utils.toWei("300"))
        await incentiveToken.connect(accounts[2]).bid(web3.utils.toWei("100"))
        assert(await incentiveToken.topBidder() == accounts[2].address, "top bidder should be account 2")
        assert(await incentiveToken.currentTopBid() == web3.utils.toWei("100"), "top bid should be 100")
        await token.mint(accounts[3].address, web3.utils.toWei("120"));
        await expect(incentiveToken.connect(accounts[3]).bid(web3.utils.toWei("120"))).to.be.reverted;//must get tokens
        await token.connect(accounts[3]).approve(incentiveToken.address,web3.utils.toWei("120"))
        await expect(incentiveToken.connect(accounts[3]).bid(web3.utils.toWei("80"))).to.be.reverted;//must be top bid
        await incentiveToken.connect(accounts[3]).bid(web3.utils.toWei("120"))
        assert(await token.balanceOf(accounts[2].address) == web3.utils.toWei("300"), "account 2 should get tokens back")
        assert(await token.balanceOf(accounts[3].address) == 0, "account 3 should have no tokens")
        assert(await incentiveToken.topBidder() == accounts[3].address, "top bidder should be account 3")
        assert(await incentiveToken.currentTopBid() == web3.utils.toWei("120"), "top bid should be 120")
        await h.advanceTime(86400*7)//7 days
        await expect(incentiveToken.connect(accounts[2]).bid(web3.utils.toWei("200"))).to.be.reverted;//must be within the timeframe
    });
    it("startNewAuction()", async function() {
        await token.mint(accounts[2].address, web3.utils.toWei("300"));
        await token.connect(accounts[2]).approve(incentiveToken.address,web3.utils.toWei("300"))
        await incentiveToken.connect(accounts[2]).bid(web3.utils.toWei("100"))
        await expect(incentiveToken.startNewAuction()).to.be.reverted;//auction must be over
        await h.advanceTime(86400*7)//7 days
        let ed1 = await incentiveToken.endDate()
        await incentiveToken.startNewAuction()
        assert(await incentiveToken.balanceOf(accounts[2].address) - await incentiveToken.mintAmount() == 0, "CIT should be minted")
        assert(await token.balanceOf(cfc.address) == web3.utils.toWei("100"), "CFC should get top bid")
        assert(await incentiveToken.endDate() >= ed1 + 86400 * 7, "endDate should add another week")
        assert(await incentiveToken.topBidder() == accounts[0].address, "msg.sender should be top bidder")
        assert(await incentiveToken.currentTopBid() == 0, "Top bid should be zero")
        await expect(incentiveToken.startNewAuction()).to.be.reverted;//auction must be over
    });
    it("constructor()", async function() {
        console.log("Token.sol")
            assert(await token.name() == "mock token")
            assert(await token.symbol() == "MT")
    });
    it("approve()", async function() {
        await token.connect(accounts[2]).approve(accounts[3].address,web3.utils.toWei("200"))
        assert(await token.allowance(accounts[2].address,accounts[3].address) == web3.utils.toWei("200"))
    });
    it("transfer()", async function() {
        await token.mint(accounts[2].address,web3.utils.toWei("100"))
        await token.connect(accounts[2]).transfer(accounts[3].address,web3.utils.toWei("20"))
        assert(await token.balanceOf(accounts[3].address) == web3.utils.toWei("20"), "transfer should work")
        await expect(token.connect(accounts[3]).transfer(accounts[5].address,web3.utils.toWei("100"))).to.be.reverted;
    });
    it("transferFrom()", async function() {
        await token.mint(accounts[2].address,web3.utils.toWei("100"))
        await token.connect(accounts[2]).approve(accounts[4].address,web3.utils.toWei("20"))
        await token.connect(accounts[4]).transferFrom(accounts[2].address,accounts[3].address,web3.utils.toWei("20"))
        assert(await token.balanceOf(accounts[3].address) == web3.utils.toWei("20"), "transfer should work")
        await expect(token.connect(accounts[3]).transferFrom(accounts[5].address,accounts[3].address,web3.utils.toWei("100"))).to.be.reverted;
    });
    it("decimals()", async function() {
        assert(await token.decimals() == 18, "decimals should be correct")
    });
    it("totalSupply()", async function() {
        await token.mint(accounts[2].address,web3.utils.toWei("100"))
        await token.mint(accounts[3].address,web3.utils.toWei("100"))
        await token.mint(accounts[4].address,web3.utils.toWei("100"))
        assert(await token.totalSupply() == web3.utils.toWei("300"))
    });
    it("_mint()", async function() {
        await token.mint(accounts[2].address,web3.utils.toWei("100"))
        assert(await token.balanceOf(accounts[2].address) == web3.utils.toWei("100"), "mint balance should be correct")
    });
    it("_burn()", async function() {
        await token.mint(accounts[2].address,web3.utils.toWei("100"))
        await token.burn(accounts[2].address,web3.utils.toWei("20"))
        assert(await token.balanceOf(accounts[2].address) == web3.utils.toWei("80"), "burn should work")
        await expect(token.connect(accounts[3]).burn(accounts[2].address,web3.utils.toWei("100"))).to.be.reverted;
        });
});
