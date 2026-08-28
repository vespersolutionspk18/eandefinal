import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import ServiceTemplate from '../components/ServiceTemplate';
import { getService } from '../lib/services';

const service = getService('whole-home')!;

export const metadata: Metadata = {
  title: 'Whole-Home Remodeling Ventura & Santa Barbara | E&E Home Remodeling',
  description:
    'Whole-home remodeling in Ventura and Santa Barbara. Layout, structural, kitchens, bathrooms, and finishes coordinated under one contract. Call (805) 590-0908.',
};

export default function Page() {
  return (
    <PageShell active="whole-home">
      <ServiceTemplate service={service} />
    </PageShell>
  );
}
