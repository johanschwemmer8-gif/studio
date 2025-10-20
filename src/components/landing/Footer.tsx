
import { Linkedin } from "lucide-react";
import Link from "next/link";

export default function Footer() {
    return (
      <footer className="bg-primary text-primary-foreground">
        <div className="container mx-auto py-12 px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h4 className="font-semibold">Company</h4>
              <nav className="flex flex-col space-y-2">
                <Link href="/about" className="hover:underline">About iNteract AOE</Link>
              </nav>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Solutions</h4>
              <nav className="flex flex-col space-y-2">
                <Link href="/for-retail-chains" className="hover:underline">For Retail Chains</Link>
                <Link href="/for-investors" className="hover:underline">For Investors</Link>
                <Link href="#" className="hover:underline">Case Studies (coming soon)</Link>
              </nav>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Resources</h4>
              <nav className="flex flex-col space-y-2">
                <Link href="/request-demo" className="hover:underline">Request Demo</Link>
              </nav>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Contact</h4>
              <a href="mailto:johan@interactaoe.co.za" className="hover:underline">johan@interactaoe.co.za</a>
              <div className="flex mt-2">
                <a href="https://www.linkedin.com/in/johan-schwemmer-1a3b5b7b/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80">
                  <Linkedin className="h-6 w-6" />
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-primary-foreground/20 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-primary-foreground/70">
            <p>© 2025 iNteract AOE Pty Ltd. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
              <Link href="/terms-of-service" className="hover:underline">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    );
  }
  
