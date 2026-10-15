import Link from "next/link";
import Image from "next/image";
import Sidebar from "./Sidebar";
import TolerancePromptManager from "../components/TolerancePromptManager";
import TourModal from "./components/TourModal";
import { Suspense } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-zinc-950 text-zinc-100 selection:bg-red-500/30">
      
      {/* Sidebar Navigation */}
      <Sidebar
        logo={
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image src="/brand-logo.webp" alt="Between Us Logo" width={32} height={32} priority className="rounded-md" />
            <h2 className="text-xl font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              Between Us
            </h2>
          </Link>
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-hidden flex flex-col relative w-full">
        {children}
      </div>
      <TolerancePromptManager />
      <Suspense fallback={null}>
        <TourModal />
      </Suspense>
    </div>
  );
}
