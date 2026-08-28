import type { Service } from '@/app/lib/services';
import Hero from './Hero';
import TrustStrip from './TrustStrip';
import Reviews from './Reviews';
import Gallery from './Gallery';
import WhyChoose from './WhyChoose';
import CtaBand from './CtaBand';
import VideoSection from './VideoSection';
import FinalLead from './FinalLead';

type Props = { service: Service };

const TRUST_ITEMS = [
  { icon: 'check' as const, label: '25+ Years Experience' },
  { icon: 'check' as const, label: 'Family Owned' },
  { icon: 'check' as const, label: 'Licensed & Insured' },
  { icon: 'card' as const, label: 'Low Interest Financing' },
];

export default function ServiceTemplate({ service }: Props) {
  return (
    <>
      <span id="top" />
      <Hero
        ariaLabel={service.ariaLabel}
        eyebrow={service.heroEyebrow}
        image={service.heroImage}
        imageAlt={service.heroImageAlt}
        heroH1={service.heroH1}
        heroH2={service.heroH2}
        heroFlag={service.heroFlag}
        formId={service.formId}
        serviceName={service.serviceName}
        trustItems={TRUST_ITEMS}
      />
      <TrustStrip />
      <Reviews showVideos />
      <Gallery images={service.gallery} />
      <WhyChoose
        title="WHY CHOOSE E&amp;E"
        id="why-h"
        lead="From layout, tile and fixtures through permits and construction, our team keeps your bathroom remodel coordinated from start to finish. Low interest financing is also available for qualified homeowners who prefer to spread project costs over time."
        features={service.features}
        disclaimer="Financing is subject to credit approval and lender terms. Availability and terms may vary."
        photo={service.crewPhoto}
      />
      <CtaBand
        title={service.ctaBandTitle}
        sub={service.ctaBandSub}
        ariaLabel={`Ready for ${service.label.toLowerCase()}`}
      />
      <VideoSection youtubeId={service.youtubeId} caption={service.videoCaption} title="See Our Work" />
      <FinalLead
        title={service.finalLeadTitle}
        subtitle={service.finalLeadSubtitle}
        formTitle={service.finalLeadFormTitle}
        formId={`${service.formId}-final`}
        serviceName={service.serviceName}
        withMessage
      />
    </>
  );
}
