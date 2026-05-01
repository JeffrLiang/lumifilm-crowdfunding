import { ethers, BrowserProvider, Contract, parseEther, formatEther } from 'ethers';
import { CROWDFUNDING_ABI, GOVERNANCE_VOTING_ABI, LUMI_TOKEN_ABI, MILESTONE_ESCROW_ABI } from '@/contracts/abi';

const CROWDFUNDING_ADDRESS = import.meta.env.VITE_CROWDFUNDING_ADDRESS as string | undefined;
const LUMI_TOKEN_ADDRESS = import.meta.env.VITE_LUMI_TOKEN_ADDRESS as string | undefined;
const GOVERNANCE_VOTING_ADDRESS = import.meta.env.VITE_GOVERNANCE_VOTING_ADDRESS as string | undefined;
const MILESTONE_ESCROW_ADDRESS = import.meta.env.VITE_MILESTONE_ESCROW_ADDRESS as string | undefined;

export const GANACHE_CHAIN_ID = Number(import.meta.env.VITE_GANACHE_CHAIN_ID ?? 1337);
const GANACHE_RPC_URL = (import.meta.env.VITE_GANACHE_RPC_URL as string | undefined) ?? 'http://127.0.0.1:7545';

export function isBlockchainConfigured(): boolean {
  return Boolean(CROWDFUNDING_ADDRESS && LUMI_TOKEN_ADDRESS);
}

export function isGovernanceConfigured(): boolean {
  return Boolean(isBlockchainConfigured() && GOVERNANCE_VOTING_ADDRESS);
}

export function isMilestoneEscrowConfigured(): boolean {
  return Boolean(isBlockchainConfigured() && MILESTONE_ESCROW_ADDRESS);
}

export function isMetaMaskInstalled(): boolean {
  return Boolean(window.ethereum?.isMetaMask);
}

function getEthereum(): MetaMaskProvider {
  if (!window.ethereum) throw new Error('MetaMask is not installed. Please install MetaMask to use this feature.');
  return window.ethereum;
}

function getProvider(): BrowserProvider {
  return new BrowserProvider(getEthereum() as ethers.Eip1193Provider);
}

async function getSigner() {
  return getProvider().getSigner();
}

function contractCrowdfunding(runner: ethers.ContractRunner): Contract {
  if (!CROWDFUNDING_ADDRESS) throw new Error('Crowdfunding contract address not configured.');
  return new Contract(CROWDFUNDING_ADDRESS, CROWDFUNDING_ABI, runner);
}

function contractLumiToken(runner: ethers.ContractRunner): Contract {
  if (!LUMI_TOKEN_ADDRESS) throw new Error('LUMI token address not configured.');
  return new Contract(LUMI_TOKEN_ADDRESS, LUMI_TOKEN_ABI, runner);
}

function contractGovernanceVoting(runner: ethers.ContractRunner): Contract {
  if (!GOVERNANCE_VOTING_ADDRESS) throw new Error('Governance voting contract address not configured.');
  return new Contract(GOVERNANCE_VOTING_ADDRESS, GOVERNANCE_VOTING_ABI, runner);
}

function contractMilestoneEscrow(runner: ethers.ContractRunner): Contract {
  if (!MILESTONE_ESCROW_ADDRESS) throw new Error('Milestone escrow contract address not configured.');
  return new Contract(MILESTONE_ESCROW_ADDRESS, MILESTONE_ESCROW_ABI, runner);
}

// ── MetaMask connection ───────────────────────────────────────────

export async function requestAccount(): Promise<string> {
  const accounts = await getEthereum().request({ method: 'eth_requestAccounts' }) as string[];
  if (!accounts[0]) throw new Error('MetaMask returned no accounts.');
  return accounts[0];
}

export async function getCurrentAccount(): Promise<string | null> {
  if (!window.ethereum) return null;
  const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
  return accounts[0] ?? null;
}

export async function queryWalletEthBalance(address: string): Promise<bigint> {
  return getProvider().getBalance(address);
}

export async function getChainId(): Promise<number> {
  const hex = await getEthereum().request({ method: 'eth_chainId' }) as string;
  return parseInt(hex, 16);
}

export async function switchToGanache(): Promise<void> {
  const chainIdHex = `0x${GANACHE_CHAIN_ID.toString(16)}`;
  try {
    await getEthereum().request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 4902) {
      await getEthereum().request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: chainIdHex,
          chainName: 'Ganache Local',
          rpcUrls: [GANACHE_RPC_URL],
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        }],
      });
    } else {
      throw err;
    }
  }
}

// ── Admin ─────────────────────────────────────────────────────────

export async function queryAdminAddress(): Promise<string> {
  return String(await contractCrowdfunding(getProvider()).admin());
}

export async function txApproveCampaign(campaignId: number): Promise<void> {
  const signer = await getSigner();
  await (await contractCrowdfunding(signer).approveCampaign(campaignId)).wait();
}

export async function txRejectCampaign(campaignId: number, reason: string): Promise<void> {
  const signer = await getSigner();
  await (await contractCrowdfunding(signer).rejectCampaign(campaignId, reason)).wait();
}

// ── Campaign types ────────────────────────────────────────────────

export type ChainCampaignStatus = 'pending' | 'active' | 'successful' | 'failed' | 'rejected';

export interface ChainCampaign {
  id: number;
  creator: string;
  title: string;
  description: string;
  goalWei: bigint;
  raisedWei: bigint;
  deadline: number;
  withdrawn: boolean;
  status: ChainCampaignStatus;
  rejectionReason?: string;
}

export interface GovernanceProposal {
  id: number;
  campaignId: number;
  title: string;
  description: string;
  deadline: number;
  quorumWei: bigint;
  executed: boolean;
  passed: boolean;
  forVotesWei: bigint;
  againstVotesWei: bigint;
}

export interface Milestone {
  id: number;
  campaignId: number;
  title: string;
  details: string;
  amountWei: bigint;
  submitted: boolean;
  approved: boolean;
  released: boolean;
  proofURI: string;
}

function parseStatus(code: number): ChainCampaignStatus {
  if (code === 0) return 'pending';
  if (code === 1) return 'active';
  if (code === 2) return 'successful';
  if (code === 3) return 'failed';
  return 'rejected';
}

async function loadCampaign(contract: Contract, id: number): Promise<ChainCampaign> {
  const [c, statusCode] = await Promise.all([
    contract.campaigns(id),
    contract.getCampaignStatus(id),
  ]);
  const status = parseStatus(Number(statusCode));
  const campaign: ChainCampaign = {
    id,
    creator: c.creator as string,
    title: c.title as string,
    description: c.description as string,
    goalWei: BigInt(c.goal),
    raisedWei: BigInt(c.raised),
    deadline: Number(c.deadline),
    withdrawn: c.withdrawn as boolean,
    status,
  };
  if (status === 'rejected') {
    campaign.rejectionReason = String(await contract.rejectionReasons(id));
  }
  return campaign;
}

// ── Read functions ────────────────────────────────────────────────

export async function fetchBlockTimestamp(): Promise<number> {
  const block = await getProvider().getBlock('latest');
  return block?.timestamp ?? Math.floor(Date.now() / 1000);
}

export async function fetchAllCampaigns(): Promise<ChainCampaign[]> {
  const provider = getProvider();
  const contract = contractCrowdfunding(provider);
  const count = Number(await contract.campaignCount());
  if (count === 0) return [];
  return Promise.all(Array.from({ length: count }, (_, i) => loadCampaign(contract, i + 1)));
}

export async function fetchCampaign(id: number): Promise<ChainCampaign> {
  return loadCampaign(contractCrowdfunding(getProvider()), id);
}

export async function queryContribution(campaignId: number, address: string): Promise<bigint> {
  return BigInt(await contractCrowdfunding(getProvider()).contributions(campaignId, address));
}

export async function queryLumiClaimed(campaignId: number, address: string): Promise<boolean> {
  return Boolean(await contractCrowdfunding(getProvider()).lumiClaimed(campaignId, address));
}

export async function queryLumiBalance(address: string): Promise<bigint> {
  return BigInt(await contractLumiToken(getProvider()).balanceOf(address));
}

export async function queryReturnPool(campaignId: number): Promise<bigint> {
  return BigInt(await contractCrowdfunding(getProvider()).returnPool(campaignId));
}

export async function queryReturnClaimed(campaignId: number, address: string): Promise<bigint> {
  return BigInt(await contractCrowdfunding(getProvider()).returnsClaimed(campaignId, address));
}

function mapProposal(raw: {
  id: bigint;
  campaignId: bigint;
  title: string;
  description: string;
  deadline: bigint;
  quorumWei: bigint;
  executed: boolean;
  passed: boolean;
  forVotes: bigint;
  againstVotes: bigint;
}): GovernanceProposal {
  return {
    id: Number(raw.id),
    campaignId: Number(raw.campaignId),
    title: raw.title,
    description: raw.description,
    deadline: Number(raw.deadline),
    quorumWei: BigInt(raw.quorumWei),
    executed: raw.executed,
    passed: raw.passed,
    forVotesWei: BigInt(raw.forVotes),
    againstVotesWei: BigInt(raw.againstVotes),
  };
}

function mapMilestone(raw: {
  id: bigint;
  campaignId: bigint;
  title: string;
  details: string;
  amountWei: bigint;
  submitted: boolean;
  approved: boolean;
  released: boolean;
  proofURI: string;
}): Milestone {
  return {
    id: Number(raw.id),
    campaignId: Number(raw.campaignId),
    title: raw.title,
    details: raw.details,
    amountWei: BigInt(raw.amountWei),
    submitted: raw.submitted,
    approved: raw.approved,
    released: raw.released,
    proofURI: raw.proofURI,
  };
}

export async function fetchAllProposals(): Promise<GovernanceProposal[]> {
  const contract = contractGovernanceVoting(getProvider());
  const count = Number(await contract.proposalCount());
  if (count === 0) return [];
  const proposals = await Promise.all(
    Array.from({ length: count }, (_, index) => contract.proposals(index + 1)),
  );
  return proposals.map(mapProposal);
}

export async function fetchCampaignProposals(campaignId: number): Promise<GovernanceProposal[]> {
  const proposals = await fetchAllProposals();
  return proposals.filter(proposal => proposal.campaignId === campaignId);
}

export async function queryProposalVoteStatus(proposalId: number, address: string): Promise<boolean> {
  return Boolean(await contractGovernanceVoting(getProvider()).hasVoted(proposalId, address));
}

export async function fetchCampaignMilestones(campaignId: number): Promise<Milestone[]> {
  const contract = contractMilestoneEscrow(getProvider());
  const ids = await contract.getCampaignMilestones(campaignId) as bigint[];
  if (ids.length === 0) return [];
  const milestones = await Promise.all(ids.map(id => contract.milestones(id)));
  return milestones.map(mapMilestone);
}

export async function queryEscrowBalance(campaignId: number): Promise<bigint> {
  return BigInt(await contractMilestoneEscrow(getProvider()).escrowBalanceByCampaign(campaignId));
}

export async function queryAvailableEscrow(campaignId: number): Promise<bigint> {
  return BigInt(await contractMilestoneEscrow(getProvider()).availableEscrow(campaignId));
}

export async function fetchUserContributedIds(address: string): Promise<number[]> {
  const contract = contractCrowdfunding(getProvider());
  const filter = contract.filters.Contributed(null, address);
  const events = await contract.queryFilter(filter) as ethers.EventLog[];
  const ids = new Set(events.map(e => Number(e.args[0])));
  return Array.from(ids);
}

// ── Write functions ───────────────────────────────────────────────

export async function txCreateCampaign(
  title: string,
  description: string,
  goalEth: string,
  deadlineDate: string,
): Promise<number> {
  const signer = await getSigner();
  const contract = contractCrowdfunding(signer);
  const tx = await contract.createCampaign(
    title,
    description,
    parseEther(goalEth),
    Math.floor(new Date(deadlineDate).getTime() / 1000),
  );
  const receipt = await tx.wait();
  for (const log of receipt.logs as ethers.Log[]) {
    try {
      const parsed = contract.interface.parseLog({ data: log.data, topics: [...log.topics] });
      if (parsed?.name === 'CampaignCreated') return Number(parsed.args.id);
    } catch { /* not this contract's log */ }
  }
  return 0;
}

export async function txContribute(campaignId: number, amountEth: string): Promise<void> {
  const signer = await getSigner();
  await (await contractCrowdfunding(signer).contribute(campaignId, { value: parseEther(amountEth) })).wait();
}

export async function txWithdraw(campaignId: number): Promise<void> {
  const signer = await getSigner();
  await (await contractCrowdfunding(signer).withdraw(campaignId)).wait();
}

export async function txClaimRefund(campaignId: number): Promise<void> {
  const signer = await getSigner();
  await (await contractCrowdfunding(signer).claimRefund(campaignId)).wait();
}

export async function txClaimLumi(campaignId: number): Promise<void> {
  const signer = await getSigner();
  await (await contractCrowdfunding(signer).claimLumi(campaignId)).wait();
}

export async function txDistributeReturns(campaignId: number, amountEth: string): Promise<void> {
  const signer = await getSigner();
  await (await contractCrowdfunding(signer).distributeReturns(campaignId, { value: parseEther(amountEth) })).wait();
}

export async function txClaimReturn(campaignId: number): Promise<void> {
  const signer = await getSigner();
  await (await contractCrowdfunding(signer).claimReturn(campaignId)).wait();
}

export async function txCreateProposal(
  campaignId: number,
  title: string,
  description: string,
  votingPeriodSeconds: number,
  quorumEth: string,
): Promise<void> {
  const signer = await getSigner();
  await (
    await contractGovernanceVoting(signer).createProposal(
      campaignId,
      title,
      description,
      votingPeriodSeconds,
      parseEther(quorumEth),
    )
  ).wait();
}

export async function txVoteOnProposal(proposalId: number, support: boolean): Promise<void> {
  const signer = await getSigner();
  await (await contractGovernanceVoting(signer).vote(proposalId, support)).wait();
}

export async function txExecuteProposal(proposalId: number): Promise<void> {
  const signer = await getSigner();
  await (await contractGovernanceVoting(signer).executeProposal(proposalId)).wait();
}

export async function txDepositEscrow(campaignId: number, amountEth: string): Promise<void> {
  const signer = await getSigner();
  await (await contractMilestoneEscrow(signer).depositEscrow(campaignId, { value: parseEther(amountEth) })).wait();
}

export async function txCreateMilestone(
  campaignId: number,
  title: string,
  details: string,
  amountEth: string,
): Promise<void> {
  const signer = await getSigner();
  await (
    await contractMilestoneEscrow(signer).createMilestone(
      campaignId,
      title,
      details,
      parseEther(amountEth),
    )
  ).wait();
}

export async function txSubmitMilestoneProof(milestoneId: number, proofURI: string): Promise<void> {
  const signer = await getSigner();
  await (await contractMilestoneEscrow(signer).submitMilestoneProof(milestoneId, proofURI)).wait();
}

export async function txApproveMilestone(milestoneId: number): Promise<void> {
  const signer = await getSigner();
  await (await contractMilestoneEscrow(signer).approveMilestone(milestoneId)).wait();
}

export async function txReleaseMilestone(milestoneId: number): Promise<void> {
  const signer = await getSigner();
  await (await contractMilestoneEscrow(signer).releaseMilestone(milestoneId)).wait();
}

// ── Ganache time control (testing only) ───────────────────────────

async function ganacheRpc(method: string, params: unknown[] = []): Promise<void> {
  const res = await fetch(GANACHE_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: Date.now() }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message ?? 'Ganache RPC error');
}

export async function txTimeSkip(seconds: number): Promise<void> {
  await ganacheRpc('evm_increaseTime', [seconds]);
  await ganacheRpc('evm_mine');
}

// ── Helpers ───────────────────────────────────────────────────────

export function weiToEth(wei: bigint): number {
  return parseFloat(formatEther(wei));
}

export function formatError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.includes('user rejected') || err.message.includes('ACTION_REJECTED')) return 'Transaction rejected by user.';
    if (err.message.includes('insufficient funds')) return 'Insufficient ETH balance.';
    if (err.message.includes('Not admin')) return 'Only the admin can perform this action.';
    if (err.message.includes('not yet approved')) return 'This campaign has not been approved yet.';
    if (err.message.includes('Already approved')) return 'Campaign is already approved.';
    if (err.message.includes('Already rejected')) return 'Campaign is already rejected.';
    if (err.message.includes('Goal not reached')) return 'Campaign goal was not reached.';
    if (err.message.includes('Already withdrawn')) return 'Funds have already been withdrawn.';
    if (err.message.includes('Nothing to refund')) return 'No refund available for this address.';
    if (err.message.includes('Already claimed')) return 'LUMI tokens already claimed.';
    if (err.message.includes('Funds not yet withdrawn')) return 'You must withdraw campaign funds before distributing returns.';
    if (err.message.includes('No returns available')) return 'No returns have been distributed yet.';
    if (err.message.includes('Nothing to claim')) return 'No new returns to claim.';
    if (err.message.includes('Voting ended')) return 'This proposal is no longer open for voting.';
    if (err.message.includes('Already voted')) return 'You have already voted on this proposal.';
    if (err.message.includes('No contribution weight')) return 'Only contributors can vote on this proposal.';
    if (err.message.includes('Campaign not successful')) return 'This action requires a successful campaign.';
    if (err.message.includes('Insufficient escrow')) return 'There is not enough escrow balance for this milestone.';
    if (err.message.includes('Proof not submitted')) return 'The creator has not submitted milestone proof yet.';
    if (err.message.includes('Milestone not approved')) return 'This milestone must be approved first.';
    if (err.message.includes('Not creator')) return 'Only the campaign creator can perform this action.';
    if (err.message.includes('Proof required')) return 'Please provide a proof link or reference.';
    return err.message.slice(0, 120);
  }
  return 'An unknown error occurred.';
}
