import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router";

const navigationLinks = [
  { name: "Home", href: "#home" },
  { name: "Pricing", href: "#pricing" },
  { name: "Features", href: "#features" },
  { name: "Contact", href: "#contact" },
];

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    // Smooth scroll to section
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick("#home");
              }}
              className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent transition-all duration-300 hover:scale-105 hover:from-primary/90 hover:to-primary/50 active:scale-95">
              InvoicePro
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navigationLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:after:w-full active:scale-95">
                {link.name}
              </a>
            ))}
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="transition-all duration-300 hover:scale-105 hover:bg-primary/10 active:scale-95">
              <Link to="/login">Login</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95">
              <Link to="/register">Sign Up</Link>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Toggle menu" className="relative">
                <div className="relative w-6 h-6 flex items-center justify-center">
                  <Menu
                    className={cn(
                      "h-5 w-5 absolute transition-all duration-300 ease-in-out",
                      isOpen ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100",
                    )}
                  />
                  <X
                    className={cn(
                      "h-5 w-5 absolute transition-all duration-300 ease-in-out",
                      isOpen ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0",
                    )}
                  />
                </div>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] px-6">
              <div className="flex flex-col gap-8 mt-12">
                {/* Mobile Navigation Links */}
                <nav className="flex flex-col gap-1">
                  {navigationLinks.map((link, index) => (
                    <a
                      key={link.name}
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavClick(link.href);
                      }}
                      className={cn(
                        "group text-lg font-medium text-foreground/80 hover:text-primary",
                        "transition-all duration-300 py-3 px-4 rounded-lg",
                        "hover:bg-primary/5 hover:translate-x-1",
                        "active:scale-95",
                      )}
                      style={{
                        animation: isOpen ? `slideInFromRight 0.3s ease-out ${index * 0.1}s backwards` : "none",
                      }}>
                      <span className="flex items-center justify-between">
                        {link.name}
                        <svg
                          className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </a>
                  ))}
                </nav>

                {/* Mobile CTA Buttons */}
                <div
                  className="flex flex-col gap-3 pt-6 border-t"
                  style={{
                    animation: isOpen ? "slideInFromRight 0.3s ease-out 0.4s backwards" : "none",
                  }}>
                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                    className="w-full transition-all duration-200 hover:scale-105 active:scale-95">
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button
                    size="lg"
                    asChild
                    className="w-full transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg">
                    <Link to="/register">Sign Up</Link>
                  </Button>
                </div>

                {/* Mobile Menu Footer */}
                <div
                  className="mt-auto pt-8 border-t"
                  style={{
                    animation: isOpen ? "fadeIn 0.3s ease-out 0.5s backwards" : "none",
                  }}>
                  <p className="text-xs text-muted-foreground text-center">© 2024 InvoicePro. All rights reserved.</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Keyframe animations injected via style tag */}
      <style>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </header>
  );
};
