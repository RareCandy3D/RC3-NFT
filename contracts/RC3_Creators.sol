//"SPDX-License-Identifier: MIT"
pragma solidity 0.8.6;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract RC3_Creators is ERC1155, AccessControlEnumerable {
    bytes32[] private _categories;
    bytes32[3] private _natures;

    uint256 public serialNum;
    uint256 public constant creationFee = 0.01 ether;
    uint256 public constant splitRoyaltyLimit = 10;
    address payable public feeReceipient;

    struct Info {
        address payable creator;
        bytes32 nature; //physical, digital & phygital
        bytes32 category; //ART, MUSIC, FASHION, etc
        uint256 tokenSupply;
        uint256 maxSupply;
        uint256 royalty; //1% = 100
    }

    struct Royalty {
        uint256 index;
        mapping(uint256 => address payable) recipients;
        mapping(uint256 => uint256) shares; //1% = 1000
    }

    mapping(uint256 => Info) private _idToInfo;
    mapping(uint256 => uint256) public serialNumToId;
    mapping(uint256 => Royalty) private _idToRoyalty;
    mapping(address => bool) public isWhitelistedMarket;
    mapping(address => bool) public canCreatePhysical;
    mapping(uint256 => mapping(address => bool)) public canMint;

    event NewCategory(address indexed creator, string category);
    event MarketUpdated(address indexed market, bool isMarket);
    event RoyaltyInfoUpdated(
        address indexed oldCreator,
        address indexed newCreator,
        uint256 id,
        uint256 royalty,
        address payable[] recipients,
        uint256[] shares
    );
    event NewToken(
        address indexed creator,
        uint256 initialSupply,
        uint256 maxSupply,
        uint256 id
    );
    event MinterSet(
        address indexed caller,
        uint256 id,
        address indexed minter,
        bool canMint
    );
    event PhysicalCreatorSet(address indexed addr, bool canCreatePhysical);

    constructor(address defaultAdmin, address payable feeCollector)
        ERC1155("ipfs://f0")
    {
        feeReceipient = feeCollector;
        _setupRole(DEFAULT_ADMIN_ROLE, defaultAdmin);

        _categories.push(stringToBytes32("ART"));
        _categories.push(stringToBytes32("MUSIC"));
        _categories.push(stringToBytes32("FASHION"));

        _natures[0] = stringToBytes32("PHYSICAL");
        _natures[1] = stringToBytes32("DIGITAL");
        _natures[2] = stringToBytes32("PHYGITAL");
    }

    //________________//
    // MODIFIERS
    //----------------//

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "ERR_ADMIN_ONLY");
        _;
    }

    modifier creatorOnly(uint256 id) {
        address addr = creator(id);
        require(addr == _msgSender(), "ERR_ONLY_CREATOR");
        _;
    }

    modifier onlyCreated(bytes32 category, bytes32 nature) {
        _onlyCreated(category, nature);
        _;
    }

    modifier onlyViableRoyalty(uint256 royalty) {
        //maximum royalty is 50%
        require(royalty <= 5000, "MAX_ROYALTY_EXCEEDED");
        _;
    }

    modifier onlyNonCreated(bytes32 category) {
        bool created = false;
        uint256 len = _categories.length;
        for (uint256 i; i < len; i++) {
            bytes32 cat = _categories[i];
            if (cat == category) {
                created = true;
            }
        }
        require(!created, "NON_CREATED_CATEGORY_ONLY");
        _;
    }

    modifier onlyValidLength(
        address payable[] memory recipients,
        uint256[] memory shares
    ) {
        require(recipients.length <= splitRoyaltyLimit, "SPLIT_LIMIT_EXCEEDED");
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

    modifier physicalCreator(bytes32 nature) {
        bytes32 nature0 = _natures[0];
        bytes32 nature2 = _natures[2];
        if (nature == nature0 || nature == nature2) {
            bool outcome = canCreatePhysical[msg.sender];
            require(outcome, "Only Physical creator allowed");
        }
        _;
    }

    //________________//
    // WRITE FUNCTIONS
    //----------------//

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
        info.tokenSupply -= amount;
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
            info.tokenSupply -= amounts[i];
            info.maxSupply -= amounts[i];
        }
    }

    function createCategory(bytes32 category)
        external
        onlyNonCreated(category)
        returns (string memory category_)
    {
        _categories.push(category);
        category_ = bytes32ToString(category);
        emit NewCategory(msg.sender, bytes32ToString(category));
    }

    function createToken(
        address _initialHodler,
        uint256 _id,
        uint256 _initialSupply,
        uint256 _maxSupply,
        uint256 royalty, //1% = 100. max is 50% ~ 5000
        bytes32 category,
        bytes32 nature
    )
        external
        payable
        onlyCreated(category, nature)
        onlyViableRoyalty(royalty)
        physicalCreator(nature)
        returns (uint256 tokenId)
    {
        require(msg.value == creationFee, "FEE_NOT_SENT");
        tokenId = _createToken(
            _initialHodler,
            _id,
            _initialSupply,
            _maxSupply,
            royalty,
            category,
            nature
        );
    }

    function mint(
        address to,
        uint256 id,
        uint256 amount
    ) external returns (bool success) {
        require(canMint[id][msg.sender], "ERR_ONLY_MINTER");
        Info storage info = _idToInfo[id];

        require(
            info.tokenSupply + amount <= info.maxSupply,
            "MAX_SUPPLY_REACHED"
        );

        info.tokenSupply += amount;
        _mint(to, id, amount, "0x0");
        return true;
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts
    ) external returns (bool success) {
        uint256 len = ids.length;
        require(len == amounts.length, "ERR_ARRAY_MISSMATCH");

        for (uint256 i; i < len; i++) {
            Info storage info = _idToInfo[ids[i]];

            require(
                info.tokenSupply + amounts[i] <= info.maxSupply,
                "MAX_SUPPLY_REACHED"
            );

            uint256 id = ids[i];
            require(canMint[id][msg.sender], "ERR_ONLY_MINTER");

            info.tokenSupply += amounts[i];
        }

        _mintBatch(to, ids, amounts, "0x0");
        return true;
    }

    function setFeeCollector(address payable _newFeeReceipient)
        external
        onlyAdmin
    {
        require(_newFeeReceipient != address(0), "INVALID_ADDRESS");
        address payable rec = feeReceipient;
        require(_newFeeReceipient != rec, "ALREADY_EXISTS");
        feeReceipient = _newFeeReceipient;
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

    function setPhysicalCreator(
        address[] memory creators,
        bool _canCreatePhysical
    ) external onlyAdmin {
        uint256 len = creators.length;
        for (uint256 i; i < len; i++) {
            address addr = creators[i];
            bool status = canCreatePhysical[addr];
            require(status != _canCreatePhysical, "ALREADY_SET");
            canCreatePhysical[addr] = _canCreatePhysical;
            emit PhysicalCreatorSet(addr, _canCreatePhysical);
        }
    }

    function setRoyaltyInfo(
        address payable creator_,
        address payable[] memory recipients,
        uint256[] memory shares,
        uint256 id,
        uint256 royalty //1% = 100. max is 50% ~ 5000
    )
        external
        onlyValidLength(recipients, shares)
        creatorOnly(id)
        onlyViableRoyalty(royalty)
    {
        require(creator_ != address(0), "INVALID_ADDRESS");

        address payable _creator = creator_;
        address payable[] memory _recipients = recipients;
        uint256[] memory _shares = shares;
        uint256 _id = id;
        uint256 roy = royalty;

        Info storage info = _idToInfo[_id];
        info.creator = _creator;
        info.royalty = roy;

        Royalty storage r = _idToRoyalty[_id];

        uint256 len = _shares.length;
        r.index = len;
        for (uint256 i; i < len; i++) {
            uint256 shr = _shares[i];
            address payable rec = _recipients[i];
            r.shares[i] = shr;
            r.recipients[i] = rec;
        }

        emit RoyaltyInfoUpdated(
            msg.sender,
            _creator,
            _id,
            roy,
            _recipients,
            _shares
        );
    }

    function setMarket(address market, bool isMarket) external onlyAdmin {
        require(market != address(0), "ZERO_ADDRESS");

        isWhitelistedMarket[market] = isMarket;
        emit MarketUpdated(market, isMarket);
    }

    //________________//
    // READ FUNCTIONS
    //----------------//

    function natures() external view returns (bytes32[3] memory) {
        return _natures;
    }

    function categories() external view returns (bytes32[] memory) {
        return _categories;
    }

    function creator(uint256 _id) public view returns (address creator_) {
        return _idToInfo[_id].creator;
    }

    function exists(uint256 _id) external view returns (bool) {
        return _exists(_id);
    }

    function getInfo(uint256 _id) external view returns (Info memory info) {
        return _idToInfo[_id];
    }

    function isApprovedForAll(address _owner, address _operator)
        public
        view
        override
        returns (bool isOperator)
    {
        if (isWhitelistedMarket[_operator]) return true;

        return ERC1155.isApprovedForAll(_owner, _operator);
    }

    function royaltyInfo(uint256 _id, uint256 _salePrice)
        external
        view
        returns (address, uint256)
    {
        Info memory i = _idToInfo[_id];
        return (i.creator, _calculateRoyalty(_salePrice, i.royalty));
    }

    function splitRoyaltyInfo(uint256 _id, uint256 _salePrice)
        external
        view
        returns (
            address[] memory recipients,
            uint256[] memory shares,
            uint256 salePrice
        )
    {
        Royalty storage rInfo = _idToRoyalty[_id];

        uint256 len = rInfo.index;
        recipients = new address[](len);
        shares = new uint256[](len);

        for (uint256 i; i < len; i++) {
            if (rInfo.recipients[i] != address(0)) {
                recipients[i] = rInfo.recipients[i];
                shares[i] = rInfo.shares[i];
            }
        }

        salePrice = _calculateRoyalty(_salePrice, _idToInfo[_id].royalty);
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

    function tokenSupply(uint256 _id)
        external
        view
        returns (uint256 tokenSupply_)
    {
        return _idToInfo[_id].tokenSupply;
    }

    function uri(uint256 _id) public view override returns (string memory) {
        require(_exists(_id), "NON_EXISTENT_TOKEN");
        string memory hexstrId = uint2hexstr(_id);
        return string(abi.encodePacked("ipfs://f0", hexstrId));
    }

    //________________//
    // PRIVATE FUNCTIONS
    //----------------//

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

    function _calculateRoyalty(uint256 _salePrice, uint256 royalty)
        private
        pure
        returns (uint256)
    {
        return (_salePrice * royalty) / 10000;
    }

    function _createToken(
        address _initialHodler,
        uint256 _id,
        uint256 _initialSupply,
        uint256 _maxSupply,
        uint256 _royalty, //1% = 100. max is 50% ~ 5000
        bytes32 _category,
        bytes32 _nature
    ) private returns (uint256) {
        address initialHodler = _initialHodler;
        uint256 initialSupply = _initialSupply;
        uint256 maxSupply_ = _maxSupply;
        uint256 royalty = _royalty;
        bytes32 category = _category;
        bytes32 nature = _nature;

        require(initialSupply <= maxSupply_, "SUPPLY_ERR");

        Info storage info = _idToInfo[_id];

        require(info.creator == payable(address(0)), "ID_ALREADY_EXISTS");

        info.creator = payable(_msgSender());
        info.category = category;
        info.nature = nature;
        info.royalty = royalty;
        info.maxSupply = maxSupply_;

        uint256 id = _id;
        uint256 sn = _nextIdPrint();

        serialNumToId[sn] = id;
        canMint[id][msg.sender] = true;

        if (initialSupply > 0) {
            info.tokenSupply = initialSupply;
            _mint(initialHodler, id, initialSupply, "0x0");
        }

        (bool success, ) = feeReceipient.call{value: msg.value}("");
        require(success, "FEE_TRANSFER_ERR");

        emit NewToken(msg.sender, initialSupply, maxSupply_, id);
        return id;
    }

    function _exists(uint256 _id) private view returns (bool) {
        return
            _idToInfo[_id].nature !=
            0x0000000000000000000000000000000000000000000000000000000000000000;
    }

    function _nextIdPrint() private returns (uint256) {
        serialNum++;
        return serialNum;
    }

    function _onlyCreated(bytes32 category, bytes32 nature) private view {
        bool natural = false;

        for (uint256 i; i < 3; i++) {
            bytes32 nat = _natures[i];
            if (nat == nature) {
                natural = true;
            }
        }

        if (!natural) {
            revert("ONLY_VALID_NATURE");
        } else {
            bool categorized = false;
            uint256 lenCat = _categories.length;

            for (uint256 i; i < lenCat; i++) {
                bytes32 cat = _categories[i];
                if (cat == category) {
                    categorized = true;
                }
            }
            if (!categorized) revert("ONLY_CREATED_CATEGORY");
        }
    }

    // HELPER FUNCTIONS
    /**
     * @dev Helper Function to convert bytes32 to string format
     * @param _bytes32 is the bytes32 format which needs to be converted
     * @return result is the string representation of that bytes32 string
     */
    function bytes32ToString(bytes32 _bytes32)
        public
        pure
        returns (string memory result)
    {
        uint8 i = 0;
        while (i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        result = string(bytesArray);
    }

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

    function uint2hexstr(uint256 i) public pure returns (string memory) {
        if (i == 0) return "0";
        uint256 j = i;
        uint256 length;
        while (j != 0) {
            length++;
            j = j >> 4;
        }
        uint256 mask = 15;
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        while (i != 0) {
            uint256 curr = (i & mask);
            bstr[--k] = curr > 9
                ? bytes1(uint8(55 + curr))
                : bytes1(uint8(48 + curr)); // 55 = 65 - 10
            i = i >> 4;
        }
        return string(bstr);
    }
}
