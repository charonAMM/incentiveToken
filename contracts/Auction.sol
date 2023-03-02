//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.17;

import "./interfaces/IERC20.sol";
import "./interfaces/ICFC.sol";
import "./Token.sol";

/**
 @title Auction
 @dev charon incentive token (CIT), a token with an auction for minting
 */
contract Auction is Token{

    ICFC public charonFeeContract;
    IERC20 public bidToken;
    uint256 public auctionFrequency;
    uint256 public mintAmount;

    //bid variables
    uint256 public currentTopBid;
    uint256 public endDate;
    address public topBidder;

    //events
    event AuctionClosed(address _winner, uint256 _amount);
    event NewAuctionStarted(uint256 _endDate);
    event NewTopBid(address _bidder, uint256 _amount);


    /**
     * @dev starts the CIT token and auction (minting) mechanism
     * @param _bidToken token to be used 
     * @param _mintAmount amount of tokens to mint each auction
     * @param _auctionFrequency time between auctions (e.g. 86400 = daily)
     * @param _cfc address of charon fee contract for passing auction proceeds
     * @param _name string name of CIT token
     * @param _symbol string symbol of CIT token
     * @param _initSupply init base supply sent to msg.sender
     */
    constructor(address _bidToken,
                uint256 _mintAmount,
                uint256 _auctionFrequency,
                address _cfc,
                string memory _name,
                string memory _symbol,
                uint256 _initSupply) Token(_name,_symbol){
        bidToken = IERC20(_bidToken);
        mintAmount = _mintAmount;
        auctionFrequency = _auctionFrequency;
        charonFeeContract = ICFC(_cfc);
        endDate = block.timestamp + _auctionFrequency;
        _mint(msg.sender,_initSupply);
    }

    /**
     * @dev allows a user to bid on the mintAmount of CIT tokens
     * @param _amount amount of your bid
     */
    function bid(uint256 _amount) external{
        require(block.timestamp < endDate, "auction must be ongoing");
        require(_amount > currentTopBid, "must be top bid");
        require(bidToken.transferFrom(msg.sender,address(this),_amount), "must get tokens");
        if(currentTopBid > 0){
            require(bidToken.transfer(topBidder,currentTopBid), "must send back tokens");
        }
        topBidder = msg.sender;
        currentTopBid = _amount;
        emit NewTopBid(msg.sender, _amount);
    }

    /**
     * @dev pays out the winner of the auction and starts a new one
     */
    function startNewAuction() external{
        require(block.timestamp >= endDate, "auction must be over");
        _mint(topBidder, mintAmount);
        if(currentTopBid > 0){
            bidToken.approve(address(charonFeeContract), currentTopBid);
            charonFeeContract.addFees(currentTopBid,false);
        }
        emit AuctionClosed(topBidder, currentTopBid);
        endDate = block.timestamp + auctionFrequency; // just restart it...
        topBidder = msg.sender;
        currentTopBid = 0;
        emit NewTopBid(msg.sender, 0);
    }
}