// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILumiCrowdfundingEscrow {
    function admin() external view returns (address);
    function campaigns(uint256 campaignId)
        external
        view
        returns (
            uint256 id,
            address creator,
            string memory title,
            string memory description,
            uint256 goal,
            uint256 raised,
            uint256 deadline,
            bool withdrawn
        );
    function getCampaignStatus(uint256 campaignId) external view returns (uint8);
}

contract LumiMilestoneEscrow {
    struct Milestone {
        uint256 id;
        uint256 campaignId;
        string title;
        string details;
        uint256 amountWei;
        bool submitted;
        bool approved;
        bool released;
        string proofURI;
    }

    ILumiCrowdfundingEscrow public immutable crowdfunding;
    uint256 public milestoneCount;

    mapping(uint256 => Milestone) public milestones;
    mapping(uint256 => uint256[]) public milestonesByCampaign;
    mapping(uint256 => uint256) public escrowBalanceByCampaign;
    mapping(uint256 => uint256) public reservedBalanceByCampaign;

    event EscrowDeposited(uint256 indexed campaignId, address indexed creator, uint256 amount);
    event MilestoneCreated(
        uint256 indexed milestoneId,
        uint256 indexed campaignId,
        string title,
        uint256 amountWei
    );
    event MilestoneSubmitted(
        uint256 indexed milestoneId,
        uint256 indexed campaignId,
        string proofURI
    );
    event MilestoneApproved(
        uint256 indexed milestoneId,
        uint256 indexed campaignId,
        address indexed admin
    );
    event MilestoneReleased(
        uint256 indexed milestoneId,
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amountWei
    );

    constructor(address crowdfundingAddress) {
        require(crowdfundingAddress != address(0), "Invalid crowdfunding");
        crowdfunding = ILumiCrowdfundingEscrow(crowdfundingAddress);
    }

    modifier onlyAdmin() {
        require(msg.sender == crowdfunding.admin(), "Not admin");
        _;
    }

    modifier onlyCampaignCreator(uint256 campaignId) {
        (, address creator,,,,,,) = crowdfunding.campaigns(campaignId);
        require(msg.sender == creator, "Not creator");
        _;
    }

    function depositEscrow(uint256 campaignId) external payable onlyCampaignCreator(campaignId) {
        require(msg.value > 0, "Must send ETH");
        require(crowdfunding.getCampaignStatus(campaignId) == 2, "Campaign not successful");

        escrowBalanceByCampaign[campaignId] += msg.value;
        emit EscrowDeposited(campaignId, msg.sender, msg.value);
    }

    function createMilestone(
        uint256 campaignId,
        string calldata title,
        string calldata details,
        uint256 amountWei
    ) external onlyAdmin returns (uint256) {
        require(bytes(title).length > 0, "Title required");
        require(amountWei > 0, "Amount required");
        require(crowdfunding.getCampaignStatus(campaignId) == 2, "Campaign not successful");
        require(
            escrowBalanceByCampaign[campaignId] >= reservedBalanceByCampaign[campaignId] + amountWei,
            "Insufficient escrow"
        );

        uint256 milestoneId = ++milestoneCount;
        milestones[milestoneId] = Milestone({
            id: milestoneId,
            campaignId: campaignId,
            title: title,
            details: details,
            amountWei: amountWei,
            submitted: false,
            approved: false,
            released: false,
            proofURI: ""
        });

        milestonesByCampaign[campaignId].push(milestoneId);
        reservedBalanceByCampaign[campaignId] += amountWei;

        emit MilestoneCreated(milestoneId, campaignId, title, amountWei);
        return milestoneId;
    }

    function submitMilestoneProof(uint256 milestoneId, string calldata proofURI) external {
        Milestone storage milestone = milestones[milestoneId];
        require(milestone.id != 0, "Milestone does not exist");
        require(!milestone.released, "Already released");
        require(bytes(proofURI).length > 0, "Proof required");

        (, address creator,,,,,,) = crowdfunding.campaigns(milestone.campaignId);
        require(msg.sender == creator, "Not creator");

        milestone.submitted = true;
        milestone.proofURI = proofURI;

        emit MilestoneSubmitted(milestoneId, milestone.campaignId, proofURI);
    }

    function approveMilestone(uint256 milestoneId) external onlyAdmin {
        Milestone storage milestone = milestones[milestoneId];
        require(milestone.id != 0, "Milestone does not exist");
        require(milestone.submitted, "Proof not submitted");
        require(!milestone.approved, "Already approved");
        require(!milestone.released, "Already released");

        milestone.approved = true;

        emit MilestoneApproved(milestoneId, milestone.campaignId, msg.sender);
    }

    function releaseMilestone(uint256 milestoneId) external onlyAdmin {
        Milestone storage milestone = milestones[milestoneId];
        require(milestone.id != 0, "Milestone does not exist");
        require(milestone.approved, "Milestone not approved");
        require(!milestone.released, "Already released");

        milestone.released = true;
        escrowBalanceByCampaign[milestone.campaignId] -= milestone.amountWei;
        reservedBalanceByCampaign[milestone.campaignId] -= milestone.amountWei;

        (, address creator,,,,,,) = crowdfunding.campaigns(milestone.campaignId);
        (bool success, ) = payable(creator).call{value: milestone.amountWei}("");
        require(success, "Transfer failed");

        emit MilestoneReleased(
            milestoneId,
            milestone.campaignId,
            creator,
            milestone.amountWei
        );
    }

    function availableEscrow(uint256 campaignId) external view returns (uint256) {
        return escrowBalanceByCampaign[campaignId] - reservedBalanceByCampaign[campaignId];
    }

    function getCampaignMilestones(uint256 campaignId) external view returns (uint256[] memory) {
        return milestonesByCampaign[campaignId];
    }
}
