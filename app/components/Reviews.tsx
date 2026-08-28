import ReviewAvatar from './ReviewAvatar';
import YouTubeFacade from './YouTubeFacade';

type Review = {
  initial: string;
  name: string;
  avatar: string;
  text: string;
};

const REVIEWS: Review[] = [
  {
    initial: 'N',
    name: 'Noam N.',
    avatar: '/review1 (Noam N.).jpg',
    text: '\u201cI cannot say enough about the quality, timely manner, communication and organization Ezra\'s crew provided in our project\u201d',
  },
  {
    initial: 'E',
    name: 'Elba T.',
    avatar: '/Elba T.jpg',
    text: '\u201cTotally, totally pleased and happy with the final results of my full kitchen remodel and my master bathroom remodel.\u201d',
  },
  {
    initial: 'J',
    name: 'John R.',
    avatar: '/John R.jpg',
    text: '\u201cEzra with E&E home remodeling did a fantastic job that was way over our expectations with our kitchen & Bathroom remodel project!\u201d',
  },
  {
    initial: 'R',
    name: 'Rita L.',
    avatar: '/Rita L.jpg',
    text: '\u201cI have to say these guys really nailed it. They were polite and cleaned up before they left.\u201d',
  },
  {
    initial: 'I',
    name: 'Ida A.',
    avatar: '/IDA A.jpg',
    text: "\u201cTheir crew was on time, professional and punctual. We can't express how thrilled we are with the results. !\u201d",
  },
];

function Star() {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24">
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01Z" />
    </svg>
  );
}

function Stars() {
  return (
    <div aria-label="5 star review" className="stars">
      <Star />
      <Star />
      <Star />
      <Star />
      <Star />
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="rev-card">
      <div className="rev-head">
        <div className="rev-avatar">
          <span>{review.initial}</span>
          <ReviewAvatar name={review.name} src={review.avatar} />
        </div>
        <div className="rev-meta">
          <p className="rev-by">{review.name}</p>
          <p className="rev-place">Yelp review</p>
          <Stars />
        </div>
      </div>
      <p className="rev-text">{review.text}</p>
    </article>
  );
}

const VIDEO_TESTIMONIALS = [
  { id: 'cG1DByNcoNk', name: 'Michael', place: 'Calabasas' },
  { id: 'h8vP0XyMHww', name: 'Susan', place: 'Santa Clarita' },
  { id: 'cTp80R6Xt1Y', name: 'Tom', place: 'Moorpark' },
  { id: 'pUZiBB6dxHk', name: 'Lazar', place: 'Burbank' },
  { id: 'VqLbI0dtd5k', name: 'Neil', place: 'Camarillo' },
  { id: 'X0YNR38myPU', name: 'Marlin', place: 'Thousand Oaks' },
];

const LOGOS = [
  { src: 'https://irp.cdn-website.com/0a33985f/dms3rep/multi/opt/AB_logo_270x103-640w.png', alt: 'AB Builders' },
  { src: 'https://irp.cdn-website.com/0a33985f/dms3rep/multi/opt/houzz-d58fe72e-640w-640w-removebg-preview-640w.png', alt: 'Houzz' },
  { src: 'https://irp.cdn-website.com/0a33985f/dms3rep/multi/opt/Westfield_Topanga_logo.svg-640w-removebg-preview-640w.png', alt: 'Westfield Topanga' },
  { src: 'https://irp.cdn-website.com/0a33985f/dms3rep/multi/opt/5-Star-Yelp-Review-TruSelf-Sporting-Club-image-640w.png', alt: '5-Star Yelp Review' },
  { src: 'https://irp.cdn-website.com/0a33985f/dms3rep/multi/opt/DeltaLogo_RGB_black_tag_opt-640w.png', alt: 'Delta' },
  { src: 'https://irp.cdn-website.com/0a33985f/dms3rep/multi/thm-logo.svg', alt: 'THM' },
];

export default function Reviews({ showVideos = false }: { showVideos?: boolean }) {
  return (
    <section aria-labelledby="rev-h" className="review-sec">
      <div className="wrap">
        <div className="review-headline">
          <div>
            <h2 className="h2" id="rev-h">HOMEOWNERS LOVE US</h2>
          </div>
          <span
            aria-label="4.7 on Yelp, 77 reviews"
            className="review-yelp"
          >
            ★★★★★ 4.7 ON YELP · 77 REVIEWS
          </span>
        </div>
        {showVideos && (
          <div className="vt-grid">
            {VIDEO_TESTIMONIALS.map((v) => (
              <figure className="vt-card" key={v.id}>
                <YouTubeFacade
                  id={v.id}
                  title={`Video testimonial from ${v.name} in ${v.place}`}
                />
                <figcaption className="vt-cap">
                  <strong>{v.name}</strong> · {v.place}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
        <div className="rev-grid">
          {REVIEWS.map((r) => (
            <ReviewCard key={r.name} review={r} />
          ))}
        </div>
        <div aria-label="Houzz credentials" className="houzz-proof">
          <div className="houzz-proof-copy">
            <span className="houzz-proof-kicker">HOUZZ RECOGNITION</span>
            <h3>Recognized on Houzz</h3>
            <p>
              Best of Houzz Service recognition for 2023 and 2024, plus Houzz profile badges that
              reflect customer engagement with our work.
            </p>
          </div>
          <div className="houzz-proof-images">
            <figure className="houzz-proof-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Houzz Best of Service 2023" src="/houzz-best-2023.png" />
            </figure>
            <figure className="houzz-proof-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Houzz Best of Service 2024" src="/houzz-best-2024.png" />
            </figure>
          </div>
        </div>
        <div className="logos">
          {LOGOS.map((logo) => (
            <div className="logo-item" key={logo.src}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={logo.alt} loading="lazy" src={logo.src} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
