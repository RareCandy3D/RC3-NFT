//"SPDX-License-Identifier: MIT"
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

//compound rewards and stake
contract RCDY_Staking is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 private immutable rcdy;
    uint256 public ratePerDay; //1000 = 1%
    uint256 private totalStakes;
    uint256 private immutable BLOCKS_PER_DAY = 1 days / 15; //5760;

    struct User {
        uint256 stakes;
        uint256 checkpoint;
        uint256 claimed;
    }

    mapping(address => User) private users;

    /**
     * @dev Emitted when RCDY is staked
     */
    event NewStake(address indexed user, uint256 amount, uint256 timestamp);

    /**
     * @dev Emitted when RCDY is unstaked
     */
    event NewUnstake(address indexed user, uint256 amount, uint256 timestamp);

    /**
     * @dev Emitted when rewards are distributed
     */
    event NewClaim(address indexed user, uint256 amount);

    constructor(address _rcdy, uint256 _ratePerDay) {
        rcdy = IERC20(_rcdy);
        ratePerDay = _ratePerDay;
    }

    /**
     * @dev Stakes RCDY to contract
     */
    function stakeRCDY(uint256 amount) external returns (bool staked) {
        require(
            rcdy.balanceOf(msg.sender) >= amount,
            "Error: insufficient balance"
        );

        require(
            rcdy.allowance(msg.sender, address(this)) >= amount,
            "Error: insufficient allowance"
        );

        rcdy.safeTransferFrom(msg.sender, address(this), amount);

        User storage user = users[msg.sender];

        if (user.checkpoint == 0) user.checkpoint = block.number;
        else _distribute(msg.sender);

        totalStakes += amount;
        user.stakes += amount;

        emit NewStake(msg.sender, amount, block.timestamp);

        return true;
    }

    /**
     * @dev Unstakes RCDY from contract
     */
    function unstakeRCDY(uint256 amount)
        external
        nonReentrant
        returns (bool unstaked)
    {
        User storage user = users[msg.sender];

        require(user.stakes >= amount, "You do not have enough stakes");

        if (block.number > user.checkpoint) _distribute(msg.sender);

        totalStakes -= amount;
        user.stakes -= amount;

        rcdy.safeTransfer(msg.sender, amount);

        if (user.stakes == 0) user.checkpoint = 0;

        emit NewUnstake(msg.sender, amount, block.timestamp);
        return true;
    }

    /**
     * @dev Claim rewards
     */
    function claim() external returns (bool claimed) {
        require(claimableRewards(msg.sender) > 0, "You do not have any stakes");

        _distribute(msg.sender);
        return true;
    }

    /**
     * @dev Returns the rewards claimable by a staker
     */
    function claimableRewards(address _user)
        public
        view
        returns (uint256 rewards)
    {
        User memory user = users[_user];

        uint256 blockRate = (block.number - user.checkpoint) *
            ratePerDay *
            user.stakes;
        uint256 allOver = BLOCKS_PER_DAY * 100 * 1000;
        rewards = blockRate > allOver ? blockRate / allOver : 0;
    }

    function getUserInfo(address _user)
        external
        view
        returns (User memory userInfo)
    {
        return users[_user];
    }

    function getTotalStakes() external view returns (uint256 totalstakes) {
        return totalStakes;
    }

    function _distribute(address _user) private {
        User storage user = users[_user];

        uint256 rewards = claimableRewards(_user);

        if (rewards > 0) {
            require(
                rcdy.balanceOf(address(this)) - totalStakes >= rewards,
                "Error: No available reward in smart contract"
            );

            user.checkpoint = block.number;
            user.claimed += rewards;
            rcdy.safeTransfer(_user, rewards / 2);
            emit NewClaim(msg.sender, rewards);
        }
    }
}
