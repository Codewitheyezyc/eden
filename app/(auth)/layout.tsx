import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#07130D]">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <Link href="/" className="flex items-center transition-opacity hover:opacity-80">
          <Logo className="h-8 w-auto" />
        </Link>
      </div>
      <div className="w-full max-w-md px-8 py-10 bg-white dark:bg-[#0c1e15] sm:rounded-2xl sm:shadow-lg sm:border sm:border-gray-100 dark:sm:border-gray-800">
        {children}
      </div>
    </div>
  );
}
