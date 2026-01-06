import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="bg-card rounded-lg shadow-sm border border-border p-8">
          <h1 className="text-4xl text-foreground mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">
            Last Updated: October 24, 2025
          </p>

          <div className="space-y-8 text-foreground">
            <section>
              <h2 className="text-2xl mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to U PLAN ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl mb-3 mt-4">2.1 Personal Information</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you register for an account, we collect:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Full name</li>
                <li>Email address</li>
                <li>Password (encrypted)</li>
                <li>Account creation date</li>
              </ul>

              <h3 className="text-xl mb-3 mt-6">2.2 Study Schedule Information</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To provide our timetable generation service, we collect:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Course names and subjects</li>
                <li>Study session times and durations</li>
                <li>Priority levels assigned to courses</li>
                <li>Custom notes and descriptions</li>
                <li>Timetable preferences and settings</li>
              </ul>

              <h3 className="text-xl mb-3 mt-6">2.3 Usage Data</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may collect information about how you access and use the Service:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>User preferences (e.g., dark mode settings)</li>
                <li>Session information and activity timestamps</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl mb-4">3. How We Store Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                <strong>Local Storage:</strong> All your data is stored locally in your browser using localStorage technology. This means:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Your data remains on your device and is not transmitted to our servers</li>
                <li>We do not have access to your personal information or study schedules</li>
                <li>Clearing your browser data will delete all stored information</li>
                <li>Your data is only accessible from the browser where you created it</li>
                <li>We recommend backing up important timetables regularly</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl mb-4">4. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>To provide, maintain, and improve our Service</li>
                <li>To create and manage your account</li>
                <li>To generate personalized study timetables</li>
                <li>To save your preferences and settings</li>
                <li>To authenticate your access to the Service</li>
                <li>To respond to your requests and provide customer support</li>
                <li>To send you updates about the Service (with your consent)</li>
                <li>To analyze usage patterns and improve user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Because your data is stored locally on your device, we do not share, sell, or rent your personal information to third parties. However, we may disclose information in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Legal Requirements:</strong> If required by law or in response to valid legal processes</li>
                <li><strong>Protection of Rights:</strong> To protect our rights, privacy, safety, or property</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl mb-4">6. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We implement appropriate security measures to protect your information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Passwords are never stored in plain text</li>
                <li>Local storage is encrypted by your browser</li>
                <li>We use secure coding practices to prevent vulnerabilities</li>
                <li>Regular security updates and maintenance</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                However, no method of electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">7. Your Rights and Choices</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You have the following rights regarding your data:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Access:</strong> You can view all your stored data at any time through the Service</li>
                <li><strong>Modification:</strong> You can edit your profile information and study schedules</li>
                <li><strong>Deletion:</strong> You can delete your account and all associated data through the Settings page</li>
                <li><strong>Export:</strong> You can export your timetables for backup purposes</li>
                <li><strong>Opt-out:</strong> You can disable certain features or notifications in Settings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl mb-4">8. Cookies and Tracking Technologies</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service uses localStorage to store your preferences and data locally on your device. We do not use third-party cookies for tracking or advertising purposes. Session information is used solely to maintain your login state and preferences.
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">9. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service is intended for students of all ages. However, we do not knowingly collect personally identifiable information from children under 13 without parental consent. If you are a parent or guardian and believe your child has provided us with personal information, please contact us so we can take appropriate action.
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">10. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service may contain links to third-party websites or services that are not operated by us. We are not responsible for the privacy practices of these third parties. We encourage you to review the privacy policies of any third-party services you access.
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">11. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your data is retained in your browser's localStorage until you explicitly delete it by:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-3">
                <li>Deleting your account through Settings</li>
                <li>Clearing your browser's local storage</li>
                <li>Uninstalling or resetting your browser</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl mb-4">12. International Users</h2>
              <p className="text-muted-foreground leading-relaxed">
                Since all data is stored locally on your device, data transfer regulations do not apply. However, if we introduce cloud-based features in the future, we will update this policy to reflect any international data transfer practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">13. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes. Your continued use of the Service after changes are posted constitutes acceptance of those changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">14. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us through:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>The Settings page in the application</li>
                <li>The support section of our website</li>
                <li>Our customer service channels</li>
              </ul>
            </section>

            <section className="border-t border-border pt-8">
              <h2 className="text-2xl mb-4">Your Consent</h2>
              <p className="text-muted-foreground leading-relaxed">
                By using U PLAN, you consent to our Privacy Policy and agree to its terms. If you do not agree with this policy, please do not use our Service.
              </p>
            </section>

            <section className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
              <h3 className="text-xl mb-3">Privacy Commitment</h3>
              <p className="text-muted-foreground leading-relaxed">
                We are committed to transparency and protecting your privacy. Your trust is important to us, and we will continue to prioritize the security and confidentiality of your information as we develop and improve our Service.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}