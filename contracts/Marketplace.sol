// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Marketplace {
  using Counters for Counters.Counter;
  
  Counters.Counter private _itemIds;
  Counters.Counter private _itemsSold;

  uint listingFee = 0.1 ether;
  address payable admin;

  constructor(
    ) {
    admin = payable(msg.sender);
  }

  struct MarketItem {
    uint itemId;
    address nftContract;
    uint tokenId;
    address payable seller;
    address payable owner;
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
    uint _price
    ) external payable returns(bool marketItemCreated) {
    require(
      _price > 0, 
      "Price must be more than 0"
    );
    require(
      msg.value == listingFee, 
      "Fee must be equal to listing fee"
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
      payable(msg.sender),
      payable(address(0)),
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

  function createMarketSale(
    address _nftContract,
    uint256 _itemId
    ) external payable returns(bool bought) {
    
    uint price = idToMarketItem[_itemId].price;
    uint tokenId = idToMarketItem[_itemId].tokenId;
    
    require(
      msg.value == price, 
      "Must send the asking price"
    );

    idToMarketItem[_itemId].seller.transfer(msg.value);
    payable(admin).transfer(listingFee);

    idToMarketItem[_itemId].owner = payable(msg.sender);
    IERC721(_nftContract).transferFrom(
      address(this), 
      msg.sender, 
      tokenId
    );
    _itemsSold.increment();
    
    emit MarketSale(
      _itemId,
      _nftContract,
      tokenId,
      msg.sender,
      idToMarketItem[_itemId].seller,
      price
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
        MarketItem storage currentItem = idToMarketItem[currentId];
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
      
      if (idToMarketItem[i + 1].owner == msg.sender) {
        
        itemCount++;
      }
    }

    MarketItem[] memory items = new MarketItem[](itemCount);
    
    for (uint i = 0; i < totalItemCount; i++) {
      
      if (idToMarketItem[i + 1].owner == msg.sender) {
        
        uint currentId = idToMarketItem[i + 1].itemId;
        MarketItem storage currentItem = idToMarketItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex++;
      }
    }
    return items;
  }
}