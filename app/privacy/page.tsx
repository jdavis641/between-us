import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-300 py-20 px-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <Link href="/" className="text-sm font-medium text-zinc-500 hover:text-white transition-colors mb-4 flex items-center gap-2">
          &larr; Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold text-zinc-50 mb-2">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <section>
          <h2 className="text-2xl font-semibold text-zinc-100 mb-4">1. Information We Collect</h2>
          <p className="leading-relaxed">
            We built Between Us with privacy as our core principle. We utilize blind magic-link pairing to allow for complete anonymity. We do not require or collect your real name, physical address, or identifying social media profiles. We only collect the email address you provide for authentication, alongside the anonymous aliases and preferences you input into the app.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-zinc-100 mb-4">2. How We Store Your Data</h2>
          <p className="leading-relaxed">
            Your data is securely stored using industry-standard encryption. We use strict Row Level Security (RLS) database policies to ensure that your private inputs (such as your intimacy preferences and "Off-Limits" boundaries) are strictly protected and only accessible to authorized paired users as governed by the app's internal logic.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-zinc-100 mb-4">3. Data Sharing and Sale</h2>
          <p className="leading-relaxed font-semibold text-zinc-100 text-lg">
            We never sell your data.
          </p>
          <p className="leading-relaxed mt-2">
            We do not sell, trade, or rent user personal identification information to others under any circumstances. We may share generic aggregated demographic information not linked to any personal identification information with our business partners strictly for the purposes of improving the service. 
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold text-zinc-100 mb-4">4. Third-Party Processors</h2>
          <p className="leading-relaxed">
            We use secure, trusted third-party processors (such as Stripe for payments and secure email providers for magic links) solely to operate our service. These processors are strictly bound by their own privacy policies and do not have the right to use your data beyond what is necessary to assist us.
          </p>
        </section>

        <section className="mt-8 border-t border-zinc-900 pt-8">
          <h2 className="text-2xl font-semibold text-zinc-100 mb-4">5. Contact Us</h2>
          <p className="leading-relaxed mb-4">
            If you have any questions about this Privacy Policy, please contact us at:
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
