import { Suspense } from 'react';
import { AuthModal } from './AuthModal';

async function AuthModalSection({ searchParams }: Pick<PageProps<'/login'>, 'searchParams'>) {
  const params = await searchParams;
  const next = typeof params.next === 'string' ? params.next : '/';
  return <AuthModal next={next} />;
}

export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <Suspense fallback={null}>
      <AuthModalSection searchParams={searchParams} />
    </Suspense>
  );
}
