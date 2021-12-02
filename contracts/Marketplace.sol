//"SPDX-License-Identifier: MIT"
pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RCDYRouter.sol";

contract Marketplace is RCDYRouter, Ownable {
  using Counters for Counters.Counter;
  
  Counters.Counter private _itemIds;
  Counters.Counter private _itemsSold;

  uint public listingFee;

  constructor(
    address _uniswapV2RouterAddress,
    address _rcdy,
    address _feeCollector,
    uint _listingFee) 
    
    RCDYRouter(
      _uniswapV2RouterAddress,
      _rcdy,
      _feeCollector
    ) {

    listingFee = _listingFee;
  }

  struct MarketItem {
    uint itemId;
    address nftContract;
    uint tokenId;
    address seller;
    address owner;
    uint price;
  }

  mapping(uint => MarketItem) private idToMarketItem;

  event MarketItemCreated (
    uint indexed itemId,
    address indexed nftContract,
    uint indexed tokenId,
    address seller,
    address owner,
    uint price
  );

  event MarketSale(
      uint indexed itemId,
      address indexed nftContract,
      uint indexed tokenId,
      address buyer,
      address seller,
      uint price
  );

  function createMarketItem(
    address _nftContract,
    uint _tokenId,
    uint _price) 
    external returns(bool marketItemCreated) {
    
    require(
      _price > 0, 
      "Price must be more than 0"
    );

    require(
      rcdy.transferFrom(
        msg.sender,
        address(this),
        listingFee
      ), 
      "Failed to collect listing fee"
    );

    IERC721(_nftContract).transferFrom(
      msg.sender, 
      address(this), 
      _tokenId
    );

    _itemIds.increment();
    uint itemId = _itemIds.current();

    idToMarketItem[itemId] =  MarketItem(
      itemId,
      _nftContract,
      _tokenId,
      msg.sender,
      address(0),
      _price
    );

    emit MarketItemCreated(
      itemId,
      _nftContract,
      _tokenId,
      msg.sender,
      address(0),
      _price
    );

    return true;
  }

  function buyMarketItem(
    uint256 _itemId
    ) external returns(bool bought) {
    
    MarketItem storage item = idToMarketItem[_itemId];
    
    require(
      rcdy.transferFrom(
        msg.sender,
        item.seller,
        item.price
      ), 
      "Error in collecting the asking price"
    );
    
    rcdy.transfer(feeCollector, listingFee);

    item.owner = msg.sender;
    IERC721(item.nftContract).transferFrom(
      address(this), 
      msg.sender, 
      item.tokenId
    );
    _itemsSold.increment();
    
    emit MarketSale(
      _itemId,
      item.nftContract,
      item.tokenId,
      msg.sender,
      item.seller,
      item.price
    );

    return true;
  }

  function getMarketItem(
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