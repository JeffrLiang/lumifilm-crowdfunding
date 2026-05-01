import { useState } from 'react';
import { useWalletStore } from '@/lib/index';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ShieldCheck } from 'lucide-react';

export function AgeVerificationModal() {
  const { ageVerificationPending, confirmAge, cancelAgeVerification } = useWalletStore();
  const [confirmed, setConfirmed] = useState(false);

  const handleClose = () => {
    setConfirmed(false);
    cancelAgeVerification();
  };

  const handleConfirm = () => {
    if (!confirmed) return;
    setConfirmed(false);
    confirmAge();
  };

  return (
    <Dialog open={ageVerificationPending} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-md border-border/50">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-semibold text-center">
            Age Verification
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            You must be at least 18 years old to participate in LumiFilm crowdfunding campaigns.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="flex items-start gap-3 bg-muted/30 rounded-lg p-4 border border-border/30">
            <Checkbox
              id="age-confirm"
              checked={confirmed}
              onCheckedChange={(v) => setConfirmed(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="age-confirm" className="text-sm leading-relaxed cursor-pointer">
              I confirm that I am at least <span className="font-semibold text-foreground">18 years of age</span> and
              I accept responsibility for all financial activities on this platform.
            </Label>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-border/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!confirmed}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              Verify & Connect
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
