// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILumiToken {
    function mint(address to, uint256 amount) external;
}

contract LumiCrowdfunding {
    struct Campaign {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 goal;      // in wei
        uint256 raised;    // in wei
        uint256 deadline;  // unix timestamp
        bool withdrawn;
    }

    ILumiToken public lumiToken;
    address public admin;
    uint256 public campaignCount;
    uint256 public constant LUMI_RATE = 100; // 100 LUMI per ETH

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => bool) public campaignApproved;
    mapping(uint256 => bool) public campaignRejected;
    mapping(uint256 => string) public rejectionReasons;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    mapping(uint256 => mapping(address => bool)) public lumiClaimed;
    mapping(uint256 => uint256) public returnPool;
    mapping(uint256 => mapping(address => uint256)) public returnsClaimed;

    event CampaignCreated(uint256 indexed id, address indexed creator, string title, uint256 goal, uint256 deadline);
    event CampaignApproved(uint256 indexed id, address indexed admin);
    event CampaignRejected(uint256 indexed id, address indexed admin, string reason);
    event Contributed(uint256 indexed campaignId, address indexed contributor, uint256 amount);
    event Withdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount);
    event RefundClaimed(uint256 indexed campaignId, address indexed contributor, uint256 amount);
    event LumiClaimed(uint256 indexed campaignId, address indexed contributor, uint256 amount);
    event ReturnsDistributed(uint256 indexed campaignId, address indexed creator, uint256 amount);
    event ReturnClaimed(uint256 indexed campaignId, address indexed contributor, uint256 amount);

    constructor(address _lumiToken) {
        lumiToken = ILumiToken(_lumiToken);
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    // ── Campaign creation (Organiser) ─────────────────────────────

    function createCampaign(
        string calldata title,
        string calldata description,
        uint256 goal,
        uint256 deadline
    ) external returns (uint256) {
        require(goal > 0, "Goal must be > 0");
        require(deadline > block.timestamp, "Deadline must be in future");
        require(bytes(title).length > 0, "Title required");

        uint256 id = ++campaignCount;
        campaigns[id] = Campaign({
            id: id,
            creator: msg.sender,
            title: title,
            description: description,
            goal: goal,
            raised: 0,
            deadline: deadline,
            withdrawn: false
        });

        emit CampaignCreated(id, msg.sender, title, goal, deadline);
        return id;
    }

    // ── Admin approval ────────────────────────────────────────────

    function approveCampaign(uint256 campaignId) external onlyAdmin {
        require(campaigns[campaignId].id != 0, "Campaign does not exist");
        require(!campaignApproved[campaignId], "Already approved");
        require(!campaignRejected[campaignId], "Already rejected");
        campaignApproved[campaignId] = true;
        emit CampaignApproved(campaignId, msg.sender);
    }

    function rejectCampaign(uint256 campaignId, string calldata reason) external onlyAdmin {
        require(campaigns[campaignId].id != 0, "Campaign does not exist");
        require(!campaignApproved[campaignId], "Already approved");
        require(!campaignRejected[campaignId], "Already rejected");
        campaignRejected[campaignId] = true;
        rejectionReasons[campaignId] = reason;
        emit CampaignRejected(campaignId, msg.sender, reason);
    }

    // ── Investor actions ──────────────────────────────────────────

    function contribute(uint256 campaignId) external payable {
        Campaign storage c = campaigns[campaignId];
        require(c.id != 0, "Campaign does not exist");
        require(campaignApproved[campaignId], "Campaign not yet approved");
        require(block.timestamp < c.deadline, "Campaign has ended");
        require(msg.value > 0, "Must send ETH");

        c.raised += msg.value;
        contributions[campaignId][msg.sender] += msg.value;

        emit Contributed(campaignId, msg.sender, msg.value);
    }

    // ── Organiser actions ─────────────────────────────────────────

    function withdraw(uint256 campaignId) external {
        Campaign storage c = campaigns[campaignId];
        require(c.id != 0, "Campaign does not exist");
        require(msg.sender == c.creator, "Not creator");
        require(block.timestamp >= c.deadline, "Campaign still active");
        require(c.raised >= c.goal, "Goal not reached");
        require(!c.withdrawn, "Already withdrawn");

        c.withdrawn = true;
        (bool success, ) = payable(c.creator).call{value: c.raised}("");
        require(success, "Transfer failed");

        emit Withdrawn(campaignId, c.creator, c.raised);
    }

    function distributeReturns(uint256 campaignId) external payable {
        Campaign storage c = campaigns[campaignId];
        require(c.id != 0, "Campaign does not exist");
        require(msg.sender == c.creator, "Not creator");
        require(c.withdrawn, "Funds not yet withdrawn");
        require(msg.value > 0, "Must send ETH");

        returnPool[campaignId] += msg.value;

        emit ReturnsDistributed(campaignId, msg.sender, msg.value);
    }

    function claimReturn(uint256 campaignId) external {
        Campaign storage c = campaigns[campaignId];
        require(c.id != 0, "Campaign does not exist");
        uint256 pool = returnPool[campaignId];
        require(pool > 0, "No returns available");

        uint256 contribution = contributions[campaignId][msg.sender];
        require(contribution > 0, "No contribution");

        uint256 entitled = (contribution * pool) / c.raised;
        uint256 alreadyClaimed = returnsClaimed[campaignId][msg.sender];
        uint256 claimable = entitled - alreadyClaimed;
        require(claimable > 0, "Nothing to claim");

        returnsClaimed[campaignId][msg.sender] = entitled;
        (bool success, ) = payable(msg.sender).call{value: claimable}("");
        require(success, "Transfer failed");

        emit ReturnClaimed(campaignId, msg.sender, claimable);
    }

    function claimRefund(uint256 campaignId) external {
        Campaign storage c = campaigns[campaignId];
        require(c.id != 0, "Campaign does not exist");
        require(block.timestamp >= c.deadline, "Campaign still active");
        require(c.raised < c.goal, "Goal was reached");

        uint256 amount = contributions[campaignId][msg.sender];
        require(amount > 0, "Nothing to refund");

        contributions[campaignId][msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit RefundClaimed(campaignId, msg.sender, amount);
    }

    function claimLumi(uint256 campaignId) external {
        Campaign storage c = campaigns[campaignId];
        require(c.id != 0, "Campaign does not exist");
        require(block.timestamp >= c.deadline, "Campaign still active");
        require(c.raised >= c.goal, "Goal not reached");
        require(!lumiClaimed[campaignId][msg.sender], "Already claimed LUMI");

        uint256 contribution = contributions[campaignId][msg.sender];
        require(contribution > 0, "No contribution");

        lumiClaimed[campaignId][msg.sender] = true;
        lumiToken.mint(msg.sender, contribution * LUMI_RATE);

        emit LumiClaimed(campaignId, msg.sender, contribution * LUMI_RATE);
    }

    // ── Status helper ─────────────────────────────────────────────
    // Returns: 0=pending, 1=active, 2=successful, 3=failed, 4=rejected

    function getCampaignStatus(uint256 campaignId) external view returns (uint8) {
        Campaign storage c = campaigns[campaignId];
        require(c.id != 0, "Campaign does not exist");
        if (campaignRejected[campaignId]) return 4;
        if (!campaignApproved[campaignId]) return 0;
        if (block.timestamp < c.deadline) return 1;
        if (c.raised >= c.goal) return 2;
        return 3;
    }
}
