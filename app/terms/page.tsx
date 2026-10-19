import Link from "next/link";

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-300 py-20 px-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <Link href="/" className="text-sm font-medium text-zinc-500 hover:text-white transition-colors mb-4 flex items-center gap-2">
          &larr; Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold text-zinc-50 mb-2">Terms of Service</h1>
        <p className="text-sm text-zinc-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <section>
          <h2 className="text-2xl font-semibold text-zinc-100 mb-4">1. Acceptance of Terms</h2>
          <p className="leading-relaxed">
            By accessing and using Between Us (the "Service"), you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-zinc-100 mb-4">2. Subscription and Recurring Billing</h2>
          <p className="leading-relaxed">
            Between Us is a subscription-based software service providing recurring digital content. By starting a trial or subscription, you authorize us to charge your provided payment method on a recurring basis for access to the serialized narratives and intimacy game libraries. You may cancel your subscription at any time through your account settings or by contacting our support team.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-zinc-100 mb-4">3. Content Usage</h2>
          <p className="leading-relaxed">
            All digital content provided within Between Us is for personal, non-commercial use only. You may not distribute, modify, or reproduce the content without explicit permission. The narratives and tools are for entertainment and relationship-building purposes.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold text-zinc-100 mb-4">4. Limitation of Liability</h2>
          <p className="leading-relaxed">
            The Service is provided "as is". We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties, including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <section className="mt-8 border-t border-zinc-900 pt-8">
          <h2 className="text-2xl font-semibold text-zinc-100 mb-4">5. Contact Us</h2>
          <p className="leading-relaxed mb-4">
            If you have any questions about these Terms, please contact us at:
          </p>
          <div className="bg-zinc-900/50 p-6 rounded-lg text-sm text-zinc-400">
            <p className="text-zinc-200 font-medium mb-2">Between Us</p>
            <p>1043 S. Roselle Rd, #1048</p>
            <p>Schaumburg, IL 60193</p>
            <p className="mt-2">Support Line: 224-223-8077</p>
            <p>Email: <a href="mailto:support@betweenusapp.io" className="text-red-400 hover:text-red-300">support@betweenusapp.io</a></p>
          </div>
        </section>
      </div>
    </main>
  );
}
