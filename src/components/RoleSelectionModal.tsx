import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Film, Shield } from 'lucide-react';
import { useWalletStore, type UserRole } from '@/lib/index';

export function RoleSelectionModal() {
  const { rolePending, setRole } = useWalletStore();

  const roles: { value: Exclude<UserRole, 'admin'>; icon: React.ReactNode; title: string; description: string }[] = [
    {
      value: 'investor',
      icon: <TrendingUp className="w-8 h-8 text-accent" />,
      title: 'Investor',
      description: 'Browse and fund film campaigns. Earn LUMI tokens and claim refunds if goals are not met.',
    },
    {
      value: 'organiser',
      icon: <Film className="w-8 h-8 text-primary" />,
      title: 'Campaign Organiser',
      description: 'Create and manage film crowdfunding campaigns. Submit them for admin review and withdraw funds on success.',
    },
  ];

  return (
    <AnimatePresence>
      {rolePending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 px-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-card border border-border/50 rounded-2xl p-8 max-w-lg w-full shadow-2xl"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Choose Your Role
              </h2>
              <p className="text-muted-foreground text-sm">
                Select how you'd like to use LumiFilm. You can always start over by disconnecting.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {roles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setRole(role.value)}
                  className="group p-6 rounded-xl border border-border/50 bg-background/50 hover:border-primary/60 hover:bg-primary/5 transition-all duration-200 text-left"
                >
                  <div className="mb-3">{role.icon}</div>
                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {role.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{role.description}</p>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
