//"SPDX-License-Identifier: MIT"
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract RCDY_Staking is ReentrancyGuard, Ownable {

    IERC20 private rcdy;

    uint public ratePerDay;                      //1000 = 1%
    uint public totalStakes;
    uint public constant BLOCKS_PER_DAY = 1 days / 15; //5760;

    struct User {
        uint stakes;
        uint checkpoint;
        uint claimed;
    }

    mapping(address => User) private users;

    event NewStake(
        address indexed user,
        uint amount,
        uint timestamp
    );

    event NewUnstake(
        address indexed user,
        uint amount,
        uint timestamp
    );

    event NewClaim(
        address indexed user,
        uint amount
    );

    constructor(
        address _rcdy,
        uint _ratePerDay) {
        
        rcdy = IERC20(_rcdy);
        ratePerDay = _ratePerDay;
    }
    
    function stakeRCDY(
        uint amount)
        external returns(bool staked) {

        require(
            rcdy.transferFrom(
                msg.sender, 
                address(this), 
                amount
            ),
            "Error in withdrawing tokens to contract"
        );

        totalStakes += amount;
        User storage user = users[msg.sender];

        if (user.checkpoint == 0) user.checkpoint = block.number;
        else _distribute(msg.sender);

        user.stakes += amount;
        
        emit NewStake(
            msg.sender,
            amount,
            block.timestamp
        );

        return true;
    }

    function unstakeRCDY(
        uint amount)
        external nonReentrant returns(bool unstaked) {

        User storage user = users[msg.sender];

        require(
            user.stakes >= amount,
            "You do not have enough stakes"
        );

        if (block.number > user.checkpoint) _distribute(msg.sender);
        
        totalStakes -= amount;
        user.stakes -= amount;

        require(
            rcdy.transfer(
                msg.sender, 
                amount
            ),
            "Error in sending tokens to user"
        );

        if (user.stakes == 0) user.checkpoint == 0;

        emit NewUnstake(
            msg.sender,
            amount,
            block.timestamp
        );
        return true;
    }

    function claim(
        ) external returns(bool claimed) {

        require(
            claimableRewards(msg.sender) >= 0,
            "You do not have any stakes"
        );

        _distribute(msg.sender);
        return true;
    }

    function claimableRewards(
        address _user)
        public view returns(uint rewards) {

        User memory user = users[_user];

        uint blocks = (block.number) - user.checkpoint;
        rewards = (blocks * ratePerDay * user.stakes) 
        / (BLOCKS_PER_DAY * 100 * 1000);
    }

    function getUserInfo(
        address _user)
        external view returns(User memory userInfo) {
        
        return users[_user];
    }

    function _distribute(
        address _user) 
        private {
        
        User storage user = users[_user];
        
        uint rewards = claimableRewards(_user);

        if (rewards > 0) {
            user.checkpoint = block.number;
            user.claimed += rewards;
            rcdy.transfer(_user, rewards);
            emit NewClaim(msg.sender, rewards);
        }
    }
}
