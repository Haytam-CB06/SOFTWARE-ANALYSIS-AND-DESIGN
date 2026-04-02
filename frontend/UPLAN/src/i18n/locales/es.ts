const es = {
  common: {
    start: 'Iniciar',
    pause: 'Pausa',
    reset: 'Restablecer',
    close: 'Cerrar',
    home: 'Inicio',
    timetable: 'Horario',
    workspace: 'Espacio de trabajo',
    saved: 'Guardado',
    settings: 'Configuración',
    admin: 'Admin',
    logout: 'Cerrar sesión',
    active: 'Activo',
    open: 'Abrir',
    new: 'Nuevo',
    you: 'Tú',
    back: 'Atrás',
    save: 'Guardar',
    add: 'Añadir',
    done: 'Hecho',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    exit: 'Salir',
    expand: 'Expandir',
    minimize: 'Minimizar',
    total: 'Total',
    today: 'Hoy',
    pin: 'Fijar'
  },
  autoGenerate: {
    title: 'Generación automática del horario de estudio',
    subtitle: 'Configura tu horario y genera sesiones de estudio optimizadas.',
    studyWindow: {
      title: 'Ventana de estudio',
      description: 'Define cuándo estás disponible para estudiar y ajústalo en cualquier momento.',
      weekdayStart: 'Inicio entre semana',
      weekdayEnd: 'Fin entre semana',
      breakMinutes: 'Pausa entre sesiones de estudio (minutos)',
      breakHelp: 'Dejaremos este espacio entre sesiones generadas consecutivas para que puedas descansar.',
      includeWeekends: 'Incluir fines de semana',
      includeWeekendsHelp: 'Si está activado, también llenaremos el tiempo libre del sábado y domingo.',
      sameWeekend: 'Usar la misma franja en fin de semana',
      sameWeekendHelp: 'Las horas del fin de semana serán iguales a las de entre semana.',
      weekendStart: 'Inicio fin de semana',
      weekendEnd: 'Fin fin de semana'
    },
    classSchedule: {
      title: 'Horario de clases y prioridad',
      description: 'Añade tu horario actual y define la prioridad de cada curso. El generador lo usa junto con el tiempo ocupado para encontrar tus huecos de estudio.',
      fillButton: 'Rellenar horario actual',
      uploadButton: 'Subir',
      emptyTitle: 'Aún no hay horario de clases guardado',
      emptyDescription: 'Usa Rellenar horario actual o Subir para añadir tus cursos.',
      addAnotherSlot: 'Añadir otra franja para este curso',
      courseName: 'Nombre del curso',
      priority: 'Prioridad',
      start: 'Inicio',
      end: 'Fin',
      days: 'Días',
      addCourseRow: 'Añadir fila de curso',
      addCourseRowHelp: 'El mismo curso puede aparecer varias veces con distintos días u horarios.'
    },
    busyTime: {
      title: 'Tiempo ocupado',
      description: 'Añade bloques ocupados adicionales como trabajo, desplazamientos o recados. La generación automática nunca colocará sesiones de estudio allí.',
      treatExisting: 'Tratar las sesiones existentes del calendario como ocupadas',
      treatExistingHelp: 'Usa las sesiones de tu semana actual como tiempo ocupado adicional ({{count}} sesión(es) encontrada(s)).',
      replaceExisting: 'Reemplazar sesiones de estudio existentes',
      replaceExistingHelp: 'Si se activa, eliminamos las sesiones de estudio generadas previamente antes de añadir nuevas.',
      addBusy: 'Añadir bloque ocupado',
      titleLabel: 'Título',
      day: 'Día',
      start: 'Inicio',
      end: 'Fin'
    },
    upload: {
      title: 'Subir horario',
      description: 'Sube un CSV o una imagen de tu horario. Después de importar, define prioridades y haz clic en Guardar.',
      selectFile: 'Elegir archivo para subir',
      buttonHint: 'Compatible con imagen o CSV'
    },
    priority: {
      high: 'ALTA',
      medium: 'MEDIA',
      low: 'BAJA'
    },
    busyDefaultTitle: 'Tiempo ocupado',
    generate: 'Generar',
    generating: 'Generando…',
    success: {
      busySavedWorkspace: 'Tiempo ocupado guardado en el espacio de trabajo',
      classSavedWorkspace: 'Horario de clases guardado en el espacio de trabajo',
      classSaved: 'Horario de clases guardado',
      importedRows: 'Se importaron {{count}} fila(s) del horario. Ahora define prioridades y haz clic en Guardar.',
      generatedSessions: 'Se generaron {{count}} sesiones de estudio{{seed}}.'
    },
    errors: {
      saveBusy: 'No se pudo guardar el tiempo ocupado',
      addCourseFirst: 'Añade al menos un curso a tu horario de clases',
      saveClass: 'No se pudo guardar el horario de clases',
      uploadCsvOrImage: 'Sube un archivo CSV o una imagen',
      uploadFailed: 'La subida falló',
      uploadFailedGeneric: 'La subida falló',
      noClassesDetected: 'No se detectaron clases en el archivo subido',
      invalidImportFormat: 'El archivo importado no coincide con el formato esperado del horario',
      courseNameRequired: 'El nombre del curso es obligatorio',
      selectAtLeastOneDay: 'Selecciona al menos un día',
      missingApiBase: 'Falta VITE_API_BASE_URL. Configura tu entorno frontend.',
      notLoggedIn: 'No has iniciado sesión',
      fillOrUploadFirst: 'Primero completa o sube tu horario de clases',
      generateFailed: 'La generación automática falló',
      noFreeTime: 'No hay tiempo libre disponible para la ventana de estudio seleccionada'
    }
  },
  auth: {
    brand: {
      name: 'PLAN',
      subtitle: 'Academic Planning',
      logoAlt: 'U PLAN Logo'
    },
    hero: {
      imageAlt: 'Student studying',
      badge: 'Plan smarter. Study with clarity.',
      titleLine1: 'Master your',
      titleLine2: 'study schedule',
      description: 'AI-powered timetable planning that adapts to your classes, exams, deadlines, and goals in one clean workspace.',
      footer: 'Built to help students stay organized, focused, and confident.',
      cards: {
        smartPlanning: {
          title: 'Smarter planning',
          description: 'Organize sessions around real priorities'
        },
        flexibleFlow: {
          title: 'Flexible flow',
          description: 'Adjust study time as your week changes'
        },
        studentFirst: {
          title: 'Student-first',
          description: 'Built for clarity, focus, and consistency'
        }
      }
    },
    titles: {
      welcomeBack: 'Welcome back',
      verifyAccount: 'Verify your account',
      createNewPassword: 'Create a new password',
      resetPassword: 'Reset your password',
      createAccount: 'Create your account',
      continueWithProvider: 'Continue with {{provider}}',
      completeProviderLogin: 'Complete {{provider}} Login',
      enterVerificationCode: 'Enter Verification Code',
      welcomeBackCard: 'Welcome Back',
      createAccountCard: 'Create Account',
      verifyYourEmail: 'Verify your email'
    },
    descriptions: {
      completeSignIn: 'Complete your sign-in details to continue.',
      enterCodeSent: 'Enter the code sent to your email.',
      chooseStrongPassword: 'Choose a strong new password to secure your account.',
      sendVerificationToEmail: 'We’ll send a verification code to your email.',
      joinAndOrganize: 'Join and start organizing your study schedule.',
      accessPlanner: 'Access your study planner and continue where you left off.',
      completeProviderLogin: 'Enter your email and name to complete the login process.',
      resetCodeSentTo: 'We’ve sent a 6-digit verification code to {{email}}',
      enterNewPasswordFor: 'Enter your new password for {{email}}',
      resetPasswordHelp: 'Enter your email address and we’ll send you a verification code',
      loginCard: 'Enter your credentials to access your study timetable',
      signupCard: 'Start organizing your study schedule today',
      signupCodeSentTo: 'Enter the 6-digit code sent to {{email}}'
    },
    labels: {
      email: 'Email',
      fullName: 'Full Name',
      verificationCode: 'Verification Code',
      newPassword: 'New Password',
      confirmNewPassword: 'Confirm New Password',
      emailOrUsername: 'Email/Username',
      password: 'Password',
      username: 'Username',
      confirmPassword: 'Confirm Password',
      dateOfBirth: 'Date of Birth',
      gender: 'Gender'
    },
    placeholders: {
      socialEmail: 'your.email@gmail.com',
      fullName: 'John Doe',
      verificationCode: '000000',
      newPassword: 'Enter new password',
      confirmNewPassword: 'Confirm new password',
      email: 'name@example.com',
      emailOrUsername: 'name@example.com or username',
      password: 'Enter your password',
      username: 'johndoe123',
      createPassword: 'Create a password',
      confirmPassword: 'Confirm your password',
      selectGender: 'Select your gender'
    },
    actions: {
      backToHome: 'Back to Home',
      completeLogin: 'Complete Login',
      backToLogin: 'Back to Login',
      verifyCode: 'Verify Code',
      resendCode: 'Resend Code',
      resetPassword: 'Reset Password',
      sendVerificationCode: 'Send Verification Code',
      loginTab: 'Login',
      signupTab: 'Sign Up',
      forgotPassword: 'Forgot password?',
      rememberMe: 'Remember me',
      signIn: 'Sign In',
      orContinueWith: 'Or continue with',
      continueWithGoogle: 'Continue with Google',
      signUp: 'Sign Up',
      sendingCode: 'Sending Code...',
      verifyEmail: 'Verify Email',
      creatingAccount: 'Creating Account...',
      needHelp: 'Need help?'
    },
    requirements: {
      username: {
        length: 'Between 3-20 characters',
        format: 'Only letters, numbers, underscores, and periods',
        noSpaces: 'No spaces allowed',
        notReserved: 'Not a reserved username'
      },
      password: {
        minLength: 'At least 8 characters',
        upper: 'One uppercase letter (A-Z)',
        lower: 'One lowercase letter (a-z)',
        number: 'One number (0-9)',
        special: 'One special character (!@#$%^&*)'
      }
    },
    genderOptions: {
      male: 'Male',
      female: 'Female',
      other: 'Other',
      preferNotToSay: 'Prefer not to say'
    },
    helper: {
      didntReceiveCode: 'Didn’t receive the code?',
      passwordMustContain: 'Password must contain:',
      usernameRequirements: 'Username requirements:',
      agreeTermsBefore: 'I agree to the',
      termsOfService: 'Terms of Service',
      privacyPolicy: 'Privacy Policy',
      and: 'and',
      byContinuing: 'By continuing, you agree to our'
    },
    help: {
      title: 'Need Help?',
      creatingAccountTitle: 'Creating an Account',
      issuesTitle: 'Having Issues?',
      issuesDescription: 'If you’re having trouble signing up or logging in, please check your internet connection and make sure all required fields are completed correctly.',
      points: {
        username: 'Choose a unique username (3–20 characters)',
        email: 'Use a valid email address',
        password: 'Create a strong password with uppercase, lowercase, numbers, and special characters',
        age: 'You must be 13+ years old to sign up'
      }
    },
    errors: {
      passwordMismatch: 'Passwords do not match!',
      dateOfBirthRequired: 'Date of birth is required',
      ageRestriction: 'You must be at least 13 years old to create an account',
      signupFailed: 'Signup failed',
      acceptInviteFailed: 'Failed to accept invite',
      inviteInvalid: 'Invite link is invalid or expired',
      loginFailed: 'incorrect username,email or password',
      loginUnexpected: 'Something went wrong during login',
      invalidSignupCode: 'Invalid signup verification code',
      verifySignupCodeFailed: 'Failed to verify signup code',
      usernameLength: 'Username must be between 3 and 20 characters long!',
      usernameFormat: 'Username can only contain letters, numbers, underscores, and periods!',
      usernameNoSpaces: 'Username cannot contain spaces!',
      usernameReserved: 'Username is reserved. Please choose a different one!',
      emailRequired: 'Email is required',
      genderRequired: 'Please select your gender',
      passwordLength: 'Password must be at least 8 characters long!',
      passwordUpper: 'Password must contain at least one uppercase letter!',
      passwordLower: 'Password must contain at least one lowercase letter!',
      passwordNumber: 'Password must contain at least one number!',
      passwordSpecial: 'Password must contain at least one special character!',
      sendSignupCodeFailed: 'Failed to send signup verification code',
      emailNotFound: 'No account found with this email.',
      requestResetFailed: 'Failed to request reset code.',
      invalidResetCode: 'Invalid verification code. Please try again.',
      verifyCodeFailed: 'Something went wrong during verification.',
      resetPasswordFailed: 'Failed to reset password',
      resetPasswordUnexpected: 'Something went wrong during password reset',
      fillRequired: 'Please enter all required information.',
      resendCodeFailed: 'Failed to resend verification code',
      resendSignupCodeFailed: 'Failed to resend signup code',
      somethingWentWrong: 'Something went wrong'
    },
    success: {
      accountCreated: 'Account created successfully! Welcome, {{name}}!',
      welcomeBack: 'Welcome back!',
      welcomeBackName: 'Welcome back, {{name}}!',
      emailVerified: 'Email verified successfully.',
      signupCodeSent: 'Verification code sent to {{email}}',
      resetCodeSent: 'Verification code sent to {{email}}.',
      verificationSuccess: 'Verification successful!',
      passwordReset: 'Password reset successfully! Logging you in...',
      passwordsMatch: 'Passwords match',
      ageVerified: 'Age verified (13+ years)',
      genderSelected: 'Gender selected',
      emailVerifiedInline: 'Email verified',
      newVerificationCodeSent: 'New verification code sent!',
      newSignupVerificationCodeSent: 'New signup verification code sent!'
    }
  },
  errorBoundary: {
    title: 'Algo salió mal',
    description: 'La aplicación falló al renderizar esta página. Actualiza para recuperarla.',
    actions: {
      reload: 'Recargar',
      continue: 'Intentar continuar'
    }
  },
  examTracker: {
    title: 'Seguimiento de exámenes',
    subtitle: 'Haz seguimiento de tus próximos exámenes y prepárate en consecuencia',
    actions: {
      add: 'Añadir examen'
    },
    dialog: {
      title: 'Añadir nuevo examen',
      description: 'Programa un nuevo examen o prueba para tu horario de estudio.'
    },
    fields: {
      subject: 'Asignatura',
      date: 'Fecha',
      time: 'Hora',
      location: 'Lugar',
      priority: 'Prioridad',
      notes: 'Notas'
    },
    placeholders: {
      subject: 'p. ej., Matemáticas',
      location: 'p. ej., Aula 301',
      notes: 'Notas adicionales...'
    },
    priority: {
      high: 'Alta',
      medium: 'Media',
      low: 'Baja'
    },
    upcoming: 'Próximos exámenes',
    empty: {
      title: 'No hay próximos exámenes programados',
      subtitle: 'Añade tus fechas de examen para empezar el seguimiento'
    },
    today: '¡Hoy!',
    tomorrow: '¡Mañana!',
    daysAway: 'faltan {{count}} días',
    success: {
      added: 'Examen añadido correctamente',
      deleted: 'Examen eliminado'
    },
    errors: {
      required: 'Completa la asignatura y la fecha'
    }
  },
  goals: {
    title: 'Objetivos y logros',
    subtitle: 'Haz seguimiento de metas semanales, constancia de estudio e hitos próximos.',
    actions: {
      back: 'Atrás',
      setGoals: 'Definir objetivos',
      logSession: 'Registrar sesión',
      collapse: 'Contraer',
      expand: 'Expandir',
      markCompleted: 'Marcar como completada',
      skip: 'Omitir'
    },
    common: {
      subject: 'Subject',
      study: 'Study',
      missed: 'missed'
    },
    success: {
      achievementUnlocked: 'Achievement unlocked',
      sessionLogged: 'Session logged',
      sessionSkipped: 'Session skipped',
      goalSaved: 'Goal saved'
    },
    errors: {
      updateSession: 'Could not update session',
      validTarget: 'Please enter a valid target hours number',
      summaryNotLoaded: 'Summary not loaded yet',
      exceedsAvailability: 'Goal exceeds weekly availability',
      exceedsAvailabilityDesc: 'You only have about {{hours}}h available this week based on your timetable.',
      subjectExceedsWeekly: 'Subject goal exceeds weekly goal',
      subjectExceedsWeeklyDesc: 'Your overall weekly goal is {{hours}}h. Subject goals must fit within it.',
      subjectGoalsExceedWeekly: 'Subject goals exceed weekly goal',
      subjectGoalsExceedWeeklyDesc: "Your other subject goals total {{otherHours}}h. With this, you'd exceed your weekly goal of {{weeklyHours}}h.",
      weeklyTooLow: 'Weekly goal is too low',
      weeklyTooLowDesc: 'Your subject goals already total {{hours}}h. Increase your weekly goal or reduce subject goals.',
      saveGoal: 'Could not save goal',
      selectSession: 'Select a session',
      todayOnly: 'You can only log missed sessions for today.',
      sessionNotFound: 'Session not found',
      onlyMissed: 'Only missed sessions can be marked completed manually (same day).',
      skippedCannotComplete: 'Skipped sessions cannot be marked completed.'
    },
    thisWeek: {
      title: 'This Week',
      description: 'What’s scheduled (from My Timetable)',
      sessions: 'sessions',
      hours: '~{{hours}} hours',
      tipPrefix: 'Tip: If this looks empty, open',
      tipHighlight: 'My Timetable',
      tipSuffix: 'once to load the current week.'
    },
    deadlines: {
      title: 'Upcoming Deadlines',
      description: 'From Assessments',
      empty: 'No upcoming deadlines',
      due: 'Due {{date}}',
      manage: 'Manage deadlines'
    },
    progress: {
      title: 'Progress & Streak',
      description: 'From your completed sessions',
      completed: 'completed',
      target: 'target',
      streak: '{{count}}-day streak',
      tip: 'Tip: use “Log Session” below to start building achievements.'
    },
    goalDialog: {
      title: 'Set goals for this week',
      description: 'Weekly goals.',
      weeklyTarget: 'Weekly target hours',
      weeklyPlaceholder: 'e.g. 8',
      saveWeekly: 'Save weekly goal',
      subjectGoal: 'Subject-specific goal (optional)',
      selectSubject: 'Select a subject',
      subjectPlaceholder: 'e.g. 3',
      saveSubject: 'Save subject goal',
      currentGoals: 'Current goals',
      overall: 'Overall'
    },
    logDialog: {
      title: 'Log a completed study session',
      description: 'This updates your backend streak and completed hours.',
      date: 'Date',
      hint: 'You can only log sessions that exist on your current “My Timetable” for that day. Unlogged sessions become missed after midnight.',
      sessions: 'Timetable sessions',
      selectMissed: 'Select a missed session',
      noMissed: 'No missed sessions for this day',
      onlyMissedHint: 'Only missed sessions for today (from your current “My Timetable”) are shown here.',
      logSelected: 'Log selected session'
    },
    hints: {
      openTimetableFirst: 'Tip: Open “My Timetable” once so this week loads, then return here.'
    },
    todayPanel: {
      description: 'Backend-tracked slots from your timetable. Skipped cannot be marked completed.',
      weekTotals: 'Week totals: {{completed}} completed • {{skipped}} skipped • {{missed}} missed • {{planned}} planned',
      hidden: 'Hidden. Click “Expand” to view and manage today’s sessions.',
      empty: 'No timetable sessions found for today.',
      status: 'Status'
    }
  },
  googleCalendar: {
    success: {
      connected: 'Successfully connected to Google Calendar!',
      disconnected: 'Disconnected from Google Calendar',
      exported: 'Timetable exported to Google Calendar successfully! Check your calendar.'
    },
    errors: {
      connect: 'Failed to connect to Google Calendar. Please try again.',
      connectFirst: 'Please connect to Google Calendar first',
      export: 'Failed to export to Google Calendar'
    },
    info: {
      exporting: 'Exporting to Google Calendar...'
    },
    confirm: {
      disconnect: 'Are you sure you want to disconnect from Google Calendar? Your existing calendar events will not be affected.'
    }
  },
  help: {
    button: 'Help',
    title: 'How to Use Smart Study',
    description: 'Learn how to create and manage your study timetables effectively',
    walkthrough: 'Tips / Walkthrough',
    quickStart: {
      title: 'Quick Start',
      description: 'Get started in 3 simple steps: Add your subjects → Configure study hours → Generate your personalized timetable!'
    },
    priority: {
      high: 'High Priority',
      highDesc: 'Critical subjects requiring focused attention',
      medium: 'Medium Priority',
      mediumDesc: 'Regular coursework subjects',
      low: 'Low Priority',
      lowDesc: 'Extra reading or electives'
    },
    sections: {
      create: {
        title: 'Creating Your First Timetable',
        step1Title: 'Step 1: Add Subjects',
        step1Desc: 'Navigate to "Create Timetable" and add all your subjects. Choose priority levels:',
        step2Title: 'Step 2: Select Study Days',
        step2Desc: 'Choose which days you want to study. The smart scheduler will distribute your subjects optimally across selected days.',
        step3Title: 'Step 3: Configure Time Preferences',
        step3Desc: 'Set your daily study hours, preferred time slots, and break intervals. We recommend following the Pomodoro technique (25-minute sessions with 5-minute breaks).',
        step4Title: 'Step 4: Generate Timetable',
        step4Desc: 'Click "Generate Timetable" to create your personalized study schedule!'
      },
      timetable: {
        title: 'Using My Timetable (Calendar View)',
        addingTitle: 'Adding Sessions Manually',
        adding1: 'Click on any time slot in the calendar to add a study session',
        adding2: 'Click the blue "+" button at the bottom right corner',
        adding3: 'Fill in subject, time, and session type (Reading, Revision, Practice, etc.)',
        editingTitle: 'Editing Sessions',
        editingDesc: 'Click on any existing session card to edit its details or delete it.',
        navigationTitle: 'Navigation Controls',
        todayButton: 'Today Button',
        todayDesc: 'Jump back to the current week',
        arrowButtons: 'Arrow Buttons',
        arrowDesc: 'Navigate between weeks',
        dayWeekView: 'Day/Week View',
        dayWeekDesc: 'Switch between weekly overview and detailed day view',
        savingTitle: 'Saving Your Work',
        saveTimetable: 'Save Timetable',
        saveTimetableDesc: 'Saves your timetable to the "Saved Timetables" section',
        exportPdf: 'Export as PDF',
        exportPdfDesc: 'Download your timetable as a PDF file',
        saveDropdown: 'Click the "Save" button dropdown to access both options'
      },
      smart: {
        title: 'Smart Scheduling Rules',
        intro: 'Our intelligent scheduling system follows these proven study principles:',
        highTitle: 'High Priority (50% of total time):',
        highDesc: 'Critical subjects requiring focused attention receive the largest time allocation to ensure mastery of challenging material.',
        mediumTitle: 'Medium Priority (30% of total time):',
        mediumDesc: 'Regular coursework subjects receive moderate time allocation for consistent progress and understanding.',
        lowTitle: 'Low Priority (20% of total time):',
        lowDesc: 'Extra reading and electives receive appropriate time without overwhelming your schedule.',
        optimalTitle: 'Optimal Scheduling:',
        optimalDesc: 'High priority subjects are scheduled in the first part of each day when focus is at its peak, maximizing learning effectiveness.'
      },
      tips: {
        title: 'Study Tips & Best Practices',
        pomodoroTitle: 'Pomodoro Technique',
        pomodoroDesc: 'Study in 25-minute focused sessions with 5-minute breaks. After 4 sessions, take a longer 15-30 minute break.',
        activeTitle: 'Active Learning',
        activeDesc: 'Mix different session types: Reading → Practice → Revision for better comprehension and retention.',
        peakTitle: 'Peak Performance Times',
        peakDesc: 'Schedule high-priority subjects during your peak focus hours (usually morning for most people).',
        consistencyTitle: 'Consistency is Key',
        consistencyDesc: 'Stick to your timetable! Regular study habits are more effective than cramming.'
      },
      types: {
        title: 'Understanding Session Types',
        reading: 'Reading',
        readingDesc: 'Learning new material, textbook reading',
        revision: 'Revision',
        revisionDesc: 'Reviewing previously learned content',
        practice: 'Practice',
        practiceDesc: 'Problem-solving, exercises, practice tests',
        lecture: 'Lecture',
        lectureDesc: 'Attending classes or watching lectures',
        assignment: 'Assignment',
        assignmentDesc: 'Working on projects and assignments',
        break: 'Break',
        breakDesc: 'Rest periods to recharge'
      }
    },
    footer: 'Still have questions? Explore the app to discover more features!'
  },
  joinWorkspace: {
    title: 'Join Workspace',
    loading: 'Verifying link…',
    loginWarning: '⚠️ You need to be logged in to send a join request.',
    states: {
      verifying: 'Verifying invite link…',
      invalid: 'Invalid or expired invite link',
      sent: 'Your request has been sent',
      requestToJoin: 'Request to join "{{name}}"'
    },
    message: {
      label: 'Message',
      placeholder: "Tell the admin why you'd like to join…"
    },
    actions: {
      send: 'Send Request',
      sending: 'Sending…'
    },
    success: {
      alreadyMember: "You're already a member of this workspace!",
      requestSent: 'Request sent! The admin will review it shortly.',
      title: 'Request Sent!',
      description: "The workspace admin will review your request and you'll be added once approved."
    },
    errors: {
      invalidLink: 'Invalid invite link',
      expiredLink: 'Invalid or expired invite link',
      loginRequired: 'You must be logged in to request to join a workspace',
      requestFailed: 'Request failed',
      sendFailed: 'Failed to send request'
    }
  },
  notebook: {
    untitled: 'Untitled',
    updated: 'Updated',
    time: {
      justNow: 'Just now',
      minutesAgo: '{{count}}m ago',
      hoursAgo: '{{count}}h ago',
      daysAgo: '{{count}}d ago'
    },
    toasts: {
      noteCreated: 'Note created',
      saved: 'Saved',
      deleted: 'Deleted'
    },
    errors: {
      loadNotes: 'Failed to load notes',
      createNote: 'Failed to create note',
      saveNote: 'Failed to save note',
      deleteNote: 'Failed to delete note'
    },
    confirm: {
      delete: 'Delete this note? This cannot be undone.'
    },
    mobile: {
      notes: 'Notes',
      title: 'Notebook',
      yourNotes: 'Your notes'
    },
    sidebar: {
      myNotes: 'My Notes',
      noteCount: '{{count}} note',
      noteCount_other: '{{count}} notes'
    },
    filters: {
      all: 'All',
      pinned: 'Pinned',
      archived: 'Archived'
    },
    tags: {
      title: 'Tags'
    },
    empty: {
      noNotes: 'No notes yet. Click',
      createOne: 'to create one.',
      noContent: 'No content',
      noNoteSelected: 'No note selected',
      getStarted: 'Open the notes menu or create a new note to get started.'
    },
    actions: {
      add: 'Add',
      new: 'New',
      addNote: 'Add Note',
      save: 'Save',
      delete: 'Delete',
      createNote: 'Create note'
    },
    placeholders: {
      search: '     Search notes...',
      untitled: 'Untitled note',
      tags: 'school, exam, todo',
      startWriting: 'Start writing...'
    },
    editor: {
      autoSave: 'Auto-save',
      saving: 'Saving...',
      unsavedChanges: 'Unsaved changes',
      pinned: 'Pinned',
      archived: 'Archived'
    },
    unsaved: {
      title: 'Unsaved changes',
      description: 'You have unsaved edits. Are you sure you want to leave this note?',
      stay: 'Stay here',
      saveAndContinue: 'Save and continue',
      leaveWithoutSaving: 'Leave without saving'
    }
  },
  notifications: {
    title: 'Notificaciones',
    markRead: 'Marcar como leída',
    empty: 'No hay notificaciones',
    new: 'Nueva',
    clear: 'Limpiar'
  },
  privacyPolicy: {
    back: 'Back',
    title: 'Privacy Policy',
    lastUpdated: 'Last Updated: October 24, 2025',
    sections: {
      introduction: {
        title: '1. Introduction',
        content: 'Welcome to U PLAN ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.'
      },
      informationWeCollect: {
        title: '2. Information We Collect',
        personalInfo: {
          title: '2.1 Personal Information',
          description: 'When you register for an account, we collect:',
          items: [
            'Full name',
            'Email address',
            'Password (encrypted)',
            'Account creation date'
          ]
        },
        studyInfo: {
          title: '2.2 Study Schedule Information',
          description: 'To provide our timetable generation service, we collect:',
          items: [
            'Course names and subjects',
            'Study session times and durations',
            'Priority levels assigned to courses',
            'Custom notes and descriptions',
            'Timetable preferences and settings'
          ]
        },
        usageData: {
          title: '2.3 Usage Data',
          description: 'We may collect information about how you access and use the Service:',
          items: [
            'Browser type and version',
            'Device information',
            'User preferences (e.g., dark mode settings)',
            'Session information and activity timestamps'
          ]
        }
      },
      storage: {
        title: '3. How We Store Your Information',
        description: 'Local Storage: All your data is stored locally in your browser using localStorage technology. This means:',
        items: [
          'Your data remains on your device and is not transmitted to our servers',
          'We do not have access to your personal information or study schedules',
          'Clearing your browser data will delete all stored information',
          'Your data is only accessible from the browser where you created it',
          'We recommend backing up important timetables regularly'
        ]
      },
      usage: {
        title: '4. How We Use Your Information',
        description: 'We use the information we collect for the following purposes:',
        items: [
          'To provide, maintain, and improve our Service',
          'To create and manage your account',
          'To generate personalized study timetables',
          'To save your preferences and settings',
          'To authenticate your access to the Service',
          'To respond to your requests and provide customer support',
          'To send you updates about the Service (with your consent)',
          'To analyze usage patterns and improve user experience'
        ]
      },
      sharing: {
        title: '5. Data Sharing and Disclosure',
        description: 'Because your data is stored locally on your device, we do not share, sell, or rent your personal information to third parties. However, we may disclose information in the following circumstances:',
        items: [
          'Legal Requirements: If required by law or in response to valid legal processes',
          'Protection of Rights: To protect our rights, privacy, safety, or property',
          'With Your Consent: When you explicitly authorize us to share information'
        ]
      },
      security: {
        title: '6. Data Security',
        description: 'We implement appropriate security measures to protect your information:',
        items: [
          'Passwords are never stored in plain text',
          'Local storage is encrypted by your browser',
          'We use secure coding practices to prevent vulnerabilities',
          'Regular security updates and maintenance'
        ],
        note: 'However, no method of electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.'
      },
      rights: {
        title: '7. Your Rights and Choices',
        description: 'You have the following rights regarding your data:',
        items: [
          'Access: You can view all your stored data at any time through the Service',
          'Modification: You can edit your profile information and study schedules',
          'Deletion: You can delete your account and all associated data through the Settings page',
          'Export: You can export your timetables for backup purposes',
          'Opt-out: You can disable certain features or notifications in Settings'
        ]
      },
      cookies: {
        title: '8. Cookies and Tracking Technologies',
        content: 'The Service uses localStorage to store your preferences and data locally on your device. We do not use third-party cookies for tracking or advertising purposes. Session information is used solely to maintain your login state and preferences.'
      },
      children: {
        title: "9. Children's Privacy",
        content: 'Our Service is intended for students of all ages. However, we do not knowingly collect personally identifiable information from children under 13 without parental consent. If you are a parent or guardian and believe your child has provided us with personal information, please contact us so we can take appropriate action.'
      },
      thirdParty: {
        title: '10. Third-Party Services',
        content: 'Our Service may contain links to third-party websites or services that are not operated by us. We are not responsible for the privacy practices of these third parties. We encourage you to review the privacy policies of any third-party services you access.'
      },
      retention: {
        title: '11. Data Retention',
        description: "Your data is retained in your browser's localStorage until you explicitly delete it by:",
        items: [
          'Deleting your account through Settings',
          "Clearing your browser's local storage",
          'Uninstalling or resetting your browser'
        ]
      },
      international: {
        title: '12. International Users',
        content: 'Since all data is stored locally on your device, data transfer regulations do not apply. However, if we introduce cloud-based features in the future, we will update this policy to reflect any international data transfer practices.'
      },
      changes: {
        title: '13. Changes to This Privacy Policy',
        content: 'We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes. Your continued use of the Service after changes are posted constitutes acceptance of those changes.'
      },
      contact: {
        title: '14. Contact Us',
        description: 'If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us through:',
        items: [
          'The Settings page in the application',
          'The support section of our website',
          'Our customer service channels'
        ]
      },
      consent: {
        title: 'Your Consent',
        content: 'By using U PLAN, you consent to our Privacy Policy and agree to its terms. If you do not agree with this policy, please do not use our Service.'
      },
      commitment: {
        title: 'Privacy Commitment',
        content: 'We are committed to transparency and protecting your privacy. Your trust is important to us, and we will continue to prioritize the security and confidentiality of your information as we develop and improve our Service.'
      }
    }
  },
  pomodoro: {
    title: 'Pomodoro',
    modes: {
      focus: 'Enfoque',
      break: 'Descanso',
      longBreak: 'Descanso largo'
    },
    pin: 'Fijar',
    focusMode: 'Modo enfoque',
    focusSession: 'Sesión de enfoque',
    running: 'En marcha',
    paused: 'En pausa',
    sessionsToday: 'Sesiones hoy',
    totalSessions: 'Sesiones totales',
    focusTime: 'Tiempo de enfoque',
    stayWithIt: 'Sigue así',
    readyWhenYouAre: 'Listo cuando tú lo estés',
    closeTimer: 'Cerrar temporizador',
    unpinWidgetHint: 'Desfijar widget (se cerrará al navegar)',
    pinWidgetHint: 'Fijar widget (permanece abierto al navegar)',
    today: 'Hoy',
    total: 'Total',
    focusShort: 'Enfoque',
    settings: {
      title: 'Configuración de Pomodoro',
      description: 'Personaliza las preferencias de tu temporizador Pomodoro',
      focus: 'Enfoque',
      break: 'Descanso',
      longBreak: 'Descanso largo',
      durationsMinutes: 'Duraciones (minutos)',
      autoStart: 'Inicio automático',
      autoStartBreaks: 'Iniciar descansos automáticamente',
      autoStartPomodoros: 'Iniciar pomodoros automáticamente',
      notifications: 'Notificaciones',
      desktopNotifications: 'Notificaciones de escritorio',
      soundAlerts: 'Alertas de sonido',
      vibrationMobile: 'Vibración (móvil)',
      sessionSettings: 'Ajustes de sesión',
      longBreakAfterEvery: 'Descanso largo después de cada',
      focusSessions: 'sesiones de enfoque'
    },
    actions: {
      start: 'Iniciar',
      pause: 'Pausa',
      reset: 'Restablecer',
      exit: 'Salir',
      settings: 'Configuración',
      focus: 'alfiler',
      minimize: 'Minimizar',
      expand: 'Expandir'
    }
  },
  navigation: {
    home: 'Inicio',
    about: 'Sobre nosotros',
    services: 'Servicios',
    login: 'Iniciar sesión',
    subtitle: 'Planificación académica',
    logoAlt: 'Logo de PLAN',
    switchToLight: 'Cambiar a modo claro',
    switchToDark: 'Cambiar a modo oscuro',
    openMenu: 'Abrir menú'
  },
  createTimetable: {
    title: 'Create Timetable',
    subtitle: 'Configure your courses, study preferences, and unavailable time to generate an academic schedule.',
    stats: {
      courses: 'Courses',
      hoursPerWeek: 'Hours / Week'
    },
    details: {
      title: 'Timetable Details',
      description: 'Give your timetable a specific name so it can be saved and recognized later.',
      name: 'Timetable Name',
      placeholder: 'e.g., Midterm Prep Plan, Exam Week, Revision Schedule'
    },
    courseSetup: {
      title: 'Course Setup',
      description: 'Add your courses and define how much study time each one needs.'
    },
    fields: {
      courseName: 'Course Name',
      coursePlaceholder: 'e.g., Calculus, Physics, English...',
      hoursNeeded: 'Hours Needed Per Week',
      priorityLevel: 'Priority Level',
      preferredStudyTime: 'Preferred Study Time',
      hoursPerWeek: 'Hours/Week',
      preferredTime: 'Preferred Time',
      preferredStartTime: 'Preferred Start Time',
      optional: 'Optional',
      sessionDuration: 'Session Duration (min)',
      breakDuration: 'Break Duration (min)',
      studyDaysFor: 'Study Days for {{name}}'
    },
    hints: {
      startTime: 'Optional: Set specific start time',
      sessionDuration: 'Recommended: 45-50',
      breakDuration: 'Recommended: 10-15'
    },
    actions: {
      addCourse: 'Add Course',
      resetAll: 'Reset All',
      generate: 'Generate Smart Timetable',
      saveToTimetable: 'Save to Timetable'
    },
    priority: {
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      highLabel: 'High Priority',
      mediumLabel: 'Medium Priority',
      lowLabel: 'Low Priority',
      highDesc: 'Critical courses, upcoming exams',
      mediumDesc: 'Regular coursework',
      lowDesc: 'Optional reading, review'
    },
    time: {
      morning: 'Morning (6AM-12PM)',
      afternoon: 'Afternoon (12PM-6PM)',
      evening: 'Evening (6PM-10PM)',
      any: 'Anytime'
    },
    timeShort: {
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening',
      any: 'Any'
    },
    timeBest: {
      morning: 'Peak focus',
      afternoon: 'Active learning',
      evening: 'Review & practice',
      any: 'Flexible'
    },
    courses: {
      title: 'Your Courses ({{count}})',
      total: 'Total:',
      totalHours: '{{count}}h/week'
    },
    summaryCard: {
      title: 'Time Allocation Summary',
      hoursPercent: '{{count}}h ({{percent}}%)'
    },
    selectedDays: '{{count}} day selected',
    selectedDays_other: '{{count}} days selected',
    success: {
      courseAdded: 'Added {{name}} to your courses',
      blockedAdded: 'Unavailable time blocked successfully!',
      reset: 'All fields have been reset!',
      generated: 'Smart timetable generated successfully!'
    },
    errors: {
      courseNameEnter: 'Please enter a course name',
      courseNameRequired: 'Please enter a course name.',
      blockedTitle: 'Please enter a title for the blocked time',
      timetableName: 'Please enter a timetable name before generating',
      noCourses: 'Please add at least one course before generating a timetable',
      noDays: 'Please select at least one day for studying',
      selectStudyDay: 'Select at least one study day.'
    },
    confirm: {
      reset: 'Are you sure you want to reset all fields? This will clear all your subjects and settings.'
    },
    university: {
      loaded: 'Loaded {{count}} class from your university schedule',
      loaded_other: 'Loaded {{count}} classes from your university schedule'
    },
    import: {
      removedConflicts: 'Removed {{count}} conflicting sessions based on your availability settings',
      defaultName: 'Imported Timetable - {{date}}',
      withAvailability: ' with availability settings',
      savedSuccess: 'Saved {{count}} sessions to Saved Timetables{{settingsMessage}}!',
      savedDescription: 'Go to Saved Timetables to activate and view your schedule'
    },
    file: {
      selected: 'File "{{name}}" selected. Processing...',
      analyzing: 'AI is analyzing your file. This feature is in development.'
    },
    readySummary: 'Ready to generate. You have {{courses}} course and {{hours}} hour of planned study time per week.',
    readySummary_other: 'Ready to generate. You have {{courses}} courses and {{hours}} hours of planned study time per week.'
  },
  days: {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    short: {
      Monday: 'Lun',
      Tuesday: 'Mar',
      Wednesday: 'Mié',
      Thursday: 'Jue',
      Friday: 'Vie',
      Saturday: 'Sáb',
      Sunday: 'Dom'
    }
  },
  settings: {
    title: 'Settings',
    subtitle: 'Manage your account, reminders, and workspace preferences',
    tabs: {
      profile: 'Profile',
      workspace: 'Workspace'
    },
    profile: {
      title: 'Profile Information',
      description: 'Update your personal information and contact details',
      picture: 'Profile Picture',
      pictureAlt: 'Profile',
      uploadPicture: 'Upload picture',
      pictureHint: 'JPG, PNG, or GIF. Max size 5MB.',
      fields: {
        department: 'Department'
      },
      placeholders: {
        fullName: 'Enter your full name',
        email: 'Enter your email',
        department: 'Enter your department',
        dateOfBirth: 'Enter your date of birth'
      },
      actions: {
        edit: 'Edit Profile',
        save: 'Save Changes'
      }
    },
    notifications: {
      title: 'Notifications',
      description: 'Manage how you receive notifications and reminders',
      push: {
        title: 'Push Notifications',
        description: 'Receive notifications about your study schedule'
      },
      emailStudyReminders: {
        title: 'Email Study Reminders',
        description: 'Receive an email reminder before each planned study session'
      },
      minutesBefore: {
        title: 'Minutes before',
        description: 'How early to send the reminder email',
        select: 'Select',
        options: {
          atStart: '0 (at start)'
        }
      },
      deadlineAlerts: {
        title: 'Email Deadline Alerts',
        description: 'Get an email when a deadline is approaching'
      },
      achievementAlerts: {
        title: 'Email Achievement Alerts',
        description: 'Get an email when you unlock an achievement'
      },
      weeklySummary: {
        title: 'Email Weekly Summary',
        description: 'Receive a weekly summary of your progress'
      }
    },
    appearance: {
      title: 'Appearance',
      description: 'Customize the look and feel of your dashboard',
      darkMode: {
        title: 'Dark mode',
        description: 'Switch to a darker interface for low-light use'
      }
    },
    about: {
      title: 'About',
      version: 'Application Version',
      versionValue: '1.0.0',
      lastUpdated: 'Last Updated',
      lastUpdatedValue: 'October 2025',
      description: 'Our platform helps learners and study teams plan schedules, manage deadlines, track progress, and stay aligned with structured study workflows.'
    },
    password: {
      title: 'Change Password',
      description: 'Create a strong password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.',
      fields: {
        current: 'Current Password',
        new: 'New Password',
        confirm: 'Confirm New Password'
      },
      placeholders: {
        current: 'Enter current password',
        new: 'Enter new password',
        confirm: 'Re-enter new password'
      },
      actions: {
        update: 'Update password'
      },
      errors: {
        fillAllFields: 'Please fill in all password fields',
        sameAsCurrent: 'New password must be different from current password',
        requirements: 'Password does not meet requirements',
        noMatch: 'Passwords do not match',
        userNotLoggedIn: 'User not logged in',
        changeFailed: 'Failed to change password',
        server: 'Server error. Please try again later.'
      },
      success: {
        changed: 'Password changed successfully!',
        changedDescription: 'Your password has been updated securely.'
      }
    },
    success: {
      profilePictureUpdated: 'Profile picture updated successfully!',
      profilePictureRemoved: 'Profile picture removed successfully!',
      profileUpdated: 'Profile updated successfully!',
      reminderSettingsUpdated: 'Reminder settings updated'
    },
    errors: {
      notLoggedIn: 'You are not logged in',
      uploadImageOnly: 'Please upload an image file',
      uploadImageFailedWithReason: 'Failed to upload image: {{reason}}',
      profilePictureUploadFailed: 'Failed to upload profile picture',
      updateProfileFailed: 'Failed to update profile',
      updateReminderSettingsFailed: 'Failed to update reminder settings'
    }
  },
  courseEdit: {
    title: 'Edit Course',
    description: 'Edit the details of your course to ensure your timetable is accurate and reflects your study schedule.',
    fields: {
      name: 'Course Name',
      hours: 'Hours/Week',
      preferredTime: 'Preferred Time',
      startTime: 'Preferred Start Time',
      sessionDuration: 'Session Duration (min)',
      breakDuration: 'Break Duration (min)',
      studyDays: 'Study Days for {{name}}',
      priority: 'Priority Level'
    },
    placeholders: {
      name: 'e.g., Mathematics'
    },
    time: {
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening',
      any: 'Any'
    },
    priority: {
      high: 'High Priority',
      medium: 'Medium Priority',
      low: 'Low Priority'
    },
    hints: {
      startTime: 'Optional: Set specific start time',
      session: 'Recommended: 45-50',
      break: 'Recommended: 10-15'
    },
    selectedDays: '{{count}} day selected',
    actions: {
      save: 'Save Changes',
      cancel: 'Cancel',
      delete: 'Delete Course'
    },
    errors: {
      nameRequired: 'Course name is required',
      selectDay: 'Please select at least one study day'
    },
    confirmDelete: 'Are you sure you want to delete "{{name}}"? This will regenerate your timetable without this course.'
  },
  assessments: {
    title: 'Assessments',
    subtitle: 'Manage exams, quizzes, assignments, and projects in one place.',
    listTitle: 'Assessments',
    listDescription: 'These automatically show up in the Dashboard Deadlines tab.',
    empty: {
      title: 'No assessments added yet',
      description: 'Add your first exam, quiz, assignment, or project below.'
    },
    add: {
      title: 'Add assessment',
      description: 'Create a new assessment and it will appear in your deadlines overview.',
      button: 'Add assessment'
    },
    fields: {
      course: 'Course',
      type: 'Type',
      dateTime: 'Date & time',
      titleOptional: 'Title (optional)'
    },
    placeholders: {
      selectCourse: 'Select course',
      title: 'Leave blank to auto-name'
    },
    courseHint: 'If a course is missing, add it in Auto Generate → Class Timetable.',
    due: 'Due',
    completed: 'Completed',
    types: {
      exam: 'Exam',
      quiz: 'Quiz',
      assignment: 'Assignment',
      project: 'Project'
    },
    success: {
      added: 'Assessment added',
      deleted: 'Assessment deleted'
    },
    errors: {
      selectCourse: 'Please select a course for the assessment',
      chooseDate: 'Please choose a date/time for the assessment',
      createFailed: 'Failed to create assessment',
      updateFailed: 'Failed to update'
    }
  },
  calendar: {
    title: 'Study Timetable',
    subtitle: 'this timetable is for my exam week'
  },
  sessionCard: {
    confirmDelete: 'Delete "{{name}}"?'
  },
  sessionTypes: {
    reading: 'Reading',
    revision: 'Revision',
    practice: 'Practice',
    break: 'Break',
    lecture: 'Lecture',
    assignment: 'Assignment',
    test: 'Test',
    exam: 'Exam'
  },
  sessionDialog: {
    add: {
      title: 'Add Study Session',
      description: 'Fill in the details to add a new study session to your timetable.'
    },
    edit: {
      title: 'Edit Session',
      description: 'Update the details of your study session.'
    },
    fields: {
      subject: 'Subject',
      day: 'Day',
      startTime: 'Start Time',
      endTime: 'End Time',
      type: 'Type',
      deadline: 'Deadline Date'
    },
    placeholders: {
      subject: 'e.g., Mathematics, Physics'
    },
    actions: {
      add: 'Add',
      update: 'Update',
      session: 'Session'
    },
    errors: {
      subjectRequired: 'Please enter a subject',
      endTimeAfterStart: 'End time must be after start time'
    },
    confirm: {
      noDeadline: "You're creating a {{type}} without a deadline. Are you sure you want to continue?"
    },
    deadlineHelp: 'This deadline will appear in your Upcoming Deadlines section',
    days: {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday'
    }
  },
  reminders: {
    title: 'Reminders & Notifications',
    subtitle: 'Set up reminders for your study sessions and important tasks',
    actions: {
      add: 'Add Reminder',
      create: 'Create Reminder'
    },
    dialog: {
      title: 'Create Reminder',
      description: 'Set up a new reminder to stay on top of your study schedule.'
    },
    form: {
      title: 'Title',
      description: 'Description',
      time: 'Time',
      type: 'Type',
      repeat: 'Repeat on',
      required: '*',
      placeholderTitle: 'e.g., Study Mathematics',
      placeholderDescription: 'Additional details...',
      error: 'Please fill in all required fields and select at least one day'
    },
    types: {
      study: 'Study',
      break: 'Break',
      exam: 'Exam',
      custom: 'Custom'
    },
    notifications: {
      title: 'Notification Settings',
      description: 'Enable browser notifications to receive reminders',
      browser: 'Browser Notifications',
      browserDesc: 'Get notified about your scheduled reminders',
      enabled: 'Notifications enabled!',
      denied: 'Notification permission denied',
      notSupported: 'Notifications not supported in this browser'
    },
    presets: {
      title: 'Quick Add Presets',
      added: 'Preset reminder added!',
      morning: {
        title: 'Morning Study Session',
        description: 'Time to start your morning study session!'
      },
      afternoon: {
        title: 'Afternoon Study Session',
        description: "Don't forget your afternoon study time!"
      },
      break: {
        title: 'Take a Break',
        description: 'Time for a well-deserved break!'
      }
    },
    list: {
      title: 'Your Reminders',
      empty: 'No reminders set',
      emptySub: 'Create your first reminder or add a preset'
    },
    toast: {
      added: 'Reminder added successfully!',
      deleted: 'Reminder deleted'
    },
    tip: {
      title: 'Tip:',
      description: 'Make sure to allow notifications in your browser settings for the best experience.',
      extra: 'Reminders will work even when the app is running in the background.'
    },
    weekdays: {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday'
    }
  },
  viewTimetables: {
    title: 'Saved Timetables',
    description: 'Review, preview, launch, export, and manage your saved schedules.',
    stats: {
      sessions: 'Sessions',
      subjects: 'Subjects',
      hoursPerDay: 'Hours/day'
    },
    empty: {
      title: 'No Saved Timetables',
      description: 'You haven’t created any timetables yet.',
      create: 'Create Timetable'
    },
    card: {
      untitled: 'Untitled Timetable',
      active: 'Active',
      created: 'Created {{date}}',
      breakEvery: 'Break every {{minutes}} min'
    },
    actions: {
      view: 'View',
      preview: 'Preview',
      start: 'Start timetable',
      merge: 'Merge',
      overwrite: 'Overwrite',
      duplicate: 'Duplicate',
      delete: 'Delete',
      exportCsv: 'Export CSV',
      exportJson: 'Export JSON',
      exportPdf: 'Export PDF'
    },
    confirm: {
      delete: 'Are you sure you want to delete this timetable?'
    },
    dialog: {
      useThisTimetable: 'Use this timetable?',
      myTimetable: 'My Timetable',
      description: {
        before: 'You already have sessions in ',
        after: ' You can merge this timetable into your current schedule or overwrite everything.'
      }
    },
    export: {
      pdfTitle: 'Study Timetable',
      csvTitle: 'Study Timetable',
      createdOn: 'Created on {{date}}',
      createdOnShort: 'Created on {{date}}',
      generatedOn: 'Generated on {{date}}',
      studyHoursPerDay: 'Study Hours per Day: {{value}}',
      studyTime: 'Study Time: {{start}} - {{end}}',
      sessionLength: 'Session Length: {{value}}',
      breakDuration: 'Break Duration: {{value}}',
      studyHoursPerDayLabel: 'Study Hours per Day:',
      studyTimeLabel: 'Study Time:',
      sessionLengthLabel: 'Session Length:',
      breakDurationLabel: 'Break Duration:',
      subjects: 'Subjects:',
      weeklySchedule: 'Weekly Schedule:',
      priority: 'priority'
    },
    days: {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday'
    },
    toasts: {
      showingSubject: 'Showing “{{subject}}” in {{name}}',
      deleted: 'Timetable deleted successfully',
      started: 'Timetable started!',
      startedOverwriteDescription: 'Your My Timetable has been replaced with this saved timetable',
      startedMerged: 'Timetable started (merged)',
      startedMergeDescription: 'Your saved timetable was merged into your current calendar',
      sessionUnavailable: 'One or more sessions unavailable',
      generatingPdf: 'Generating PDF...',
      pdfDownloaded: 'PDF downloaded successfully!',
      pdfFailed: 'Failed to generate PDF. Please try again.',
      generatingCsv: 'Generating CSV file...',
      csvDownloaded: 'CSV file downloaded successfully! (Open with Excel)',
      exportFailed: 'Failed to export file. Please try again.',
      jsonDownloaded: 'JSON downloaded successfully!',
      jsonFailed: 'Failed to export JSON'
    }
  },
  sharedTimetable: {
    title: 'Shared Timetables',
    subtitle: 'Collaborate on timetables with your team',
    searchPlaceholder: 'Search timetables...',
    noDescription: 'No description',
    personal: {
      description: 'Personal Timetable',
      defaultName: 'My Timetable',
      sharedSuffix: 'Shared',
      copySuffix: 'Copy',
      importedDescription: 'Imported from personal timetable'
    },
    stats: {
      total: 'Total Accessible',
      owned: 'Owned by You',
      editable: 'Can Edit',
      viewOnly: 'View Only'
    },
    filters: {
      all: 'All Timetables',
      owner: 'Owned by Me',
      editor: 'Can Edit',
      viewer: 'View Only'
    },
    actions: {
      importMyTimetable: 'Import My Timetable',
      createShared: 'Create Shared Timetable',
      copyToPersonal: 'Copy to Personal',
      managePermissions: 'Manage Permissions',
      viewSessions: 'View Sessions',
      createTimetable: 'Create Timetable',
      importTimetable: 'Import Timetable',
      savePermissions: 'Save Permissions'
    },
    badges: {
      owner: 'Owner',
      canEdit: 'Can Edit',
      viewOnly: 'View Only'
    },
    visibility: {
      public: 'Public',
      private: 'Private',
      publicHelp: 'All workspace members can view',
      privateHelp: 'Only selected members can view',
      publicDescription: 'Public - All members can view',
      privateDescription: 'Private - Limited access',
      publicDialog: 'Public - All members can view',
      privateDialog: 'Private - Only selected members'
    },
    fields: {
      name: 'Timetable Name',
      description: 'Description',
      visibility: 'Visibility',
      editors: 'Who can edit? (Select members)',
      editorsSimple: 'Editors',
      sessions: 'Sessions'
    },
    placeholders: {
      name: 'e.g., Spring 2025 Class Schedule',
      description: 'Brief description of this timetable'
    },
    roles: {
      admin: 'Admin',
      member: 'Member'
    },
    createDialog: {
      title: 'Create Shared Timetable',
      description: 'Create a new timetable that can be edited by team members'
    },
    importDialog: {
      title: 'Import Personal Timetable',
      description: 'Import your current active timetable as a shared timetable',
      alert: 'This will create a new shared timetable with all sessions from your active personal timetable. All workspace members will be able to edit it by default.'
    },
    permissionsDialog: {
      title: 'Manage Permissions',
      description: 'Control who can view and edit this timetable'
    },
    viewDialog: {
      title: 'View Timetable',
      description: 'View the sessions in this timetable'
    },
    selectedEditorsInfo: 'Selected: {{count}} member(s). You (owner) can always edit.',
    sessionsCount: '{{count}} sessions',
    editorsCount: '{{count}} editors',
    byOwner: 'by {{name}}',
    modifiedAt: 'Modified {{date}}',
    modifiedBy: 'by {{name}}',
    confirm: {
      delete: 'Are you sure you want to delete "{{name}}"?'
    },
    success: {
      created: 'Shared timetable created successfully!',
      importedWithCount: 'Imported timetable with {{count}} sessions!',
      deleted: 'Timetable deleted successfully',
      permissionsUpdated: 'Permissions updated successfully',
      copiedToPersonal: 'Timetable copied to your personal timetables!'
    },
    errors: {
      enterName: 'Please enter a timetable name',
      noPersonalToImport: 'No personal timetables found to import',
      noActiveFound: 'No active timetable found',
      deletePermission: 'Only the owner or admin can delete this timetable',
      permissionsPermission: 'Only the owner or admin can change permissions'
    },
    info: {
      viewingWithCount: 'Viewing {{name}} - {{count}} sessions'
    },
    history: {
      createdPersonal: 'Created personal timetable',
      created: 'Created timetable',
      importedFromPersonal: 'Imported from personal timetable',
      updatedPermissions: 'Updated permissions'
    }
  },
  teamCollaboration: {
    defaults: {
      member: 'Member'
    },
    stats: {
      sharedSchedules: 'Shared Schedules',
      activeMembers: 'Active Members',
      avgCompletion: 'Avg Completion',
      recentUpdates: 'Recent Updates'
    },
    sharedSchedules: {
      title: 'Shared Schedules',
      description: 'Schedules shared with the team'
    },
    progress: {
      title: 'Team Progress',
      description: 'Track completion rates across the team',
      completedCount: '{{completed}}/{{total}} completed',
      details: '{{hours}}h · Streak {{streak}}d · Goal {{goal}}%'
    },
    activity: {
      title: 'Recent Activity',
      description: 'What your team has been up to'
    },
    actions: {
      shareSchedule: 'Share Schedule',
      view: 'View',
      import: 'Import'
    },
    empty: {
      schedulesTitle: 'No shared schedules yet',
      schedulesDescription: 'Share a schedule to collaborate with your team',
      progress: 'No progress data yet',
      activity: 'No recent activity'
    },
    visibility: {
      allMembers: 'All Members',
      allMembersHelp: 'Everyone can view and use',
      adminsOnly: 'Admins Only',
      adminsOnlyHelp: 'Only admins can view'
    },
    shareDialog: {
      title: 'Share Schedule with Team',
      description: 'Select a schedule to share with your workspace members',
      selectSchedule: 'Select Schedule',
      schedulePlaceholder: 'Choose a schedule to share',
      noSchedules: 'No schedules available',
      createFirst: 'Create a timetable first',
      visibility: 'Visibility'
    },
    errors: {
      selectSchedule: 'Please select a schedule to share',
      scheduleNotFound: 'Schedule not found'
    },
    success: {
      shared: 'Schedule "{{name}}" shared successfully!',
      progressUpdated: 'Progress updated successfully!'
    },
    info: {
      viewingDetails: 'Viewing schedule details...'
    },
    activities: {
      scheduleShared: 'shared schedule "{{name}}" with the team',
      progressUpdated: 'updated their progress to {{completed}}/{{total}} sessions completed'
    },
    sessionsCount: '{{count}} sessions',
    sharedBy: 'Shared by {{name}}',
    time: {
      justNow: 'Just now',
      minutesAgo: '{{count}}m ago',
      hoursAgo: '{{count}}h ago',
      daysAgo: '{{count}}d ago'
    }
  },
  welcomeWalkthrough: {
    greeting: 'Hi {{name}}. ',
    stepCounter: 'Step {{current}} / {{total}}',
    quickTips: 'Quick tips',
    actions: {
      skipWalkthrough: 'Skip walkthrough',
      openThisPage: 'Open this page',
      skip: 'Skip',
      finish: 'Finish',
      next: 'Next'
    },
    steps: {
      welcome: {
        title: 'Welcome to U PLAN',
        description: 'This quick walkthrough shows you where the important stuff is. You can skip anytime and come back later.',
        tips: [
          'Tip: you can refresh safely now — the app will keep your page.'
        ]
      },
      autoGenerate: {
        title: 'Auto-generate a study timetable',
        description: 'Use Auto-Generate to build a weekly plan. You can shuffle to get a different result, or keep a seed to reproduce it.',
        tips: [
          'Try: Auto-Generate → Shuffle',
          'Then: Save timetable → Apply to week'
        ]
      },
      assessments: {
        title: 'Assessments & Deadlines',
        description: 'Add deadlines/exams so the generator allocates more time to urgent courses — even when multiple exams happen in the same week.',
        tips: [
          'Try: add 2 exams in the same week and re-generate'
        ]
      },
      workspace: {
        title: 'Workspace',
        description: 'Workspaces let you collaborate with teammates using chat and shared planning.',
        tips: [
          'Chat updates live while you are on the chat page.'
        ]
      }
    }
  },
  timetable: {
    back: 'Back',
    title: 'Timetable Results',
    subtitle: 'Review, refine, and save your generated academic schedule.',
    blocked: {
      sleep: 'Sleep',
      lunchBreak: 'Lunch Break',
      dinnerBreak: 'Dinner Break',
      default: 'Blocked Time'
    },
    break: 'Break',
    unavailable: 'Unavailable',
    minutes: '{{count}} min',
    stats: {
      sessions: 'Sessions',
      hours: 'Hours',
      courses: 'Courses'
    },
    summary: {
      title: 'Schedule summary',
      description: 'Your schedule was generated using course priority, preferred study windows, blocked time, and session/break settings.',
      priorityLabel: 'Priority-based allocation:',
      priorityText: 'higher-priority courses are placed in stronger study windows.',
      timePreferencesLabel: 'Time preferences:',
      timePreferencesText: 'courses are placed in preferred morning, afternoon, or evening windows where possible.',
      conflictAvoidanceLabel: 'Conflict avoidance:',
      conflictAvoidanceText: 'study sessions avoid {{count}} blocked slot(s).',
      sessionStructureLabel: 'Session structure:',
      sessionStructureText: '{{sessionDuration}} minute sessions with {{breakDuration}} minute breaks.'
    },
    actions: {
      save: 'Save Timetable',
      editCourses: 'Edit Courses',
      splitLongSessions: 'Split Long Sessions',
      mergeAdjacentSessions: 'Merge Adjacent Sessions',
      createNew: 'Create New'
    },
    unavailableTime: {
      title: 'Unavailable time respected',
      description: 'Study sessions were scheduled around {{count}} unavailable time slot(s).'
    },
    availability: {
      title: 'Availability & Breaks Settings',
      weekdayHours: 'Weekday Hours:',
      weekendHours: 'Weekend Hours:',
      sleepHours: 'Sleep Hours:',
      lunchBreak: 'Lunch Break:',
      dinnerBreak: 'Dinner Break:',
      commuteBuffer: 'Commute Buffer:',
      commuteMinutes: '{{count}} minutes',
      noneFound: 'No availability settings found for this timetable.'
    },
    empty: {
      title: 'No schedule generated',
      description: 'There was an issue generating the schedule. Please check that you selected study days and added courses.'
    },
    dayDescription: '{{count}} study session(s) • {{hours}}h total',
    dayEmpty: 'No sessions scheduled for this day',
    tips: {
      title: 'Study tips',
      followScheduleLabel: 'Follow the schedule:',
      followScheduleText: 'the timetable was generated around your priorities and free time.',
      useBreaksLabel: 'Use breaks well:',
      useBreaksText: 'rest, hydrate, and reset between study blocks.',
      adjustWhenNeededLabel: 'Adjust when needed:',
      adjustWhenNeededText: 'regenerate if your courses or unavailable time change.',
      stayConsistentLabel: 'Stay consistent:',
      stayConsistentText: 'shorter repeatable sessions usually work better than overloading one day.'
    },
    unsaved: {
      title: 'Unsaved Timetable',
      titleWithWarning: '⚠️ Unsaved Timetable',
      backDescription: "You haven't saved your timetable yet. If you go back to the dashboard now, all your generated schedule will be lost.",
      backQuestion: 'Would you like to stay and save your timetable, or discard it and go back?',
      createNewDescription: "You haven't saved your timetable yet. If you create a new timetable now, all your generated schedule will be lost.",
      createNewQuestion: 'Would you like to stay and save your timetable, or discard it and create a new one?',
      discardAndGoBack: 'Discard & Go Back',
      stayAndSave: 'Stay & Save',
      discardAndCreateNew: 'Discard & Create New'
    },
    courseDialog: {
      title: 'Edit Course Settings',
      description: 'Select a course to modify its details, change times, or delete it.',
      courseMeta: '{{hours}}h/week • {{priority}} priority',
      noCourses: 'No courses available'
    },
    toast: {
      splitSuccess: 'Long sessions split into Pomodoros! Sessions over 90 minutes have been divided with breaks.',
      mergeSuccess: 'Adjacent sessions merged! Same-subject sessions close together have been combined.',
      savedWithWeek: 'Timetable saved! Sessions added to week {{weekId}}',
      addedToMyTimetable: '{{count}} sessions added to My Timetable for week {{weekId}}!',
      pdfComingSoon: 'PDF export feature coming soon!',
      googleCalendarConnectFirst: 'Please connect to Google Calendar in Settings first',
      exportingGoogleCalendar: 'Exporting to Google Calendar...',
      exportedGoogleCalendar: 'Successfully exported {{count}} study sessions to Google Calendar!',
      failedGoogleCalendar: 'Failed to export to Google Calendar',
      courseUpdated: 'Course "{{name}}" updated! Schedule regenerated.',
      cannotDeleteLastCourse: 'Cannot delete the last course. Please add another course first.',
      courseDeleted: 'Course deleted! Schedule regenerated.'
    }
  },
  terms: {
    back: 'Back',
    title: 'Terms of Service',
    lastUpdated: 'Last Updated: October 24, 2025',
    sections: {
      acceptance: {
        title: '1. Acceptance of Terms',
        content: 'By accessing and using U PLAN ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.'
      },
      service: {
        title: '2. Description of Service',
        description: 'U PLAN provides students with tools to create, manage, and optimize their study schedules. The Service includes:',
        items: [
          'Interactive weekly calendar for study session planning',
          'Smart scheduling algorithms based on course priorities',
          'Manual creation and editing of study sessions',
          'Timetable saving and management features',
          'Dark mode and customization options'
        ]
      },
      accounts: {
        title: '3. User Accounts',
        description: 'To use certain features of the Service, you must register for an account. You agree to:',
        items: [
          'Provide accurate, current, and complete information during registration',
          'Maintain the security of your password and account',
          'Notify us immediately of any unauthorized use of your account',
          'Accept responsibility for all activities that occur under your account'
        ]
      },
      storage: {
        title: '4. User Data and Local Storage',
        content: 'The Service stores your data locally in your browser using localStorage. This includes your account information, timetables, study sessions, and preferences. You are responsible for maintaining backups of your data. We are not liable for any loss of data stored locally on your device.'
      },
      use: {
        title: '5. Acceptable Use',
        description: 'You agree not to use the Service to:',
        items: [
          'Violate any applicable laws or regulations',
          'Infringe upon the rights of others',
          'Transmit any harmful or malicious code',
          'Attempt to gain unauthorized access to the Service',
          'Use the Service for any commercial purposes without permission',
          'Interfere with or disrupt the Service or servers'
        ]
      },
      ip: {
        title: '6. Intellectual Property',
        content: 'The Service and its original content, features, and functionality are owned by U PLAN and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. Your use of the Service does not grant you ownership of any intellectual property rights.'
      },
      disclaimer: {
        title: '7. Disclaimer of Warranties',
        content: 'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not warrant that the Service will be uninterrupted, timely, secure, or error-free.'
      },
      liability: {
        title: '8. Limitation of Liability',
        content: 'IN NO EVENT SHALL U PLAN, ITS DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE.'
      },
      education: {
        title: '9. Educational Purpose',
        content: 'The Service is designed to assist with study planning and time management. It is not a substitute for professional academic advising. Study schedules generated by the Service are suggestions and should be adapted based on individual needs and circumstances.'
      },
      modifications: {
        title: '10. Modifications to Service',
        content: 'We reserve the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice. You agree that we shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.'
      },
      changes: {
        title: '11. Changes to Terms',
        content: 'We reserve the right to update or modify these Terms of Service at any time without prior notice. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms of Service. We will update the "Last Updated" date at the top of this page when changes are made.'
      },
      termination: {
        title: '12. Termination',
        content: 'We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms of Service. Upon termination, your right to use the Service will immediately cease.'
      },
      law: {
        title: '13. Governing Law',
        content: 'These Terms shall be governed and construed in accordance with applicable laws, without regard to its conflict of law provisions. Any disputes arising from these Terms or use of the Service shall be resolved through binding arbitration.'
      },
      contact: {
        title: '14. Contact Information',
        content: "If you have any questions about these Terms of Service, please contact us through the app's support channels or settings page."
      },
      consent: 'By using U PLAN, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.'
    }
  },
  dashboard: {
    refresh: 'Actualizar',
    tasksDone: 'Evaluaciones completadas a tiempo',
    tasks: 'tareas',
    dailyOverview: 'Resumen diario',
    welcomeBack: 'Bienvenido de nuevo, {{name}}',
    studyHours: 'Horas de estudio',
    sessions: 'Sesiones',
    upcoming: 'Próximas',
    focusTimer: 'Temporizador de enfoque',
    focus: 'Enfoque',
    break: 'Descanso',
    longBreak: 'Descanso largo',
    timerRunning: 'El temporizador está en marcha',
    timerReady: 'Listo para empezar',
    start: 'Iniciar',
    pause: 'Pausa',
    reset: 'Restablecer',
    open: 'Abrir',
    todayProgress: 'Progreso de hoy',
    studyCompletion: 'Progreso de estudio',
    weekGoal: 'Meta semanal',
    notSet: 'Sin definir',
    completedSessions: 'Sesiones completadas',
    currentSession: 'Sesión actual',
    noActiveSession: 'No hay sesión activa',
    none: 'Ninguna',
    today: 'Hoy',
    todayShort: 'Hoy',
    calendar: 'Calendario',
    insights: 'Análisis',
    fullView: 'Vista completa',
    focusView: 'Vista enfoque',
    nextSession: 'Próxima sesión',
    live: 'En vivo',
    startsAt: 'Empieza a las {{time}}',
    noMoreSessionsToday: 'No hay más sesiones hoy',
    todaysScheduleProgress: 'Horario y progreso de hoy',
    totalHours: 'Horas totales',
    completed: 'Completado',
    minutesShort: 'min',
    noSessionsToday: 'No hay sesiones programadas para hoy',
    addSessions: 'Añadir sesiones',
    studyProgressOverview: 'Resumen del progreso de estudio',
    week: 'Semana',
    month: 'Mes',
    completedHours: 'Horas completadas',
    weeklyGoal: 'Meta semanal',
    setWeeklyGoalHint: 'Define una meta semanal en Objetivos y logros',
    noStudyDataWeek: 'No hay datos de estudio esta semana. Empieza a programar sesiones para seguir tu progreso.',
    deadlines: 'Fechas límite',
    priority: {
      high: 'High',
      medium: 'Medium',
      low: 'Low'
    },
    taskTypes: {
      assignment: 'Assignment',
      exam: 'Exam',
      quiz: 'Quiz',
      project: 'Project'
    },
    calendarTag: 'Calendar',
    tomorrow: 'Tomorrow',
    overdue: 'Overdue',
    daysCount: '{{count}} days',
    markDone: 'Mark as done',
    noUpcomingDeadlines: 'No upcoming deadlines',
    smartInsights: 'Smart insights',
    aiRecommendations: 'AI-powered recommendations',
    todaysRecommendations: 'Today’s recommendations',
    quickStats: 'Quick stats',
    todaysHours: 'Today’s hours',
    studyStreak: 'Study streak',
    completedToday: 'Completed today',
    nextFocusSession: 'Next focus session',
    allDoneToday: 'All done for today',
    nextSessionAt: 'Next session: {{subject}} at {{time}}',
    considerBreak: 'You’ve been studying hard. Consider taking a short break.',
    morningGreat: 'This is a great time for focused study.',
    focusDeadline: 'Focus on {{subject}} — deadline approaching',
    allCaughtUp: 'All caught up. Time to get ahead.',
    thisIsBreak: 'This is a break session.',
    sessionAlreadyMissed: 'This session was already marked missed.',
    startingEarly: `You're starting "{{subject}}" early.`,
    countTowardRecent: 'Count this time toward your most recent session "{{recent}}" instead?',
    okCountsToward: 'OK = count toward "{{recent}}"',
    cancelStartsEarly: 'Cancel = start "{{subject}}" early',
    addNewTask: 'Add new task',
    addTaskDescription: 'Create a new assignment, exam, quiz, or project deadline.',
    taskTitle: 'Task title',
    taskTitlePlaceholder: 'e.g., Math Assignment Chapter 5',
    taskTitleHint: 'Optional — leave blank to auto-name (e.g., "{{example}}").',
    subject: 'Subject',
    selectCourse: 'Select a course',
    fillClassScheduleFirst: 'Fill your class schedule first',
    priorityLocked: 'Priority is locked from your class schedule',
    type: 'Type',
    dueDate: 'Due date',
    cancel: 'Cancel',
    addTask: 'Add task',
    monthlyHours: 'Monthly hours',
    activeDays: 'Active days',
    dailyAverage: 'Daily average',
    monthlyOverview: 'Monthly overview',
    bestDay: 'Best day',
    line: 'Line',
    bar: 'Bar',
    todayLabel: 'Today',
    shortDays: {
      mon: 'Mon',
      tue: 'Tue',
      wed: 'Wed',
      thu: 'Thu',
      fri: 'Fri',
      sat: 'Sat',
      sun: 'Sun'
    },
    study: 'Study',
    skipped: 'Skipped',
    missed: 'Missed',
    success: {
      taskAdded: 'Task added successfully',
      taskUpdated: 'Task updated',
      taskDeleted: 'Task deleted',
      deadlineRemoved: 'Deadline removed from calendar session',
      timetableActivated: 'Timetable activated successfully'
    },
    savedTimetables: 'Horarios guardados',
    viewAll: 'Ver todo',
    untitledTimetable: 'Horario sin título',
    active: 'Activo',
    activate: 'Activar',
    noSavedTimetables: 'Aún no hay horarios guardados',
    createFirstTimetableHint: 'Create a timetable and activate it directly from your dashboard.',
    createTimetable: 'Crear horario',
    sessionsCount_one: '{{count}} session',
    sessionsCount_other: '{{count}} sessions',
    errors: {
      missingUser: 'Missing user. Please log in again.',
      missingSessionId: 'Session is missing an id.',
      failedStartSession: 'Failed to start session',
      loginToAddDeadline: 'Please log in to add deadlines',
      failedAddTask: 'Failed to add task',
      pleaseLogin: 'Please log in',
      failedUpdateTask: 'Failed to update task',
      failedDeleteTask: 'Failed to delete task',
      fillRequired: 'Please fill in all required fields',
      activateUnavailable: 'Timetable activation is not available here',
      failedActivateTimetable: 'Failed to activate timetable'
    },
    pages: {
      dashboard: 'Dashboard',
      academicTimetable: 'Academic Timetable',
      scheduleGenerator: 'Schedule Generator',
      assessments: 'Assessments',
      studyNotes: 'Study Notes',
      collaboration: 'Collaboration',
      performance: 'Performance',
      createSchedule: 'Create Schedule',
      savedSchedules: 'Saved Schedules'
    },
    sections: {
      planning: 'Planning',
      academicWork: 'Academic Work',
      performance: 'Performance',
      system: 'System'
    },
    search: {
      placeholder: 'Search timetables, pages, subjects...',
      short: 'Search...',
      page: 'Page',
      savedTimetable: 'Saved timetable',
      inTimetable: 'in {{name}}',
      noResults: 'No results found',
      noResultsWithQuery: 'No results found for "{{query}}"',
      tryDifferent: 'Try a different timetable or subject'
    },
    actions: {
      lightMode: 'Switch to Light Mode',
      darkMode: 'Switch to Dark Mode',
      pomodoro: 'Open Pomodoro Timer'
    },
    notifications: {
      title: 'Notifications',
      markAll: 'Mark all as read',
      empty: 'No notifications'
    },
    user: {
      student: 'Student',
      profile: 'Profile Settings',
      planner: 'Student Planner'
    },
    sidebar: {
      expand: 'Expand sidebar',
      collapse: 'Collapse sidebar',
      portal: 'Student Portal',
      workspace: 'Academic Workspace'
    },
    footer: 'Organize your learning'
  },
  workspace: {
    title: 'Workspace',
    loading: 'Loading workspace...',
    switch: 'Switch workspace',
    choose: 'Choose a workspace or open a subworkspace',
    under: 'Under {{name}}',
    subworkspaces: 'Subworkspaces',
    loadingSubworkspaces: 'Loading subworkspaces...',
    noSub: 'No subworkspaces yet.',
    createSub: 'Create Subworkspace',
    createNew: 'Create New Workspace',
    new: 'New Workspace',
    share: 'Share',
    edit: 'Edit Workspace',
    delete: 'Delete Workspace',
    uploadAvatar: 'Upload workspace avatar',
    searchMembers: 'Search members by name, email, or role...',
    defaults: {
      name: 'My Study Workspace',
      description: 'Collaborative study planning and scheduling'
    },
    chat: {
      welcome: '¡Bienvenido a {{name}}! Empieza a colaborar con tu equipo.',
      teamActivity: 'Actividad del equipo',
      online: 'En línea',
      onlineCount_one: '{{count}} en línea',
      onlineCount_other: '{{count}} en línea',
      activeNow: 'Activo ahora',
      lastSeen: 'Visto por última vez {{time}}',
      justNow: 'Justo ahora',
      emptyTitle: 'Aún no hay mensajes',
      emptySubtitle: 'Empieza la conversación',
      me: 'Yo',
      edited: 'editado',
      newMessages: 'Nuevos mensajes',
      newMessagesCount_one: '{{count}} mensaje nuevo',
      newMessagesCount_other: '{{count}} mensajes nuevos',
      quickEmojis: 'Emojis rápidos',
      placeholder: 'Escribe tu mensaje...',
      hint: 'Pulsa Enter para enviar, Shift+Enter para nueva línea',
      yesterdayAt: 'Ayer a las {{time}}',
      link: 'Enlace compartido',
      confirmDeleteMessage: '¿Seguro que quieres eliminar este mensaje?',
      actions: {
        send: 'Enviar',
        save: 'Guardar',
        cancel: 'Cancelar',
        edit: 'Editar',
        delete: 'Eliminar',
        addEmoji: 'Añadir emoji',
        attachFile: 'Adjuntar archivo'
      },
      success: {
        messageUpdated: 'Mensaje actualizado',
        messageDeleted: 'Mensaje eliminado',
        fileShared: '¡Archivo compartido en el chat!'
      },
      errors: {
        loadMessages: 'No se pudieron cargar los mensajes',
        sendMessage: 'No se pudo enviar el mensaje',
        updateMessage: 'No se pudo actualizar el mensaje',
        deleteMessage: 'No se pudo eliminar el mensaje',
        fileTooLarge: 'El archivo debe ser menor de 10 MB'
      }
    },
    tabs: {
      members: 'Members',
      schedule: 'Schedule',
      generate: 'Generate',
      progress: 'Progress',
      collab: 'Collab',
      chat: 'Chat'
    },
    stats: {
      total: 'Total members',
      admins: 'Admins',
      members: 'Members'
    },
    members: {
      title: 'Team members',
      description: 'Manage access, permissions, and workspace roles',
      pendingRequests: 'Pending Requests',
      searchPlaceholder: 'Search members by name, email, or role...',
      none: 'No members found'
    },
    roles: {
      admin: {
        label: 'Admin',
        description: 'Can manage members and settings'
      },
      member: {
        label: 'Member',
        description: 'Can view and edit content'
      }
    },
    rolesGuide: {
      title: 'Roles & Permissions',
      description: 'Understanding workspace roles'
    },
    permissions: {
      manage_members: 'Manage members',
      delete_workspace: 'Delete workspace',
      edit_workspace: 'Edit workspace',
      manage_roles: 'Manage roles',
      chat: 'Chat',
      edit_content: 'Edit content'
    },
    presence: {
      online: 'Online',
      never: 'Never',
      justNow: 'Just now',
      yesterday: 'Yesterday'
    },
    errors: {
      missingUser: 'Missing user ID. Please log in again.',
      loadFailed: 'Failed to load workspaces',
      workspaceNameRequired: 'Workspace name is required',
      subworkspaceNameRequired: 'Please enter a subworkspace name',
      createWorkspace: 'Failed to create workspace',
      createSubworkspace: 'Failed to create subworkspace',
      fillFields: 'Please fill in all fields',
      invalidEmail: 'Please enter a valid email address',
      invalidEmailDetailed: 'Please enter a valid email address (e.g., user@example.com)',
      memberExists: 'A member with this email already exists',
      memberExistsDetailed: 'A member with this email already exists in this workspace',
      maxAdmins: 'Maximum 2 admins allowed per workspace',
      maxAdminsDetailed: 'Maximum 2 admins allowed per workspace. Please select Member role instead.',
      parentNotFound: 'Parent workspace not found. Please refresh and try again.',
      addMember: 'Failed to add member',
      removeMember: 'Failed to remove member',
      notAuthenticated: 'User not authenticated',
      updateRole: 'Failed to update member role',
      updateRoleUnexpected: 'Something went wrong while updating the role',
      approveRequest: 'Failed to approve request',
      rejectRequest: 'Failed to reject request',
      cannotDeleteLast: 'Cannot delete the last workspace',
      deleteWorkspace: 'Failed to delete workspace',
      deleteWorkspaceUnexpected: 'Something went wrong while deleting the workspace',
      updateWorkspace: 'Failed to update workspace',
      imageSize: 'Image size must be less than 5MB',
      imageType: 'Please select an image file',
      uploadAvatar: 'Failed to upload workspace image',
      removeAvatar: 'Failed to remove workspace image',
      shareFailed: 'Failed to generate share link',
      shareUnexpected: 'Something went wrong while generating the link',
      disableShare: 'Failed to disable share link',
      copyFailed: 'Failed to copy link',
      onlyAdminsGenerate: 'Only workspace admins can auto-generate'
    },
    actions: {
      share: 'generate sharing link',
      manageLink: 'Manage link'
    },
    success: {
      workspaceCreated: 'Workspace created',
      subworkspaceCreated: 'Subworkspace created',
      switched: 'Switched to "{{name}}"',
      memberAdded: 'Member added successfully',
      memberRemoved: '{{name}} has been removed from the workspace',
      requestApproved: '{{name}} has been approved and added to the workspace',
      requestRejected: 'Request from {{name}} has been rejected',
      deleted: 'Workspace has been deleted',
      updated: 'Workspace updated successfully',
      avatarUpdated: 'Workspace avatar updated successfully!',
      avatarRemoved: 'Workspace avatar removed successfully!',
      shareCreated: 'Sharing link generated successfully!',
      shareDisabled: 'Sharing link disabled (revoked)',
      linkCopied: 'Link copied to clipboard!',
      accessOpen: 'Access type updated to Open to everyone',
      accessRestricted: 'Access type updated to Domain-restricted'
    },
    confirm: {
      removeMember: 'Are you sure you want to remove {{name}} from the workspace?',
      deleteWorkspace: '⚠️ Are you sure you want to delete this workspace? This action cannot be undone and will remove all members and data.',
      disableShareLink: 'Are you sure you want to disable the sharing link? No one will be able to use it to join.'
    },
    memberCount_one: '{{count}} member',
    memberCount_other: '{{count}} members',
    subworkspaceCount_one: '{{count}} subworkspace',
    subworkspaceCount_other: '{{count}} subworkspaces'
  },
  board: {
    title: 'Collaboration Board',
    description: 'Plan, assign, and track work with your team',
    view: {
      compact: 'Compact',
      detailed: 'Detailed'
    },
    sections: {
      analytics: 'Task analytics',
      filters: 'Filters'
    },
    stats: {
      total: 'Total tasks',
      todo: 'To do',
      inProgress: 'In progress',
      review: 'In review',
      done: 'Done',
      overdue: 'Overdue'
    },
    actions: {
      newTask: 'New task',
      editTask: 'Edit task',
      createTask: 'Create task',
      updateTask: 'Update task',
      cancel: 'Cancel',
      archive: 'Archive task',
      restore: 'Restore',
      deletePermanent: 'Delete permanently'
    },
    filters: {
      search: 'Search tasks...',
      allPriorities: 'All priorities',
      allMembers: 'All members',
      unassigned: 'Unassigned'
    },
    columns: {
      todo: 'To do',
      inProgress: 'In progress',
      review: 'Review',
      done: 'Done'
    },
    priority: {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent'
    },
    task: {
      title: 'Title',
      description: 'Description',
      status: 'Status',
      priority: 'Priority',
      assignee: 'Assignee',
      dueDate: 'Due date',
      labels: 'Labels',
      addLabel: 'Add a label...',
      addHint: 'Add a task to get started',
      noTasks: 'No tasks yet',
      selectAssignee: 'Select assignee...',
      you: 'You'
    },
    dates: {
      today: 'Today',
      tomorrow: 'Tomorrow',
      yesterday: 'Yesterday',
      overdue: 'Overdue'
    },
    archive: {
      title: 'Archived tasks',
      empty: 'No archived tasks',
      archiveAll: 'Archive all',
      deleteAll: 'Delete all',
      restore: 'Restore',
      deletePermanent: 'Delete permanently',
      archived: 'Task archived',
      restored: 'Task restored to To do',
      deleted: 'Task permanently deleted',
      allArchived: 'All tasks archived',
      allDeleted: 'All archived tasks deleted',
      confirmDelete: 'Are you sure you want to delete this task permanently?',
      confirmDeleteAll: 'Delete ALL archived tasks permanently?'
    },
    messages: {
      created: 'Task created successfully',
      updated: 'Task updated successfully',
      deleted: 'Task deleted successfully',
      moved: 'Task moved successfully',
      errorLoad: 'Failed to load tasks',
      errorCreate: 'Failed to create task',
      errorUpdate: 'Failed to update task',
      errorMove: 'Failed to move task',
      errorDelete: 'Failed to delete task',
      errorRestore: 'Failed to restore task',
      errorArchiveAll: 'Failed to archive all tasks',
      errorDeletePermission: 'Only admins or creators can delete tasks'
    }
  },
  homepage: {
    hero: {
      badge: 'Built for students who want clarity, not chaos',
      titleLine1: 'Plan smarter.',
      titleLine2: 'Study with less stress.',
      description1: 'U PLAN automatically builds your study timetable around exams, classes, deadlines, and your real free time.',
      description2: 'No more guessing when to study. No more overloaded days. Just a flexible, personalized plan that actually works.',
      getStarted: 'Get Started',
      seeFeatures: 'See Features',
      studentStudyingAlt: 'Student studying',
      cards: {
        autoTimetables: {
          title: 'Auto Timetables',
          description: 'Generated around your real schedule'
        },
        deadlineAware: {
          title: 'Deadline Aware',
          description: 'Plans around exams and assignments'
        },
        flexible: {
          title: 'Flexible',
          description: 'Adjusts when life gets busy'
        }
      }
    },
    mockup: {
      todayPlan: "Today's Plan",
      organizedAutomatically: 'Organized automatically',
      smart: 'Smart',
      mathRevision: 'Math Revision',
      priorityHigh: 'Priority: High',
      physicsQuizPrep: 'Physics Quiz Prep',
      deadlineTomorrow: 'Deadline tomorrow',
      thisWeek: 'This week',
      sessions: 'Sessions',
      deadlines: 'Deadlines',
      planned: 'Planned',
      phoneFirst: 'Designed to feel great on your phone first.'
    },
    about: {
      title: 'About U PLAN',
      subtitle: 'Helping students manage their time with clarity and confidence',
      missionTitle: 'Our Mission',
      missionParagraph1: 'We created U PLAN to make studying more organized, flexible, and realistic. Students already have enough pressure — your planning tool should reduce stress, not add to it.',
      missionParagraph2: 'By combining smart automation with student-first design, U PLAN helps you fit studying around exams, classes, deadlines, and life outside school.',
      startJourney: 'Start Your Journey',
      studentsStudyingTogetherAlt: 'Students studying together'
    },
    values: {
      title: 'What We Stand For',
      subtitle: 'The principles behind every feature we build',
      vision: {
        title: 'Vision',
        description: 'Smart time management for every student'
      },
      team: {
        title: 'Team',
        description: 'Built by people who understand student pressure firsthand'
      },
      innovation: {
        title: 'Innovation',
        description: 'Practical AI that helps students take action'
      },
      studentFirst: {
        title: 'Student-First',
        description: 'Every decision is designed around real student needs'
      }
    },
    whyChoose: {
      title: 'Why Students Choose U PLAN',
      paragraph1: "U PLAN was built for the reality of student life: shifting deadlines, changing schedules, multiple subjects, and limited energy. Traditional planners don't adapt. We do.",
      paragraph2: "Whether you're preparing for finals, balancing multiple courses, or trying to stay consistent without burning out, U PLAN helps you study with more structure and less guesswork."
    },
    featuresSection: {
      title: 'Core Features',
      subtitle: 'Everything you need to succeed academically'
    },
    features: {
      smartScheduling: {
        title: 'Smart Scheduling',
        description: 'Automatically optimize your study time based on priorities and deadlines'
      },
      timeManagement: {
        title: 'Time Management',
        description: 'Track your study sessions and improve productivity'
      },
      progressTracking: {
        title: 'Progress Tracking',
        description: 'Monitor your learning journey with detailed analytics'
      },
      aiPowered: {
        title: 'AI-Powered',
        description: 'Intelligent recommendations based on your study patterns'
      },
      subjectBalance: {
        title: 'Subject Balance',
        description: 'Ensure equal focus across all your courses'
      },
      adaptiveLearning: {
        title: 'Adaptive Learning',
        description: 'Adjusts to your pace and learning style'
      }
    },
    servicesSection: {
      title: 'What You Can Do',
      subtitle: 'Everything you need to plan, track, and improve your study routine',
      ctaTitle: 'Ready to study with a better plan?',
      ctaDescription: 'Join U PLAN and turn your schedule into a realistic, personalized study system.',
      startNow: 'Start Now'
    },
    services: {
      smartTimetableGeneration: {
        title: 'Smart Timetable Generation',
        description: 'Automatically create a personalized study plan based on your input (exam dates, free hours, goals, etc.). Our intelligent algorithm considers your schedule, priorities, and learning patterns to generate an optimal timetable.',
        features: {
          conflictFreeScheduling: 'Conflict-free scheduling',
          priorityBasedPlanning: 'Priority-based planning',
          customizableStudyBlocks: 'Customizable study blocks',
          exportToCalendarApps: 'Export to calendar apps'
        }
      },
      adaptiveUpdates: {
        title: 'Adaptive Updates',
        description: 'If you skip or complete sessions, the system adjusts your timetable automatically. Life happens — our platform understands that and makes real-time adjustments to keep you on track.',
        features: {
          realTimeRescheduling: 'Real-time rescheduling',
          automaticDeadlineAdjustments: 'Automatic deadline adjustments',
          flexibleSessionManagement: 'Flexible session management',
          smartRecoveryPlanning: 'Smart recovery planning'
        }
      },
      progressTracking: {
        title: 'Progress Tracking',
        description: 'Track your daily and weekly study progress to stay motivated. Visualize your achievements, identify patterns, and celebrate milestones as you work towards your goals.',
        features: {
          dailyStudyLogs: 'Daily study logs',
          weeklyProgressReports: 'Weekly progress reports',
          achievementBadges: 'Achievement badges',
          productivityInsights: 'Productivity insights'
        }
      },
      examClassIntegration: {
        title: 'Exam & Class Integration',
        description: 'Import your exam schedule and class timetable for a conflict-free plan. Seamlessly integrate your academic calendar to ensure optimal study time distribution.',
        features: {
          calendarSynchronization: 'Calendar synchronization',
          examCountdownTimers: 'Exam countdown timers',
          classConflictDetection: 'Class conflict detection',
          automaticBufferTimes: 'Automatic buffer times'
        }
      }
    },
    collaborationSection: {
      badge: '🤝 Team Features',
      title: 'Built for Team Collaboration',
      subtitle: 'Create study groups, manage team members, and collaborate seamlessly in shared workspaces'
    },
    collaborationFeatures: {
      teamCollaborationWorkspaces: {
        title: 'Team Collaboration Workspaces',
        description: 'Create dedicated workspaces for study groups, project teams, or classes. Organize members with role-based access control (Admin/Member) and manage permissions effortlessly.'
      },
      smartMemberSharing: {
        title: 'Smart Member Sharing',
        description: 'Generate secure shareable links to invite team members. Control access with open or domain-restricted settings. Pending requests feature ensures controlled workspace growth.'
      },
      integratedTeamChat: {
        title: 'Integrated Team Chat',
        description: 'Communicate with team members directly within workspaces. Real-time messaging keeps discussions organized and contextual to your collaborative planning.'
      },
      hierarchicalSubworkspaces: {
        title: 'Hierarchical Subworkspaces',
        description: 'Organize complex team structures with subworkspaces. Create parent-child workspace hierarchies for departments, projects, or study groups with inherited member permissions.'
      },
      teamProgressDashboard: {
        title: 'Team Progress Dashboard',
        description: 'Monitor individual and collective progress. Track session completion rates, upcoming deadlines, and team productivity metrics in real-time.'
      },
      workspaceCustomization: {
        title: 'Workspace Customization',
        description: 'Upload workspace avatars, set permissions, manage sharing settings, and configure timetable editing rights. Full control over your collaborative environment.'
      }
    },
    testimonialsSection: {
      badge: '⭐ Success Stories',
      title: 'What Students Say',
      subtitle: "Join thousands of students who've transformed their academic journey"
    },
    testimonials: {
      emily: {
        role: 'Engineering Student',
        text: "U PLAN's workspace features transformed our study group. We went from chaotic email chains to organized collaboration. My GPA improved by 0.7 points!",
        highlight: 'Best decision for group studying'
      },
      james: {
        role: 'Computer Science Major',
        text: 'The AI-powered scheduling is incredible. It perfectly balances my workload and the team collaboration tools make group projects effortless. Highly recommended!',
        highlight: 'Game-changer for academic management'
      },
      sophia: {
        role: 'Medical Student',
        text: "Managing multiple study groups used to be a nightmare. With U PLAN's subworkspaces and real-time progress tracking, everything is seamless. I actually have time for social life!",
        highlight: 'Perfect for complex schedules'
      },
      marcus: {
        role: 'Business School Student',
        text: 'The workspace chat and collaboration board features are fantastic. Our study group productivity increased by 40%. The shared timetable keeps everyone accountable.',
        highlight: 'Transformed team productivity'
      },
      lisa: {
        role: 'Law Student',
        text: 'U PLAN helped me organize my rigorous study schedule while maintaining my study group. The team dashboard is invaluable for tracking collective progress.',
        highlight: 'Essential for group studying'
      },
      david: {
        role: 'Economics Graduate',
        text: "The most intelligent study planning tool I've used. Workspace automation saved me 10+ hours per week. Passed my economics qualifying exam with flying colors!",
        highlight: 'Academically transformative'
      }
    },
    stats: {
      activeStudents: 'Active Students',
      hoursPlanned: 'Hours Planned',
      successRate: 'Success Rate',
      averageRating: 'Average Rating'
    },
    finalCta: {
      title: 'Start Your Academic Transformation Today',
      description: "Join successful students from top universities who've improved their grades, balanced their workload, and achieved their academic goals with U PLAN.",
      startFreeTrial: 'Start Free Trial',
      bookDemo: 'Book a Demo',
      footer: 'No credit card required • Free for 14 days • Cancel anytime'
    }
  }
};

export default es;
