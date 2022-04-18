//"SPDX-License-Identifier: MIT"
pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract RC3_Creators is Context, ERC1155, AccessControlEnumerable {
    bytes32[] public categories;
    bytes32[3] public natures;

    uint256 private _currentTokenID;
    uint256 public creationFee = 0.01 ether;
    address payable public feeCollector;

    struct Info {
        address payable creator;
        bytes32 nature; //physical, digital & phygital
        bytes32 category; //ART, MUSIC, FASHION, etc
        uint256 totalSupply;
        uint256 maxSupply;
        uint256 royalty; //1% = 100
        string customUri;
        Royalty[] shares;
    }

    struct Royalty {
        address payable recipient;
        uint256 share; //1% = 1000
    }

    mapping(uint256 => Info) private _idToInfo;
    mapping(address => bool) private _markets;
    mapping(uint256 => mapping(address => bool)) public canMint;

    event NewCategory(address indexed creator, string category);
    event MarketUpdated(address indexed market, bool isMarket);
    event RoyaltyInfoUpdated(
        address indexed oldCreator,
        address indexed newCreator,
        uint256[] ids,
        uint256[] royalties,
        address payable[] recipients,
        uint256[] shares
    );
    event NewToken(
        address indexed creator,
        uint256 initialSupply,
        uint256 maxSupply
    );
    event MinterSet(
        address indexed caller,
        uint256 id,
        address indexed minter,
        bool canMint
    );

    //split between royalty wallets
    constructor(address defaultAdmin, string memory _uri) ERC1155(_uri) {
        _setupRole(DEFAULT_ADMIN_ROLE, defaultAdmin);

        categories.push(stringToBytes32("ART"));
        categories.push(stringToBytes32("MUSIC"));
        categories.push(stringToBytes32("FASHION"));

        natures[0] = stringToBytes32("PHYSICAL");
        natures[1] = stringToBytes32("DIGITAL");
        natures[2] = stringToBytes32("PHYGITAL");
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "ERR_ADMIN_ONLY");
        _;
    }

    modifier creatorOnly(uint256 id) {
        address addr = creators(id);
        require(addr == _msgSender(), "ERR_ONLY_CREATOR");
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

    modifier onlyViableRoyalty(uint256 royalty) {
        //maximum royalty is 50%
        require(royalty <= 5000, "MAX_ROYALTY_EXCEEDED");
        _;
    }

    modifier onlyNonCreated(bytes32 category) {
        bool created = false;
        uint256 len = categories.length;
        for (uint256 i; i < len; i++) {
            bytes32 cat = categories[i];
            if (cat == category) {
                created = true;
            }
        }
        require(created == false, "NON-CREATED_CATEGORY_ONLY");
        _;
    }

    modifier onlyValidShares(
        address payable[] memory recipients,
        uint256[] memory shares
    ) {
        require(recipients.length == shares.length, "INVALID_INPUT_LENGTH");
        uint256 len = shares.length;
        uint256 total;
        for (uint256 i; i < len; i++) {
            uint256 sh = shares[i];
            total += sh;
        }
        require(total == 1000, "INVALID_TOTAL_PERCENT");
        _;
    }

    function createCategory(bytes32 category)
        external
        onlyNonCreated(category)
        returns (string memory category_)
    {
        categories.push(category);
        category_ = bytes32ToString(category);
        emit NewCategory(msg.sender, bytes32ToString(category));
    }

    function setURI(string memory _newURI) public onlyAdmin {
        _setURI(_newURI);
    }

    function setCustomURI(uint256 id, string memory newURI)
        external
        creatorOnly(id)
    {
        _idToInfo[id].customUri = newURI;
        emit URI(newURI, id);
    }

    function setMinter(
        uint256 id,
        address minter,
        bool _canMint
    ) external creatorOnly(id) {
        bool status = canMint[id][minter];
        require(status != _canMint, "ALREADY_SET");
        canMint[id][minter] = _canMint;
        emit MinterSet(msg.sender, id, minter, _canMint);
    }

    function setRoyaltyInfo(
        address payable creator,
        address payable[] memory recipients,
        uint256[] memory shares,
        uint256[] memory ids,
        uint256[] memory royalties //1% = 100. max is 15% ~ 1500
    ) external onlyValidShares(recipients, shares) {
        require(creator != address(0), "INVALID_ADDRESS.");
        uint256 len = ids.length;

        for (uint256 i = 0; i < len; i++) {
            uint256 roy = royalties[i];
            uint256 id = ids[i];
            require(roy <= 1500, "MAX_ROYALTY_EXCEEDED");
            _setCreator(creator, id, roy, recipients, shares);
        }
        emit RoyaltyInfoUpdated(
            msg.sender,
            creator,
            ids,
            royalties,
            recipients,
            shares
        );
    }

    function updateMarket(address market, bool isMarket) external onlyAdmin {
        require(market != address(0), "ZERO_ADDRESS");

        _markets[market] = isMarket;
        emit MarketUpdated(market, isMarket);
    }

    function setFeeCollector(address payable _newFeeReceipient)
        external
        onlyAdmin
    {
        address rec = feeReceipient;
        require(_newFeeReceipient != rec, "ALREADY_EXISTS");
        feeReceipient = _newFeeReceipient;
    }

    function createToken(
        address _initialHodler,
        uint256 _initialSupply,
        uint256 _maxSupply,
        uint256 royalty, //1% = 100. max is 50% ~ 5000
        address payable[] memory recipients,
        uint256[] memory shares,
        bytes32 category,
        bytes32 nature,
        string memory _uri
    )
        external
        payable
        onlyCreated(category)
        onlyViableRoyalty(royalty)
        returns (uint256 tokenId)
    {
        require(msg.value >= creationFee, "FEE_NOT_SENT");
        _createToken(
            _initialHodler,
            _initialSupply,
            _maxSupply,
            royalty,
            recipients,
            shares,
            category,
            nature,
            _uri
        );
        return _getNextTokenID() - 1;
    }

    function mint(
        address to,
        uint256 id,
        uint256 amount
    ) external creatorOnly(id) returns (bool success) {
        Info storage info = _idToInfo[id];

        require(
            info.totalSupply + amount <= info.maxSupply,
            "MAX_SUPPLY_REACHED"
        );

        info.totalSupply += amount;
        _mint(to, id, amount, "0x0");
        return true;
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts
    ) external returns (bool success) {
        require(ids.length == amounts.length, "ERR_ARRAY_MISSMATCH");

        uint256 len = ids.length;
        for (uint256 i; i < len; i++) {
            Info storage info = _idToInfo[ids[i]];

            require(
                info.totalSupply + amounts[i] <= info.maxSupply,
                "MAX_SUPPLY_REACHED"
            );

            address addr = creators(ids[i]);
            require(addr == _msgSender(), "ERR_ONLY_CREATOR");

            info.totalSupply += amounts[i];
        }

        _mintBatch(to, ids, amounts, "0x0");
        return true;
    }

    function burn(
        address from,
        uint256 id,
        uint256 amount
    ) external {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()),
            "ERR_NOT_APPROVED"
        );

        _burn(from, id, amount);
        Info storage info = _idToInfo[id];
        info.totalSupply -= amount;
        info.maxSupply -= amount;
    }

    function burnBatch(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) external {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()),
            "ERR_NOT_APPROVED"
        );

        _burnBatch(from, ids, amounts);

        for (uint256 i; i < ids.length; i++) {
            Info storage info = _idToInfo[ids[i]];
            info.totalSupply -= amounts[i];
            info.maxSupply -= amounts[i];
        }
    }

    function tokenSupply(uint256 _id)
        external
        view
        returns (uint256 tokenSupply_)
    {
        return _idToInfo[_id].totalSupply;
    }

    function maxSupply(uint256 _id) public view returns (uint256 maxSupply_) {
        return _idToInfo[_id].maxSupply;
    }

    function creators(uint256 _id) public view returns (address creator) {
        return _idToInfo[_id].creator;
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

    function isApprovedForAll(address _owner, address _operator)
        public
        view
        override
        returns (bool isOperator)
    {
        if (_markets[_operator]) return true;

        return ERC1155.isApprovedForAll(_owner, _operator);
    }

    function royaltyInfo(uint256 _tokenId, uint256 _salePrice)
        external
        view
        returns (Royalty[] memory, uint256)
    {
        Info memory info = _idToInfo[_tokenId];

        uint256 len = info.shares.length;
        uint256 count;
        uint256 currentIndex;

        for (uint256 i; i < len; i++) {
            if (info.shares[i + 1].recipient != address(0)) {
                count++;
            }
        }

        Royalty[] memory shares = new Royalty[](count);

        for (uint256 i; i < len; i++) {
            Royalty[] memory share = _idToInfo[i + 1].shares;
            if (share[i + 1].recipient != address(0)) {
                shares[currentIndex] = share[i + 1];
                currentIndex++;
            }
        }
        return (shares, calculateRoyalty(_salePrice, info.royalty));
    }

    function calculateRoyalty(uint256 _salePrice, uint256 royalty)
        private
        pure
        returns (uint256)
    {
        return (_salePrice / 10000) * royalty;
    }

    function exists(uint256 _id) external view returns (bool) {
        return _exists(_id);
    }

    function uri(uint256 id) public view override returns (string memory) {
        require(_exists(id), "NONEXISTENT_TOKEN");
        // We have to convert string to bytes to check for existence
        Info storage info = _idToInfo[id];
        bytes memory customUriBytes = bytes(info.customUri);
        if (customUriBytes.length > 0) {
            return info.customUri;
        } else {
            return super.uri(id);
        }
    }

    function _createToken(
        address _initialHodler,
        uint256 _initialSupply,
        uint256 _maxSupply,
        uint256 _royalty, //1% = 100. max is 50% ~ 5000
        address payable[] memory _recipients,
        uint256[] memory _shares,
        bytes32 _category,
        bytes32 _nature,
        string memory _uri
    ) private onlyValidShares(_recipients, _shares) {
        address initialHodler = _initialHodler;
        uint256 initialSupply = _initialSupply;
        uint256 maxSupply_ = _maxSupply;
        uint256 royalty = _royalty;
        uint256[] memory shares = _shares;
        address payable[] memory recipients = _recipients;
        string memory uri_ = _uri;
        bytes32 category = _category;
        bytes32 nature = _nature;
        require(initialSupply <= maxSupply_, "ERR_IN_SUPPLY");

        uint256 id = _getNextTokenID();
        _incrementTokenTypeId();

        feeCollector.transfer(msg.value);

        Info storage info = _idToInfo[id];
        info.creator = payable(_msgSender());
        info.category = category;
        info.nature = nature;
        info.royalty = royalty;
        info.maxSupply = maxSupply_;

        uint256 _id = id;
        uint256 len = shares.length;
        for (uint256 i; i < len; i++) {
            uint256 shr = shares[i];
            address payable rec = recipients[i];
            info.shares[i].share = shr;
            info.shares[i].recipient = rec;
        }

        if (initialSupply > 0) {
            _mint(initialHodler, _id, initialSupply, "0x0");
            info.totalSupply = initialSupply;
        }

        if (bytes(uri_).length > 0) {
            info.customUri = uri_;
            emit URI(uri_, _id);
        }

        emit NewToken(msg.sender, initialSupply, maxSupply_);
    }

    function _setCreator(
        address payable creator,
        uint256 id,
        uint256 royalty,
        address payable[] memory recipients,
        uint256[] memory shares
    ) internal creatorOnly(id) {
        Info storage info = _idToInfo[id];
        info.creator = creator;
        info.royalty = royalty;

        uint256 len = shares.length;
        for (uint256 i; i < len; i++) {
            uint256 shr = shares[i];
            address payable rec = recipients[i];
            info.shares[i].share = shr;
            info.shares[i].recipient = rec;
        }
    }

    function _getNextTokenID() private view returns (uint256) {
        return _currentTokenID + 1;
    }

    function _incrementTokenTypeId() private {
        _currentTokenID++;
    }

    function _exists(uint256 _id) private view returns (bool) {
        return _idToInfo[_id].creator != address(0);
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
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
