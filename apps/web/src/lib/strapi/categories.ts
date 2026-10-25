import { strapiFetch } from './client';
import { categorySchema, strapiListResponseSchema } from './schemas';

export async function listCategories() {
  const json = await strapiFetch('/api/categories', {
    query: {
      sort: ['name:asc'],
      pagination: { pageSize: 100 },
    },
  });
  return strapiListResponseSchema(categorySchema).parse(json);
}
