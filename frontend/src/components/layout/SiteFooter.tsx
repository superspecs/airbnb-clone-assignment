import Link from "next/link";

import styles from "./SiteFooter.module.css";

// Only links to pages that exist in this project (plus the public source repository).
const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: "Your stays",
    links: [
      { label: "Trips", href: "/trips" },
      { label: "Wishlists", href: "/wishlists" },
      { label: "Browse homes", href: "/?section=homes" },
    ],
  },
  {
    title: "Hosting",
    links: [
      { label: "Become a host", href: "/host" },
      { label: "Create a listing", href: "/host/listings/new" },
      { label: "Host dashboard", href: "/host" },
    ],
  },
  {
    title: "Stays",
    links: [
      { label: "Guest favourites", href: "/#section-guest-favourites" },
      { label: "All stays", href: "/#section-all" },
      { label: "Source code", href: "https://github.com/superspecs/airbnb-clone-assignment", external: true },
    ],
  },
];

/** Site footer: three link columns and a bottom bar, on the light grey band. */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <h2 className="visually-hidden">Site footer</h2>
        <div className={styles.columns}>
          {COLUMNS.map((column) => (
            <section key={column.title}>
              <h3 className={styles.title}>{column.title}</h3>
              <ul className={styles.links}>
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a href={link.href} target="_blank" rel="noreferrer">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href}>{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className={styles.bottom}>
          <p className={styles.legal}>
            © Stays · Demo project · Payments are simulated
          </p>
          <p className={styles.locale}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <span>English (IN)</span>
            <span>₹ INR</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
