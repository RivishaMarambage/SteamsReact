
import Link from 'next/link';
import { Logo } from '../Logo';
import { FaFacebook, FaInstagram, FaTiktok } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-[#211811] text-primary-foreground py-8 mt-auto">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <Logo />
            <p className="text-sm">Your daily dose of delight. Serving the best coffee and pastries since 2024.</p>
          </div>
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold text-primary-foreground mb-3 font-headline">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-accent">Home</Link></li>
                <li><Link href="/menu" className="hover:text-accent">Menu</Link></li>
                <li><Link href="/updates" className="hover:text-accent">Updates</Link></li>
                <li><Link href="/rewards" className="hover:text-accent">Rewards</Link></li>
                <li><Link href="/offers" className="hover:text-accent">Offers</Link></li>
                <li><Link href="/about" className="hover:text-accent">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-primary-foreground mb-3 font-headline">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-accent">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-accent">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
                <h4 className="font-semibold text-primary-foreground mb-3 font-headline">Follow Us</h4>
                <div className="flex space-x-4">
                    <Link href="https://web.facebook.com/people/Steamsbury/61564067381778" className="transition-colors hover:text-blue-600"><FaFacebook className="h-6 w-6" /></Link>
                    <Link href="https://www.instagram.com/steamsbury/" className="transition-colors hover:text-purple-600"><FaInstagram className="h-6 w-6" /></Link>
                    <Link href="https://www.tiktok.com/tag/steamsbury" className="transition-colors hover:text-white"><FaTiktok className="h-6 w-6" /></Link>
                </div>
            </div>
          </div>
        </div>
        <div className="border-t mt-8 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Steamsburry. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}