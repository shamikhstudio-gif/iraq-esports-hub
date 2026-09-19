import React from 'react';
import { Icon } from '@/components/ui/Icon';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
  size?: number;
  glow?: boolean;
}

/**
 * 1. Home Icon (Material 3 'home')
 */
export function HomeIcon({ className = '', size = 20, glow, ...props }: IconProps) {
  return <Icon name="home" size={size} className={className} {...props} />;
}

/**
 * 2. Messages / Chat Bubble Icon (Material 3 'chat')
 */
export function MessagesIcon({ className = '', size = 20, glow, ...props }: IconProps) {
  return <Icon name="chat" size={size} className={className} {...props} />;
}

/**
 * 3. Teams / Community Icon (Material 3 'groups')
 */
export function TeamsIcon({ className = '', size = 20, glow, ...props }: IconProps) {
  return <Icon name="groups" size={size} className={className} {...props} />;
}

/**
 * 4. Notifications Bell Icon (Material 3 'notifications')
 */
export function BellIcon({ className = '', size = 20, glow, ...props }: IconProps) {
  return <Icon name="notifications" size={size} className={className} {...props} />;
}

/**
 * 5. Crossed Swords / Scrims & Battle Icon (Material 3 'swords')
 */
export function SwordsIcon({ className = '', size = 20, glow, ...props }: IconProps) {
  return <Icon name="swords" size={size} className={className} {...props} />;
}

export { SwordsIcon as ScrimsIcon };

/**
 * 6. Settings Gear Icon (Material 3 'settings')
 */
export function SettingsIcon({ className = '', size = 20, ...props }: any) {
  return <Icon name="settings" size={size} className={className} {...props} />;
}

export { IehLogo } from './IehLogo';
export type { IehLogoProps } from './IehLogo';
