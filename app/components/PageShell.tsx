import type { ReactNode } from 'react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import MobileStickyBar from './MobileStickyBar';
import ExitIntentModal from './ExitIntentModal';

type Props = {
  active?:
    | 'home'
    | 'bathroom'
    | 'kitchen'
    | 'landscaping'
    | 'adu'
    | 'whole-home'
    | 'gallery'
    | 'about'
    | 'contact';
  children: ReactNode;
  showExitIntent?: boolean;
};

export default function PageShell({ active, children, showExitIntent }: Props) {
  return (
    <>
      <SiteHeader active={active} />
      <main>{children}</main>
      <SiteFooter />
      <MobileStickyBar />
      {showExitIntent && <ExitIntentModal />}
    </>
  );
}
