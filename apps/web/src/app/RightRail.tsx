// Reserved layout slot for the right rail (mockup's .right — progress card,
// "Utile" question widget, etc., §1 out of scope for now). Kept empty on
// purpose rather than filled with placeholder content for a feature that
// isn't scoped yet; it only exists so the 1/3/2 column grid is already in
// place when real content lands here.
export function RightRail() {
  return <aside aria-hidden="true" className="hidden lg:block" />;
}
