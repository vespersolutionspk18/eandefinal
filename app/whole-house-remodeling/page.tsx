import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import ServiceTemplate from '../components/ServiceTemplate';
import { getService } from '../lib/services';

const service = getService('whole-home')!;

export const metadata: Metadata = {
  title: 'Whole House Remodeling Ventura & Santa Barbara | Free 3D Design | E&E',
  description:
    'Whole house remodeling in Ventura and Santa Barbara by E&E Home Remodeling. Layout, structural, kitchens, bathrooms, and finishes coordinated under one contract. Call (805) 590-0908.',
};

export default function Page() {
  return (
    <PageShell active="whole-home">
      <ServiceTemplate service={service} />
    </PageShell>
  );
}
