import type { APIRoute } from 'astro';
import { buildWarehouse } from '~/lib/warehouse';
import { toCsv } from '~/lib/format';

export const GET: APIRoute = async () => {
  const wh = await buildWarehouse();
  return new Response(toCsv(wh.fact_claim), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="claims.csv"',
    },
  });
};
