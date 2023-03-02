const { ethers } = require("hardhat");
const web3 = require('web3');
const { expect, assert } = require("chai");
const h = require("usingtellor/test/helpers/helpers.js");

describe("incentive token - e2e tests", function() {
    let incentiveToken,token,accounts,cfc;
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
    it("test no bids", async function() {
        await token.mint(accounts[2].address, web3.utils.toWei("300"));
        await h.expectThrow(incentiveToken.connect(accounts[2]).bid(web3.utils.toWei("100")))//no approval
        await token.connect(accounts[2]).approve(incentiveToken.address,web3.utils.toWei("300"))
        await incentiveToken.connect(accounts[2]).bid(web3.utils.toWei("100"))
        await h.expectThrow(incentiveToken.startNewAuction())//auction must be over
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
        await h.expectThrow(incentiveToken.startNewAuction())//auction must be over
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
        await incentiveToken.connect(accounts[2]).bid(web3.utils.toWei("100"))
        assert(await incentiveToken.topBidder() == accounts[2].address, "msg.sender should be top bidder")
    });
    it("test throw on even bid", async function() {
        await token.mint(accounts[2].address, web3.utils.toWei("300"));
        await token.connect(accounts[2]).approve(incentiveToken.address,web3.utils.toWei("300"))
        await incentiveToken.connect(accounts[2]).bid(web3.utils.toWei("100"))
        await token.mint(accounts[3].address, web3.utils.toWei("300"));
        await token.connect(accounts[3]).approve(incentiveToken.address,web3.utils.toWei("300"))
        await expect(incentiveToken.connect(accounts[3]).bid(web3.utils.toWei("100")))//throw on even amount
        await incentiveToken.connect(accounts[3]).bid(web3.utils.toWei("101"))
        assert(await incentiveToken.topBidder() == accounts[3].address, "msg.sender should be top bidder")
    });
    it("test multiple bidders and top switches", async function() {
        //bid 1
        await token.mint(accounts[2].address, web3.utils.toWei("300"));
        await token.connect(accounts[2]).approve(incentiveToken.address,web3.utils.toWei("300"))
        await incentiveToken.connect(accounts[2]).bid(web3.utils.toWei("100"))
        await h.expectThrow(incentiveToken.startNewAuction());//auction must be over
        await h.advanceTime(86400*7)//7 days
        let ed1 = await incentiveToken.endDate()
        await incentiveToken.startNewAuction()
        assert(await incentiveToken.balanceOf(accounts[2].address) - await incentiveToken.mintAmount() == 0, "CIT should be minted")
        assert(await token.balanceOf(cfc.address) == web3.utils.toWei("100"), "CFC should get top bid")
        assert(await incentiveToken.endDate() >= ed1 + 86400 * 7, "endDate should add another week")
        assert(await incentiveToken.topBidder() == accounts[0].address, "msg.sender should be top bidder")
        assert(await incentiveToken.currentTopBid() == 0, "Top bid should be zero")
        await h.expectThrow(incentiveToken.startNewAuction());//auction must be over
        //bid 2
        await token.mint(accounts[3].address, web3.utils.toWei("300"));
        await token.connect(accounts[3]).approve(incentiveToken.address,web3.utils.toWei("300"))
        await token.mint(accounts[4].address, web3.utils.toWei("300"));
        await token.connect(accounts[4]).approve(incentiveToken.address,web3.utils.toWei("300"))
        await incentiveToken.connect(accounts[3]).bid(web3.utils.toWei("100"))
        await incentiveToken.connect(accounts[4]).bid(web3.utils.toWei("150"))
        await incentiveToken.connect(accounts[3]).bid(web3.utils.toWei("200"))
        await h.expectThrow(incentiveToken.startNewAuction());//auction must be over
        await h.advanceTime(86400*7)//7 days
        ed1 = await incentiveToken.endDate()
        await incentiveToken.connect(accounts[3]).startNewAuction()
        assert(await incentiveToken.balanceOf(accounts[3].address) - await incentiveToken.mintAmount() == 0, "CIT should be minted")
        assert(await token.balanceOf(cfc.address) == web3.utils.toWei("300"), "CFC should get another top bid")
        assert(await token.balanceOf(accounts[3].address) == web3.utils.toWei("100"), "should have 200 less tokens")
        assert(await token.balanceOf(accounts[4].address) == web3.utils.toWei("300"), "should have no less tokens")
        assert(await incentiveToken.endDate() >= ed1 + 86400 * 7, "endDate should add another week")
        assert(await incentiveToken.topBidder() == accounts[3].address, "msg.sender should be top bidder")
        assert(await incentiveToken.currentTopBid() == 0, "Top bid should be zero")
        //bid 3 - no bids
        await h.advanceTime(86400*7)//7 days
        await incentiveToken.startNewAuction()
        assert(await incentiveToken.balanceOf(accounts[3].address) - 2 * await incentiveToken.mintAmount() == 0, "CIT should be minted")
        assert(await token.balanceOf(cfc.address) == web3.utils.toWei("300"), "CFC should get top bid")
        assert(await token.balanceOf(accounts[3].address) == web3.utils.toWei("100"), "should have 200 less tokens")
        assert(await incentiveToken.topBidder() == accounts[0].address, "msg.sender should be top bidder")
        //bid 4
        await token.mint(accounts[5].address, web3.utils.toWei("300"));
        await token.connect(accounts[5]).approve(incentiveToken.address,web3.utils.toWei("300"))
        await token.mint(accounts[6].address, web3.utils.toWei("300"));
        await token.connect(accounts[6]).approve(incentiveToken.address,web3.utils.toWei("300"))
        await token.mint(accounts[7].address, web3.utils.toWei("300"));
        await token.connect(accounts[7]).approve(incentiveToken.address,web3.utils.toWei("300"))
        await incentiveToken.connect(accounts[4]).bid(web3.utils.toWei("100"))
        await incentiveToken.connect(accounts[5]).bid(web3.utils.toWei("101"))
        await incentiveToken.connect(accounts[6]).bid(web3.utils.toWei("102"))
        await incentiveToken.connect(accounts[7]).bid(web3.utils.toWei("103"))
        await incentiveToken.connect(accounts[5]).bid(web3.utils.toWei("104"))
        await incentiveToken.connect(accounts[6]).bid(web3.utils.toWei("105"))
        await incentiveToken.connect(accounts[7]).bid(web3.utils.toWei("150"))
        await h.advanceTime(86400*7)//7 days
        await incentiveToken.startNewAuction()
        assert(await incentiveToken.balanceOf(accounts[7].address) - await incentiveToken.mintAmount() == 0, "CIT should be minted")
        assert(await token.balanceOf(cfc.address) == web3.utils.toWei("450"), "CFC should get top bid")
        assert(await token.balanceOf(accounts[4].address) == web3.utils.toWei("300"), "should have not lost tokens")
        assert(await token.balanceOf(accounts[5].address) == web3.utils.toWei("300"), "should have not lost tokens")
        assert(await token.balanceOf(accounts[7].address) == web3.utils.toWei("150"), "should have 150 less tokens")
        assert(await token.balanceOf(accounts[6].address) == web3.utils.toWei("300"), "should have no less tokens")
    });
    it("test same wallet bids twice", async function() {
        await token.mint(accounts[2].address, web3.utils.toWei("300"));
        await token.connect(accounts[2]).approve(incentiveToken.address,web3.utils.toWei("300"))
        await incentiveToken.connect(accounts[2]).bid(web3.utils.toWei("100"))
        await h.expectThrow(incentiveToken.connect(accounts[2]).bid(web3.utils.toWei("100")));//auction must be over
        await incentiveToken.connect(accounts[2]).bid(web3.utils.toWei("200"))
        await h.expectThrow(incentiveToken.startNewAuction());//auction must be over
        await h.advanceTime(86400*7)//7 days
        let ed1 = await incentiveToken.endDate()
        await incentiveToken.startNewAuction()
        assert(await incentiveToken.balanceOf(accounts[2].address) - await incentiveToken.mintAmount() == 0, "CIT should be minted")
        assert(await token.balanceOf(cfc.address) == web3.utils.toWei("200"), "CFC should get top bid")
        assert(await incentiveToken.endDate() >= ed1 + 86400 * 7, "endDate should add another week")
        assert(await incentiveToken.topBidder() == accounts[0].address, "msg.sender should be top bidder")
        assert(await incentiveToken.currentTopBid() == 0, "Top bid should be zero")
        await h.expectThrow(incentiveToken.startNewAuction())//auction must be over
        assert(await token.balanceOf(accounts[2].address) == web3.utils.toWei("100"), "should have 200 less tokens")
        await h.advanceTime(86400*7)//7 days
        await incentiveToken.startNewAuction()
    });
});