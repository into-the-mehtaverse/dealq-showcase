"use client";

import {
  Facebook,
  Twitter,
  Instagram,
  Github,
  Mail,
  Moon,
  Sun,
} from "lucide-react";


export default function Footer() {

  return (
    <footer className="bg-foreground text-background w-full">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold mb-4">DealQ</h3>
            <p className="text-sm opacity-90">CRE underwriting made simple.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
            <div className="flex space-x-4">
              <a
                href="#"
                className="opacity-90 hover:opacity-100 transition-opacity"
              >
                <Facebook size={24} />
              </a>
              <a
                href="#"
                className="opacity-90 hover:opacity-100 transition-opacity"
              >
                <Twitter size={24} />
              </a>
              <a
                href="#"
                className="opacity-90 hover:opacity-100 transition-opacity"
              >
                <Instagram size={24} />
              </a>
              <a
                href="#"
                className="opacity-90 hover:opacity-100 transition-opacity"
              >
                <Github size={24} />
              </a>
              <a
                href="mailto:contact@example.com"
                className="opacity-90 hover:opacity-100 transition-opacity"
              >
                <Mail size={24} />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-background/10 flex justify-between items-center text-sm opacity-75">
          <div>
            &copy; {new Date().getFullYear()} DealQ. All rights reserved.
          </div>
          {/* <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-1 rounded hover:opacity-100 transition-opacity"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button> */}
        </div>
      </div>
    </footer>
  );
}
