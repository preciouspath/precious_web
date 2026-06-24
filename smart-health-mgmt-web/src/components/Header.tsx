import { useState } from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const footerDownload = document.getElementById('footer-download');
    if (footerDownload) {
      footerDownload.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-[1000] py-4">
        <div className="container">
          <div className="flex items-center justify-between gap-8">
            {/* Logo */}
            <div className="flex-shrink-0">
              <a href="/" className="flex items-center gap-2.5 no-underline">
                <img src="/images/logo.svg" alt="Logo" />
              </a>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex flex-1">
              <ul className="flex items-center gap-8 list-none m-0 p-0">
                <li>
                  <Link
                    to="/"
                    className="text-base headings-web-h6-headline text-slate-700 hover:text-[#9146C1] transition-colors duration-300 no-underline whitespace-nowrap"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="text-base headings-web-h6-headline text-slate-700 hover:text-[#9146C1] transition-colors duration-300 no-underline whitespace-nowrap"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-base headings-web-h6-headline text-slate-700 hover:text-[#9146C1] transition-colors duration-300 no-underline whitespace-nowrap"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faq"
                    className="text-base headings-web-h6-headline text-slate-700 hover:text-[#9146C1] transition-colors duration-300 no-underline whitespace-nowrap"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <a
                    href="#footer-download"
                    onClick={handleDownloadClick}
                    className="text-base headings-web-h6-headline text-slate-700 hover:text-[#9146C1] transition-colors duration-300 no-underline whitespace-nowrap"
                  >
                    Download App
                  </a>
                </li>
              </ul>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              <Link
                to={"/login"}
                className="!hidden lg:!flex btn min-w-[122px]"
              >
                Login
              </Link>
              {/* <Link
                  to={"/register"}
                   className="!hidden lg:!inline-flex items-center justify-center btn btn-black min-w-[122px]"
                >
                  Signup
                </Link> */}

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden bg-transparent border-none text-3xl text-[#9146C1] cursor-pointer p-1 leading-none"
                onClick={toggleDrawer}
              >
                ☰
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 transition-all duration-300 z-[1998] ${isDrawerOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        onClick={toggleDrawer}
      ></div>

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 w-72 max-w-[85%] h-screen bg-white shadow-xl transition-all duration-300 z-[1999] flex flex-col overflow-y-auto ${isDrawerOpen ? "right-0" : "-right-full"
          }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <img src="images/logo.svg" />
          </div>
          <button
            className="bg-transparent border-none text-2xl text-slate-700 cursor-pointer p-1 leading-none"
            onClick={toggleDrawer}
          >
            ✕
          </button>
        </div>

        {/* Drawer Navigation */}
        <nav className="flex-1 py-5">
          <ul className="list-none m-0 p-0">
            <li className="border-b border-slate-100">
              <a
                href="/"
                className="block py-4 px-5 text-base font-medium text-[#9146C1] bg-purple-50 no-underline transition-all duration-300"
              >
                Home
              </a>
            </li>
            <li className="border-b border-slate-100">
              <a
                href="/about"
                className="block py-4 px-5 text-base font-medium text-slate-700 hover:bg-purple-50 hover:text-[#9146C1] no-underline transition-all duration-300"
              >
                About Us
              </a>
            </li>
            <li className="border-b border-slate-100">
              <a
                href="/contact"
                className="block py-4 px-5 text-base font-medium text-slate-700 hover:bg-purple-50 hover:text-[#9146C1] no-underline transition-all duration-300"
              >
                Contact Us
              </a>
            </li>
            <li className="border-b border-slate-100">
              <a
                href="/faq"
                className="block py-4 px-5 text-base font-medium text-slate-700 hover:bg-purple-50 hover:text-[#9146C1] no-underline transition-all duration-300"
              >
                FAQ
              </a>
            </li>
            <li className="border-b border-slate-100">
              <a
                href="/download"
                className="block py-4 px-5 text-base font-medium text-slate-700 hover:bg-purple-50 hover:text-[#9146C1] no-underline transition-all duration-300"
              >
                Download App
              </a>
            </li>
          </ul>
        </nav>

        {/* Drawer Actions */}
        <div className="p-5 flex flex-col gap-2.5 border-t border-slate-200">
          <button className="w-full bg-[#9146C1] hover:bg-[#8543AD] text-white rounded-lg h-11 text-base font-medium border-none cursor-pointer transition-all duration-300">
            Login
          </button>
          <button className="w-full bg-black hover:bg-slate-800 text-white rounded-lg h-11 text-base font-medium border-none cursor-pointer transition-all duration-300">
            Signup
          </button>
        </div>
      </div>
    </>
  );
}

export default Header