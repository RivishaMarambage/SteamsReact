import { Coffee } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, link = "/" }: { className?: string; link?: string }) {
  return (
    <Link href={link} className={cn("flex items-center gap-2 text-foreground", className)} prefetch={false}>
      <Coffee className="h-6 w-6 text-primary shrink-0" />
      <span className="text-lg font-semibold font-headline group-data-[collapsible=icon]:hidden">
        Steamsburry
      </span>
    </Link>
  );
}
