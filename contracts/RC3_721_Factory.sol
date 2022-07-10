//"SPDX-License-Identifier: MIT"
pragma solidity 0.8.6;

import "./RC3_721.sol";

contract RC3_721_Factory {
    address[] private _list;
    address payable public immutable feeWallet;
    uint256 public immutable fee;

    event Created(address indexed creator, address indexed token);

    constructor(uint256 _fee, address payable wallet) {
        fee = _fee;
        feeWallet = wallet;
    }

    function create721NFT(
        string memory _name,
        string memory _symbol,
        string memory _uri,
        uint96 _royalty
    ) external payable returns (address createdAddr) {
        require(msg.value == fee, "Must send fee");
        createdAddr = _make721(_name, _symbol, _uri, _royalty);
        feeWallet.transfer(msg.value);
    }

    function get721List()
        external
        view
        returns (address[] memory, uint256 length)
    {
        return (_list, _list.length);
    }

    function _make721(
        string memory _name,
        string memory _symbol,
        string memory _uri,
        uint96 _royalty
    ) private returns (address createdAddr) {
        RC3_721 token = new RC3_721(
            _name,
            _symbol,
            _uri,
            payable(msg.sender),
            _royalty
        );

        createdAddr = address(token);
        _list.push(createdAddr);

        emit Created(msg.sender, createdAddr);
    }
}
