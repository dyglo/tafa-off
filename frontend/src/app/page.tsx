'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/chat');
      } else {
        router.push('/auth/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <div className="mb-4">
          <Logo size="lg" variant="default" className="mx-auto mb-4" />
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">TOff</h1>
        <p className="text-secondary">Loading...</p>
      </div>
    </div>
  );
}
