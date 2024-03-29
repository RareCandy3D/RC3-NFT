// SPDX-License-Identifier: MIT

pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract RC3_1155 is AccessControlEnumerable, ERC1155Burnable {
    string public name;
    string public symbol;
    uint96 public immutable royalty;
    uint256 private _currentTokenID;

    mapping(uint256 => uint256) private _totalSupply;
    mapping(uint256 => uint256) public maxSupply;
    mapping(address => bool) public isWhitelistedMarket;
    mapping(uint256 => address) public creators;
    mapping(uint256 => string) private customUris;

    event NewToken(
        address indexed admin,
        uint256 indexed id,
        uint256 initialSupply
    );

    event MarketUpdated(
        address indexed admin,
        address indexed market,
        bool ismarket
    );

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _uri,
        uint96 _royalty //1% = 100
    ) ERC1155(_uri) {
        name = _name;
        symbol = _symbol;
        royalty = _royalty;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    modifier creatorOnly(uint256 id) {
        _creatorOnly(id);
        _;
    }

    modifier adminOnly() {
        _adminOnly();
        _;
    }

    function uri(uint256 _id) public view override returns (string memory) {
        require(exists(_id), "ERC1155Tradable#uri: NONEXISTENT_TOKEN");
        // We have to convert string to bytes to check for existence
        string memory uri_ = customUris[_id];
        bytes memory customUriBytes = bytes(uri_);
        if (customUriBytes.length > 0) {
            return uri_;
        } else {
            return super.uri(_id);
        }
    }

    function setURI(string memory _newURI) external adminOnly {
        _setURI(_newURI);
    }

    function setCustomURI(uint256 _tokenId, string memory _newURI)
        external
        creatorOnly(_tokenId)
    {
        customUris[_tokenId] = _newURI;
        emit URI(_newURI, _tokenId);
    }

    function setMarket(address market, bool isMarket) external adminOnly {
        require(market != address(0), "ZERO_ADDRESS");

        isWhitelistedMarket[market] = isMarket;
        emit MarketUpdated(msg.sender, market, isMarket);
    }

    function setCreator(address to, uint256[] memory ids) external {
        require(
            to != address(0),
            "ERC1155Tradable#setCreator: INVALID_ADDRESS."
        );
        uint256 len = ids.length;
        for (uint256 i = 0; i < len; i++) {
            uint256 id = ids[i];
            _setCreator(to, id);
        }
    }

    function create(
        address initialOwner,
        uint256 initialSupply,
        uint256 maxSupply_,
        string memory _uri
    ) external adminOnly returns (uint256 createdId) {
        require(initialSupply <= maxSupply_, "SUPPLY_ERR");
        uint256 id = _nextIdPrint();
        creators[id] = _msgSender();
        maxSupply[id] = maxSupply_;

        if (bytes(_uri).length > 0) {
            customUris[id] = _uri;
            emit URI(_uri, id);
        }

        if (initialSupply > 0) {
            _totalSupply[id] = initialSupply;
            _mint(initialOwner, id, initialSupply, "0x0");
        }

        emit NewToken(msg.sender, id, initialSupply);
        return id;
    }

    function mint(
        address to,
        uint256 id,
        uint256 amount
    ) external creatorOnly(id) {
        uint256 tokenSupply = _totalSupply[id];
        uint256 maxSupply_ = maxSupply[id];
        require(tokenSupply + amount <= maxSupply_, "MAX_SUPPLY_REACHED");
        _totalSupply[id] += amount;
        _mint(to, id, amount, "0x0");
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts
    ) external {
        uint256 len = ids.length;
        for (uint256 i = 0; i < len; i++) {
            uint256 id = ids[i];
            address addr = creators[id];
            uint256 tokenSupply = _totalSupply[id];
            uint256 maxSupply_ = maxSupply[id];
            uint256 amount = amounts[i];
            require(
                addr == _msgSender(),
                "ERC1155Tradable#batchMint: ONLY_CREATOR_ALLOWED"
            );
            require(tokenSupply + amount <= maxSupply_, "MAX_SUPPLY_REACHED");
            uint256 quantity = amount;
            _totalSupply[id] += quantity;
        }
        _mintBatch(to, ids, amounts, "0x0");
    }

    function burn(
        address from,
        uint256 id,
        uint256 amount
    ) public override {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()),
            "ERR_NOT_APPROVED"
        );

        _burn(from, id, amount);
        _totalSupply[id] -= amount;
        maxSupply[id] -= amount;
    }

    function burnBatch(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) public override {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()),
            "ERR_NOT_APPROVED"
        );

        _burnBatch(from, ids, amounts);

        uint256 len = ids.length;
        for (uint256 i; i < len; i++) {
            uint256 id = ids[i];
            uint256 amt = amounts[i];
            _totalSupply[id] -= amt;
            maxSupply[id] -= amt;
        }
    }

    function totalSupply(uint256 id) public view returns (uint256) {
        return _totalSupply[id];
    }

    function exists(uint256 id) public view returns (bool) {
        return totalSupply(id) > 0;
    }

    function royaltyInfo(uint256 id, uint256 price)
        external
        view
        returns (address, uint256)
    {
        return (creators[id], _calculateRoyalty(price));
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControlEnumerable, ERC1155)
        returns (bool)
    {
        //bytes4(keccak256("royaltyInfo(uint256,uint256)")) == 0x2a55205a
        return
            interfaceId == 0x2a55205a || super.supportsInterface(interfaceId);
    }

    function isApprovedForAll(address owner, address operator)
        public
        view
        override
        returns (bool isOperator)
    {
        if (isWhitelistedMarket[operator]) return true;

        return ERC1155.isApprovedForAll(owner, operator);
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function _calculateRoyalty(uint256 price) private view returns (uint256) {
        uint256 roy = royalty;
        return (price * roy) / 10000;
    }

    function _setCreator(address to, uint256 id) private {
        _creatorOnly(id);
        creators[id] = to;
    }

    function _nextIdPrint() private returns (uint256) {
        _currentTokenID++;
        return _currentTokenID;
    }

    function _creatorOnly(uint256 id) private view {
        address addr = creators[id];
        require(addr == _msgSender(), "ONLY_CREATOR_ALLOWED");
    }

    function _adminOnly() private view {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "UNAUTHORIZED_CALLER"
        );
    }
}
