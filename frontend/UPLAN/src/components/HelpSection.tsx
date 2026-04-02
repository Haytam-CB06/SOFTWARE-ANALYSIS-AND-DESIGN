import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  HelpCircle,
  Lightbulb,
  MousePointer,
  Plus,
  Save,
  Settings,
  Zap,
  Sparkles,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Card, CardContent } from './ui/card';
import { useTour } from '../contexts/TourContext';
import { TOUR_STEPS } from './tour/TourOverlay';

export default function HelpSection() {
  const { t } = useTranslation();
  const { open } = useTour();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <HelpCircle className="h-5 w-5" />
          <span className="hidden sm:inline">{t('help.button')}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lightbulb className="h-6 w-6 text-blue-700" />
            {t('help.title')}
          </DialogTitle>
          <DialogDescription>
            {t('help.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-end">
            <Button
              variant="outline"
              className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-200 dark:hover:bg-blue-950/30"
              onClick={() => open(TOUR_STEPS, 0)}
            >
              <Sparkles className="h-4 w-4" />
              {t('help.walkthrough')}
            </Button>
          </div>

          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-blue-900 dark:text-blue-100 mb-2">
                    {t('help.quickStart.title')}
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {t('help.quickStart.description')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="create">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-700" />
                  <span>{t('help.sections.create.title')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1">
                        <strong>{t('help.sections.create.step1Title')}</strong>
                      </p>
                      <p className="text-muted-foreground">
                        {t('help.sections.create.step1Desc')}
                      </p>
                      <ul className="list-disc ml-6 mt-1 text-muted-foreground space-y-1">
                        <li>
                          <strong className="text-red-600">{t('help.priority.high')}:</strong>{' '}
                          {t('help.priority.highDesc')}
                        </li>
                        <li>
                          <strong className="text-yellow-600">{t('help.priority.medium')}:</strong>{' '}
                          {t('help.priority.mediumDesc')}
                        </li>
                        <li>
                          <strong className="text-green-600">{t('help.priority.low')}:</strong>{' '}
                          {t('help.priority.lowDesc')}
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1">
                        <strong>{t('help.sections.create.step2Title')}</strong>
                      </p>
                      <p className="text-muted-foreground">
                        {t('help.sections.create.step2Desc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1">
                        <strong>{t('help.sections.create.step3Title')}</strong>
                      </p>
                      <p className="text-muted-foreground">
                        {t('help.sections.create.step3Desc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1">
                        <strong>{t('help.sections.create.step4Title')}</strong>
                      </p>
                      <p className="text-muted-foreground">
                        {t('help.sections.create.step4Desc')}
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="mytimetable">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <MousePointer className="h-5 w-5 text-blue-700" />
                  <span>{t('help.sections.timetable.title')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Plus className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1">
                        <strong>{t('help.sections.timetable.addingTitle')}</strong>
                      </p>
                      <ul className="list-disc ml-6 text-muted-foreground space-y-1">
                        <li>{t('help.sections.timetable.adding1')}</li>
                        <li>{t('help.sections.timetable.adding2')}</li>
                        <li>{t('help.sections.timetable.adding3')}</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Settings className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1">
                        <strong>{t('help.sections.timetable.editingTitle')}</strong>
                      </p>
                      <p className="text-muted-foreground">
                        {t('help.sections.timetable.editingDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1">
                        <strong>{t('help.sections.timetable.navigationTitle')}</strong>
                      </p>
                      <ul className="list-disc ml-6 text-muted-foreground space-y-1">
                        <li>
                          <strong>{t('help.sections.timetable.todayButton')}:</strong>{' '}
                          {t('help.sections.timetable.todayDesc')}
                        </li>
                        <li>
                          <strong>{t('help.sections.timetable.arrowButtons')}:</strong>{' '}
                          {t('help.sections.timetable.arrowDesc')}
                        </li>
                        <li>
                          <strong>{t('help.sections.timetable.dayWeekView')}:</strong>{' '}
                          {t('help.sections.timetable.dayWeekDesc')}
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Save className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1">
                        <strong>{t('help.sections.timetable.savingTitle')}</strong>
                      </p>
                      <ul className="list-disc ml-6 text-muted-foreground space-y-1">
                        <li>
                          <strong>{t('help.sections.timetable.saveTimetable')}:</strong>{' '}
                          {t('help.sections.timetable.saveTimetableDesc')}
                        </li>
                        <li>
                          <strong>{t('help.sections.timetable.exportPdf')}:</strong>{' '}
                          {t('help.sections.timetable.exportPdfDesc')}
                        </li>
                        <li>{t('help.sections.timetable.saveDropdown')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="smart">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-700" />
                  <span>{t('help.sections.smart.title')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    {t('help.sections.smart.intro')}
                  </p>

                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-foreground mb-1">
                      <strong>{t('help.sections.smart.highTitle')}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('help.sections.smart.highDesc')}
                    </p>
                  </div>

                  <div className="bg-white-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm text-foreground mb-1">
                      <strong>{t('help.sections.smart.mediumTitle')}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('help.sections.smart.mediumDesc')}
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="text-sm text-foreground mb-1">
                      <strong>{t('help.sections.smart.lowTitle')}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('help.sections.smart.lowDesc')}
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-foreground mb-1">
                      <strong>{t('help.sections.smart.optimalTitle')}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('help.sections.smart.optimalDesc')}
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="tips">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-700" />
                  <span>{t('help.sections.tips.title')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1">
                        <strong>{t('help.sections.tips.pomodoroTitle')}</strong>
                      </p>
                      <p className="text-muted-foreground">
                        {t('help.sections.tips.pomodoroDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1">
                        <strong>{t('help.sections.tips.activeTitle')}</strong>
                      </p>
                      <p className="text-muted-foreground">
                        {t('help.sections.tips.activeDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1">
                        <strong>{t('help.sections.tips.peakTitle')}</strong>
                      </p>
                      <p className="text-muted-foreground">
                        {t('help.sections.tips.peakDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1">
                        <strong>{t('help.sections.tips.consistencyTitle')}</strong>
                      </p>
                      <p className="text-muted-foreground">
                        {t('help.sections.tips.consistencyDesc')}
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="types">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-700" />
                  <span>{t('help.sections.types.title')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-foreground"><strong>{t('help.sections.types.reading')}</strong></p>
                      <p className="text-muted-foreground text-xs">{t('help.sections.types.readingDesc')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-foreground"><strong>{t('help.sections.types.revision')}</strong></p>
                      <p className="text-muted-foreground text-xs">{t('help.sections.types.revisionDesc')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-foreground"><strong>{t('help.sections.types.practice')}</strong></p>
                      <p className="text-muted-foreground text-xs">{t('help.sections.types.practiceDesc')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-foreground"><strong>{t('help.sections.types.lecture')}</strong></p>
                      <p className="text-muted-foreground text-xs">{t('help.sections.types.lectureDesc')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-foreground"><strong>{t('help.sections.types.assignment')}</strong></p>
                      <p className="text-muted-foreground text-xs">{t('help.sections.types.assignmentDesc')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-foreground"><strong>{t('help.sections.types.break')}</strong></p>
                      <p className="text-muted-foreground text-xs">{t('help.sections.types.breakDesc')}</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Card className="border-gray-200 bg-gray-50 dark:bg-gray-900/30">
            <CardContent className="pt-6">
              <div className="text-center">
                <HelpCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {t('help.footer')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}