//"SPDX-License-Identifier: MIT"
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./RC3_1155.sol";
import "./RC3_721.sol";
import "./RC3_Auction.sol";

contract RC3_Mall is RC3_Auction {
    using Counters for Counters.Counter;

    Counters.Counter public marketId;
    Counters.Counter public marketsSold;
    Counters.Counter public marketsDelisted;

    address[] private _list;
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
        uint256 price; //in RCDY
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

    event Created(
        address indexed creator,
        address token,
        TokenType tokenType,
        uint256 royalty
    );

    event FeeSet(address indexed sender, uint256 feePercentage, Asset asset);

    event FeeReceipientSet(address indexed sender, address feeReceipient);

    constructor(
        address _rcdy,
        address payable _feeReceipient,
        uint96 _feeRCDY,
        uint96 _ethFee
    ) RC3_Auction(_rcdy) {
        _setFeeReceipient(_feeReceipient);
        _setFeePercentage(_feeRCDY);
        ethFee = _ethFee;
    }

    modifier buyCheck(uint256 _marketId, Asset _asset) {
        Market memory market = markets[_marketId];

        require(market.state == State.LISTED, "MARKET_NOT_LISTED");
        require(market.seller != msg.sender, "OWNER_CANNOT_BUY");
        require(market.asset == _asset, "WRONG_BUY_ASSET");
        _;
    }

    ///-----------------///
    /// ADMIN FUNCTIONS ///
    ///-----------------///

    function setFeeReceipient(address payable _newReceipient)
        external
        onlyOwner
    {
        _setFeeReceipient(_newReceipient);
        emit FeeReceipientSet(msg.sender, _newReceipient);
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

    function createNFT(
        TokenType _type,
        string memory _name,
        string memory _symbol,
        string memory _uri,
        uint96 _royalty
    ) external returns (address createdAddr) {
        if (_type == TokenType.ERC_1155) {
            RC3_1155 token = new RC3_1155(_name, _symbol, _uri, _royalty);

            createdAddr = address(token);
            _list.push(createdAddr);

            emit Created(_msgSender(), createdAddr, _type, _royalty);
        } else {
            RC3_721 token = new RC3_721(
                _name,
                _symbol,
                _uri,
                payable(msg.sender),
                _royalty
            );

            createdAddr = address(token);
            _list.push(createdAddr);

            emit Created(_msgSender(), createdAddr, _type, _royalty);
        }
    }

    function listMarket(
        address nifty,
        uint256 _tokenId,
        uint256 amount,
        uint256 _price,
        TokenType _type,
        Asset _asset
    ) external returns (uint256 marketId_) {
        require(_price > 0, "Price must be more than 0");
        marketId.increment();
        marketId_ = marketId.current();

        if (_type == TokenType.ERC_721) {
            IERC721 nft = IERC721(nifty);
            address nftOwner = nft.ownerOf(_tokenId);
            require(nftOwner == msg.sender, "INVALID_OPERATOR");
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
            require(
                nft.balanceOf(msg.sender, _tokenId) >= amount,
                "INSUFFICIENT_BALANCE"
            );
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

    function buyWithRCDY(uint256 _marketId)
        external
        buyCheck(_marketId, markets[_marketId].asset)
        returns (bool bought)
    {
        Market memory market = markets[_marketId];
        uint96 feeRate = feePercentage;
        uint256 fee = (feeRate * market.price) / 100000;
        require(
            rcdy.transferFrom(msg.sender, feeReceipient, fee),
            "FEE_COLLECTION_ERROR"
        );

        require(
            rcdy.transferFrom(msg.sender, market.seller, market.price - fee),
            "ASKING_PRICE_COLLECTION_ERROR"
        );
        _buy(_marketId);
        return true;
    }

    function buyWithETH(uint256 _marketId)
        external
        payable
        buyCheck(_marketId, markets[_marketId].asset)
        returns (bool bought)
    {
        Market memory market = markets[_marketId];
        uint96 feeRate = ethFee;
        uint256 fee = (feeRate * market.price) / 100000;
        require(msg.value == market.price, "INVALID_PAYMENT_AMOUNT");

        feeReceipient.transfer(fee);
        market.seller.transfer(market.price - fee);
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

    function getListLength() external view returns (uint256) {
        return _list.length;
    }

    function getLists() external view returns (address[] memory) {
        return _list;
    }

    function _setFeePercentage(uint96 _newFee) internal {
        uint96 fee = feePercentage;
        require(_newFee != fee, "Error: already set");
        feePercentage = _newFee;
    }

    function _setFeeReceipient(address payable _newFeeReceipient) internal {
        address rec = feeReceipient;
        require(_newFeeReceipient != rec, "Error: already receipient");
        feeReceipient = _newFeeReceipient;
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
}
