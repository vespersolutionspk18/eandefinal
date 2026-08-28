import { SERVICE_NAME as BATHROOM_SERVICE_NAME } from './analytics';

export type Service = {
  slug: 'bathroom' | 'kitchen' | 'landscaping' | 'adu' | 'whole-home';
  href: string;
  label: string;
  kicker: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroH1: string;
  heroH2: string;
  heroImage: string;
  heroImageAlt: string;
  heroFlag: string;
  ariaLabel: string;
  highlights: string[];
  intro: string;
  longDescription: string;
  features: { icon: 'star' | 'home' | 'tools' | 'cube' | 'card' | 'leaf' | 'wrench' | 'door' | 'home2' | 'sparkle' | 'shield'; title: string; body: string }[];
  process: { title: string; body: string }[];
  gallery: { src: string; alt: string; cap: string }[];
  youtubeId: string;
  videoCaption: string;
  ctaBandTitle: string;
  ctaBandSub: string;
  finalLeadTitle: string;
  finalLeadSubtitle: string;
  finalLeadFormTitle: string;
  formId: string;
  faqs?: { q: string; a: string }[];
  testimonialName?: string;
  testimonialText?: string;
  testimonialAvatar?: string;
  serviceName: string;
  crewPhoto: { src: string; alt: string };
};

const YOUTUBE_ID = 'Fmvus30M3Mo';

const BATHROOM_FEATURES: Service['features'] = [
  { icon: 'star', title: '25+ Years Experience', body: '25+ years remodeling homes.' },
  { icon: 'home', title: 'Family Owned', body: 'Work directly with our team.' },
  { icon: 'tools', title: 'Design + Build', body: 'Design, permits and construction under one roof.' },
  { icon: 'cube', title: 'Free 3D Design', body: 'Get a free 3D design for your remodel.' },
  { icon: 'card', title: 'Low Interest Financing', body: 'Qualified homeowners can explore low interest financing options to make a larger bathroom remodel easier to plan around a monthly budget. Ask our team about current options and eligibility.' },
];

const KITCHEN_FEATURES: Service['features'] = [
  { icon: 'star', title: '25+ Years Experience', body: '25+ years building kitchens across Ventura and Santa Barbara.' },
  { icon: 'home', title: 'Family Owned', body: 'Work directly with our team — not a call center, not a subcontractor chain.' },
  { icon: 'tools', title: 'Design + Build', body: 'Cabinetry, electrical, plumbing, and finishes all coordinated by one team.' },
  { icon: 'cube', title: 'Free 3D Design', body: 'See cabinetry, counters, lighting, and layout in 3D before we build anything.' },
  { icon: 'card', title: 'Low Interest Financing', body: 'Qualified homeowners can spread kitchen project costs over time. Ask about current options.' },
];

const LANDSCAPING_FEATURES: Service['features'] = [
  { icon: 'leaf', title: 'Hardscape + Softscape', body: 'Pavers, retaining walls, planting, turf, and trees — all designed together.' },
  { icon: 'tools', title: 'Drainage Done Right', body: 'Grading, French drains, and downspout routing that keeps water away from the house.' },
  { icon: 'cube', title: 'Free 3D Design', body: 'See the whole yard in 3D — hardscape, softscape, lighting, and irrigation — before construction.' },
  { icon: 'star', title: '25+ Years Experience', body: '25+ years building yards that survive both summer heat and winter rain.' },
  { icon: 'card', title: 'Low Interest Financing', body: 'Qualified homeowners can explore low interest financing to spread project costs over time.' },
];

const ADU_FEATURES: Service['features'] = [
  { icon: 'home', title: 'Detached ADUs', body: 'New detached units for rental income, family, or a dedicated home office.' },
  { icon: 'tools', title: 'Garage Conversions', body: 'Convert an existing garage into livable space without changing the footprint of the property.' },
  { icon: 'cube', title: 'Free 3D Design', body: 'See the new space, the access, and the layout in 3D before construction starts.' },
  { icon: 'star', title: 'Permits Handled', body: 'We pull the permits, work with the local agency, and make sure Title 24 compliance is covered.' },
  { icon: 'card', title: 'Low Interest Financing', body: 'Qualified homeowners can spread ADU project costs over time. Ask about current options.' },
];

const WHOLE_HOME_FEATURES: Service['features'] = [
  { icon: 'home', title: 'Full-Service Remodel', body: 'Layout, structural, mechanical, kitchens, bathrooms, flooring, paint, and finishes — all under one contract.' },
  { icon: 'tools', title: 'Single Point Of Contact', body: 'One project manager runs the whole job. You are not chasing five different subs.' },
  { icon: 'cube', title: 'Free 3D Design', body: 'See the whole home in 3D before construction starts so the layout, kitchen, and bathrooms all line up.' },
  { icon: 'star', title: '25+ Years Experience', body: 'Whole-home remodels are where experience matters most. We have done this hundreds of times.' },
  { icon: 'card', title: 'Low Interest Financing', body: 'Qualified homeowners can spread project costs over time. Ask about current options.' },
];

export const SERVICES: Service[] = [
  {
    slug: 'bathroom',
    href: '/bathroom-remodeling',
    label: 'Bathroom Remodeling',
    kicker: 'Bathroom Remodeling',
    heroEyebrow: 'Santa Barbara Bathroom Remodeling',
    heroTitle: 'Bathroom Remodeling Santa Barbara',
    heroSubtitle: 'Get a free 3D design for your bathroom remodel.',
    heroH1: 'FREE 3D DESIGN',
    heroH2: 'Get a free 3D design for your remodel.',
    heroImage: '/bathroom/mains/4.jpg',
    heroImageAlt: 'Completed bathroom remodel by E&E Home Remodeling',
    heroFlag: 'GET A FREE 3D DESIGN',
    ariaLabel: 'Bathroom remodeling Santa Barbara, free quote',
    highlights: [
      'Free 3D design for your remodel',
      'Family Owned',
      'Licensed & Insured',
      'Low Interest Financing',
    ],
    intro:
      'Santa Barbara homeowners trust E&E for bathroom remodels that combine thoughtful design with reliable construction. Our team handles layout, tile, plumbing, electrical, and finishes so the project stays coordinated from day one.',
    longDescription:
      'Whether you are refreshing a powder room or reworking a primary suite, our designers and builders work together to plan the layout, choose the right materials, and keep the schedule on track. The same team that draws your 3D design is the team that builds it.',
    features: BATHROOM_FEATURES,
    process: [
      { title: 'Free Consultation', body: 'Walk us through your space, your goals, and your budget. We will talk through what is realistic before you commit to anything.' },
      { title: 'Free 3D Design', body: 'Our designers draft a 3D concept of your new bathroom so you can see the layout, tile, and fixtures before construction starts.' },
      { title: 'Permits & Schedule', body: 'We pull the permits, lock the schedule, and order materials. You get a clear timeline with no surprises.' },
      { title: 'Build & Walkthrough', body: 'Our crew builds the project, protects the rest of your home, and walks you through the finished space at the end.' },
    ],
    gallery: [
      { src: '/bathroom/mains/1.jpg', alt: 'Bathroom remodel by E&E', cap: 'Bathroom remodel - E&E Home Remodeling' },
      { src: '/bathroom/mains/9.jpg', alt: 'Bathroom remodel detail by E&E', cap: 'Bathroom remodel - E&E Home Remodeling' },
      { src: '/bathroom/mains/3.jpg', alt: 'Bathroom project photo by E&E', cap: 'Bathroom remodel - E&E Home Remodeling' },
      { src: '/bathroom/mains/7.jpg', alt: 'Bathroom project photo by E&E', cap: 'Bathroom remodel - E&E Home Remodeling' },
      { src: '/bathroom/mains/2.jpg', alt: 'Bathroom project photo by E&E', cap: 'Bathroom remodel - E&E Home Remodeling' },
      { src: '/bathroom/mains/5.jpg', alt: 'Bathroom project photo by E&E', cap: 'Bathroom remodel - E&E Home Remodeling' },
      { src: '/bathroom/mains/6.jpg', alt: 'Bathroom project photo by E&E', cap: 'Bathroom remodel - E&E Home Remodeling' },
      { src: '/bathroom/mains/4.jpg', alt: 'Bathroom project photo by E&E', cap: 'Bathroom remodel - E&E Home Remodeling' },
      { src: '/bathroom/2a.jpg', alt: 'Bathroom project photo by E&E', cap: 'Bathroom remodel - E&E Home Remodeling' },
    ],
    youtubeId: YOUTUBE_ID,
    videoCaption: 'Bathroom Remodel by E&E Home Remodeling',
    ctaBandTitle: 'Start Your Bathroom Remodel',
    ctaBandSub: 'Start with a free 3D design for your remodel. Low interest financing is available for qualified homeowners.',
    finalLeadTitle: 'Get Your Free Bathroom 3D Design',
    finalLeadSubtitle:
      "Tell us about your bathroom. We'll contact you to discuss your project, create your free 3D design, and walk you through financing options if needed.",
    finalLeadFormTitle: 'GET YOUR FREE 3D DESIGN',
    formId: 'b',
    faqs: [
      { q: 'How long does a bathroom remodel take?', a: 'Most full bathroom remodels take 3 to 6 weeks of active construction after the design and permits are finalized. We share a written schedule before construction starts so you know what to expect.' },
      { q: 'Do you handle permits?', a: 'Yes. Design, permits, and construction all run through our team. We pull the permits with the city or county and coordinate the inspections.' },
      { q: 'Is the 3D design really free?', a: 'Yes. The 3D design is part of our free consultation. You will see layout, tile, fixtures, and finishes in 3D before you commit to a contract.' },
      { q: 'Do you offer financing?', a: 'Qualified homeowners can explore low interest financing options to spread project costs over time. Ask our team about current options and eligibility.' },
    ],
    testimonialName: 'Elba T.',
    testimonialText:
      '“Totally, totally pleased and happy with the final results of my full kitchen remodel and my master bathroom remodel.”',
    testimonialAvatar: '/Elba T.jpg',
    serviceName: BATHROOM_SERVICE_NAME,
    crewPhoto: { src: '/about.jpg', alt: 'E&E Home Remodeling crew' },
  },
  {
    slug: 'kitchen',
    href: '/kitchen-remodeling',
    label: 'Kitchen Remodeling',
    kicker: 'Kitchen Remodeling',
    heroEyebrow: 'Santa Barbara & Ventura Kitchen Remodeling',
    heroTitle: 'Kitchen Remodeling Ventura & Santa Barbara',
    heroSubtitle: 'Get a free 3D design for your kitchen remodel.',
    heroH1: 'FREE 3D DESIGN',
    heroH2: 'Get a free 3D design for your remodel.',
    heroImage: '/kitchen/2o-v2.jpg',
    heroImageAlt: 'Completed kitchen remodel by E&E Home Remodeling',
    heroFlag: 'GET A FREE 3D DESIGN',
    ariaLabel: 'Kitchen remodeling Ventura & Santa Barbara, free quote',
    highlights: [
      'Free 3D design for your remodel',
      'Family Owned',
      'Licensed & Insured',
      'Low Interest Financing',
    ],
    intro:
      'A good kitchen remodel is more than new cabinets. It is the right work triangle, the right lighting, enough storage, and a layout that actually fits how your family uses the space.',
    longDescription:
      'Our designers and builders plan your kitchen together so the cabinetry, electrical, plumbing, and finishes all line up. You see the whole kitchen in 3D before construction starts, and the same team that drew the design is the team that builds it.',
    features: KITCHEN_FEATURES,
    process: [
      { title: 'Free Consultation', body: 'Walk us through your kitchen, your cooking style, and your budget. We will tell you what is realistic for the space before you commit.' },
      { title: 'Free 3D Design', body: 'We draft a 3D design of your new kitchen so you can review cabinetry, counters, lighting, and layout together.' },
      { title: 'Permits & Schedule', body: 'We pull permits, finalize materials, and lock the schedule so you know exactly when work starts and ends.' },
      { title: 'Build & Walkthrough', body: 'Our crew builds the kitchen, protects the rest of your home, and walks you through every detail at completion.' },
    ],
    gallery: [
      { src: '/kitchen/2o-v2.jpg', alt: 'Kitchen remodel by E&E', cap: 'Kitchen remodel - E&E Home Remodeling' },
      { src: '/kitchen/1o.jpg', alt: 'Kitchen remodel detail by E&E', cap: 'Kitchen remodel - E&E Home Remodeling' },
      { src: '/kitchen/2a.jpg', alt: 'Kitchen project photo by E&E', cap: 'Kitchen remodel - E&E Home Remodeling' },
      { src: '/kitchen/2b.jpg', alt: 'Kitchen project photo by E&E', cap: 'Kitchen remodel - E&E Home Remodeling' },
      { src: '/kitchen/2c.jpg', alt: 'Kitchen project photo by E&E', cap: 'Kitchen remodel - E&E Home Remodeling' },
      { src: '/kitchen/2d.jpg', alt: 'Kitchen project photo by E&E', cap: 'Kitchen remodel - E&E Home Remodeling' },
      { src: '/kitchen/2e.jpg', alt: 'Kitchen project photo by E&E', cap: 'Kitchen remodel - E&E Home Remodeling' },
      { src: '/kitchen/o.jpg', alt: 'Kitchen project photo by E&E', cap: 'Kitchen remodel - E&E Home Remodeling' },
      { src: '/kitchen/c1.jpg', alt: 'Kitchen project photo by E&E', cap: 'Kitchen remodel - E&E Home Remodeling' },
    ],
    youtubeId: YOUTUBE_ID,
    videoCaption: 'Kitchen Remodel by E&E Home Remodeling',
    ctaBandTitle: 'Start Your Kitchen Remodel',
    ctaBandSub: 'Start with a free 3D design for your remodel. Low interest financing is available for qualified homeowners.',
    finalLeadTitle: 'Get Your Free Kitchen 3D Design',
    finalLeadSubtitle:
      "Tell us about your kitchen. We'll contact you to discuss your project, create your free 3D design, and walk you through financing options if needed.",
    finalLeadFormTitle: 'GET YOUR FREE 3D DESIGN',
    formId: 'k',
    faqs: [
      { q: 'How long does a kitchen remodel take?', a: 'A typical full kitchen remodel runs 6 to 10 weeks of active construction after design and permits. We give you a written schedule up front so you can plan around it.' },
      { q: 'Can you change the kitchen layout?', a: 'Yes. We move walls, rework the work triangle, relocate plumbing and electrical, and handle the permits. All in-house.' },
      { q: 'Do I get to see the design before construction?', a: 'Yes. The free 3D design is part of every project. You see cabinetry, counters, lighting, and layout in 3D before we build anything.' },
      { q: 'Do you offer financing?', a: 'Qualified homeowners can explore low interest financing. Ask our team about current options and eligibility.' },
    ],
    testimonialName: 'Noam N.',
    testimonialText:
      '“I cannot say enough about the quality, timely manner, communication and organization Ezra\'s crew provided in our project”',
    testimonialAvatar: '/review1 (Noam N.).jpg',
    serviceName: 'Kitchen Remodel',
    crewPhoto: { src: '/about.jpg', alt: 'E&E Home Remodeling crew' },
  },
  {
    slug: 'landscaping',
    href: '/landscaping',
    label: 'Landscaping',
    kicker: 'Landscaping',
    heroEyebrow: 'Santa Barbara & Ventura Landscaping',
    heroTitle: 'Landscaping Ventura & Santa Barbara',
    heroSubtitle: 'Get a free 3D design for your yard.',
    heroH1: 'FREE 3D DESIGN',
    heroH2: 'Get a free 3D design for your remodel.',
    heroImage: '/landscaping/1.jpg',
    heroImageAlt: 'Landscaping project by E&E Home Remodeling',
    heroFlag: 'GET A FREE 3D DESIGN',
    ariaLabel: 'Landscaping Ventura & Santa Barbara, free quote',
    highlights: [
      'Free 3D design for your yard',
      'Family Owned',
      'Licensed & Insured',
      'Low Interest Financing',
    ],
    intro:
      'A good yard is not just plants. It is grading, drainage, lighting, irrigation, and hardscape that all work together — and a team that thinks about all of it before the first shovel hits the dirt.',
    longDescription:
      'From front-yard makeovers to full backyard builds, our team handles grading, drainage, irrigation, lighting, planting, and hardscape. We plan the whole project in 3D so you can see how the space will look and how it will be used before construction starts.',
    features: LANDSCAPING_FEATURES,
    process: [
      { title: 'Site Walk', body: 'We walk the property with you, talk through how you want to use the space, and flag any grading or drainage issues up front.' },
      { title: 'Free 3D Design', body: 'You get a 3D design that shows hardscape, softscape, lighting, and irrigation so you can see the whole project before construction.' },
      { title: 'Permits & Schedule', body: 'We pull any required permits and lock a written schedule so you know exactly when each phase happens.' },
      { title: 'Build & Walkthrough', body: 'Our crew handles grading, drainage, hardscape, planting, lighting, and irrigation — and walks you through the finished yard at the end.' },
    ],
    gallery: [
      { src: '/landscaping/1.jpg', alt: 'Landscaping project by E&E', cap: 'Landscaping - E&E Home Remodeling' },
      { src: '/landscaping/1a.jpg', alt: 'Landscaping project detail by E&E', cap: 'Landscaping - E&E Home Remodeling' },
      { src: '/landscaping/1c.jpg', alt: 'Landscaping project photo by E&E', cap: 'Landscaping - E&E Home Remodeling' },
      { src: '/landscaping/1d.jpg', alt: 'Landscaping project photo by E&E', cap: 'Landscaping - E&E Home Remodeling' },
      { src: '/landscaping/b1.jpg', alt: 'Landscaping project photo by E&E', cap: 'Landscaping - E&E Home Remodeling' },
      { src: '/landscaping/b2.jpg', alt: 'Landscaping project photo by E&E', cap: 'Landscaping - E&E Home Remodeling' },
      { src: '/landscaping/1.jpg', alt: 'Landscaping project photo by E&E', cap: 'Landscaping - E&E Home Remodeling' },
      { src: '/landscaping/1a.jpg', alt: 'Landscaping project photo by E&E', cap: 'Landscaping - E&E Home Remodeling' },
      { src: '/landscaping/1c.jpg', alt: 'Landscaping project photo by E&E', cap: 'Landscaping - E&E Home Remodeling' },
    ],
    youtubeId: YOUTUBE_ID,
    videoCaption: 'Landscaping by E&E Home Remodeling',
    ctaBandTitle: 'Start Your Landscaping Project',
    ctaBandSub: 'Start with a free 3D design for your yard. Low interest financing is available for qualified homeowners.',
    finalLeadTitle: 'Get Your Free Landscaping 3D Design',
    finalLeadSubtitle:
      "Tell us about your yard. We'll contact you to discuss your project, create your free 3D design, and walk you through financing options if needed.",
    finalLeadFormTitle: 'GET YOUR FREE 3D DESIGN',
    formId: 'l',
    faqs: [
      { q: 'Do you handle drainage?', a: 'Yes. Grading, French drains, and downspout routing are part of every project we build. They are also the part most landscapers skip, so we plan for it up front.' },
      { q: 'Do you do lighting and irrigation?', a: 'Yes. Low-voltage lighting and smart irrigation are planned into the design so they are not an afterthought.' },
      { q: 'How long does a landscaping project take?', a: 'Most projects run 2 to 6 weeks depending on scope. Hardscape-heavy projects take longer than softscape refreshes.' },
      { q: 'Do you offer financing?', a: 'Qualified homeowners can explore low interest financing. Ask our team about current options and eligibility.' },
    ],
    testimonialName: 'Ida A.',
    testimonialText:
      "\u201cTheir crew was on time, professional and punctual. We can't express how thrilled we are with the results. !\u201d",
    testimonialAvatar: '/IDA A.jpg',
    serviceName: 'Landscaping',
    crewPhoto: { src: '/about.jpg', alt: 'E&E Home Remodeling crew' },
  },
  {
    slug: 'adu',
    href: '/adu-garage-conversion',
    label: 'ADU / Garage Conversion',
    kicker: 'ADU / Garage Conversion',
    heroEyebrow: 'Santa Barbara & Ventura ADU Builders',
    heroTitle: 'ADU & Garage Conversion Ventura & Santa Barbara',
    heroSubtitle: 'Get a free 3D design for your ADU or garage conversion.',
    heroH1: 'FREE 3D DESIGN',
    heroH2: 'Get a free 3D design for your remodel.',
    heroImage: '/adu/a5o.jpg',
    heroImageAlt: 'ADU & garage conversion project by E&E Home Remodeling',
    heroFlag: 'GET A FREE 3D DESIGN',
    ariaLabel: 'ADU & garage conversion Ventura & Santa Barbara, free quote',
    highlights: [
      'Free 3D design for your project',
      'Family Owned',
      'Licensed & Insured',
      'Low Interest Financing',
    ],
    intro:
      'An ADU is one of the smartest ways to add space, value, and flexibility to a property. Whether it is a detached unit, a garage conversion, or a room addition, the same team handles the design, the permits, and the build.',
    longDescription:
      'ADU projects in California come with a specific set of rules — setbacks, parking, Title 24, utility connections, and local agency review. Our team has worked through these rules in Ventura, Santa Barbara, and the San Fernando Valley, and we plan the project so the permit path is clear before construction starts.',
    features: ADU_FEATURES,
    process: [
      { title: 'Free Consultation', body: 'We look at the lot, the existing structures, the setbacks, and the local rules to confirm what is buildable before you commit.' },
      { title: 'Free 3D Design', body: 'You get a 3D design that shows the new space, the access, the layout, and how it connects to the existing home.' },
      { title: 'Permits', body: 'We prepare the permit set, work with the local agency, and answer plan check comments until the permit is issued.' },
      { title: 'Build & Inspect', body: 'Our crew builds the project, schedules the inspections, and walks you through the finished space at the end.' },
    ],
    gallery: [
      { src: '/adu/o.jpg', alt: 'ADU project by E&E Home Remodeling', cap: 'ADU / Garage Conversion - E&E Home Remodeling' },
      { src: '/adu/1o.jpg', alt: 'ADU project by E&E Home Remodeling', cap: 'ADU / Garage Conversion - E&E Home Remodeling' },
      { src: '/adu/2o.jpg', alt: 'Garage conversion by E&E Home Remodeling', cap: 'ADU / Garage Conversion - E&E Home Remodeling' },
      { src: '/adu/3o.jpg', alt: 'ADU project by E&E Home Remodeling', cap: 'ADU / Garage Conversion - E&E Home Remodeling' },
      { src: '/adu/4o.jpg', alt: 'Garage conversion by E&E Home Remodeling', cap: 'ADU / Garage Conversion - E&E Home Remodeling' },
      { src: '/adu/5o.jpg', alt: 'ADU project by E&E Home Remodeling', cap: 'ADU / Garage Conversion - E&E Home Remodeling' },
      { src: '/adu/a1o.jpg', alt: 'ADU interior by E&E Home Remodeling', cap: 'ADU / Garage Conversion - E&E Home Remodeling' },
      { src: '/adu/a2o.jpg', alt: 'ADU interior by E&E Home Remodeling', cap: 'ADU / Garage Conversion - E&E Home Remodeling' },
      { src: '/adu/a3o.jpg', alt: 'ADU project by E&E Home Remodeling', cap: 'ADU / Garage Conversion - E&E Home Remodeling' },
    ],
    youtubeId: YOUTUBE_ID,
    videoCaption: 'ADU Project by E&E Home Remodeling',
    ctaBandTitle: 'Start Your ADU Project',
    ctaBandSub: 'Start with a free 3D design for your ADU. Low interest financing is available for qualified homeowners.',
    finalLeadTitle: 'Get Your Free ADU 3D Design',
    finalLeadSubtitle:
      "Tell us about your property. We'll contact you to discuss feasibility, design, and the permit path for your ADU or garage conversion.",
    finalLeadFormTitle: 'GET YOUR FREE 3D DESIGN',
    formId: 'a',
    faqs: [
      { q: 'How long does an ADU permit take?', a: 'Most California jurisdictions are required to approve ADU permits within 60 days. Our team plans the project so the permit path is clear before construction starts.' },
      { q: 'Can I rent out the ADU?', a: 'Yes, in most cases. We will walk you through the local rules, the utility considerations, and the property tax implications during the consultation.' },
      { q: 'Do you handle Title 24?', a: 'Yes. Title 24 energy compliance is built into every design so the project passes inspection the first time.' },
      { q: 'Do you offer financing?', a: 'Qualified homeowners can explore low interest financing. Ask our team about current options and eligibility.' },
    ],
    testimonialName: 'John R.',
    testimonialText:
      '“Ezra with E&E home remodeling did a fantastic job that was way over our expectations with our kitchen & Bathroom remodel project!”',
    testimonialAvatar: '/John R.jpg',
    serviceName: 'ADU / Garage Conversion',
    crewPhoto: { src: '/about.jpg', alt: 'E&E Home Remodeling crew' },
  },
  {
    slug: 'whole-home',
    href: '/whole-home-remodeling',
    label: 'Whole-Home Remodeling',
    kicker: 'Whole-Home Remodeling',
    heroEyebrow: 'Santa Barbara & Ventura Whole-Home Remodeling',
    heroTitle: 'Whole-Home Remodeling Ventura & Santa Barbara',
    heroSubtitle: 'Get a free 3D design for your whole-home remodel.',
    heroH1: 'FREE 3D DESIGN',
    heroH2: 'Get a free 3D design for your remodel.',
    heroImage: '/fullhome/1o.jpg',
    heroImageAlt: 'Whole-home remodel by E&E Home Remodeling',
    heroFlag: 'GET A FREE 3D DESIGN',
    ariaLabel: 'Whole-home remodeling Ventura & Santa Barbara, free quote',
    highlights: [
      'Free 3D design for your remodel',
      'Family Owned',
      'Licensed & Insured',
      'Low Interest Financing',
    ],
    intro:
      'A whole-home remodel is the most complex project a homeowner can take on. The difference between a good experience and a painful one is coordination — design, permits, structural, mechanical, and finish trades all on the same schedule.',
    longDescription:
      'Our team plans the whole project before construction starts. Layout, structural, electrical, plumbing, kitchens, bathrooms, flooring, paint, and finishes are sequenced so the project flows instead of stalling. You have one point of contact for the entire build.',
    features: WHOLE_HOME_FEATURES,
    process: [
      { title: 'Free Consultation', body: 'We walk the home, talk through how you live, and put together a realistic scope and budget before you commit to anything.' },
      { title: 'Free 3D Design', body: 'Layout, structural, kitchen, bathrooms, and finishes are designed together so the project makes sense as a whole.' },
      { title: 'Permits & Schedule', body: 'We pull the permits, lock a written schedule, and order materials so the project flows from phase to phase.' },
      { title: 'Build & Walkthrough', body: 'Our crew runs the whole project, protects the rest of the home, and walks you through every detail at completion.' },
    ],
    gallery: [
      { src: '/fullhome/1o.jpg', alt: 'Whole-home remodel by E&E', cap: 'Whole-home remodel - E&E Home Remodeling' },
      { src: '/fullhome/2o.jpg', alt: 'Whole-home remodel by E&E', cap: 'Whole-home remodel - E&E Home Remodeling' },
      { src: '/fullhome/3o.jpg', alt: 'Whole-home remodel by E&E', cap: 'Whole-home remodel - E&E Home Remodeling' },
      { src: '/fullhome/4o.jpg', alt: 'Whole-home remodel by E&E', cap: 'Whole-home remodel - E&E Home Remodeling' },
      { src: '/fullhome/5o.jpg', alt: 'Whole-home remodel by E&E', cap: 'Whole-home remodel - E&E Home Remodeling' },
      { src: '/fullhome/6o.jpg', alt: 'Whole-home remodel by E&E', cap: 'Whole-home remodel - E&E Home Remodeling' },
      { src: '/fullhome/7o.jpg', alt: 'Whole-home remodel by E&E', cap: 'Whole-home remodel - E&E Home Remodeling' },
      { src: '/fullhome/8o.jpg', alt: 'Whole-home remodel by E&E', cap: 'Whole-home remodel - E&E Home Remodeling' },
      { src: '/fullhome/9o.jpg', alt: 'Whole-home remodel by E&E', cap: 'Whole-home remodel - E&E Home Remodeling' },
    ],
    youtubeId: YOUTUBE_ID,
    videoCaption: 'Whole-Home Remodel by E&E Home Remodeling',
    ctaBandTitle: 'Start Your Whole-Home Remodel',
    ctaBandSub: 'Start with a free 3D design for your remodel. Low interest financing is available for qualified homeowners.',
    finalLeadTitle: 'Get Your Free Whole-Home 3D Design',
    finalLeadSubtitle:
      "Tell us about your home. We'll contact you to discuss your goals, design the whole project in 3D, and walk you through financing options.",
    finalLeadFormTitle: 'GET YOUR FREE 3D DESIGN',
    formId: 'w',
    faqs: [
      { q: 'How long does a whole-home remodel take?', a: 'A whole-home remodel typically runs 4 to 9 months depending on scope. We give you a written schedule up front so you can plan around it.' },
      { q: 'Do I need to move out?', a: 'For most full-home remodels, yes — at least during the heavy structural and mechanical phases. We will walk you through the options during the consultation.' },
      { q: 'Who handles the design?', a: 'Our in-house team. You get a 3D design of the whole home before construction starts so the layout, kitchen, and bathrooms all line up.' },
      { q: 'Do you offer financing?', a: 'Qualified homeowners can explore low interest financing. Ask our team about current options and eligibility.' },
    ],
    testimonialName: 'Rita L.',
    testimonialText:
      '“I have to say these guys really nailed it. They were polite and cleaned up before they left.”',
    testimonialAvatar: '/Rita L.jpg',
    serviceName: 'Whole-Home Remodel',
    crewPhoto: { src: '/about.jpg', alt: 'E&E Home Remodeling crew' },
  },
];

export function getService(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}
