//"SPDX-License-Identifier: MIT"
pragma solidity 0.8.6;

import "./RC3_Auction.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract RC3_Mall is RC3_Auction, OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter public marketId;
    CountersUpgradeable.Counter public marketsSold;
    CountersUpgradeable.Counter public marketsDelisted;

    uint96 public ethFee; // 1% = 1000
    uint256 public constant waitPeriod = 2 days;

    enum Asset {
        ETH,
        RCDY
    }

    struct Market {
        address payable seller;
        TokenType tokenType;
        address payable buyer;
        State state;
        address nifty;
        Asset asset;
        uint256 tokenId;
        uint256 tokenAmount;
        uint256 price; //in RCDY or ETH
        uint256 listTimestamp;
    }

    mapping(uint256 => Market) private markets;
    bool private deployed;

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
        address indexed seller,
        address indexed nft,
        uint256 marketId,
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

    event FeeSet(
        address indexed sender,
        uint256 feePercentage,
        Asset indexed asset
    );

    event FeeRecipientSet(
        address indexed sender,
        address indexed feeReceipient
    );

    function initialize(
        address _owner,
        address _rcdy,
        address payable _feeReceipient,
        uint96 _feeRCDY,
        uint96 _ethFee
    ) public initializer {
        require(!deployed, "Error: contract has already been initialized");
        OwnableUpgradeable.__Ownable_init();
        _setFeeRecipient(_feeReceipient);
        _setFeePercentage(_feeRCDY);
        ethFee = _ethFee;
        rcdy = IERC20Upgradeable(_rcdy);
        transferOwnership(_owner);
        deployed = true;
    }

    modifier buyCheck(uint256 _marketId) {
        _buyCheck(_marketId);
        _;
    }

    ///-----------------///
    /// ADMIN FUNCTIONS ///
    ///-----------------///

    function setFeeRecipient(address payable _newRecipient) external onlyOwner {
        require(_newRecipient != address(0));
        _setFeeRecipient(_newRecipient);
        emit FeeRecipientSet(msg.sender, _newRecipient);
    }

    function setFeeRCDY(uint96 _newFee) external onlyOwner {
        require(_newFee != 0);
        _setFeePercentage(_newFee);
        emit FeeSet(msg.sender, _newFee, Asset.RCDY);
    }

    function setFeeETH(uint96 _newFee) external onlyOwner {
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
            IERC721Upgradeable nft = IERC721Upgradeable(nifty);
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
            IERC1155Upgradeable nft = IERC1155Upgradeable(nifty);
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
        require(payable(msg.sender) == market.seller, "UNAUTHORIZED_CALLER");
        require(
            block.timestamp - market.listTimestamp >= waitPeriod,
            "COOL_DOWN_PERIOD"
        );

        market.tokenType == TokenType.ERC_721
            ? IERC721Upgradeable(market.nifty).safeTransferFrom(
                address(this),
                market.seller,
                market.tokenId
            )
            : IERC1155Upgradeable(market.nifty).safeTransferFrom(
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

        (bool success, ) = feeRecipient.call{value: fee}("");
        (bool success_, ) = market.seller.call{value: market.price - fee}("");
        require(
            success && success_,
            "Address: unable to send value, recipient may have reverted"
        );

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

        rcdy.safeTransferFrom(msg.sender, feeRecipient, fee);
        rcdy.safeTransferFrom(msg.sender, market.seller, market.price - fee);

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
        market.listTimestamp = block.timestamp;

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
            ? IERC721Upgradeable(market.nifty).safeTransferFrom(
                address(this),
                msg.sender,
                market.tokenId
            )
            : IERC1155Upgradeable(market.nifty).safeTransferFrom(
                address(this),
                msg.sender,
                market.tokenId,
                market.tokenAmount,
                "0x0"
            );

        emit MarketSale(
            msg.sender,
            market.seller,
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
