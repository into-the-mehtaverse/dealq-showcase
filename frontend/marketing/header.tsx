"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-2 sm:p-4">
      <header className="flex items-center w-full shadow-xl backdrop-blur-md bg-background/90 border rounded-2xl px-4 py-2 sm:px-8 sm:py-4">
        <div className="flex items-center">
          <Link
            href="/landing"
            className="flex items-center px-2 py-1.5 sm:px-4 sm:py-3 hover:bg-muted rounded-xl transition-colors"
          >
            <Image
              src="/icon.svg"
              alt="Icon"
              width={40}
              height={40}
              className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-3 opacity-90"
            />
            <div className="flex flex-col">
              <span className="font-black text-xl sm:text-2xl leading-none text-black">
                DealQ
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex items-center flex-grow justify-end">
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-4">
            <Link
              href="/landing#features"
              className="px-6 py-2.5 text-foreground hover:text-accent font-medium transition-colors"
            >
              Product
            </Link>
            <Link
              href="/landing#workflow"
              className="px-6 py-2.5 text-foreground hover:text-accent font-medium transition-colors"
            >
              Solutions
            </Link>
            <Link
              href="/landing/pricing"
              className="px-6 py-2.5 text-foreground hover:text-accent font-medium transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/landing/login"
              className="px-6 py-2.5 text-foreground hover:text-accent font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/landing#beta"
              className="px-8 py-3 bg-accent text-accent-foreground rounded-full text-base font-medium hover:bg-accent/90 transition-all transform hover:scale-105 shadow-lg"
            >
              Beta Signup →
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </nav>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute top-full left-4 right-4 mt-2 bg-background border border-border rounded-xl shadow-xl sm:hidden">
            <div className="py-2">
              <Link
                href="/landing#features"
                className="block px-6 py-3 text-foreground hover:bg-muted transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Product
              </Link>
              <Link
                href="/landing#workflow"
                className="block px-6 py-3 text-foreground hover:bg-muted transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Solutions
              </Link>
              <Link
                href="/landing/pricing"
                className="block px-6 py-3 text-foreground hover:bg-muted transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/landing/login"
                className="block px-6 py-3 text-foreground hover:bg-muted transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/landing#beta"
                className="block px-6 py-3 text-accent font-medium hover:bg-muted transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Beta Signup →
              </Link>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
