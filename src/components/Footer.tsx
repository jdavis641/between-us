import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full py-8 border-t border-zinc-900 bg-zinc-950 text-zinc-500 text-sm mt-auto">
      <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/terms" className="hover:text-zinc-300 transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
            Privacy Policy
          </Link>
        </div>
        
        <div className="flex items-center gap-6 flex-col md:flex-row">
          <a href="mailto:support@betweenusapp.io" className="hover:text-zinc-300 transition-colors">
            Support: support@betweenusapp.io
          </a>
          <span>&copy; 2026 Between Us. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
