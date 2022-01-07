// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RC3Auction is
    Ownable,
    ERC721Holder,
    ReentrancyGuard {

    //state variables
    IERC721 private rc3;
    IERC20 private rcdy;
    uint public feePercentage;                  // 1% = 1000
    uint private DIVISOR;
    address public feeReceipient;

    //struct
    struct Auction {
        address seller;
        address highestBidder;
        uint initialBidAmount;
        uint highestBidAmount;
        uint startPeriod;
        uint endPeriod;
        uint bidCount;
        bool started;
    }

    //NFT address to token id to Auction struct
    mapping(uint => Auction) private auctions;

    //Events
    event AuctionUpdated(
        uint indexed _tokenId, 
        uint newEndPeriod
    );

    event AuctionCancelled(
        uint indexed tokenID
    );

    event AuctionResulted(
        address indexed highestBidder, 
        uint indexed tokenId, 
        uint highestBidAmount
    );

    event EndTimeUpdated(
        address indexed creator,
        uint indexed tokenId,
        uint newEndTime
    );

    event NewAuction(
        uint indexed tokenId,
        uint price,
        uint startPeriod,
        uint endPeriod,
        address indexed seller
    );

    event NewBid(
        address indexed bidder,
        uint indexed tokenId,
        uint price
    );

    event FeePercentageSet(
        address indexed sender, 
        uint feePercentage
    );

    event FeeReceipientSet(
        address indexed sender, 
        address feeReceipient
    );

    //Deployer
    constructor(
        address _rc3,
        address _feeReceipient, 
        uint _fee
        ) {
         
        _setFeeReceipient(_feeReceipient);
        _setFeePercentage(_fee);

        rc3 = IERC721(_rc3);
        DIVISOR = 100 * 1000;
    }

    //Modifier to check all conditions are met before bid
    modifier bidCheck(uint _tokenId) {
        
        Auction memory auction = auctions[_tokenId];
        uint endPeriod = auction.endPeriod;
        
        require(
            auction.seller != msg.sender,
            "Error: cannot bid own auction"
        );
        require(
            endPeriod != 0, 
            "Error: auction does not exist"
        );
        require(
            auction.startPeriod <= block.timestamp, 
            "Error: auction has not started"
        );
        require(
            endPeriod > block.timestamp, 
            "Error: auction has ended"
        );
        
        _;
    }


    ///-----------------///
    /// WRITE FUNCTIONS ///
    ///-----------------///


    function newAuction(
        uint _tokenId,
        uint _startsIn,
        uint _lastsFor,
        uint _initialBidAmount
        ) external returns(bool created) {

        Auction storage auction = auctions[_tokenId];
        require(
            auction.seller == address(0), 
            "Error: auction already exist"
        ); 

        require(
            _lastsFor != 0,
            "Error: must last for more than 0 seconds"
        );
        
        address nftOwner = rc3.ownerOf(_tokenId);
        if (!auction.started) {
            
            require(
                owner() == msg.sender,
                "Error: only admin can call"
            );

            rc3.safeTransferFrom(
                nftOwner, 
                address(this), 
                _tokenId
            );

            auction.started = true;

        } else {

            require(
                nftOwner == msg.sender,
                "Error: only NFT owner can call"
            );

            rc3.safeTransferFrom(
                msg.sender, 
                address(this), 
                _tokenId
            );
        }
        
        //create auction
        uint startsIn = block.timestamp + _startsIn;
        uint period = startsIn + _lastsFor;

        auction.startPeriod = startsIn;
        auction.endPeriod = period;
        auction.seller = nftOwner;
        auction.initialBidAmount = _initialBidAmount;
        
        emit NewAuction(
            _tokenId, 
            _initialBidAmount,
            startsIn,
            period, 
            nftOwner
        );

        return true;
    }

    function bid(
        uint _tokenId,
        uint _bidAmount) 
        external nonReentrant() 
        bidCheck(_tokenId) returns(bool bidded) {
        
        Auction storage auction = auctions[_tokenId];

        require(
            _bidAmount > 0 &&
            _bidAmount == _nextBidAmount(_tokenId),
            "Error: must bid with valid input. see nextBidAmount."
        );

        rcdy.transferFrom(
            msg.sender, address(this), _bidAmount
        );
        
        if(auction.bidCount != 0) 
        //return token to the prevous highest bidder
        rcdy.transfer(
            auction.highestBidder, auction.highestBidAmount
        );

        //update data
        auction.highestBidder = msg.sender;
        auction.highestBidAmount = _bidAmount; 
        auction.bidCount++;

        emit NewBid(
            msg.sender, 
            _tokenId, 
            _bidAmount
        );

        //increase countdown clock
        (,uint timeLeft) = _bidTimeRemaining(_tokenId);
        if (timeLeft < 1 hours) {
            timeLeft + 10 minutes <= 1 hours 
            ? auction.endPeriod += 10 minutes 
            : auction.endPeriod += (1 hours - timeLeft);
            
            (,uint newTimeLeft) = _bidTimeRemaining(_tokenId);
            
            emit AuctionUpdated(
                _tokenId, 
                block.timestamp + newTimeLeft
            );
        }

        return true;
    }
    
    function closeBid(
        uint _tokenId
        ) external nonReentrant() onlyOwner() returns(bool closed) {

        Auction storage auction = auctions[_tokenId];
        
        require(
            auction.seller != address(0), 
            "Error: auction does not exist"
        );
        
        (uint startTime, uint timeLeft) = _bidTimeRemaining(_tokenId);
        require(
            startTime == 0, 
            "Error: auction has not started"
        );
        require(
            timeLeft == 0, 
            "Error: auction has not ended"
        );
        
        uint highestBidAmount = auction.highestBidAmount;
        address highestBidder = auction.highestBidder;

        if (highestBidAmount == 0) {
            //auction failed, no bidding occured
            rc3.transferFrom(
                address(this), auction.seller, _tokenId
            );
            emit AuctionCancelled(_tokenId);
        
        } else {
            //auction succeeded, pay fee, send money to seller, and token to buyer
            uint fee = (feePercentage * highestBidAmount) / DIVISOR;
            rcdy.transfer(feeReceipient, fee);
            rcdy.transfer(auction.seller, highestBidAmount - fee);
            rc3.transferFrom(address(this), highestBidder, _tokenId);

            emit AuctionResulted(highestBidder, _tokenId, highestBidAmount);
        }
        
        auction.seller = address(0);
        auction.highestBidder = address(0);
        auction.highestBidAmount = 0;
        auction.startPeriod = 0;
        auction.endPeriod = 0;
        auction.bidCount = 0;
        return true;
    }

    
    ///-----------------///
    /// ADMIN FUNCTIONS ///
    ///-----------------///


    function setFeePercentage(
        uint _newFeePercentage
        ) external onlyOwner() returns(bool feePercentageSet) {
        
        _setFeePercentage(_newFeePercentage);
        
        emit FeePercentageSet(msg.sender, _newFeePercentage);
        return true;
    }

    function setFeeReceipient(
        address _newFeeReceipient
        ) external onlyOwner() returns(bool feeReceipientSet) {
        
        _setFeeReceipient(_newFeeReceipient);
        
        emit FeeReceipientSet(msg.sender, _newFeeReceipient);
        return true;
    }

    function updateEndTime(
        uint _tokenId,
        uint _endsIn
        ) external onlyOwner() returns(bool updated) {

        Auction memory auction = auctions[_tokenId];
        
        require(
            auction.startPeriod <= block.timestamp, 
            "Error: auction has not started"
        );
        
        auction.endPeriod = block.timestamp + _endsIn;
        
        emit EndTimeUpdated(
            msg.sender,
            _tokenId,
            auction.endPeriod
        );
        
        return true;
    }


    ///-----------------///
    /// READ FUNCTIONS ///
    ///-----------------///

    function bidTimeRemaining( 
        uint _tokenId
        ) external view returns(uint startsIn, uint endsIn) {
        
        return _bidTimeRemaining(_tokenId);
    }

    function nextBidAmount(
        uint _tokenId
        ) external view returns(uint amount) {
        
        return _nextBidAmount(_tokenId);
    }

    function getAuction(
        uint _tokenId
        ) external view returns(Auction memory) {
        
        return auctions[_tokenId];
    }

    
    ///-----------------///
    /// PRIVATE FUNCTIONS ///
    ///-----------------///


    /* 
     * @dev get the seconds left for an auction to end.
     * ------------------------------------------------
     * @param _token --> the address of the NFT.
     * @param _tokenId --> the id of the NFT.
     * ---------------------------------------
     * returns the remaining seconds.
     * returns 0 if auction isn't open.
     */
    function _bidTimeRemaining(
        uint _tokenId
        ) private view returns(uint startsIn, uint endsIn) {

        Auction memory auction = auctions[_tokenId];

        auction.startPeriod > block.timestamp
        ? startsIn = auction.startPeriod - block.timestamp
        : startsIn = 0;

        auction.endPeriod > block.timestamp
        ? endsIn = auction.endPeriod - block.timestamp
        : endsIn = 0;
    }

    function _nextBidAmount(
        uint _tokenId
        ) private view returns(uint amount) {
        
        Auction memory auction = auctions[_tokenId];
        if (auction.seller != address(0)) {
            uint current = auction.highestBidAmount; 
            
            if (current == 0) {
                return auction.initialBidAmount;
            } else {
                //10% more of current highest bid
                return ((current * 10000) / DIVISOR) + current;
            }
        }
        return 0;
    }

    function _setFeePercentage(
        uint _newFee
        ) private {
        require(_newFee != feePercentage, "Error: already set");
        feePercentage = _newFee;
    }

    function _setFeeReceipient(
        address _newFeeReceipient
        ) private {
        require(_newFeeReceipient != feeReceipient, "Error: already receipient");
        feeReceipient = payable(_newFeeReceipient);
    }

}