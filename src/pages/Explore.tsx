import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Loader2, AlertCircle, Blocks } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { CampaignCard } from '@/components/CampaignCard';
import { MOCK_CAMPAIGNS, chainToFrontend, isBlockchainConfigured, useWalletStore, type CampaignStatus, type Campaign } from '@/lib/index';
import { fetchAllCampaigns } from '@/lib/blockchain';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type FilterType = 'all' | CampaignStatus;

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const chainEnabled = isBlockchainConfigured();
  const { role } = useWalletStore();
  const isAdmin = role === 'admin';

  const { data: chainCampaigns, isLoading, error, refetch } = useQuery({
    queryKey: ['campaigns'],
    queryFn: fetchAllCampaigns,
    enabled: chainEnabled,
    staleTime: 15_000,
  });

  const allCampaigns: Campaign[] = useMemo(() => {
    const raw = chainEnabled ? (chainCampaigns ?? []).map(chainToFrontend) : MOCK_CAMPAIGNS;
    if (isAdmin) return raw;
    return raw.filter(c => c.status !== 'pending' && c.status !== 'rejected');
  }, [chainEnabled, chainCampaigns, isAdmin]);

  const filteredCampaigns = useMemo(() => {
    let result = allCampaigns;
    if (searchQuery.trim()) {
      result = result.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (activeFilter !== 'all') {
      result = result.filter(c => c.status === activeFilter);
    }
    return result;
  }, [allCampaigns, searchQuery, activeFilter]);

  const filterButtons: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Successful', value: 'successful' },
    { label: 'Failed', value: 'failed' },
    ...(isAdmin ? [
      { label: 'Pending', value: 'pending' as FilterType },
      { label: 'Rejected', value: 'rejected' as FilterType },
    ] : []),
  ];

  return (
    <Layout>
      <div className="min-h-screen py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-chart-2 bg-clip-text text-transparent">
                Explore Campaigns
              </h1>
              <Badge variant="outline" className={`text-xs ${chainEnabled ? 'border-chart-3/60 text-chart-3' : 'border-muted-foreground/40 text-muted-foreground'}`}>
                <Blocks className="w-3 h-3 mr-1" />
                {chainEnabled ? 'Live on Ganache' : 'Demo Mode'}
              </Badge>
            </div>
            <p className="text-xl text-muted-foreground">
              Discover groundbreaking film projects seeking support
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 space-y-6"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search campaigns by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg bg-card/50 backdrop-blur-sm border-border/50 focus:border-accent transition-colors"
              />
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filter:</span>
              </div>
              {filterButtons.map((filter) => (
                <Button
                  key={filter.value}
                  variant={activeFilter === filter.value ? 'default' : 'outline'}
                  onClick={() => setActiveFilter(filter.value)}
                  className="transition-all duration-200"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </motion.div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-10 h-10 text-accent animate-spin" />
              <p className="text-muted-foreground">Loading campaigns from Ganache…</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <p className="text-destructive text-center max-w-md">
                Could not load campaigns from Ganache. Make sure Ganache is running and your contract addresses in <code className="text-xs bg-muted/50 px-1 rounded">.env</code> are correct.
              </p>
              <Button variant="outline" onClick={() => refetch()}>Retry</Button>
            </div>
          )}

          {!isLoading && !error && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-6"
              >
                <p className="text-muted-foreground">
                  Showing <span className="text-foreground font-semibold">{filteredCampaigns.length}</span>{' '}
                  {filteredCampaigns.length === 1 ? 'campaign' : 'campaigns'}
                  {chainEnabled && chainCampaigns !== undefined && (
                    <span className="text-xs text-muted-foreground/60 ml-2">({chainCampaigns.length} on-chain)</span>
                  )}
                </p>
              </motion.div>

              <AnimatePresence mode="wait">
                {filteredCampaigns.length > 0 ? (
                  <motion.div
                    key="campaigns-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {filteredCampaigns.map((campaign, index) => (
                      <motion.div
                        key={campaign.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                      >
                        <CampaignCard campaign={campaign} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-state"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center py-24 px-4"
                  >
                    <div className="w-24 h-24 rounded-full bg-muted/20 flex items-center justify-center mb-6">
                      <Search className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-2">
                      {searchQuery || activeFilter !== 'all' ? 'No campaigns found' : 'No campaigns yet'}
                    </h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      {searchQuery || activeFilter !== 'all'
                        ? 'Try adjusting your search query or filters'
                        : chainEnabled
                          ? 'Be the first to create a campaign on Ganache!'
                          : 'No campaigns match your current filters'}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                      className="mt-6"
                    >
                      Clear Filters
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
