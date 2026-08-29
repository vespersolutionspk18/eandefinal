import type { Metadata } from 'next';
import ProjectGallery, { makeProjectMetadata } from '../components/ProjectGallery';
import { LAS_CRUCES_LIVE_IMAGES } from '../lib/live-galleries';

export const metadata: Metadata = makeProjectMetadata({
  title: 'Remodel Las Cruces St, Ventura, CA 93004',
  location: 'Ventura, CA 93004',
  blurb:
    'A kitchen-and-bath remodel plus room addition on Las Cruces Street in Ventura — fresh, bright, and built to last.',
});

export default function Page() {
  return (
    <ProjectGallery
      title="Remodel Las Cruces St, Ventura, CA 93004"
      location="Ventura, CA 93004"
      blurb="A kitchen-and-bath remodel plus room addition on Las Cruces Street in Ventura — fresh, bright, and built to last."
      images={LAS_CRUCES_LIVE_IMAGES}
      formId="r"
      serviceName="Room Addition"
    />
  );
}
