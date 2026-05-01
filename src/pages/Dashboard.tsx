import { Layout } from '@/components/Layout';
import { useState } from 'react';
import {
  useWalletStore, MOCK_CAMPAIGNS, MOCK_CONTRIBUTIONS,
  formatETH, formatAddress, getStatusLabel, getStatusColor,
  chainToFrontend, getLoyaltySummary, isBlockchainConfigured,
  type Campaign, type CampaignStatus,
} from '@/lib/index';
import {
  fetchAllCampaigns, fetchUserContributedIds, queryContribution,
  queryLumiBalance,
} from '@/lib/blockchain';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Wallet, Film, TrendingUp, Calendar, Coins, Loader2, Search, SlidersHorizontal, Award, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { formatEther } from 'ethers';

interface ContributionListItem {
  campaign: Campaign;
  amountEth: number;
}

const STATUS_FILTER_OPTIONS: Array<{ value: 'all' | CampaignStatus; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending Approval' },
  { value: 'active', label: 'Active' },
  { value: 'successful', label: 'Goal Reached' },
  { value: 'failed', label: 'Funding Failed' },
  { value: 'rejected', label: 'Rejected' },
];

const CONTRIBUTION_STATUS_FILTER_OPTIONS: Array<{ value: 'all' | Exclude<CampaignStatus, 'pending'>; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'successful', label: 'Goal Reached' },
  { value: 'failed', label: 'Funding Failed' },
  { value: 'rejected', label: 'Rejected' },
];

export default function Dashboard() {
  const { isConnected, address, connect } = useWalletStore();
  const chainEnabled = isBlockchainConfigured();
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<'all' | CampaignStatus>('all');
  const [contributionSearch, setContributionSearch] = useState('');
  const [contributionStatusFilter, setContributionStatusFilter] = useState<'all' | Exclude<CampaignStatus, 'pending'>>('all');

  // ── Chain data ────────────────────────────────────────────────────
  const { data: allChainCampaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: fetchAllCampaigns,
    enabled: chainEnabled && isConnected,
    staleTime: 15_000,
  });

  const { data: contributedIds = [], isLoading: idsLoading } = useQuery({
    queryKey: ['contributedIds', address],
    queryFn: () => fetchUserContributedIds(address!),
    enabled: chainEnabled && !!address,
    staleTime: 15_000,
  });

  const { data: lumiWei = 0n } = useQuery({
    queryKey: ['lumiBalance', address],
    queryFn: () => queryLumiBalance(address!),
    enabled: chainEnabled && !!address,
    staleTime: 30_000,
  });

  const { data: contributionMap = {}, isLoading: contributionsLoading } = useQuery({
    queryKey: ['contributionAmounts', address, contributedIds.join(',')],
    queryFn: async () => {
      if (!address) return {};
      const entries = await Promise.all(
        contributedIds.map(async campaignId => [campaignId, await queryContribution(campaignId, address)] as const),
      );
      return Object.fromEntries(entries);
    },
    enabled: chainEnabled && !!address && contributedIds.length > 0,
    staleTime: 15_000,
  });

  // ── Derived data ──────────────────────────────────────────────────
  const userCampaigns: Campaign[] = chainEnabled
    ? (allChainCampaigns ?? [])
        .filter(c => c.creator.toLowerCase() === (address ?? '').toLowerCase())
        .map(chainToFrontend)
    : MOCK_CAMPAIGNS.filter(c => c.creator === address);

  const contributedCampaigns: ContributionListItem[] = chainEnabled
    ? (allChainCampaigns ?? [])
        .filter(c => contributedIds.includes(c.id))
        .map(chainToFrontend)
        .filter(campaign => campaign.status !== 'pending')
        .map(campaign => ({
          campaign,
          amountEth: parseFloat(formatEther(contributionMap[Number(campaign.id)] ?? 0n)),
        }))
        .sort((a, b) => b.amountEth - a.amountEth)
    : MOCK_CAMPAIGNS
        .filter(c => MOCK_CONTRIBUTIONS.some(co => co.campaignId === c.id))
        .filter(campaign => campaign.status !== 'pending')
        .map(campaign => ({
          campaign,
          amountEth: MOCK_CONTRIBUTIONS.find(co => co.campaignId === campaign.id)?.amount ?? 0,
        }));

  const filteredUserCampaigns = userCampaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(campaignSearch.toLowerCase())
      || campaign.shortDescription.toLowerCase().includes(campaignSearch.toLowerCase());
    const matchesStatus = campaignStatusFilter === 'all' || campaign.status === campaignStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredContributedCampaigns = contributedCampaigns.filter(({ campaign }) => {
    const matchesSearch = campaign.title.toLowerCase().includes(contributionSearch.toLowerCase())
      || campaign.shortDescription.toLowerCase().includes(contributionSearch.toLowerCase());
    const matchesStatus = contributionStatusFilter === 'all' || campaign.status === contributionStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalContributionEth = filteredContributedCampaigns.reduce((sum, item) => sum + item.amountEth, 0);
  const isLoading = campaignsLoading || idsLoading || contributionsLoading;
  const lumiBalance = parseFloat(formatEther(lumiWei));
  const successfulBackedCount = contributedCampaigns.filter(({ campaign }) => campaign.status === 'successful').length;
  const loyalty = getLoyaltySummary(lumiBalance);
  const unlockedBadges = [
    contributedCampaigns.length > 0 ? 'First Backer' : null,
    successfulBackedCount > 0 ? 'Goal Hunter' : null,
    contributedCampaigns.length >= 3 ? 'Repeat Supporter' : null,
    lumiBalance >= 500 ? loyalty.badge : null,
  ].filter(Boolean) as string[];

  // ── Not connected ─────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-md"
          >
            <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Wallet className="w-12 h-12 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Connect Your Wallet
            </h1>
            <p className="text-muted-foreground mb-8 text-lg">
              Connect your MetaMask wallet to view your campaigns and contributions.
            </p>
            <Button
              size="lg"
              onClick={connect}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              <Wallet className="mr-2 h-5 w-5" />
              Connect Wallet
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-muted-foreground font-mono text-sm">{formatAddress(address || '')}</p>
              </div>
              {contributedCampaigns.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Filtered total</span>
                  <span className="font-mono font-semibold text-foreground">{formatETH(totalContributionEth)}</span>
                </div>
              )}
              {chainEnabled && lumiBalance > 0 && (
                <div className="ml-auto flex items-center gap-2 bg-chart-3/10 border border-chart-3/30 rounded-lg px-4 py-2">
                  <Coins className="w-4 h-4 text-chart-3" />
                  <span className="font-mono font-semibold text-chart-3">{lumiBalance.toFixed(2)} LUMI</span>
                </div>
              )}
            </div>
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm mb-8 overflow-hidden">
            <CardContent className="p-6">
              <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-chart-3/15 border border-chart-3/30 flex items-center justify-center">
                      <Award className="w-6 h-6 text-chart-3" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Loyalty Summary</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-semibold">{loyalty.tier} Supporter</h2>
                        <Badge className="bg-chart-3/15 text-chart-3 border border-chart-3/30">{loyalty.badge}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-border/50 bg-background/30 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">LUMI Balance</p>
                      <p className="mt-2 text-2xl font-semibold text-chart-3">{lumiBalance.toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-background/30 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Campaigns Backed</p>
                      <p className="mt-2 text-2xl font-semibold">{contributedCampaigns.length}</p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-background/30 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Successful Backings</p>
                      <p className="mt-2 text-2xl font-semibold">{successfulBackedCount}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/50 bg-background/30 p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-sm font-medium">Tier Progress</p>
                      <p className="text-xs text-muted-foreground">
                        {loyalty.nextMin === null
                          ? 'Top loyalty tier reached'
                          : `${loyalty.lumiToNextTier.toFixed(0)} LUMI to ${loyalty.nextMin} `}
                      </p>
                    </div>
                    <Progress value={loyalty.progress} className="h-2" />
                    <p className="mt-3 text-sm text-muted-foreground">{loyalty.perk}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-border/50 bg-background/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-chart-3" />
                      <p className="text-sm font-medium">Unlocked Recognition</p>
                    </div>
                    {unlockedBadges.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {unlockedBadges.map(badge => (
                          <Badge key={badge} variant="outline" className="border-chart-3/30 bg-chart-3/10 text-chart-3">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Back a campaign to earn your first loyalty badge.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-border/50 bg-background/30 p-4">
                    <p className="text-sm font-medium mb-3">Current Loyalty Perk</p>
                    <p className="text-sm text-muted-foreground">{loyalty.perk}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex items-center justify-center py-24 gap-3">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
              <span className="text-muted-foreground">Loading from Ganache…</span>
            </div>
          ) : (
            <Tabs defaultValue="campaigns" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
                <TabsTrigger value="campaigns" className="flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  My Campaigns
                </TabsTrigger>
                <TabsTrigger value="contributions" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  My Contributions
                </TabsTrigger>
              </TabsList>

              {/* Campaigns tab */}
              <TabsContent value="campaigns">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <SlidersHorizontal className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Filter your campaigns</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                      <div className="relative">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          value={campaignSearch}
                          onChange={e => setCampaignSearch(e.target.value)}
                          placeholder="Search by campaign title or description"
                          className="pl-9"
                        />
                      </div>
                      <Select value={campaignStatusFilter} onValueChange={(value: 'all' | CampaignStatus) => setCampaignStatusFilter(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_FILTER_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
                {userCampaigns.length === 0 ? (
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
                        <Film className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-2xl font-semibold mb-2">No Campaigns Yet</h3>
                      <p className="text-muted-foreground text-center max-w-md mb-6">
                        You haven't created any campaigns yet. Launch your first film campaign.
                      </p>
                      <Button
                        onClick={() => window.location.assign('#/create')}
                        className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                      >
                        Create Campaign
                      </Button>
                    </CardContent>
                  </Card>
                ) : filteredUserCampaigns.length === 0 ? (
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
                        <Search className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-2xl font-semibold mb-2">No Matching Campaigns</h3>
                      <p className="text-muted-foreground text-center max-w-md">
                        Try a different keyword or status filter to find your campaigns faster.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {filteredUserCampaigns.map((campaign, index) => (
                      <motion.div key={campaign.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.1 }}>
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row gap-6">
                              <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                                <img src={campaign.image} alt={campaign.title} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <h3 className="text-2xl font-semibold mb-2 break-all">{campaign.title}</h3>
                                    <p className="text-muted-foreground line-clamp-2 break-all">{campaign.shortDescription}</p>
                                  </div>
                                  <Badge className={getStatusColor(campaign.status)}>{getStatusLabel(campaign.status)}</Badge>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Funding Progress</span>
                                    <span className="font-mono font-semibold">{formatETH(campaign.current)} / {formatETH(campaign.goal)}</span>
                                  </div>
                                  <Progress value={(campaign.current / campaign.goal) * 100} className="h-2" />
                                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>{Math.round((campaign.current / campaign.goal) * 100)}% funded</span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(campaign.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => window.location.assign(`#/campaign/${campaign.id}`)}>
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Contributions tab */}
              <TabsContent value="contributions">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <SlidersHorizontal className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Filter your contributions</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                      <div className="relative">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          value={contributionSearch}
                          onChange={e => setContributionSearch(e.target.value)}
                          placeholder="Search contributed campaigns"
                          className="pl-9"
                        />
                      </div>
                      <Select value={contributionStatusFilter} onValueChange={(value: 'all' | Exclude<CampaignStatus, 'pending'>) => setContributionStatusFilter(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTRIBUTION_STATUS_FILTER_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
                {contributedCampaigns.length === 0 ? (
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
                        <TrendingUp className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-2xl font-semibold mb-2">No Contributions Yet</h3>
                      <p className="text-muted-foreground text-center max-w-md mb-6">
                        You haven't supported any campaigns yet. Explore active campaigns.
                      </p>
                      <Button onClick={() => window.location.assign('#/explore')} className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
                        Explore Campaigns
                      </Button>
                    </CardContent>
                  </Card>
                ) : filteredContributedCampaigns.length === 0 ? (
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
                        <Search className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-2xl font-semibold mb-2">No Matching Contributions</h3>
                      <p className="text-muted-foreground text-center max-w-md">
                        No contributions match the current filters. Try widening your search or selecting another status.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredContributedCampaigns.map(({ campaign, amountEth }, index) => (
                      <motion.div key={campaign.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.1 }}>
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold mb-2">{campaign.title}</h3>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                  <span className="font-mono font-semibold text-foreground">
                                    You contributed {formatETH(amountEth)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Deadline: {new Date(campaign.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                  </span>
                                  <Badge className={getStatusColor(campaign.status)}>{getStatusLabel(campaign.status)}</Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <Button variant="outline" size="sm" onClick={() => window.location.assign(`#/campaign/${campaign.id}`)}>
                                  View Campaign
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
