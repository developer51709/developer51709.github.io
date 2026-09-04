import { PortalFieldCollection } from '@designcodeio/threeui';

/**
 * Official ThreeUI "Portal Field — Cloud Field" WebGL background
 * (@designcodeio/threeui). Fixed behind all content; the page content sits
 * on translucent glassmorphic layers above it.
 */
const ThreeBackground = () => (
  <div
    aria-hidden
    className="fixed inset-0 z-0 pointer-events-none"
  >
    <PortalFieldCollection variant="cloud-field" mode="dark" />
  </div>
);

export default ThreeBackground;
