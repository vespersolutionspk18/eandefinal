export type Project = {
  slug: string;
  title: string;
  location: string;
  category: 'Whole-Home' | 'Kitchen' | 'Bathroom' | 'Room Addition' | 'Outdoor' | 'Garage';
  blurb: string;
  image: string;
  images: string[];
};

export const PROJECT_CATEGORIES = [
  'Whole-Home',
  'Kitchen',
  'Bathroom',
  'Room Addition',
  'Outdoor',
  'Garage',
] as const;

const KITCHEN_IMAGES = [
  'k1.jpeg', 'k2.jpeg', 'k3.jpeg', 'k4.jpeg', 'k5.jpeg', 'k6.jpeg', 'k7.jpeg', 'k8.jpeg',
  'k9.jpg', 'k10.jpg', 'k11.jpeg', 'k12.jpeg', 'k13.jpg', 'k14.jpg', 'k15.jpg', 'k16.jpg',
  'k17.jpeg', 'k18.jpeg', 'k19.jpg', 'k20.jpg', 'k21.jpg', 'k22.jpg', 'k23.jpg', 'k24.jpg',
  'k25.jpg', 'k26.jpg', 'k27.jpg', 'k28.jpg', 'k29.jpg', 'k30.jpg', 'k31.jpg', 'k32.jpg',
  'k33.jpg', 'k34.jpg', 'k35.jpg', 'k36.jpg', 'k37.jpg', 'k38.jpg', 'k39.jpg',
];

const BATHROOM_IMAGES = [
  'b1.jpeg', 'b2.jpeg', 'b3.jpeg', 'b4.jpeg', 'b5.jpg', 'b6.jpg', 'b7.jpg', 'b8.jpg', 'b9.jpg',
  'b10.jpeg', 'b11.jpeg', 'b12.jpg', 'b13.jpg', 'b14.jpg', 'b15.jpg', 'b16.jpg', 'b17.jpg',
  'b18.jpg', 'b19.jpg', 'b20.jpg', 'b21.jpg', 'b22.jpg', 'b23.jpg', 'b24.jpg', 'b25.jpg',
  'b26.jpg', 'b27.jpg', 'b28.jpg', 'b29.jpg', 'b30.jpg', 'b31.jpg', 'b32.jpeg', 'b33.jpeg',
  'b34.jpeg',
];

const OUTDOOR_IMAGES = [
  'o1.jpg', 'o2.jpeg', 'o3.jpeg', 'o4.jpeg', 'o5.jpeg', 'o6.jpeg', 'o7.jpeg', 'o8.jpeg',
  'o9.jpeg', 'o10.jpg', 'o11.jpg', 'o12.jpg', 'o13.jpg', 'o14.jpg', 'o15.jpg', 'o16.jpg',
  'o17.jpeg', 'o18.jpeg', 'o19.jpeg', 'o20.jpeg', 'o21.jpeg', 'o22.jpeg', 'o23.jpg', 'o24.jpg',
  'o25.jpg', 'o26.jpg', 'o27.jpg', 'o28.jpg', 'o29.jpg', 'o30.jpg',
];

const LAS_CRUCES_IMAGES = Array.from({ length: 13 }, (_, i) => `l${i + 1}.jpg`);
const DE_LA_OSA_IMAGES = [
  'img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg', 'img5.jpg', 'img6.jpg', 'img7.jpg',
  'img8.jpg', 'img9.jpg', 'img10.jpg', 'img11.jpg', 'img12.jpg', 'img13.jpg', 'img14.jpg',
  'img15.jpg', 'img16.jpg', 'img17.jpg', 'img18.jpg', 'img19.jpg', 'img20.jpg', 'img21.jpg',
  'img22.jpg', 'img23.jpg', 'img27.jpg', 'img28.jpg', 'img29.jpg', 'img30.jpg', 'img31.jpg',
  'img32.jpg', 'img33.jpg',
];
const VILLAWOOD_IMAGES = Array.from({ length: 32 }, (_, i) => `v${i + 1}.jpg`);

export const PROJECTS: Project[] = [
  {
    slug: 'de-la-osa-woodland-hills',
    title: 'De La Osa Remodel',
    location: 'Woodland Hills, CA',
    category: 'Whole-Home',
    blurb:
      'A full remodel on De La Osa in Woodland Hills — a whole-home transformation from top to bottom.',
    image: '/projects/de-la-osa/img1.jpg',
    images: DE_LA_OSA_IMAGES.map((f) => `/projects/de-la-osa/${f}`),
  },
  {
    slug: 'las-cruces-st-ventura',
    title: 'Las Cruces Street Remodel',
    location: 'Ventura, CA 93004',
    category: 'Room Addition',
    blurb:
      'A kitchen-and-bath remodel plus room addition on Las Cruces Street in Ventura — fresh, bright, and built to last.',
    image: '/projects/las-cruces/l1.jpg',
    images: LAS_CRUCES_IMAGES.map((f) => `/projects/las-cruces/${f}`),
  },
  {
    slug: 'villawood-cir-calabasas',
    title: 'Villawood Circle Remodel',
    location: 'Calabasas, CA',
    category: 'Garage',
    blurb:
      'A whole-home remodel on Villawood Circle in Calabasas, including a dramatic garage transformation.',
    image: '/projects/villawood/v1.jpg',
    images: VILLAWOOD_IMAGES.map((f) => `/projects/villawood/${f}`),
  },
  {
    slug: 'kitchen-project',
    title: 'Kitchen Remodel Project',
    location: 'Santa Barbara / Ventura',
    category: 'Kitchen',
    blurb: 'Designer kitchen remodels — custom cabinetry, counters, and lighting.',
    image: '/kitchen/projects/k1.jpeg',
    images: KITCHEN_IMAGES.map((f) => `/kitchen/projects/${f}`),
  },
  {
    slug: 'bathroom-project',
    title: 'Bathroom Remodel Project',
    location: 'Santa Barbara / Ventura',
    category: 'Bathroom',
    blurb: 'Beautiful bathroom remodels — tile, fixtures, and finishes done right.',
    image: '/bathroom/projects/b1.jpeg',
    images: BATHROOM_IMAGES.map((f) => `/bathroom/projects/${f}`),
  },
  {
    slug: 'outdoor-project',
    title: 'Outdoor Remodel Project',
    location: 'Santa Barbara / Ventura',
    category: 'Outdoor',
    blurb: 'Outdoor living — patios, hardscapes, and landscapes that shine.',
    image: '/outdoor-projects/o1.jpg',
    images: OUTDOOR_IMAGES.map((f) => `/outdoor-projects/${f}`),
  },
];