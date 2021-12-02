//"SPDX-License-Identifier: MIT"
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @dev Staking contract for RCDY
 */
contract RCDYStaking is ReentrancyGuard, Ownable {

    using SafeERC20 for IERC20;
    IERC20 private immutable rcdy; 

    uint public immutable ratePerDay;                 //1000 = 1%
    uint public constant BLOCKS_PER_DAY = 5760;

    struct User {
        uint stakes;
        uint checkpoint;
        uint claimed;
    }

    mapping(address => User) public users;

   /**
    * @dev Emitted when RCDY is staked 
    */
    event NewStake(
        address indexed user,
        uint amount,
        uint timestamp
    );

   /**
    * @dev Emitted when RCDY is unstaked 
    */
    event NewUnstake(
        address indexed user,
        uint amount,
        uint timestamp
    );

   /**
    * @dev Emitted when rewards are distributed 
    */
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
    
   /**
    * @dev Stakes RCDY to contract
    */
    function stakeRCDY(
        uint amount)
        external returns(bool staked) {
            
            rcdy.safeTransferFrom(
                msg.sender, 
                address(this), 
                amount
            );
        
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

   /**
    * @dev Unstakes RCDY from contract
    */
    function unstakeRCDY(
        uint amount)
        external nonReentrant returns(bool unstaked) {

        User storage user = users[msg.sender];

        require(
            user.stakes >= amount,
            "You do not have enough stakes"
        );

        if (block.number > user.checkpoint) _distribute(msg.sender);
         
        user.stakes -= amount;

            rcdy.safeTransfer(
                msg.sender, 
                amount
            );
        

        if (user.stakes == 0) user.checkpoint = 0;

        emit NewUnstake(
            msg.sender,
            amount,
            block.timestamp
        );
        return true;
    }
   
   /**
    * @dev Claim rewards
    */
    function claim(
        ) external returns(bool success) {

        require(
            claimableRewards(msg.sender) >= 0,
            "You do not have any stakes"
        );

        _distribute(msg.sender);
        return true;
    }

   /**
    * @dev Returns the rewards claimable by a staker
    */
    function claimableRewards(
        address _user)
        public view returns(uint rewards) {

        User memory user = users[_user];

        uint blocks = block.number - user.checkpoint;
        rewards = (
            (blocks * ratePerDay * user.stakes) 
            / (BLOCKS_PER_DAY * 100 * 1000)
        );
    }
    
   /**
    * @dev Distribute rewards
    */
    function _distribute(
        address _user) 
        private {
        
        User storage user = users[_user];
        
        (uint rewards) = claimableRewards(_user);

        if (rewards > 0) {
            user.checkpoint = block.number;
            user.claimed += rewards;
            rcdy.safeTransfer(_user, rewards);
            emit NewClaim(msg.sender, rewards);
        }
    }
}
