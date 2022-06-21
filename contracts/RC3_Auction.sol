// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract RC3_Auction is ERC721Holder, ERC1155Holder, ReentrancyGuard {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;

    //state variables
    Counters.Counter public auctionId;
    Counters.Counter public auctionsClosed;

    IERC20 internal immutable rcdy;
    uint96 public feePercentage; // 1% = 1000
    uint96 private constant DIVISOR = 100 * 1000;
    address payable public feeRecipient;

    enum TokenType {
        ERC_721,
        ERC_1155
    }

    enum State {
        LISTED,
        DELISTED,
        SOLD
    }

    //struct
    struct Auction {
        address payable seller;
        address payable highestBidder;
        address nifty;
        uint256 tokenId;
        uint256 tokenAmount;
        uint256 initialBidAmount;
        uint256 highestBidAmount;
        uint256 startPeriod;
        uint256 endPeriod;
        uint256 bidCount;
        TokenType tokenType;
        State state;
    }

    //auction id to Auction
    mapping(uint256 => Auction) private auctions;

    event AuctionUpdated(
        address indexed bidder,
        address indexed nft,
        uint256 indexed auctionId,
        uint256 _tokenId,
        uint256 newEndPeriod
    );

    event AuctionCancelled(
        address indexed caller,
        address indexed nft,
        uint256 indexed auctionId,
        uint256 tokenID
    );

    event AuctionResulted(
        address indexed caller,
        address seller,
        address highestBidder,
        address indexed nft,
        uint256 indexed auctionId,
        uint256 tokenId,
        uint256 amount,
        uint256 winPrice
    );

    event NewAuction(
        address indexed seller,
        address indexed nft,
        uint256 indexed auctionId,
        uint256 tokenId,
        uint256 amount,
        uint256 floorPrice,
        uint256 startPeriod,
        uint256 endPeriod,
        TokenType tokenType
    );

    event NewBid(
        address indexed bidder,
        address indexed nft,
        uint256 indexed auctionId,
        uint256 tokenId,
        uint256 price
    );

    //Deployer
    constructor(address _rcdy) {
        rcdy = IERC20(_rcdy);
    }

    //Modifier to check all conditions are met before bid
    modifier bidCheck(uint256 _auctionId, uint256 _bidAmount) {
        _bidCheck(_auctionId, _bidAmount);
        _;
    }

    ///-----------------///
    /// WRITE FUNCTIONS ///
    ///-----------------///

    function listAuction(
        address nifty,
        uint256 _tokenId,
        uint256 amount,
        uint256 _startsIn,
        uint256 _lastsFor,
        uint256 _initialBidAmount,
        TokenType _type
    ) external returns (uint256 auctionId_) {
        auctionId.increment();
        auctionId_ = auctionId.current();
        require(_lastsFor != 0, "INVALID_DURATION");

        if (_type == TokenType.ERC_721) {
            IERC721 nft = IERC721(nifty);
            address nftOwner = nft.ownerOf(_tokenId);
            nft.safeTransferFrom(nftOwner, address(this), _tokenId);

            _registerAuction(
                nifty,
                auctionId_,
                _tokenId,
                1,
                _startsIn,
                _lastsFor,
                _initialBidAmount,
                TokenType.ERC_721
            );
        } else {
            require(amount > 0, "INVALID_AMOUNT");
            IERC1155 nft = IERC1155(nifty);
            nft.safeTransferFrom(
                msg.sender,
                address(this),
                _tokenId,
                amount,
                "0x0"
            );

            _registerAuction(
                nifty,
                auctionId_,
                _tokenId,
                amount,
                _startsIn,
                _lastsFor,
                _initialBidAmount,
                TokenType.ERC_1155
            );
        }
    }

    function bid(uint256 _auctionId, uint256 _bidAmount)
        external
        nonReentrant
        bidCheck(_auctionId, _bidAmount)
        returns (bool bidded)
    {
        Auction storage auction = auctions[_auctionId];

        rcdy.safeTransferFrom(msg.sender, address(this), _bidAmount);

        if (auction.bidCount != 0) {
            //return token to the prevous highest bidder
            rcdy.safeTransfer(auction.highestBidder, auction.highestBidAmount);
        }

        //update data
        auction.highestBidder = payable(msg.sender);
        auction.highestBidAmount = _bidAmount;
        auction.bidCount++;

        emit NewBid(
            msg.sender,
            auction.nifty,
            _auctionId,
            auction.tokenId,
            _bidAmount
        );

        //increase countdown clock
        (, uint256 timeLeft) = _bidTimeRemaining(_auctionId);
        if (timeLeft < 1 hours) {
            timeLeft + 10 minutes <= 1 hours
                ? auction.endPeriod += 10 minutes
                : auction.endPeriod += (1 hours - timeLeft);

            (, uint256 newTimeLeft) = _bidTimeRemaining(_auctionId);

            emit AuctionUpdated(
                msg.sender,
                auction.nifty,
                _auctionId,
                auction.tokenId,
                block.timestamp + newTimeLeft
            );
        }

        return true;
    }

    function closeBid(uint256 _auctionId)
        external
        nonReentrant
        returns (State status)
    {
        Auction storage auction = auctions[_auctionId];
        require(auction.state == State.LISTED, "AUCTION_NOT_LISTED");

        (uint256 startTime, uint256 timeLeft) = _bidTimeRemaining(_auctionId);
        require(startTime == 0 && timeLeft == 0, "AUCTION_NOT_STARTED");
        require(timeLeft == 0, "AUCTION_NOT_ENDED");

        uint256 highestBidAmount = auction.highestBidAmount;

        if (highestBidAmount == 0) {
            auction.tokenType == TokenType.ERC_721
                ? IERC721(auction.nifty).safeTransferFrom(
                    address(this),
                    auction.seller,
                    auction.tokenId
                )
                : IERC1155(auction.nifty).safeTransferFrom(
                    address(this),
                    auction.seller,
                    auction.tokenId,
                    auction.tokenAmount,
                    "0x0"
                );
            auction.state = State.DELISTED;
            emit AuctionCancelled(
                msg.sender,
                auction.nifty,
                _auctionId,
                auction.tokenId
            );
        } else {
            //auction succeeded, pay fee, send money to seller, and token to buyer
            uint256 fee = (feePercentage * highestBidAmount) / DIVISOR;
            address highestBidder = auction.highestBidder;

            rcdy.safeTransfer(feeRecipient, fee);
            rcdy.safeTransfer(auction.seller, highestBidAmount - fee);

            auction.tokenType == TokenType.ERC_721
                ? IERC721(auction.nifty).safeTransferFrom(
                    address(this),
                    highestBidder,
                    auction.tokenId
                )
                : IERC1155(auction.nifty).safeTransferFrom(
                    address(this),
                    highestBidder,
                    auction.tokenId,
                    auction.tokenAmount,
                    "0x0"
                );
            auction.state = State.SOLD;
            emit AuctionResulted(
                msg.sender,
                auction.seller,
                highestBidder,
                auction.nifty,
                _auctionId,
                auction.tokenId,
                auction.tokenAmount,
                highestBidAmount
            );
        }

        auctionsClosed.increment();
        return auction.state;
    }

    ///-----------------///
    /// READ FUNCTIONS ///
    ///-----------------///

    function bidTimeRemaining(uint256 _auctionId)
        external
        view
        returns (uint256 startsIn, uint256 endsIn)
    {
        (startsIn, endsIn) = _bidTimeRemaining(_auctionId);
    }

    function nextBidAmount(uint256 _auctionId)
        external
        view
        returns (uint256 amount)
    {
        amount = _nextBidAmount(_auctionId);
    }

    function getAuction(uint256 _auctionId)
        external
        view
        returns (Auction memory auction_)
    {
        auction_ = auctions[_auctionId];
    }

    ///-----------------///
    /// PRIVATE FUNCTIONS ///
    ///-----------------///

    function _registerAuction(
        address nifty,
        uint256 _auctionId,
        uint256 _tokenId,
        uint256 amount,
        uint256 _startsIn,
        uint256 _lastsFor,
        uint256 _initialBidAmount,
        TokenType _type
    ) private {
        Auction storage auction = auctions[_auctionId];

        //create auction
        uint256 startsIn = block.timestamp + _startsIn;
        uint256 period = startsIn + _lastsFor;

        auction.nifty = nifty;
        auction.tokenId = _tokenId;
        auction.startPeriod = startsIn;
        auction.endPeriod = period;
        auction.seller = payable(msg.sender);
        auction.initialBidAmount = _initialBidAmount;
        auction.tokenType = _type;
        auction.tokenAmount = amount;
        auction.state = State.LISTED;

        emit NewAuction(
            msg.sender,
            nifty,
            _auctionId,
            _tokenId,
            amount,
            _initialBidAmount,
            startsIn,
            period,
            _type
        );
    }

    function _bidTimeRemaining(uint256 _auctionId)
        private
        view
        returns (uint256 startsIn, uint256 endsIn)
    {
        Auction memory auction = auctions[_auctionId];

        startsIn = auction.startPeriod > block.timestamp
            ? auction.startPeriod - block.timestamp
            : 0;

        endsIn = auction.endPeriod > block.timestamp
            ? auction.endPeriod - block.timestamp
            : 0;
    }

    function _nextBidAmount(uint256 _auctionId)
        private
        view
        returns (uint256 amount)
    {
        Auction memory auction = auctions[_auctionId];
        if (auction.seller != address(0)) {
            uint256 current = auction.highestBidAmount;

            if (current == 0) {
                return auction.initialBidAmount;
            } else {
                //10% more of current highest bid
                return ((current * 10000) / DIVISOR) + current;
            }
        }
        return 0;
    }

    function _bidCheck(uint256 _auctionId, uint256 _bidAmount) private view {
        Auction memory auction = auctions[_auctionId];
        uint256 endPeriod = auction.endPeriod;
        require(auction.state == State.LISTED, "AUCTION_NOT_LISTED");
        require(auction.seller != msg.sender, "OWNER_CANNOT_BID");
        require(auction.startPeriod <= block.timestamp, "AUCTION_NOT_STARTED");
        require(endPeriod > block.timestamp, "AUCTION_ENDED");
        require(
            _bidAmount >= _nextBidAmount(_auctionId),
            "INVALID_INPUT_AMOUNT"
        );
    }
}
