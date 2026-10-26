import { strapiFetch } from './client';
import { profileSchema, strapiSingleResponseSchema } from './schemas';

export async function getProfile(username: string) {
  const json = await strapiFetch(`/api/profiles/${username}`);
  return strapiSingleResponseSchema(profileSchema).parse(json);
}
