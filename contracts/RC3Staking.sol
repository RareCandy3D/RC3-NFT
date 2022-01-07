//"SPDX-License-Identifier: MIT"
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract RC3Staking is Ownable, ReentrancyGuard {

    IERC721 private rc3;
    IERC20 private rcdy;
    uint public dailyReward;
    uint constant public BLOCKS_PER_DAY = 1 days / 15; //5760;

    struct Id {
        address stakeholder;
        uint checkpoint;
        uint claimed;
    }

    mapping(uint => Id) private ids;

    event NewStake(
        address indexed user, 
        uint tokenId, 
        uint timestamp
    );

    event NewClaim(
        address indexed user,
        uint rewards
    );

    event NewUnstake(
        address indexed user,
        uint tokenId,
        uint timestamp
    );

    constructor(
        address _rc3,
        address _rcdy,
        uint _dailyReward
        ) Ownable() {
        
        require(
            _rc3 != address(0)
            && _rcdy != address(0)
            && _dailyReward != 0,
            "Cannot input null values"
        );

        rc3 = IERC721(_rc3);
        rcdy = IERC20(_rcdy);
        dailyReward = _dailyReward;
    }

    modifier onlyStakeholder(
        uint _tokenId) {

        require(
            ids[_tokenId].stakeholder == msg.sender,
            "Only stakeholder can do this"
        );

        _;
    }

    function stakeRC3(
        uint _tokenId) 
        external returns(bool staked) {

        require(
            rc3.ownerOf(_tokenId) == msg.sender,
            "You are not the token owner"
        );

        rc3.transferFrom(
            msg.sender,
            address(this),
            _tokenId
        );

        Id storage id = ids[_tokenId];

        id.stakeholder = msg.sender;
        id.checkpoint = block.number;

        emit NewStake(
            msg.sender, 
            _tokenId, 
            block.timestamp
        );
        return true;
    }

    function unstakeRC3(
        uint _tokenId)
        external onlyStakeholder(_tokenId) 
        nonReentrant() returns(bool unstaked) {

        _takeReward(_tokenId);

        Id storage id = ids[_tokenId];
        id.claimed = 0;
        id.checkpoint = 0;
        id.stakeholder = address(0);

        rc3.transferFrom(
            address(this),
            msg.sender,
            _tokenId
        );

        emit NewUnstake(
            msg.sender,
            _tokenId,
            block.timestamp
        );
        return true;
    }

    function claimRCDY(
        uint _tokenId)
        external onlyStakeholder(_tokenId) returns(bool success) {
        
        _takeReward(_tokenId);
        
        ids[_tokenId].checkpoint = block.number;
        
        return true;
    }

    function getClaimableRewards(
        uint _tokenId)
        external view returns(uint claimable) {

        return _getClaimableRewards(_tokenId);
    }

    function getNFTDetail(
        uint _tokenId)
        external view returns(Id memory nftDetail) {
        
        return ids[_tokenId];
    }

    function _takeReward(
        uint _tokenId) 
        private {
        
        Id storage id = ids[_tokenId];
        uint checkpoint = id.checkpoint;

        if (block.number > checkpoint) {
            uint rewards = _getClaimableRewards(_tokenId);

            if (rewards > 0) {
                
                id.claimed += rewards;
                
                require(
                    rcdy.transfer(
                        id.stakeholder, 
                        rewards
                    ),
                    "Error in giving rewards"
                );

                emit NewClaim(msg.sender, rewards);
            }
        }
    }

    function _getClaimableRewards(
        uint _tokenId)
        private view returns(uint claimable) {

        uint checkpoint = ids[_tokenId].checkpoint;
        
        if (checkpoint == 0) return 0;
        else return (
            (block.number - checkpoint) * dailyReward
            / BLOCKS_PER_DAY
        );
    }

}
