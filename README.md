# RC3-NFT

This repository contains the NFT smart contract for a Rarecandy3D

Testnet: https://ropsten.etherscan.io/address/0x510796c71500785A1631f5193bAaF4c11F66E18e#contracts

# Backend Notes

## RC3_721_Factory

This smart contract deploys an ERC721 NFT contract anytime the function **create721NFT** is used. The following event is triggered:

```
event Created(address creator, address token)
```

| Syntax  | type    | description                                   |
| ------- | ------- | --------------------------------------------- |
| creator | address | the address of the user who created the nifty |
| token   | address | the address of the NFT newly created          |

## RC3_1155_Factory

This smart contract deploys an ERC1155 NFT contract anytime the function **create1155NFT** is used. The following event is triggered:

```
event Created(address creator, address token)
```

| Syntax  | type    | description                                   |
| ------- | ------- | --------------------------------------------- |
| creator | address | the address of the user who created the nifty |
| token   | address | the address of the NFT newly created          |

## RC3_Mall

1. ### listAuction

```
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
```

| Syntax      | type    | description                                         |
| ----------- | ------- | --------------------------------------------------- |
| seller      | address | the address of the user who listed the auction      |
| nft         | address | the address of the NFT being auctioned              |
| auctionId   | uint256 | the id of the newly created auction                 |
| tokenId     | uint256 | the id of the nft token being auctioned             |
| amount      | uint256 | the number of tokens being auctioned                |
| floorPrice  | uint256 | the floor price                                     |
| startPeriod | uint256 | the timestamp when auctioning will start            |
| endPeriod   | uint256 | the timestamp when auctioning will end              |
| tokenType   | enum    | type of token being auctioned. ie ERC721 or ERC1155 |

2. ### bid

```
event NewBid(
        address indexed bidder,
        address indexed nft,
        uint256 indexed auctionId,
        uint256 tokenId,
        uint256 price
    );

event AuctionUpdated(
        address indexed bidder,
        address indexed nft,
        uint256 indexed auctionId,
        uint256 tokenId,
        uint256 newEndPeriod
    );
```

| Syntax       | type    | description                             |
| ------------ | ------- | --------------------------------------- |
| bidder       | address | the address of the user who bidded      |
| nft          | address | the address of the NFT being auctioned  |
| auctionId    | uint256 | the id of the auction                   |
| tokenId      | uint256 | the id of the nft token                 |
| price        | uint256 | the price that was bidded with          |
| newEndPeriod | uint256 | the new timestamp when bidden will stop |

3. ### updateEndTime

```
event EndTimeUpdated(
        address indexed creator,
        address indexed nft,
        uint256 indexed auctionId,
        uint256 tokenId,
        uint256 newEndTime
    );
```

| Syntax     | type    | description                             |
| ---------- | ------- | --------------------------------------- |
| creator    | address | the address that created the auction    |
| nft        | address | the address of the NFT                  |
| auctionId  | uint256 | the id of the auction                   |
| tokenId    | uint256 | the id of the nft token                 |
| newEndTime | uint256 | the new timestamp when bidden will stop |

4. ### closeBid

```
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

event AuctionCancelled(
        address indexed caller,
        address indexed nft,
        uint256 indexed auctionId,
        uint256 tokenID
    );

```

if there was no bid: **AuctionCancelled**

| Syntax    | type    | description                         |
| --------- | ------- | ----------------------------------- |
| caller    | address | the address that closed the auction |
| nft       | address | the address of the NFT              |
| auctionId | uint256 | the id of the auction               |
| tokenId   | uint256 | the id of the nft token             |

else, if there was bidding: **AuctionResulted**

| Syntax        | type    | description                                      |
| ------------- | ------- | ------------------------------------------------ |
| creator       | address | the address that closed the bidding              |
| seller        | address | the address that created the auction             |
| highestBidder | address | the address won the auction with the highest bid |
| nft           | address | the address of the NFT                           |
| auctionId     | uint256 | the id of the auction                            |
| tokenId       | uint256 | the id of the nft token                          |
| amount        | uint256 | the number of tokens being auctioned             |
| winPrice      | uint256 | the highest bidded amount                        |

5. ### listMarket

```
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
```

| Syntax    | type    | description                                    |
| --------- | ------- | ---------------------------------------------- |
| caller    | address | the address of the user who listed the market  |
| nifty     | address | the address of the NFT being sold              |
| marketId  | uint256 | the id of the newly created market             |
| tokenId   | uint256 | the id of the nft token being sold             |
| amount    | uint256 | the number of tokens being sold                |
| price     | uint256 | the price                                      |
| tokenType | enum    | type of token being sold. ie ERC721 or ERC1155 |

6. ### buyWithETH & buyWithRCDY

```
event MarketSale(
        address indexed caller,
        address indexed nifty,
        uint256 indexed marketId,
        uint256 tokenId,
        uint256 price,
        Asset asset
    );
```

| Syntax   | type    | description                         |
| -------- | ------- | ----------------------------------- |
| caller   | address | the address of the user who buys    |
| nifty    | address | the address of the NFT being sold   |
| marketId | uint256 | the id of the market                |
| tokenId  | uint256 | the id of the nft token             |
| price    | uint256 | the price that was bought with      |
| asset    | enum    | the kind of asset used. ETH or RCDY |

7. ### delistMarket

```
event MarketCancelled(
        address indexed caller,
        address indexed nifty,
        uint256 marketId,
        uint256 tokenId
    );
```

| Syntax   | type    | description                           |
| -------- | ------- | ------------------------------------- |
| caller   | address | the address of the user delists       |
| nifty    | address | the address of the NFT being delisted |
| marketId | uint256 | the id of the market                  |
| tokenId  | uint256 | the id of the nft token               |

8. ### setFeeRCDY & setFeeETH

```
event FeeSet(address indexed sender, uint256 feePercentage, Asset asset);
```

| Syntax        | type    | description                                    |
| ------------- | ------- | ---------------------------------------------- |
| sender        | address | the address of the admin responsible           |
| feePercentage | uint256 | the new fee percentage                         |
| asset         | enum    | the asset type which uses the fee. ETH or RCDY |

9. ### setFeeRecipient

```
event FeeRecipientSet(address indexed sender, address feeReceipient);
```

| Syntax       | type    | description                          |
| ------------ | ------- | ------------------------------------ |
| sender       | address | the address of the admin responsible |
| feeRecipient | address | the new fee recipient                |

## RC3_Creators

1. ### createToken

```
event NewToken(
        address indexed creator,
        uint256 initialSupply,
        uint256 maxSupply
    );
```

| Syntax        | type    | description                                        |
| ------------- | ------- | -------------------------------------------------- |
| creator       | address | the address of the user who creates a new token id |
| initialSupply | uint256 | initial supply of the newly created token id       |
| maxSupply     | uint256 | the max supply of the newly created token id       |

2. ### createCategory

```
event NewCategory(address indexed creator, string category);
```

| Syntax   | type    | description                                        |
| -------- | ------- | -------------------------------------------------- |
| creator  | address | the address of the user who creates a new category |
| category | string  | the name of the newly created category             |
