'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SignInFlow from '../login/page';

function SignInPageContent() {
  const searchParams = useSearchParams();
  const [inviteToken, setInviteToken] = useState<string | null>(() => {
    return searchParams.get('invite_token') || 
           searchParams.get('token') || 
           searchParams.get('pass') || 
           searchParams.get('pass_token');
  });

  useEffect(() => {
    const token = searchParams.get('invite_token') || 
                  searchParams.get('token') || 
                  searchParams.get('pass') || 
                  searchParams.get('pass_token');
    if (token) {
      setInviteToken(token);
      try {
        sessionStorage.setItem('invite_token', token);
        sessionStorage.setItem('pass_token', token);
        document.cookie = `invite_token=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `pass_token=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Lax`;
      } catch (e) {}
    }
  }, [searchParams]);

  return <SignInFlow initialInviteToken={inviteToken} />;
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 text-white p-8 flex items-center justify-center">Loading...</div>}>
      <SignInPageContent />
    </Suspense>
  );
}
