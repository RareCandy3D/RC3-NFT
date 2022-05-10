//"SPDX-License-Identifier: MIT"
pragma solidity 0.8.6;

import "./RC3_Auction.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RC3_Mall is RC3_Auction, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter public marketId;
    Counters.Counter public marketsSold;
    Counters.Counter public marketsDelisted;

    uint96 public ethFee; // 1% = 1000

    enum Asset {
        ETH,
        RCDY
    }

    struct Market {
        address payable seller;
        address payable buyer;
        address nifty;
        uint256 tokenId;
        uint256 tokenAmount;
        uint256 price; //in RCDY or ETH
        TokenType tokenType;
        State state;
        Asset asset;
    }

    mapping(uint256 => Market) private markets;

    event NewMarket(
        address indexed caller,
        address indexed nifty,
        uint256 indexed marketId,
        uint256 tokenId,
        uint256 amount,
        uint256 price,
        TokenType tokenType,
        Asset asset
    );

    event MarketSale(
        address indexed caller,
        address indexed nifty,
        uint256 indexed marketId,
        uint256 tokenId,
        uint256 price,
        Asset asset
    );

    event MarketCancelled(
        address indexed caller,
        address indexed nifty,
        uint256 marketId,
        uint256 tokenId
    );

    event FeeSet(address indexed sender, uint256 feePercentage, Asset asset);

    event FeeRecipientSet(address indexed sender, address feeReceipient);

    constructor(
        address _rcdy,
        address payable _feeReceipient,
        uint96 _feeRCDY,
        uint96 _ethFee
    ) RC3_Auction(_rcdy) Ownable() {
        _setFeeRecipient(_feeReceipient);
        _setFeePercentage(_feeRCDY);
        ethFee = _ethFee;
        transferOwnership(msg.sender);
    }

    modifier buyCheck(uint256 _marketId) {
        _buyCheck(_marketId);
        _;
    }

    ///-----------------///
    /// ADMIN FUNCTIONS ///
    ///-----------------///

    function setFeeRecipient(address payable _newRecipient) external onlyOwner {
        _setFeeRecipient(_newRecipient);
        emit FeeRecipientSet(msg.sender, _newRecipient);
    }

    function setFeeRCDY(uint96 _newFee) external onlyOwner {
        _setFeePercentage(_newFee);
        emit FeeSet(msg.sender, _newFee, Asset.RCDY);
    }

    function setFeeETH(uint96 _newFee) public onlyOwner {
        uint96 fee = ethFee;
        require(_newFee != fee, "Error: already set");
        ethFee = _newFee;
        emit FeeSet(msg.sender, _newFee, Asset.ETH);
    }

    function listMarket(
        address nifty,
        uint256 _tokenId,
        uint256 amount,
        uint256 _price,
        TokenType _type,
        Asset _asset
    ) external returns (uint256 marketId_) {
        require(_price > 0, "INVALID_PRICE");
        marketId.increment();
        marketId_ = marketId.current();

        if (_type == TokenType.ERC_721) {
            IERC721 nft = IERC721(nifty);
            address nftOwner = nft.ownerOf(_tokenId);
            nft.safeTransferFrom(nftOwner, address(this), _tokenId);

            _registerMarket(
                nifty,
                marketId_,
                _tokenId,
                1,
                _price,
                TokenType.ERC_721,
                _asset
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
            _registerMarket(
                nifty,
                marketId_,
                _tokenId,
                amount,
                _price,
                TokenType.ERC_1155,
                _asset
            );
        }

        return marketId_;
    }

    function delistMarket(uint256 _marketId)
        external
        nonReentrant
        returns (State status)
    {
        Market storage market = markets[_marketId];

        require(State.LISTED == market.state, "MARKET_NOT_LISTED");
        require(msg.sender == market.seller, "UNAUTHORIZED_CALLER");

        market.tokenType == TokenType.ERC_721
            ? IERC721(market.nifty).safeTransferFrom(
                address(this),
                market.seller,
                market.tokenId
            )
            : IERC1155(market.nifty).safeTransferFrom(
                address(this),
                market.seller,
                market.tokenId,
                market.tokenAmount,
                "0x0"
            );

        market.state = State.DELISTED;
        marketsDelisted.increment();

        emit MarketCancelled(
            msg.sender,
            market.nifty,
            _marketId,
            market.tokenId
        );
        return market.state;
    }

    function buyWithETH(uint256 _marketId)
        external
        payable
        buyCheck(_marketId)
        returns (bool bought)
    {
        Market memory market = markets[_marketId];
        uint96 feeRate = ethFee;
        uint256 fee = (feeRate * market.price) / 100000;
        require(msg.value == market.price, "INVALID_PAYMENT_AMOUNT");

        feeRecipient.transfer(fee);
        market.seller.transfer(market.price - fee);
        _buy(_marketId);
        return true;
    }

    function buyWithRCDY(uint256 _marketId)
        external
        buyCheck(_marketId)
        returns (bool bought)
    {
        Market memory market = markets[_marketId];
        uint96 feeRate = feePercentage;
        uint256 fee = (feeRate * market.price) / 100000;

        rcdy.transferFrom(msg.sender, feeRecipient, fee);
        rcdy.transferFrom(msg.sender, market.seller, market.price - fee);

        _buy(_marketId);
        return true;
    }

    function getMarket(uint256 _marketId)
        external
        view
        returns (Market memory)
    {
        return markets[_marketId];
    }

    function getListedMarkets()
        external
        view
        returns (Market[] memory marketItems)
    {
        uint256 itemCount = marketId.current();
        uint256 listedItemCount = itemCount -
            marketsDelisted.current() -
            marketsSold.current();
        uint256 currentIndex;

        Market[] memory items = new Market[](listedItemCount);

        for (uint256 i; i < itemCount; i++) {
            if (markets[i + 1].state == State.LISTED) {
                Market memory currentItem = markets[i + 1];
                items[currentIndex] = currentItem;
                currentIndex++;
            }
        }
        return items;
    }

    function myTradedNFTs() external view returns (Market[] memory myNfts) {
        uint256 totalItemCount = marketId.current();
        uint256 itemCount;
        uint256 currentIndex;

        for (uint256 i; i < totalItemCount; i++) {
            if (markets[i + 1].buyer == payable(msg.sender)) {
                itemCount++;
            }
        }

        Market[] memory items = new Market[](itemCount);

        for (uint256 i; i < totalItemCount; i++) {
            Market memory item = markets[i + 1];
            if (item.buyer == payable(msg.sender)) {
                items[currentIndex] = item;
                currentIndex++;
            }
        }
        return items;
    }

    function _setFeePercentage(uint96 _newFee) internal {
        uint96 fee = feePercentage;
        require(_newFee != fee, "Error: already set");
        feePercentage = _newFee;
    }

    function _setFeeRecipient(address payable _newFeeRecipient) internal {
        address rec = feeRecipient;
        require(_newFeeRecipient != rec, "Error: already receipient");
        feeRecipient = _newFeeRecipient;
    }

    function _registerMarket(
        address nifty,
        uint256 _marketId,
        uint256 _tokenId,
        uint256 amount,
        uint256 _price,
        TokenType _type,
        Asset _asset
    ) private {
        Market storage market = markets[_marketId];

        market.seller = payable(msg.sender);
        market.nifty = nifty;
        market.tokenId = _tokenId;
        market.tokenAmount = amount;
        market.price = _price;
        market.state = State.LISTED;
        market.tokenType = _type;
        market.asset = _asset;

        emit NewMarket(
            msg.sender,
            nifty,
            _marketId,
            _tokenId,
            amount,
            _price,
            _type,
            _asset
        );
    }

    function _buy(uint256 _marketId) private nonReentrant {
        Market storage market = markets[_marketId];
        market.buyer = payable(msg.sender);
        market.state = State.SOLD;
        marketsSold.increment();

        market.tokenType == TokenType.ERC_721
            ? IERC721(market.nifty).safeTransferFrom(
                address(this),
                msg.sender,
                market.tokenId
            )
            : IERC1155(market.nifty).safeTransferFrom(
                address(this),
                msg.sender,
                market.tokenId,
                market.tokenAmount,
                "0x0"
            );

        emit MarketSale(
            msg.sender,
            market.nifty,
            _marketId,
            market.tokenId,
            market.price,
            market.asset
        );
    }

    function _buyCheck(uint256 _marketId) private view {
        Market memory market = markets[_marketId];

        require(market.state == State.LISTED, "MARKET_NOT_LISTED");
        require(market.seller != msg.sender, "OWNER_CANNOT_BUY");
    }
}
