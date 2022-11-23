//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.17;

import "./interfaces/IERC20.sol";
import "./Token.sol";

//have token that is minted by weekly auction
// set token to accept, set mint amount / frequency, set contract to send proceeds to

contract Auction is Token{

    IERC20 public bidToken;
    uint256 public mintAmount;
    uint256 public auctionFrequency;
    address public charonFeeContract;

    //bid variables
    uint256 public endDate;
    uint256 public currentTopBid;
    address public topBidder;

    //events
    event NewTopBid(address _bidder, uint256 _amount);
    event AuctionClosed(address _winner, uint256 _amount);
    event NewAuctionStarted(uint256 _endDate);

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
        charonFeeContract = _cfc;
        endDate = block.timestamp + _auctionFrequency;
        _mint(msg.sender,_initSupply);
    }

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

    function startNewAuction() external{
        require(block.timestamp >= endDate, "auction must be over");
        _mint(topBidder, mintAmount);
        if(currentTopBid > 0){
            bidToken.transfer(charonFeeContract, currentTopBid);
        }
        emit AuctionClosed(topBidder, currentTopBid);
        endDate = endDate + auctionFrequency; // if no one does this func for a week, you win on zero bids
        topBidder = msg.sender;
        currentTopBid = 0;
        emit NewTopBid(msg.sender, 0);
    }
}