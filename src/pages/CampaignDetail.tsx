import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, User, Target, TrendingUp, Loader2, Vote, Landmark, FileCheck, Award, Sparkles } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Layout } from '@/components/Layout';
import { ContributeModal } from '@/components/ContributeModal';
import {
  MOCK_CAMPAIGNS,
  chainToFrontend,
  formatETH,
  formatAddress,
  getDaysLeft,
  getLoyaltySummary,
  getStatusColor,
  getStatusLabel,
  LUMI_RATE,
  useWalletStore,
  isBlockchainConfigured,
  ROUTE_PATHS,
  type Campaign,
} from '@/lib/index';
import {
  fetchCampaign,
  queryContribution,
  queryLumiBalance,
  queryLumiClaimed,
  queryReturnPool,
  queryReturnClaimed,
  fetchCampaignProposals,
  fetchCampaignMilestones,
  isGovernanceConfigured,
  isMilestoneEscrowConfigured,
  queryAvailableEscrow,
  queryEscrowBalance,
  queryProposalVoteStatus,
  txWithdraw,
  txClaimRefund,
  txClaimLumi,
  txDistributeReturns,
  txClaimReturn,
  txVoteOnProposal,
  txExecuteProposal,
  txDepositEscrow,
  txSubmitMilestoneProof,
  txApproveMilestone,
  txReleaseMilestone,
  weiToEth,
  formatError,
} from '@/lib/blockchain';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBlockTimestamp } from '@/hooks/use-block-timestamp';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected, address, role } = useWalletStore();
  const blockTimestamp = useBlockTimestamp();
  const [modalOpen, setModalOpen] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [distributeAmount, setDistributeAmount] = useState('');
  const [escrowDepositAmount, setEscrowDepositAmount] = useState('');
  const [milestoneProof, setMilestoneProof] = useState<Record<number, string>>({});
  const [governancePendingId, setGovernancePendingId] = useState<number | null>(null);
  const [milestonePendingId, setMilestonePendingId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const chainEnabled = isBlockchainConfigured();
  const governanceEnabled = isGovernanceConfigured();
  const milestoneEnabled = isMilestoneEscrowConfigured();
  const campaignId = Number(id);

  // ── Campaign data ────────────────────────────────────────────────
  const { data: chainCampaign, isLoading: campaignLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => fetchCampaign(campaignId),
    enabled: chainEnabled && !!id && !isNaN(campaignId),
    staleTime: 15_000,
  });

  const campaign: Campaign | null = chainEnabled
    ? (chainCampaign ? chainToFrontend(chainCampaign) : null)
    : (MOCK_CAMPAIGNS.find(c => c.id === id) ?? null);

  // ── User-specific on-chain data ──────────────────────────────────
  const { data: userContributionWei = 0n } = useQuery({
    queryKey: ['contribution', id, address],
    queryFn: () => queryContribution(campaignId, address!),
    enabled: chainEnabled && !!address && !!id && !isNaN(campaignId),
    staleTime: 15_000,
  });

  const { data: lumiAlreadyClaimed = false } = useQuery({
    queryKey: ['lumiClaimed', id, address],
    queryFn: () => queryLumiClaimed(campaignId, address!),
    enabled: chainEnabled && !!address && !!id && campaign?.status === 'successful',
    staleTime: 15_000,
  });

  const { data: lumiBalanceWei = 0n } = useQuery({
    queryKey: ['lumiBalance', address],
    queryFn: () => queryLumiBalance(address!),
    enabled: chainEnabled && !!address,
    staleTime: 30_000,
  });

  const { data: returnPoolWei = 0n } = useQuery({
    queryKey: ['returnPool', id],
    queryFn: () => queryReturnPool(campaignId),
    enabled: chainEnabled && !!id && campaign?.status === 'successful',
    staleTime: 15_000,
  });

  const { data: returnClaimedWei = 0n } = useQuery({
    queryKey: ['returnClaimed', id, address],
    queryFn: () => queryReturnClaimed(campaignId, address!),
    enabled: chainEnabled && !!address && !!id && campaign?.status === 'successful',
    staleTime: 15_000,
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ['campaign-proposals', campaignId],
    queryFn: () => fetchCampaignProposals(campaignId),
    enabled: governanceEnabled && !!id && !isNaN(campaignId),
    staleTime: 15_000,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', campaignId],
    queryFn: () => fetchCampaignMilestones(campaignId),
    enabled: milestoneEnabled && !!id && !isNaN(campaignId),
    staleTime: 15_000,
  });

  const { data: escrowBalanceWei = 0n } = useQuery({
    queryKey: ['escrowBalance', campaignId],
    queryFn: () => queryEscrowBalance(campaignId),
    enabled: milestoneEnabled && campaign?.status === 'successful',
    staleTime: 15_000,
  });

  const { data: availableEscrowWei = 0n } = useQuery({
    queryKey: ['availableEscrow', campaignId],
    queryFn: () => queryAvailableEscrow(campaignId),
    enabled: milestoneEnabled && campaign?.status === 'successful',
    staleTime: 15_000,
  });

  const { data: votedProposalMap = {} } = useQuery({
    queryKey: ['proposalVotes', campaignId, address, proposals.map(p => p.id).join(',')],
    queryFn: async () => {
      if (!address) return {};
      const entries = await Promise.all(
        proposals.map(async proposal => [proposal.id, await queryProposalVoteStatus(proposal.id, address)] as const),
      );
      return Object.fromEntries(entries);
    },
    enabled: governanceEnabled && !!address && proposals.length > 0,
    staleTime: 15_000,
  });

  const userContributionEth = weiToEth(userContributionWei);
  const lumiBalance = weiToEth(lumiBalanceWei);
  const loyalty = getLoyaltySummary(lumiBalance);
  const isCreator = !!address && !!campaign && address.toLowerCase() === campaign.creator.toLowerCase();
  const isAdmin = role === 'admin';
  const isContributor = chainEnabled ? userContributionWei > 0n : true;
  const potentialLumiReward = userContributionEth > 0 ? Math.floor(userContributionEth * LUMI_RATE) : 0;

  const claimableReturnWei = returnPoolWei > 0n && chainCampaign && userContributionWei > 0n
    ? (userContributionWei * returnPoolWei) / chainCampaign.raisedWei - returnClaimedWei
    : 0n;

  // ── Transaction handlers ─────────────────────────────────────────
  async function withTx(fn: () => Promise<void>, successMsg: string, invalidateKeys: string[][]) {
    setTxPending(true);
    try {
      await fn();
      invalidateKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      toast.success(successMsg);
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setTxPending(false);
    }
  }

  const handleWithdraw = () =>
    withTx(
      () => txWithdraw(campaignId),
      'Funds withdrawn successfully!',
      [['campaign', id], ['campaigns']],
    );

  const handleClaimRefund = () =>
    withTx(
      () => txClaimRefund(campaignId),
      'Refund claimed successfully!',
      [['campaign', id], ['contribution', id, address]],
    );

  const handleClaimLumi = () =>
    withTx(
      () => txClaimLumi(campaignId),
      'LUMI tokens claimed!',
      [['lumiClaimed', id, address]],
    );

  const handleDistributeReturns = () => {
    if (!distributeAmount || parseFloat(distributeAmount) <= 0) return;
    withTx(
      () => txDistributeReturns(campaignId, distributeAmount),
      `${distributeAmount} ETH distributed to investors!`,
      [['returnPool', id]],
    ).then(() => setDistributeAmount(''));
  };

  const handleClaimReturn = () =>
    withTx(
      () => txClaimReturn(campaignId),
      'Return claimed successfully!',
      [['returnPool', id], ['returnClaimed', id, address]],
    );

  const handleVote = async (proposalId: number, support: boolean) => {
    setGovernancePendingId(proposalId);
    try {
      await txVoteOnProposal(proposalId, support);
      await queryClient.invalidateQueries({ queryKey: ['campaign-proposals', campaignId] });
      await queryClient.invalidateQueries({ queryKey: ['proposalVotes', campaignId, address] });
      toast.success(`Vote submitted ${support ? 'in support' : 'against'} the proposal.`);
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setGovernancePendingId(null);
    }
  };

  const handleExecuteProposal = async (proposalId: number) => {
    setGovernancePendingId(proposalId);
    try {
      await txExecuteProposal(proposalId);
      await queryClient.invalidateQueries({ queryKey: ['campaign-proposals', campaignId] });
      toast.success('Proposal executed.');
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setGovernancePendingId(null);
    }
  };

  const handleDepositEscrow = async () => {
    if (!escrowDepositAmount || parseFloat(escrowDepositAmount) <= 0) return;
    setTxPending(true);
    try {
      await txDepositEscrow(campaignId, escrowDepositAmount);
      await queryClient.invalidateQueries({ queryKey: ['escrowBalance', campaignId] });
      await queryClient.invalidateQueries({ queryKey: ['availableEscrow', campaignId] });
      toast.success('Escrow funded successfully.');
      setEscrowDepositAmount('');
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setTxPending(false);
    }
  };

  const handleSubmitMilestoneProof = async (milestoneId: number) => {
    const proofURI = milestoneProof[milestoneId]?.trim();
    if (!proofURI) {
      toast.error('Add a proof link or reference first.');
      return;
    }
    setMilestonePendingId(milestoneId);
    try {
      await txSubmitMilestoneProof(milestoneId, proofURI);
      await queryClient.invalidateQueries({ queryKey: ['milestones', campaignId] });
      toast.success('Milestone proof submitted.');
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setMilestonePendingId(null);
    }
  };

  const handleApproveMilestone = async (milestoneId: number) => {
    setMilestonePendingId(milestoneId);
    try {
      await txApproveMilestone(milestoneId);
      await queryClient.invalidateQueries({ queryKey: ['milestones', campaignId] });
      toast.success('Milestone approved.');
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setMilestonePendingId(null);
    }
  };

  const handleReleaseMilestone = async (milestoneId: number) => {
    setMilestonePendingId(milestoneId);
    try {
      await txReleaseMilestone(milestoneId);
      await queryClient.invalidateQueries({ queryKey: ['milestones', campaignId] });
      await queryClient.invalidateQueries({ queryKey: ['escrowBalance', campaignId] });
      await queryClient.invalidateQueries({ queryKey: ['availableEscrow', campaignId] });
      toast.success('Milestone funds released.');
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setMilestonePendingId(null);
    }
  };

  // ── Redirect ─────────────────────────────────────────────────────
  if (campaignLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-accent animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!campaign) return <Navigate to={ROUTE_PATHS.EXPLORE} replace />;

  const progress = (campaign.current / campaign.goal) * 100;
  const daysLeft = getDaysLeft(campaign.deadline, blockTimestamp);

  return (
    <Layout>
      <div className="min-h-screen py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="relative w-full h-[400px] rounded-2xl overflow-hidden mb-8">
              <img src={campaign.image} alt={campaign.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              <div className="absolute top-6 right-6">
                <Badge className={`${getStatusColor(campaign.status)} border px-4 py-2 text-sm font-medium backdrop-blur-sm`}>
                  {getStatusLabel(campaign.status)}
                </Badge>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 break-all bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {campaign.title}
                  </h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="text-sm">Created by</span>
                    <code className="font-mono text-sm bg-muted/50 px-2 py-1 rounded">
                      {formatAddress(campaign.creator)}
                    </code>
                    {isCreator && <Badge variant="outline" className="text-xs border-accent/40 text-accent">You</Badge>}
                  </div>
                </div>

                <Card className="p-6 bg-card/60 backdrop-blur-md border-border/50">
                  <h2 className="text-xl font-semibold mb-4">About This Project</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line break-all">{campaign.description}</p>
                </Card>

                {chainEnabled && isConnected && userContributionEth > 0 && (
                  <Card className="p-4 bg-accent/5 border-accent/30">
                    <p className="text-sm text-muted-foreground">
                      Your contribution: <span className="font-mono font-semibold text-accent">{formatETH(userContributionEth)}</span>
                    </p>
                  </Card>
                )}

                {governanceEnabled && chainEnabled && proposals.length > 0 && (
                  <Card className="p-6 bg-card/60 backdrop-blur-md border-border/50">
                    <div className="flex items-center gap-2 mb-4">
                      <Vote className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-semibold">Governance Proposals</h2>
                    </div>
                    <div className="space-y-4">
                      {proposals.map(proposal => {
                        const votingClosed = Date.now() / 1000 >= proposal.deadline;
                        const totalVotesWei = proposal.forVotesWei + proposal.againstVotesWei;
                        const hasVoted = Boolean(votedProposalMap[proposal.id]);
                        const pending = governancePendingId === proposal.id;
                        return (
                          <div key={proposal.id} className="rounded-xl border border-border/50 p-4 space-y-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h3 className="font-semibold">#{proposal.id} {proposal.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{proposal.description}</p>
                              </div>
                              <Badge variant="outline">
                                {proposal.executed ? (proposal.passed ? 'Passed' : 'Not Passed') : votingClosed ? 'Awaiting Execution' : 'Voting Open'}
                              </Badge>
                            </div>
                            <div className="grid sm:grid-cols-3 gap-3 text-sm">
                              <div>For: <span className="font-mono">{weiToEth(proposal.forVotesWei).toFixed(4)} ETH</span></div>
                              <div>Against: <span className="font-mono">{weiToEth(proposal.againstVotesWei).toFixed(4)} ETH</span></div>
                              <div>Total: <span className="font-mono">{weiToEth(totalVotesWei).toFixed(4)} ETH</span></div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Voting ends {new Date(proposal.deadline * 1000).toLocaleString('en-US')} • Quorum {weiToEth(proposal.quorumWei).toFixed(4)} ETH
                            </p>
                            {!votingClosed && isConnected && !isCreator && isContributor && !hasVoted && (
                              <div className="flex gap-3">
                                <Button onClick={() => handleVote(proposal.id, true)} disabled={pending} size="sm">
                                  {pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                  Vote For
                                </Button>
                                <Button onClick={() => handleVote(proposal.id, false)} disabled={pending} variant="outline" size="sm">
                                  Vote Against
                                </Button>
                              </div>
                            )}
                            {hasVoted && (
                              <p className="text-xs text-muted-foreground">You have already voted on this proposal.</p>
                            )}
                            {isAdmin && votingClosed && !proposal.executed && (
                              <Button onClick={() => handleExecuteProposal(proposal.id)} disabled={pending} size="sm" variant="outline">
                                {pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Execute Proposal
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {milestoneEnabled && chainEnabled && campaign.status === 'successful' && (
                  <Card className="p-6 bg-card/60 backdrop-blur-md border-border/50">
                    <div className="flex items-center gap-2 mb-4">
                      <Landmark className="w-5 h-5 text-chart-3" />
                      <h2 className="text-xl font-semibold">Milestone Escrow</h2>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 mb-4 text-sm">
                      <div>Total escrow: <span className="font-mono">{weiToEth(escrowBalanceWei).toFixed(4)} ETH</span></div>
                      <div>Available escrow: <span className="font-mono">{weiToEth(availableEscrowWei).toFixed(4)} ETH</span></div>
                    </div>

                    {isCreator && (
                      <div className="flex gap-2 mb-4">
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          placeholder="Deposit escrow (ETH)"
                          value={escrowDepositAmount}
                          onChange={e => setEscrowDepositAmount(e.target.value)}
                          className="bg-background/50 border-border/50 text-sm h-9"
                        />
                        <Button
                          onClick={handleDepositEscrow}
                          disabled={txPending || !escrowDepositAmount || parseFloat(escrowDepositAmount) <= 0}
                          size="sm"
                          className="bg-chart-3 hover:bg-chart-3/90 text-white whitespace-nowrap"
                        >
                          {txPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Deposit'}
                        </Button>
                      </div>
                    )}

                    {milestones.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No milestones created for this campaign yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {milestones.map(milestone => {
                          const pending = milestonePendingId === milestone.id;
                          return (
                            <div key={milestone.id} className="rounded-xl border border-border/50 p-4 space-y-3">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <h3 className="font-semibold">#{milestone.id} {milestone.title}</h3>
                                  <p className="text-sm text-muted-foreground mt-1">{milestone.details}</p>
                                </div>
                                <Badge variant="outline">
                                  {milestone.released ? 'Released' : milestone.approved ? 'Approved' : milestone.submitted ? 'Submitted' : 'Draft'}
                                </Badge>
                              </div>
                              <div className="text-sm">
                                Amount: <span className="font-mono">{weiToEth(milestone.amountWei).toFixed(4)} ETH</span>
                              </div>
                              {milestone.proofURI && (
                                <p className="text-xs text-muted-foreground break-all">Proof: {milestone.proofURI}</p>
                              )}

                              {isCreator && !milestone.submitted && !milestone.released && (
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Proof link or reference"
                                    value={milestoneProof[milestone.id] ?? ''}
                                    onChange={e => setMilestoneProof(current => ({ ...current, [milestone.id]: e.target.value }))}
                                  />
                                  <Button onClick={() => handleSubmitMilestoneProof(milestone.id)} disabled={pending} size="sm">
                                    {pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileCheck className="w-4 h-4 mr-2" />}
                                    Submit Proof
                                  </Button>
                                </div>
                              )}

                              {isAdmin && milestone.submitted && !milestone.approved && !milestone.released && (
                                <Button onClick={() => handleApproveMilestone(milestone.id)} disabled={pending} size="sm" variant="outline">
                                  {pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                  Approve Milestone
                                </Button>
                              )}

                              {isAdmin && milestone.approved && !milestone.released && (
                                <Button onClick={() => handleReleaseMilestone(milestone.id)} disabled={pending} size="sm" className="bg-chart-3 hover:bg-chart-3/90 text-white">
                                  {pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                  Release Funds
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                <Card className="p-6 bg-card/80 backdrop-blur-md border-border/50 sticky top-24">
                  <div className="space-y-6">
                    {/* Funding progress */}
                    <div>
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-3xl font-bold font-mono">{formatETH(campaign.current)}</span>
                        <span className="text-sm text-muted-foreground">of {formatETH(campaign.goal)}</span>
                      </div>
                      <div className="relative h-3 bg-muted/30 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(progress, 100)}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full"
                          style={{ boxShadow: '0 0 20px rgba(59,130,246,0.5)' }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-sm">
                        <span className="text-muted-foreground">{progress.toFixed(1)}% funded</span>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="w-4 h-4" />
                          <span>{Math.round(progress)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                      <div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs uppercase tracking-wide">Time Left</span>
                        </div>
                        <p className="text-2xl font-bold">{daysLeft > 0 ? `${daysLeft}d` : '0d'}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Target className="w-4 h-4" />
                          <span className="text-xs uppercase tracking-wide">Goal</span>
                        </div>
                        <p className="text-2xl font-bold font-mono">{campaign.goal} ETH</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-4 border-t border-border/50 space-y-3">

                      {/* Pending: awaiting admin approval */}
                      {campaign.status === 'pending' && (
                        <div className="text-center py-2">
                          <p className="text-sm font-medium text-yellow-400 mb-1">Awaiting Admin Approval</p>
                          <p className="text-xs text-muted-foreground">This campaign is under review and cannot accept contributions yet.</p>
                        </div>
                      )}

                      {/* Rejected */}
                      {campaign.status === 'rejected' && (
                        <div className="text-center py-2">
                          <p className="text-sm font-medium text-orange-400 mb-1">Campaign Rejected</p>
                          {chainCampaign?.rejectionReason && (
                            <p className="text-xs text-muted-foreground">Reason: {chainCampaign.rejectionReason}</p>
                          )}
                        </div>
                      )}

                      {/* Active: Contribute */}
                      {campaign.status === 'active' && (
                        isCreator ? (
                          <div className="w-full rounded-lg border border-border/40 bg-muted/20 px-4 py-3 text-center">
                            <p className="text-sm text-muted-foreground">You cannot contribute to your own campaign.</p>
                          </div>
                        ) : isConnected ? (
                          <Button
                            onClick={() => setModalOpen(true)}
                            disabled={txPending}
                            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                            size="lg"
                          >
                            Contribute Now
                          </Button>
                        ) : (
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-3">Connect wallet to contribute</p>
                            <Button onClick={() => useWalletStore.getState().connect()} variant="outline" className="w-full">
                              Connect Wallet
                            </Button>
                          </div>
                        )
                      )}

                      {/* Successful: Creator can withdraw, contributor can claim LUMI */}
                      {campaign.status === 'successful' && (
                        isConnected ? (
                          <>
                            {isCreator && !chainCampaign?.withdrawn && chainEnabled && (
                              <Button
                                onClick={handleWithdraw}
                                disabled={txPending}
                                className="w-full bg-chart-3 hover:bg-chart-3/90 text-white"
                                size="lg"
                              >
                                {txPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Withdraw Funds
                              </Button>
                            )}
                            {isCreator && chainCampaign?.withdrawn && chainEnabled && (
                              <p className="text-sm text-center text-muted-foreground">Funds already withdrawn</p>
                            )}
                            {!isCreator && isContributor && !lumiAlreadyClaimed && (
                              <Button
                                onClick={chainEnabled ? handleClaimLumi : undefined}
                                disabled={txPending}
                                className="w-full bg-chart-3 hover:bg-chart-3/90 text-white"
                                size="lg"
                              >
                                {txPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Claim LUMI Reward
                              </Button>
                            )}
                            {!isCreator && lumiAlreadyClaimed && (
                              <p className="text-sm text-center text-muted-foreground">LUMI already claimed</p>
                            )}

                            {/* Distribute Returns — creator only, after withdrawal */}
                            {isCreator && chainCampaign?.withdrawn && chainEnabled && (
                              <div className="pt-3 border-t border-border/50 space-y-2">
                                <p className="text-xs text-muted-foreground">
                                  Send profit share back to investors:
                                  {returnPoolWei > 0n && (
                                    <span className="ml-1 text-chart-3">{weiToEth(returnPoolWei).toFixed(4)} ETH distributed so far</span>
                                  )}
                                </p>
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    placeholder="ETH amount"
                                    value={distributeAmount}
                                    onChange={e => setDistributeAmount(e.target.value)}
                                    className="bg-background/50 border-border/50 text-sm h-9"
                                  />
                                  <Button
                                    onClick={handleDistributeReturns}
                                    disabled={txPending || !distributeAmount || parseFloat(distributeAmount) <= 0}
                                    size="sm"
                                    className="bg-chart-3 hover:bg-chart-3/90 text-white whitespace-nowrap"
                                  >
                                    {txPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Send Returns'}
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Claim Return — investors */}
                            {!isCreator && isContributor && returnPoolWei > 0n && chainEnabled && (
                              <div className="pt-3 border-t border-border/50 space-y-2">
                                <p className="text-xs text-muted-foreground">
                                  Profit share available:{' '}
                                  <span className="text-chart-3 font-mono font-semibold">
                                    {weiToEth(claimableReturnWei).toFixed(6)} ETH
                                  </span>
                                </p>
                                {claimableReturnWei > 0n ? (
                                  <Button
                                    onClick={handleClaimReturn}
                                    disabled={txPending}
                                    size="sm"
                                    className="w-full bg-chart-3 hover:bg-chart-3/90 text-white"
                                  >
                                    {txPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Claim Profit Share
                                  </Button>
                                ) : (
                                  <p className="text-xs text-center text-muted-foreground">Profit share already claimed</p>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-3">Connect wallet to claim rewards</p>
                            <Button onClick={() => useWalletStore.getState().connect()} variant="outline" className="w-full">
                              Connect Wallet
                            </Button>
                          </div>
                        )
                      )}

                      {/* Failed: Contributor can claim refund */}
                      {campaign.status === 'failed' && (
                        isConnected ? (
                          isContributor ? (
                            <Button
                              onClick={chainEnabled ? handleClaimRefund : undefined}
                              disabled={txPending}
                              variant="outline"
                              className="w-full border-destructive text-destructive hover:bg-destructive/10"
                              size="lg"
                            >
                              {txPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                              Claim Refund
                            </Button>
                          ) : (
                            <p className="text-sm text-center text-muted-foreground">No contribution to refund</p>
                          )
                        ) : (
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-3">Connect wallet to claim refund</p>
                            <Button onClick={() => useWalletStore.getState().connect()} variant="outline" className="w-full">
                              Connect Wallet
                            </Button>
                          </div>
                        )
                      )}

                      {!chainEnabled && (
                        <p className="text-xs text-center text-muted-foreground/60">Demo mode — transactions simulated</p>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <ContributeModal
        campaign={campaign}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['campaign', id] });
          queryClient.invalidateQueries({ queryKey: ['campaigns'] });
          queryClient.invalidateQueries({ queryKey: ['contribution', id, address] });
          navigate(ROUTE_PATHS.EXPLORE);
        }}
      />
    </Layout>
  );
}
