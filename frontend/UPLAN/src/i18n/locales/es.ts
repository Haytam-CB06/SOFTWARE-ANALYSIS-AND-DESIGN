const es = {
  "common": {
    "start": "Iniciar",
    "pause": "Pausa",
    "reset": "Restablecer",
    "close": "Cerrar",
    "home": "Inicio",
    "timetable": "Horario",
    "workspace": "Espacio de trabajo",
    "saved": "Guardado",
    "settings": "Configuración",
    "admin": "Administrador",
    "logout": "Cerrar sesión",
    "active": "Activo",
    "open": "Abrir",
    "new": "Nuevo",
    "you": "Tú",
    "back": "Atrás",
    "save": "Guardar",
    "add": "Añadir",
    "done": "Hecho",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "exit": "Salir",
    "expand": "Expandir",
    "minimize": "Minimizar",
    "total": "Total",
    "today": "Hoy",
    "pin": "Fijar",
    "next": "Siguiente",
    "skip": "Saltar"
  },
  "autoGenerate": {
    "title": "Generación automática del horario de estudio",
    "subtitle": "Configura tu horario y genera sesiones de estudio optimizadas.",
    "studyWindow": {
      "title": "Ventana de estudio",
      "description": "Define cuándo estás disponible para estudiar y ajústalo en cualquier momento.",
      "weekdayStart": "Inicio entre semana",
      "weekdayEnd": "Fin entre semana",
      "breakMinutes": "Pausa entre sesiones de estudio (minutos)",
      "breakHelp": "Dejaremos este espacio entre sesiones generadas consecutivas para que puedas descansar.",
      "includeWeekends": "Incluir fines de semana",
      "includeWeekendsHelp": "Si está activado, también llenaremos el tiempo libre del sábado y domingo.",
      "sameWeekend": "Usar la misma franja en fin de semana",
      "sameWeekendHelp": "Las horas del fin de semana serán iguales a las de entre semana.",
      "weekendStart": "Inicio fin de semana",
      "weekendEnd": "Fin fin de semana"
    },
    "classSchedule": {
      "title": "Horario de clases y prioridad",
      "description": "Añade tu horario actual y define la prioridad de cada curso. El generador lo usa junto con el tiempo ocupado para encontrar tus huecos de estudio.",
      "fillButton": "Rellenar horario actual",
      "uploadButton": "Subir",
      "emptyTitle": "Aún no hay horario de clases guardado",
      "emptyDescription": "Usa Rellenar horario actual o Subir para añadir tus cursos.",
      "addAnotherSlot": "Añadir otra franja para este curso",
      "courseName": "Nombre del curso",
      "priority": "Prioridad",
      "start": "Inicio",
      "end": "Fin",
      "days": "Días",
      "addCourseRow": "Añadir fila de curso",
      "addCourseRowHelp": "El mismo curso puede aparecer varias veces con distintos días u horarios."
    },
    "busyTime": {
      "title": "Tiempo ocupado",
      "description": "Añade bloques ocupados adicionales como trabajo, desplazamientos o recados. La generación automática nunca colocará sesiones de estudio allí.",
      "treatExisting": "Tratar las sesiones existentes del calendario como ocupadas",
      "treatExistingHelp": "Usa las sesiones de tu semana actual como tiempo ocupado adicional ({{count}} sesión(es) encontrada(s)).",
      "replaceExisting": "Reemplazar sesiones de estudio existentes",
      "replaceExistingHelp": "Si se activa, eliminamos las sesiones de estudio generadas previamente antes de añadir nuevas.",
      "addBusy": "Añadir bloque ocupado",
      "titleLabel": "Título",
      "day": "Día",
      "start": "Inicio",
      "end": "Fin"
    },
    "upload": {
      "title": "Subir horario",
      "description": "Sube un CSV o una imagen de tu horario. Después de importar, define prioridades y haz clic en Guardar.",
      "selectFile": "Elegir archivo para subir",
      "buttonHint": "Compatible con imagen o CSV"
    },
    "priority": {
      "high": "ALTA",
      "medium": "MEDIA",
      "low": "BAJA"
    },
    "busyDefaultTitle": "Tiempo ocupado",
    "generate": "Generar",
    "generating": "Generando⬦",
    "success": {
      "busySavedWorkspace": "Tiempo ocupado guardado en el espacio de trabajo",
      "classSavedWorkspace": "Horario de clases guardado en el espacio de trabajo",
      "classSaved": "Horario de clases guardado",
      "importedRows": "Se importaron {{count}} fila(s) del horario. Ahora define prioridades y haz clic en Guardar.",
      "generatedSessions": "Se generaron {{count}} sesiones de estudio{{seed}}."
    },
    "errors": {
      "saveBusy": "No se pudo guardar el tiempo ocupado",
      "addCourseFirst": "Añade al menos un curso a tu horario de clases",
      "saveClass": "No se pudo guardar el horario de clases",
      "uploadCsvOrImage": "Sube un archivo CSV o una imagen",
      "uploadFailed": "La subida falló",
      "uploadFailedGeneric": "La subida falló",
      "noClassesDetected": "No se detectaron clases en el archivo subido",
      "invalidImportFormat": "El archivo importado no coincide con el formato esperado del horario",
      "courseNameRequired": "El nombre del curso es obligatorio",
      "selectAtLeastOneDay": "Selecciona al menos un día",
      "missingApiBase": "Falta VITE_API_BASE_URL. Configura tu entorno frontend.",
      "notLoggedIn": "No has iniciado sesión",
      "fillOrUploadFirst": "Primero completa o sube tu horario de clases",
      "generateFailed": "La generación automática falló",
      "noFreeTime": "No hay tiempo libre disponible para la ventana de estudio seleccionada"
    }
  },
  "auth": {
    "brand": {
      "name": "PLAN",
      "subtitle": "Planificación académica",
      "logoAlt": "Logotipo de U PLAN"
    },
    "hero": {
      "imageAlt": "Estudiante estudiando",
      "badge": "Planifica mejor. Estudia con claridad.",
      "titleLine1": "Domina tu",
      "titleLine2": "horario de estudio",
      "description": "Planificación de horarios con IA que se adapta a tus clases, exámenes, fechas límite y objetivos en un espacio de trabajo claro.",
      "footer": "Creado para ayudar a los estudiantes a mantenerse organizados, enfocados y con confianza.",
      "cards": {
        "smartPlanning": {
          "title": "Planificación más inteligente",
          "description": "Organiza sesiones segun prioridades reales"
        },
        "flexibleFlow": {
          "title": "Flujo flexible",
          "description": "Ajusta el tiempo de estudio cuyo cambie tu semana"
        },
        "studentFirst": {
          "title": "Pensado para estudiantes",
          "description": "Creado para claridad, enfoque y constancia"
        }
      }
    },
    "titles": {
      "welcomeBack": "Bienvenido de nuevo",
      "verifyAccount": "Verifica tu cuenta",
      "createNewPassword": "Crea una nueva contraseña",
      "resetPassword": "Restablece tu contraseña",
      "createAccount": "Crea tu cuenta",
      "continueWithProvider": "Continuar con {{provider}}",
      "completeProviderLogin": "Completar inicio de sesión con {{provider}}",
      "enterVerificationCode": "Ingresa el código de verificación",
      "welcomeBackCard": "Bienvenido de nuevo",
      "createAccountCard": "Crear cuenta",
      "verifyYourEmail": "Verifica tu correo"
    },
    "descriptions": {
      "completeSignIn": "Completa tus datos de inicio de sesión para continuar.",
      "enterCodeSent": "Ingresa el código enviado a tu correo.",
      "chooseStrongPassword": "Elige una contraseña nueva y segura para proteger tu cuenta.",
      "sendVerificationToEmail": "Enviaremos un código de verificación a tu correo.",
      "joinAndOrganize": "Únete y empieza a organizar tu horario de estudio.",
      "accessPlanner": "Accede a tu planificador de estudio y continúa donde lo dejaste.",
      "completeProviderLogin": "Ingresa tu correo y nombre para completar el inicio de sesión.",
      "resetCodeSentTo": "Enviamos un código de verificación de 6 dígitos a {{email}}",
      "enterNewPasswordFor": "Ingresa tu nueva contraseña para {{email}}",
      "resetPasswordHelp": "Ingresa tu correo y te enviaremos un código de verificación",
      "loginCard": "Ingresa tus credenciales para acceder a tu horario de estudio",
      "signupCard": "Empieza a organizar tu horario de estudio hoy",
      "signupCodeSentTo": "Ingresa el código de 6 dígitos enviado a {{email}}"
    },
    "labels": {
      "email": "Correo electrónico",
      "fullName": "Nombre completo",
      "verificationCode": "Código de verificación",
      "newPassword": "Nueva contraseña",
      "confirmNewPassword": "Confirmar nueva contraseña",
      "emailOrUsername": "Correo o usuario",
      "password": "Contraseña",
      "username": "Nombre de usuario",
      "confirmPassword": "Confirmar contraseña",
      "dateOfBirth": "Fecha de nacimiento",
      "gender": "Género"
    },
    "placeholders": {
      "socialEmail": "your.email@gmail.com",
      "fullName": "John Doe",
      "verificationCode": "000000",
      "newPassword": "Ingresa la nueva contraseña",
      "confirmNewPassword": "Confirma la nueva contraseña",
      "email": "name@example.com",
      "emailOrUsername": "name@example.com or username",
      "password": "Ingresa tu contraseña",
      "username": "johndoe123",
      "createPassword": "Crea una contraseña",
      "confirmPassword": "Confirma tu contraseña",
      "selectGender": "Selecciona tu género"
    },
    "actions": {
      "backToHome": "Volver al inicio",
      "completeLogin": "Completar inicio de sesión",
      "backToLogin": "Volver al inicio de sesión",
      "verifyCode": "Verificar código",
      "resendCode": "Reenviar código",
      "resetPassword": "Restablecer contraseña",
      "sendVerificationCode": "Enviar código de verificación",
      "loginTab": "Iniciar sesión",
      "signupTab": "Registrarse",
      "forgotPassword": "¿Olvidaste tu contraseña?",
      "rememberMe": "Recordarme",
      "signIn": "Iniciar sesión",
      "orContinueWith": "O continuar con",
      "continueWithGoogle": "Continuar con Google",
      "signUp": "Registrarse",
      "sendingCode": "Enviando código...",
      "verifyEmail": "Verificar correo",
      "creatingAccount": "Creando cuenta...",
      "needHelp": "¿Necesitas ayuda?"
    },
    "requirements": {
      "username": {
        "length": "Entre 3 y 20 caracteres",
        "format": "Solo letras, números, guiones bajos y puntos",
        "noSpaces": "No se permiten espacios",
        "notReserved": "No es un nombre de usuario reservado"
      },
      "password": {
        "minLength": "Al menos 8 caracteres",
        "upper": "Una letra mayúscula (A-Z)",
        "lower": "Una letra minúscula (a-z)",
        "number": "Un número (0-9)",
        "special": "Un carácter especial (!@#$%^&*)"
      }
    },
    "genderOptions": {
      "male": "Masculino",
      "female": "Femenino",
      "other": "Otro",
      "preferNotToSay": "Prefiero no decirlo"
    },
    "helper": {
      "didntReceiveCode": "¿No recibiste el código?",
      "passwordMustContain": "La contraseña debe contener:",
      "usernameRequirements": "Requisitos del nombre de usuario:",
      "agreeTermsBefore": "Acepto los",
      "termsOfService": "Términos de servicio",
      "privacyPolicy": "Política de privacidad",
      "and": "y",
      "byContinuing": "Al continuar, aceptas nuestra"
    },
    "help": {
      "title": "¿Necesitas ayuda?",
      "creatingAccountTitle": "Crear una cuenta",
      "issuesTitle": "¿Tienes problemas?",
      "issuesDescription": "Si tienes problemas para registrarte o iniciar sesión, revisa tu conexión a internet y asegúrate de completar correctamente todos los campos obligatorios.",
      "points": {
        "username": "Elige un nombre de usuario único (3–20 caracteres)",
        "email": "Usa una dirección de correo válida",
        "password": "Crea una contraseña segura con mayúsculas, minúsculas, números y caracteres especiales",
        "age": "Debes tener al menos 13 años para registrarte"
      }
    },
    "errors": {
      "passwordMismatch": "¡Las contraseñas no coinciden!",
      "dateOfBirthRequired": "La fecha de nacimiento es obligatoria",
      "ageRestriction": "Debes tener al menos 13 años para crear una cuenta",
      "signupFailed": "No se pudo registrar la cuenta",
      "acceptInviteFailed": "No se pudo aceptar la invitación",
      "inviteInvalid": "El enlace de invitación no es válido o ha caducado",
      "loginFailed": "incorrect username,email or password",
      "loginUnexpected": "Algo salió mal durante el inicio de sesión",
      "invalidSignupCode": "Código de verificación de registro no válido",
      "verifySignupCodeFailed": "No se pudo verificar el código de registro",
      "usernameLength": "El nombre de usuario debe tener entre 3 y 20 caracteres.",
      "usernameFormat": "El nombre de usuario solo puede contener letras, números, guiones bajos y puntos.",
      "usernameNoSpaces": "Nombre de usuario cannot contain spaces!",
      "usernameReserved": "Nombre de usuario is reserved. Please choose a different one!",
      "emailRequired": "El correo es obligatorio",
      "genderRequired": "Selecciona tu género",
      "passwordLength": "Password must be at least 8 characters long!",
      "passwordUpper": "Password must contain at least one uppercase letter!",
      "passwordLower": "Password must contain at least one lowercase letter!",
      "passwordNumber": "Password must contain at least one number!",
      "passwordSpecial": "Password must contain at least one special character!",
      "sendSignupCodeFailed": "No se pudo enviar el código de verificación de registro",
      "emailNotFound": "No se encontró ninguna cuenta con este correo.",
      "requestResetFailed": "No se pudo solicitar el código de restablecimiento.",
      "invalidResetCode": "Código de verificación no válido. Inténtalo de nuevo.",
      "verifyCodeFailed": "Algo salió mal durante la verificación.",
      "resetPasswordFailed": "No se pudo restablecer la contraseña",
      "resetPasswordUnexpected": "Algo salió mal al restablecer la contraseña",
      "fillRequired": "Ingresa toda la información obligatoria.",
      "resendCodeFailed": "No se pudo reenviar el código de verificación",
      "resendSignupCodeFailed": "Failed to resend signup code",
      "somethingWentWrong": "Algo salió mal"
    },
    "success": {
      "accountCreated": "¡Cuenta creada correctamente! Bienvenido, {{name}}.",
      "welcomeBack": "¡Bienvenido de nuevo!",
      "welcomeBackName": "¡Bienvenido de nuevo, {{name}}!",
      "emailVerified": "Correo verificado correctamente.",
      "signupCodeSent": "Código de verificación enviado a {{email}}",
      "resetCodeSent": "Código de verificación enviado a {{email}}.",
      "verificationSuccess": "Verificación correcta.",
      "passwordReset": "Password reset successfully! Logging you in...",
      "passwordsMatch": "Las contraseñas coinciden",
      "ageVerified": "Edad verificada (13+ años)",
      "genderSelected": "Género selected",
      "emailVerifiedInline": "Correo verificado",
      "newVerificationCodeSent": "¡Nuevo código de verificación enviado!",
      "newSignupVerificationCodeSent": "New signup verification code sent!"
    }
  },
  "errorBoundary": {
    "title": "Algo salió mal",
    "description": "La aplicación falló al renderizar está página. Actualiza para recuperarla.",
    "actions": {
      "reload": "Recargar",
      "continue": "Intentar continuar"
    }
  },
  "examTracker": {
    "title": "Seguimiento de exámenes",
    "subtitle": "Haz seguimiento de tus próximos exámenes y prepárate en consecuencia",
    "actions": {
      "add": "Añadir examen"
    },
    "dialog": {
      "title": "Añadir nuevo examen",
      "description": "Programa un nuevo examen o prueba para tu horario de estudio."
    },
    "fields": {
      "subject": "Asignatura",
      "date": "Fecha",
      "time": "Hora",
      "location": "Lugar",
      "priority": "Prioridad",
      "notes": "Notas"
    },
    "placeholders": {
      "subject": "p. ej., Matemáticas",
      "location": "p. ej., Aula 301",
      "notes": "Notas adicionales..."
    },
    "priority": {
      "high": "Alta",
      "medium": "Media",
      "low": "Baja"
    },
    "upcoming": "Próximos exámenes",
    "empty": {
      "title": "No hay próximos exámenes programados",
      "subtitle": "Añade tus fechas de examen para empezar el seguimiento"
    },
    "today": "¡Hoy!",
    "tomorrow": "¡Mañana!",
    "daysAway": "faltan {{count}} días",
    "success": {
      "added": "Examen añadido correctamente",
      "deleted": "Examen eliminado"
    },
    "errors": {
      "required": "Completa la asignatura y la fecha"
    }
  },
  "goals": {
    "title": "Objetivos y logros",
    "subtitle": "Haz seguimiento de metas semanales, constancia de estudio e hitos próximos.",
    "actions": {
      "back": "Atrás",
      "setGoals": "Definir objetivos",
      "logSession": "Registrar sesión",
      "collapse": "Contraer",
      "expand": "Expandir",
      "markCompleted": "Marcar como completada",
      "skip": "Omitir"
    },
    "common": {
      "subject": "Materia",
      "study": "Estudio",
      "missed": "missed"
    },
    "success": {
      "achievementUnlocked": "Achievement unlocked",
      "sessionLogged": "Session logged",
      "sessionSkipped": "Session skipped",
      "goalSaved": "Goal saved"
    },
    "errors": {
      "updateSession": "Could not update session",
      "validTarget": "Please enter a valid target hours number",
      "summaryNotLoaded": "Summary not loaded yet",
      "exceedsAvailability": "Goal exceeds weekly availability",
      "exceedsAvailabilityDesc": "You only have about {{hours}}h available this week based on your timetable.",
      "subjectExceedsWeekly": "Subject goal exceeds weekly goal",
      "subjectExceedsWeeklyDesc": "Your overall weekly goal is {{hours}}h. Subject goals must fit within it.",
      "subjectGoalsExceedWeekly": "Subject goals exceed weekly goal",
      "subjectGoalsExceedWeeklyDesc": "Your other subject goals total {{otherHours}}h. With this, you'd exceed your weekly goal of {{weeklyHours}}h.",
      "weeklyTooLow": "Weekly goal is too low",
      "weeklyTooLowDesc": "Your subject goals already total {{hours}}h. Increase your weekly goal or reduce subject goals.",
      "saveGoal": "Could not save goal",
      "selectSession": "Select a session",
      "todayOnly": "You can only log missed sessions for today.",
      "sessionNotFound": "Session not found",
      "onlyMissed": "Only missed sessions can be marked completed manually (same day).",
      "skippedCannotComplete": "Skipped sessions cannot be marked completed."
    },
    "thisWeek": {
      "title": "This Week",
      "description": "What’s scheduled (from My Timetable)",
      "sessions": "sesiones",
      "hours": "~{{hours}} hours",
      "tipPrefix": "Tip: If this looks empty, open",
      "tipHighlight": "My Timetable",
      "tipSuffix": "once to load the current week."
    },
    "deadlines": {
      "title": "Upcoming Deadlines",
      "description": "From Assessments",
      "empty": "No hay fechas límite próximás",
      "due": "Due {{date}}",
      "manage": "Manage deadlines"
    },
    "progress": {
      "title": "Progress & Streak",
      "description": "From your completed sessions",
      "completed": "completed",
      "target": "target",
      "streak": "{{count}}-day streak",
      "tip": "Tip: use “Log Session” below to start building achievements."
    },
    "goalDialog": {
      "title": "Set goals for this week",
      "description": "Weekly goals.",
      "weeklyTarget": "Weekly target hours",
      "weeklyPlaceholder": "e.g. 8",
      "saveWeekly": "Save weekly goal",
      "subjectGoal": "Subject-specific goal (optional)",
      "selectSubject": "Select a subject",
      "subjectPlaceholder": "e.g. 3",
      "saveSubject": "Save subject goal",
      "currentGoals": "Current goals",
      "overall": "Overall"
    },
    "logDialog": {
      "title": "Log a completed study session",
      "description": "This updates your backend streak y completed hours.",
      "date": "Fecha",
      "hint": "You can only log sessions that exist on your current “My Timetable” for that day. Unlogged sessions become missed after midnight.",
      "sessions": "Timetable sessions",
      "selectMissed": "Select a missed session",
      "noMissed": "No missed sessions for this day",
      "onlyMissedHint": "Only missed sessions for today (from your current “My Timetable”) are shown here.",
      "logSelected": "Log selected session"
    },
    "hints": {
      "openTimetableFirst": "Tip: Open “My Timetable” once so this week loads, then return here."
    },
    "todayPanel": {
      "description": "Backend-tracked slots from your timetable. Skipped cannot be marked completed.",
      "weekTotals": "Week totals: {{completed}} completed ⬢ {{skipped}} skipped ⬢ {{missed}} missed ⬢ {{planned}} planned",
      "hidden": "Hidden. Click “Expand” to view y manage today’s sessions.",
      "empty": "No timetable sessions found for today.",
      "status": "Estado"
    }
  },
  "googleCalendar": {
    "success": {
      "connected": "Successfully connected to Google Calendar!",
      "disconnected": "Disconnected from Google Calendar",
      "exported": "Timetable exported to Google Calendar successfully! Check your calendar."
    },
    "errors": {
      "connect": "Failed to connect to Google Calendar. Please try again.",
      "connectFirst": "Please connect to Google Calendar first",
      "export": "Failed to export to Google Calendar"
    },
    "info": {
      "exporting": "Exporting to Google Calendar..."
    },
    "confirm": {
      "disconnect": "Are you sure you want to disconnect from Google Calendar? Your existing calendar events will not be affected."
    }
  },
  "help": {
    "button": "Help",
    "title": "How to Use Smart Study",
    "description": "Learn how to create y manage your study timetables effectively",
    "walkthrough": "Tips / Walkthrough",
    "quickStart": {
      "title": "Quick Start",
      "description": "Get started in 3 simple steps: Add your subjects → Configure study hours → Generate your personalized timetable!"
    },
    "priority": {
      "high": "High Prioridad",
      "highDesc": "Critical subjects requiring focused attention",
      "medium": "Medium Prioridad",
      "mediumDesc": "Regular coursework subjects",
      "low": "Low Prioridad",
      "lowDesc": "Extra reading or electives"
    },
    "sections": {
      "create": {
        "title": "Creating Your First Timetable",
        "step1Title": "Step 1: Add Subjects",
        "step1Desc": "Navigate to \"Create Timetable\" y add all your subjects. Choose priority levels:",
        "step2Title": "Step 2: Select Study Days",
        "step2Desc": "Choose which days you want to study. The smart scheduler will distribute your subjects optimally across selected days.",
        "step3Title": "Step 3: Configure Time Preferences",
        "step3Desc": "Set your daily study hours, preferred time slots, y break intervals. We recommend following the Pomodoro technique (25-minute sessions with 5-minute breaks).",
        "step4Title": "Step 4: Generate Timetable",
        "step4Desc": "Click \"Generate Timetable\" to create your personalized study schedule!"
      },
      "timetable": {
        "title": "Using My Timetable (Calendar View)",
        "addingTitle": "Adding Sessions Manually",
        "adding1": "Click on any time slot in the calendar to add a study session",
        "adding2": "Click the blue \"+\" button at the bottom right corner",
        "adding3": "Fill in subject, time, y session type (Reading, Revision, Practice, etc.)",
        "editingTitle": "Editing Sessions",
        "editingDesc": "Click on any existing session card to edit its details or delete it.",
        "navigationTitle": "Navigation Controls",
        "todayButton": "Today Button",
        "todayDesc": "Jump back to the current week",
        "arrowButtons": "Arrow Buttons",
        "arrowDesc": "Navigate between weeks",
        "dayWeekView": "Day/Week View",
        "dayWeekDesc": "Switch between weekly overview y detailed day view",
        "savingTitle": "Saving Your Work",
        "saveTimetable": "Save Timetable",
        "saveTimetableDesc": "Saves your timetable to the \"Saved Timetables\" section",
        "exportPdf": "Export as PDF",
        "exportPdfDesc": "Download your timetable as a PDF file",
        "saveDropdown": "Click the \"Save\" button dropdown to access both options"
      },
      "smart": {
        "title": "Smart Scheduling Rules",
        "intro": "Our intelligent scheduling system follows these proven study principles:",
        "highTitle": "High Prioridad (50% of total time):",
        "highDesc": "Critical subjects requiring focused attention receive the largest time allocation to ensure mástery of challenging material.",
        "mediumTitle": "Medium Prioridad (30% of total time):",
        "mediumDesc": "Regular coursework subjects receive moderate time allocation for consistent progress y understanding.",
        "lowTitle": "Low Prioridad (20% of total time):",
        "lowDesc": "Extra reading y electives receive appropriate time without overwhelming your schedule.",
        "optimalTitle": "Optimal Scheduling:",
        "optimalDesc": "High priority subjects are scheduled in the first part of each day when focus is at its peak, maximizing learning effectiveness."
      },
      "tips": {
        "title": "Study Tips & Best Practices",
        "pomodoroTitle": "Pomodoro Technique",
        "pomodoroDesc": "Study in 25-minute focused sessions with 5-minute breaks. After 4 sessions, take a longer 15-30 minute break.",
        "activeTitle": "Active Learning",
        "activeDesc": "Mix different session types: Reading → Practice → Revision for better comprehension y retention.",
        "peakTitle": "Peak Performance Times",
        "peakDesc": "Schedule high-priority subjects during your peak focus hours (usually morning for most people).",
        "consistencyTitle": "Consistency is Key",
        "consistencyDesc": "Stick to your timetable! Regular study habits are more effective than cramming."
      },
      "types": {
        "title": "Understying Session Types",
        "reading": "Reading",
        "readingDesc": "Learning new material, textbook reading",
        "revision": "Revision",
        "revisionDesc": "Reviewing previously learned content",
        "practice": "Practice",
        "practiceDesc": "Problem-solving, exercises, practice tests",
        "lecture": "Lecture",
        "lectureDesc": "Attending classes or watching lectures",
        "assignment": "Tarea",
        "assignmentDesc": "Working on projects y assignments",
        "break": "Break",
        "breakDesc": "Rest periods to recharge"
      }
    },
    "footer": "Still have questions? Explore the app to discover more features!"
  },
  "joinWorkspace": {
    "title": "Join Espacio de trabajo",
    "loading": "Verifying link⬦",
    "loginWarning": "⚠️ You need to be logged in to send a join request.",
    "states": {
      "verifying": "Verifying invite link⬦",
      "invalid": "Invalid or expired invite link",
      "sent": "Your request has been sent",
      "requestToJoin": "Request to join \"{{name}}\""
    },
    "message": {
      "label": "Mensaje",
      "placeholder": "Tell the admin why you'd like to join⬦"
    },
    "actions": {
      "send": "Send Request",
      "sending": "Sending⬦"
    },
    "success": {
      "alreadyMember": "You're already a member of this workspace!",
      "requestSent": "Request sent! The admin will review it shortly.",
      "title": "Request Sent!",
      "description": "The workspace admin will review your request y you'll be added once approved."
    },
    "errors": {
      "invalidLink": "Invalid invite link",
      "expiredLink": "Invalid or expired invite link",
      "loginRequired": "You must be logged in to request to join a workspace",
      "requestFailed": "Request failed",
      "sendFailed": "Failed to send request"
    }
  },
  "notebook": {
    "untitled": "Untitled",
    "updated": "Updated",
    "time": {
      "justNow": "Just now",
      "minutesAgo": "{{count}}m ago",
      "hoursAgo": "{{count}}h ago",
      "daysAgo": "{{count}}d ago"
    },
    "toasts": {
      "noteCreated": "Note created",
      "saved": "Saved",
      "deleted": "Deleted"
    },
    "errors": {
      "loadNotes": "Failed to load notes",
      "createNote": "Failed to create note",
      "saveNote": "Failed to save note",
      "deleteNote": "Failed to delete note"
    },
    "confirm": {
      "delete": "Delete this note? This cannot be undone."
    },
    "mobile": {
      "notes": "Notas",
      "title": "Notebook",
      "yourNotes": "Your notes"
    },
    "sidebar": {
      "myNotes": "My Notes",
      "noteCount": "{{count}} note",
      "noteCount_other": "{{count}} notes"
    },
    "filters": {
      "all": "All",
      "pinned": "Pinned",
      "archived": "Archived"
    },
    "tags": {
      "title": "Tags"
    },
    "empty": {
      "noNotes": "No notes yet. Click",
      "createOne": "to create one.",
      "noContent": "No content",
      "noNoteSelected": "No note selected",
      "getStarted": "Open the notes menu or create a new note to get started."
    },
    "actions": {
      "add": "Add",
      "new": "New",
      "addNote": "Add Note",
      "save": "Save",
      "delete": "Delete",
      "createNote": "Create note"
    },
    "placeholders": {
      "search": "     Search notes...",
      "untitled": "Untitled note",
      "tags": "school, exam, todo",
      "startWriting": "Start writing..."
    },
    "editor": {
      "autoSave": "Auto-save",
      "saving": "Saving...",
      "unsavedChanges": "Unsaved changes",
      "pinned": "Pinned",
      "archived": "Archived"
    },
    "unsaved": {
      "title": "Unsaved changes",
      "description": "You have unsaved edits. Are you sure you want to leave this note?",
      "stay": "Stay here",
      "saveAndContinue": "Save y continue",
      "leaveWithoutSaving": "Leave without saving"
    }
  },
  "notifications": {
    "title": "Notificaciones",
    "markRead": "Marcar como leída",
    "empty": "No hay notificaciones",
    "new": "Nueva",
    "clear": "Limpiar",
    "studyReminder": "Recordatorio de estudio",
    "studyReminderBody": "{{subject}} empieza en {{minutes}} minutos",
    "studyStarted": "Sesion de estudio iniciada",
    "studyStartedBody": "{{subject}} empieza ahora"
  },
  "privacyPolicy": {
    "back": "Back",
    "title": "Política de privacidad",
    "lastUpdated": "Last Updated: October 24, 2025",
    "sections": {
      "introduction": {
        "title": "1. Introduction",
        "content": "Welcome to U PLAN (\"we,\" \"our,\" or \"us\"). We are committed to protecting your privacy y ensuring the security of your personal information. This Política de privacidad explains how we collect, use, disclose, y safeguard your information when you use our Service."
      },
      "informationWeCollect": {
        "title": "2. Information We Collect",
        "personalInfo": {
          "title": "2.1 Personal Information",
          "description": "When you register for an account, we collect:",
          "items": [
            "Full name",
            "Email address",
            "Password (encrypted)",
            "Account creation date"
          ]
        },
        "studyInfo": {
          "title": "2.2 Study Schedule Information",
          "description": "To provide our timetable generation service, we collect:",
          "items": [
            "Course names y subjects",
            "Study session times y durations",
            "Prioridad levels assigned to courses",
            "Custom notes y descriptions",
            "Timetable preferences y settings"
          ]
        },
        "usageData": {
          "title": "2.3 Usage Data",
          "description": "We may collect information about how you access y use the Service:",
          "items": [
            "Browser type y version",
            "Device information",
            "User preferences (e.g., dark mode settings)",
            "Session information y activity timestamps"
          ]
        }
      },
      "storage": {
        "title": "3. How We Store Your Information",
        "description": "Local Storage: All your data is stored locally in your browser using localStorage technology. This means:",
        "items": [
          "Your data remains on your device y is not transmitted to our servers",
          "We do not have access to your personal information or study schedules",
          "Clearing your browser data will delete all stored information",
          "Your data is only accessible from the browser where you created it",
          "We recommend backing up important timetables regularly"
        ]
      },
      "usage": {
        "title": "4. How We Use Your Information",
        "description": "We use the information we collect for the following purposes:",
        "items": [
          "To provide, maintain, y improve our Service",
          "To create y manage your account",
          "To generate personalized study timetables",
          "To save your preferences y settings",
          "To authenticate your access to the Service",
          "To respond to your requests y provide customer support",
          "To send you updates about the Service (with your consent)",
          "To analyze usage patterns y improve user experience"
        ]
      },
      "sharing": {
        "title": "5. Data Sharing y Disclosure",
        "description": "Because your data is stored locally on your device, we do not share, sell, or rent your personal information to third parties. However, we may disclose information in the following circumstances:",
        "items": [
          "Legal Requirements: If required by law or in response to valid legal processes",
          "Protection of Rights: To protect our rights, privacy, safety, or property",
          "With Your Consent: When you explicitly authorize us to share information"
        ]
      },
      "security": {
        "title": "6. Data Security",
        "description": "We implement appropriate security measures to protect your information:",
        "items": [
          "Passwords are never stored in plain text",
          "Local storage is encrypted by your browser",
          "We use secure coding practices to prevent vulnerabilities",
          "Regular security updates y maintenance"
        ],
        "note": "However, no method of electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security."
      },
      "rights": {
        "title": "7. Your Rights y Choices",
        "description": "You have the following rights regarding your data:",
        "items": [
          "Access: You can view all your stored data at any time through the Service",
          "Modification: You can edit your profile information y study schedules",
          "Deletion: You can delete your account y all associated data through the Settings page",
          "Export: You can export your timetables for backup purposes",
          "Opt-out: You can disable certain features or notifications in Settings"
        ]
      },
      "cookies": {
        "title": "8. Cookies y Tracking Technologies",
        "content": "The Service uses localStorage to store your preferences y data locally on your device. We do not use third-party cookies for tracking or advertising purposes. Session information is used solely to maintain your login state y preferences."
      },
      "children": {
        "title": "9. Children's Privacy",
        "content": "Our Service is intended for students of all ages. However, we do not knowingly collect personally identifiable information from children under 13 without parental consent. If you are a parent or guardian y believe your child has provided us with personal information, please contact us so we can take appropriate action."
      },
      "thirdParty": {
        "title": "10. Third-Party Services",
        "content": "Our Service may contain links to third-party websites or services that are not operated by us. We are not responsible for the privacy practices of these third parties. We encourage you to review the privacy policies of any third-party services you access."
      },
      "retention": {
        "title": "11. Data Retention",
        "description": "Your data is retained in your browser's localStorage until you explicitly delete it by:",
        "items": [
          "Deleting your account through Settings",
          "Clearing your browser's local storage",
          "Uninstalling or resetting your browser"
        ]
      },
      "international": {
        "title": "12. International Users",
        "content": "Since all data is stored locally on your device, data transfer regulations do not apply. However, if we introduce cloud-based features in the future, we will update this policy to reflect any international data transfer practices."
      },
      "changes": {
        "title": "13. Changes to This Política de privacidad",
        "content": "We may update our Política de privacidad from time to time. We will notify you of any changes by posting the new Política de privacidad on this page y updating the \"Last Updated\" date. You are advised to review this Política de privacidad periodically for any changes. Your continued use of the Service after changes are posted constitutes acceptance of those changes."
      },
      "contact": {
        "title": "14. Contact Us",
        "description": "If you have any questions, concerns, or requests regarding this Política de privacidad or our privacy practices, please contact us through:",
        "items": [
          "The Settings page in the application",
          "The support section of our website",
          "Our customer service channels"
        ]
      },
      "consent": {
        "title": "Your Consent",
        "content": "By using U PLAN, you consent to our Política de privacidad y agree to its terms. If you do not agree with this policy, please do not use our Service."
      },
      "commitment": {
        "title": "Privacy Commitment",
        "content": "We are committed to transparency y protecting your privacy. Your trust is important to us, y we will continue to prioritize the security y confidentiality of your information as we develop y improve our Service."
      }
    }
  },
  "pomodoro": {
    "title": "Pomodoro",
    "modes": {
      "focus": "Enfoque",
      "break": "Descanso",
      "longBreak": "Descanso largo"
    },
    "pin": "Fijar",
    "focusMode": "Modo enfoque",
    "focusSession": "Sesión de enfoque",
    "running": "En marcha",
    "paused": "En pausa",
    "sessionsToday": "Sesiones hoy",
    "totalSessions": "Sesiones totales",
    "focusTime": "Tiempo de enfoque",
    "stayWithIt": "Sigue así",
    "readyWhenYouAre": "Listo cuyo tú lo estés",
    "closeTimer": "Cerrar temporizador",
    "unpinWidgetHint": "Desfijar widget (se cerrará al navegar)",
    "pinWidgetHint": "Fijar widget (permanece abierto al navegar)",
    "today": "Hoy",
    "total": "Total",
    "focusShort": "Enfoque",
    "settings": {
      "title": "Configuración de Pomodoro",
      "description": "Personaliza las preferencias de tu temporizador Pomodoro",
      "focus": "Enfoque",
      "break": "Descanso",
      "longBreak": "Descanso largo",
      "durationsMinutes": "Duraciones (minutos)",
      "autoStart": "Inicio automático",
      "autoStartBreaks": "Iniciar descansos automáticamente",
      "autoStartPomodoros": "Iniciar pomodoros automáticamente",
      "notifications": "Notificaciones",
      "desktopNotifications": "Notificaciones de escritorio",
      "soundAlerts": "Alertas de sonido",
      "vibrationMobile": "Vibración (móvil)",
      "sessionSettings": "Ajustes de sesión",
      "longBreakAfterEvery": "Descanso largo después de cada",
      "focusSessions": "sesiones de enfoque"
    },
    "actions": {
      "start": "Iniciar",
      "pause": "Pausa",
      "reset": "Restablecer",
      "exit": "Salir",
      "settings": "Configuración",
      "focus": "alfiler",
      "minimize": "Minimizar",
      "expand": "Expandir"
    }
  },
  "navigation": {
    "home": "Inicio",
    "about": "Sobre nosotros",
    "services": "Servicios",
    "login": "Iniciar sesión",
    "seePlans": "Ver planes",
    "subtitle": "Planificación académica",
    "logoAlt": "Logo de PLAN",
    "switchToLight": "Cambiar a modo claro",
    "switchToDark": "Cambiar a modo oscuro",
    "openMenu": "Abrir menú"
  },
  "createTimetable": {
    "title": "Create Timetable",
    "subtitle": "Configure your courses, study preferences, y unavailable time to generate an academic schedule.",
    "stats": {
      "courses": "Courses",
      "hoursPerWeek": "Hours / Week"
    },
    "details": {
      "title": "Timetable Details",
      "description": "Give your timetable a specific name so it can be saved y recognized later.",
      "name": "Timetable Name",
      "placeholder": "e.g., Midterm Prep Plan, Exam Week, Revision Schedule"
    },
    "courseSetup": {
      "title": "Course Setup",
      "description": "Add your courses y define how much study time each one needs."
    },
    "fields": {
      "courseName": "Course Name",
      "coursePlaceholder": "e.g., Calculus, Physics, English...",
      "hoursNeeded": "Hours Needed Per Week",
      "priorityLevel": "Prioridad Level",
      "preferredStudyTime": "Preferred Study Time",
      "hoursPerWeek": "Hours/Week",
      "preferredTime": "Preferred Time",
      "preferredStartTime": "Preferred Start Time",
      "optional": "Optional",
      "sessionDuration": "Session Duration (min)",
      "breakDuration": "Break Duration (min)",
      "studyDaysFor": "Study Days for {{name}}"
    },
    "hints": {
      "startTime": "Optional: Set specific start time",
      "sessionDuration": "Recommended: 45-50",
      "breakDuration": "Recommended: 10-15"
    },
    "actions": {
      "addCourse": "Add Course",
      "resetAll": "Reset All",
      "generate": "Generate Smart Timetable",
      "saveToTimetable": "Save to Timetable"
    },
    "priority": {
      "high": "Alta",
      "medium": "Media",
      "low": "Baja",
      "highLabel": "High Prioridad",
      "mediumLabel": "Medium Prioridad",
      "lowLabel": "Low Prioridad",
      "highDesc": "Critical courses, upcoming exams",
      "mediumDesc": "Regular coursework",
      "lowDesc": "Optional reading, review"
    },
    "time": {
      "morning": "Morning (6AM-12PM)",
      "afternoon": "Afternoon (12PM-6PM)",
      "evening": "Evening (6PM-10PM)",
      "any": "Anytime"
    },
    "timeShort": {
      "morning": "Morning",
      "afternoon": "Afternoon",
      "evening": "Evening",
      "any": "Any"
    },
    "timeBest": {
      "morning": "Peak focus",
      "afternoon": "Active learning",
      "evening": "Review & practice",
      "any": "Flexible"
    },
    "courses": {
      "title": "Your Courses ({{count}})",
      "total": "Total:",
      "totalHours": "{{count}}h/week"
    },
    "summaryCard": {
      "title": "Time Allocation Summary",
      "hoursPercent": "{{count}}h ({{percent}}%)"
    },
    "selectedDays": "{{count}} day selected",
    "selectedDays_other": "{{count}} days selected",
    "success": {
      "courseAdded": "Added {{name}} to your courses",
      "blockedAdded": "Unavailable time blocked successfully!",
      "reset": "All fields have been reset!",
      "generated": "Smart timetable generated successfully!"
    },
    "errors": {
      "courseNameEnter": "Please enter a course name",
      "courseNameRequired": "Please enter a course name.",
      "blockedTitle": "Please enter a title for the blocked time",
      "timetableName": "Please enter a timetable name before generating",
      "noCourses": "Please add at least one course before generating a timetable",
      "noDays": "Please select at least one day for studying",
      "selectStudyDay": "Select at least one study day."
    },
    "confirm": {
      "reset": "Are you sure you want to reset all fields? This will clear all your subjects y settings."
    },
    "university": {
      "loaded": "Loaded {{count}} class from your university schedule",
      "loaded_other": "Loaded {{count}} classes from your university schedule"
    },
    "import": {
      "removedConflicts": "Removed {{count}} conflicting sessions based on your availability settings",
      "defaultName": "Imported Timetable - {{date}}",
      "withAvailability": " with availability settings",
      "savedSuccess": "Saved {{count}} sessions to Saved Timetables{{settingsMessage}}!",
      "savedDescription": "Go to Saved Timetables to activate y view your schedule"
    },
    "file": {
      "selected": "File \"{{name}}\" selected. Processing...",
      "analyzing": "AI is analyzing your file. This feature is in development."
    },
    "readySummary": "Ready to generate. You have {{courses}} course y {{hours}} hour of planned study time per week.",
    "readySummary_other": "Ready to generate. You have {{courses}} courses y {{hours}} hours of planned study time per week."
  },
  "days": {
    "monday": "Lunes",
    "tuesday": "Martes",
    "wednesday": "Miércoles",
    "thursday": "Jueves",
    "friday": "Viernes",
    "saturday": "Sábado",
    "sunday": "Domingo",
    "short": {
      "Monday": "Lun",
      "Tuesday": "Mar",
      "Wednesday": "Mié",
      "Thursday": "Jue",
      "Friday": "Vie",
      "Saturday": "Sáb",
      "Sunday": "Dom"
    }
  },
  "settings": {
    "title": "Configuración",
    "subtitle": "Manage your account, reminders, y workspace preferences",
    "tabs": {
      "profile": "Perfil",
      "workspace": "Espacio"
    },
    "profile": {
      "title": "Información del perfil",
      "description": "Update your personal information y contact details",
      "picture": "Foto de perfil",
      "pictureAlt": "Perfil",
      "uploadPicture": "Subir foto",
      "pictureHint": "JPG, PNG o GIF. Tamaño máximo: 5 MB.",
      "fields": {
        "username": "Nombre de usuario",
        "profileTitle": "Titulo del perfil",
        "role": "Rol",
        "department": "Departamento"
      },
      "placeholders": {
        "fullName": "Ingresa tu nombre completo",
        "email": "Ingresa tu correo",
        "role": "Selecciona tu rol",
        "otherRole": "Ingresa la informacion de tu rol",
        "department": "Ingresa tu departamento",
        "dateOfBirth": "Ingresa tu fecha de nacimiento"
      },
      "hints": {
        "fullNameLocked": "Tu nombre completo se guarda durante el registro y no se puede cambiar despues.",
        "username": "Esto aparece solo en tu perfil publico.",
        "profileTitle": "Esto aparece debajo de tu nombre en tu perfil.",
        "otherRole": "Agrega la informacion del rol que quieres mostrar en tu perfil."
      },
      "roleOptions": {
        "student": "Estudiante",
        "administrator": "Administrador",
        "teacher": "Profesor",
        "other": "Otro"
      },
      "actions": {
        "edit": "Editar perfil",
        "save": "Guardar cambios"
      }
    },
    "notifications": {
      "title": "Notificaciones",
      "description": "Manage how you receive notifications y reminders",
      "push": {
        "title": "Push Notifications",
        "description": "Receive notifications about your study schedule"
      },
      "emailStudyReminders": {
        "title": "Email Study Reminders",
        "description": "Receive an email reminder before each planned study session"
      },
      "minutesBefore": {
        "title": "Minutes before",
        "description": "How early to send the reminder email",
        "select": "Select",
        "options": {
          "atStart": "0 (at start)"
        }
      },
      "deadlineAlerts": {
        "title": "Email Deadline Alerts",
        "description": "Get an email when a deadline is approaching"
      },
      "achievementAlerts": {
        "title": "Email Achievement Alerts",
        "description": "Get an email when you unlock an achievement"
      },
      "weeklySummary": {
        "title": "Email Weekly Summary",
        "description": "Receive a weekly summary of your progress"
      }
    },
    "appearance": {
      "title": "Appearance",
      "description": "Customize the look y feel of your dashboard",
      "darkMode": {
        "title": "Dark mode",
        "description": "Switch to a darker interface for low-light use"
      }
    },
    "about": {
      "title": "About",
      "version": "Application Version",
      "versionValue": "1.0.0",
      "lastUpdated": "Last Updated",
      "lastUpdatedValue": "October 2025",
      "description": "Our platform helps learners y study teams plan schedules, manage deadlines, track progress, y stay aligned with structured study workflows."
    },
    "password": {
      "title": "Change Password",
      "description": "Create a strong password with at least 8 characters, including uppercase, lowercase, numbers, y special characters.",
      "fields": {
        "current": "Current Password",
        "new": "New Password",
        "confirm": "Confirm New Password"
      },
      "placeholders": {
        "current": "Enter current password",
        "new": "Enter new password",
        "confirm": "Re-enter new password"
      },
      "actions": {
        "update": "Update password"
      },
      "errors": {
        "fillAllFields": "Please fill in all password fields",
        "sameAsCurrent": "New password must be different from current password",
        "requirements": "Password does not meet requirements",
        "noMatch": "Passwords do not match",
        "userNotLoggedIn": "User not logged in",
        "changeFailed": "Failed to change password",
        "server": "Server error. Please try again later."
      },
      "success": {
        "changed": "Password changed successfully!",
        "changedDescription": "Your password has been updated securely."
      }
    },
    "success": {
      "profilePictureUpdated": "Perfil picture updated successfully!",
      "profilePictureRemoved": "Perfil picture removed successfully!",
      "profileUpdated": "Perfil updated successfully!",
      "reminderSettingsUpdated": "Reminder settings updated"
    },
      "errors": {
        "notLoggedIn": "You are not logged in",
        "roleDetailsRequired": "Ingresa la informacion de tu rol antes de guardar.",
        "uploadImageOnly": "Please upload an image file",
      "uploadImageFailedWithReason": "Failed to upload image: {{reason}}",
      "profilePictureUploadFailed": "Failed to upload profile picture",
      "updateProfileFailed": "Failed to update profile",
      "updateReminderSettingsFailed": "Failed to update reminder settings"
    }
  },
  "courseEdit": {
    "title": "Edit Course",
    "description": "Edit the details of your course to ensure your timetable is accurate y reflects your study schedule.",
    "fields": {
      "name": "Course Name",
      "hours": "Hours/Week",
      "preferredTime": "Preferred Time",
      "startTime": "Preferred Start Time",
      "sessionDuration": "Session Duration (min)",
      "breakDuration": "Break Duration (min)",
      "studyDays": "Study Days for {{name}}",
      "priority": "Prioridad Level"
    },
    "placeholders": {
      "name": "e.g., Mathematics"
    },
    "time": {
      "morning": "Morning",
      "afternoon": "Afternoon",
      "evening": "Evening",
      "any": "Any"
    },
    "priority": {
      "high": "High Prioridad",
      "medium": "Medium Prioridad",
      "low": "Low Prioridad"
    },
    "hints": {
      "startTime": "Optional: Set specific start time",
      "session": "Recommended: 45-50",
      "break": "Recommended: 10-15"
    },
    "selectedDays": "{{count}} day selected",
    "actions": {
      "save": "Guardar cambios",
      "cancel": "Cancelar",
      "delete": "Delete Course"
    },
    "errors": {
      "nameRequired": "Course name is required",
      "selectDay": "Please select at least one study day"
    },
    "confirmDelete": "Are you sure you want to delete \"{{name}}\"? This will regenerate your timetable without this course."
  },
  "assessments": {
    "title": "Evaluaciones",
    "subtitle": "Manage exams, quizzes, assignments, y projects in one place.",
    "listTitle": "Evaluaciones",
    "listDescription": "These automatically show up in the Dashboard Deadlines tab.",
    "empty": {
      "title": "No assessments added yet",
      "description": "Add your first exam, quiz, assignment, or project below."
    },
    "add": {
      "title": "Add assessment",
      "description": "Create a new assessment y it will appear in your deadlines overview.",
      "button": "Add assessment"
    },
    "fields": {
      "course": "Course",
      "type": "Tipo",
      "dateTime": "Date & time",
      "titleOptional": "Title (optional)"
    },
    "placeholders": {
      "selectCourse": "Select course",
      "title": "Leave blank to auto-name"
    },
    "courseHint": "If a course is missing, add it in Auto Generate → Class Timetable.",
    "due": "Due",
    "completed": "Completed",
    "types": {
      "exam": "Examen",
      "quiz": "Cuestionario",
      "assignment": "Tarea",
      "project": "Proyecto"
    },
    "success": {
      "added": "Assessment added",
      "deleted": "Assessment deleted"
    },
    "errors": {
      "selectCourse": "Please select a course for the assessment",
      "chooseDate": "Please choose a date/time for the assessment",
      "createFailed": "Failed to create assessment",
      "updateFailed": "Failed to update"
    }
  },
  "calendar": {
    "title": "Horario de estudio",
    "subtitle": "Planifica y organiza tus sesiones de estudio; cada semana tiene su propio horario",
    "add": "Añadir",
    "aiPlan": "Plan con IA",
    "import": "Importar",
    "copyWeek": "Copiar semana",
    "google": "Google",
    "pdf": "PDF",
    "excel": "Excel",
    "deleteAll": "Eliminar todo",
    "currentWeek": "Ir a la semana actual",
    "importTimetable": "Importar horario",
    "importTargetPrompt": "¿Dónde quieres importar?",
    "myTimetable": "Mi horario",
    "showDetails": "Mostrar detalles",
    "hideDetails": "Ocultar detalles",
    "weeklyView": "Vista semanal",
    "time": "Hora",
    "conflict": "Conflicto",
    "loading": "Cargando...",
    "loadingStatuses": "Cargando estados...",
    "dismiss": "Cerrar",
    "copy": "Copiar",
    "view": "Ver",
    "deadlineCount": "{{count}} fecha límite",
    "deadlineCount_other": "{{count}} fechas límite",
    "status": {
      "completed": "completadas",
      "missed": "perdidas",
      "skipped": "omitidas",
      "planned": "planificadas"
    },
    "actions": {
      "markCompleted": "Marcar como completada",
      "markMissed": "Marcar como perdida",
      "markSkipped": "Marcar como omitida",
      "resetPlanned": "Restablecer a planificada"
    },
    "confirm": {
      "confirm": "Confirmar",
      "deleteAllTitle": "Eliminar todos los cursos",
      "deleteAllMessage": "¿Seguro que quieres eliminar todos los cursos y sesiones de esta semana?",
      "copyNextWeekTitle": "Copiar a la próxima semana",
      "copyNextWeekMessage": "¿Copiar las {{count}} sesión(es) de esta semana a la próxima?",
      "googleOverwrite": "Ya exportaste un horario a Google Calendar.\n\nAceptar = sobrescribir (reemplazar exportación anterior)\nCancelar = añadir encima (mantener exportación anterior)"
    },
    "export": {
      "page": "Página {{page}}",
      "deadline": "Fecha límite: {{date}}",
      "noSessions": "Sin sesiones",
      "continued": "Continúa en la siguiente página",
      "week": "Semana: {{range}}",
      "day": "Día",
      "subject": "Asignatura",
      "startTime": "Inicio",
      "endTime": "Fin",
      "type": "Tipo",
      "deadlineHeader": "Fecha límite",
      "sheetName": "Horario",
      "googleDescription": "Sesión de SmartStudy: {{type}}"
    },
    "toasts": {
      "editAssessmentFromAssessments": "Edita esto desde Evaluaciones y fechas límite",
      "deleteAssessmentFromAssessments": "Elimina esto desde Evaluaciones y fechas límite",
      "timeConflictDetected": "Conflicto de horario detectado",
      "cannotAdd": "No se puede añadir \"{{subject}}\"",
      "alreadyScheduledOn": "\"{{subject}}\" ya está programada el {{day}}",
      "timeRange": "Hora: {{start}} - {{end}}",
      "chooseDifferentTimeSlot": "Elige una franja horaria diferente",
      "chooseDifferentSlot": "Elige otro espacio",
      "sessionDeadlineUpdated": "Sesión y fecha límite actualizadas.",
      "sessionUpdated": "Sesión actualizada correctamente",
      "sessionAddedWithDeadline": "Sesión añadida con fecha límite.",
      "sessionAdded": "Sesión añadida correctamente",
      "sessionDeleted": "Sesión eliminada correctamente",
      "allSessionsCleared": "Listo. Todas las sesiones se eliminaron correctamente.",
      "emptyTimetable": "Horario vacío",
      "emptyBeforeCopy": "Tu horario está vacío. Añade algunas sesiones antes de copiarlo a la próxima semana.",
      "sessionsCopied": "Sesiones copiadas correctamente.",
      "sessionsCopiedDescription": "{{count}} sesión(es) copiadas a la próxima semana (Semana {{week}})",
      "pdfLayoutFailed": "No se pudo generar el PDF: el contenido es demasiado grande para la página.",
      "exportedPdf": "Horario exportado como PDF",
      "pdfExportFailed": "No se pudo exportar el PDF",
      "unknownError": "Error desconocido",
      "exportedExcel": "Horario exportado como Excel",
      "backendUrlMissing": "La URL del backend no está configurada (VITE_API_BASE_URL)",
      "noSessionsToExport": "No hay sesiones para exportar",
      "notLoggedIn": "No has iniciado sesión",
      "googleStatusFailed": "No se pudo comprobar el estado de Google Calendar",
      "connectGoogleToExport": "Conecta Google Calendar para exportar...",
      "exportingGoogle": "Exportando a Google Calendar...",
      "reconnectingGoogle": "Reconectando Google Calendar...",
      "exportFailedWithMessage": "La exportación falló: {{message}}",
      "exportedGoogle": "{{count}} sesión(es) exportadas a Google Calendar",
      "exportFailed": "La exportación falló",
      "importConflictsDetected": "Conflictos de importación detectados",
      "conflictsFound": "{{count}} conflicto(s) encontrados",
      "importConflictPair": "\"{{imported}}\" entra en conflicto con \"{{existing}}\"",
      "onDay": "el {{day}}",
      "moreConflicts": "y {{count}} más...",
      "importedWithAvailability": "{{count}} sesión(es) importadas correctamente con ajustes de disponibilidad.",
      "imported": "{{count}} sesión(es) importadas correctamente.",
      "dragDropConflict": "Conflicto al arrastrar y soltar",
      "cannotMove": "No se puede mover \"{{subject}}\"",
      "alreadyInSlot": "\"{{subject}}\" ya está en esta franja horaria",
      "onDayTimeRange": "el {{day}}: {{start}} - {{end}}",
      "anotherSessionExists": "Ya existe otra sesión a esta hora. Elige otro espacio.",
      "sessionMoved": "Sesión movida correctamente",
      "sessionMovedDescription": "Movida a {{day}} a las {{time}}",
      "navigationUnavailable": "La navegación no está disponible",
      "importFromAutoGenerate": "Los usuarios no administradores importan desde Generar automáticamente.",
      "statusSaveFailed": "No se pudieron guardar los estados de las sesiones del espacio de trabajo",
      "onlyAdminsCanEdit": "Solo los administradores del espacio pueden editar este horario",
      "selectWorkspaceImport": "Selecciona el espacio de trabajo y luego sube/importa en Generar automáticamente del espacio."
    }
  },
  "sessionCard": {
    "confirmDelete": "Delete \"{{name}}\"?"
  },
  "sessionTypes": {
    "reading": "Reading",
    "revision": "Revision",
    "practice": "Practice",
    "break": "Break",
    "lecture": "Lecture",
    "assignment": "Tarea",
    "test": "Test",
    "exam": "Examen"
  },
  "sessionDialog": {
    "add": {
      "title": "Add Study Session",
      "description": "Fill in the details to add a new study session to your timetable."
    },
    "edit": {
      "title": "Edit Session",
      "description": "Update the details of your study session."
    },
    "fields": {
      "subject": "Materia",
      "day": "Day",
      "startTime": "Start Time",
      "endTime": "End Time",
      "type": "Tipo",
      "deadline": "Deadline Date"
    },
    "placeholders": {
      "subject": "e.g., Mathematics, Physics"
    },
    "actions": {
      "add": "Add",
      "update": "Update",
      "session": "Session"
    },
    "errors": {
      "subjectRequired": "Please enter a subject",
      "endTimeAfterStart": "End time must be after start time"
    },
    "confirm": {
      "noDeadline": "You're creating a {{type}} without a deadline. Are you sure you want to continue?"
    },
    "deadlineHelp": "This deadline will appear in your Upcoming Deadlines section",
    "days": {
      "monday": "Monday",
      "tuesday": "Tuesday",
      "wednesday": "Wednesday",
      "thursday": "Thursday",
      "friday": "Friday",
      "saturday": "Saturday",
      "sunday": "Sunday"
    }
  },
  "reminders": {
    "title": "Reminders & Notifications",
    "subtitle": "Set up reminders for your study sessions y important tasks",
    "actions": {
      "add": "Add Reminder",
      "create": "Create Reminder"
    },
    "dialog": {
      "title": "Create Reminder",
      "description": "Set up a new reminder to stay on top of your study schedule."
    },
    "form": {
      "title": "Title",
      "description": "Description",
      "time": "Time",
      "type": "Tipo",
      "repeat": "Repeat on",
      "required": "*",
      "placeholderTitle": "e.g., Study Mathematics",
      "placeholderDescription": "Additional details...",
      "error": "Please fill in all required fields y select at least one day"
    },
    "types": {
      "study": "Estudio",
      "break": "Break",
      "exam": "Examen",
      "custom": "Custom"
    },
    "notifications": {
      "title": "Notification Settings",
      "description": "Enable browser notifications to receive reminders",
      "browser": "Browser Notifications",
      "browserDesc": "Get notified about your scheduled reminders",
      "enabled": "Notifications enabled!",
      "denied": "Notification permission denied",
      "notSupported": "Notifications not supported in this browser"
    },
    "presets": {
      "title": "Quick Add Presets",
      "added": "Preset reminder added!",
      "morning": {
        "title": "Morning Study Session",
        "description": "Time to start your morning study session!"
      },
      "afternoon": {
        "title": "Afternoon Study Session",
        "description": "Don't forget your afternoon study time!"
      },
      "break": {
        "title": "Take a Break",
        "description": "Time for a well-deserved break!"
      }
    },
    "list": {
      "title": "Your Reminders",
      "empty": "No reminders set",
      "emptySub": "Create your first reminder or add a preset"
    },
    "toast": {
      "added": "Reminder added successfully!",
      "deleted": "Reminder deleted"
    },
    "tip": {
      "title": "Tip:",
      "description": "Make sure to allow notifications in your browser settings for the best experience.",
      "extra": "Reminders will work even when the app is running in the background."
    },
    "weekdays": {
      "monday": "Monday",
      "tuesday": "Tuesday",
      "wednesday": "Wednesday",
      "thursday": "Thursday",
      "friday": "Friday",
      "saturday": "Saturday",
      "sunday": "Sunday"
    }
  },
  "viewTimetables": {
    "title": "Saved Timetables",
    "description": "Review, preview, launch, export, y manage your saved schedules.",
    "stats": {
      "sessions": "Sessions",
      "subjects": "Subjects",
      "hoursPerDay": "Hours/day"
    },
    "empty": {
      "title": "No Saved Timetables",
      "description": "You haven’t created any timetables yet.",
      "create": "Create Timetable"
    },
    "card": {
      "untitled": "Untitled Timetable",
      "active": "Active",
      "created": "Created {{date}}",
      "breakEvery": "Break every {{minutes}} min"
    },
    "actions": {
      "view": "View",
      "preview": "Preview",
      "start": "Start timetable",
      "merge": "Merge",
      "overwrite": "Overwrite",
      "duplicate": "Duplicate",
      "delete": "Delete",
      "exportCsv": "Export CSV",
      "exportJson": "Export JSON",
      "exportPdf": "Export PDF"
    },
    "confirm": {
      "delete": "Are you sure you want to delete this timetable?"
    },
    "dialog": {
      "useThisTimetable": "Use this timetable?",
      "myTimetable": "My Timetable",
      "description": {
        "before": "You already have sessions in ",
        "after": " You can merge this timetable into your current schedule or overwrite everything."
      }
    },
    "export": {
      "pdfTitle": "Study Timetable",
      "csvTitle": "Study Timetable",
      "createdOn": "Created on {{date}}",
      "createdOnShort": "Created on {{date}}",
      "generatedOn": "Generated on {{date}}",
      "studyHoursPerDay": "Study Hours per Day: {{value}}",
      "studyTime": "Study Time: {{start}} - {{end}}",
      "sessionLength": "Session Length: {{value}}",
      "breakDuration": "Break Duration: {{value}}",
      "studyHoursPerDayLabel": "Study Hours per Day:",
      "studyTimeLabel": "Study Time:",
      "sessionLengthLabel": "Session Length:",
      "breakDurationLabel": "Break Duration:",
      "subjects": "Subjects:",
      "weeklySchedule": "Weekly Schedule:",
      "priority": "priority"
    },
    "days": {
      "monday": "Monday",
      "tuesday": "Tuesday",
      "wednesday": "Wednesday",
      "thursday": "Thursday",
      "friday": "Friday",
      "saturday": "Saturday",
      "sunday": "Sunday"
    },
    "toasts": {
      "showingSubject": "Showing “{{subject}}” in {{name}}",
      "deleted": "Timetable deleted successfully",
      "started": "Timetable started!",
      "startedOverwriteDescription": "Your My Timetable has been replaced with this saved timetable",
      "startedMerged": "Timetable started (merged)",
      "startedMergeDescription": "Your saved timetable was merged into your current calendar",
      "sessionUnavailable": "One or more sessions unavailable",
      "generatingPdf": "Generating PDF...",
      "pdfDownloaded": "PDF downloaded successfully!",
      "pdfFailed": "Failed to generate PDF. Please try again.",
      "generatingCsv": "Generating CSV file...",
      "csvDownloaded": "CSV file downloaded successfully! (Open with Excel)",
      "exportFailed": "Failed to export file. Please try again.",
      "jsonDownloaded": "JSON downloaded successfully!",
      "jsonFailed": "Failed to export JSON"
    }
  },
  "sharedTimetable": {
    "title": "Shared Timetables",
    "subtitle": "Collaborate on timetables with your team",
    "searchPlaceholder": "Search timetables...",
    "noDescription": "No description",
    "personal": {
      "description": "Personal Timetable",
      "defaultName": "My Timetable",
      "sharedSuffix": "Shared",
      "copySuffix": "Copy",
      "importedDescription": "Imported from personal timetable"
    },
    "stats": {
      "total": "Total Accessible",
      "owned": "Owned by You",
      "editable": "Can Edit",
      "viewOnly": "View Only"
    },
    "filters": {
      "all": "All Timetables",
      "owner": "Owned by Me",
      "editor": "Can Edit",
      "viewer": "View Only"
    },
    "actions": {
      "importMyTimetable": "Import My Timetable",
      "createShared": "Create Shared Timetable",
      "copyToPersonal": "Copy to Personal",
      "managePermissions": "Manage Permissions",
      "viewSessions": "View Sessions",
      "createTimetable": "Create Timetable",
      "importTimetable": "Import Timetable",
      "savePermissions": "Save Permissions"
    },
    "badges": {
      "owner": "Owner",
      "canEdit": "Can Edit",
      "viewOnly": "View Only"
    },
    "visibility": {
      "public": "Public",
      "private": "Private",
      "publicHelp": "All workspace members can view",
      "privateHelp": "Only selected members can view",
      "publicDescription": "Public - All members can view",
      "privateDescription": "Private - Límited access",
      "publicDialog": "Public - All members can view",
      "privateDialog": "Private - Only selected members"
    },
    "fields": {
      "name": "Timetable Name",
      "description": "Description",
      "visibility": "Visibility",
      "editors": "Who can edit? (Select members)",
      "editorsSimple": "Editors",
      "sessions": "Sessions"
    },
    "placeholders": {
      "name": "e.g., Spring 2025 Class Schedule",
      "description": "Brief description of this timetable"
    },
    "roles": {
      "admin": "Administrador",
      "member": "Member"
    },
    "createDialog": {
      "title": "Create Shared Timetable",
      "description": "Create a new timetable that can be edited by team members"
    },
    "importDialog": {
      "title": "Import Personal Timetable",
      "description": "Import your current active timetable as a shared timetable",
      "alert": "This will create a new shared timetable with all sessions from your active personal timetable. All workspace members will be able to edit it by default."
    },
    "permissionsDialog": {
      "title": "Manage Permissions",
      "description": "Control who can view y edit this timetable"
    },
    "viewDialog": {
      "title": "View Timetable",
      "description": "View the sessions in this timetable"
    },
    "selectedEditorsInfo": "Selected: {{count}} member(s). You (owner) can always edit.",
    "sessionsCount": "{{count}} sesiones",
    "editorsCount": "{{count}} editors",
    "byOwner": "by {{name}}",
    "modifiedAt": "Modified {{date}}",
    "modifiedBy": "by {{name}}",
    "confirm": {
      "delete": "Are you sure you want to delete \"{{name}}\"?"
    },
    "success": {
      "created": "Shared timetable created successfully!",
      "importedWithCount": "Imported timetable with {{count}} sessions!",
      "deleted": "Timetable deleted successfully",
      "permissionsUpdated": "Permissions updated successfully",
      "copiedToPersonal": "Timetable copied to your personal timetables!"
    },
    "errors": {
      "enterName": "Please enter a timetable name",
      "noPersonalToImport": "No personal timetables found to import",
      "noActiveFound": "No active timetable found",
      "deletePermission": "Only the owner or admin can delete this timetable",
      "permissionsPermission": "Only the owner or admin can change permissions"
    },
    "info": {
      "viewingWithCount": "Viewing {{name}} - {{count}} sessions"
    },
    "confirmDelete": {
      "title": "Eliminar horario compartido",
      "description": "Esto elimina permanentemente \"{{name}}\" de los horarios compartidos del espacio de trabajo.",
      "fallbackName": "este horario"
    },
    "history": {
      "createdPersonal": "Created personal timetable",
      "created": "Created timetable",
      "importedFromPersonal": "Imported from personal timetable",
      "updatedPermissions": "Updated permissions"
    }
  },
  "teamCollaboration": {
    "defaults": {
      "member": "Member"
    },
    "stats": {
      "sharedSchedules": "Shared Schedules",
      "activeMembers": "Active Members",
      "avgCompletion": "Avg Completion",
      "recentUpdates": "Recent Updates"
    },
    "sharedSchedules": {
      "title": "Shared Schedules",
      "description": "Schedules shared with the team"
    },
    "progress": {
      "title": "Team Progress",
      "description": "Track completion rates across the team",
      "completedCount": "{{completed}}/{{total}} completed",
      "details": "{{hours}}h · Streak {{streak}}d · Goal {{goal}}%"
    },
    "activity": {
      "title": "Recent Activity",
      "description": "What your team has been up to"
    },
    "actions": {
      "shareSchedule": "Share Schedule",
      "view": "View",
      "import": "Import"
    },
    "empty": {
      "schedulesTitle": "No shared schedules yet",
      "schedulesDescription": "Share a schedule to collaborate with your team",
      "progress": "No progress data yet",
      "activity": "No recent activity"
    },
    "visibility": {
      "allMembers": "All Members",
      "allMembersHelp": "Everyone can view y use",
      "adminsOnly": "Admins Only",
      "adminsOnlyHelp": "Only admins can view"
    },
    "shareDialog": {
      "title": "Share Schedule with Team",
      "description": "Select a schedule to share with your workspace members",
      "selectSchedule": "Select Schedule",
      "schedulePlaceholder": "Choose a schedule to share",
      "noSchedules": "No schedules available",
      "createFirst": "Create a timetable first",
      "visibility": "Visibility"
    },
    "errors": {
      "selectSchedule": "Please select a schedule to share",
      "scheduleNotFound": "Schedule not found"
    },
    "success": {
      "shared": "Schedule \"{{name}}\" shared successfully!",
      "progressUpdated": "Progress updated successfully!"
    },
    "info": {
      "viewingDetails": "Viewing schedule details..."
    },
    "activities": {
      "scheduleShared": "shared schedule \"{{name}}\" with the team",
      "progressUpdated": "updated their progress to {{completed}}/{{total}} sessions completed"
    },
    "sessionsCount": "{{count}} sesiones",
    "sharedBy": "Shared by {{name}}",
    "time": {
      "justNow": "Just now",
      "minutesAgo": "{{count}}m ago",
      "hoursAgo": "{{count}}h ago",
      "daysAgo": "{{count}}d ago"
    }
  },
  "welcomeWalkthrough": {
    "greeting": "Hi {{name}}. ",
    "stepCounter": "Step {{current}} / {{total}}",
    "quickTips": "Quick tips",
    "actions": {
      "skipWalkthrough": "Skip walkthrough",
      "openThisPage": "Open this page",
      "skip": "Skip",
      "finish": "Finish",
      "next": "Next"
    },
    "steps": {
      "welcome": {
        "title": "Welcome to U PLAN",
        "description": "This quick walkthrough shows you where the important stuff is. You can skip anytime y come back later.",
        "tips": [
          "Tip: you can refresh safely now — the app will keep your page."
        ]
      },
      "autoGenerate": {
        "title": "Auto-generate a study timetable",
        "description": "Use Auto-Generate to build a weekly plan. You can shuffle to get a different result, or keep a seed to reproduce it.",
        "tips": [
          "Try: Auto-Generate → Shuffle",
          "Then: Save timetable → Apply to week"
        ]
      },
      "assessments": {
        "title": "Assessments & Deadlines",
        "description": "Add deadlines/exams so the generator allocates more time to urgent courses — even when multiple exams happen in the same week.",
        "tips": [
          "Try: add 2 exams in the same week y re-generate"
        ]
      },
      "workspace": {
        "title": "Espacio",
        "description": "Espacio de trabajos let you collaborate with teammates using chat y shared planning.",
        "tips": [
          "Chat updates live while you are on the chat page."
        ]
      }
    }
  },
  "timetable": {
    "back": "Back",
    "title": "Timetable Results",
    "subtitle": "Review, refine, y save your generated academic schedule.",
    "blocked": {
      "sleep": "Sleep",
      "lunchBreak": "Lunch Break",
      "dinnerBreak": "Dinner Break",
      "default": "Blocked Time"
    },
    "break": "Break",
    "unavailable": "Unavailable",
    "minutes": "{{count}} min",
    "stats": {
      "sessions": "Sessions",
      "hours": "Hours",
      "courses": "Courses"
    },
    "summary": {
      "title": "Schedule summary",
      "description": "Your schedule was generated using course priority, preferred study windows, blocked time, y session/break settings.",
      "priorityLabel": "Prioridad-based allocation:",
      "priorityText": "higher-priority courses are placed in stronger study windows.",
      "timePreferencesLabel": "Time preferences:",
      "timePreferencesText": "courses are placed in preferred morning, afternoon, or evening windows where possible.",
      "conflictAvoidanceLabel": "Conflict avoidance:",
      "conflictAvoidanceText": "study sessions avoid {{count}} blocked slot(s).",
      "sessionStructureLabel": "Session structure:",
      "sessionStructureText": "{{sessionDuration}} minute sessions with {{breakDuration}} minute breaks."
    },
    "actions": {
      "save": "Save Timetable",
      "editCourses": "Edit Courses",
      "splitLongSessions": "Split Long Sessions",
      "mergeAdjacentSessions": "Merge Adjacent Sessions",
      "createNew": "Create New"
    },
    "unavailableTime": {
      "title": "Unavailable time respected",
      "description": "Study sessions were scheduled around {{count}} unavailable time slot(s)."
    },
    "availability": {
      "title": "Availability & Breaks Settings",
      "weekdayHours": "Weekday Hours:",
      "weekendHours": "Weekend Hours:",
      "sleepHours": "Sleep Hours:",
      "lunchBreak": "Lunch Break:",
      "dinnerBreak": "Dinner Break:",
      "commuteBuffer": "Commute Buffer:",
      "commuteMinutes": "{{count}} minutes",
      "noneFound": "No availability settings found for this timetable."
    },
    "empty": {
      "title": "No schedule generated",
      "description": "There was an issue generating the schedule. Please check that you selected study days y added courses."
    },
    "dayDescription": "{{count}} study session(s) ⬢ {{hours}}h total",
    "dayEmpty": "No sessions scheduled for this day",
    "tips": {
      "title": "Study tips",
      "followScheduleLabel": "Follow the schedule:",
      "followScheduleText": "the timetable was generated around your priorities y free time.",
      "useBreaksLabel": "Use breaks well:",
      "useBreaksText": "rest, hydrate, y reset between study blocks.",
      "adjustWhenNeededLabel": "Adjust when needed:",
      "adjustWhenNeededText": "regenerate if your courses or unavailable time change.",
      "stayConsistentLabel": "Stay consistent:",
      "stayConsistentText": "shorter repeatable sessions usually work better than overloading one day."
    },
    "unsaved": {
      "title": "Unsaved Timetable",
      "titleWithWarning": "⚠️ Unsaved Timetable",
      "backDescription": "You haven't saved your timetable yet. If you go back to the dashboard now, all your generated schedule will be lost.",
      "backQuestion": "Would you like to stay y save your timetable, or discard it y go back?",
      "createNewDescription": "You haven't saved your timetable yet. If you create a new timetable now, all your generated schedule will be lost.",
      "createNewQuestion": "Would you like to stay y save your timetable, or discard it y create a new one?",
      "discardAndGoBack": "Discard & Go Back",
      "stayAndSave": "Stay & Save",
      "discardAndCreateNew": "Discard & Create New"
    },
    "courseDialog": {
      "title": "Edit Course Settings",
      "description": "Select a course to modify its details, change times, or delete it.",
      "courseMeta": "{{hours}}h/week ⬢ {{priority}} priority",
      "noCourses": "No courses available"
    },
    "toast": {
      "splitSuccess": "Long sessions split into Pomodoros! Sessions over 90 minutes have been divided with breaks.",
      "mergeSuccess": "Adjacent sessions merged! Same-subject sessions close together have been combined.",
      "savedWithWeek": "Timetable saved! Sessions added to week {{weekId}}",
      "addedToMyTimetable": "{{count}} sessions added to My Timetable for week {{weekId}}!",
      "pdfComingSoon": "PDF export feature coming soon!",
      "googleCalendarConnectFirst": "Please connect to Google Calendar in Settings first",
      "exportingGoogleCalendar": "Exporting to Google Calendar...",
      "exportedGoogleCalendar": "Successfully exported {{count}} study sessions to Google Calendar!",
      "failedGoogleCalendar": "Failed to export to Google Calendar",
      "courseUpdated": "Course \"{{name}}\" updated! Schedule regenerated.",
      "cannotDeleteLastCourse": "Cannot delete the last course. Please add another course first.",
      "courseDeleted": "Course deleted! Schedule regenerated."
    }
  },
  "terms": {
    "back": "Back",
    "title": "Terms of Service",
    "lastUpdated": "Last Updated: October 24, 2025",
    "sections": {
      "acceptance": {
        "title": "1. Acceptance of Terms",
        "content": "By accessing y using U PLAN (\"the Service\"), you accept y agree to be bound by the terms y provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service."
      },
      "service": {
        "title": "2. Description of Service",
        "description": "U PLAN provides students with tools to create, manage, y optimize their study schedules. The Service includes:",
        "items": [
          "Interactive weekly calendar for study session planning",
          "Smart scheduling algorithms based on course priorities",
          "Manual creation y editing of study sessions",
          "Timetable saving y management features",
          "Dark mode y customization options"
        ]
      },
      "accounts": {
        "title": "3. User Accounts",
        "description": "To use certain features of the Service, you must register for an account. You agree to:",
        "items": [
          "Provide accurate, current, y complete information during registration",
          "Maintain the security of your password y account",
          "Notify us immediately of any unauthorized use of your account",
          "Accept responsibility for all activities that occur under your account"
        ]
      },
      "storage": {
        "title": "4. User Data y Local Storage",
        "content": "The Service stores your data locally in your browser using localStorage. This includes your account information, timetables, study sessions, y preferences. You are responsible for maintaining backups of your data. We are not liable for any loss of data stored locally on your device."
      },
      "use": {
        "title": "5. Acceptable Use",
        "description": "You agree not to use the Service to:",
        "items": [
          "Violate any applicable laws or regulations",
          "Infringe upon the rights of others",
          "Transmit any harmful or malicious code",
          "Attempt to gain unauthorized access to the Service",
          "Use the Service for any commercial purposes without permission",
          "Interfere with or disrupt the Service or servers"
        ]
      },
      "ip": {
        "title": "6. Intellectual Property",
        "content": "The Service y its original content, features, y functionality are owned by U PLAN y are protected by international copyright, trademark, patent, trade secret, y other intellectual property laws. Your use of the Service does not grant you ownership of any intellectual property rights."
      },
      "disclaimer": {
        "title": "7. Disclaimer of Warranties",
        "content": "THE SERVICE IS PROVIDED \"AS IS\" AND \"AS AVAILABLE\" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not warrant that the Service will be uninterrupted, timely, secure, or error-free."
      },
      "liability": {
        "title": "8. Limitation of Liability",
        "content": "IN NO EVENT SHALL U PLAN, ITS DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE."
      },
      "education": {
        "title": "9. Educational Purpose",
        "content": "The Service is designed to assist with study planning y time management. It is not a substitute for professional academic advising. Study schedules generated by the Service are suggestions y should be adapted based on individual needs y circumstances."
      },
      "modifications": {
        "title": "10. Modifications to Service",
        "content": "We reserve the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice. You agree that we shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service."
      },
      "changes": {
        "title": "11. Changes to Terms",
        "content": "We reserve the right to update or modify these Terms of Service at any time without prior notice. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms of Service. We will update the \"Last Updated\" date at the top of this page when changes are made."
      },
      "termination": {
        "title": "12. Termination",
        "content": "We may terminate or suspend your account y access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms of Service. Upon termination, your right to use the Service will immediately cease."
      },
      "law": {
        "title": "13. Governing Law",
        "content": "These Terms shall be governed y construed in accordance with applicable laws, without regard to its conflict of law provisions. Any disputes arising from these Terms or use of the Service shall be resolved through binding arbitration."
      },
      "contact": {
        "title": "14. Contact Information",
        "content": "If you have any questions about these Terms of Service, please contact us through the app's support channels or settings page."
      },
      "consent": "By using U PLAN, you acknowledge that you have read, understood, y agree to be bound by these Terms of Service."
    }
  },
  "dashboard": {
    "refresh": "Actualizar",
    "tasksDone": "Evaluaciones completadas a tiempo",
    "tasks": "tareas",
    "dailyOverview": "Resumen diario",
    "welcomeBack": "Bienvenido de nuevo, {{name}}",
    "studyHours": "Horas de estudio",
    "sessions": "Sesiones",
    "upcoming": "Próximás",
    "focusTimer": "Temporizador de enfoque",
    "focus": "Enfoque",
    "break": "Descanso",
    "longBreak": "Descanso largo",
    "timerRunning": "El temporizador está en marcha",
    "timerReady": "Listo para empezar",
    "start": "Iniciar",
    "pause": "Pausa",
    "reset": "Restablecer",
    "open": "Abrir",
    "todayProgress": "Progreso de hoy",
    "studyCompletion": "Progreso de estudio",
    "weekGoal": "Meta semanal",
    "notSet": "Sin definir",
    "completedSessions": "Sesiones completadas",
    "currentSession": "Sesión actual",
    "noActiveSession": "No hay sesión activa",
    "none": "Ninguna",
    "today": "Hoy",
    "todayShort": "Hoy",
    "calendar": "Calendario",
    "insights": "Análisis",
    "fullView": "Vista completa",
    "focusView": "Vista enfoque",
    "nextSession": "Próxima sesión",
    "live": "En vivo",
    "startsAt": "Empieza a las {{time}}",
    "noMoreSessionsToday": "No hay más sesiones hoy",
    "todaysScheduleProgress": "Horario y progreso de hoy",
    "totalHours": "Horas totales",
    "completed": "Completado",
    "minutesShort": "min",
    "noSessionsToday": "No hay sesiones programadas para hoy",
    "addSessions": "Añadir sesiones",
    "studyProgressOverview": "Resumen del progreso de estudio",
    "week": "Semana",
    "month": "Mes",
    "completedHours": "Horas completadas",
    "weeklyGoal": "Meta semanal",
    "setWeeklyGoalHint": "Define una meta semanal en Objetivos y logros",
    "noStudyDataWeek": "No hay datos de estudio está semana. Empieza a programar sesiones para seguir tu progreso.",
    "deadlines": "Fechas límite",
    "priority": {
      "high": "Alta",
      "medium": "Media",
      "low": "Baja"
    },
    "taskTypes": {
      "assignment": "Tarea",
      "exam": "Examen",
      "quiz": "Cuestionario",
      "project": "Proyecto"
    },
    "calendarTag": "Calendario",
    "tomorrow": "Mañana",
    "overdue": "Vencido",
    "daysCount": "{{count}} días",
    "markDone": "Marcar como completado",
    "noUpcomingDeadlines": "No hay fechas límite próximás",
    "smartInsights": "Ideas inteligentes",
    "aiRecommendations": "Recomendaciones con IA",
    "todaysRecommendations": "Recomendaciones de hoy",
    "quickStats": "Estadisticas rapidas",
    "todaysHours": "Horas de hoy",
    "studyStreak": "Racha de estudio",
    "completedToday": "Completado hoy",
    "nextFocusSession": "Próxima sesión de enfoque",
    "allDoneToday": "Todo listo por hoy",
    "nextSessionAt": "Próxima sesión: {{subject}} a las {{time}}",
    "considerBreak": "Has estudiado mucho. Considera tomar un descanso breve.",
    "morningGreat": "Es un gran momento para estudiar con enfoque.",
    "focusDeadline": "Enfocate en {{subject}}: la fecha límite se acerca",
    "allCaughtUp": "Todo al dia. Es momento de adelantarte.",
    "thisIsBreak": "Este bloque es un descanso.",
    "sessionAlreadyMissed": "Esta sesión ya fue marcada como perdida.",
    "startingEarly": "Estás iniciyo \"{{subject}}\" antes de tiempo.",
    "countTowardRecent": "¿Quieres contar este tiempo para tu sesión más reciente \"{{recent}}\"?",
    "okCountsToward": "Aceptar = contar para \"{{recent}}\"",
    "cancelStartsEarly": "Cancelar = iniciar \"{{subject}}\" antes de tiempo",
    "addNewTask": "Agregar nueva tarea",
    "addTaskDescription": "Crea una nueva fecha límite para una tarea, examen, cuestionario o proyecto.",
    "taskTitle": "Titulo de la tarea",
    "taskTitlePlaceholder": "p. ej., Tarea de matematicas capitulo 5",
    "taskTitleHint": "Opcional: dejalo vacio para nombrarlo automáticamente (p. ej., \"{{example}}\").",
    "subject": "Materia",
    "selectCourse": "Selecciona un curso",
    "fillClassScheduleFirst": "Completa primero tu horario de clases",
    "priorityLocked": "La prioridad está bloqueada segun tu horario de clases",
    "type": "Tipo",
    "dueDate": "Fecha límite",
    "cancel": "Cancelar",
    "addTask": "Agregar tarea",
    "monthlyHours": "Horas mensuales",
    "activeDays": "Dias activos",
    "dailyAverage": "Promedio diario",
    "monthlyOverview": "Resumen mensual",
    "bestDay": "Mejor dia",
    "line": "Línea",
    "bar": "Barras",
    "todayLabel": "Hoy",
    "shortDays": {
      "mon": "Lun",
      "tue": "Mar",
      "wed": "Mie",
      "thu": "Jue",
      "fri": "Vie",
      "sat": "Sab",
      "sun": "Dom"
    },
    "study": "Estudio",
    "skipped": "Omitida",
    "missed": "Perdida",
    "success": {
      "taskAdded": "Fecha agregada.",
      "taskUpdated": "Fecha actualizada.",
      "taskDeleted": "Tarea eliminada.",
      "deadlineRemoved": "Fecha eliminada.",
      "timetableActivated": "Horario activado."
    },
    "savedTimetables": "Horarios guardados",
    "viewAll": "Ver todo",
    "untitledTimetable": "Horario sin título",
    "active": "Activo",
    "activate": "Activar",
    "noSavedTimetables": "Aún no hay horarios guardados",
    "createFirstTimetableHint": "Crea un horario y activalo directamente desde tu panel.",
    "createTimetable": "Crear horario",
    "sessionsCount_one": "{{count}} sesión",
    "sessionsCount_other": "{{count}} sesiones",
    "errors": {
      "missingUser": "Falta el usuario.",
      "missingSessionId": "Falta el ID de sesión.",
      "failedStartSession": "No se pudo iniciar la sesión.",
      "loginToAddDeadline": "Inicia sesión para agregar una fecha.",
      "failedAddTask": "No se pudo agregar la tarea.",
      "pleaseLogin": "Inicia sesión.",
      "failedUpdateTask": "No se pudo actualizar la tarea.",
      "failedDeleteTask": "No se pudo eliminar la tarea.",
      "fillRequired": "Completa los campos obligatorios.",
      "activateUnavailable": "No se pudo activar este horario.",
      "failedActivateTimetable": "No se pudo activar el horario."
    },
    "pages": {
      "dashboard": "Panel",
      "academicTimetable": "Horario académico",
      "scheduleGenerator": "Generador de horarios",
      "assessments": "Evaluaciones",
      "studyNotes": "Notas de estudio",
      "collaboration": "Colaboración",
      "performance": "Rendimiento",
      "createSchedule": "Crear horario",
      "savedSchedules": "Horarios guardados"
    },
    "sections": {
      "planning": "Planificación",
      "academicWork": "Trabajo académico",
      "performance": "Rendimiento",
      "system": "Sistema"
    },
    "search": {
      "placeholder": "Buscar horarios, paginas, materias...",
      "short": "Buscar...",
      "page": "Pagina",
      "savedTimetable": "Horario guardado",
      "inTimetable": "en {{name}}",
      "noResults": "Sin resultados",
      "noResultsWithQuery": "No se encontraron resultados para \"{{query}}\"",
      "tryDifferent": "Prueba con otro horario o materia"
    },
    "actions": {
      "lightMode": "Modo claro",
      "darkMode": "Modo oscuro",
      "pomodoro": "Abrir temporizador Pomodoro"
    },
    "notifications": {
      "title": "Notificaciones",
      "markAll": "Marcar todo como leido",
      "empty": "Sin notificaciones"
    },
    "user": {
      "student": "Estudiante",
      "profile": "Perfil",
      "planner": "Planificador"
    },
    "sidebar": {
      "expand": "Expandir barra lateral",
      "collapse": "Contraer barra lateral",
      "portal": "Portal",
      "workspace": "Espacio académico"
    },
    "footer": "Planificador de estudio con IA"
  },
  "workspace": {
    "title": "Espacio",
    "loading": "Cargyo espacio...",
    "switch": "Cambiar espacio",
    "choose": "Elige un espacio o subespacio",
    "under": "Debajo de {{name}}",
    "subworkspaces": "Subespacios",
    "loadingSubworkspaces": "Cargyo subespacios...",
    "noSub": "Sin subespacios todavía",
    "createSub": "Crear subespacio",
    "createNew": "Crear espacio",
    "new": "New Espacio de trabajo",
    "share": "Share",
    "edit": "Edit Espacio de trabajo",
    "delete": "Delete Espacio de trabajo",
    "uploadAvatar": "Upload workspace avatar",
    "searchMembers": "Search members by name, email, or role...",
    "defaults": {
      "name": "Mi espacio de estudio",
      "description": "Planificación colaborativa de estudio"
    },
    "chat": {
      "welcome": "¡Bienvenido a {{name}}! Empieza a colaborar con tu equipo.",
      "teamActivity": "Actividad del equipo",
      "online": "En línea",
      "onlineCount_one": "{{count}} en línea",
      "onlineCount_other": "{{count}} en línea",
      "activeNow": "Activo ahora",
      "lastSeen": "Visto por última vez {{time}}",
      "justNow": "Justo ahora",
      "emptyTitle": "Aún no hay mensajes",
      "emptySubtitle": "Empieza la conversación",
      "me": "Yo",
      "edited": "editado",
      "newMessages": "Nuevos mensajes",
      "newMessagesCount_one": "{{count}} mensaje nuevo",
      "newMessagesCount_other": "{{count}} mensajes nuevos",
      "quickEmojis": "Emojis rápidos",
      "placeholder": "Escribe tu mensaje...",
      "hint": "Pulsa Enter para enviar, Shift+Enter para nueva línea",
      "yesterdayAt": "Ayer a las {{time}}",
      "link": "Enlace compartido",
      "confirmDeleteMessage": "¿¿Seguro que quieres eliminar este mensaje?",
      "actions": {
        "send": "Enviar",
        "save": "Guardar",
        "cancel": "Cancelar",
        "edit": "Editar",
        "delete": "Eliminar",
        "addEmoji": "Añadir emoji",
        "attachFile": "Adjuntar archivo"
      },
      "success": {
        "messageUpdated": "Mensaje actualizado",
        "messageDeleted": "Mensaje eliminado",
        "fileShared": "¡Archivo compartido en el chat!"
      },
      "errors": {
        "loadMessages": "No se pudieron cargar los mensajes",
        "sendMessage": "No se pudo enviar el mensaje",
        "updateMessage": "No se pudo actualizar el mensaje",
        "deleteMessage": "No se pudo eliminar el mensaje",
        "fileTooLarge": "El archivo debe ser menor de 10 MB"
      }
    },
    "tabs": {
      "members": "Miembros",
      "schedule": "Horario",
      "generate": "Generar",
      "progress": "Progreso",
      "collab": "Colaboración",
      "chat": "Chat"
    },
    "stats": {
      "total": "Miembros totales",
      "admins": "Administradores",
      "members": "Miembros"
    },
    "members": {
      "title": "Miembros",
      "description": "Gestiona el acceso del equipo",
      "pendingRequests": "Solicitudes pendientes",
      "searchPlaceholder": "Buscar miembros...",
      "none": "No se encontraron miembros"
    },
    "roles": {
      "admin": {
        "label": "Administrador",
        "description": "Gestiona miembros, roles, ajustes del espacio y cualquier tarea, incluidas las de otros usuarios"
      },
      "member": {
        "label": "Miembro",
        "description": "Puede crear, editar, mover y comentar tareas, y solo puede archivar o eliminar sus propias tareas"
      }
    },
    "rolesGuide": {
      "title": "Guía de roles",
      "description": "Los administradores pueden gestionarlo todo. Los miembros pueden colaborar, pero no pueden archivar ni eliminar tareas de otros usuarios."
    },
    "permissions": {
      "manage_members": "Manage members",
      "delete_workspace": "Delete workspace",
      "edit_workspace": "Edit workspace",
      "manage_roles": "Manage roles",
      "chat": "Chat",
      "edit_content": "Edit content"
    },
    "presence": {
      "online": "En línea",
      "never": "Nunca",
      "justNow": "Ahora mismo",
      "yesterday": "Ayer"
    },
    "errors": {
      "missingUser": "Falta el usuario.",
      "loadFailed": "No se pudieron cargar los espacios.",
      "workspaceNameRequired": "Escribe un nombre para el espacio.",
      "subworkspaceNameRequired": "Escribe un nombre para el subespacio.",
      "createWorkspace": "No se pudo crear el espacio.",
      "createSubworkspace": "No se pudo crear el subespacio.",
      "fillFields": "Completa los campos obligatorios.",
      "invalidEmail": "Please enter a valid email address",
      "invalidEmailDetailed": "Please enter a valid email address (e.g., user@example.com)",
      "memberExists": "A member with this email already exists",
      "memberExistsDetailed": "A member with this email already exists in this workspace",
      "maxAdmins": "Máximo 2 administradores por espacio.",
      "maxAdminsDetailed": "Maximum 2 admins allowed per workspace. Please select Member role instead.",
      "parentNotFound": "Parent workspace not found. Please refresh y try again.",
      "addMember": "Failed to add member",
      "removeMember": "No se pudo eliminar el miembro.",
      "notAuthenticated": "No autenticado.",
      "updateRole": "No se pudo actualizar el rol.",
      "updateRoleUnexpected": "Error inesperado al actualizar el rol.",
      "approveRequest": "Failed to approve request",
      "rejectRequest": "Failed to reject request",
      "cannotDeleteLast": "No puedes eliminar tu último espacio.",
      "deleteWorkspace": "Failed to delete workspace",
      "deleteWorkspaceUnexpected": "Algo salió mal while deleting the workspace",
      "updateWorkspace": "Failed to update workspace",
      "imageSize": "La imagen debe ser menor de 2 MB.",
      "imageType": "Sube JPG, PNG o GIF.",
      "uploadAvatar": "No se pudo subir la imagen.",
      "removeAvatar": "Failed to remove workspace image",
      "shareFailed": "Failed to generate share link",
      "shareUnexpected": "Algo salió mal while generating the link",
      "disableShare": "Failed to disable share link",
      "copyFailed": "Failed to copy link",
      "onlyAdminsGenerate": "Only workspace admins can auto-generate"
    },
    "actions": {
      "share": "Compartir",
      "manageLink": "Gestionar enlace"
    },
    "success": {
      "workspaceCreated": "Espacio creado.",
      "subworkspaceCreated": "Subespacio creado.",
      "switched": "Cambiaste a {{name}}.",
      "memberAdded": "Member added successfully",
      "memberRemoved": "{{name}} eliminado.",
      "requestApproved": "{{name}} aprobado.",
      "requestRejected": "{{name}} rechazado.",
      "deleted": "Espacio eliminado.",
      "updated": "Espacio actualizado.",
      "avatarUpdated": "Imagen actualizada.",
      "avatarRemoved": "Espacio de trabajo avatar removed successfully!",
      "shareCreated": "Sharing link generated successfully!",
      "shareDisabled": "Sharing link disabled (revoked)",
      "linkCopied": "Link copied to clipboard!",
      "accessOpen": "Access type updated to Open to everyone",
      "accessRestricted": "Access type updated to Domain-restricted"
    },
    "confirm": {
      "removeMember": "¿Seguro que quieres eliminar a {{name}} del espacio?",
      "deleteWorkspace": "⚠️ Are you sure you want to delete this workspace? This action cannot be undone y will remove all members y data.",
      "disableShareLink": "Are you sure you want to disable the sharing link? No one will be able to use it to join."
    },
    "memberCount_one": "{{count}} miembro",
    "memberCount_other": "{{count}} miembros",
    "subworkspaceCount_one": "{{count}} subespacio",
    "subworkspaceCount_other": "{{count}} subespacios"
  },
  "board": {
    "title": "Tablero de colaboración",
    "description": "Planifica, asigna y sigue el trabajo con tu equipo",
    "view": {
      "compact": "Compacto",
      "detailed": "Detallado"
    },
    "sections": {
      "analytics": "Analítica de tareas",
      "filters": "Filtros"
    },
    "stats": {
      "total": "Total de tareas",
      "totalCount": "{{count}} tareas",
      "todo": "Por hacer",
      "inProgress": "En progreso",
      "inProgressCount": "{{count}} en progreso",
      "review": "En revisión",
      "done": "Hechas",
      "doneCount": "{{count}} hechas",
      "overdue": "Vencidas"
    },
    "actions": {
      "newTask": "Nueva tarea",
      "editTask": "Editar tarea",
      "createTask": "Crear tarea",
      "updateTask": "Actualizar tarea",
      "cancel": "Cancelar",
      "processing": "Procesando...",
      "archive": "Archivar tarea",
      "restore": "Restaurar",
      "deletePermanent": "Eliminar definitivamente"
    },
    "rules": {
      "description": "Reglas rápidas del flujo de trabajo compartido.",
      "ownership": {
        "title": "Propiedad de tareas",
        "label": "Compartidas por defecto",
        "body": "Cualquier miembro puede crear tareas, asignar trabajo, comentar y mover tareas entre columnas."
      },
      "workflow": {
        "title": "Etapas del flujo",
        "label": "Por hacer -> Hecho",
        "body": "Mueve el trabajo de Por hacer a En progreso, luego Revisión y después Hecho para reflejar el estado real del proyecto."
      },
      "archive": {
        "title": "Archivado",
        "label": "Solo tareas propias",
        "body": "Los miembros solo pueden archivar o eliminar definitivamente las tareas que crearon. Las tareas archivadas se pueden restaurar."
      },
      "admin": {
        "title": "Control del admin",
        "label": "Gobierno del espacio",
        "body": "Los administradores pueden limpiar el tablero, archivar todas las tareas, eliminar cualquier tarea y gestionar el acceso del espacio."
      }
    },
    "dialogs": {
      "archiveTaskTitle": "Archivar tarea",
      "archiveTaskDescription": "Esta tarea se moverá al archivo. Para continuar, escribe {{phrase}} abajo.",
      "deleteAllActiveTitle": "Eliminar todas las tareas activas",
      "deleteAllActiveDescription": "Esto elimina permanentemente todas las tareas activas del espacio. Escribe {{phrase}} para confirmar.",
      "deleteArchivedTitle": "Eliminar tarea archivada",
      "deleteArchivedDescription": "Esto elimina permanentemente la tarea archivada y no se puede deshacer. Escribe {{phrase}} para continuar.",
      "archiveAllTitle": "Archivar todas las tareas",
      "archiveAllDescription": "Todas las tareas activas se moverán al archivo. Escribe {{phrase}} para confirmar esta acción masiva.",
      "deleteAllArchivedTitle": "Eliminar todas las tareas archivadas",
      "deleteAllArchivedDescription": "Esto elimina permanentemente todas las tareas archivadas. Esta acción no se puede deshacer. Escribe {{phrase}} para continuar."
    },
    "delete": {
      "confirmationPhrase": "Frase de confirmación",
      "typePhraseToContinue": "Escribe la frase para continuar"
    },
    "filters": {
      "search": "Buscar tareas...",
      "allPriorities": "Todas las prioridades",
      "allMembers": "Todos los miembros",
      "unassigned": "Sin asignar"
    },
    "columns": {
      "todo": "Por hacer",
      "inProgress": "En progreso",
      "review": "Revisión",
      "done": "Hecho"
    },
    "priority": {
      "low": "Baja",
      "medium": "Media",
      "high": "Alta",
      "urgent": "Urgente"
    },
    "task": {
      "title": "Título",
      "description": "Descripción",
      "status": "Estado",
      "priority": "Prioridad",
      "assignee": "Responsable",
      "dueDate": "Fecha límite",
      "labels": "Etiquetas",
      "addLabel": "Añadir etiqueta...",
      "addHint": "Añade una tarea para empezar",
      "noTasks": "Aún no hay tareas",
      "selectAssignee": "Selecciona responsable...",
      "you": "Tú",
      "deadlineLocked": "Fecha límite bloqueada"
    },
    "dates": {
      "today": "Hoy",
      "tomorrow": "Mañana",
      "yesterday": "Ayer",
      "overdue": "Vencido"
    },
    "archive": {
      "title": "Tareas archivadas",
      "empty": "No hay tareas archivadas",
      "archiveAll": "Archivar todo",
      "deleteAllActive": "Eliminar todas las tareas",
      "deleteAll": "Eliminar todo",
      "restore": "Restaurar",
      "deletePermanent": "Eliminar definitivamente",
      "archived": "Tarea archivada",
      "restored": "Tarea restaurada a Por hacer",
      "deleted": "Tarea eliminada definitivamente",
      "allActiveDeleted": "Todas las tareas activas eliminadas",
      "allArchived": "Todas las tareas archivadas",
      "allDeleted": "Todas las tareas archivadas eliminadas",
      "confirmDelete": "¿Seguro que quieres eliminar esta tarea definitivamente?",
      "confirmDeleteAll": "¿Eliminar TODAS las tareas archivadas definitivamente?"
    },
    "messages": {
      "created": "Tarea creada correctamente",
      "updated": "Tarea actualizada correctamente",
      "deleted": "Tarea eliminada correctamente",
      "moved": "Tarea movida correctamente",
      "errorLoad": "No se pudieron cargar las tareas",
      "errorCreate": "No se pudo crear la tarea",
      "errorUpdate": "No se pudo actualizar la tarea",
      "errorMove": "No se pudo mover la tarea",
      "errorDelete": "No se pudo eliminar la tarea",
      "errorRestore": "No se pudo restaurar la tarea",
      "errorArchiveAll": "No se pudieron archivar todas las tareas",
      "errorDeleteAllArchived": "No se pudieron eliminar todas las tareas archivadas",
      "errorAdminOnly": "Solo los administradores pueden ejecutar esta acción para todo el espacio",
      "errorDeletePermission": "Solo los administradores o el creador pueden eliminar o archivar esta tarea",
      "errorDeadlineLocked": "Las tareas con fecha límite solo se pueden archivar o eliminar cuando ya están vencidas."
    }
  },
  "homepage": {
    "product": {
      "heading": "A sharper way to plan, adapt, y win",
      "description": "UPLAN is designed like a modern productivity system: structured, adaptive, y focused on real progress."
    },
    "hero": {
      "badge": "Built for students who want clarity, not chaos",
      "titleLine1": "Plan smarter.",
      "titleLine2": "Study with less stress.",
      "description1": "U PLAN automatically builds your study timetable around exams, classes, deadlines, y your real free time.",
      "description2": "No more guessing when to study. No more overloaded days. Just a flexible, personalized plan that actually works.",
      "getStarted": "Get Started",
      "seeFeatures": "See Features",
      "studentStudyingAlt": "Estudiante estudiando",
      "cards": {
        "autoTimetables": {
          "title": "Auto Timetables",
          "description": "Generated around your real schedule"
        },
        "deadlineAware": {
          "title": "Deadline Aware",
          "description": "Plans around exams y assignments"
        },
        "flexible": {
          "title": "Flexible",
          "description": "Adjusts when life gets busy"
        }
      }
    },
    "mockup": {
      "todayPlan": "Today's Plan",
      "organizedAutomatically": "Organized automatically",
      "smart": "Smart",
      "mathRevision": "Math Revision",
      "priorityHigh": "Prioridad: High",
      "physicsQuizPrep": "Physics Quiz Prep",
      "deadlineTomorrow": "Deadline tomorrow",
      "thisWeek": "This week",
      "sessions": "Sessions",
      "deadlines": "Deadlines",
      "planned": "Planned",
      "phoneFirst": "Designed to feel great on your phone first."
    },
    "about": {
      "title": "About U PLAN",
      "subtitle": "Helping students manage their time with clarity y confidence",
      "missionTitle": "Our Mission",
      "missionParagraph1": "We created U PLAN to make studying more organized, flexible, y realistic. Students already have enough pressure — your planning tool should reduce stress, not add to it.",
      "missionParagraph2": "By combining smart automation with student-first design, U PLAN helps you fit studying around exams, classes, deadlines, y life outside school.",
      "startJourney": "Start Your Journey",
      "studentsStudyingTogetherAlt": "Students studying together"
    },
    "values": {
      "title": "What We Sty For",
      "subtitle": "The principles behind every feature we build",
      "phoneAlt": "Aplicación móvil de U PLAN",
      "mobilePreview": "Vista móvil",
      "clearDailyPlan": "Tu día claro de un vistazo",
      "vision": {
        "title": "Vision",
        "description": "Smart time management for every student"
      },
      "team": {
        "title": "Team",
        "description": "Built by people who understand student pressure firsthand"
      },
      "innovation": {
        "title": "Innovation",
        "description": "Práctical AI that helps students take action"
      },
      "studentFirst": {
        "title": "Student-First",
        "description": "Every decision is designed around real student needs"
      }
    },
    "whyChoose": {
      "title": "Why Students Choose U PLAN",
      "paragraph1": "U PLAN was built for the reality of student life: shifting deadlines, changing schedules, multiple subjects, y límited energy. Traditional planners don't adapt. We do.",
      "paragraph2": "Whether you're preparing for finals, balancing multiple courses, or trying to stay consistent without burning out, U PLAN helps you study with more structure y less guesswork."
    },
    "featuresSection": {
      "title": "Core Features",
      "subtitle": "Everything you need to succeed académically"
    },
    "features": {
      "smartScheduling": {
        "title": "Smart Scheduling",
        "description": "Automatically optimize your study time based on priorities y deadlines"
      },
      "timeManagement": {
        "title": "Time Management",
        "description": "Track your study sessions y improve productivity"
      },
      "progressTracking": {
        "title": "Progress Tracking",
        "description": "Monitor your learning journey with detailed analytics"
      },
      "aiPowered": {
        "title": "AI-Powered",
        "description": "Intelligent recommendations based on your study patterns"
      },
      "subjectBalance": {
        "title": "Subject Balance",
        "description": "Ensure equal focus across all your courses"
      },
      "adaptiveLearning": {
        "title": "Adaptive Learning",
        "description": "Adjusts to your pace y learning style"
      }
    },
    "servicesSection": {
      "title": "What You Can Do",
      "subtitle": "Everything you need to plan, track, y improve your study routine",
      "ctaTitle": "Ready to study with a better plan?",
      "ctaDescription": "Join U PLAN y turn your schedule into a realistic, personalized study system.",
      "startNow": "Start Now"
    },
    "services": {
      "smartTimetableGeneration": {
        "title": "Smart Timetable Generation",
        "description": "Automatically create a personalized study plan based on your input (exam dates, free hours, goals, etc.). Our intelligent algorithm considers your schedule, priorities, y learning patterns to generate an optimal timetable.",
        "features": {
          "conflictFreeScheduling": "Conflict-free scheduling",
          "priorityBasedPlanning": "Prioridad-based planning",
          "customizableStudyBlocks": "Customizable study blocks",
          "exportToCalendarApps": "Export to calendar apps"
        }
      },
      "adaptiveUpdates": {
        "title": "Adaptive Updates",
        "description": "If you skip or complete sessions, the system adjusts your timetable automatically. Life happens — our platform understands that y makes real-time adjustments to keep you on track.",
        "features": {
          "realTimeRescheduling": "Real-time rescheduling",
          "automaticDeadlineAdjustments": "Automatic deadline adjustments",
          "flexibleSessionManagement": "Flexible session management",
          "smartRecoveryPlanning": "Smart recovery planning"
        }
      },
      "progressTracking": {
        "title": "Progress Tracking",
        "description": "Track your daily y weekly study progress to stay motivated. Visualize your achievements, identify patterns, y celebrate milestones as you work towards your goals.",
        "features": {
          "dailyStudyLogs": "Daily study logs",
          "weeklyProgressReports": "Weekly progress reports",
          "achievementBadges": "Achievement badges",
          "productivityInsights": "Productivity insights"
        }
      },
      "examClassIntegration": {
        "title": "Exam & Class Integration",
        "description": "Import your exam schedule y class timetable for a conflict-free plan. Seamlessly integrate your academic calendar to ensure optimal study time distribution.",
        "features": {
          "calendarSynchronization": "Calendar synchronization",
          "examCountdownTimers": "Exam countdown timers",
          "classConflictDetection": "Class conflict detection",
          "automaticBufferTimes": "Automatic buffer times"
        }
      }
    },
    "collaborationSection": {
      "badge": "Team Team Features",
      "title": "Built for Team Collaboration",
      "subtitle": "Create study groups, manage team members, y collaborate seamlessly in shared workspaces"
    },
    "collaborationFeatures": {
      "teamCollaborationWorkspaces": {
        "title": "Team Collaboration Espacio de trabajos",
        "description": "Create dedicated workspaces for study groups, project teams, or classes. Organize members with role-based access control (Admin/Member) y manage permissions effortlessly."
      },
      "smartMemberSharing": {
        "title": "Smart Member Sharing",
        "description": "Generate secure shareable links to invite team members. Control access with open or domain-restricted settings. Pending requests feature ensures controlled workspace growth."
      },
      "integratedTeamChat": {
        "title": "Integrated Team Chat",
        "description": "Communicate with team members directly within workspaces. Real-time messaging keeps discussions organized y contextual to your collaborative planning."
      },
      "hierarchicalSubworkspaces": {
        "title": "Hierarchical Subworkspaces",
        "description": "Organize complex team structures with subworkspaces. Create parent-child workspace hierarchies for departments, projects, or study groups with inherited member permissions."
      },
      "teamProgressDashboard": {
        "title": "Team Progress Dashboard",
        "description": "Monitor individual y collective progress. Track session completion rates, upcoming deadlines, y team productivity metrics in real-time."
      },
      "workspaceCustomization": {
        "title": "Espacio de trabajo Customization",
        "description": "Upload workspace avatars, set permissions, manage sharing settings, y configure timetable editing rights. Full control over your collaborative environment."
      }
    },
    "testimonialsSection": {
      "badge": "⭐ Success Stories",
      "title": "What Students Say",
      "subtitle": "Join thousys of students who've transformed their academic journey"
    },
    "testimonials": {
      "emily": {
        "role": "Engineering Student",
        "text": "U PLAN's workspace features transformed our study group. We went from chaotic email chains to organized collaboration. My GPA improved by 0.7 points!",
        "highlight": "Best decision for group studying"
      },
      "james": {
        "role": "Computer Science Major",
        "text": "The AI-powered scheduling is incredible. It perfectly balances my workload y the team collaboration tools make group projects effortless. Highly recommended!",
        "highlight": "Game-changer for academic management"
      },
      "sophia": {
        "role": "Medical Student",
        "text": "Managing multiple study groups used to be a nightmare. With U PLAN's subworkspaces y real-time progress tracking, everything is seamless. I actually have time for social life!",
        "highlight": "Perfect for complex schedules"
      },
      "marcus": {
        "role": "Business School Student",
        "text": "The workspace chat y collaboration board features are fantastic. Our study group productivity increased by 40%. The shared timetable keeps everyone accountable.",
        "highlight": "Transformed team productivity"
      },
      "lisa": {
        "role": "Law Student",
        "text": "U PLAN helped me organize my rigorous study schedule while maintaining my study group. The team dashboard is invaluable for tracking collective progress.",
        "highlight": "Essential for group studying"
      },
      "david": {
        "role": "Economics Graduate",
        "text": "The most intelligent study planning tool I've used. Espacio de trabajo automation saved me 10+ hours per week. Passed my economics qualifying exam with flying colors!",
        "highlight": "Academically transformative"
      }
    },
    "stats": {
      "activeStudents": "Active Students",
      "hoursPlanned": "Hours Planned",
      "successRate": "Success Rate",
      "averageRating": "Average Rating"
    },
    "actions": {
      "seePlans": "Ver planes"
    },
    "errors": {
      "planLinkMissing": "El enlace de pago/contacto aún no está configurado. Añádelo en frontend/UPLAN/.env."
    },
    "phone": {
      "kicker": "Horario de estudio",
      "today": "Hoy",
      "nextFocus": "Próximo enfoque",
      "chemistryReview": "Repaso de química",
      "weekdays": {
        "mon": "L",
        "tue": "M",
        "wed": "X",
        "thu": "J",
        "fri": "V"
      },
      "sessions": {
        "math": {
          "title": "Repaso de matemáticas",
          "label": "Prioridad alta"
        },
        "physics": {
          "title": "Preparación de física",
          "label": "Entrega mañana"
        },
        "essay": {
          "title": "Borrador de ensayo",
          "label": "Bloque de escritura"
        }
      },
      "nav": {
        "plan": "Plan",
        "progress": "Progreso",
        "tasks": "Tareas"
      }
    },
    "demo": {
      "badge": "Acceso a demo premium",
      "title": "Reserva tu demo",
      "description1": "Esta demo muestra la experiencia completa de UPLAN, con un recorrido por las funciones principales, los flujos premium y las capacidades avanzadas.",
      "description2": "En lugar de una vista previa limitada, la demo enseña el valor real del producto para planificación, seguimiento del progreso, colaboración y organización académica.",
      "includedTitle": "Qué incluye",
      "includes": {
        "walkthrough": "Recorrido completo por la aplicación",
        "premium": "Experiencia premium guiada",
        "advanced": "Funciones y flujos avanzados",
        "useCases": "Casos académicos reales"
      },
      "replyTime": "Normalmente respondemos en 24 h",
      "emailLabel": "Correo electrónico",
      "contactMeta": "Sin compromiso. Respuesta rápida. Acceso directo.",
      "requestDemo": "Solicitar demo",
      "contactNote": "Puedes solicitar una demo personalizada, hacer preguntas sobre el producto o hablar directamente sobre oportunidades de colaboración."
    },
    "finalCta": {
      "title": "Start Your Academic Transformation Today",
      "description": "Join successful students from top universities who've improved their grades, balanced their workload, y achieved their academic goals with U PLAN.",
      "startFreeTrial": "Start Free Trial",
      "bookDemo": "Book a Demo",
      "footer": "No se requiere tarjeta de crédito ⬢ Gratis durante 14 días ⬢ Cancela cuando quieras"
    }
  },
  directMessages: {
    title: 'Mensajes',
    subtitle: 'Conversaciones privadas con amigos.',
    loading: {
      conversations: 'Cargando conversaciones...',
      conversation: 'Cargando conversacion...',
      profile: 'Cargando perfil...',
    },
    empty: {
      noConversations: 'Abre tu perfil, copia tu enlace de perfil y compartelo con la persona a la que quieres escribir.',
      noMessages: 'Envia el primer mensaje privado.',
      chooseConversation: 'Elige una conversacion',
      chooseConversationDescription: 'Tus amigos aceptados aparecen aqui. Usa tu enlace de perfil para conectar con alguien nuevo.',
    },
    actions: {
      profile: 'Perfil',
      profileShort: 'Perfil',
      info: 'Info',
      pin: 'Fijar',
      pinned: 'Fijado',
      saveNickname: 'Guardar apodo',
      addFriend: 'Agregar amigo',
      acceptRequest: 'Aceptar solicitud',
      accept: 'Aceptar',
      message: 'Mensaje',
      copyProfileLink: 'Copiar enlace del perfil',
      editSharedProfile: 'Editar perfil compartido',
      copyAgain: 'Copiar de nuevo',
      saveSharedProfile: 'Guardar perfil compartido',
    },
    placeholders: {
      nickname: 'Agrega un apodo para este amigo',
      message: 'Escribe a tu amigo...',
      fullName: 'Tu nombre',
      username: 'usuario',
    },
    quickReplies: {
      label: 'Respuestas rapidas',
      ok: 'OK',
      nice: 'Bien',
      done: 'Hecho',
      thanks: 'Gracias',
    },
    templates: {
      studyCheckIn: 'Podemos revisar el plan de esta semana?',
      meetup: 'Estas libre para estudiar juntos mas tarde hoy?',
      followUp: 'Un seguimiento rapido del ultimo mensaje.',
    },
    presence: {
      online: 'En linea',
      offline: 'Desconectado',
      justNow: 'Ahora mismo',
      minutesAgo: 'hace {{count}} m',
      hoursAgo: 'hace {{count}} h',
      daysAgo: 'hace {{count}} d',
    },
    defaults: {
      friend: 'Amigo',
      profileTitle: 'Planificador de estudio',
      username: 'uplan-user',
      noSessions: 'Sin sesiones completadas',
      recently: 'Hace poco',
    },
    states: {
      sending: 'Enviando',
      saving: 'Guardando...',
    },
    status: {
      self: 'Tu',
      none: 'Sin conexion',
      friends: 'Amigos',
      pendingSent: 'Solicitud enviada',
      pendingReceived: 'Solicitud recibida',
    },
    profile: {
      title: 'Perfil',
      description: 'Foto, fondo, estado de conexion y productividad de estudio.',
      joined: 'Se unio a UPLAN',
      hoursCompleted: 'Horas completadas',
      mostProductiveWeek: 'Semana mas productiva',
      mostProductiveMonth: 'Mes mas productivo',
      connection: 'Conexion',
    },
    edit: {
      title: 'Ajustes del perfil compartido con amigos',
      description: 'Estos datos aparecen cuando tus amigos abren tu perfil desde mensajes.',
      profileTitle: 'Titulo del perfil',
      backgroundTitle: 'Diseno de fondo',
      backgroundDescription: 'Elige un patron hecho a mano para la tarjeta del perfil.',
    },
    backgrounds: {
      blueprint: 'Escritorio tecnico',
      constellation: 'Notas nocturnas',
      paperplane: 'Vuelo de papel',
      rings: 'Anillos de estudio',
      lab: 'Panel de laboratorio',
    },
    friends: {
      title: 'Amigos',
      description: 'Amigos aceptados y solicitudes pendientes conectadas a esta cuenta.',
      empty: 'Aun no tienes amigos. Copia tu enlace de perfil y compartelo.',
      since: 'Amigos desde {{date}}',
      requestSent: 'Solicitud enviada',
      requestReceived: 'Solicitud recibida',
    },
    success: {
      profileLinkCopied: 'Enlace del perfil copiado.',
      friendRequestSent: 'Solicitud de amistad enviada.',
      friendRequestAccepted: 'Solicitud de amistad aceptada.',
      profileUpdated: 'Perfil compartido actualizado.',
      friendAdded: 'Amigo agregado.',
      chatHidden: 'Chat oculto de tu lista.',
    },
    errors: {
      loginRequired: 'Vuelve a iniciar sesion para continuar.',
      friendsOnly: 'Los mensajes privados solo estan disponibles con amigos aceptados.',
      loadMessages: 'No se pudieron cargar los mensajes ahora mismo.',
      loadProfile: 'No se pudo abrir este perfil ahora mismo.',
      createProfileLink: 'No se pudo crear tu enlace de perfil ahora mismo.',
      sendFriendRequest: 'No se pudo enviar la solicitud de amistad ahora mismo.',
      acceptFriendRequest: 'No se pudo aceptar la solicitud de amistad ahora mismo.',
      updateProfile: 'No se pudo guardar tu perfil compartido ahora mismo.',
      loadConversation: 'No se pudo cargar esta conversacion ahora mismo.',
      sendMessage: 'No se pudo enviar tu mensaje ahora mismo.',
      updateConversation: 'No se pudo actualizar esta conversacion ahora mismo.',
      acceptProfileLink: 'No se pudo usar este enlace de perfil ahora mismo.',
    },
  },
  postSignupQuestionnaire: {
    kicker: 'Configuracion del perfil',
    title: 'Completa tu perfil',
    description: 'Bienvenido a U PLAN. Responde unas preguntas rapidas para que tu perfil quede listo desde el inicio. Estos datos apareceran en tu perfil.',
    noteTitle: 'Visible en tu perfil',
    noteBody: 'Tu nombre completo queda fijo despues del registro. El resto lo podras actualizar mas tarde desde tu perfil o desde tu perfil compartido en Mensajes.',
    questionsBadge: 'Pregunta {{current}} de {{total}}',
    inputTitle: 'Tu respuesta',
    actions: {
      skipQuestion: 'Saltar pregunta',
      skipQuestionnaire: 'Saltar cuestionario',
      nextQuestion: 'Siguiente pregunta',
      saveAndContinue: 'Guardar y continuar',
      saving: 'Guardando...',
    },
    questions: {
      fullName: {
        label: 'Nombre completo',
        helper: 'Bienvenido. Este es el nombre completo guardado durante el registro y mostrado en tu perfil. No se puede cambiar despues.',
        placeholder: 'Tu nombre completo',
      },
      profileTitle: {
        label: 'Titulo del perfil',
        helper: 'Agrega una linea breve para que los demas entiendan quien eres al abrir tu perfil.',
        placeholder: 'Por ejemplo: Estudiante de ingenieria informatica',
      },
      role: {
        label: 'Rol',
        helper: 'Elige el rol que mejor te describa. Esto aparecera en tu perfil.',
        placeholder: 'Selecciona tu rol',
      },
      otherRoleInfo: {
        label: 'Cuentanos mas',
        helper: 'Si ninguna opcion encaja contigo, escribe la informacion del rol que quieres mostrar en tu perfil.',
        placeholder: 'Por ejemplo: Asistente de investigacion',
      },
    },
    roleOptions: {
      student: 'Estudiante',
      administrator: 'Administrador',
      teacher: 'Profesor',
      other: 'Otro',
    },
    preview: {
      kicker: 'Vista previa del perfil',
      defaultName: 'Tu nombre',
      defaultTitle: 'Tu titulo del perfil',
      defaultDepartment: 'Tu rol',
      visibilityTitle: 'Como se vera',
      visibilityBody: 'Estos datos se mostraran en tu tarjeta de perfil y en las vistas de perfil dentro de la app.',
      editLaterTitle: 'Podras editarlo despues',
      editLaterBody: 'Podras ajustar estos datos mas adelante cuando cambie tu rol o tu titulo.',
    },
    success: {
      saved: 'Los datos del perfil se guardaron correctamente.',
    },
    errors: {
      notLoggedIn: 'Debes iniciar sesion para guardar los datos del perfil.',
      otherRoleRequired: 'Ingresa la informacion del rol que quieres mostrar en tu perfil.',
      saveFailed: 'No fue posible guardar los datos del perfil en este momento.',
    },
  },
  welcomeOverlay: {
    alt: 'Bienvenida',
    close: 'Cerrar bienvenida',
    badge: 'Configuracion guiada',
    headline: 'Configura tu espacio de estudio en menos de un minuto.',
    step: 'Paso',
    body: 'Te guiaremos por lo esencial con un recorrido rapido para que puedas generar un horario de estudio claro en pocos minutos.',
    cards: {
      profile: 'Perfil listo',
      schedule: 'Horario configurado',
      progress: 'Seguimiento del progreso',
    },
  },
  tourOverlay: {
    title: 'Introduccion',
    note: 'El area resaltada es la accion que debes revisar antes de continuar.',
    success: 'Recorrido completado. Ya puedes usar U PLAN.',
    actions: {
      close: 'Cerrar recorrido',
      skip: 'Saltar',
      done: 'Finalizar',
    },
    pages: {
      dashboard: 'Panel',
      settings: 'Ajustes',
      autoGenerate: 'Generacion automatica',
      myTimetable: 'Mi horario',
      goals: 'Objetivos',
      workspace: 'Espacio de trabajo',
      default: 'U PLAN',
    },
    steps: {
      profile: {
        title: 'Tu perfil y ajustes',
        body: 'Abre el menu de tu nombre y avatar para acceder a los ajustes del perfil y mantener actualizada la informacion de tu cuenta.',
      },
      settings: {
        title: 'Edita tu perfil',
        body: 'Abre **Ajustes** desde la barra lateral y usa **Editar perfil** para actualizar tu nombre, tus datos profesionales, tu foto y la informacion de la cuenta.',
      },
      studyWindow: {
        title: 'Ventana de estudio',
        body: 'Define las horas en las que puedes estudiar para que el horario generado se adapte a tu rutina real y a los periodos de examenes.',
      },
      classSchedule: {
        title: 'Horario de clases y prioridad',
        body: 'Agrega tus clases y asigna prioridades para que las materias importantes reciban una mejor cobertura de estudio.',
      },
      busyTime: {
        title: 'Tiempo ocupado',
        body: 'Bloquea trabajo, recados y compromisos personales para que el generador no coloque sesiones de estudio encima.',
      },
      generate: {
        title: 'Genera tu plan',
        body: 'Generar crea tus sesiones de estudio de la semana usando las reglas y preferencias que definiste.',
      },
      timetable: {
        title: 'Mi horario',
        body: 'Este es tu plan semanal de estudio. Puedes mover sesiones, ajustar bloques de tiempo y mantener la semana alineada con tu rutina.',
      },
      today: {
        title: 'Sesiones de hoy',
        body: 'La vista diaria te mantiene enfocado. Inicia la sesion actual y gestiona lo que sigue sin perder el ritmo.',
      },
      assessments: {
        title: 'Evaluaciones y fechas limite',
        body: 'Gestiona examenes, pruebas y tareas aqui para que las fechas limite influyan en tu plan durante las semanas mas exigentes.',
      },
      goalsWeek: {
        title: 'Esta semana',
        body: 'Revisa cuantas sesiones hay programadas esta semana segun tu horario.',
      },
      deadlines: {
        title: 'Proximas fechas limite',
        body: 'Usa esta seccion para revisar lo que vence pronto y adelantarte a la siguiente entrega o examen importante.',
      },
      progress: {
        title: 'Progreso y racha',
        body: 'Sigue las horas completadas y tu racha para que el avance siga visible con el tiempo.',
      },
      todaySession: {
        title: 'Sesion de hoy',
        body: 'Consulta las sesiones de hoy y amplialas cuando necesites mas detalle o acciones rapidas.',
      },
      weeklyGoals: {
        title: 'Objetivos semanales y completados',
        body: 'Define objetivos semanales, protege tu racha y supervisa las fechas completadas a medida que avanzas.',
      },
      workspace: {
        title: 'Cabecera del espacio de trabajo',
        body: 'Esta cabecera muestra tu espacio activo, los miembros y las acciones rapidas. Cambia de espacio aqui y usa las pestanas inferiores para navegar dentro del espacio.',
      },
    },
  },
  app: {
    toasts: {
      signedInWithGoogle: "Sesion iniciada con Google",
      freePlanSelected: "Plan gratuito seleccionado",
      paymentLinkMissing: "El enlace de pago aun no esta configurado. Agregalo en frontend/UPLAN/.env.",
      noAdminAccess: "No tienes acceso al panel de administracion."
    },
    welcome: {
      title: "Bienvenido a U PLAN",
      body: "Listo para convertir el estres escolar en un plan claro?\n\nEn los proximos 60 segundos te mostraremos donde:\n- actualizar tu perfil\n- generar un horario limpio\n- seguir las sesiones de hoy\n\nToca Siguiente para iniciar el recorrido."
    }
  }
};

export default es;
