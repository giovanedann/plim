import {
  Activity,
  Apple,
  Backpack,
  Banknote,
  Bed,
  Bike,
  Book,
  BookOpen,
  // Work & Office
  Briefcase,
  Building,
  Building2,
  Bus,
  Camera,
  // Transport
  Car,
  Coffee,
  CookingPot,
  CreditCard,
  Dumbbell,
  // Other & General
  Ellipsis,
  Film,
  Fuel,
  // Entertainment & Leisure
  Gamepad2,
  Gift,
  // Education
  GraduationCap,
  Headphones,
  Heart,
  // Health & Wellness
  HeartPulse,
  // Housing
  Home,
  Key,
  Lamp,
  Laptop,
  type LucideIcon,
  Mail,
  Monitor,
  Music,
  Pen,
  Percent,
  Phone,
  PiggyBank,
  Pill,
  Pizza,
  Plane,
  Receipt,
  Shirt,
  // Shopping
  ShoppingBag,
  ShoppingCart,
  Smile,
  Sofa,
  Sparkles,
  Star,
  Stethoscope,
  Tag,
  Train,
  TrendingUp,
  Tv,
  // Food & Dining
  Utensils,
  // Finance
  Wallet,
  Wine,
  Zap,
} from 'lucide-react'

/**
 * Centralized, type-safe icon mapping for expense categories.
 * Icons are grouped by category type for easier browsing in the icon picker.
 */
export const CATEGORY_ICONS = {
  // Food & Dining
  utensils: Utensils,
  'cooking-pot': CookingPot,
  coffee: Coffee,
  pizza: Pizza,
  apple: Apple,
  wine: Wine,
  // Transport
  car: Car,
  bus: Bus,
  train: Train,
  plane: Plane,
  bike: Bike,
  fuel: Fuel,
  // Housing
  home: Home,
  building: Building,
  bed: Bed,
  lamp: Lamp,
  sofa: Sofa,
  key: Key,
  // Health & Wellness
  'heart-pulse': HeartPulse,
  pill: Pill,
  stethoscope: Stethoscope,
  dumbbell: Dumbbell,
  activity: Activity,
  // Entertainment & Leisure
  'gamepad-2': Gamepad2,
  music: Music,
  film: Film,
  tv: Tv,
  headphones: Headphones,
  camera: Camera,
  // Education
  'graduation-cap': GraduationCap,
  book: Book,
  'book-open': BookOpen,
  pen: Pen,
  backpack: Backpack,
  // Shopping
  'shopping-bag': ShoppingBag,
  'shopping-cart': ShoppingCart,
  gift: Gift,
  tag: Tag,
  percent: Percent,
  shirt: Shirt,
  // Finance
  wallet: Wallet,
  'credit-card': CreditCard,
  'piggy-bank': PiggyBank,
  'trending-up': TrendingUp,
  banknote: Banknote,
  receipt: Receipt,
  // Work & Office
  briefcase: Briefcase,
  laptop: Laptop,
  monitor: Monitor,
  phone: Phone,
  mail: Mail,
  'building-2': Building2,
  // Other & General
  ellipsis: Ellipsis,
  star: Star,
  heart: Heart,
  smile: Smile,
  zap: Zap,
  sparkles: Sparkles,
} as const satisfies Record<string, LucideIcon>

/**
 * Type representing valid category icon names.
 */
export type CategoryIconName = keyof typeof CATEGORY_ICONS

/**
 * Array of all available icon names for iteration (e.g., in icon pickers).
 */
export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS) as CategoryIconName[]

/**
 * Icons grouped by category for organized display in pickers.
 */
export const CATEGORY_ICON_GROUPS = {
  Alimentação: ['utensils', 'cooking-pot', 'coffee', 'pizza', 'apple', 'wine'],
  Transporte: ['car', 'bus', 'train', 'plane', 'bike', 'fuel'],
  Moradia: ['home', 'building', 'bed', 'lamp', 'sofa', 'key'],
  Saúde: ['heart-pulse', 'pill', 'stethoscope', 'dumbbell', 'activity'],
  Lazer: ['gamepad-2', 'music', 'film', 'tv', 'headphones', 'camera'],
  Educação: ['graduation-cap', 'book', 'book-open', 'pen', 'backpack'],
  Compras: ['shopping-bag', 'shopping-cart', 'gift', 'tag', 'percent', 'shirt'],
  Finanças: ['wallet', 'credit-card', 'piggy-bank', 'trending-up', 'banknote', 'receipt'],
  Trabalho: ['briefcase', 'laptop', 'monitor', 'phone', 'mail', 'building-2'],
  Outros: ['ellipsis', 'star', 'heart', 'smile', 'zap', 'sparkles'],
} as const satisfies Record<string, readonly CategoryIconName[]>

/**
 * Helper to get icon component by name with type safety.
 * Returns undefined if icon name is not found.
 */
export function getCategoryIcon(name: string | null | undefined): LucideIcon | undefined {
  if (!name) return undefined
  return CATEGORY_ICONS[name as CategoryIconName]
}
