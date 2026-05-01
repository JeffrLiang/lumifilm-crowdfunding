import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWalletStore, formatAddress, getLoyaltySummary, ROUTE_PATHS } from '@/lib/index';
import { isBlockchainConfigured, queryLumiBalance, queryWalletEthBalance, weiToEth } from '@/lib/blockchain';
import { AgeVerificationModal } from '@/components/AgeVerificationModal';
import { motion, AnimatePresence } from 'framer-motion';
import { formatEther } from 'ethers';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isConnected, address, walletBalanceEth, role, connect, disconnect } = useWalletStore();
  const location = useLocation();
  const chainEnabled = isBlockchainConfigured();

  const { data: lumiWei = 0n } = useQuery({
    queryKey: ['lumiBalance', address],
    queryFn: () => queryLumiBalance(address!),
    enabled: chainEnabled && isConnected && !!address,
    staleTime: 30_000,
  });

  const { data: walletBalanceWei } = useQuery({
    queryKey: ['walletBalance', address],
    queryFn: () => queryWalletEthBalance(address!),
    enabled: chainEnabled && isConnected && !!address,
    staleTime: 5_000,
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
  });

  const navLinks = [
    { label: 'Home', path: ROUTE_PATHS.HOME },
    { label: 'Explore', path: ROUTE_PATHS.EXPLORE },
    ...(role === 'organiser' || role === 'admin' ? [{ label: 'Create Campaign', path: ROUTE_PATHS.CREATE }] : []),
    { label: 'Dashboard', path: ROUTE_PATHS.DASHBOARD },
    ...(role === 'admin' ? [{ label: 'Admin', path: ROUTE_PATHS.ADMIN }] : []),
  ];

  const roleBadgeStyle = role === 'admin'
    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
    : role === 'organiser'
    ? 'bg-primary/20 text-primary border-primary/40'
    : 'bg-accent/20 text-accent border-accent/40';

  const roleLabel = role === 'admin' ? 'Admin' : role === 'organiser' ? 'Organiser' : role === 'investor' ? 'Investor' : null;

  const isActive = (path: string) => {
    if (path === ROUTE_PATHS.HOME) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const liveWalletBalanceEth = walletBalanceWei !== undefined
    ? weiToEth(walletBalanceWei)
    : walletBalanceEth;
  const walletBalanceLabel = liveWalletBalanceEth === null ? null : `${liveWalletBalanceEth.toFixed(4)} ETH`;
  const lumiBalance = parseFloat(formatEther(lumiWei));
  const loyalty = getLoyaltySummary(lumiBalance);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={ROUTE_PATHS.HOME} className="flex items-center">
            <span className="text-2xl font-bold text-primary" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              LumiFilm
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.path) ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isConnected ? (
              <div className="flex items-center gap-3">
                {roleLabel && (
                  <Badge className={`text-xs border ${roleBadgeStyle}`}>{roleLabel}</Badge>
                )}
                {chainEnabled && (
                  <Badge variant="outline" className="text-xs border-chart-3/40 text-chart-3 bg-chart-3/10">
                    {loyalty.tier}
                  </Badge>
                )}
                <div className="flex flex-col items-end leading-tight">
                  {walletBalanceLabel && (
                    <span className="text-xs font-medium text-foreground">{walletBalanceLabel}</span>
                  )}
                  {chainEnabled && (
                    <span className="text-[11px] text-chart-3">{loyalty.badge}</span>
                  )}
                  <span className="text-sm font-mono text-muted-foreground">
                    {formatAddress(address!)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnect}
                  className="border-border/60 hover:border-primary/60"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={connect}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              >
                Connect Wallet (Demo)
              </Button>
            )}
          </div>

          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-border/40 bg-card/95 backdrop-blur-md"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive(link.path) ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-2 border-t border-border/40">
                  {isConnected ? (
                    <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      {roleLabel && (
                        <Badge className={`text-xs border ${roleBadgeStyle}`}>{roleLabel}</Badge>
                      )}
                      {chainEnabled && (
                        <Badge variant="outline" className="text-xs border-chart-3/40 text-chart-3 bg-chart-3/10">
                          {loyalty.tier}
                        </Badge>
                      )}
                      <div className="flex flex-col leading-tight">
                        {walletBalanceLabel && (
                          <span className="text-xs font-medium text-foreground">{walletBalanceLabel}</span>
                        )}
                        {chainEnabled && (
                          <span className="text-[11px] text-chart-3">{loyalty.badge}</span>
                        )}
                        <span className="text-sm font-mono text-muted-foreground">
                          {formatAddress(address!)}
                        </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          disconnect();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full border-border/60 hover:border-primary/60"
                      >
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        connect();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                    >
                      Connect Wallet (Demo)
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AgeVerificationModal />
      <main className="flex-1 pt-16">{children}</main>

      <footer className="border-t border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold text-primary mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                LumiFilm
              </h3>
              <p className="text-sm text-muted-foreground">
                Decentralized film crowdfunding platform powered by blockchain technology.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Platform</h4>
              <ul className="space-y-2">
                <li>
                  <Link to={ROUTE_PATHS.EXPLORE} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Explore Campaigns
                  </Link>
                </li>
                <li>
                  <Link to={ROUTE_PATHS.CREATE} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Start a Campaign
                  </Link>
                </li>
                <li>
                  <Link to={ROUTE_PATHS.DASHBOARD} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">About</h4>
              <p className="text-sm text-muted-foreground">
                LumiFilm brings transparency and decentralization to film crowdfunding, empowering creators and supporters alike.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/40 text-center">
            <p className="text-sm text-muted-foreground">
              © 2026 LumiFilm. All rights reserved. Demo platform for educational purposes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
