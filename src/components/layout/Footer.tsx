import Link from 'next/link';
import { Logo } from '../Logo';
import { FaFacebook, FaInstagram, FaTiktok } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-[#211811] text-primary-foreground py-12 mt-auto">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-6">
            <Logo />
            <p className="text-sm text-white/60 leading-relaxed max-w-xs">
              Your daily dose of delight. Serving the best coffee and pastries since 2024. Hand-crafted with passion in every cup.
            </p>
          </div>
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold text-primary-foreground mb-6 font-headline uppercase tracking-wider text-sm">Quick Links</h4>
              <ul className="space-y-3 text-sm text-white/70">
                <li><Link href="/" className="hover:text-[#d97706] transition-colors">Home</Link></li>
                <li><Link href="/menu" className="hover:text-[#d97706] transition-colors">Menu</Link></li>
                <li><Link href="/updates" className="hover:text-[#d97706] transition-colors">Updates</Link></li>
                <li><Link href="/rewards" className="hover:text-[#d97706] transition-colors">Rewards</Link></li>
                <li><Link href="/offers" className="hover:text-[#d97706] transition-colors">Offers</Link></li>
                <li><Link href="/about" className="hover:text-[#d97706] transition-colors">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-primary-foreground mb-6 font-headline uppercase tracking-wider text-sm">Legal</h4>
              <ul className="space-y-3 text-sm text-white/70">
                <li><Link href="/terms" className="hover:text-[#d97706] transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-[#d97706] transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
                <h4 className="font-bold text-primary-foreground mb-6 font-headline uppercase tracking-wider text-sm">Follow Us</h4>
                <div className="flex space-x-4">
                    <Link href="https://web.facebook.com/people/Steamsbury/61564067381778" className="transition-all hover:text-[#d97706] hover:scale-110"><FaFacebook className="h-6 w-6" /></Link>
                    <Link href="https://www.instagram.com/steamsbury/" className="transition-all hover:text-[#d97706] hover:scale-110"><FaInstagram className="h-6 w-6" /></Link>
                    <Link href="https://www.tiktok.com/tag/steamsbury" className="transition-all hover:text-[#d97706] hover:scale-110"><FaTiktok className="h-6 w-6" /></Link>
                </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-12 pt-8 text-center text-xs text-white/40">
          <p>&copy; {new Date().getFullYear()} Steamsbury. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
