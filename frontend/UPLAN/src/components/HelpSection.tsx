import { BookOpen, Calendar, CheckCircle2, Clock, HelpCircle, Lightbulb, MousePointer, Plus, Save, Settings, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Card, CardContent } from './ui/card';

export default function HelpSection() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <HelpCircle className="h-5 w-5" />
          <span className="hidden sm:inline">Help</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lightbulb className="h-6 w-6 text-blue-600" />
            How to Use Smart Study
          </DialogTitle>
          <DialogDescription>
            Learn how to create and manage your study timetables effectively
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quick Start Guide */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-blue-900 dark:text-blue-100 mb-2">Quick Start</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Get started in 3 simple steps: Add your subjects → Configure study hours → Generate your personalized timetable!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Guide */}
          <Accordion type="single" collapsible className="w-full">
            {/* Creating a Timetable */}
            <AccordionItem value="create">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span>Creating Your First Timetable</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1"><strong>Step 1: Add Subjects</strong></p>
                      <p className="text-muted-foreground">Navigate to "Create Timetable" and add all your subjects. Choose priority levels:</p>
                      <ul className="list-disc ml-6 mt-1 text-muted-foreground space-y-1">
                        <li><strong className="text-red-600">High Priority:</strong> Critical subjects requiring focused attention</li>
                        <li><strong className="text-yellow-600">Medium Priority:</strong> Regular coursework subjects</li>
                        <li><strong className="text-green-600">Low Priority:</strong> Extra reading or electives</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1"><strong>Step 2: Select Study Days</strong></p>
                      <p className="text-muted-foreground">Choose which days you want to study. The smart scheduler will distribute your subjects optimally across selected days.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1"><strong>Step 3: Configure Time Preferences</strong></p>
                      <p className="text-muted-foreground">Set your daily study hours, preferred time slots, and break intervals. We recommend following the Pomodoro technique (25-minute sessions with 5-minute breaks).</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1"><strong>Step 4: Generate Timetable</strong></p>
                      <p className="text-muted-foreground">Click "Generate Timetable" to create your personalized study schedule!</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* My Timetable */}
            <AccordionItem value="mytimetable">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <MousePointer className="h-5 w-5 text-blue-600" />
                  <span>Using My Timetable (Calendar View)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Plus className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1"><strong>Adding Sessions Manually</strong></p>
                      <ul className="list-disc ml-6 text-muted-foreground space-y-1">
                        <li>Click on any time slot in the calendar to add a study session</li>
                        <li>Click the blue "+" button at the bottom right corner</li>
                        <li>Fill in subject, time, and session type (Reading, Revision, Practice, etc.)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Settings className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1"><strong>Editing Sessions</strong></p>
                      <p className="text-muted-foreground">Click on any existing session card to edit its details or delete it.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1"><strong>Navigation Controls</strong></p>
                      <ul className="list-disc ml-6 text-muted-foreground space-y-1">
                        <li><strong>Today Button:</strong> Jump back to the current week</li>
                        <li><strong>Arrow Buttons:</strong> Navigate between weeks</li>
                        <li><strong>Day/Week View:</strong> Switch between weekly overview and detailed day view</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Save className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1"><strong>Saving Your Work</strong></p>
                      <ul className="list-disc ml-6 text-muted-foreground space-y-1">
                        <li><strong>Save Timetable:</strong> Saves your timetable to the "Saved Timetables" section</li>
                        <li><strong>Export as PDF:</strong> Download your timetable as a PDF file</li>
                        <li>Click the "Save" button dropdown to access both options</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Smart Scheduling */}
            <AccordionItem value="smart">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <span>Smart Scheduling Rules</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <p className="text-muted-foreground">Our intelligent scheduling system follows these proven study principles:</p>
                  
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-foreground mb-1"><strong>High Priority (50% of total time):</strong></p>
                    <p className="text-sm text-muted-foreground">Critical subjects requiring focused attention receive the <strong>largest time allocation</strong> to ensure mastery of challenging material.</p>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm text-foreground mb-1"><strong>Medium Priority (30% of total time):</strong></p>
                    <p className="text-sm text-muted-foreground">Regular coursework subjects receive <strong>moderate time allocation</strong> for consistent progress and understanding.</p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="text-sm text-foreground mb-1"><strong>Low Priority (20% of total time):</strong></p>
                    <p className="text-sm text-muted-foreground">Extra reading and electives receive <strong>appropriate time</strong> without overwhelming your schedule.</p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-foreground mb-1"><strong>Optimal Scheduling:</strong></p>
                    <p className="text-sm text-muted-foreground">High priority subjects are scheduled in the first part of each day when focus is at its peak, maximizing learning effectiveness.</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Study Tips */}
            <AccordionItem value="tips">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  <span>Study Tips & Best Practices</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1"><strong>Pomodoro Technique</strong></p>
                      <p className="text-muted-foreground">Study in 25-minute focused sessions with 5-minute breaks. After 4 sessions, take a longer 15-30 minute break.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1"><strong>Active Learning</strong></p>
                      <p className="text-muted-foreground">Mix different session types: Reading → Practice → Revision for better comprehension and retention.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1"><strong>Peak Performance Times</strong></p>
                      <p className="text-muted-foreground">Schedule high-priority subjects during your peak focus hours (usually morning for most people).</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground mb-1"><strong>Consistency is Key</strong></p>
                      <p className="text-muted-foreground">Stick to your timetable! Regular study habits are more effective than cramming.</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Session Types */}
            <AccordionItem value="types">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <span>Understanding Session Types</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-foreground"><strong>Reading</strong></p>
                      <p className="text-muted-foreground text-xs">Learning new material, textbook reading</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-foreground"><strong>Revision</strong></p>
                      <p className="text-muted-foreground text-xs">Reviewing previously learned content</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-foreground"><strong>Practice</strong></p>
                      <p className="text-muted-foreground text-xs">Problem-solving, exercises, practice tests</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-foreground"><strong>Lecture</strong></p>
                      <p className="text-muted-foreground text-xs">Attending classes or watching lectures</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-foreground"><strong>Assignment</strong></p>
                      <p className="text-muted-foreground text-xs">Working on projects and assignments</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-foreground"><strong>Break</strong></p>
                      <p className="text-muted-foreground text-xs">Rest periods to recharge</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Support Footer */}
          <Card className="border-gray-200 bg-gray-50 dark:bg-gray-900/30">
            <CardContent className="pt-6">
              <div className="text-center">
                <HelpCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Still have questions? Explore the app to discover more features!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}