//"SPDX-License-Identifier: MIT"
pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract RC3NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;
    address public marketplace;

    constructor(
        address _marketplaceAddress
        ) ERC721("RareCandy3D", "RC3") {
        
        marketplace = _marketplaceAddress;
    }

    function createRC3(
        string memory _tokenURI
        ) external returns(uint newId) {
        
        _tokenIds.increment();
        uint newItemId = _tokenIds.current();

        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, _tokenURI);
        setApprovalForAll(marketplace, true);
        
        return newItemId;
    }
}