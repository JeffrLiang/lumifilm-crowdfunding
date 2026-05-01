import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Calendar, DollarSign, FileText, Sparkles, Wallet, Loader2, ShieldAlert } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { useWalletStore, isBlockchainConfigured, ROUTE_PATHS } from '@/lib/index';
import { txCreateCampaign, formatError } from '@/lib/blockchain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { normalizeCampaignDescription, normalizeCampaignTitle } from '@/lib/utils';

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { isConnected, connect, role } = useWalletStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const chainEnabled = isBlockchainConfigured();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal: '',
    deadline: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (data = formData) => {
    const newErrors: Record<string, string> = {};
    const normalizedTitle = normalizeCampaignTitle(data.title);
    const normalizedDescription = normalizeCampaignDescription(data.description);

    if (!normalizedTitle) {
      newErrors.title = 'Campaign title is required';
    } else if (normalizedTitle.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!normalizedDescription) {
      newErrors.description = 'Description is required';
    } else if (normalizedDescription.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }

    if (!data.goal) {
      newErrors.goal = 'Funding goal is required';
    } else if (parseFloat(data.goal) <= 0) {
      newErrors.goal = 'Goal must be greater than 0';
    }

    if (!data.deadline) {
      newErrors.deadline = 'Deadline is required';
    } else {
      const selectedDate = new Date(data.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate <= today) {
        newErrors.deadline = 'Deadline must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedTitle = normalizeCampaignTitle(formData.title);
    const normalizedDescription = normalizeCampaignDescription(formData.description);
    const sanitizedFormData = {
      ...formData,
      title: normalizedTitle,
      description: normalizedDescription,
    };

    setFormData(sanitizedFormData);

    if (!validateForm(sanitizedFormData)) return;

    setIsSubmitting(true);
    setTxError(null);

    try {
      if (chainEnabled) {
        const newId = await txCreateCampaign(
          sanitizedFormData.title,
          sanitizedFormData.description,
          sanitizedFormData.goal,
          sanitizedFormData.deadline,
        );
        setShowSuccess(true);
        setTimeout(() => {
          navigate(newId ? `/campaign/${newId}` : ROUTE_PATHS.EXPLORE);
        }, 2000);
      } else {
        await new Promise<void>(resolve => setTimeout(resolve, 1500));
        setShowSuccess(true);
        setTimeout(() => navigate(ROUTE_PATHS.EXPLORE), 2500);
      }
    } catch (err) {
      setTxError(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const minDeadline = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  if (!isConnected) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4 py-24">
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
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Wallet Connection Required
            </h1>
            <p className="text-muted-foreground mb-8 text-lg">
              Please connect your wallet to create a campaign and start your filmmaking journey.
            </p>
            <Button
              onClick={connect}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Connect Wallet (Demo)
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  if (role === 'investor') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-md"
          >
            <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center">
                <ShieldAlert className="w-12 h-12 text-muted-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4">Organisers Only</h1>
            <p className="text-muted-foreground mb-8 text-lg">
              Creating campaigns is reserved for Campaign Organisers. You're currently signed in as an Investor.
            </p>
            <p className="text-sm text-muted-foreground">
              To switch roles, disconnect your wallet and reconnect to select <strong>Campaign Organiser</strong>.
            </p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen px-4 py-24">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Create Your Campaign
              </h1>
              <p className="text-muted-foreground text-lg">
                Bring your film vision to life with decentralized crowdfunding
              </p>
            </div>

            <Card className="bg-card/60 backdrop-blur-md border-border/50 p-8 shadow-lg">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base flex items-center gap-2">
                    <Film className="w-4 h-4 text-accent" />
                    Campaign Title
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Enter your film title"
                    className="bg-background/50 border-border/50 focus:border-accent transition-colors"
                  />
                  <p className="text-xs text-muted-foreground">
                    Extra spacing is cleaned when you submit, so the saved title stays tidy.
                  </p>
                  {errors.title && (
                    <p className="text-destructive text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-accent" />
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe your film project, story, and vision..."
                    rows={6}
                    className="bg-background/50 border-border/50 focus:border-accent transition-colors resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter and spacing are preserved while typing, then cleaned on submit so the saved description displays neatly.
                  </p>
                  {errors.description && (
                    <p className="text-destructive text-sm mt-1">{errors.description}</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="goal" className="text-base flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-accent" />
                      Funding Goal (ETH)
                    </Label>
                    <Input
                      id="goal"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.goal}
                      onChange={(e) => handleChange('goal', e.target.value)}
                      placeholder="0.00"
                      className="bg-background/50 border-border/50 focus:border-accent transition-colors"
                    />
                    {errors.goal && (
                      <p className="text-destructive text-sm mt-1">{errors.goal}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline" className="text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-accent" />
                      Deadline
                    </Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => handleChange('deadline', e.target.value)}
                      min={minDeadline}
                      className="bg-background/50 border-border/50 focus:border-accent transition-colors"
                    />
                    {errors.deadline && (
                      <p className="text-destructive text-sm mt-1">{errors.deadline}</p>
                    )}
                  </div>
                </div>

                {txError && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3 border border-destructive/30">
                    {txError}
                  </p>
                )}

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg py-6"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {chainEnabled ? 'Sending to Ganache…' : 'Creating campaign…'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Create Campaign
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-card border border-border/50 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', damping: 15, stiffness: 300 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-chart-3 to-accent flex items-center justify-center"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-chart-3 to-accent bg-clip-text text-transparent">
                Success!
              </h2>
              <p className="text-muted-foreground text-lg mb-2">
                Campaign submitted!
              </p>
              <p className="text-sm text-muted-foreground">
                {chainEnabled ? 'Awaiting admin approval before going live.' : '(Demo mode)'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
