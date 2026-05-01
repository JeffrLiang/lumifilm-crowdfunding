import { useState } from 'react';
import { Campaign, useWalletStore, formatETH, LUMI_RATE, isBlockchainConfigured } from '@/lib/index';
import { txContribute, formatError } from '@/lib/blockchain';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContributeModalProps {
  campaign: Campaign;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ContributeModal({ campaign, open, onClose, onSuccess }: ContributeModalProps) {
  const { isConnected } = useWalletStore();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const chainEnabled = isBlockchainConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    setLoading(true);
    try {
      if (chainEnabled) {
        await txContribute(Number(campaign.id), amount);
      } else {
        await new Promise<void>(resolve => setTimeout(resolve, 1500));
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setAmount('');
        onClose();
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAmount('');
      setError('');
      setSuccess(false);
      onClose();
    }
  };

  const lumiPreview = (() => {
    const parsed = parseFloat(amount);
    return !isNaN(parsed) && parsed > 0 ? Math.floor(parsed * LUMI_RATE) : 0;
  })();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-md border-border/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Contribute to Campaign
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">{campaign.title}</DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!isConnected ? (
            <motion.div
              key="not-connected"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-8 text-center"
            >
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Connect your wallet to contribute</p>
              <Button onClick={handleClose} variant="outline" className="border-border/50 hover:bg-muted/50">
                Close
              </Button>
            </motion.div>

          ) : success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-8 text-center"
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-chart-3" />
              </motion.div>
              <p className="text-lg font-medium text-foreground mb-2">Transaction confirmed!</p>
              <p className="text-sm text-muted-foreground">
                Contributed {formatETH(parseFloat(amount))}
                {lumiPreview > 0 && campaign.status === 'active' && ` · eligible for ${lumiPreview} LUMI if goal is met`}
              </p>
            </motion.div>

          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="space-y-6 py-4"
            >
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-foreground">Amount (ETH)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setError(''); }}
                  disabled={loading}
                  className="bg-background/50 border-border/50 focus:border-accent font-mono text-lg"
                />
                {error && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </motion.p>
                )}
              </div>

              <div className="bg-muted/30 rounded-lg p-4 space-y-2 border border-border/30">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Campaign Goal</span>
                  <span className="font-mono text-foreground">{formatETH(campaign.goal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Funding</span>
                  <span className="font-mono text-foreground">{formatETH(campaign.current)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-mono text-accent">{formatETH(Math.max(0, campaign.goal - campaign.current))}</span>
                </div>
                {lumiPreview > 0 && (
                  <div className="flex justify-between text-sm pt-2 border-t border-border/30">
                    <span className="text-muted-foreground">LUMI reward (if goal met)</span>
                    <span className="font-mono text-chart-3">{lumiPreview} LUMI</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="flex-1 border-border/50 hover:bg-muted/50">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {chainEnabled ? 'Sending transaction…' : 'Processing…'}
                    </>
                  ) : 'Contribute'}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
