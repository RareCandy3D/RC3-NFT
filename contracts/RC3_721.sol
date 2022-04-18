// SPDX-License-Identifier: MIT

pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract RC3_721 is
    Context,
    AccessControlEnumerable,
    ERC721Burnable,
    ERC721URIStorage,
    ERC721Enumerable
{
    using Counters for Counters.Counter;

    Counters.Counter private _id;
    uint96 public royalty;
    string private _uri;
    address payable feeTaker;

    mapping(address => bool) internal _markets;
    event MarketUpdated(address admin, address indexed market, bool ismarket);

    constructor(
        string memory _name,
        string memory _symbol,
        string memory uri,
        address payable _feeTaker,
        uint96 _royalty //1% = 100
    ) ERC721(_name, _symbol) {
        _uri = uri;
        feeTaker = _feeTaker;
        royalty = _royalty;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    modifier adminOnly() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "UNAUTHORIZED_CALLER"
        );
        _;
    }

    function _baseURI() internal view override returns (string memory) {
        return _uri;
    }

    function baseTokenURI() external view returns (string memory) {
        return _baseURI();
    }

    function setCustomURI(uint256 _tokenId, string memory _newURI)
        public
        adminOnly
    {
        _setTokenURI(_tokenId, _newURI);
    }

    function updateMarket(address market, bool isMarket) external adminOnly {
        require(market != address(0), "ZERO_ADDRESS");

        _markets[market] = isMarket;
        emit MarketUpdated(msg.sender, market, isMarket);
    }

    function mint(address to, uint256 id) public adminOnly {
        _safeMint(to, id);
    }

    function setFeeTaker(address payable _feeTaker) external adminOnly {
        require(_feeTaker != address(0), "INVALID_ADDRESS");
        feeTaker = _feeTaker;
    }

    function setRoyaltyInfo(address payable _feeTaker) external adminOnly {
        require(_feeTaker != address(0), "INVALID_ADDRESS");
        feeTaker = _feeTaker;
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
        return (price / 10000) * royalty;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControlEnumerable, ERC721, ERC721Enumerable)
        returns (bool itSupports)
    {
        //bytes4(keccak256("royaltyInfo(uint256,uint256)"))
        return
            interfaceId == 0x2a55205a || super.supportsInterface(interfaceId);
    }

    function isApprovedForAll(address owner, address operator)
        public
        view
        override
        returns (bool isOperator)
    {
        if (_markets[operator]) return true;

        return ERC721.isApprovedForAll(owner, operator);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override(ERC721URIStorage, ERC721)
        returns (string memory URI)
    {
        return super.tokenURI(tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 id
    ) internal virtual override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, id);
    }
}
