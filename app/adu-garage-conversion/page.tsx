import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import ServiceTemplate from '../components/ServiceTemplate';
import { getService } from '../lib/services';

const service = getService('adu')!;

export const metadata: Metadata = {
  title: 'ADU & Garage Conversion Ventura & Santa Barbara | E&E Home Remodeling',
  description:
    'ADU and garage conversion builders in Ventura and Santa Barbara. Detached ADUs, garage conversions, and room additions — designed, permitted, and built by one team. Call (805) 590-0908.',
};

export default function Page() {
  return (
    <PageShell active="adu">
      <ServiceTemplate service={service} />
    </PageShell>
  );
}
