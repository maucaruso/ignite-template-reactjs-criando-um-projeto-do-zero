import Prismic from 'prismic-javascript';
import { DefaultClient } from 'prismic-javascript/types/client';

export function getPrismicClient(req?: unknown): DefaultClient {
  const prismic = Prismic.client(process.env.PRISMIC_API_ENDPOINT, {
    req,
  });

  return prismic;
}
