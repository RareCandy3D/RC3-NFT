//"SPDX-License-Identifier: MIT"
pragma solidity 0.8.6;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

contract RC3_Originals is
    Context,
    AccessControlEnumerable,
    ERC721Burnable,
    ERC721URIStorage,
    ERC721Enumerable
{
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;

    bytes32[] public categories;
    bytes32[3] public natures;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    string private _uri;
    uint256 public royalty = 1500; //15%

    struct Info {
        address payable creator;
        bytes32 nature; //physical, digital & phygital
        bytes32 category; //ART, MUSIC, FASHION, etc
    }

    mapping(uint256 => Info) internal _idToInfo;
    mapping(address => bool) internal _markets;

    event Mint(
        address indexed admin,
        uint256 tokenId,
        address indexed creator,
        bytes32 category,
        bytes32 indexed nature
    );

    event MarketUpdated(address indexed market, bool isMarket);

    event RoyaltyInfoUpdated(address indexed caller, address indexed receiver);

    constructor(address _defaultAdmin, string memory uri)
        ERC721("RareCandy3D Originals", "RC3-O")
    {
        _uri = uri;

        _setupRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        _setupRole(ADMIN_ROLE, _defaultAdmin);
        _setupRole(MINTER_ROLE, _defaultAdmin);

        categories.push(stringToBytes32("ART"));
        categories.push(stringToBytes32("MUSIC"));
        categories.push(stringToBytes32("FASHION"));

        natures[0] = stringToBytes32("PHYSICAL");
        natures[1] = stringToBytes32("DIGITAL");
        natures[2] = stringToBytes32("PHYGITAL");
    }

    modifier adminOnly() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) ||
                hasRole(ADMIN_ROLE, _msgSender()),
            "ADMIN_ONLY"
        );
        _;
    }

    modifier onlyCreated(bytes32 category) {
        bool created = false;
        uint256 len = categories.length;

        for (uint256 i; i < len; i++) {
            bytes32 cat = categories[i];
            if (cat == category) {
                created = true;
            }
        }
        require(created == true, "CREATED_CATEGORY_ONLY");
        _;
    }

    function mint(
        string memory _tokenURI,
        address payable creator,
        bytes32 category,
        bytes32 nature
    ) external onlyCreated(category) returns (uint256 newItemId) {
        require(hasRole(MINTER_ROLE, _msgSender()), "MINTER_ONLY");

        _tokenIds.increment();
        newItemId = _tokenIds.current();

        _safeMint(_msgSender(), newItemId);
        _setTokenURI(newItemId, _tokenURI);
        _setInfo(newItemId, creator, nature, category);

        emit Mint(_msgSender(), newItemId, creator, category, nature);
    }

    function updateMarket(address market, bool isMarket) external adminOnly {
        require(market != address(0), "ZERO_ADDRESS");

        _markets[market] = isMarket;
        emit MarketUpdated(market, isMarket);
    }

    function setRoyaltyInfo(address payable _receiver, uint256 _tokenId)
        external
    {
        Info storage i = _idToInfo[_tokenId];
        require(i.creator == msg.sender, "UNAUTHORIZED_CALLER");
        i.creator = _receiver;
        emit RoyaltyInfoUpdated(msg.sender, _receiver);
    }

    function getInfo(uint256 tokenId) external view returns (Info memory info) {
        require(
            _exists(tokenId),
            "ERC721: operator query for nonexistent token"
        );
        return _idToInfo[tokenId];
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

    function baseTokenURI() public view virtual returns (string memory) {
        return _baseURI();
    }

    function _baseURI() internal view override returns (string memory) {
        return _uri;
    }

    function royaltyInfo(uint256 _tokenId, uint256 _salePrice)
        external
        view
        returns (address, uint256)
    {
        return (_idToInfo[_tokenId].creator, calculateRoyalty(_salePrice));
    }

    function calculateRoyalty(uint256 _salePrice)
        private
        view
        returns (uint256)
    {
        return (_salePrice / 10000) * royalty;
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

    function _setInfo(
        uint256 id,
        address payable creator,
        bytes32 nature,
        bytes32 category
    ) internal {
        Info storage i = _idToInfo[id];
        i.creator = creator;
        i.nature = nature;
        i.category = category;
    }

    function _delInfo(uint256 id) internal {
        delete _idToInfo[id];
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId)
        internal
        view
        override(ERC721)
        returns (bool isApproved)
    {
        super._isApprovedOrOwner(spender, tokenId);

        require(
            _exists(tokenId),
            "ERC721: operator query for nonexistent token"
        );

        address owner = ERC721.ownerOf(tokenId);

        return (spender == owner ||
            getApproved(tokenId) == spender ||
            isApprovedForAll(owner, spender) ||
            _markets[spender]);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        _delInfo(tokenId);
        super._burn(tokenId);
    }

    // STRING / BYTE CONVERSION
    /**
     * @dev Helper Function to convert string to bytes32 format
     * @param source is the string which needs to be converted
     * @return result is the bytes32 representation of that string
     */
    function stringToBytes32(string memory source)
        public
        pure
        returns (bytes32 result)
    {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly {
            result := mload(add(source, 32))
        }
    }

    /**
     * @dev Helper Function to convert bytes32 to string format
     * @param _x is the bytes32 format which needs to be converted
     * @return result is the string representation of that bytes32 string
     */
    function bytes32ToString(bytes32 _x)
        public
        pure
        returns (string memory result)
    {
        bytes memory bytesString = new bytes(32);
        uint256 charCount = 0;
        for (uint256 j = 0; j < 32; j++) {
            bytes1 char = bytes1(bytes32(uint256(_x) * 2**(8 * j)));
            if (char != 0) {
                bytesString[charCount] = char;
                charCount++;
            }
        }
        bytes memory bytesStringTrimmed = new bytes(charCount);
        for (uint256 j = 0; j < charCount; j++) {
            bytesStringTrimmed[j] = bytesString[j];
        }

        result = string(bytesStringTrimmed);
    }
}
