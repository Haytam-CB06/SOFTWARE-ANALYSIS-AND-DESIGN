import { COLOR_MAP, SESSION_TYPE_COLORS } from '../constants';

/**
 * Converts Tailwind color classes to hex codes
 */
export const convertTailwindColorToHex = (tailwindClass: string): string => {
  return COLOR_MAP[tailwindClass as keyof typeof COLOR_MAP] || '#3B82F6';
};

/**
 * Gets color for a specific session type
 */
export const getColorForType = (type: string): string => {
  return SESSION_TYPE_COLORS[type as keyof typeof SESSION_TYPE_COLORS] || '#3B82F6';
};
