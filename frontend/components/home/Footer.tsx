import { MedicalIcon } from "@/lib/icons/Icons";

const footerSections = [
  {
    title: "Product",
    links: [
      { name: "Features", href: "#" },
      { name: "Pricing", href: "#" },
      { name: "Case Studies", href: "#" },
      { name: "Updates", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Documentation", href: "#" },
      { name: "Help Center", href: "#" },
      { name: "Community", href: "#" },
      { name: "Blog", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Contact", href: "#" },
      { name: "Privacy", href: "#" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-2xl">
                <MedicalIcon className="h-6 w-6 text-black" />
              </div>
              <div>
                <span className="text-2xl font-bold text-white">MicroDoc AI</span>
                <p className="text-sm text-gray-400 font-medium">HEALTHCARE INTELLIGENCE</p>
              </div>
            </div>
            <p className="text-gray-400 text-lg leading-relaxed">
              Empowering Nigerian healthcare with intelligent documentation solutions.
            </p>
          </div>
          
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-white mb-6 text-lg">{section.title}</h3>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-gray-400 hover:text-white transition-colors duration-200 text-base">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-800 mt-16 pt-8 text-center">
          <p className="text-gray-400 text-lg">
            © 2025 MicroDoc AI. Built with ❤️ for Nigerian healthcare professionals.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
