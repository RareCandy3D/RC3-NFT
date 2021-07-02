//"SPDX-License-Identifier: MIT"
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol";

contract RC3NFT is ERC721PresetMinterPauserAutoId {

    constructor() ERC721PresetMinterPauserAutoId(
        "RareCandy3D", 
        "RC3", 
        "https://rarecandy.xyz/api/token/"
        ) {}

    function baseURI() external view returns(string memory) {
        return _baseURI();
    }
}