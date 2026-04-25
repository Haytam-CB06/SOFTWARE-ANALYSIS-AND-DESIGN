import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TermsOfServiceProps {
  onBack: () => void;
}

export default function TermsOfService({ onBack }: TermsOfServiceProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('terms.back')}
        </Button>

        <div className="rounded-[28px] border border-border bg-card p-8 shadow-sm">
          <h1 className="text-4xl text-foreground mb-4">{t('terms.title')}</h1>
          <p className="text-muted-foreground mb-8">
            {t('terms.lastUpdated')}
          </p>

          <div className="space-y-8 text-foreground">
            <section>
              <h2 className="text-2xl mb-4">{t('terms.sections.acceptance.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.sections.acceptance.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">{t('terms.sections.service.title')}</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('terms.sections.service.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>{t('terms.sections.service.items.0')}</li>
                <li>{t('terms.sections.service.items.1')}</li>
                <li>{t('terms.sections.service.items.2')}</li>
                <li>{t('terms.sections.service.items.3')}</li>
                <li>{t('terms.sections.service.items.4')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl mb-4">{t('terms.sections.accounts.title')}</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('terms.sections.accounts.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>{t('terms.sections.accounts.items.0')}</li>
                <li>{t('terms.sections.accounts.items.1')}</li>
                <li>{t('terms.sections.accounts.items.2')}</li>
                <li>{t('terms.sections.accounts.items.3')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl mb-4">{t('terms.sections.storage.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.sections.storage.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">{t('terms.sections.use.title')}</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('terms.sections.use.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>{t('terms.sections.use.items.0')}</li>
                <li>{t('terms.sections.use.items.1')}</li>
                <li>{t('terms.sections.use.items.2')}</li>
                <li>{t('terms.sections.use.items.3')}</li>
                <li>{t('terms.sections.use.items.4')}</li>
                <li>{t('terms.sections.use.items.5')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl mb-4">{t('terms.sections.ip.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.sections.ip.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">{t('terms.sections.disclaimer.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.sections.disclaimer.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">{t('terms.sections.liability.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.sections.liability.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">{t('terms.sections.education.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.sections.education.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">{t('terms.sections.modifications.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.sections.modifications.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">{t('terms.sections.changes.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.sections.changes.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">{t('terms.sections.termination.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.sections.termination.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">{t('terms.sections.law.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.sections.law.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">{t('terms.sections.contact.title')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.sections.contact.content')}
              </p>
            </section>

            <section className="border-t border-border pt-8">
              <p className="text-muted-foreground leading-relaxed italic">
                {t('terms.sections.consent')}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
