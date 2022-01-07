//"SPDX-License-Identifier: MIT"

pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

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

contract RCDYRouter is Ownable {
    
    IERC20 internal rcdy;
    IUniswapV2Router01 private _iUni;
    
    uint public swapfee;        //100 = 1%
    uint public claimableFee;
    
    event EthToTokenSwap(
        address indexed user, 
        uint ethSpent, 
        uint tokenReceived
    );

    event ClaimedFee(
        address indexed receiver, 
        uint amount
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
        uint _swapfee)  {
        //0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D ropsten address
        _iUni = IUniswapV2Router01(_uniswapV2RouterAddress);
        rcdy = IERC20(_rcdy);
        swapfee = _swapfee;
    }

    function checkTokenBalance(
        address _token,
        address _user
        ) external view returns(uint balance) {
        
        balance = IERC20(_token).balanceOf(_user);
    }

    function checkEthBalance(
        address _user
        ) external view returns(uint balance) {
        
        balance = _user.balance;
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
            address(this), 
            block.timestamp
        );

        uint fee = (swapfee * amounts[1]) / 10000;
        rcdy.transfer(msg.sender, amounts[1] - fee);
        claimableFee += fee;

        emit EthToTokenSwap(
            msg.sender, 
            amounts[0], 
            amounts[1] - fee
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
            "Must approve contract"
        );

        require(
            IERC20(_tokenIn).approve(
                address(_iUni), 
                _amountIn
            ), 
            "Approval failed"
        );

        address[] memory path = new address[](2);
        path[0] = _tokenIn;
        path[1] = address(rcdy);
        
        uint[] memory amounts = _iUni.swapExactTokensForTokens(
            _amountIn, 
            _amountOutMin, 
            path, 
            address(this), 
            block.timestamp
        );

        uint fee = (swapfee * amounts[1]) / 10000;
        rcdy.transfer(msg.sender, amounts[1] - fee);
        claimableFee += fee;

        emit TokenToTokenSwap(
            msg.sender, 
            _tokenIn, 
            address(rcdy), 
            amounts[0], 
            amounts[1] - fee
        );
    }

    function claimFee(
        address _receiver,
        uint _amount)
        external onlyOwner() returns(bool success) {

        require(
            _amount <= claimableFee,
            "Not enough available"
        );

        claimableFee -= _amount;
        require(
            rcdy.transfer(
                _receiver, 
                _amount
            ), "Error in sending tokens"
        );

        emit ClaimedFee(
            _receiver, _amount
        );

        return true;
    }
}


