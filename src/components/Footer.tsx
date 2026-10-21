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
          <a href="mailto:support@betweenusapp.io" className="hover:text-zinc-300 transition-colors">
            Support
          </a>
        </div>
        
        <div className="flex items-center gap-6 flex-col md:flex-row text-center md:text-right">
          <div className="flex flex-col gap-1">
            <div className="text-xs text-zinc-400 font-medium">
              <p>Between Us</p>
              <p className="text-zinc-500">
                <a href="mailto:support@betweenusapp.io" className="hover:text-zinc-300 transition-colors">
                  Need help? Email us: support@betweenusapp.io
                </a>
              </p>
            </div>
            <span className="text-xs text-zinc-600 mt-1">&copy; 2026 Between Us. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
