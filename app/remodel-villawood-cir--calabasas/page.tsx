import type { Metadata } from 'next';
import ProjectGallery, { makeProjectMetadata } from '../components/ProjectGallery';
import { VILLAWOOD_LIVE_IMAGES } from '../lib/live-galleries';

export const metadata: Metadata = makeProjectMetadata({
  title: 'Remodel Villawood Cir, Calabasas',
  location: 'Calabasas, CA',
  blurb:
    'A whole-home remodel on Villawood Circle in Calabasas — including a dramatic garage transformation and a Mediterranean outdoor living space with pool.',
});

export default function Page() {
  return (
    <ProjectGallery
      title="Remodel Villawood Cir, Calabasas"
      location="Calabasas, CA"
      blurb="A whole-home remodel on Villawood Circle in Calabasas — including a dramatic garage transformation and a Mediterranean outdoor living space with pool."
      images={VILLAWOOD_LIVE_IMAGES}
      formId="w"
      serviceName="Whole-Home Remodel"
    />
  );
}
