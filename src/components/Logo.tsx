import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, link = "/" }: { className?: string; link?: string }) {
  return (
    <Link href={link} className={cn("flex items-center gap-2 text-foreground", className)} prefetch={false}>
      <svg
        className="h-7 w-auto"
        viewBox="0 0 115 106"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M86.4443 45.4232C86.4443 45.4232 80.2993 42.062 72.3333 46.918C64.3673 51.774 62.5313 60.1037 62.5313 60.1037C62.5313 60.1037 68.6763 63.4649 76.6423 58.6089C84.6083 53.7529 86.4443 45.4232 86.4443 45.4232Z"
          stroke="currentColor"
          strokeWidth="5"
        />
        <path
          d="M62.5489 27.5348C51.6549 22.4648 39.0279 26.4718 31.9569 36.3158C28.2429 41.5038 27.3489 47.9048 29.5389 53.5188"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M26.4764 61.0263C26.4764 61.0263 32.6214 64.3875 40.5874 59.5315C48.5534 54.6755 50.3894 46.3458 50.3894 46.3458"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M50.3711 78.914C61.2651 83.984 73.8921 79.977 80.9631 70.133C84.6771 64.945 85.5711 58.544 83.3811 52.93"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M86.4444 45.4232C86.4444 45.4232 80.2994 42.062 72.3334 46.918C64.3674 51.774 62.5314 60.1037 62.5314 60.1037"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-lg font-semibold font-headline uppercase tracking-wider group-data-[collapsible=icon]:hidden">
        Steams Bury
      </span>
    </Link>
  );
}
