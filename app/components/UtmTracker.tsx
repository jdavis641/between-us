'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function UtmTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const utmCampaign = searchParams.get('utm_campaign');
    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmContent = searchParams.get('utm_content');

    if (utmCampaign || utmSource || utmMedium || utmContent) {
      if (utmCampaign) {
        sessionStorage.setItem('betweenus_utm_campaign', utmCampaign);
        document.cookie = `utm_campaign=${encodeURIComponent(utmCampaign)}; path=/; max-age=2592000; SameSite=Lax`;
      }
      if (utmSource) {
        sessionStorage.setItem('betweenus_utm_source', utmSource);
        document.cookie = `utm_source=${encodeURIComponent(utmSource)}; path=/; max-age=2592000; SameSite=Lax`;
      }
      if (utmMedium) {
        sessionStorage.setItem('betweenus_utm_medium', utmMedium);
        document.cookie = `utm_medium=${encodeURIComponent(utmMedium)}; path=/; max-age=2592000; SameSite=Lax`;
      }
      if (utmContent) {
        sessionStorage.setItem('betweenus_utm_content', utmContent);
        document.cookie = `utm_content=${encodeURIComponent(utmContent)}; path=/; max-age=2592000; SameSite=Lax`;
      }
    }
  }, [searchParams]);

  return null;
}
