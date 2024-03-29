const RC3MallAddr = "0xEd59ad78e4B69d36d526cE6c22277E393f309Fcb"; //"0x4e6285EDD69EB5fD6000ea3B598557533286A919";

const RC3MallABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "caller",
        type: "address",
      },
      { indexed: true, internalType: "address", name: "nft", type: "address" },
      {
        indexed: true,
        internalType: "uint256",
        name: "auctionId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenID",
        type: "uint256",
      },
    ],
    name: "AuctionCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "caller",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "seller",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "highestBidder",
        type: "address",
      },
      { indexed: true, internalType: "address", name: "nft", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "auctionId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "winPrice",
        type: "uint256",
      },
    ],
    name: "AuctionResulted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "bidder",
        type: "address",
      },
      { indexed: true, internalType: "address", name: "nft", type: "address" },
      {
        indexed: true,
        internalType: "uint256",
        name: "auctionId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newEndPeriod",
        type: "uint256",
      },
    ],
    name: "AuctionUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "feeReceipient",
        type: "address",
      },
    ],
    name: "FeeRecipientSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "feePercentage",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "enum RC3_Mall.Asset",
        name: "asset",
        type: "uint8",
      },
    ],
    name: "FeeSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint8", name: "version", type: "uint8" },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "caller",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "nifty",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "marketId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "MarketCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "caller",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "seller",
        type: "address",
      },
      { indexed: true, internalType: "address", name: "nft", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "marketId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "enum RC3_Mall.Asset",
        name: "asset",
        type: "uint8",
      },
    ],
    name: "MarketSale",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "seller",
        type: "address",
      },
      { indexed: true, internalType: "address", name: "nft", type: "address" },
      {
        indexed: true,
        internalType: "uint256",
        name: "auctionId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "floorPrice",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "startPeriod",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "endPeriod",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "enum RC3_Auction.TokenType",
        name: "tokenType",
        type: "uint8",
      },
    ],
    name: "NewAuction",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "bidder",
        type: "address",
      },
      { indexed: true, internalType: "address", name: "nft", type: "address" },
      {
        indexed: true,
        internalType: "uint256",
        name: "auctionId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
    ],
    name: "NewBid",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "caller",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "nifty",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "marketId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "enum RC3_Auction.TokenType",
        name: "tokenType",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "enum RC3_Mall.Asset",
        name: "asset",
        type: "uint8",
      },
    ],
    name: "NewMarket",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [],
    name: "auctionId",
    outputs: [{ internalType: "uint256", name: "_value", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "auctionsClosed",
    outputs: [{ internalType: "uint256", name: "_value", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_auctionId", type: "uint256" },
      { internalType: "uint256", name: "_bidAmount", type: "uint256" },
    ],
    name: "bid",
    outputs: [{ internalType: "bool", name: "bidded", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_auctionId", type: "uint256" }],
    name: "bidTimeRemaining",
    outputs: [
      { internalType: "uint256", name: "startsIn", type: "uint256" },
      { internalType: "uint256", name: "endsIn", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_marketId", type: "uint256" }],
    name: "buyWithETH",
    outputs: [{ internalType: "bool", name: "bought", type: "bool" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_marketId", type: "uint256" }],
    name: "buyWithRCDY",
    outputs: [{ internalType: "bool", name: "bought", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_auctionId", type: "uint256" }],
    name: "closeBid",
    outputs: [
      { internalType: "enum RC3_Auction.State", name: "status", type: "uint8" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_marketId", type: "uint256" }],
    name: "delistMarket",
    outputs: [
      { internalType: "enum RC3_Auction.State", name: "status", type: "uint8" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "ethFee",
    outputs: [{ internalType: "uint96", name: "", type: "uint96" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feePercentage",
    outputs: [{ internalType: "uint96", name: "", type: "uint96" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feeRecipient",
    outputs: [{ internalType: "address payable", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_auctionId", type: "uint256" }],
    name: "getAuction",
    outputs: [
      {
        components: [
          { internalType: "address payable", name: "seller", type: "address" },
          {
            internalType: "address payable",
            name: "highestBidder",
            type: "address",
          },
          { internalType: "address", name: "nifty", type: "address" },
          { internalType: "uint256", name: "tokenId", type: "uint256" },
          { internalType: "uint256", name: "tokenAmount", type: "uint256" },
          {
            internalType: "uint256",
            name: "initialBidAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "highestBidAmount",
            type: "uint256",
          },
          { internalType: "uint256", name: "startPeriod", type: "uint256" },
          { internalType: "uint256", name: "endPeriod", type: "uint256" },
          { internalType: "uint256", name: "bidCount", type: "uint256" },
          {
            internalType: "enum RC3_Auction.TokenType",
            name: "tokenType",
            type: "uint8",
          },
          {
            internalType: "enum RC3_Auction.State",
            name: "state",
            type: "uint8",
          },
        ],
        internalType: "struct RC3_Auction.Auction",
        name: "auction_",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_marketId", type: "uint256" }],
    name: "getMarket",
    outputs: [
      {
        components: [
          { internalType: "address payable", name: "seller", type: "address" },
          {
            internalType: "enum RC3_Auction.TokenType",
            name: "tokenType",
            type: "uint8",
          },
          { internalType: "address payable", name: "buyer", type: "address" },
          {
            internalType: "enum RC3_Auction.State",
            name: "state",
            type: "uint8",
          },
          { internalType: "address", name: "nifty", type: "address" },
          { internalType: "enum RC3_Mall.Asset", name: "asset", type: "uint8" },
          { internalType: "uint256", name: "tokenId", type: "uint256" },
          { internalType: "uint256", name: "tokenAmount", type: "uint256" },
          { internalType: "uint256", name: "price", type: "uint256" },
          { internalType: "uint256", name: "listTimestamp", type: "uint256" },
        ],
        internalType: "struct RC3_Mall.Market",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_owner", type: "address" },
      { internalType: "address", name: "_rcdy", type: "address" },
      {
        internalType: "address payable",
        name: "_feeReceipient",
        type: "address",
      },
      { internalType: "uint96", name: "_feeRCDY", type: "uint96" },
      { internalType: "uint96", name: "_ethFee", type: "uint96" },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "nifty", type: "address" },
      { internalType: "uint256", name: "_tokenId", type: "uint256" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "_startsIn", type: "uint256" },
      { internalType: "uint256", name: "_lastsFor", type: "uint256" },
      { internalType: "uint256", name: "_initialBidAmount", type: "uint256" },
      {
        internalType: "enum RC3_Auction.TokenType",
        name: "_type",
        type: "uint8",
      },
    ],
    name: "listAuction",
    outputs: [{ internalType: "uint256", name: "auctionId_", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "nifty", type: "address" },
      { internalType: "uint256", name: "_tokenId", type: "uint256" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "_price", type: "uint256" },
      {
        internalType: "enum RC3_Auction.TokenType",
        name: "_type",
        type: "uint8",
      },
      { internalType: "enum RC3_Mall.Asset", name: "_asset", type: "uint8" },
    ],
    name: "listMarket",
    outputs: [{ internalType: "uint256", name: "marketId_", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "marketId",
    outputs: [{ internalType: "uint256", name: "_value", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "marketsDelisted",
    outputs: [{ internalType: "uint256", name: "_value", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "marketsSold",
    outputs: [{ internalType: "uint256", name: "_value", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_auctionId", type: "uint256" }],
    name: "nextBidAmount",
    outputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256[]", name: "", type: "uint256[]" },
      { internalType: "uint256[]", name: "", type: "uint256[]" },
      { internalType: "bytes", name: "", type: "bytes" },
    ],
    name: "onERC1155BatchReceived",
    outputs: [{ internalType: "bytes4", name: "", type: "bytes4" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "bytes", name: "", type: "bytes" },
    ],
    name: "onERC1155Received",
    outputs: [{ internalType: "bytes4", name: "", type: "bytes4" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "bytes", name: "", type: "bytes" },
    ],
    name: "onERC721Received",
    outputs: [{ internalType: "bytes4", name: "", type: "bytes4" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint96", name: "_newFee", type: "uint96" }],
    name: "setFeeETH",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint96", name: "_newFee", type: "uint96" }],
    name: "setFeeRCDY",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address payable",
        name: "_newRecipient",
        type: "address",
      },
    ],
    name: "setFeeRecipient",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "waitPeriod",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];
module.exports = { RC3MallAddr: RC3MallAddr, RC3MallABI: RC3MallABI };
