import btcLogo from "@/assets/btc-logo.png";
import bitcoinMagazineLogo from "@/assets/bitcoin-magazine-logo.png";
import bitcoinConferenceLogo from "@/assets/bitcoin-conference-logo.png";
import bfcLogo from "@/assets/bfc-logo.png";

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground py-12 px-4 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Orange Pages</h3>
            <p className="text-muted-foreground text-sm">
              The comprehensive directory of Bitcoin businesses and services.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">All Categories</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Submit Business</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">About</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">API Documentation</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Guidelines</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Powered By</h4>
            <div className="grid grid-cols-2 gap-4">
              <img src={btcLogo} alt="BTC Inc" className="h-12 w-auto invert opacity-70 hover:opacity-100 transition-opacity" />
              <img src={bitcoinMagazineLogo} alt="Bitcoin Magazine" className="h-12 w-auto opacity-70 hover:opacity-100 transition-opacity" />
              <img src={bitcoinConferenceLogo} alt="Bitcoin Conference" className="h-12 w-auto opacity-70 hover:opacity-100 transition-opacity" />
              <img src={bfcLogo} alt="Bitcoin for Corporations" className="h-12 w-auto opacity-70 hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Orange Pages. All rights reserved. A BTC Inc property.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
