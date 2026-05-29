import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function ordinal(n: number): string {
  if (n === 0) return 'Cantrip';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]) + ' level';
}

export const SCHOOL_COLORS: Record<string, string> = {
  Abjuration: 'bg-blue-100 text-blue-800 border-blue-300',
  Conjuration: 'bg-amber-100 text-amber-800 border-amber-300',
  Divination: 'bg-purple-100 text-purple-800 border-purple-300',
  Enchantment: 'bg-pink-100 text-pink-800 border-pink-300',
  Evocation: 'bg-red-100 text-red-800 border-red-300',
  Illusion: 'bg-violet-100 text-violet-800 border-violet-300',
  Necromancy: 'bg-green-100 text-green-800 border-green-300',
  Transmutation: 'bg-orange-100 text-orange-800 border-orange-300',
};

export const LEVEL_LABELS = ['Cantrip', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
