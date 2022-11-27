const { ethers } = require("hardhat");
const web3 = require('web3');
const { expect, assert } = require("chai");
const h = require("usingtellor/test/helpers/helpers.js");

describe("incentive token - e2e tests", function() {
    let incentiveToken,token,accounts;
    beforeEach(async function () {
        accounts = await ethers.getSigners();
        let fac = await ethers.getContractFactory("MockERC20");
        token = await fac.deploy("mock token", "MT");
        await token.deployed();
        fac = await ethers.getContractFactory("Auction");
        incentiveToken = await fac.deploy(token.address,web3.utils.toWei("2000"),86400*7,accounts[1].address,"Charon Incentive Token","CIT",web3.utils.toWei("100000"));
        await incentiveToken.deployed();
    });
    it("test no bids", async function() {
        await token.mint(accounts[2].address, web3.utils.toWei("300"));
        await token.connect(accounts[2]).approve(incentiveToken.address,web3.utils.toWei("300"))
        await incentiveToken.connect(accounts[2]).bid(web3.utils.toWei("100"))
        await expect(incentiveToken.startNewAuction()).to.be.reverted;//auction must be over
        await h.advanceTime(86400*7)//7 days
        await incentiveToken.connect(accounts[4]).startNewAuction()
        assert(await token.balanceOf(accounts[4].address) == 0, "No bidder should have no payment tokens")
        assert(await incentiveToken.balanceOf(accounts[4].address) == 0 , "should have no tokens yet")
        assert(await incentiveToken.topBidder() == accounts[4].address, "msg.sender should be top bidder")
        assert(await incentiveToken.currentTopBid() == 0, "Top bid should be zero")
        await h.advanceTime(86400*7)//7 days
        let ed1 = await incentiveToken.endDate()
        await incentiveToken.startNewAuction()
        assert(await incentiveToken.balanceOf(accounts[4].address) - await incentiveToken.mintAmount() == 0, "CIT should be minted")
        assert(await incentiveToken.endDate() >= ed1 + 86400 * 7, "endDate should add another week")
        assert(await incentiveToken.topBidder() == accounts[0].address, "msg.sender should be top bidder")
        assert(await incentiveToken.currentTopBid() == 0, "Top bid should be zero again")
    });
    it("test multiple no bids w/ long time between", async function() {
        await token.mint(accounts[2].address, web3.utils.toWei("300"));
        await token.connect(accounts[2]).approve(incentiveToken.address,web3.utils.toWei("300"))
        await incentiveToken.connect(accounts[2]).bid(web3.utils.toWei("100"))
        await expect(incentiveToken.startNewAuction()).to.be.reverted;//auction must be over
        await h.advanceTime(86400*7)//7 days
        await incentiveToken.connect(accounts[4]).startNewAuction()
        assert(await token.balanceOf(accounts[4].address) == 0, "No bidder should have no payment tokens")
        assert(await incentiveToken.balanceOf(accounts[4].address) == 0 , "should have no tokens yet")
        assert(await incentiveToken.topBidder() == accounts[4].address, "msg.sender should be top bidder")
        assert(await incentiveToken.currentTopBid() == 0, "Top bid should be zero")
        await h.advanceTime(86400*21)//7 days
        let ed1 = await incentiveToken.endDate()
        await incentiveToken.connect(accounts[5]).startNewAuction()
        assert(await incentiveToken.balanceOf(accounts[4].address) - await incentiveToken.mintAmount() == 0, "CIT should be minted")
        assert(await incentiveToken.endDate() >= ed1 + 86400 * 21, "endDate should add another week")
        assert(await incentiveToken.topBidder() == accounts[5].address, "msg.sender should be top bidder")
        assert(await incentiveToken.currentTopBid() == 0, "Top bid should be zero again")
        await h.advanceTime(86400*8)//7 days
        ed1 = await incentiveToken.endDate()
        await incentiveToken.connect(accounts[5]).startNewAuction()
        assert(await incentiveToken.balanceOf(accounts[5].address) - await incentiveToken.mintAmount() == 0, "CIT should be minted")
        assert(await incentiveToken.endDate() >= ed1 + 86400 * 8, "endDate should add another week")
        assert(await incentiveToken.topBidder() == accounts[5].address, "msg.sender should be top bidder")
        await h.advanceTime(86400*14)//7 days
        ed1 = await incentiveToken.endDate()
        await incentiveToken.connect(accounts[5]).startNewAuction()
        assert(await incentiveToken.balanceOf(accounts[5].address) - 2 * await incentiveToken.mintAmount() == 0, "CIT should be minted")
        assert(await incentiveToken.endDate() >= ed1 + 86400 * 14, "endDate should add another week")
    });
    it("test throw on even bid", async function() {
        await token.mint(accounts[2].address, web3.utils.toWei("300"));
        await token.connect(accounts[2]).approve(incentiveToken.address,web3.utils.toWei("300"))
        await incentiveToken.connect(accounts[2]).bid(web3.utils.toWei("100"))
        await token.mint(accounts[3].address, web3.utils.toWei("300"));
        await token.connect(accounts[3]).approve(incentiveToken.address,web3.utils.toWei("300"))
        await expect(incentiveToken.connect(accounts[3]).bid(web3.utils.toWei("100")))//throw on even amount
    });
    it("test multiple bidders and top switches", async function() {
    });
    it("test same wallet bids twice", async function() {
    });
});