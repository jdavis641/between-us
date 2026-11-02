'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

export default function MetaPurchaseTracker() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) return;

    const storageKey = `meta_purchase_tracked_${sessionId}`;
    if (typeof window !== 'undefined' && !sessionStorage.getItem(storageKey)) {
      const triggerPurchase = () => {
        if (window.fbq) {
          window.fbq('track', 'Purchase', {
            value: 0.99,
            currency: 'USD',
          });
          sessionStorage.setItem(storageKey, 'true');
          return true;
        }
        return false;
      };

      if (!triggerPurchase()) {
        const interval = setInterval(() => {
          if (triggerPurchase()) {
            clearInterval(interval);
          }
        }, 250);
        const timeout = setTimeout(() => clearInterval(interval), 5000);
        return () => {
          clearInterval(interval);
          clearTimeout(timeout);
        };
      }
    }
  }, [sessionId]);

  return null;
}
