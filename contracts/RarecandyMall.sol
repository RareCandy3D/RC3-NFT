//"SPDX-License-Identifier: MIT"
pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RarecandyMall {
    using Counters for Counters.Counter;

    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;

    IERC721 private rc3;
    IERC20 private rcdy;
    uint256 public listingFee; //1000 = 1%
    address public feeCollector;

    constructor(
        address _rcdy,
        address _rc3,
        address _feeCollector,
        uint256 _listingFee
    ) {
        rc3 = IERC721(_rc3);
        rcdy = IERC20(_rcdy);
        listingFee = _listingFee;
        feeCollector = _feeCollector;
    }

    struct MarketItem {
        uint256 itemId;
        uint256 tokenId;
        address seller;
        address owner; //buyer
        uint256 price; //in RCDY
    }

    mapping(uint256 => MarketItem) private idToMarketItem;

    event MarketItemCreated(
        uint256 indexed itemId,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price
    );

    event MarketSale(
        uint256 indexed itemId,
        uint256 indexed tokenId,
        address buyer,
        address seller,
        uint256 price
    );

    function listItem(uint256 _tokenId, uint256 _price)
        external
        returns (bool marketItemCreated)
    {
        require(_price > 0, "Price must be more than 0");

        rc3.transferFrom(msg.sender, address(this), _tokenId);

        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        idToMarketItem[itemId] = MarketItem(
            itemId,
            _tokenId,
            msg.sender,
            address(0),
            _price
        );

        emit MarketItemCreated(
            itemId,
            _tokenId,
            msg.sender,
            address(0),
            _price
        );

        return true;
    }

    function buyItem(uint256 _itemId) external returns (bool bought) {
        MarketItem storage item = idToMarketItem[_itemId];
        uint256 fee = (listingFee * item.price) / 100000;
        require(
            rcdy.transferFrom(msg.sender, feeCollector, fee),
            "Error in collecting the fee"
        );

        require(
            rcdy.transferFrom(msg.sender, item.seller, item.price - fee),
            "Error in collecting the asking price"
        );

        item.owner = msg.sender;
        rc3.transferFrom(address(this), msg.sender, item.tokenId);

        _itemsSold.increment();

        emit MarketSale(
            _itemId,
            item.tokenId,
            msg.sender,
            item.seller,
            item.price
        );

        return true;
    }

    function getItem(uint256 _marketItemId)
        external
        view
        returns (MarketItem memory)
    {
        return idToMarketItem[_marketItemId];
    }

    function getMarketItems()
        external
        view
        returns (MarketItem[] memory marketItems)
    {
        uint256 itemCount = _itemIds.current();
        uint256 unsoldItemCount = _itemIds.current() - _itemsSold.current();
        uint256 currentIndex;

        MarketItem[] memory items = new MarketItem[](unsoldItemCount);

        for (uint256 i = 0; i < itemCount; i++) {
            if (idToMarketItem[i + 1].owner == address(0)) {
                uint256 currentId = idToMarketItem[i + 1].itemId;
                MarketItem memory currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex++;
            }
        }
        return items;
    }

    function getMyNFTs() external view returns (MarketItem[] memory myNfts) {
        uint256 totalItemCount = _itemIds.current();
        uint256 itemCount;
        uint256 currentIndex;

        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) itemCount++;
        }

        MarketItem[] memory items = new MarketItem[](itemCount);

        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                uint256 currentId = idToMarketItem[i + 1].itemId;
                MarketItem memory currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex++;
            }
        }
        return items;
    }
}
