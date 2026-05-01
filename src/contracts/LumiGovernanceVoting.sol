// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILumiCrowdfundingGovernance {
    function admin() external view returns (address);
    function contributions(uint256 campaignId, address contributor) external view returns (uint256);
    function getCampaignStatus(uint256 campaignId) external view returns (uint8);
}

contract LumiGovernanceVoting {
    struct Proposal {
        uint256 id;
        uint256 campaignId;
        string title;
        string description;
        uint256 deadline;
        uint256 quorumWei;
        bool executed;
        bool passed;
        uint256 forVotes;
        uint256 againstVotes;
    }

    ILumiCrowdfundingGovernance public immutable crowdfunding;
    uint256 public proposalCount;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(
        uint256 indexed proposalId,
        uint256 indexed campaignId,
        string title,
        uint256 deadline,
        uint256 quorumWei
    );
    event VoteCast(
        uint256 indexed proposalId,
        uint256 indexed campaignId,
        address indexed voter,
        bool support,
        uint256 weight
    );
    event ProposalExecuted(
        uint256 indexed proposalId,
        uint256 indexed campaignId,
        bool passed,
        uint256 forVotes,
        uint256 againstVotes
    );

    constructor(address crowdfundingAddress) {
        require(crowdfundingAddress != address(0), "Invalid crowdfunding");
        crowdfunding = ILumiCrowdfundingGovernance(crowdfundingAddress);
    }

    modifier onlyAdmin() {
        require(msg.sender == crowdfunding.admin(), "Not admin");
        _;
    }

    function createProposal(
        uint256 campaignId,
        string calldata title,
        string calldata description,
        uint256 votingPeriod,
        uint256 quorumWei
    ) external onlyAdmin returns (uint256) {
        require(bytes(title).length > 0, "Title required");
        require(votingPeriod > 0, "Voting period required");
        require(crowdfunding.getCampaignStatus(campaignId) != 4, "Rejected campaign");

        uint256 proposalId = ++proposalCount;
        proposals[proposalId] = Proposal({
            id: proposalId,
            campaignId: campaignId,
            title: title,
            description: description,
            deadline: block.timestamp + votingPeriod,
            quorumWei: quorumWei,
            executed: false,
            passed: false,
            forVotes: 0,
            againstVotes: 0
        });

        emit ProposalCreated(proposalId, campaignId, title, block.timestamp + votingPeriod, quorumWei);
        return proposalId;
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(block.timestamp < proposal.deadline, "Voting ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        uint256 weight = crowdfunding.contributions(proposal.campaignId, msg.sender);
        require(weight > 0, "No contribution weight");

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }

        emit VoteCast(proposalId, proposal.campaignId, msg.sender, support, weight);
    }

    function executeProposal(uint256 proposalId) external onlyAdmin returns (bool passed) {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(block.timestamp >= proposal.deadline, "Voting still active");
        require(!proposal.executed, "Already executed");

        proposal.executed = true;

        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        passed = totalVotes >= proposal.quorumWei && proposal.forVotes > proposal.againstVotes;
        proposal.passed = passed;

        emit ProposalExecuted(
            proposalId,
            proposal.campaignId,
            passed,
            proposal.forVotes,
            proposal.againstVotes
        );
    }

    function getProposalResult(uint256 proposalId)
        external
        view
        returns (
            bool votingClosed,
            bool executable,
            bool passed,
            uint256 totalVotes
        )
    {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");

        votingClosed = block.timestamp >= proposal.deadline;
        totalVotes = proposal.forVotes + proposal.againstVotes;
        executable = votingClosed && !proposal.executed;
        passed = proposal.passed;
    }
}
