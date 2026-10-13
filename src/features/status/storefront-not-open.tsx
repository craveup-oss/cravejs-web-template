/** Public empty state only after the request resolves to a configured tenant. */
export function StorefrontNotOpen({ retryHref }: { readonly retryHref: "/" | "/stores" }) {
  return (
    <main className="catalog-state" role="status">
      <h1>This store isn’t open yet</h1>
      <p>Online ordering will be available here soon.</p>
      <form action={retryHref} method="get">
        <button className="primary-button" type="submit">Check again</button>
      </form>
    </main>
  );
}
