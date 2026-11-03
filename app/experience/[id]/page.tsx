import { redirect } from 'next/navigation';

export default async function ExperienceRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }> | { id: string };
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedQuery = searchParams ? await Promise.resolve(searchParams) : {};
  const id = resolvedParams?.id;

  const queryStrings = new URLSearchParams();
  if (resolvedQuery) {
    for (const [key, value] of Object.entries(resolvedQuery)) {
      if (typeof value === 'string') {
        queryStrings.set(key, value);
      } else if (Array.isArray(value)) {
        value.forEach(v => queryStrings.append(key, v));
      }
    }
  }

  const queryPart = queryStrings.toString() ? `?${queryStrings.toString()}` : '';
  redirect(`/dashboard/experience/${id}${queryPart}`);
}
