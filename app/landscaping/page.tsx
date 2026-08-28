import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import ServiceTemplate from '../components/ServiceTemplate';
import { getService } from '../lib/services';

const service = getService('landscaping')!;

export const metadata: Metadata = {
  title: 'Landscaping Ventura & Santa Barbara | Hardscape & Softscape | E&E',
  description:
    'Landscaping in Ventura and Santa Barbara by E&E Home Remodeling. Hardscape, softscape, drainage, lighting, and irrigation planned together. Call (805) 590-0908.',
};

export default function Page() {
  return (
    <PageShell active="landscaping">
      <ServiceTemplate service={service} />
    </PageShell>
  );
}
