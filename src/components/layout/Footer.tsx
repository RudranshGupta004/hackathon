
import React from "react";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

const Footer = ({ className }: FooterProps) => {
  return (
    <footer className={cn("bg-secondary py-12 px-6", className)}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold tracking-tight">LoanOne</h3>
            <p className="text-muted-foreground text-sm">
              Fast, simple, and secure loan services for your financial needs.
            </p>
          </div>

          <div id="about" className="space-y-4">
            <h4 className="font-medium">About Us</h4>
            <p className="text-sm text-muted-foreground">
              LoanOne provides fast and secure loan services with simplified application processes,
              quick approval decisions, and flexible loan options tailored to your financial needs.
              Our mission is to make financial assistance accessible to everyone.
            </p>
          </div>

          <div id="contact" className="space-y-4">
            <h4 className="font-medium">Contact</h4>
            <p className="text-sm text-muted-foreground">
              Email: support@loanone.com
            </p>
            <p className="text-sm text-muted-foreground">
              Phone: (555) 123-4567
            </p>
            <p className="text-sm text-muted-foreground">
              Address: 123 Financial St, Money City, MC 12345
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} LoanOne. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <SocialLink href="https://twitter.com" label="Twitter" />
              <SocialLink href="https://facebook.com" label="Facebook" />
              <SocialLink href="https://linkedin.com" label="LinkedIn" />
              <SocialLink href="https://instagram.com" label="Instagram" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

interface SocialLinkProps {
  href: string;
  label: string;
}

const SocialLink = ({ href, label }: SocialLinkProps) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      aria-label={label}
    >
      {label}
    </a>
  );
};

export default Footer;
