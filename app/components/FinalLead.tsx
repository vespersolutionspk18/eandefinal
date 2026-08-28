import LeadForm, { PHONE_DISPLAY } from './LeadForm';
import { PHONE_NUMBER } from '@/app/lib/analytics';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  formTitle: string;
  formId: string;
  serviceName: string;
  formNote?: string;
  withMessage?: boolean;
};

export default function FinalLead({ title, subtitle, formTitle, formId, serviceName, formNote = 'Free 3D design · Free quote', withMessage = true }: Props) {
  return (
    <section aria-labelledby="fin-h" className="aa-final">
      <div className="wrap">
        <div className="aa-final-head">
          <h2 className="h2" id="fin-h">{title}</h2>
          <p className="lead">{subtitle}</p>
        </div>
        <div className="form-card" id="quote-final">
          <h2 className="form-title">{formTitle}</h2>
          <LeadForm formId={formId} withMessage={withMessage} serviceName={serviceName} />
          <p className="or-call">
            Or Call <a href={`tel:${PHONE_NUMBER}`}>{PHONE_DISPLAY}</a>
          </p>
          <p className="form-note">{formNote}</p>
        </div>
      </div>
    </section>
  );
}
