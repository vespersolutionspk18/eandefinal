import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import ServiceTemplate from '../components/ServiceTemplate';
import { getService } from '../lib/services';

const service = getService('kitchen')!;

export const metadata: Metadata = {
  title: 'Kitchen Remodeling Ventura & Santa Barbara | Free 3D Design | E&E',
  description:
    'Kitchen remodeling in Ventura and Santa Barbara by E&E Home Remodeling. Free 3D design, design + build under one roof, licensed and insured. Call (805) 590-0908.',
};

export default function Page() {
  return (
    <PageShell active="kitchen">
      <ServiceTemplate service={service} />
    </PageShell>
  );
}
