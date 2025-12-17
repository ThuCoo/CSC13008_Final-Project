import { Link } from "react-router-dom";
import {
  Gavel,
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-xl text-white">
              <Gavel className="w-6 h-6 text-blue-500" />
              <span>AuctionHub</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              The premier online destination for unique collectibles,
              electronics, and fashion. Bid securely and sell with confidence.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="hover:text-white transition">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-white transition">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-white transition">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Marketplace</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/browse" className="hover:text-blue-400 transition">
                  Browse Auctions
                </Link>
              </li>
              <li>
                <Link
                  to="/categories"
                  className="hover:text-blue-400 transition"
                >
                  All Categories
                </Link>
              </li>
              <li>
                <Link to="/selling" className="hover:text-blue-400 transition">
                  Start Selling
                </Link>
              </li>
              <li>
                <Link
                  to="/watchlist"
                  className="hover:text-blue-400 transition"
                >
                  My Watchlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/support" className="hover:text-blue-400 transition">
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  to="/account-settings"
                  className="hover:text-blue-400 transition"
                >
                  My Account
                </Link>
              </li>
              <li>
                <Link
                  to="/become-seller"
                  className="hover:text-blue-400 transition"
                >
                  Seller Guidelines
                </Link>
              </li>
              <li>
                <span className="cursor-pointer hover:text-blue-400 transition">
                  Terms of Service
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-500 shrink-0" />
                <span>
                  123 Auction Street,
                  <br />
                  Tech City, TC 90210
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-blue-500 shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-500 shrink-0" />
                <span>support@auctionhub.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>
            &copy; {new Date().getFullYear()} AuctionHub. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
