import Link from "next/link";

/** Shared editorial footer: presentation only; destinations use canonical routes. */
export function StorefrontFooter({ brand, menuHref }: { brand: string; menuHref: string }) {
  return <footer className="bakery-footer">
    <Link className="bakery-footer-brand" href={menuHref}>{brand}</Link>
    <nav aria-label="Footer navigation">
      <Link href={menuHref}>Menu</Link>
      <Link href={`${menuHref.split("#")[0]}/about`}>Our bakery</Link>
      <Link href="/stores">Visit</Link>
      <Link href="/account/sign-in">Account</Link>
    </nav>
    <p>A brighter day, baked in.</p>
  </footer>;
}
