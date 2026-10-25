import type { ListDiscussionsFilters } from '@/lib/strapi/discussions';

export const queryKeys = {
  discussions: (filters: ListDiscussionsFilters = {}) => ['discussions', filters] as const,
  discussion: (documentId: string) => ['discussion', documentId] as const,
  replies: (documentId: string) => ['replies', documentId] as const,
};
