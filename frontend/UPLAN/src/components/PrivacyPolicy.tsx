import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  const { t } = useTranslation();

  const renderList = (key: string) =>
    (t(key, { returnObjects: true }) as string[]).map((item, i) => (
      <li key={i}>{item}</li>
    ));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('privacyPolicy.back')}
        </Button>

        <div className="rounded-[28px] border border-border bg-card p-8 shadow-sm">
          <h1 className="text-4xl text-foreground mb-4">
            {t('privacyPolicy.title')}
          </h1>

          <p className="text-muted-foreground mb-8">
            {t('privacyPolicy.lastUpdated')}
          </p>

          <div className="space-y-8 text-foreground">

            {/* 1 */}
            <section>
              <h2 className="text-2xl mb-4">
                {t('privacyPolicy.sections.introduction.title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('privacyPolicy.sections.introduction.content')}
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-2xl mb-4">
                {t('privacyPolicy.sections.informationWeCollect.title')}
              </h2>

              <h3 className="text-xl mb-3 mt-4">
                {t('privacyPolicy.sections.informationWeCollect.personalInfo.title')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('privacyPolicy.sections.informationWeCollect.personalInfo.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                {renderList('privacyPolicy.sections.informationWeCollect.personalInfo.items')}
              </ul>

              <h3 className="text-xl mb-3 mt-6">
                {t('privacyPolicy.sections.informationWeCollect.studyInfo.title')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('privacyPolicy.sections.informationWeCollect.studyInfo.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                {renderList('privacyPolicy.sections.informationWeCollect.studyInfo.items')}
              </ul>

              <h3 className="text-xl mb-3 mt-6">
                {t('privacyPolicy.sections.informationWeCollect.usageData.title')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('privacyPolicy.sections.informationWeCollect.usageData.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                {renderList('privacyPolicy.sections.informationWeCollect.usageData.items')}
              </ul>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-2xl mb-4">
                {t('privacyPolicy.sections.storage.title')}
              </h2>
              <p className="text-muted-foreground mb-4">
                {t('privacyPolicy.sections.storage.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                {renderList('privacyPolicy.sections.storage.items')}
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-2xl mb-4">
                {t('privacyPolicy.sections.usage.title')}
              </h2>
              <p className="text-muted-foreground mb-4">
                {t('privacyPolicy.sections.usage.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                {renderList('privacyPolicy.sections.usage.items')}
              </ul>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-2xl mb-4">
                {t('privacyPolicy.sections.sharing.title')}
              </h2>
              <p className="text-muted-foreground mb-4">
                {t('privacyPolicy.sections.sharing.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                {renderList('privacyPolicy.sections.sharing.items')}
              </ul>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-2xl mb-4">
                {t('privacyPolicy.sections.security.title')}
              </h2>
              <p className="text-muted-foreground mb-4">
                {t('privacyPolicy.sections.security.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                {renderList('privacyPolicy.sections.security.items')}
              </ul>
              <p className="text-muted-foreground mt-4">
                {t('privacyPolicy.sections.security.note')}
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-2xl mb-4">
                {t('privacyPolicy.sections.rights.title')}
              </h2>
              <p className="text-muted-foreground mb-4">
                {t('privacyPolicy.sections.rights.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                {renderList('privacyPolicy.sections.rights.items')}
              </ul>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-2xl mb-4">
                {t('privacyPolicy.sections.cookies.title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('privacyPolicy.sections.cookies.content')}
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-2xl mb-4">
                {t('privacyPolicy.sections.children.title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('privacyPolicy.sections.children.content')}
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-2xl mb-4">
                {t('privacyPolicy.sections.thirdParty.title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('privacyPolicy.sections.thirdParty.content')}
              </p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-2xl mb-4">
                {t('privacyPolicy.sections.retention.title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('privacyPolicy.sections.retention.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-3">
                {renderList('privacyPolicy.sections.retention.items')}
              </ul>
            </section>

            {/* 12 */}
            <section>
              <h2 className="text-2xl mb-4">
                {t('privacyPolicy.sections.international.title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('privacyPolicy.sections.international.content')}
              </p>
            </section>

            {/* 13 */}
            <section>
              <h2 className="text-2xl mb-4">
                {t('privacyPolicy.sections.changes.title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('privacyPolicy.sections.changes.content')}
              </p>
            </section>

            {/* 14 */}
            <section>
              <h2 className="text-2xl mb-4">
                {t('privacyPolicy.sections.contact.title')}
              </h2>
              <p className="text-muted-foreground mb-4">
                {t('privacyPolicy.sections.contact.description')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                {renderList('privacyPolicy.sections.contact.items')}
              </ul>
            </section>

            {/* Consent */}
            <section className="border-t border-border pt-8">
              <h2 className="text-2xl mb-4">
                {t('privacyPolicy.sections.consent.title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('privacyPolicy.sections.consent.content')}
              </p>
            </section>

            {/* Commitment */}
            <section className="rounded-[24px] border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/20">
              <h3 className="text-xl mb-3">
                {t('privacyPolicy.sections.commitment.title')}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('privacyPolicy.sections.commitment.content')}
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
