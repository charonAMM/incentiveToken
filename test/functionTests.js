const { expect } = require("chai");
const { ethers } = require("hardhat");
const web3 = require('web3');

describe("incentive token - function tests", function() {
    let incentiveToken,mockERC20,accounts;
    beforeEach(async function () {
        accounts = await ethers.getSigners();
        let fac = await ethers.getContractFactory("MockERC20");
        mockERC20 = await fac.deploy("mock payment token", "MPT");
        await mockERC20.deployed();

        fac = await ethers.getContractFactory("Auction");
        incentiveToken = await fac.deploy(mockERC20.address,web3.utils.toWei("2000"),86400*7,accounts[1].address,"Charon Incentive Token","CIT",web3.utils.toWei("100000"));
        await incentiveToken.deployed();
    });
    it("constructor()", async function() {
    });
    it("bid()", async function() {
    });
    it("startNewAuction()", async function() {
    });
    it("approve()", async function() {
    });
    it("transfer()", async function() {
    });
    it("transferFrom()", async function() {
    });
    it("allowance()", async function() {
    });
    it("balanceOf()", async function() {
    });
    it("decimals()", async function() {
    });
    it("name()", async function() {
    });
    it("symbol()", async function() {
    });
    it("totalSupply()", async function() {
    });
    it("_mint()", async function() {
    });
    it("_burn()", async function() {
    });
    it("_move()", async function() {
    });
});
