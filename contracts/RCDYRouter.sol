//"SPDX-License-Identifier: MIT"

pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IUniswapV2Router01 {
    function WETH() external pure returns (address);

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function swapExactETHForTokens(
        uint amountOutMin, 
        address[] calldata path, 
        address to, 
        uint deadline
    ) external payable returns (uint[] memory amounts);
    
    function swapExactTokensForETH(
        uint amountIn, 
        uint amountOutMin, 
        address[] calldata path, 
        address to, 
        uint deadline
        ) external returns (uint[] memory amounts);
}

contract RCDYRouter {
    
    IERC20 internal rcdy;
    IUniswapV2Router01 private _iUni;
    
    address public feeCollector;
    uint public swappingFee;
    
    event EthToTokenSwap(
        address indexed user, 
        uint ethSpent, 
        uint tokenReceived
    );

    event TokenToEthSwap(
        address indexed user, 
        uint tokenSpent, 
        uint ethReceived
    );

    event TokenToTokenSwap(
        address indexed user,
        address tokenA,
        address tokenB,
        uint tokenSpent, 
        uint tokenReceived
    );
    
    constructor(
        address _uniswapV2RouterAddress,
        address _rcdy,
        address _feeCollector)  {
        //0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D ropsten address
        _iUni = IUniswapV2Router01(_uniswapV2RouterAddress);
        rcdy = IERC20(_rcdy);
        feeCollector = _feeCollector;
    }
    
    function swapETHForRCDY(
        uint _amountOutMin
        ) external payable {
        
        require(
            msg.value > 0, 
            "Insufficient Balance"
        );

        address[] memory path = new address[](2);
        path[0] = _iUni.WETH();
        path[1] = address(rcdy);

        uint[] memory amounts = _iUni.swapExactETHForTokens{ value: msg.value }(
            _amountOutMin, 
            path, 
            msg.sender, 
            block.timestamp
        );

        emit EthToTokenSwap(
            msg.sender, 
            amounts[0], 
            amounts[1]
        );
    }
    
    function swapTokensForRCDY(
        address _tokenIn, 
        uint _amountIn, 
        uint _amountOutMin) 
        external {

        require(
            IERC20(_tokenIn).allowance(
                msg.sender, 
                address(this) 
            ) >= _amountIn, 
            "must approve contract"
        );

        require(
            IERC20(_tokenIn).approve(
                address(_iUni), 
                _amountIn
            ), 
            "approve failed"
        );

        address[] memory path = new address[](2);
        path[0] = _tokenIn;
        path[1] = address(rcdy);
        
        uint[] memory amounts = _iUni.swapExactTokensForTokens(
            _amountIn, 
            _amountOutMin, 
            path, 
            msg.sender, 
            block.timestamp
        );

        emit TokenToTokenSwap(
            msg.sender, 
            _tokenIn, 
            address(rcdy), 
            amounts[0], 
            amounts[1]
        );
    }
}


