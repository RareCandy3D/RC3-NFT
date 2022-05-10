//"SPDX-License-Identifier: MIT"

pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IUniswapV2Router01 {
    function WETH() external pure returns (address);

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);

    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

contract RCDY_Router is Ownable {
    using SafeERC20 for IERC20;
    IERC20 internal rcdy;
    IUniswapV2Router01 private _iUni;

    uint256 public swapFee; //1000 = 1%
    uint256 public claimableFee;

    event EthToTokenSwap(
        address indexed user,
        uint256 ethSpent,
        uint256 tokenReceived
    );

    event ClaimedFee(address indexed receiver, uint256 amount);

    event TokenToTokenSwap(
        address indexed user,
        address tokenA,
        address tokenB,
        uint256 tokenSpent,
        uint256 tokenReceived
    );

    constructor(
        address _uniswapV2RouterAddress,
        address _rcdy,
        uint256 _swapfee
    ) {
        //0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D ropsten address
        _iUni = IUniswapV2Router01(_uniswapV2RouterAddress);
        rcdy = IERC20(_rcdy);
        swapFee = _swapfee;
    }

    function checkTokenBalance(address _token, address _user)
        external
        view
        returns (uint256 balance)
    {
        balance = IERC20(_token).balanceOf(_user);
    }

    function checkEthBalance(address _user)
        external
        view
        returns (uint256 balance)
    {
        balance = _user.balance;
    }

    function swapETHForRCDY() external payable {
        require(msg.value > 0, "Insufficient Balance");

        address[] memory path = new address[](2);
        path[0] = _iUni.WETH();
        path[1] = address(rcdy);

        uint256[] memory amounts = _iUni.swapExactETHForTokens{
            value: msg.value
        }(1, path, address(this), block.timestamp);

        uint256 fee = (swapFee * amounts[1]) / 100000;
        rcdy.safeTransfer(msg.sender, amounts[1] - fee);
        claimableFee += fee;

        emit EthToTokenSwap(msg.sender, amounts[0], amounts[1] - fee);
    }

    function swapTokensForRCDY(
        address _tokenIn,
        uint256 _amountIn,
        uint256 _amountOutMin
    ) external {
        IERC20(_tokenIn).safeTransferFrom(msg.sender, address(this), _amountIn);
        IERC20(_tokenIn).approve(address(_iUni), _amountIn);

        address[] memory path = new address[](2);
        path[0] = _tokenIn;
        path[1] = address(rcdy);

        uint256[] memory amounts = _iUni.swapExactTokensForTokens(
            _amountIn,
            _amountOutMin,
            path,
            address(this),
            block.timestamp
        );

        uint256 fee = (swapFee * amounts[1]) / 100000;
        rcdy.safeTransfer(msg.sender, amounts[1] - fee);
        claimableFee += fee;

        emit TokenToTokenSwap(
            msg.sender,
            _tokenIn,
            address(rcdy),
            amounts[0],
            amounts[1] - fee
        );
    }

    function claimFee(address _receiver, uint256 _amount)
        external
        onlyOwner
        returns (bool success)
    {
        require(_amount <= claimableFee, "Not enough available");

        claimableFee -= _amount;

        rcdy.safeTransfer(_receiver, _amount);

        emit ClaimedFee(_receiver, _amount);

        return true;
    }
}
