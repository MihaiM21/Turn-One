
import { Gift, Star, Crown} from 'lucide-react';
export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'boost' | 'unlock' | 'cosmetic' | 'prediction-pack' | 'token-pack';
  icon: any;
  color: string;
  borderColor: string;
  benefit: string;
  duration?: string;
  available: boolean;
  popular?: boolean;
  tokenAmount?: number;
}
export const storeItems: StoreItem[] = [
    // Free Starter Pack
    {
      id: 'starter-pack-free',
      name: 'Welcome Starter Pack',
      description: 'Free welcome gift for new players - claim once to get started!',
      price: 0,
      type: 'token-pack',
      icon: Gift,
      color: 'from-primary/5 to-primary/10',
      borderColor: 'border-primary/20',
      benefit: '50 Tokens + 500 Coins',
      tokenAmount: 50,
      available: true,
      popular: true
    },
    // Token Packs
    {
      id: 'tokens-small',
      name: '10 Tokens',
      description: 'Small token pack for quick top-ups',
      price: 500,
      type: 'token-pack',
      icon: Star,
      color: 'from-primary/5 to-primary/10',
      borderColor: 'border-primary/20',
      benefit: '10 Tokens',
      tokenAmount: 10,
      available: true
    },
    {
      id: 'tokens-medium',
      name: '25 Tokens',
      description: 'Popular choice - best value for regular users',
      price: 1000,
      type: 'token-pack',
      icon: Star,
      color: 'from-primary/5 to-primary/10',
      borderColor: 'border-primary/20',
      benefit: '25 Tokens',
      tokenAmount: 25,
      available: true,
      popular: true
    },
    {
      id: 'tokens-large',
      name: '60 Tokens',
      description: 'Great for power users - 20% bonus tokens included',
      price: 2000,
      type: 'token-pack',
      icon: Star,
      color: 'from-primary/5 to-primary/10',
      borderColor: 'border-primary/20',
      benefit: '60 Tokens (20% Bonus)',
      tokenAmount: 60,
      available: true
    },
    {
      id: 'tokens-mega',
      name: '150 Tokens',
      description: 'Ultimate pack - 50% bonus tokens, best deal!',
      price: 4000,
      type: 'token-pack',
      icon: Crown,
      color: 'from-primary/5 to-primary/10',
      borderColor: 'border-primary/20',
      benefit: '150 Tokens (50% Bonus)',
      tokenAmount: 150,
      available: true,
      popular: true
    }
  ];