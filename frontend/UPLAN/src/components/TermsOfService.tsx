import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

export default function TermsOfService({ onBack }: TermsOfServiceProps) {
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
          <h1 className="text-4xl text-foreground mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">
            Last Updated: October 24, 2025
          </p>

          <div className="space-y-8 text-foreground">
            <section>
              <h2 className="text-2xl mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using U PLAN ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                U PLAN provides students with tools to create, manage, and optimize their study schedules. The Service includes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Interactive weekly calendar for study session planning</li>
                <li>Smart scheduling algorithms based on course priorities</li>
                <li>Manual creation and editing of study sessions</li>
                <li>Timetable saving and management features</li>
                <li>Dark mode and customization options</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl mb-4">3. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To use certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain the security of your password and account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl mb-4">4. User Data and Local Storage</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service stores your data locally in your browser using localStorage. This includes your account information, timetables, study sessions, and preferences. You are responsible for maintaining backups of your data. We are not liable for any loss of data stored locally on your device.
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">5. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit any harmful or malicious code</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Use the Service for any commercial purposes without permission</li>
                <li>Interfere with or disrupt the Service or servers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl mb-4">6. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service and its original content, features, and functionality are owned by U PLAN and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. Your use of the Service does not grant you ownership of any intellectual property rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">7. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not warrant that the Service will be uninterrupted, timely, secure, or error-free.
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">8. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                IN NO EVENT SHALL U PLAN, ITS DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">9. Educational Purpose</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service is designed to assist with study planning and time management. It is not a substitute for professional academic advising. Study schedules generated by the Service are suggestions and should be adapted based on individual needs and circumstances.
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">10. Modifications to Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice. You agree that we shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">11. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to update or modify these Terms of Service at any time without prior notice. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms of Service. We will update the "Last Updated" date at the top of this page when changes are made.
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">12. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms of Service. Upon termination, your right to use the Service will immediately cease.
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">13. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed and construed in accordance with applicable laws, without regard to its conflict of law provisions. Any disputes arising from these Terms or use of the Service shall be resolved through binding arbitration.
              </p>
            </section>

            <section>
              <h2 className="text-2xl mb-4">14. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us through the app's support channels or settings page.
              </p>
            </section>

            <section className="border-t border-border pt-8">
              <p className="text-muted-foreground leading-relaxed italic">
                By using U PLAN, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}