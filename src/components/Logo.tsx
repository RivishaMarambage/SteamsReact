
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className, link = "/" }: { className?: string; link?: string }) {
  return (
    <Link href={link} className={cn("flex items-center", className)} prefetch={false}>
      <Image
        src="/logo.webp"
        alt="Steams Bury Logo"
        width={160}
        height={40}
        priority
        className="h-10 w-auto object-contain"
      />
    </Link>
  );
}
