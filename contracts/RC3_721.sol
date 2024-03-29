// SPDX-License-Identifier: MIT

pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract RC3_721 is
    AccessControlEnumerable,
    ERC721Burnable,
    ERC721URIStorage,
    ERC721Enumerable
{
    using Counters for Counters.Counter;

    Counters.Counter private _id;
    uint96 public immutable royalty;
    address payable private feeTaker;
    string private _uri;

    mapping(address => bool) public isWhitelistedMarket;

    event MarketUpdated(
        address indexed admin,
        address indexed market,
        bool ismarket
    );

    event RoyaltyInfoUpdated(address indexed caller, address indexed receiver);

    constructor(
        string memory _name,
        string memory _symbol,
        string memory uri,
        address payable _feeTaker,
        uint96 _royalty //1% = 100
    ) ERC721(_name, _symbol) {
        require(_feeTaker != address(0), "Invalid address");
        _uri = uri;
        feeTaker = _feeTaker;
        royalty = _royalty;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    modifier adminOnly() {
        _adminOnly();
        _;
    }

    function _baseURI() internal view override returns (string memory) {
        return _uri;
    }

    function baseURI() external view returns (string memory) {
        return _baseURI();
    }

    function setCustomURI(uint256 _tokenId, string memory _newURI)
        external
        adminOnly
    {
        _setTokenURI(_tokenId, _newURI);
    }

    function setMarket(address market, bool isMarket) external adminOnly {
        require(market != address(0), "ZERO_ADDRESS");

        isWhitelistedMarket[market] = isMarket;
        emit MarketUpdated(msg.sender, market, isMarket);
    }

    function mint(address to) external adminOnly returns (uint256 newItemId) {
        _id.increment();
        newItemId = _id.current();
        _safeMint(to, newItemId);
    }

    function setRoyaltyInfo(address payable _receiver) external adminOnly {
        require(_receiver != address(0), "INVALID_ADDRESS");
        feeTaker = _receiver;
        emit RoyaltyInfoUpdated(msg.sender, _receiver);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function royaltyInfo(uint256 price)
        external
        view
        returns (address, uint256)
    {
        return (feeTaker, calculateRoyalty(price));
    }

    function calculateRoyalty(uint256 price) public view returns (uint256) {
        return (price * royalty) / 10000;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControlEnumerable, ERC721, ERC721Enumerable)
        returns (bool itSupports)
    {
        //bytes4(keccak256("royaltyInfo(uint256)"))
        return
            interfaceId == 0xcef6d368 ||
            interfaceId == 0x2a55205a ||
            super.supportsInterface(interfaceId);
    }

    function isApprovedForAll(address owner, address operator)
        public
        view
        override
        returns (bool isOperator)
    {
        if (isWhitelistedMarket[operator]) return true;

        return ERC721.isApprovedForAll(owner, operator);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721URIStorage, ERC721)
        returns (string memory URI)
    {
        return super.tokenURI(tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 id
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, id);
    }

    function _adminOnly() private view {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "UNAUTHORIZED_CALLER"
        );
    }
}
