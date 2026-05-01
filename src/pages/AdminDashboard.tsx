import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle, XCircle, Loader2, Clock, AlertCircle, FileText, FastForward, CalendarClock, LayoutList, TrendingUp } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Layout } from '@/components/Layout';
import {
  useWalletStore,
  chainToFrontend,
  formatETH,
  formatAddress,
  getDaysLeft,
  getStatusColor,
  getStatusLabel,
  isBlockchainConfigured,
  ROUTE_PATHS,
} from '@/lib/index';
import {
  fetchAllCampaigns,
  txApproveCampaign,
  txRejectCampaign,
  txTimeSkip,
  formatError,
} from '@/lib/blockchain';
import { printAdminCampaignReport } from '@/lib/reportGenerator';
import { useBlockTimestamp } from '@/hooks/use-block-timestamp';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

export default function AdminDashboard() {
  const { role, isConnected } = useWalletStore();
  const queryClient = useQueryClient();
  const chainEnabled = isBlockchainConfigured();
  const blockTimestamp = useBlockTimestamp();
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [txPending, setTxPending] = useState<number | null>(null);
  const [skipPending, setSkipPending] = useState(false);
  const [skipDays, setSkipDays] = useState('1');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'active' | 'successful' | 'failed' | 'rejected'>('all');

  const { data: chainCampaigns, isLoading, error, refetch } = useQuery({
    queryKey: ['campaigns'],
    queryFn: fetchAllCampaigns,
    enabled: chainEnabled && isConnected && role === 'admin',
    staleTime: 10_000,
  });

  if (!isConnected || role !== 'admin') {
    return <Navigate to={ROUTE_PATHS.HOME} replace />;
  }

  const allCampaigns = (chainCampaigns ?? []).map(chainToFrontend);
  const pendingCampaigns = (chainCampaigns ?? []).filter(c => c.status === 'pending');

  const ganacheDate = blockTimestamp
    ? new Date(blockTimestamp * 1000).toLocaleString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short',
        day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null;

  function handlePrintReport() {
    const opened = printAdminCampaignReport(allCampaigns);
    if (!opened) {
      toast.error('Allow pop-ups in your browser to print the PDF report.');
      return;
    }
    toast.success('Print dialog opened. Choose "Save as PDF" to export the report.');
  }

  async function handleApprove(id: number) {
    setTxPending(id);
    try {
      await txApproveCampaign(id);
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(`Campaign #${id} approved.`);
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setTxPending(null);
    }
  }

  async function handleReject(id: number) {
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }
    setTxPending(id);
    try {
      await txRejectCampaign(id, rejectReason.trim());
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(`Campaign #${id} rejected.`);
      setRejectingId(null);
      setRejectReason('');
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setTxPending(null);
    }
  }

  async function handleTimeSkip(days: number) {
    if (days <= 0) { toast.error('Enter a positive number of days.'); return; }
    setSkipPending(true);
    try {
      await txTimeSkip(days * 24 * 60 * 60);
      await queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      await queryClient.invalidateQueries({ queryKey: ['block-timestamp'] });
      toast.success(`Ganache time advanced by ${days} day${days !== 1 ? 's' : ''}.`);
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setSkipPending(false);
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground text-sm">Review and approve campaign submissions</p>
              </div>
            </div>
            <Button
              onClick={handlePrintReport}
              variant="outline"
              disabled={!chainEnabled || isLoading || !!error}
              className="border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300"
            >
              <FileText className="w-4 h-4 mr-2" />
              Print PDF Report
            </Button>
          </div>

          {!chainEnabled && (
            <Card className="border-yellow-500/30 bg-yellow-500/5 mb-8">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <p className="text-sm text-yellow-400">
                  Blockchain not configured. Deploy contracts and set addresses in <code className="text-xs bg-muted/50 px-1 rounded">.env</code> to use admin functions.
                </p>
              </CardContent>
            </Card>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-24 gap-3">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
              <span className="text-muted-foreground">Loading campaigns from Ganache…</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <p className="text-destructive text-center">Could not load campaigns from Ganache.</p>
              <Button variant="outline" onClick={() => refetch()}>Retry</Button>
            </div>
          )}

          {!isLoading && !error && chainEnabled && (
            <>
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-muted-foreground text-sm">
                  <span className="text-foreground font-semibold">{pendingCampaigns.length}</span> campaign{pendingCampaigns.length !== 1 ? 's' : ''} awaiting review
                </span>
              </div>

              {pendingCampaigns.length === 0 ? (
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <CheckCircle className="w-16 h-16 text-chart-3 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
                    <p className="text-muted-foreground text-center">No campaigns pending review.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {pendingCampaigns.map((chainCampaign, index) => {
                    const campaign = chainToFrontend(chainCampaign);
                    const isRejectingThis = rejectingId === chainCampaign.id;
                    const isPending = txPending === chainCampaign.id;

                    return (
                      <motion.div
                        key={chainCampaign.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                      >
                        <Card className="border-yellow-500/30 bg-card/60 backdrop-blur-sm">
                          <CardContent className="p-6 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-mono text-muted-foreground">#{chainCampaign.id}</span>
                                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40">Pending Approval</Badge>
                                </div>
                                <h3 className="text-xl font-semibold break-all">{campaign.title}</h3>
                                <p className="text-sm text-muted-foreground font-mono mt-1">
                                  Creator: {formatAddress(campaign.creator)}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm text-muted-foreground">Goal</p>
                                <p className="font-mono font-semibold">{formatETH(campaign.goal)}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Deadline: {new Date(campaign.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 break-all">
                              {campaign.description}
                            </p>

                            {isRejectingThis ? (
                              <div className="space-y-3 pt-2 border-t border-border/50">
                                <Textarea
                                  placeholder="Reason for rejection (required)..."
                                  value={rejectReason}
                                  onChange={e => setRejectReason(e.target.value)}
                                  rows={3}
                                  className="bg-background/50 border-border/50 focus:border-destructive/60 transition-colors resize-none"
                                />
                                <div className="flex gap-3">
                                  <Button
                                    onClick={() => handleReject(chainCampaign.id)}
                                    disabled={isPending}
                                    variant="destructive"
                                    className="flex-1"
                                  >
                                    {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                                    Confirm Reject
                                  </Button>
                                  <Button
                                    onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                    variant="outline"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-3 pt-2 border-t border-border/50">
                                <Button
                                  onClick={() => handleApprove(chainCampaign.id)}
                                  disabled={isPending}
                                  className="bg-chart-3 hover:bg-chart-3/90 text-white flex-1"
                                >
                                  {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => { setRejectingId(chainCampaign.id); setRejectReason(''); }}
                                  disabled={isPending}
                                  variant="outline"
                                  className="border-destructive/50 text-destructive hover:bg-destructive/10 flex-1"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              <Card className="border-orange-500/30 bg-card/60 backdrop-blur-sm mt-8">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <FastForward className="w-5 h-5 text-orange-400" />
                    <div>
                      <h2 className="text-xl font-semibold">
                        Time Skip <span className="text-xs text-muted-foreground font-normal ml-1">(Ganache testing only)</span>
                      </h2>
                      <p className="text-sm text-muted-foreground">Advance the blockchain clock to simulate campaign deadlines.</p>
                    </div>
                  </div>

                  {ganacheDate && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-orange-500/10 border border-orange-500/20">
                      <CalendarClock className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      <span className="text-sm text-orange-300">
                        Current Ganache time: <span className="font-mono font-semibold">{ganacheDate}</span>
                      </span>
                    </div>
                  )}

                  <div className="flex gap-3 items-center">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Days to skip"
                      value={skipDays}
                      onChange={e => setSkipDays(e.target.value)}
                      className="max-w-[160px]"
                    />
                    <span className="text-sm text-muted-foreground">day(s)</span>
                    <Button
                      onClick={() => handleTimeSkip(Number(skipDays))}
                      disabled={skipPending}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {skipPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FastForward className="w-4 h-4 mr-2" />}
                      Skip Time
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[1, 3, 7, 30].map(d => (
                      <Button
                        key={d}
                        variant="outline"
                        size="sm"
                        disabled={skipPending}
                        className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                        onClick={() => handleTimeSkip(d)}
                      >
                        +{d}d
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Campaign History Panel */}
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm mt-8">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <LayoutList className="w-5 h-5 text-accent" />
                    <div>
                      <h2 className="text-xl font-semibold">Campaign History</h2>
                      <p className="text-sm text-muted-foreground">All campaigns and their current funding state.</p>
                    </div>
                  </div>

                  {/* Summary stat cards */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: 'Total', count: allCampaigns.length, color: 'text-foreground' },
                      { label: 'Active', count: allCampaigns.filter(c => c.status === 'active').length, color: 'text-accent' },
                      { label: 'Successful', count: allCampaigns.filter(c => c.status === 'successful').length, color: 'text-chart-3' },
                      { label: 'Failed', count: allCampaigns.filter(c => c.status === 'failed').length, color: 'text-destructive' },
                    ].map(stat => (
                      <div key={stat.label} className="rounded-lg bg-muted/20 border border-border/40 p-3 text-center">
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Filter buttons */}
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'active', 'successful', 'failed', 'rejected'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setHistoryFilter(f)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          historyFilter === f
                            ? 'bg-accent text-accent-foreground border-accent'
                            : 'bg-transparent text-muted-foreground border-border/50 hover:border-accent/50 hover:text-foreground'
                        }`}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Campaign rows */}
                  <div className="space-y-3">
                    {allCampaigns
                      .filter(c => historyFilter === 'all' || c.status === historyFilter)
                      .sort((a, b) => Number(a.id) - Number(b.id))
                      .map(campaign => {
                        const progress = Math.min(100, (campaign.current / campaign.goal) * 100);
                        const daysLeft = getDaysLeft(campaign.deadline, blockTimestamp);
                        return (
                          <div key={campaign.id} className="rounded-lg border border-border/40 bg-background/40 p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-mono text-muted-foreground">#{campaign.id}</span>
                                  <Badge className={`${getStatusColor(campaign.status)} border text-xs`}>
                                    {getStatusLabel(campaign.status)}
                                  </Badge>
                                </div>
                                <p className="font-semibold text-sm mt-1 truncate">{campaign.title}</p>
                                <p className="text-xs text-muted-foreground font-mono">{formatAddress(campaign.creator)}</p>
                              </div>
                              <div className="text-right flex-shrink-0 space-y-0.5">
                                <div className="flex items-center gap-1 justify-end text-xs text-muted-foreground">
                                  <TrendingUp className="w-3 h-3" />
                                  <span className="font-mono font-semibold text-foreground">{formatETH(campaign.current)}</span>
                                  <span>/ {formatETH(campaign.goal)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {campaign.status === 'active'
                                    ? daysLeft > 0 ? `${daysLeft}d left` : 'Ending soon'
                                    : new Date(campaign.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Progress value={progress} className="h-1.5 bg-muted/40" />
                              <p className="text-xs text-muted-foreground text-right">{progress.toFixed(1)}% funded</p>
                            </div>
                          </div>
                        );
                      })}

                    {allCampaigns.filter(c => historyFilter === 'all' || c.status === historyFilter).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">No campaigns match this filter.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
