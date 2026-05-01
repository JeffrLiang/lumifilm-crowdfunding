import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Shield, Zap, Globe, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { CampaignCard } from '@/components/CampaignCard';
import { MOCK_CAMPAIGNS, ROUTE_PATHS, chainToFrontend, isBlockchainConfigured, useWalletStore, type Campaign } from '@/lib/index';
import { fetchAllCampaigns } from '@/lib/blockchain';
import { IMAGES } from '@/assets/images';
import { Button } from '@/components/ui/button';

export default function Home() {
  const chainEnabled = isBlockchainConfigured();
  const { role } = useWalletStore();
  const isAdmin = role === 'admin';

  const { data: chainCampaigns, isLoading, error, refetch } = useQuery({
    queryKey: ['campaigns'],
    queryFn: fetchAllCampaigns,
    enabled: chainEnabled,
    staleTime: 15_000,
  });

  const featuredCampaigns: Campaign[] = useMemo(() => {
    const raw = chainEnabled ? (chainCampaigns ?? []).map(chainToFrontend) : MOCK_CAMPAIGNS;
    const visibleCampaigns = isAdmin
      ? raw
      : raw.filter(c => c.status !== 'pending' && c.status !== 'rejected');

    return visibleCampaigns.slice(0, 4);
  }, [chainEnabled, chainCampaigns, isAdmin]);

  const features = [
    {
      icon: Shield,
      title: 'Transparency',
      description: 'Every transaction is recorded on the blockchain, ensuring complete visibility and accountability for all contributions.',
    },
    {
      icon: Zap,
      title: 'No Fees',
      description: 'Direct peer-to-peer funding means creators receive 100% of contributions without platform fees or intermediaries.',
    },
    {
      icon: Globe,
      title: 'Decentralized Logic',
      description: 'Smart contracts  control fund distribution and refunds, eliminating the need for centralized control or trust.',
    },
  ];

  return (
    <Layout>
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={IMAGES.HERO_BG_3}
            alt="Cinematic background"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/70" />
        </div>

        <div className="absolute inset-0 z-0 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-muted rounded-full"
              style={
                {
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: 0.3,
                }
              }
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-chart-2 bg-clip-text text-transparent" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              LumiFilm
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Decentralized Film Crowdfunding
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={ROUTE_PATHS.EXPLORE}>
                <Button size="lg" className="group">
                  Explore Campaigns
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to={ROUTE_PATHS.CREATE}>
                <Button size="lg" variant="outline">
                  Start a Campaign
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Why LumiFilm?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Empowering filmmakers with blockchain technology for transparent, fee-free crowdfunding
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative group"
                >
                  <div className="bg-card/60 backdrop-blur-md border border-border rounded-2xl p-8 h-full transition-all duration-300 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10">
                    <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                      <Icon className="h-7 w-7 text-accent" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="featured-campaigns" className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Featured Campaigns</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Discover groundbreaking film projects seeking support from the community
            </p>
          </motion.div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 text-accent animate-spin" />
              <p className="text-muted-foreground">Loading featured campaigns from Ganache...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <p className="text-destructive text-center max-w-md">
                Could not load featured campaigns from Ganache.
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !error && featuredCampaigns.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCampaigns.map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <CampaignCard campaign={campaign} />
                </motion.div>
              ))}
            </div>
          )}

          {!isLoading && !error && featuredCampaigns.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <p className="text-lg font-medium">No featured campaigns yet</p>
              <p className="text-muted-foreground max-w-md">
                {chainEnabled
                  ? 'Create and approve campaigns in Ganache to have them appear here.'
                  : 'Campaigns will appear here once they are available.'}
              </p>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12"
          >
            <Link to={ROUTE_PATHS.EXPLORE}>
              <Button size="lg" variant="outline">
                View All Campaigns
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section id="cta" className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={IMAGES.HERO_BG_8}
            alt="CTA background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-accent/20 to-chart-2/30" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Ready to Fund the Future of Cinema?
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Join LumiFilm today and be part of a revolutionary platform where creativity meets blockchain technology
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={ROUTE_PATHS.CREATE}>
                <Button size="lg" className="group">
                  Launch Your Campaign
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to={ROUTE_PATHS.EXPLORE}>
                <Button size="lg" variant="outline">
                  Explore Projects
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
