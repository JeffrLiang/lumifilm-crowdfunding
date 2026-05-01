import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeCampaignDescription(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function normalizeCampaignTitle(value: string): string {
  return value
    .replace(/\r\n?/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getShortDescription(value: string, wordLimit = 20): string {
  const normalized = normalizeCampaignDescription(value).replace(/\n+/g, ' ').trim();
  const words = normalized ? normalized.split(/\s+/) : [];

  if (words.length <= wordLimit) {
    return normalized;
  }

  return `${words.slice(0, wordLimit).join(' ')}...`;
}
