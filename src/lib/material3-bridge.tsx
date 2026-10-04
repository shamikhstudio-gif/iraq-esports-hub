import React, { forwardRef } from 'react';
import { Icon, IconProps } from '@/components/ui/Icon';

export interface LucideProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
  fill?: string;
  filled?: boolean;
}

export type LucideIcon = React.ForwardRefExoticComponent<LucideProps & React.RefAttributes<HTMLSpanElement>>;

function parseSize(className?: string, explicitSize?: number | string): { size?: number | string; width?: string; height?: string } {
  if (explicitSize !== undefined) {
    const s = typeof explicitSize === 'number' ? `${explicitSize}px` : explicitSize;
    return { size: explicitSize, width: s, height: s };
  }
  if (!className) return {};

  const match = className.match(/\b(w-[\d.]+|h-[\d.]+)\b/);
  if (match) {
    const classToPx: Record<string, number> = {
      'w-2.5': 10, 'h-2.5': 10,
      'w-3': 12, 'h-3': 12,
      'w-3.5': 14, 'h-3.5': 14,
      'w-4': 16, 'h-4': 16,
      'w-5': 20, 'h-5': 20,
      'w-6': 24, 'h-6': 24,
      'w-7': 28, 'h-7': 28,
      'w-8': 32, 'h-8': 32,
      'w-9': 36, 'h-9': 36,
      'w-10': 40, 'h-10': 40,
      'w-12': 48, 'h-12': 48,
    };
    for (const [cls, px] of Object.entries(classToPx)) {
      if (className.includes(cls)) {
        return { size: px, width: `${px}px`, height: `${px}px` };
      }
    }
  }
  return {};
}

function createMaterialBridgeIcon(
  symbolName: string,
  defaultFilled = false,
  extraClass = ''
): LucideIcon {
  const Component = forwardRef<HTMLSpanElement, LucideProps>(
    ({ size, color, strokeWidth, className = '', style, ...props }, ref) => {
      const { size: computedSize, width, height } = parseSize(className, size);
      const computedWeight = strokeWidth === 1 ? 300 : strokeWidth && strokeWidth >= 2.5 ? 600 : 400;
      const combinedClass = extraClass ? `${extraClass} ${className}`.trim() : className;

      const dynamicStyle: React.CSSProperties = {
        ...(color ? { color } : {}),
        ...(width ? { width, height, minWidth: width, minHeight: height } : {}),
        ...style,
      };

      const isExplicitlyFilled = (props as any).filled !== undefined
        ? Boolean((props as any).filled)
        : (props as any).fill !== undefined
          ? (props as any).fill !== 'none' && (props as any).fill !== 'transparent'
          : className.includes('fill-white') || className.includes('fill-current') || (className.includes('fill-') && !className.includes('fill-none') && !className.includes('fill-transparent')) || defaultFilled;

      return (
        <Icon
          ref={ref}
          name={symbolName}
          size={computedSize}
          filled={isExplicitlyFilled}
          weight={computedWeight}
          className={combinedClass}
          style={dynamicStyle}
          {...props}
        />
      );
    }
  );

  Component.displayName = `MaterialBridge(${symbolName})`;
  return Component;
}

export const Activity = createMaterialBridgeIcon('query_stats', false, '');
export const AlertCircle = createMaterialBridgeIcon('error', false, '');
export const AlertTriangle = createMaterialBridgeIcon('warning', false, '');
export const ArrowLeft = createMaterialBridgeIcon('arrow_back', false, '');
export const ArrowRight = createMaterialBridgeIcon('arrow_forward', false, '');
export const ArrowUpRight = createMaterialBridgeIcon('arrow_outward', false, '');
export const ArrowDown = createMaterialBridgeIcon('arrow_downward', false, '');
export const ArrowUp = createMaterialBridgeIcon('arrow_upward', false, '');
export const Bug = createMaterialBridgeIcon('bug_report', false, '');
export const Lightbulb = createMaterialBridgeIcon('lightbulb', false, '');
export const MessageSquarePlus = createMaterialBridgeIcon('add_comment', false, '');
export const Gauge = createMaterialBridgeIcon('speed', false, '');
export const Grid = createMaterialBridgeIcon('grid_view', false, '');
export const Layers = createMaterialBridgeIcon('layers', false, '');
export const RotateCcw = createMaterialBridgeIcon('restart_alt', false, '');
export const Sliders = createMaterialBridgeIcon('tune', false, '');
export const Terminal = createMaterialBridgeIcon('terminal', false, '');
export const Ban = createMaterialBridgeIcon('block', false, '');
export const Bell = createMaterialBridgeIcon('notifications', false, '');
export const Calendar = createMaterialBridgeIcon('calendar_today', false, '');
export const CalendarCheck = createMaterialBridgeIcon('event_available', false, '');
export const Camera = createMaterialBridgeIcon('photo_camera', false, '');
export const Check = createMaterialBridgeIcon('check', false, '');
export const CheckCheck = createMaterialBridgeIcon('done_all', false, '');
export const CheckCircle = createMaterialBridgeIcon('check_circle', false, '');
export const CheckCircle2 = createMaterialBridgeIcon('check_circle', true, '');
export const ChevronDown = createMaterialBridgeIcon('expand_more', false, '');
export const ChevronLeft = createMaterialBridgeIcon('chevron_left', false, '');
export const ChevronRight = createMaterialBridgeIcon('chevron_right', false, '');
export const Clock = createMaterialBridgeIcon('schedule', false, '');
export const Coins = createMaterialBridgeIcon('monetization_on', false, '');
export const Copy = createMaterialBridgeIcon('content_copy', false, '');
export const CornerDownLeft = createMaterialBridgeIcon('reply', false, '');
export const Crown = createMaterialBridgeIcon('crown', true, '');
export const Edit2 = createMaterialBridgeIcon('edit', false, '');
export const Edit3 = createMaterialBridgeIcon('edit', false, '');
export const ExternalLink = createMaterialBridgeIcon('open_in_new', false, '');
export const Eye = createMaterialBridgeIcon('visibility', false, '');
export const EyeOff = createMaterialBridgeIcon('visibility_off', false, '');
export const FileCheck2 = createMaterialBridgeIcon('task', false, '');
export const FileText = createMaterialBridgeIcon('description', false, '');
export const Filter = createMaterialBridgeIcon('filter_list', false, '');
export const Fingerprint = createMaterialBridgeIcon('fingerprint', false, '');
export const Flame = createMaterialBridgeIcon('local_fire_department', true, '');
export const Gamepad2 = createMaterialBridgeIcon('sports_esports', false, '');
export const Gift = createMaterialBridgeIcon('featured_seasonal_and_gifts', true, '');
export const Globe = createMaterialBridgeIcon('public', false, '');
export const Globe2 = createMaterialBridgeIcon('language', false, '');
export const Heart = createMaterialBridgeIcon('favorite', false, '');
export const HelpCircle = createMaterialBridgeIcon('help', false, '');
export const Home = createMaterialBridgeIcon('home', false, '');
export const Image = createMaterialBridgeIcon('image', false, '');
export const ImageIcon = createMaterialBridgeIcon('image', false, '');
export const Key = createMaterialBridgeIcon('key', false, '');
export const KeyRound = createMaterialBridgeIcon('vpn_key', false, '');
export const Laptop = createMaterialBridgeIcon('laptop', false, '');
export const Link2 = createMaterialBridgeIcon('link', false, '');
export const Loader2 = createMaterialBridgeIcon('progress_activity', false, 'animate-spin');
export const Lock = createMaterialBridgeIcon('lock', false, '');
export const LogOut = createMaterialBridgeIcon('logout', false, '');
export const Mail = createMaterialBridgeIcon('mail', false, '');
export const MapPin = createMaterialBridgeIcon('location_on', false, '');
export const Medal = createMaterialBridgeIcon('military_tech', true, '');
export const Megaphone = createMaterialBridgeIcon('campaign', false, '');
export const Menu = createMaterialBridgeIcon('menu', false, '');
export const MessageCircle = createMaterialBridgeIcon('chat_bubble', false, '');
export const MessageSquare = createMaterialBridgeIcon('chat', false, '');
export const Mic = createMaterialBridgeIcon('mic', false, '');
export const Minus = createMaterialBridgeIcon('remove', false, '');
export const MoreHorizontal = createMaterialBridgeIcon('more_horiz', false, '');
export const Moon = createMaterialBridgeIcon('dark_mode', false, '');
export const Monitor = createMaterialBridgeIcon('monitor', false, '');
export const Package = createMaterialBridgeIcon('inventory_2', false, '');
export const Palette = createMaterialBridgeIcon('palette', false, '');
export const Pipette = createMaterialBridgeIcon('colorize', false, '');
export const Play = createMaterialBridgeIcon('play_arrow', true, '');
export const Plus = createMaterialBridgeIcon('add', false, '');
export const PlusSquare = createMaterialBridgeIcon('add_box', false, '');
export const Radio = createMaterialBridgeIcon('sensors', false, '');
export const RefreshCw = createMaterialBridgeIcon('refresh', false, '');
export const Target = createMaterialBridgeIcon('adjust', false, '');
export const Circle = createMaterialBridgeIcon('circle', true, '');
export const Ghost = createMaterialBridgeIcon('smart_toy', false, '');
export const Save = createMaterialBridgeIcon('save', false, '');
export const Scale = createMaterialBridgeIcon('balance', false, '');
export const Search = createMaterialBridgeIcon('search', false, '');
export const Send = createMaterialBridgeIcon('send', false, '');
export const SendHorizontal = createMaterialBridgeIcon('send', false, '');
export const Settings = createMaterialBridgeIcon('settings', false, '');
export const Share2 = createMaterialBridgeIcon('share', false, '');
export const Shield = createMaterialBridgeIcon('shield', false, '');
export const ShieldAlert = createMaterialBridgeIcon('gpp_maybe', false, '');
export const ShieldCheck = createMaterialBridgeIcon('verified_user', true, '');
export const ShoppingBag = createMaterialBridgeIcon('shopping_bag', false, '');
export const Smartphone = createMaterialBridgeIcon('smartphone', false, '');
export const Sparkles = createMaterialBridgeIcon('auto_awesome', true, '');
export const Square = createMaterialBridgeIcon('square', false, '');
export const Star = createMaterialBridgeIcon('star', false, '');
export const Swords = createMaterialBridgeIcon('swords', false, '');
export const Tablet = createMaterialBridgeIcon('tablet', false, '');
export const Trash2 = createMaterialBridgeIcon('delete', false, '');
export const TrendingUp = createMaterialBridgeIcon('trending_up', false, '');
export const Trophy = createMaterialBridgeIcon('emoji_events', true, '');
export const Type = createMaterialBridgeIcon('title', false, '');
export const Unlock = createMaterialBridgeIcon('lock_open', false, '');
export const Upload = createMaterialBridgeIcon('upload', false, '');
export const UploadCloud = createMaterialBridgeIcon('cloud_upload', false, '');
export const User = createMaterialBridgeIcon('person', false, '');
export const UserCheck = createMaterialBridgeIcon('how_to_reg', false, '');
export const UserPlus = createMaterialBridgeIcon('person_add', false, '');
export const Users = createMaterialBridgeIcon('groups', false, '');
export const Volume2 = createMaterialBridgeIcon('volume_up', false, '');
export const VolumeX = createMaterialBridgeIcon('volume_off', false, '');
export const Wand2 = createMaterialBridgeIcon('magic_button', false, '');
export const X = createMaterialBridgeIcon('close', false, '');
export const Zap = createMaterialBridgeIcon('bolt', true, '');

const iconCache: Record<string, LucideIcon> = {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ArrowDown,
  ArrowUp,
  Bug,
  Lightbulb,
  MessageSquarePlus,
  Gauge,
  Grid,
  Layers,
  RotateCcw,
  Sliders,
  Terminal,
  Ban,
  Bell,
  Calendar,
  CalendarCheck,
  Camera,
  Check,
  CheckCheck,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  CornerDownLeft,
  Crown,
  Edit2,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  Filter,
  Fingerprint,
  Flame,
  Gamepad2,
  Gift,
  Globe,
  Globe2,
  Heart,
  HelpCircle,
  Home,
  Image,
  ImageIcon,
  Key,
  KeyRound,
  Laptop,
  Link2,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Medal,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquare,
  Circle,
  Ghost,
  Mic,
  Minus,
  Monitor,
  Moon,
  MoreHorizontal,
  Package,
  Palette,
  Pipette,
  Play,
  Plus,
  PlusSquare,
  Radio,
  RefreshCw,
  Target,
  Save,
  Scale,
  Search,
  Send,
  SendHorizontal,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Square,
  Star,
  Swords,
  Tablet,
  Trash2,
  TrendingUp,
  Trophy,
  Type,
  Unlock,
  Upload,
  UploadCloud,
  User,
  UserCheck,
  UserPlus,
  Users,
  Volume2,
  VolumeX,
  Wand2,
  X,
  Zap,
};

export default new Proxy(iconCache, {
  get(target, prop: string) {
    if (prop in target) return target[prop];
    const snake = prop.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    const fallback = createMaterialBridgeIcon(snake);
    target[prop] = fallback;
    return fallback;
  }
});
