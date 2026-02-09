import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="gradient-dark py-12 text-primary-foreground">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="font-display text-xl font-bold">WHATMEBOT</h3>
          <p className="text-sm opacity-70 mt-1">WhatsApp Group Management, Simplified.</p>
        </div>
        <div className="flex gap-6 text-sm opacity-70">
          <Link to="/" className="hover:opacity-100 transition-opacity">Home</Link>
          <Link to="/pricing" className="hover:opacity-100 transition-opacity">Pricing</Link>
          <Link to="/login" className="hover:opacity-100 transition-opacity">Login</Link>
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-primary-foreground/10 text-center text-xs opacity-50">
        © {new Date().getFullYear()} WHATMEBOT. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
