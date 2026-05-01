import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { Campaign, formatETH, getDaysLeft, getStatusColor, getStatusLabel } from '@/lib/index';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useBlockTimestamp } from '@/hooks/use-block-timestamp';

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const blockTimestamp = useBlockTimestamp();
  const progress = (campaign.current / campaign.goal) * 100;
  const daysLeft = getDaysLeft(campaign.deadline, blockTimestamp);
  const statusColor = getStatusColor(campaign.status);
  const statusLabel = getStatusLabel(campaign.status);

  return (
    <Link to={`/campaign/${campaign.id}`} className="block">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="h-full"
      >
        <Card className="h-full overflow-hidden bg-card/60 backdrop-blur-md border-border/40 hover:border-accent/60 transition-all duration-300 group">
          <div className="relative aspect-video overflow-hidden">
            <img
              src={campaign.image}
              alt={campaign.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60" />
            <Badge
              className={`absolute top-4 right-4 ${statusColor} border backdrop-blur-sm font-mono text-xs`}
            >
              {statusLabel}
            </Badge>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2 line-clamp-1 break-all group-hover:text-accent transition-colors">
                {campaign.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 break-all">
                {campaign.shortDescription}
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Progress
                  value={progress}
                  className="h-2 bg-muted/40"
                />
                <div
                  className="absolute inset-0 h-2 rounded-full opacity-50 blur-md"
                  style={{
                    background: `linear-gradient(90deg, var(--primary), var(--accent))`,
                    width: `${Math.min(progress, 100)}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-mono text-foreground font-semibold">
                    {formatETH(campaign.current)}
                  </span>
                  <span className="text-muted-foreground"> / {formatETH(campaign.goal)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono text-xs">
                    {daysLeft > 0 ? `${daysLeft}d left` : 'Ended'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border/40">
              <p className="text-xs text-muted-foreground font-mono">
                by {campaign.creator.slice(0, 6)}...{campaign.creator.slice(-4)}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}
