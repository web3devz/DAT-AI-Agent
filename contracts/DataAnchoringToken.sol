// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DataAnchoringToken (DAT)
 * @dev Semi-fungible token for AI data subscription and revenue sharing
 */
contract DataAnchoringToken is ERC1155, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;
    
    struct SubscriptionTier {
        string name;
        uint256 duration; // in seconds
        uint256 price;
        uint256 usageQuota; // number of AI agent calls allowed
        bool active;
    }
    
    struct TokenMetadata {
        uint256 tierId;
        uint256 expiryTime;
        uint256 remainingUsage;
        address[] contributors; // dataset providers, model creators, etc.
        uint256[] revenueShares; // percentage shares (sum = 100)
    }
    
    mapping(uint256 => SubscriptionTier) public subscriptionTiers;
    mapping(uint256 => TokenMetadata) public tokenMetadata;
    mapping(address => uint256[]) public userTokens;
    
    uint256 public tierCount;
    
    event SubscriptionTierCreated(uint256 indexed tierId, string name, uint256 price, uint256 duration);
    event DATMinted(address indexed user, uint256 indexed tokenId, uint256 tierId);
    event UsageConsumed(address indexed user, uint256 indexed tokenId, uint256 amount);
    event RevenueDistributed(uint256 indexed tokenId, uint256 amount);
    
    constructor() ERC1155("https://api.lazai.network/metadata/{id}.json") {}
    
    /**
     * @dev Create a new subscription tier
     */
    function createSubscriptionTier(
        string memory name,
        uint256 duration,
        uint256 price,
        uint256 usageQuota,
        address[] memory contributors,
        uint256[] memory revenueShares
    ) external onlyOwner {
        require(contributors.length == revenueShares.length, "Contributors and shares length mismatch");
        
        uint256 totalShares = 0;
        for (uint256 i = 0; i < revenueShares.length; i++) {
            totalShares += revenueShares[i];
        }
        require(totalShares == 100, "Revenue shares must sum to 100");
        
        tierCount++;
        subscriptionTiers[tierCount] = SubscriptionTier({
            name: name,
            duration: duration,
            price: price,
            usageQuota: usageQuota,
            active: true
        });
        
        emit SubscriptionTierCreated(tierCount, name, price, duration);
    }
    
    /**
     * @dev Mint DAT for subscription access
     */
    function mintDAT(uint256 tierId) external payable nonReentrant {
        require(tierId > 0 && tierId <= tierCount, "Invalid tier ID");
        SubscriptionTier memory tier = subscriptionTiers[tierId];
        require(tier.active, "Subscription tier not active");
        require(msg.value >= tier.price, "Insufficient payment");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        // Set token metadata
        tokenMetadata[newTokenId] = TokenMetadata({
            tierId: tierId,
            expiryTime: block.timestamp + tier.duration,
            remainingUsage: tier.usageQuota,
            contributors: new address[](0),
            revenueShares: new uint256[](0)
        });
        
        // Mint the token
        _mint(msg.sender, newTokenId, 1, "");
        userTokens[msg.sender].push(newTokenId);
        
        // Distribute revenue (simplified - in production, use more sophisticated distribution)
        if (msg.value > 0) {
            // For now, keep revenue in contract - implement distribution logic
            emit RevenueDistributed(newTokenId, msg.value);
        }
        
        emit DATMinted(msg.sender, newTokenId, tierId);
    }
    
    /**
     * @dev Check if user has valid subscription
     */
    function hasValidSubscription(address user) external view returns (bool, uint256) {
        uint256[] memory tokens = userTokens[user];
        
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 tokenId = tokens[i];
            if (balanceOf(user, tokenId) > 0) {
                TokenMetadata memory metadata = tokenMetadata[tokenId];
                if (block.timestamp < metadata.expiryTime && metadata.remainingUsage > 0) {
                    return (true, tokenId);
                }
            }
        }
        
        return (false, 0);
    }
    
    /**
     * @dev Consume usage quota (called by AI agent)
     */
    function consumeUsage(address user, uint256 amount) external onlyOwner {
        (bool hasValid, uint256 tokenId) = this.hasValidSubscription(user);
        require(hasValid, "No valid subscription");
        
        TokenMetadata storage metadata = tokenMetadata[tokenId];
        require(metadata.remainingUsage >= amount, "Insufficient usage quota");
        
        metadata.remainingUsage -= amount;
        emit UsageConsumed(user, tokenId, amount);
    }
    
    /**
     * @dev Get user's subscription details
     */
    function getUserSubscription(address user) external view returns (
        bool isValid,
        uint256 tokenId,
        uint256 expiryTime,
        uint256 remainingUsage,
        string memory tierName
    ) {
        (bool hasValid, uint256 validTokenId) = this.hasValidSubscription(user);
        
        if (hasValid) {
            TokenMetadata memory metadata = tokenMetadata[validTokenId];
            SubscriptionTier memory tier = subscriptionTiers[metadata.tierId];
            
            return (
                true,
                validTokenId,
                metadata.expiryTime,
                metadata.remainingUsage,
                tier.name
            );
        }
        
        return (false, 0, 0, 0, "");
    }
    
    /**
     * @dev Withdraw contract balance (owner only)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}
