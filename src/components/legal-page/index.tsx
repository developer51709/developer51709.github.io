import { ReactNode } from 'react';
import { FaArrowRight, FaFileContract, FaShieldAlt } from 'react-icons/fa';

export interface LegalSection {
  heading: string;
  body?: string;
  list?: string[];
}

export interface LegalDocument {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

export const TERMS_DOC: LegalDocument = {
  title: 'Terms of Service',
  updated: 'September 6, 2026',
  intro:
    'These terms govern all commission work requested through this website — including Discord bot development, website design, backend development, and bug fixes. By requesting or accepting a commission, you agree to these terms.',
  sections: [
    {
      heading: '1. Quotes & Estimates',
      body: 'Prices shown on the commissions page are starting-point estimates in USD. The final price is confirmed in a written quote before any work begins. Quotes are valid for 14 days and may change if the scope changes after work starts.',
    },
    {
      heading: '2. Payment',
      body: 'Unless agreed otherwise, payment is split: 50% upfront to begin work and 50% on delivery. Payments are accepted in crypto (via OxaPay) or by any method agreed in writing. Once work begins, the upfront payment is non-refundable, except where noted under Cancellation.',
    },
    {
      heading: '3. Discord Bot Hosting & Updates',
      body: 'The optional $10/month plan covers full hosting, uptime monitoring, and regular updates for the delivered bot. It is billed month-to-month and can be cancelled anytime with 7 days notice. Hosting depends on third-party infrastructure, so guaranteed uptime cannot be promised.',
    },
    {
      heading: '4. Scope & Revisions',
      body: 'Every commission includes two rounds of revisions on the agreed scope. Feature requests that go beyond the original scope are quoted separately before being added.',
    },
    {
      heading: '5. Delivery Timeline',
      body: 'Estimated timelines are given at quote time and communicated as the project progresses. Delays may occur; you will be informed as soon as possible. Timelines are estimates, not guarantees.',
    },
    {
      heading: '6. Client Responsibilities',
      body: 'You agree to provide any access, credentials, or assets needed for the work, to test deliverables in a reasonable timeframe, and to respond to questions within a few days so the project can move forward.',
    },
    {
      heading: '7. Intellectual Property',
      body: 'Once final payment is received, you own the rights to the specific deliverable (bot code, website, or backend built for you). Generic code, libraries, and techniques developed during the project remain reusable by me for other work. Attribution is appreciated but not required.',
    },
    {
      heading: '8. Warranty & Support',
      body: 'Delivered work includes a 30-day warranty covering bugs reported in the delivered scope — fixed free of charge. Work beyond the warranty is quoted as a new commission (see Bug Fixes pricing).',
    },
    {
      heading: '9. Liability',
      body: 'All work is provided "as is". I am not liable for indirect or consequential damages, and liability is limited to the amount paid for the specific commission. I am not responsible for outages or changes caused by third-party platforms (Discord, hosting providers, APIs).',
    },
    {
      heading: '10. Cancellation & Refunds',
      body: 'Either party may cancel a commission with written notice. If work is cancelled after it has begun, you pay for work completed up to the cancellation point. The upfront payment covers this; a refund of any unused balance may be issued at my discretion.',
    },
    {
      heading: '11. Changes to These Terms',
      body: 'These terms may be updated as needed. Updated terms apply to commissions started after the change date.',
    },
    {
      heading: '12. Contact',
      body: 'Questions about these terms? Reach out through Discord or email — contact details are on the commissions page.',
    },
  ],
};

export const PRIVACY_DOC: LegalDocument = {
  title: 'Privacy Policy',
  updated: 'September 6, 2026',
  intro:
    'This policy explains what information is collected when you visit this website or request a commission, and how it is used. It applies specifically to the commissions and services offered through this site.',
  sections: [
    {
      heading: '1. Information You Provide',
      body: 'When you request a commission, you may provide:',
      list: [
        'Your name or username',
        'A contact method (Discord username or email address)',
        'Details about your project, requirements, and any assets you share',
      ],
    },
    {
      heading: '2. Payment Information',
      body: 'Payments are processed through OxaPay (for crypto) or another agreed processor. Card or wallet details are handled entirely by the payment processor — this site never sees or stores them.',
    },
    {
      heading: '3. Automatic Data (Analytics)',
      body: 'This site uses Google Analytics to understand general visitor behaviour. It collects non-identifying data such as pages visited, approximate location, device and browser type. No personal identifiers are used.',
    },
    {
      heading: '4. How Your Information Is Used',
      body: 'Your information is used only to:',
      list: [
        'Respond to commission requests and provide quotes',
        'Deliver the requested work and communicate about it',
        'Improve this website',
      ],
    },
    {
      heading: '5. Sharing',
      body: 'Your information is never sold. It is shared only with the service providers needed to complete your request (such as the payment processor) or where required by law.',
    },
    {
      heading: '6. Data Retention',
      body: 'Conversation and project details are kept while the commission is active and for a reasonable period afterward for record-keeping. You can ask for your data to be deleted at any time.',
    },
    {
      heading: '7. Your Rights',
      body: 'You may request access to, correction of, or deletion of your personal data at any time by contacting me through Discord or email.',
    },
    {
      heading: '8. Changes to This Policy',
      body: 'This policy may be updated as needed. Changes are reflected here with a new "last updated" date.',
    },
    {
      heading: '9. Contact',
      body: 'Privacy questions? Reach out through Discord or email — contact details are on the commissions page.',
    },
  ],
};

interface LegalPageProps {
  document: LegalDocument;
  onBack: () => void;
}

const LEGAL_META: Record<string, { icon: ReactNode; accent: string }> = {
  'Terms of Service': {
    icon: <FaFileContract className="text-2xl text-primary" />,
    accent: 'bg-primary/10 border-primary/30',
  },
  'Privacy Policy': {
    icon: <FaShieldAlt className="text-2xl text-success" />,
    accent: 'bg-success/10 border-success/30',
  },
};

const LegalPage = ({ document, onBack }: LegalPageProps) => {
  const meta = LEGAL_META[document.title] ?? LEGAL_META['Terms of Service'];

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="btn btn-ghost btn-sm text-base-content/60 mb-6"
      >
        <FaArrowRight className="w-4 h-4 rotate-180" /> Back
      </button>

      <div className="card card-body shadow-xl p-6 sm:p-10">
        <div className="flex items-center gap-4 mb-6">
          <div
            className={`flex items-center justify-center w-14 h-14 rounded-2xl border ${meta.accent} flex-shrink-0`}
          >
            {meta.icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-base-content">
              {document.title}
            </h1>
            <p className="text-xs text-base-content/50 mt-0.5">
              Last updated: {document.updated}
            </p>
          </div>
        </div>

        <p className="text-sm text-base-content/70 leading-relaxed mb-8">
          {document.intro}
        </p>

        <div className="space-y-7">
          {document.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-semibold text-base-content text-sm mb-2">
                {section.heading}
              </h2>
              {section.body && (
                <p className="text-xs text-base-content/65 leading-relaxed">
                  {section.body}
                </p>
              )}
              {section.list && (
                <ul className="space-y-1.5 text-xs text-base-content/65 leading-relaxed list-disc pl-4 mt-2">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LegalPage;