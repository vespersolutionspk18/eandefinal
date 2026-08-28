import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import ServiceTemplate from '../components/ServiceTemplate';
import { getService } from '../lib/services';

const service = getService('bathroom')!;

export const metadata: Metadata = {
  title: 'Bathroom Remodeling Santa Barbara | Free 3D Design | E&E',
  description:
    'Bathroom remodeling in Santa Barbara by E&E Home Remodeling. Free 3D design, design + build under one roof, licensed and insured. Call (805) 590-0908.',
};

export default function Page() {
  return (
    <PageShell active="bathroom">
      <ServiceTemplate service={service} />
    </PageShell>
  );
}
