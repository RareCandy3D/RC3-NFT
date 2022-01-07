//"SPDX-License-Identifier: MIT"
pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./RCDYRouter.sol";

contract RarecandyMall is RCDYRouter {
  using Counters for Counters.Counter;
  
  Counters.Counter private _itemIds;
  Counters.Counter private _itemsSold;

  IERC721 private rc3;
  uint public listingFee;               //1000 = 1%
  address public feeCollector;

  constructor(
    address _uniswapV2RouterAddress,
    address _rcdy,
    address _rc3,
    address _feeCollector,
    uint _listingFee,
    uint _swapFee) 
    
    RCDYRouter(
      _uniswapV2RouterAddress,
      _rcdy,
      _swapFee
    ) {
      
    rc3 = IERC721(_rc3);
    listingFee = _listingFee;
    feeCollector = _feeCollector;
  }

  struct MarketItem {
    uint itemId;
    uint tokenId;
    address seller;
    address owner;                      //buyer
    uint price;                         //in RCDY
  }

  mapping(uint => MarketItem) private idToMarketItem;

  event MarketItemCreated (
    uint indexed itemId,
    uint indexed tokenId,
    address seller,
    address owner,
    uint price
  );

  event MarketSale(
      uint indexed itemId,
      uint indexed tokenId,
      address buyer,
      address seller,
      uint price
  );

  function listItem(
    uint _tokenId,
    uint _price) 
    external returns(bool marketItemCreated) {
    
    require(
      _price > 0, 
      "Price must be more than 0"
    );

    rc3.transferFrom(
      msg.sender, 
      address(this), 
      _tokenId
    );

    _itemIds.increment();
    uint itemId = _itemIds.current();

    idToMarketItem[itemId] =  MarketItem(
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

  function buyItem(
    uint256 _itemId
    ) external returns(bool bought) {
    
    MarketItem storage item = idToMarketItem[_itemId];
    uint fee = (listingFee * item.price) / 100000;
    require(
      rcdy.transferFrom(
        msg.sender,
        feeCollector,
        fee
      ), 
      "Error in collecting the fee"
    );

    require(
      rcdy.transferFrom(
        msg.sender,
        item.seller,
        item.price - fee
      ), 
      "Error in collecting the asking price"
    );

    item.owner = msg.sender;
    rc3.transferFrom(
      address(this), 
      msg.sender, 
      item.tokenId
    );
    
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

  function getItem(
    uint _marketItemId
    ) external view returns(MarketItem memory) {

    return idToMarketItem[_marketItemId];
  }

  function getMarketItems(
    ) external view returns(MarketItem[] memory marketItems) {
    
    uint itemCount = _itemIds.current();
    uint unsoldItemCount = _itemIds.current() - _itemsSold.current();
    uint currentIndex;

    MarketItem[] memory items = new MarketItem[](unsoldItemCount);
    
    for (uint i = 0; i < itemCount; i++) {
      
      if (idToMarketItem[i + 1].owner == address(0)) {
        
        uint currentId = idToMarketItem[i + 1].itemId;
        MarketItem memory currentItem = idToMarketItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex++;
      }
    }
    return items;
  }

  function getMyNFTs(
    ) external view returns(MarketItem[] memory myNfts) {

    uint totalItemCount = _itemIds.current();
    uint itemCount;
    uint currentIndex;

    for (uint i = 0; i < totalItemCount; i++) {
      if (idToMarketItem[i + 1].owner == msg.sender) itemCount++;
    }

    MarketItem[] memory items = new MarketItem[](itemCount);
    
    for (uint i = 0; i < totalItemCount; i++) {
      
      if (idToMarketItem[i + 1].owner == msg.sender) {
        
        uint currentId = idToMarketItem[i + 1].itemId;
        MarketItem memory currentItem = idToMarketItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex++;
      }
    }
    return items;
  }

}