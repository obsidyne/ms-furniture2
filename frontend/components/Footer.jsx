import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-ink text-white/60">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <p className="font-serif text-xl text-white mb-3">MS Furniture & Interiors</p>
            <p className="text-sm leading-relaxed text-white/40 max-w-[200px]">
              Crafting furniture that becomes part of your story.
            </p>
          </div>
          {[
            {
              title: "Shop",
              links: [
                { label: "All Products", href: "/shop" },
                { label: "New Arrivals", href: "/shop?sort=newest" },
                { label: "Best Sellers", href: "/shop" },
              ],
            },
            {
              title: "Legal",
              links: [
                { label: "Terms and Conditions", href: "/terms-and-conditions" },
                { label: "Privacy Policy",      href: "/privacy-policy" },
                { label: "Refund Policy",       href: "/refund-policy" },
              ],
            },
            {
              title: "Support",
              links: [
                { label: "Contact Us",    href: "/contact-us" },
                { label: "Shipping",      href: "#" },
                { label: "Care Guide",    href: "#" },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-[0.65rem] font-medium tracking-[0.15em] uppercase text-white mb-4">
                {col.title}
              </p>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-white/40 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1 items-center sm:items-start text-center sm:text-left">
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} MS Furniture & Interiors. All rights reserved.
            </p>
            <p className="text-[10px] text-white/20">
              VHPH+RQ9, Curzon Rd, Kallupalam, Thangassery, Kollam, Kerala 691013 | Ph: 99953 22809
            </p>
          </div>
          <p className="text-xs text-white/30">
            Handcrafted in Kerala, India 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}
