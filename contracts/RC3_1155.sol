// SPDX-License-Identifier: MIT

pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract RC3_1155 is Context, AccessControlEnumerable, ERC1155Burnable {
    string public name;
    string public symbol;
    uint96 public royalty;
    uint256 private _currentTokenID;

    mapping(uint256 => uint256) private _totalSupply;
    mapping(uint256 => uint256) public maxSupply;
    mapping(address => bool) public isWhitelistedMarket;
    mapping(uint256 => address) public creators;
    mapping(uint256 => string) private customUri;

    event NewToken(
        address indexed admin,
        uint256 indexed id,
        uint256 initialSupply
    );

    event MarketUpdated(address admin, address indexed market, bool ismarket);

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
        bytes memory customUriBytes = bytes(customUri[_id]);
        if (customUriBytes.length > 0) {
            return customUri[_id];
        } else {
            return super.uri(_id);
        }
    }

    function setURI(string memory _newURI) public adminOnly {
        _setURI(_newURI);
    }

    function setCustomURI(uint256 _tokenId, string memory _newURI)
        public
        creatorOnly(_tokenId)
    {
        customUri[_tokenId] = _newURI;
        emit URI(_newURI, _tokenId);
    }

    function setMarket(address market, bool isMarket) external adminOnly {
        require(market != address(0), "ZERO_ADDRESS");

        isWhitelistedMarket[market] = isMarket;
        emit MarketUpdated(msg.sender, market, isMarket);
    }

    function setCreator(address to, uint256[] memory ids) public {
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
    ) public adminOnly returns (uint256) {
        require(initialSupply <= maxSupply_, "SUPPLY_ERR");
        uint256 id = _getNextTokenID();
        _incrementTokenTypeId();
        creators[id] = _msgSender();
        maxSupply[id] = maxSupply_;

        if (initialSupply > 0) {
            _totalSupply[id] = initialSupply;
            _mint(initialOwner, id, initialSupply, "0x0");
        }

        if (bytes(_uri).length > 0) {
            customUri[id] = _uri;
            emit URI(_uri, id);
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
        _mint(to, id, amount, "0x0");
        _totalSupply[id] += amount;
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

    function totalSupply(uint256 id) public view virtual returns (uint256) {
        return _totalSupply[id];
    }

    function exists(uint256 id) public view virtual returns (bool) {
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
        virtual
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
    ) internal virtual override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function _calculateRoyalty(uint256 price) private view returns (uint256) {
        return (price * royalty) / 10000;
    }

    function _setCreator(address to, uint256 id) private creatorOnly(id) {
        creators[id] = to;
    }

    function _getNextTokenID() private view returns (uint256) {
        return _currentTokenID + 1;
    }

    function _incrementTokenTypeId() private {
        _currentTokenID++;
    }

    function _creatorOnly(uint256 id) private view {
        require(creators[id] == _msgSender(), "ONLY_CREATOR_ALLOWED");
    }

    function _adminOnly() private view {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "UNAUTHORIZED_CALLER"
        );
    }
}
