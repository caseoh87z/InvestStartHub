// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title InvestmentContract
 * @dev A contract that manages investments in startups with milestone-based releases
 */
contract InvestmentContract {
    // Enum to track the status of an investment
    enum InvestmentStatus { Pending, Active, Completed, Cancelled }
    
    // Struct to represent a milestone
    struct Milestone {
        string description;
        uint256 amount;
        bool released;
        uint256 releaseDate;
    }
    
    // Struct to represent an investment
    struct Investment {
        address investor;
        address startup;
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 createdAt;
        InvestmentStatus status;
        Milestone[] milestones;
    }
    
    // Mapping of all investments
    mapping(uint256 => Investment) public investments;
    uint256 public investmentCount;
    
    // Events
    event InvestmentCreated(uint256 indexed id, address indexed investor, address indexed startup, uint256 amount);
    event MilestoneReleased(uint256 indexed id, uint256 milestoneIndex, uint256 amount);
    event InvestmentCancelled(uint256 indexed id);
    event InvestmentCompleted(uint256 indexed id);
    
    /**
     * @dev Create a new investment with milestones
     * @param _startup Address of the startup receiving the investment
     * @param _milestoneDescriptions Array of milestone descriptions
     * @param _milestoneAmounts Array of amounts for each milestone
     */
    function createInvestment(
        address _startup,
        string[] memory _milestoneDescriptions,
        uint256[] memory _milestoneAmounts
    ) external payable {
        require(_startup != address(0), "Invalid startup address");
        require(_milestoneDescriptions.length > 0, "No milestones provided");
        require(_milestoneDescriptions.length == _milestoneAmounts.length, "Milestone arrays must match");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            totalAmount += _milestoneAmounts[i];
        }
        
        require(msg.value == totalAmount, "Incorrect amount sent");
        
        uint256 id = investmentCount++;
        Investment storage investment = investments[id];
        investment.investor = msg.sender;
        investment.startup = _startup;
        investment.totalAmount = totalAmount;
        investment.releasedAmount = 0;
        investment.createdAt = block.timestamp;
        investment.status = InvestmentStatus.Active;
        
        // Add milestones
        for (uint256 i = 0; i < _milestoneDescriptions.length; i++) {
            investment.milestones.push(
                Milestone({
                    description: _milestoneDescriptions[i],
                    amount: _milestoneAmounts[i],
                    released: false,
                    releaseDate: 0
                })
            );
        }
        
        emit InvestmentCreated(id, msg.sender, _startup, totalAmount);
    }
    
    /**
     * @dev Release funds for a completed milestone
     * @param _id Investment ID
     * @param _milestoneIndex Index of the milestone to release funds for
     */
    function releaseMilestone(uint256 _id, uint256 _milestoneIndex) external {
        Investment storage investment = investments[_id];
        
        require(investment.investor == msg.sender, "Only investor can release funds");
        require(investment.status == InvestmentStatus.Active, "Investment not active");
        require(_milestoneIndex < investment.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = investment.milestones[_milestoneIndex];
        require(!milestone.released, "Milestone already released");
        
        milestone.released = true;
        milestone.releaseDate = block.timestamp;
        investment.releasedAmount += milestone.amount;
        
        // Send funds to startup
        (bool success, ) = investment.startup.call{value: milestone.amount}("");
        require(success, "Transfer failed");
        
        emit MilestoneReleased(_id, _milestoneIndex, milestone.amount);
        
        // Check if all milestones are released
        bool allReleased = true;
        for (uint256 i = 0; i < investment.milestones.length; i++) {
            if (!investment.milestones[i].released) {
                allReleased = false;
                break;
            }
        }
        
        if (allReleased) {
            investment.status = InvestmentStatus.Completed;
            emit InvestmentCompleted(_id);
        }
    }
    
    /**
     * @dev Cancel an investment (only if no milestones have been released)
     * @param _id Investment ID
     */
    function cancelInvestment(uint256 _id) external {
        Investment storage investment = investments[_id];
        
        require(investment.investor == msg.sender || investment.startup == msg.sender, "Not authorized");
        require(investment.status == InvestmentStatus.Active, "Investment not active");
        require(investment.releasedAmount == 0, "Funds already released");
        
        investment.status = InvestmentStatus.Cancelled;
        
        // Return funds to investor
        (bool success, ) = investment.investor.call{value: investment.totalAmount}("");
        require(success, "Transfer failed");
        
        emit InvestmentCancelled(_id);
    }
    
    /**
     * @dev Get details of a specific investment
     * @param _id Investment ID
     * @return investment details
     */
    function getInvestment(uint256 _id) external view returns (
        address investor,
        address startup,
        uint256 totalAmount,
        uint256 releasedAmount,
        uint256 createdAt,
        InvestmentStatus status,
        uint256 milestoneCount
    ) {
        Investment storage investment = investments[_id];
        return (
            investment.investor,
            investment.startup,
            investment.totalAmount,
            investment.releasedAmount,
            investment.createdAt,
            investment.status,
            investment.milestones.length
        );
    }
    
    /**
     * @dev Get details of a specific milestone
     * @param _id Investment ID
     * @param _milestoneIndex Index of the milestone
     * @return milestone details
     */
    function getMilestone(uint256 _id, uint256 _milestoneIndex) external view returns (
        string memory description,
        uint256 amount,
        bool released,
        uint256 releaseDate
    ) {
        Investment storage investment = investments[_id];
        require(_milestoneIndex < investment.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = investment.milestones[_milestoneIndex];
        return (
            milestone.description,
            milestone.amount,
            milestone.released,
            milestone.releaseDate
        );
    }
}