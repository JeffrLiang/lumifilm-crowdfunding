import { create } from 'zustand';
import { IMAGES } from '@/assets/images';
import { getShortDescription, normalizeCampaignDescription, normalizeCampaignTitle } from '@/lib/utils';
import {
  requestAccount,
  getCurrentAccount,
  getChainId,
  switchToGanache,
  isMetaMaskInstalled,
  isBlockchainConfigured,
  queryAdminAddress,
  queryWalletEthBalance,
  weiToEth,
  GANACHE_CHAIN_ID,
  formatError,
  type ChainCampaign,
} from '@/lib/blockchain';

export { isBlockchainConfigured };

export const ROUTE_PATHS = {
  HOME: '/',
  EXPLORE: '/explore',
  CAMPAIGN_DETAIL: '/campaign/:id',
  CREATE: '/create',
  DASHBOARD: '/dashboard',
  ADMIN: '/admin',
} as const;

export type UserRole = 'investor' | 'organiser' | 'admin';

export type CampaignStatus = 'pending' | 'active' | 'successful' | 'failed' | 'rejected';
export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface Campaign {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  creator: string;
  goal: number;
  current: number;
  deadline: string;
  status: CampaignStatus;
  image: string;
}

export interface Contribution {
  id: string;
  campaignId: string;
  campaignTitle: string;
  amount: number;
  date: string;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  walletBalanceEth: number | null;
  role: UserRole | null;
  rolePending: boolean;
  ageVerified: boolean;
  ageVerificationPending: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  confirmAge: () => void;
  cancelAgeVerification: () => void;
  setRole: (role: UserRole) => void;
  syncAccount: (address: string | null) => void;
}

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    title: 'Echoes of Tomorrow',
    description: 'A groundbreaking sci-fi thriller exploring the boundaries of time and consciousness. Set in 2086, a quantum physicist discovers a way to send messages to the past, but each transmission creates devastating ripples in the timeline. As reality begins to fracture, she must race against time itself to prevent a catastrophic paradox that could erase humanity from existence. This ambitious project combines cutting-edge visual effects with a deeply philosophical narrative about choice, consequence, and the nature of free will.',
    shortDescription: 'A quantum physicist races to prevent a timeline paradox in this mind-bending sci-fi thriller.',
    creator: '0xA3F7B92K4E8D1C5F',
    goal: 50,
    current: 42.5,
    deadline: '2026-05-30',
    status: 'active',
    image: IMAGES.CAMPAIGN_1,
  },
  {
    id: '2',
    title: 'The Last Lighthouse',
    description: 'An intimate documentary following the final lighthouse keeper in the North Atlantic as he maintains a century-old beacon in an age of GPS and automation. Through stunning cinematography and deeply personal interviews, we explore themes of tradition, solitude, and the human need for purpose in a rapidly changing world. The film captures the raw beauty of coastal storms, the meditative rhythm of daily maintenance, and the keeper\'s profound connection to maritime history.',
    shortDescription: 'Documentary about the last lighthouse keeper maintaining tradition in the modern age.',
    creator: '0x7D2E9F1A6B3C8H4K',
    goal: 30,
    current: 35.2,
    deadline: '2026-04-20',
    status: 'successful',
    image: IMAGES.CAMPAIGN_3,
  },
  {
    id: '3',
    title: 'Neon Shadows',
    description: 'A cyberpunk noir set in the rain-soaked streets of Neo-Tokyo, 2045. When a rogue AI begins manipulating the city\'s augmented reality network, a disillusioned detective with illegal neural implants must navigate a web of corporate conspiracy and digital deception. Blending practical effects with innovative AR visualization techniques, this film reimagines the detective genre for the age of artificial intelligence and ubiquitous surveillance.',
    shortDescription: 'Cyberpunk detective thriller in a world where AI controls augmented reality.',
    creator: '0x5C8B4F2D9E1A7G3H',
    goal: 75,
    current: 68.9,
    deadline: '2026-06-15',
    status: 'active',
    image: IMAGES.CAMPAIGN_4,
  },
  {
    id: '4',
    title: 'Roots & Rhythms',
    description: 'A vibrant musical documentary tracing the evolution of jazz from New Orleans to the global stage. Through archival footage, contemporary performances, and interviews with legendary musicians, we explore how this uniquely American art form became a universal language of freedom and expression. The film celebrates jazz\'s revolutionary spirit while examining its ongoing influence on modern music and culture.',
    shortDescription: 'Musical journey through jazz history from New Orleans to the world stage.',
    creator: '0x9E3A7F5B2D8C1K6H',
    goal: 40,
    current: 28.3,
    deadline: '2026-04-10',
    status: 'failed',
    image: IMAGES.CAMPAIGN_7,
  },
  {
    id: '5',
    title: 'Starbound Chronicles',
    description: 'An epic space opera following humanity\'s first generation ship on a 200-year journey to a distant star system. When the ship\'s AI begins exhibiting signs of consciousness and questioning its mission, the crew must confront fundamental questions about identity, purpose, and what it means to be alive. Featuring practical spacecraft sets combined with cutting-edge VFX, this film aims to bring hard science fiction back to cinema with emotional depth and philosophical weight.',
    shortDescription: 'Generation ship crew faces existential crisis when their AI awakens to consciousness.',
    creator: '0x2F8D5A9C3E7B1H4K',
    goal: 100,
    current: 87.6,
    deadline: '2026-07-01',
    status: 'active',
    image: IMAGES.CAMPAIGN_9,
  },
  {
    id: '6',
    title: 'Quantum Horizon',
    description: 'In the year 2095, humanity discovers a wormhole at the edge of the solar system. A diverse crew of scientists and explorers embarks on a one-way mission to explore what lies beyond, knowing they may never return. As they venture into the unknown, they encounter phenomena that challenge everything we understand about physics, consciousness, and reality itself. This hard sci-fi epic combines rigorous scientific accuracy with profound human drama.',
    shortDescription: 'One-way mission through a wormhole challenges our understanding of reality.',
    creator: '0x6B9E2F7A4D1C8H5K',
    goal: 85,
    current: 92.4,
    deadline: '2026-05-15',
    status: 'successful',
    image: IMAGES.FILM_SCIFI_7,
  },
  {
    id: '7',
    title: 'Digital Ghosts',
    description: 'A psychological thriller exploring the dark side of digital immortality. When a tech company offers to upload human consciousness into the cloud, early adopters begin experiencing disturbing glitches and fragmented memories. A neuroscientist investigating these anomalies uncovers a conspiracy that questions the very nature of identity and what happens to the soul in a digital afterlife. Shot with a mix of sterile corporate environments and surreal digital landscapes.',
    shortDescription: 'Digital immortality goes wrong as uploaded consciousnesses begin to fragment.',
    creator: '0x4D7F3A8E2B9C5H1K',
    goal: 60,
    current: 45.8,
    deadline: '2026-06-30',
    status: 'active',
    image: IMAGES.FILM_SCIFI_8,
  },
];

export const MOCK_CONTRIBUTIONS: Contribution[] = [
  {
    id: 'c1',
    campaignId: '1',
    campaignTitle: 'Echoes of Tomorrow',
    amount: 2.5,
    date: '2026-04-10',
  },
  {
    id: 'c2',
    campaignId: '3',
    campaignTitle: 'Neon Shadows',
    amount: 5.0,
    date: '2026-04-08',
  },
  {
    id: 'c3',
    campaignId: '5',
    campaignTitle: 'Starbound Chronicles',
    amount: 10.0,
    date: '2026-04-05',
  },
];

export const formatETH = (amount: number): string => {
  return `${amount.toFixed(2)} ETH`;
};

export const formatAddress = (address: string): string => {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const LUMI_RATE = 100; // 100 LUMI per ETH (1 LUMI per 0.01 ETH)

const LOYALTY_TIERS: Array<{
  tier: LoyaltyTier;
  min: number;
  nextMin: number | null;
  badge: string;
  perk: string;
}> = [
  { tier: 'Bronze', min: 0, nextMin: 100, badge: 'Rising Backer', perk: 'Supporter recognition across the platform' },
  { tier: 'Silver', min: 100, nextMin: 500, badge: 'Film Patron', perk: 'Priority access to supporter-only updates' },
  { tier: 'Gold', min: 500, nextMin: 1000, badge: 'Producer Circle', perk: 'Early access perks for featured campaigns' },
  { tier: 'Platinum', min: 1000, nextMin: null, badge: 'Lumi Vanguard', perk: 'Top-tier recognition and future VIP perks' },
];

export function getLoyaltyTier(lumiBalance: number): LoyaltyTier {
  const match = [...LOYALTY_TIERS].reverse().find(tier => lumiBalance >= tier.min);
  return match?.tier ?? 'Bronze';
}

export function getLoyaltySummary(lumiBalance: number) {
  const current = [...LOYALTY_TIERS].reverse().find(tier => lumiBalance >= tier.min) ?? LOYALTY_TIERS[0];
  const progress = current.nextMin === null
    ? 100
    : Math.min(100, Math.max(0, ((lumiBalance - current.min) / (current.nextMin - current.min)) * 100));

  return {
    tier: current.tier,
    badge: current.badge,
    perk: current.perk,
    currentMin: current.min,
    nextMin: current.nextMin,
    progress,
    lumiToNextTier: current.nextMin === null ? 0 : Math.max(0, current.nextMin - lumiBalance),
  };
}

export const getDaysLeft = (deadline: string, nowSeconds?: number): number => {
  const nowMs = nowSeconds !== undefined ? nowSeconds * 1000 : Date.now();
  const endMs = new Date(deadline).getTime();
  const days = Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
};

export const getStatusColor = (status: CampaignStatus): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
    case 'active':
      return 'bg-accent/20 text-accent border-accent/40';
    case 'successful':
      return 'bg-chart-3/20 text-chart-3 border-chart-3/40';
    case 'failed':
      return 'bg-destructive/20 text-destructive border-destructive/40';
    case 'rejected':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
    default:
      return 'bg-muted/20 text-muted-foreground border-muted/40';
  }
};

export const getStatusLabel = (status: CampaignStatus): string => {
  switch (status) {
    case 'pending':
      return 'Pending Approval';
    case 'active':
      return 'Active';
    case 'successful':
      return 'Goal Reached';
    case 'failed':
      return 'Funding Failed';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Unknown';
  }
};

async function detectRole(address: string): Promise<UserRole | null> {
  if (!isBlockchainConfigured()) return null;
  try {
    const adminAddr = await queryAdminAddress();
    if (address.toLowerCase() === adminAddr.toLowerCase()) return 'admin';
  } catch { /* ignore */ }
  return null;
}

async function readWalletBalance(address: string): Promise<number | null> {
  if (!isMetaMaskInstalled()) return null;
  try {
    return weiToEth(await queryWalletEthBalance(address));
  } catch {
    return null;
  }
}

async function buildWalletSession(address: string, chainId: number): Promise<{
  address: string;
  chainId: number;
  role: UserRole | null;
  walletBalanceEth: number | null;
}> {
  const [role, walletBalanceEth] = await Promise.all([
    detectRole(address),
    readWalletBalance(address),
  ]);

  return { address, chainId, role, walletBalanceEth };
}

async function doConnect(): Promise<{ address: string; chainId: number; role: UserRole | null; walletBalanceEth: number | null }> {
  if (!isMetaMaskInstalled()) {
    return { address: '0xDemoUser000000000000000000000000000000', chainId: GANACHE_CHAIN_ID, role: null, walletBalanceEth: null };
  }
  const address = await requestAccount();
  let chainId = await getChainId();
  if (chainId !== GANACHE_CHAIN_ID) {
    await switchToGanache();
    chainId = await getChainId();
  }
  return buildWalletSession(address, chainId);
}

export const useWalletStore = create<WalletState>((set, get) => ({
  isConnected: false,
  address: null,
  chainId: null,
  walletBalanceEth: null,
  role: null,
  rolePending: false,
  ageVerified: false,
  ageVerificationPending: false,
  isConnecting: false,
  error: null,
  connect: () => {
    if (!get().ageVerified) {
      set({ ageVerificationPending: true });
      return;
    }
    set({ isConnecting: true, error: null });
    doConnect()
      .then(({ address, chainId, role, walletBalanceEth }) =>
        set({ isConnected: true, address, chainId, walletBalanceEth, isConnecting: false, role, rolePending: role === null }))
      .catch((err: unknown) => set({ isConnecting: false, error: formatError(err) }));
  },
  disconnect: () => set({ isConnected: false, address: null, chainId: null, walletBalanceEth: null, error: null, role: null, rolePending: false }),
  confirmAge: () => {
    set({ ageVerified: true, ageVerificationPending: false, isConnecting: true, error: null });
    doConnect()
      .then(({ address, chainId, role, walletBalanceEth }) =>
        set({ isConnected: true, address, chainId, walletBalanceEth, isConnecting: false, role, rolePending: role === null }))
      .catch((err: unknown) => set({ isConnecting: false, error: formatError(err) }));
  },
  cancelAgeVerification: () => set({ ageVerificationPending: false }),
  setRole: (role: UserRole) => set({ role, rolePending: false }),
  syncAccount: (address: string | null) => {
    if (!address) {
      set({ isConnected: false, address: null, chainId: null, walletBalanceEth: null, role: null, rolePending: false });
    } else {
      Promise.all([getCurrentAccount(), getChainId().catch(() => null)]).then(([current, chainId]) => {
        if (current) {
          buildWalletSession(current, chainId ?? GANACHE_CHAIN_ID).then(({ role, walletBalanceEth }) => {
            set({
              isConnected: true,
              address: current,
              chainId: chainId ?? GANACHE_CHAIN_ID,
              walletBalanceEth,
              role,
              rolePending: role === null,
            });
          }).catch(() => {
            set({
              isConnected: true,
              address: current,
              chainId: chainId ?? GANACHE_CHAIN_ID,
              walletBalanceEth: null,
              role: null,
              rolePending: true,
            });
          });
        } else {
          set({ isConnected: false, address: null, chainId: null, walletBalanceEth: null, role: null, rolePending: false });
        }
      });
    }
  },
}));

// ── ChainCampaign → Campaign converter ───────────────────────────

const CAMPAIGN_IMAGES = [
  IMAGES.CAMPAIGN_1, IMAGES.CAMPAIGN_2, IMAGES.CAMPAIGN_3, IMAGES.CAMPAIGN_4,
  IMAGES.CAMPAIGN_5, IMAGES.CAMPAIGN_6, IMAGES.CAMPAIGN_7, IMAGES.CAMPAIGN_8,
  IMAGES.CAMPAIGN_9, IMAGES.FILM_SCIFI_1, IMAGES.FILM_SCIFI_7, IMAGES.FILM_SCIFI_8,
];

export function getImageForCampaign(id: number): string {
  return CAMPAIGN_IMAGES[(id - 1) % CAMPAIGN_IMAGES.length];
}

export function chainToFrontend(c: ChainCampaign): Campaign {
  const goal = weiToEth(c.goalWei);
  const current = weiToEth(c.raisedWei);
  const description = normalizeCampaignDescription(c.description);
  const shortDescription = getShortDescription(description);
  return {
    id: String(c.id),
    title: normalizeCampaignTitle(c.title),
    description,
    shortDescription,
    creator: c.creator,
    goal,
    current,
    deadline: new Date(c.deadline * 1000).toISOString().split('T')[0],
    status: c.status,
    image: getImageForCampaign(c.id),
  };
}
