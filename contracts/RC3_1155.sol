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

    mapping(uint256 => uint256) private _totalSupply;
    mapping(address => bool) private _markets;
    mapping(uint256 => address) public creators;
    mapping(uint256 => string) customUri;

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
        require(
            creators[id] == _msgSender(),
            "ERC1155Tradable#creatorOnly: ONLY_CREATOR_ALLOWED"
        );
        _;
    }

    modifier adminOnly() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "UNAUTHORIZED_CALLER"
        );
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

    function updateMarket(address market, bool isMarket) external adminOnly {
        require(market != address(0), "ZERO_ADDRESS");

        _markets[market] = isMarket;
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

    function _setCreator(address to, uint256 id) internal creatorOnly(id) {
        creators[id] = to;
    }

    function create(
        address initialOwner,
        uint256 id,
        uint256 initialSupply,
        string memory _uri,
        bytes memory data
    ) public adminOnly returns (uint256) {
        require(!exists(id), "token _id already exists");
        creators[id] = _msgSender();

        if (bytes(_uri).length > 0) {
            customUri[id] = _uri;
            emit URI(_uri, id);
        }

        if (initialSupply > 0) {
            require(initialOwner != address(0), "INVALID_INITIAL_OWNER");
            _totalSupply[id] = initialSupply;
            _mint(initialOwner, id, initialSupply, data);
        }
        emit NewToken(msg.sender, id, initialSupply);
        return id;
    }

    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual creatorOnly(id) {
        _mint(to, id, amount, data);
        _totalSupply[id] += amount;
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public {
        uint256 len = ids.length;
        for (uint256 i = 0; i < len; i++) {
            uint256 id = ids[i];
            address addr = creators[id];
            require(
                addr == _msgSender(),
                "ERC1155Tradable#batchMint: ONLY_CREATOR_ALLOWED"
            );
            uint256 quantity = amounts[i];
            _totalSupply[id] += quantity;
        }
        _mintBatch(to, ids, amounts, data);
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
        return (creators[id], calculateRoyalty(price));
    }

    function calculateRoyalty(uint256 price) public view returns (uint256) {
        return (price / 10000) * royalty;
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
        if (_markets[operator]) return true;

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

        if (from == address(0)) {
            for (uint256 i = 0; i < ids.length; ++i) {
                _totalSupply[ids[i]] += amounts[i];
            }
        }

        if (to == address(0)) {
            for (uint256 i = 0; i < ids.length; ++i) {
                _totalSupply[ids[i]] -= amounts[i];
            }
        }
    }
}
