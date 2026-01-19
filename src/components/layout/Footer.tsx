
import Link from 'next/link';
import { Logo } from '../Logo';
import { FaFacebook, FaInstagram, FaTiktok } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-muted text-muted-foreground py-8 mt-auto">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <Logo />
            <p className="text-sm">Your daily dose of delight. Serving the best coffee and pastries since 2024.</p>
          </div>
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold text-foreground mb-3 font-headline">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-primary">Home</Link></li>
                <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
                <li><Link href="/news" className="hover:text-primary">News</Link></li>
                <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 font-headline">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-primary">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-primary">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
                <h4 className="font-semibold text-foreground mb-3 font-headline">Follow Us</h4>
                <div className="flex space-x-4">
                    <Link href="#" className="hover:text-primary"><FaFacebook className="h-6 w-6" /></Link>
                    <Link href="#" className="hover:text-primary"><FaInstagram className="h-6 w-6" /></Link>
                    <Link href="#" className="hover:text-primary"><FaTiktok className="h-6 w-6" /></Link>
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
