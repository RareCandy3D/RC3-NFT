//"SPDX-License-Identifier: MIT"
pragma solidity 0.8.6;

import "./RC3_1155.sol";

contract RC3_1155_Factory {
    address[] private _list;

    event Created(address indexed creator, address indexed token);

    function create1155NFT(
        string memory _name,
        string memory _symbol,
        string memory _uri,
        uint96 _royalty
    ) external returns (address createdAddr) {
        createdAddr = _make1155(_name, _symbol, _uri, _royalty);
    }

    function get1155List()
        external
        view
        returns (address[] memory, uint256 listLength)
    {
        return (_list, _list.length);
    }

    function _make1155(
        string memory _name,
        string memory _symbol,
        string memory _uri,
        uint96 _royalty
    ) private returns (address createdAddr) {
        RC3_1155 token = new RC3_1155(_name, _symbol, _uri, _royalty);

        createdAddr = address(token);
        _list.push(createdAddr);

        emit Created(msg.sender, createdAddr);
    }
}
