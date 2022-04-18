//"SPDX-License-Identifier: MIT"
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

//compound rewards and stake
contract RCDY is ERC20Burnable {
    constructor() ERC20("RareCandy 3D", "RCDY") {
        _mint(msg.sender, 1e25); //10m tokens
    }
}
