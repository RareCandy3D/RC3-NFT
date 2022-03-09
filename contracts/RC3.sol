//"SPDX-License-Identifier: MIT"
pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract RC3 is Ownable, ERC721Burnable, ERC721URIStorage, ERC721Enumerable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;
    string public baseURI = "";

    event Mint(address indexed admin, uint256 indexed tokenId);

    constructor() ERC721("Rarecandy 3D", "RC3") Ownable() {
        transferOwnership(msg.sender);
    }

    function mintNFT(address to) public onlyOwner returns (uint256 newItemId) {
        _tokenIds.increment();
        newItemId = _tokenIds.current();

        _mint(to, newItemId);

        emit Mint(_msgSender(), newItemId);
    }

    function batchMintNFT(address to, uint256 amount)
        external
        onlyOwner
        returns (bool success)
    {
        require(amount > 1, "Function works only for multiple minting");

        for (uint256 i; i < amount; i++) {
            mintNFT(to);
        }
        return true;
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

    function burn(uint256 tokenId) public virtual override(ERC721Burnable) {
        super.burn(tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        virtual
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function setBaseURI(string memory uri) external onlyOwner {
        baseURI = uri;
    }

    function _baseURI()
        internal
        view
        virtual
        override(ERC721)
        returns (string memory)
    {
        return baseURI;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool itSupports)
    {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }
}
