const it = {
  common: {
    start: 'Avvia',
    pause: 'Pausa',
    reset: 'Reimposta',
    close: 'Chiudi',
    home: 'Home',
    timetable: 'Orario',
    workspace: 'Spazio di lavoro',
    saved: 'Salvato',
    settings: 'Impostazioni',
    admin: 'Admin',
    logout: 'Disconnetti',
    active: 'Attivo',
    open: 'Apri',
    new: 'Nuovo',
    you: 'Tu',
    back: 'Indietro',
    save: 'Salva',
    add: 'Aggiungi',
    done: 'Fatto',
    cancel: 'Annulla',
    delete: 'Elimina',
    exit: 'Esci',
    expand: 'Espandi',
    minimize: 'Riduci',
    total: 'Totale',
    today: 'Oggi',
    pin: 'Fissa',
    next: 'Avanti',
    skip: 'Salta',
  },

  autoGenerate: {
    title: "Generazione automatica dell'orario",
    subtitle: 'Configura il tuo piano e genera sessioni di studio ottimizzate.',
    studyWindow: {
      title: 'Fascia oraria di studio',
      description: 'Definisci quando sei disponibile a studiare e modificala in qualsiasi momento.',
      weekdayStart: 'Inizio nei giorni feriali',
      weekdayEnd: 'Fine nei giorni feriali',
      breakMinutes: 'Pausa tra le sessioni di studio (minuti)',
      breakHelp:
        'Lasceremo questo intervallo tra le sessioni generate consecutive così potrai riposarti.',
      includeWeekends: 'Includi i weekend',
      includeWeekendsHelp:
        'Se attivato, riempiremo anche il tempo libero di sabato e domenica.',
      sameWeekend: 'Usa la stessa fascia oraria nel weekend',
      sameWeekendHelp:
        'Gli orari del weekend saranno identici a quelli dei giorni feriali.',
      weekendStart: 'Inizio weekend',
      weekendEnd: 'Fine weekend',
    },
    classSchedule: {
      title: 'Orario delle lezioni e priorità dei corsi',
      description:
        "Aggiungi il tuo orario attuale e imposta la priorità di ogni corso. Il generatore lo usa insieme agli intervalli occupati per trovare i tuoi spazi liberi.",
      fillButton: "Compila l'orario attuale",
      uploadButton: 'Importa',
      emptyTitle: 'Nessun orario salvato',
      emptyDescription: 'Usa "Compila l\'orario attuale" o "Importa" per aggiungere i tuoi corsi.',
      addAnotherSlot: 'Aggiungi un altro intervallo per questo corso',
      courseName: 'Nome del corso',
      priority: 'Priorità',
      start: 'Inizio',
      end: 'Fine',
      days: 'Giorni',
      addCourseRow: 'Aggiungi riga corso',
      addCourseRowHelp:
        'Lo stesso corso può comparire più volte con giorni o orari diversi.',
    },
    busyTime: {
      title: 'Fasce occupate',
      description:
        'Aggiungi altri blocchi occupati come lavoro, spostamenti o commissioni. La generazione automatica non pianificherà mai sessioni di studio in quei momenti.',
      treatExisting: 'Tratta le sessioni esistenti come occupate',
      treatExistingHelp:
        'Usa le sessioni della settimana corrente come ulteriori intervalli occupati ({{count}} sessione/i trovata/e).',
      replaceExisting: 'Sostituisci le sessioni di studio esistenti',
      replaceExistingHelp:
        'Se attivato, le sessioni generate in precedenza verranno rimosse prima di aggiungerne di nuove.',
      addBusy: 'Aggiungi fascia occupata',
      titleLabel: 'Titolo',
      day: 'Giorno',
      start: 'Inizio',
      end: 'Fine',
    },
    upload: {
      title: 'Importa un orario',
      description:
        "Importa un file CSV o un'immagine del tuo orario. Dopo l'importazione, imposta le priorità e clicca su Salva.",
      selectFile: 'Seleziona un file da importare',
      buttonHint: 'Supporta immagini e file CSV',
    },
    priority: {
      high: 'ALTA',
      medium: 'MEDIA',
      low: 'BASSA',
    },
    busyDefaultTitle: 'Fascia occupata',
    generate: 'Genera',
    generating: 'Generazione in corso…',
    success: {
      busySavedWorkspace: 'Fasce occupate salvate nello spazio di lavoro',
      classSavedWorkspace: 'Orario salvato nello spazio di lavoro',
      classSaved: 'Orario salvato',
      importedRows:
        "{{count}} riga/e di orario importata/e. Ora imposta le priorità e clicca su Salva.",
      generatedSessions: '{{count}} sessioni di studio generate{{seed}}.',
    },
    errors: {
      saveBusy: 'Salvataggio delle fasce occupate non riuscito',
      addCourseFirst: "Aggiungi almeno un corso al tuo orario",
      saveClass: "Salvataggio dell'orario non riuscito",
      uploadCsvOrImage: 'Importa un file CSV o un’immagine',
      uploadFailed: "Importazione non riuscita",
      uploadFailedGeneric: "Importazione non riuscita",
      noClassesDetected: 'Nessun corso rilevato nel file importato',
      invalidImportFormat: 'Il file importato non corrisponde al formato previsto',
      courseNameRequired: 'Il nome del corso è obbligatorio',
      selectAtLeastOneDay: 'Seleziona almeno un giorno',
      missingApiBase: 'Manca VITE_API_BASE_URL. Configura il tuo ambiente frontend.',
      notLoggedIn: 'Non hai effettuato l’accesso',
      fillOrUploadFirst: "Compila o importa prima il tuo orario",
      generateFailed: 'Generazione automatica non riuscita',
      noFreeTime: 'Nessuno spazio libero disponibile per la fascia oraria selezionata',
    },
  },

  auth: {
    brand: {
      name: 'PLAN',
      subtitle: 'Pianificazione accademica',
      logoAlt: 'Logo U PLAN',
    },
    hero: {
      imageAlt: 'Studente che studia',
      badge: 'Pianifica in modo più intelligente. Studia con chiarezza.',
      titleLine1: 'Gestisci al meglio il tuo',
      titleLine2: 'orario',
      description:
        'Pianificazione degli orari basata sull’IA che si adatta a lezioni, esami, scadenze e obiettivi in uno spazio di lavoro pulito.',
      footer:
        'Progettato per aiutare gli studenti a restare organizzati, concentrati e sicuri.',
      cards: {
        smartPlanning: {
          title: 'Pianificazione intelligente',
          description: 'Organizza le sessioni attorno alle vere priorità',
        },
        flexibleFlow: {
          title: 'Flusso flessibile',
          description: 'Adatta il tempo di studio nel corso della settimana',
        },
        studentFirst: {
          title: 'Prima lo studente',
          description: 'Progettato per chiarezza, concentrazione e costanza',
        },
      },
    },
    titles: {
      welcomeBack: 'Bentornato',
      verifyAccount: 'Verifica il tuo account',
      createNewPassword: 'Crea una nuova password',
      resetPassword: 'Reimposta la tua password',
      createAccount: 'Crea il tuo account',
      continueWithProvider: 'Continua con {{provider}}',
      completeProviderLogin: 'Completa l’accesso con {{provider}}',
      enterVerificationCode: 'Inserisci il codice di verifica',
      welcomeBackCard: 'Bentornato',
      createAccountCard: 'Crea un account',
      verifyYourEmail: 'Verifica la tua email',
    },
    descriptions: {
      completeSignIn: 'Completa i tuoi dati di accesso per continuare.',
      enterCodeSent: 'Inserisci il codice inviato al tuo indirizzo email.',
      chooseStrongPassword: 'Scegli una password sicura per proteggere il tuo account.',
      sendVerificationToEmail: 'Invieremo un codice di verifica al tuo indirizzo email.',
      joinAndOrganize: 'Unisciti a noi e inizia a organizzare il tuo orario.',
      accessPlanner: 'Accedi al tuo pianificatore e riprendi da dove avevi lasciato.',
      completeProviderLogin: 'Inserisci email e nome per completare l’accesso.',
      resetCodeSentTo: 'Abbiamo inviato un codice di verifica a 6 cifre a {{email}}',
      enterNewPasswordFor: 'Inserisci la tua nuova password per {{email}}',
      resetPasswordHelp:
        'Inserisci il tuo indirizzo email e ti invieremo un codice di verifica',
      loginCard: 'Inserisci le tue credenziali per accedere al tuo orario',
      signupCard: 'Inizia a organizzare il tuo orario oggi stesso',
      signupCodeSentTo: 'Inserisci il codice a 6 cifre inviato a {{email}}',
    },
    labels: {
      email: 'Indirizzo email',
      fullName: 'Nome completo',
      verificationCode: 'Codice di verifica',
      newPassword: 'Nuova password',
      confirmNewPassword: 'Conferma nuova password',
      emailOrUsername: 'Email o nome utente',
      password: 'Password',
      username: 'Nome utente',
      confirmPassword: 'Conferma password',
      dateOfBirth: 'Data di nascita',
      gender: 'Genere',
    },
    placeholders: {
      socialEmail: 'tua.email@gmail.com',
      fullName: 'Mario Rossi',
      verificationCode: '000000',
      newPassword: 'Inserisci la tua nuova password',
      confirmNewPassword: 'Conferma la tua nuova password',
      email: 'nome@esempio.com',
      emailOrUsername: 'nome@esempio.com o nome utente',
      password: 'Inserisci la tua password',
      username: 'mariorossi123',
      createPassword: 'Crea una password',
      confirmPassword: 'Conferma la password',
      selectGender: 'Seleziona il tuo genere',
    },
    actions: {
      backToHome: 'Torna alla home',
      completeLogin: 'Completa accesso',
      backToLogin: 'Torna al login',
      verifyCode: 'Verifica codice',
      resendCode: 'Invia di nuovo il codice',
      resetPassword: 'Reimposta password',
      sendVerificationCode: 'Invia codice di verifica',
      loginTab: 'Accesso',
      signupTab: 'Registrazione',
      forgotPassword: 'Password dimenticata?',
      rememberMe: 'Ricordami',
      signIn: 'Accedi',
      orContinueWith: 'Oppure continua con',
      continueWithGoogle: 'Continua con Google',
      signUp: 'Registrati',
      sendingCode: 'Invio del codice…',
      verifyEmail: 'Verifica email',
      creatingAccount: 'Creazione account…',
      needHelp: 'Hai bisogno di aiuto?',
    },
    requirements: {
      username: {
        length: 'Tra 3 e 20 caratteri',
        format: 'Solo lettere, numeri, underscore e punti',
        noSpaces: 'Nessuno spazio consentito',
        notReserved: 'Nome utente non riservato',
      },
      password: {
        minLength: 'Almeno 8 caratteri',
        upper: 'Una lettera maiuscola (A-Z)',
        lower: 'Una lettera minuscola (a-z)',
        number: 'Un numero (0-9)',
        special: 'Un carattere speciale (!@#$%^&*)',
      },
    },
    genderOptions: {
      male: 'Maschio',
      female: 'Femmina',
      other: 'Altro',
      preferNotToSay: 'Preferisco non rispondere',
    },
    helper: {
      didntReceiveCode: 'Non hai ricevuto il codice?',
      passwordMustContain: 'La password deve contenere:',
      usernameRequirements: 'Requisiti del nome utente:',
      agreeTermsBefore: 'Accetto i',
      termsOfService: 'Termini di servizio',
      privacyPolicy: 'Informativa sulla privacy',
      and: 'e',
      byContinuing: 'Continuando, accetti i nostri',
    },
    help: {
      title: 'Hai bisogno di aiuto?',
      creatingAccountTitle: 'Creare un account',
      issuesTitle: 'Problemi?',
      issuesDescription:
        "Se hai difficoltà a registrarti o ad accedere, controlla la tua connessione internet e assicurati che tutti i campi obbligatori siano compilati correttamente.",
      points: {
        username: 'Scegli un nome utente unico (da 3 a 20 caratteri)',
        email: 'Usa un indirizzo email valido',
        password:
          'Crea una password sicura con maiuscole, minuscole, numeri e caratteri speciali',
        age: 'Devi avere almeno 13 anni per registrarti',
      },
    },
    errors: {
      passwordMismatch: 'Le password non corrispondono!',
      dateOfBirthRequired: 'La data di nascita è obbligatoria',
      ageRestriction: 'Devi avere almeno 13 anni per creare un account',
      signupFailed: 'Registrazione non riuscita',
      acceptInviteFailed: "Accettazione dell'invito non riuscita",
      inviteInvalid: "Il link d'invito non è valido o è scaduto",
      loginFailed: 'Nome utente, email o password non corretti',
      loginUnexpected: "Si è verificato un errore durante l'accesso",
      invalidSignupCode: 'Codice di verifica registrazione non valido',
      verifySignupCodeFailed:
        'Verifica del codice di registrazione non riuscita',
      usernameLength: 'Il nome utente deve contenere tra 3 e 20 caratteri!',
      usernameFormat:
        'Il nome utente può contenere solo lettere, numeri, underscore e punti!',
      usernameNoSpaces: 'Il nome utente non può contenere spazi!',
      usernameReserved:
        'Questo nome utente è riservato. Scegline un altro!',
      emailRequired: "L'indirizzo email è obbligatorio",
      genderRequired: 'Seleziona il tuo genere',
      passwordLength: 'La password deve contenere almeno 8 caratteri!',
      passwordUpper:
        'La password deve contenere almeno una lettera maiuscola!',
      passwordLower:
        'La password deve contenere almeno una lettera minuscola!',
      passwordNumber: 'La password deve contenere almeno un numero!',
      passwordSpecial:
        'La password deve contenere almeno un carattere speciale!',
      sendSignupCodeFailed:
        'Questa email o questo nome utente è già registrato, provane altri',
      emailNotFound: 'Nessun account trovato con questa email.',
      requestResetFailed:
        'Richiesta del codice di reimpostazione non riuscita.',
      invalidResetCode: 'Codice di verifica non valido. Riprova.',
      verifyCodeFailed: 'Si è verificato un errore durante la verifica.',
      resetPasswordFailed: 'Reimpostazione della password non riuscita',
      resetPasswordUnexpected:
        'Si è verificato un errore durante la reimpostazione della password',
      fillRequired: 'Compila tutte le informazioni richieste.',
      resendCodeFailed: 'Reinvio del codice di verifica non riuscito',
      resendSignupCodeFailed:
        'Reinvio del codice di registrazione non riuscito',
      somethingWentWrong: 'Si è verificato un errore',
    },
    success: {
      accountCreated: 'Account creato con successo! Benvenuto, {{name}}!',
      welcomeBack: 'Bentornato!',
      welcomeBackName: 'Bentornato, {{name}}!',
      emailVerified: 'Indirizzo email verificato con successo.',
      signupCodeSent: 'Codice di verifica inviato a {{email}}',
      resetCodeSent: 'Codice di verifica inviato a {{email}}.',
      verificationSuccess: 'Verifica riuscita!',
      passwordReset:
        'Password reimpostata con successo! Accesso in corso…',
      passwordsMatch: 'Le password corrispondono',
      ageVerified: 'Età verificata (13 anni o più)',
      genderSelected: 'Genere selezionato',
      emailVerifiedInline: 'Email verificata',
      newVerificationCodeSent: 'Nuovo codice di verifica inviato!',
      newSignupVerificationCodeSent:
        'Nuovo codice di verifica per la registrazione inviato!',
    },
  },

  errorBoundary: {
    title: "Si è verificato un errore",
    description:
      "L'applicazione si è bloccata durante il rendering di questa pagina. Aggiorna per recuperare.",
    actions: {
      reload: 'Ricarica',
      continue: 'Prova a continuare',
    },
  },

  examTracker: {
    title: 'Monitoraggio esami',
    subtitle: 'Tieni traccia dei tuoi prossimi esami e preparati di conseguenza',
    actions: {
      add: 'Aggiungi esame',
    },
    dialog: {
      title: 'Aggiungi un nuovo esame',
      description:
        'Pianifica un nuovo esame o una sessione di test nel tuo orario.',
    },
    fields: {
      subject: 'Materia',
      date: 'Data',
      time: 'Ora',
      location: 'Luogo',
      priority: 'Priorità',
      notes: 'Note',
    },
    placeholders: {
      subject: 'es.: Matematica',
      location: 'es.: Aula 301',
      notes: 'Note aggiuntive…',
    },
    priority: {
      high: 'Alta',
      medium: 'Media',
      low: 'Bassa',
    },
    upcoming: 'Prossimi esami',
    empty: {
      title: 'Nessun esame pianificato',
      subtitle: 'Aggiungi le date dei tuoi esami per iniziare il monitoraggio',
    },
    today: 'Oggi!',
    tomorrow: 'Domani!',
    daysAway: 'Tra {{count}} giorni',
    success: {
      added: 'Esame aggiunto con successo!',
      deleted: 'Esame eliminato',
    },
    errors: {
      required: 'Inserisci la materia e la data',
    },
  },

  goals: {
    title: 'Obiettivi e risultati',
    subtitle:
      'Tieni traccia dei tuoi obiettivi settimanali, della continuità e dei prossimi passi.',
    actions: {
      back: 'Indietro',
      setGoals: 'Imposta obiettivi',
      logSession: 'Registra sessione',
      collapse: 'Comprimi',
      expand: 'Espandi',
      markCompleted: 'Segna come completato',
      skip: 'Salta',
    },
    common: {
      subject: 'Materia',
      study: 'Studio',
      missed: 'persa',
    },
    success: {
      achievementUnlocked: 'Risultato sbloccato',
      sessionLogged: 'Sessione registrata',
      sessionSkipped: 'Sessione saltata',
      goalSaved: 'Obiettivo salvato',
    },
    errors: {
      updateSession: 'Impossibile aggiornare la sessione',
      validTarget: 'Inserisci un numero valido di ore obiettivo',
      summaryNotLoaded: 'Il riepilogo non è ancora caricato',
      exceedsAvailability:
        "L'obiettivo supera la disponibilità settimanale",
      exceedsAvailabilityDesc:
        'Hai solo {{hours}}h disponibili questa settimana in base al tuo orario.',
      subjectExceedsWeekly:
        "L'obiettivo per materia supera l'obiettivo settimanale",
      subjectExceedsWeeklyDesc:
        'Il tuo obiettivo settimanale complessivo è di {{hours}}h. Gli obiettivi per materia devono rientrare in questo totale.',
      subjectGoalsExceedWeekly:
        'Gli obiettivi per materia superano l’obiettivo settimanale',
      subjectGoalsExceedWeeklyDesc:
        'I tuoi altri obiettivi per materia totalizzano {{otherHours}}h. Aggiungendo questo, supereresti il tuo obiettivo settimanale di {{weeklyHours}}h.',
      weeklyTooLow: "L'obiettivo settimanale è troppo basso",
      weeklyTooLowDesc:
        'I tuoi obiettivi per materia totalizzano già {{hours}}h. Aumenta il tuo obiettivo settimanale o riduci quelli per materia.',
      saveGoal: "Impossibile salvare l'obiettivo",
      selectSession: 'Seleziona una sessione',
      todayOnly: 'Puoi registrare solo le sessioni perse di oggi.',
      sessionNotFound: 'Sessione non trovata',
      onlyMissed:
        'Solo le sessioni perse possono essere segnate manualmente come completate (nello stesso giorno).',
      skippedCannotComplete:
        'Le sessioni saltate non possono essere segnate come completate.',
    },
    thisWeek: {
      title: 'Questa settimana',
      description: 'Ciò che è pianificato (dal Mio orario)',
      sessions: 'sessioni',
      hours: '~{{hours}} ore',
      tipPrefix: 'Suggerimento: se sembra vuoto, apri',
      tipHighlight: 'Mio orario',
      tipSuffix: 'una volta per caricare la settimana corrente.',
    },
    deadlines: {
      title: 'Prossime scadenze',
      description: 'Dalle valutazioni',
      empty: 'Nessuna scadenza imminente',
      due: 'Scadenza {{date}}',
      manage: 'Gestisci scadenze',
    },
    progress: {
      title: 'Progresso e serie',
      description: 'Dalle tue sessioni completate',
      completed: 'completate',
      target: 'obiettivo',
      streak: 'Serie di {{count}} giorni',
      tip:
        'Suggerimento: usa "Registra sessione" qui sotto per iniziare a sbloccare risultati.',
    },
    goalDialog: {
      title: 'Imposta gli obiettivi della settimana',
      description: 'Obiettivi settimanali.',
      weeklyTarget: 'Ore obiettivo a settimana',
      weeklyPlaceholder: 'es.: 8',
      saveWeekly: 'Salva obiettivo settimanale',
      subjectGoal: 'Obiettivo per materia (facoltativo)',
      selectSubject: 'Seleziona una materia',
      subjectPlaceholder: 'es.: 3',
      saveSubject: 'Salva obiettivo per materia',
      currentGoals: 'Obiettivi attuali',
      overall: 'Generale',
    },
    logDialog: {
      title: 'Registra una sessione di studio completata',
      description: 'Questo aggiorna la tua serie e le ore completate.',
      date: 'Data',
      hint:
        'Puoi registrare solo le sessioni presenti nel tuo "Mio orario" per quel giorno. Le sessioni non registrate diventano perse dopo mezzanotte.',
      sessions: "Sessioni dell'orario",
      selectMissed: 'Seleziona una sessione persa',
      noMissed: 'Nessuna sessione persa per questo giorno',
      onlyMissedHint:
        'Qui vengono mostrate solo le sessioni perse del giorno (dal tuo "Mio orario").',
      logSelected: 'Registra la sessione selezionata',
    },
    hints: {
      openTimetableFirst:
        'Suggerimento: apri "Mio orario" una volta per caricare questa settimana, poi torna qui.',
    },
    todayPanel: {
      description:
        'Fasce tracciate dal tuo orario. Le sessioni saltate non possono essere segnate come completate.',
      weekTotals:
        'Totali della settimana: {{completed}} completate • {{skipped}} saltate • {{missed}} perse • {{planned}} pianificate',
      hidden: 'Nascosto. Clicca su "Espandi" per vedere e gestire le sessioni di oggi.',
      empty: 'Nessuna sessione trovata per oggi nel tuo orario.',
      status: 'Stato',
    },
  },

  googleCalendar: {
    success: {
      connected: 'Connessione a Google Calendar riuscita!',
      disconnected: 'Disconnesso da Google Calendar',
      exported:
        'Orario esportato su Google Calendar con successo! Controlla il tuo calendario.',
    },
    errors: {
      connect: 'Connessione a Google Calendar non riuscita. Riprova.',
      connectFirst: 'Collegati prima a Google Calendar',
      export: "Esportazione su Google Calendar non riuscita",
    },
    info: {
      exporting: 'Esportazione su Google Calendar in corso…',
    },
    confirm: {
      disconnect:
        'Sei sicuro di voler disconnetterti da Google Calendar? I tuoi eventi esistenti non saranno modificati.',
    },
  },

  help: {
    button: 'Aiuto',
    title: 'Come usare Smart Study',
    description: 'Scopri come creare e gestire efficacemente i tuoi orari',
    walkthrough: 'Suggerimenti / Tutorial',
    quickStart: {
      title: 'Avvio rapido',
      description:
        'Inizia in 3 semplici passaggi: Aggiungi le materie → Configura le ore di studio → Genera il tuo orario personalizzato!',
    },
    priority: {
      high: 'Priorità alta',
      highDesc: 'Materie critiche che richiedono attenzione costante',
      medium: 'Priorità media',
      mediumDesc: 'Materie del programma corrente',
      low: 'Priorità bassa',
      lowDesc: 'Letture extra o opzionali',
    },
    sections: {
      create: {
        title: 'Crea il tuo primo orario',
        step1Title: 'Passaggio 1: Aggiungi materie',
        step1Desc:
          'Vai su "Crea un orario" e aggiungi tutte le tue materie. Scegli i livelli di priorità:',
        step2Title: 'Passaggio 2: Seleziona i giorni di studio',
        step2Desc:
          'Scegli i giorni in cui vuoi studiare. Il pianificatore intelligente distribuirà le materie in modo ottimale nei giorni selezionati.',
        step3Title: 'Passaggio 3: Configura le preferenze orarie',
        step3Desc:
          'Imposta le ore di studio giornaliere, le fasce preferite e gli intervalli di pausa. Consigliamo la tecnica Pomodoro (sessioni da 25 minuti con pause da 5 minuti).',
        step4Title: 'Passaggio 4: Genera l’orario',
        step4Desc:
          'Clicca su "Genera l\'orario" per creare il tuo piano personalizzato!',
      },
      timetable: {
        title: 'Usare Mio orario (vista calendario)',
        addingTitle: 'Aggiungere sessioni manualmente',
        adding1:
          'Clicca su qualsiasi fascia nel calendario per aggiungere una sessione',
        adding2: 'Clicca sul pulsante blu "+" in basso a destra',
        adding3:
          'Inserisci materia, orario e tipo di sessione (Lettura, Ripasso, Esercizio, ecc.)',
        editingTitle: 'Modificare le sessioni',
        editingDesc:
          'Clicca su una scheda sessione esistente per modificare i dettagli o eliminarla.',
        navigationTitle: 'Controlli di navigazione',
        todayButton: 'Pulsante Oggi',
        todayDesc: 'Torna alla settimana corrente',
        arrowButtons: 'Pulsanti freccia',
        arrowDesc: 'Naviga tra le settimane',
        dayWeekView: 'Vista giorno/settimana',
        dayWeekDesc:
          'Passa dalla vista settimanale alla vista giornaliera dettagliata',
        savingTitle: 'Salvare il tuo lavoro',
        saveTimetable: "Salva l'orario",
        saveTimetableDesc:
          'Salva il tuo orario nella sezione "Orari salvati"',
        exportPdf: 'Esporta PDF',
        exportPdfDesc: 'Scarica il tuo orario come file PDF',
        saveDropdown:
          'Clicca sul menu a tendina del pulsante "Salva" per accedere a entrambe le opzioni',
      },
      smart: {
        title: 'Regole di pianificazione intelligente',
        intro:
          'Il nostro sistema di pianificazione intelligente segue questi principi di studio comprovati:',
        highTitle: 'Priorità alta (50% del tempo totale):',
        highDesc:
          'Le materie più critiche ricevono la maggiore allocazione di tempo per garantire la padronanza dei contenuti difficili.',
        mediumTitle: 'Priorità media (30% del tempo totale):',
        mediumDesc:
          'Le materie del programma corrente ricevono una quota di tempo moderata per un progresso costante.',
        lowTitle: 'Priorità bassa (20% del tempo totale):',
        lowDesc:
          'Le letture extra e le materie opzionali ricevono il tempo adeguato senza sovraccaricare il piano.',
        optimalTitle: 'Pianificazione ottimale:',
        optimalDesc:
          'Le materie prioritarie vengono pianificate all’inizio della giornata, quando la concentrazione è massima, per massimizzare l’efficacia dello studio.',
      },
      tips: {
        title: 'Suggerimenti e buone pratiche',
        pomodoroTitle: 'Tecnica Pomodoro',
        pomodoroDesc:
          'Studia in sessioni concentrate da 25 minuti con pause da 5 minuti. Dopo 4 sessioni, fai una pausa più lunga da 15 a 30 minuti.',
        activeTitle: 'Apprendimento attivo',
        activeDesc:
          'Alterna diversi tipi di sessioni: Lettura → Esercizio → Ripasso per una migliore comprensione e memorizzazione.',
        peakTitle: 'Orari di massima resa',
        peakDesc:
          'Pianifica le materie prioritarie durante le ore di massima concentrazione (di solito al mattino per la maggior parte delle persone).',
        consistencyTitle: 'La costanza è fondamentale',
        consistencyDesc:
          'Segui il tuo orario! Abitudini di studio regolari sono più efficaci del ripasso dell’ultimo minuto.',
      },
      types: {
        title: 'Comprendere i tipi di sessione',
        reading: 'Lettura',
        readingDesc: 'Apprendimento di nuovi contenuti, lettura di manuali',
        revision: 'Ripasso',
        revisionDesc: 'Revisione di contenuti già studiati',
        practice: 'Esercizio',
        practiceDesc: 'Risoluzione di problemi, esercizi, test pratici',
        lecture: 'Lezione',
        lectureDesc: 'Partecipare a lezioni o guardare conferenze',
        assignment: 'Compito',
        assignmentDesc: 'Lavorare a progetti e compiti',
        break: 'Pausa',
        breakDesc: 'Periodi di riposo per ricaricarsi',
      },
    },
    footer:
      "Hai ancora domande? Esplora l'app per scoprire altre funzionalità!",
  },

  joinWorkspace: {
    title: 'Unisciti a uno spazio di lavoro',
    loading: 'Verifica del link…',
    loginWarning:
      '⚠️ Devi aver effettuato l’accesso per inviare una richiesta di adesione.',
    states: {
      verifying: "Verifica del link d'invito…",
      invalid: "Link d'invito non valido o scaduto",
      sent: 'La tua richiesta è stata inviata',
      requestToJoin: 'Richiedi di unirti a "{{name}}"',
    },
    message: {
      label: 'Messaggio',
      placeholder:
        "Spiega all'amministratore perché desideri unirti…",
    },
    actions: {
      send: 'Invia richiesta',
      sending: 'Invio in corso…',
    },
    success: {
      alreadyMember: 'Sei già membro di questo spazio di lavoro!',
      requestSent:
        "Richiesta inviata! L'amministratore la esaminerà a breve.",
      title: 'Richiesta inviata!',
      description:
        "L'amministratore dello spazio di lavoro esaminerà la tua richiesta e verrai aggiunto una volta approvata.",
    },
    errors: {
      invalidLink: "Link d'invito non valido",
      expiredLink: "Link d'invito non valido o scaduto",
      loginRequired:
        'Devi aver effettuato l’accesso per richiedere di unirti a uno spazio di lavoro',
      requestFailed: 'Richiesta non riuscita',
      sendFailed: 'Invio della richiesta non riuscito',
    },
  },

  notebook: {
    untitled: 'Senza titolo',
    updated: 'Aggiornato',
    time: {
      justNow: 'Proprio adesso',
      minutesAgo: '{{count}} min fa',
      hoursAgo: '{{count}} h fa',
      daysAgo: '{{count}} g fa',
    },
    toasts: {
      noteCreated: 'Nota creata',
      saved: 'Salvato',
      deleted: 'Eliminato',
    },
    errors: {
      loadNotes: 'Caricamento delle note non riuscito',
      createNote: 'Creazione della nota non riuscita',
      saveNote: 'Salvataggio della nota non riuscito',
      deleteNote: 'Eliminazione della nota non riuscita',
    },
    confirm: {
      delete: 'Eliminare questa nota? Questa azione è irreversibile.',
    },
    mobile: {
      notes: 'Note',
      title: 'Blocco note',
      yourNotes: 'Le tue note',
    },
    sidebar: {
      myNotes: 'Le mie note',
      noteCount: '{{count}} nota',
      noteCount_other: '{{count}} note',
    },
    filters: {
      all: 'Tutte',
      pinned: 'Fissate',
      archived: 'Archiviate',
    },
    tags: {
      title: 'Tag',
    },
    empty: {
      noNotes: 'Nessuna nota. Clicca su',
      createOne: 'per crearne una.',
      noContent: 'Nessun contenuto',
      noNoteSelected: 'Nessuna nota selezionata',
      getStarted:
        'Apri il menu note o crea una nuova nota per iniziare.',
    },
    actions: {
      add: 'Aggiungi',
      new: 'Nuovo',
      addNote: 'Aggiungi nota',
      save: 'Salva',
      delete: 'Elimina',
      createNote: 'Crea nota',
    },
    placeholders: {
      search: '     Cerca nelle note…',
      untitled: 'Nota senza titolo',
      tags: 'scuola, esame, attività',
      startWriting: 'Inizia a scrivere…',
    },
    editor: {
      autoSave: 'Salvataggio automatico',
      saving: 'Salvataggio in corso…',
      unsavedChanges: 'Modifiche non salvate',
      pinned: 'Fissata',
      archived: 'Archiviata',
    },
    unsaved: {
      title: 'Modifiche non salvate',
      description:
        'Hai modifiche non salvate. Sei sicuro di voler uscire da questa nota?',
      stay: 'Resta qui',
      saveAndContinue: 'Salva e continua',
      leaveWithoutSaving: 'Esci senza salvare',
    },
  },

  notifications: {
    title: 'Notifiche',
    markRead: 'Segna come letto',
    empty: 'Nessuna notifica',
    new: 'Nuovo',
    clear: 'Cancella',
    studyReminder: 'Promemoria sessione di studio',
    studyReminderBody: '{{subject}} inizia tra {{minutes}} minuti',
    studyStarted: 'Sessione di studio iniziata',
    studyStartedBody: '{{subject}} inizia ora',
  },

  privacyPolicy: {
    back: 'Indietro',
    title: 'Informativa sulla privacy',
    lastUpdated: 'Ultimo aggiornamento: 24 ottobre 2025',
    sections: {
      introduction: {
        title: '1. Introduzione',
        content:
          'Benvenuto su U PLAN ("noi", "nostro" o "nostri"). Ci impegniamo a proteggere la tua privacy e a garantire la sicurezza delle tue informazioni personali. Questa informativa sulla privacy spiega come raccogliamo, utilizziamo, divulghiamo e proteggiamo le tue informazioni quando utilizzi il nostro Servizio.',
      },
      informationWeCollect: {
        title: '2. Informazioni che raccogliamo',
        personalInfo: {
          title: '2.1 Informazioni personali',
          description: 'Quando ti registri, raccogliamo:',
          items: [
            'Nome completo',
            'Indirizzo email',
            'Password (crittografata)',
            'Data di creazione account',
          ],
        },
        studyInfo: {
          title: "2.2 Informazioni sull'orario di studio",
          description:
            'Per fornire il nostro servizio di generazione orari, raccogliamo:',
          items: [
            'Nomi di corsi e materie',
            'Orari e durate delle sessioni di studio',
            'Livelli di priorità assegnati ai corsi',
            'Note e descrizioni personalizzate',
            "Preferenze e impostazioni dell'orario",
          ],
        },
        usageData: {
          title: '2.3 Dati di utilizzo',
          description:
            'Potremmo raccogliere informazioni su come accedi e utilizzi il Servizio:',
          items: [
            'Tipo e versione del browser',
            'Informazioni sul dispositivo',
            'Preferenze utente (es.: impostazioni modalità scura)',
            'Informazioni di sessione e timestamp di attività',
          ],
        },
      },
      storage: {
        title: '3. Come archiviamo le tue informazioni',
        description:
          'Archiviazione locale: tutti i tuoi dati sono archiviati localmente nel tuo browser tramite la tecnologia localStorage. Questo significa:',
        items: [
          'I tuoi dati restano sul tuo dispositivo e non vengono trasmessi ai nostri server',
          'Non abbiamo accesso alle tue informazioni personali o ai tuoi orari',
          'Cancellare i dati del browser eliminerà tutte le informazioni archiviate',
          'I tuoi dati sono accessibili solo dal browser in cui li hai creati',
          'Ti consigliamo di eseguire regolarmente il backup degli orari importanti',
        ],
      },
      usage: {
        title: '4. Come utilizziamo le tue informazioni',
        description:
          'Utilizziamo le informazioni raccolte per i seguenti scopi:',
        items: [
          'Fornire, mantenere e migliorare il nostro Servizio',
          'Creare e gestire il tuo account',
          'Generare orari personalizzati',
          'Salvare le tue preferenze e impostazioni',
          'Autenticare il tuo accesso al Servizio',
          'Rispondere alle tue richieste e fornire assistenza clienti',
          'Inviarti aggiornamenti sul Servizio (con il tuo consenso)',
          "Analizzare i modelli d'uso e migliorare l'esperienza utente",
        ],
      },
      sharing: {
        title: '5. Condivisione e divulgazione dei dati',
        description:
          'Poiché i tuoi dati sono archiviati localmente sul tuo dispositivo, non condividiamo, vendiamo né affittiamo le tue informazioni personali a terzi. Tuttavia, potremmo divulgare informazioni nei seguenti casi:',
        items: [
          'Obblighi legali: se richiesto dalla legge o in risposta a procedimenti legali validi',
          'Tutela dei diritti: per proteggere i nostri diritti, la nostra privacy, la nostra sicurezza o la nostra proprietà',
          'Con il tuo consenso: quando ci autorizzi esplicitamente a condividere informazioni',
        ],
      },
      security: {
        title: '6. Sicurezza dei dati',
        description:
          'Implementiamo misure di sicurezza appropriate per proteggere le tue informazioni:',
        items: [
          'Le password non vengono mai archiviate in chiaro',
          'L’archiviazione locale è protetta dal tuo browser',
          'Utilizziamo pratiche di sviluppo sicure per prevenire vulnerabilità',
          'Aggiornamenti e manutenzione di sicurezza regolari',
        ],
        note:
          'Tuttavia, nessun metodo di archiviazione elettronica è sicuro al 100%. Sebbene ci impegniamo a proteggere le tue informazioni, non possiamo garantire una sicurezza assoluta.',
      },
      rights: {
        title: '7. I tuoi diritti e le tue scelte',
        description: 'Hai i seguenti diritti riguardo ai tuoi dati:',
        items: [
          'Accesso: puoi visualizzare tutti i tuoi dati archiviati in qualsiasi momento tramite il Servizio',
          'Modifica: puoi modificare le informazioni del tuo profilo e i tuoi orari',
          'Eliminazione: puoi eliminare il tuo account e tutti i dati associati tramite la pagina Impostazioni',
          'Esportazione: puoi esportare i tuoi orari a scopo di backup',
          'Disattivazione: puoi disabilitare alcune funzionalità o notifiche nelle Impostazioni',
        ],
      },
      cookies: {
        title: '8. Cookie e tecnologie di tracciamento',
        content:
          'Il Servizio utilizza localStorage per salvare le tue preferenze e i dati localmente sul tuo dispositivo. Non utilizziamo cookie di terze parti per tracciamento o pubblicità. Le informazioni di sessione vengono usate solo per mantenere il tuo stato di accesso e le tue preferenze.',
      },
      children: {
        title: '9. Privacy dei minori',
        content:
          'Il nostro Servizio è destinato a studenti di tutte le età. Tuttavia, non raccogliamo consapevolmente informazioni personali identificabili da minori di 13 anni senza il consenso dei genitori. Se sei un genitore o tutore e ritieni che tuo figlio ci abbia fornito informazioni personali, contattaci.',
      },
      thirdParty: {
        title: '10. Servizi di terze parti',
        content:
          'Il nostro Servizio può contenere link a siti o servizi di terze parti non gestiti da noi. Non siamo responsabili delle pratiche sulla privacy di tali terze parti. Ti invitiamo a consultare le informative sulla privacy di ogni servizio di terze parti a cui accedi.',
      },
      retention: {
        title: '11. Conservazione dei dati',
        description:
          'I tuoi dati vengono conservati nel localStorage del browser finché non li elimini esplicitamente tramite:',
        items: [
          'Eliminazione del tuo account tramite le Impostazioni',
          'Cancellazione dello storage locale del browser',
          'Disinstallazione o ripristino del browser',
        ],
      },
      international: {
        title: '12. Utenti internazionali',
        content:
          'Poiché tutti i dati sono archiviati localmente sul tuo dispositivo, le normative sul trasferimento dei dati non si applicano. Tuttavia, se in futuro introdurremo funzionalità basate sul cloud, aggiorneremo questa informativa di conseguenza.',
      },
      changes: {
        title: '13. Modifiche a questa informativa sulla privacy',
        content:
          'Potremmo aggiornare questa informativa sulla privacy di tanto in tanto. Ti informeremo di eventuali modifiche pubblicando la nuova informativa su questa pagina e aggiornando la data di "Ultimo aggiornamento". Ti consigliamo di rivedere periodicamente questa informativa. L’uso continuato del Servizio dopo la pubblicazione delle modifiche costituisce accettazione delle stesse.',
      },
      contact: {
        title: '14. Contattaci',
        description:
          'Se hai domande, dubbi o richieste riguardo a questa informativa sulla privacy o alle nostre pratiche in materia di privacy, contattaci tramite:',
        items: [
          "La pagina Impostazioni dell'applicazione",
          'La sezione supporto del nostro sito web',
          'I nostri canali di assistenza clienti',
        ],
      },
      consent: {
        title: 'Il tuo consenso',
        content:
          'Utilizzando U PLAN, acconsenti alla nostra informativa sulla privacy e ne accetti i termini. Se non accetti questa informativa, ti invitiamo a non utilizzare il nostro Servizio.',
      },
      commitment: {
        title: 'Impegno per la privacy',
        content:
          'Ci impegniamo alla trasparenza e alla protezione della tua privacy. La tua fiducia è importante per noi e continueremo a dare priorità alla sicurezza e alla riservatezza delle tue informazioni mentre sviluppiamo e miglioriamo il nostro Servizio.',
      },
    },
  },

  pomodoro: {
    title: 'Pomodoro',
    modes: {
      focus: 'Concentrazione',
      break: 'Pausa',
      longBreak: 'Pausa lunga',
    },
    pin: 'Fissa',
    focusMode: 'Modalità concentrazione',
    focusSession: 'Sessione di concentrazione',
    running: 'In corso',
    paused: 'In pausa',
    sessionsToday: 'Sessioni oggi',
    totalSessions: 'Sessioni totali',
    focusTime: 'Tempo di concentrazione',
    stayWithIt: 'Continua così',
    readyWhenYouAre: 'Pronto quando vuoi',
    closeTimer: 'Chiudi timer',
    unpinWidgetHint:
      'Rimuovi il fissaggio del widget (si chiuderà durante la navigazione)',
    pinWidgetHint:
      'Fissa il widget (rimane aperto durante la navigazione)',
    today: 'Oggi',
    total: 'Totale',
    focusShort: 'Conc.',
    settings: {
      title: 'Impostazioni Pomodoro',
      description: 'Personalizza le tue preferenze del timer Pomodoro',
      focus: 'Concentrazione',
      break: 'Pausa',
      longBreak: 'Pausa lunga',
      durationsMinutes: 'Durate (minuti)',
      autoStart: 'Avvio automatico',
      autoStartBreaks: 'Avvia automaticamente le pause',
      autoStartPomodoros: 'Avvia automaticamente i pomodori',
      notifications: 'Notifiche',
      desktopNotifications: 'Notifiche desktop',
      soundAlerts: 'Avvisi sonori',
      vibrationMobile: 'Vibrazione (mobile)',
      sessionSettings: 'Impostazioni sessione',
      longBreakAfterEvery: 'Pausa lunga ogni',
      focusSessions: 'sessioni di concentrazione',
    },
    actions: {
      start: 'Avvia',
      pause: 'Pausa',
      reset: 'Reimposta',
      exit: 'Esci',
      settings: 'Impostazioni',
      focus: 'Concentrazione',
      minimize: 'Riduci',
      expand: 'Espandi',
    },
  },

  navigation: {
    home: 'Home',
    about: 'Chi siamo',
    services: 'Servizi',
    login: 'Accedi',
    seePlans: 'Vedi piani',
    subtitle: 'Pianificazione accademica',
    logoAlt: 'Logo PLAN',
    switchToLight: 'Passa alla modalità chiara',
    switchToDark: 'Passa alla modalità scura',
    openMenu: 'Apri menu',
  },

  createTimetable: {
    title: 'Crea un orario',
    subtitle:
      'Configura i tuoi corsi, le preferenze di studio e i tempi non disponibili per generare un piano accademico.',
    stats: {
      courses: 'Corsi',
      hoursPerWeek: 'Ore / Settimana',
    },
    details: {
      title: "Dettagli dell'orario",
      description:
        'Dai un nome specifico al tuo orario così potrai salvarlo e ritrovarlo facilmente.',
      name: "Nome dell'orario",
      placeholder:
        'es.: Piano di ripasso metà semestre, Settimana esami, Programma revisioni',
    },
    courseSetup: {
      title: 'Configurazione corsi',
      description:
        'Aggiungi i tuoi corsi e definisci il tempo di studio necessario per ciascuno.',
    },
    fields: {
      courseName: 'Nome del corso',
      coursePlaceholder: 'es.: Calcolo, Fisica, Inglese…',
      hoursNeeded: 'Ore necessarie a settimana',
      priorityLevel: 'Livello di priorità',
      preferredStudyTime: 'Fascia di studio preferita',
      hoursPerWeek: 'Ore/settimana',
      preferredTime: 'Orario preferito',
      preferredStartTime: 'Ora di inizio preferita',
      optional: 'Facoltativo',
      sessionDuration: 'Durata sessione (min)',
      breakDuration: 'Durata pausa (min)',
      studyDaysFor: 'Giorni di studio per {{name}}',
    },
    hints: {
      startTime: 'Facoltativo: imposta un’ora di inizio specifica',
      sessionDuration: 'Consigliato: 45-50',
      breakDuration: 'Consigliato: 10-15',
    },
    actions: {
      addCourse: 'Aggiungi corso',
      resetAll: 'Reimposta tutto',
      generate: 'Genera un orario intelligente',
      saveToTimetable: "Salva nell'orario",
    },
    priority: {
      high: 'Alta',
      medium: 'Media',
      low: 'Bassa',
      highLabel: 'Priorità alta',
      mediumLabel: 'Priorità media',
      lowLabel: 'Priorità bassa',
      highDesc: 'Corsi critici, esami vicini',
      mediumDesc: 'Programma corrente',
      lowDesc: 'Letture facoltative, revisione',
    },
    time: {
      morning: 'Mattina (6-12)',
      afternoon: 'Pomeriggio (12-18)',
      evening: 'Sera (18-22)',
      any: 'Qualsiasi momento',
    },
    timeShort: {
      morning: 'Mattina',
      afternoon: 'Pomeriggio',
      evening: 'Sera',
      any: 'Qualsiasi',
    },
    timeBest: {
      morning: 'Massima concentrazione',
      afternoon: 'Apprendimento attivo',
      evening: 'Ripasso e pratica',
      any: 'Flessibile',
    },
    courses: {
      title: 'I tuoi corsi ({{count}})',
      total: 'Totale:',
      totalHours: '{{count}}h/settimana',
    },
    summaryCard: {
      title: 'Riepilogo allocazione tempo',
      hoursPercent: '{{count}}h ({{percent}}%)',
    },
    selectedDays: '{{count}} giorno selezionato',
    selectedDays_other: '{{count}} giorni selezionati',
    success: {
      courseAdded: '{{name}} aggiunto ai tuoi corsi',
      blockedAdded: 'Fascia non disponibile bloccata con successo!',
      reset: 'Tutti i campi sono stati reimpostati!',
      generated: 'Orario intelligente generato con successo!',
    },
    errors: {
      courseNameEnter: 'Inserisci un nome del corso',
      courseNameRequired: 'Inserisci un nome del corso.',
      blockedTitle: 'Inserisci un titolo per la fascia bloccata',
      timetableName:
        "Inserisci un nome per l'orario prima di generarlo",
      noCourses:
        'Aggiungi almeno un corso prima di generare un orario',
      noDays: 'Seleziona almeno un giorno di studio',
      selectStudyDay: 'Seleziona almeno un giorno di studio.',
    },
    confirm: {
      reset:
        'Sei sicuro di voler reimpostare tutti i campi? Questo cancellerà tutte le tue materie e impostazioni.',
    },
    university: {
      loaded: '{{count}} corso caricato dal tuo orario universitario',
      loaded_other:
        '{{count}} corsi caricati dal tuo orario universitario',
    },
    import: {
      removedConflicts:
        '{{count}} sessione/i in conflitto rimossa/e in base alle tue impostazioni di disponibilità',
      defaultName: 'Orario importato - {{date}}',
      withAvailability: ' con impostazioni di disponibilità',
      savedSuccess:
        '{{count}} sessione/i salvata/e negli orari{{settingsMessage}}!',
      savedDescription:
        'Vai negli orari salvati per attivare e consultare il tuo piano',
    },
    file: {
      selected: 'File "{{name}}" selezionato. Elaborazione in corso…',
      analyzing:
        "L'IA sta analizzando il tuo file. Questa funzionalità è in fase di sviluppo.",
    },
    readySummary:
      'Pronto per generare. Hai {{courses}} corsi e {{hours}} ora di studio pianificata a settimana.',
    readySummary_other:
      'Pronto per generare. Hai {{courses}} corsi e {{hours}} ore di studio pianificate a settimana.',
  },

  days: {
    monday: 'Lunedì',
    tuesday: 'Martedì',
    wednesday: 'Mercoledì',
    thursday: 'Giovedì',
    friday: 'Venerdì',
    saturday: 'Sabato',
    sunday: 'Domenica',
    short: {
      Monday: 'Lun',
      Tuesday: 'Mar',
      Wednesday: 'Mer',
      Thursday: 'Gio',
      Friday: 'Ven',
      Saturday: 'Sab',
      Sunday: 'Dom',
    },
  },

  settings: {
    title: 'Impostazioni',
    subtitle:
      'Gestisci il tuo account, i promemoria e le preferenze del tuo spazio di lavoro',
    tabs: {
      profile: 'Profilo',
      workspace: 'Spazio di lavoro',
    },
    profile: {
      title: 'Informazioni profilo',
      description:
        'Aggiorna le tue informazioni personali e i dettagli di contatto',
      picture: 'Foto profilo',
      pictureAlt: 'Profilo',
      uploadPicture: 'Carica una foto',
      pictureHint: 'JPG, PNG o GIF. Dimensione massima 5 MB.',
      fields: {
        username: 'Nome utente',
        profileTitle: 'Titolo del profilo',
        role: 'Ruolo',
        department: 'Dipartimento',
      },
      placeholders: {
        fullName: 'Inserisci il tuo nome completo',
        email: 'Inserisci il tuo indirizzo email',
        role: 'Seleziona il tuo ruolo',
        otherRole: 'Inserisci le informazioni del tuo ruolo',
        department: 'Inserisci il tuo dipartimento',
        dateOfBirth: 'Inserisci la tua data di nascita',
      },
      hints: {
        fullNameLocked: 'Il tuo nome completo viene salvato durante la registrazione e non puo essere modificato dopo.',
        username: 'Questo appare solo sul tuo profilo pubblico.',
        profileTitle: 'Questo appare sotto il tuo nome nel profilo.',
        otherRole: 'Aggiungi le informazioni del ruolo che vuoi mostrare nel tuo profilo.',
      },
      roleOptions: {
        student: 'Studente',
        administrator: 'Amministratore',
        teacher: 'Insegnante',
        other: 'Altro',
      },
      actions: {
        edit: 'Modifica profilo',
        save: 'Salva modifiche',
      },
    },
    notifications: {
      title: 'Notifiche',
      description: 'Gestisci come ricevere notifiche e promemoria',
      push: {
        title: 'Notifiche push',
        description: 'Ricevi notifiche sul tuo orario',
      },
      emailStudyReminders: {
        title: 'Promemoria studio via email',
        description:
          'Ricevi un promemoria via email prima di ogni sessione di studio pianificata',
      },
      minutesBefore: {
        title: 'Minuti prima',
        description: 'Con quanto anticipo inviare il promemoria',
        select: 'Seleziona',
        options: {
          atStart: '0 (all’inizio)',
        },
      },
      deadlineAlerts: {
        title: 'Avvisi scadenze via email',
        description: 'Ricevi una email quando una scadenza si avvicina',
      },
      achievementAlerts: {
        title: 'Avvisi risultati via email',
        description: 'Ricevi una email quando sblocchi un risultato',
      },
      weeklySummary: {
        title: 'Riepilogo settimanale via email',
        description: 'Ricevi un riepilogo settimanale dei tuoi progressi',
      },
    },
    appearance: {
      title: 'Aspetto',
      description: "Personalizza l'aspetto della tua dashboard",
      darkMode: {
        title: 'Modalità scura',
        description:
          'Passa a un’interfaccia più scura per l’uso in condizioni di scarsa luminosità',
      },
    },
    about: {
      title: 'Informazioni',
      version: "Versione dell'app",
      versionValue: '1.0.0',
      lastUpdated: 'Ultimo aggiornamento',
      lastUpdatedValue: 'Ottobre 2025',
      description:
        'La nostra piattaforma aiuta studenti e team di studio a pianificare i propri orari, gestire le scadenze, monitorare i progressi e restare allineati grazie a flussi di studio strutturati.',
    },
    password: {
      title: 'Cambia password',
      description:
        'Crea una password forte di almeno 8 caratteri, includendo maiuscole, minuscole, numeri e caratteri speciali.',
      fields: {
        current: 'Password attuale',
        new: 'Nuova password',
        confirm: 'Conferma nuova password',
      },
      placeholders: {
        current: 'Inserisci la password attuale',
        new: 'Inserisci la nuova password',
        confirm: 'Reinserisci la nuova password',
      },
      actions: {
        update: 'Aggiorna password',
      },
      errors: {
        fillAllFields: 'Compila tutti i campi della password',
        sameAsCurrent:
          'La nuova password deve essere diversa dalla password attuale',
        requirements: 'La password non soddisfa i requisiti',
        noMatch: 'Le password non corrispondono',
        userNotLoggedIn: 'Utente non connesso',
        changeFailed: 'Cambio password non riuscito',
        server: 'Errore del server. Riprova più tardi.',
      },
      success: {
        changed: 'Password cambiata con successo!',
        changedDescription:
          'La tua password è stata aggiornata in modo sicuro.',
      },
    },
    success: {
      profilePictureUpdated: 'Foto profilo aggiornata con successo!',
      profilePictureRemoved: 'Foto profilo rimossa con successo!',
      profileUpdated: 'Profilo aggiornato con successo!',
      reminderSettingsUpdated: 'Impostazioni promemoria aggiornate',
    },
    errors: {
      notLoggedIn: 'Non hai effettuato l’accesso',
      roleDetailsRequired: 'Inserisci le informazioni del tuo ruolo prima di salvare.',
      uploadImageOnly: 'Carica un file immagine',
      uploadImageFailedWithReason:
        'Caricamento immagine non riuscito: {{reason}}',
      profilePictureUploadFailed:
        'Caricamento della foto profilo non riuscito',
      updateProfileFailed: 'Aggiornamento del profilo non riuscito',
      updateReminderSettingsFailed:
        'Aggiornamento delle impostazioni promemoria non riuscito',
    },
  },

  courseEdit: {
    title: 'Modifica corso',
    description:
      'Modifica i dettagli del tuo corso affinché il tuo orario sia accurato e rifletta il tuo piano di studio.',
    fields: {
      name: 'Nome del corso',
      hours: 'Ore/settimana',
      preferredTime: 'Orario preferito',
      startTime: 'Ora di inizio preferita',
      sessionDuration: 'Durata sessione (min)',
      breakDuration: 'Durata pausa (min)',
      studyDays: 'Giorni di studio per {{name}}',
      priority: 'Livello di priorità',
    },
    placeholders: {
      name: 'es.: Matematica',
    },
    time: {
      morning: 'Mattina',
      afternoon: 'Pomeriggio',
      evening: 'Sera',
      any: 'Qualsiasi',
    },
    priority: {
      high: 'Priorità alta',
      medium: 'Priorità media',
      low: 'Priorità bassa',
    },
    hints: {
      startTime: 'Facoltativo: imposta un’ora di inizio specifica',
      session: 'Consigliato: 45-50',
      break: 'Consigliato: 10-15',
    },
    selectedDays: '{{count}} giorno selezionato',
    actions: {
      save: 'Salva modifiche',
      cancel: 'Annulla',
      delete: 'Elimina corso',
    },
    errors: {
      nameRequired: 'Il nome del corso è obbligatorio',
      selectDay: 'Seleziona almeno un giorno di studio',
    },
    confirmDelete:
      'Sei sicuro di voler eliminare "{{name}}"? Questo rigenererà il tuo orario senza questo corso.',
  },

  assessments: {
    title: 'Valutazioni',
    subtitle:
      'Gestisci esami, quiz, compiti e progetti in un unico posto.',
    listTitle: 'Valutazioni',
    listDescription:
      'Appariranno automaticamente nella scheda Scadenze della dashboard.',
    empty: {
      title: 'Nessuna valutazione aggiunta',
      description:
        'Aggiungi qui sotto il tuo primo esame, quiz, compito o progetto.',
    },
    add: {
      title: 'Aggiungi una valutazione',
      description:
        'Crea una nuova valutazione che apparirà nella panoramica delle scadenze.',
      button: 'Aggiungi una valutazione',
    },
    fields: {
      course: 'Corso',
      type: 'Tipo',
      dateTime: 'Data e ora',
      titleOptional: 'Titolo (facoltativo)',
    },
    placeholders: {
      selectCourse: 'Seleziona un corso',
      title: 'Lascia vuoto per assegnare un nome automaticamente',
    },
    courseHint:
      'Se manca un corso, aggiungilo in Generazione automatica → Orario delle lezioni.',
    due: 'Scadenza',
    completed: 'Completato',
    types: {
      exam: 'Esame',
      quiz: 'Quiz',
      assignment: 'Compito',
      project: 'Progetto',
    },
    success: {
      added: 'Valutazione aggiunta',
      deleted: 'Valutazione eliminata',
    },
    errors: {
      selectCourse: 'Seleziona un corso per la valutazione',
      chooseDate: 'Scegli una data/ora per la valutazione',
      createFailed: 'Creazione della valutazione non riuscita',
      updateFailed: 'Aggiornamento non riuscito',
    },
  },

  calendar: {
    title: 'Orario',
    subtitle: 'Pianifica e organizza le sessioni di studio; ogni settimana ha il suo orario',
    add: 'Aggiungi',
    aiPlan: 'Piano IA',
    import: 'Importa',
    copyWeek: 'Copia settimana',
    google: 'Google',
    pdf: 'PDF',
    excel: 'Excel',
    deleteAll: 'Elimina tutto',
    currentWeek: 'Vai alla settimana corrente',
    importTimetable: 'Importa orario',
    importTargetPrompt: 'Dove vuoi importare?',
    myTimetable: 'Il mio orario',
    showDetails: 'Mostra dettagli',
    hideDetails: 'Nascondi dettagli',
    weeklyView: 'Vista settimanale',
    time: 'Ora',
    conflict: 'Conflitto',
    loading: 'Caricamento...',
    loadingStatuses: 'Caricamento stati...',
    dismiss: 'Chiudi',
    copy: 'Copia',
    view: 'Vedi',
    deadlineCount: '{{count}} scadenza',
    deadlineCount_other: '{{count}} scadenze',
    status: {
      completed: 'completate',
      missed: 'perse',
      skipped: 'saltate',
      planned: 'pianificate',
    },
    actions: {
      markCompleted: 'Segna come completata',
      markMissed: 'Segna come persa',
      markSkipped: 'Segna come saltata',
      resetPlanned: 'Ripristina come pianificata',
    },
    confirm: {
      confirm: 'Conferma',
      deleteAllTitle: 'Elimina tutti i corsi',
      deleteAllMessage: 'Vuoi davvero eliminare tutti i corsi e le sessioni di questa settimana?',
      copyNextWeekTitle: 'Copia nella prossima settimana',
      copyNextWeekMessage: 'Copiare {{count}} sessione/i da questa settimana alla prossima?',
      googleOverwrite: 'Hai già esportato un orario su Google Calendar.\n\nOK = sovrascrivi (sostituisci esportazione precedente)\nAnnulla = aggiungi sopra (mantieni esportazione precedente)',
    },
    export: {
      page: 'Pagina {{page}}',
      deadline: 'Scadenza: {{date}}',
      noSessions: 'Nessuna sessione',
      continued: 'Continua nella pagina successiva',
      week: 'Settimana: {{range}}',
      day: 'Giorno',
      subject: 'Materia',
      startTime: 'Inizio',
      endTime: 'Fine',
      type: 'Tipo',
      deadlineHeader: 'Scadenza',
      sheetName: 'Orario',
      googleDescription: 'Sessione SmartStudy: {{type}}',
    },
    toasts: {
      editAssessmentFromAssessments: 'Modifica da Valutazioni e scadenze',
      deleteAssessmentFromAssessments: 'Elimina da Valutazioni e scadenze',
      timeConflictDetected: 'Conflitto orario rilevato',
      cannotAdd: 'Impossibile aggiungere "{{subject}}"',
      alreadyScheduledOn: '"{{subject}}" è già programmata per {{day}}',
      timeRange: 'Ora: {{start}} - {{end}}',
      chooseDifferentTimeSlot: 'Scegli un orario diverso',
      chooseDifferentSlot: 'Scegli uno slot diverso',
      sessionDeadlineUpdated: 'Sessione e scadenza aggiornate.',
      sessionUpdated: 'Sessione aggiornata',
      sessionAddedWithDeadline: 'Sessione aggiunta con scadenza.',
      sessionAdded: 'Sessione aggiunta',
      sessionDeleted: 'Sessione eliminata',
      allSessionsCleared: 'Tutte le sessioni sono state eliminate.',
      emptyTimetable: 'Orario vuoto',
      emptyBeforeCopy: 'Il tuo orario è vuoto. Aggiungi alcune sessioni prima di copiarlo alla prossima settimana.',
      sessionsCopied: 'Sessioni copiate.',
      sessionsCopiedDescription: '{{count}} sessione/i copiata/e alla prossima settimana (settimana {{week}})',
      pdfLayoutFailed: 'PDF non riuscito: il contenuto è troppo grande per la pagina.',
      exportedPdf: 'Orario esportato come PDF',
      pdfExportFailed: 'Esportazione PDF non riuscita',
      unknownError: 'Errore sconosciuto',
      exportedExcel: 'Orario esportato come Excel',
      backendUrlMissing: 'URL backend non configurato (VITE_API_BASE_URL)',
      noSessionsToExport: 'Nessuna sessione da esportare',
      notLoggedIn: 'Non hai effettuato l’accesso',
      googleStatusFailed: 'Impossibile controllare lo stato di Google Calendar',
      connectGoogleToExport: 'Collega Google Calendar per esportare...',
      exportingGoogle: 'Esportazione su Google Calendar...',
      reconnectingGoogle: 'Riconnessione a Google Calendar...',
      exportFailedWithMessage: 'Esportazione non riuscita: {{message}}',
      exportedGoogle: '{{count}} sessione/i esportata/e su Google Calendar',
      exportFailed: 'Esportazione non riuscita',
      importConflictsDetected: 'Conflitti di importazione rilevati',
      conflictsFound: '{{count}} conflitto/i trovato/i',
      importConflictPair: '"{{imported}}" è in conflitto con "{{existing}}"',
      onDay: 'il {{day}}',
      moreConflicts: 'e altri {{count}}...',
      importedWithAvailability: '{{count}} sessione/i importata/e con impostazioni di disponibilità.',
      imported: '{{count}} sessione/i importata/e.',
      dragDropConflict: 'Conflitto di trascinamento',
      cannotMove: 'Impossibile spostare "{{subject}}"',
      alreadyInSlot: '"{{subject}}" è già in questo slot',
      onDayTimeRange: 'il {{day}}: {{start}} - {{end}}',
      anotherSessionExists: 'Esiste già un’altra sessione a quest’ora. Scegli uno slot diverso.',
      sessionMoved: 'Sessione spostata',
      sessionMovedDescription: 'Spostata a {{day}} alle {{time}}',
      navigationUnavailable: 'Navigazione non disponibile',
      importFromAutoGenerate: 'Gli utenti non admin importano da Generazione automatica.',
      statusSaveFailed: 'Salvataggio degli stati delle sessioni dello spazio non riuscito',
      onlyAdminsCanEdit: 'Solo gli admin dello spazio possono modificare questo orario',
      selectWorkspaceImport: 'Seleziona lo spazio, poi carica/importa nella Generazione automatica dello spazio.',
    },
  },

  sessionCard: {
    confirmDelete: 'Eliminare "{{name}}"?',
  },

  sessionTypes: {
    reading: 'Lettura',
    revision: 'Ripasso',
    practice: 'Esercizio',
    break: 'Pausa',
    lecture: 'Lezione',
    assignment: 'Compito',
    test: 'Test',
    exam: 'Esame',
  },

  sessionDialog: {
    add: {
      title: 'Aggiungi una sessione di studio',
      description:
        'Inserisci i dettagli per aggiungere una nuova sessione di studio al tuo orario.',
    },
    edit: {
      title: 'Modifica sessione',
      description: 'Aggiorna i dettagli della tua sessione di studio.',
    },
    fields: {
      subject: 'Materia',
      day: 'Giorno',
      startTime: 'Ora di inizio',
      endTime: 'Ora di fine',
      type: 'Tipo',
      deadline: 'Data di scadenza',
    },
    placeholders: {
      subject: 'es.: Matematica, Fisica',
    },
    actions: {
      add: 'Aggiungi',
      update: 'Aggiorna',
      session: 'Sessione',
    },
    errors: {
      subjectRequired: 'Inserisci una materia',
      endTimeAfterStart:
        "L'ora di fine deve essere successiva all'ora di inizio",
    },
    confirm: {
      noDeadline:
        'Stai creando un/una {{type}} senza data di scadenza. Sei sicuro di voler continuare?',
    },
    deadlineHelp:
      'Questa scadenza apparirà nella sezione Prossime scadenze',
    days: {
      monday: 'Lunedì',
      tuesday: 'Martedì',
      wednesday: 'Mercoledì',
      thursday: 'Giovedì',
      friday: 'Venerdì',
      saturday: 'Sabato',
      sunday: 'Domenica',
    },
  },

  reminders: {
    title: 'Promemoria e notifiche',
    subtitle:
      'Configura promemoria per le tue sessioni di studio e le attività importanti',
    actions: {
      add: 'Aggiungi promemoria',
      create: 'Crea promemoria',
    },
    dialog: {
      title: 'Crea un promemoria',
      description:
        'Configura un nuovo promemoria per rimanere aggiornato sulla tua pianificazione.',
    },
    form: {
      title: 'Titolo',
      description: 'Descrizione',
      time: 'Ora',
      type: 'Tipo',
      repeat: 'Ripeti il',
      required: '*',
      placeholderTitle: 'es.: Studiare matematica',
      placeholderDescription: 'Dettagli aggiuntivi…',
      error:
        'Compila tutti i campi obbligatori e seleziona almeno un giorno',
    },
    types: {
      study: 'Studio',
      break: 'Pausa',
      exam: 'Esame',
      custom: 'Personalizzato',
    },
    notifications: {
      title: 'Impostazioni notifiche',
      description:
        'Attiva le notifiche del browser per ricevere i tuoi promemoria',
      browser: 'Notifiche browser',
      browserDesc: 'Ricevi notifiche per i tuoi promemoria pianificati',
      enabled: 'Notifiche attivate!',
      denied: 'Permesso notifiche negato',
      notSupported: 'Le notifiche non sono supportate da questo browser',
    },
    presets: {
      title: 'Aggiunta rapida promemoria',
      added: 'Promemoria predefinito aggiunto!',
      morning: {
        title: 'Sessione di studio del mattino',
        description:
          'È il momento di iniziare la tua sessione di studio mattutina!',
      },
      afternoon: {
        title: 'Sessione di studio del pomeriggio',
        description:
          'Non dimenticare il tuo tempo di studio del pomeriggio!',
      },
      break: {
        title: 'Fai una pausa',
        description: 'È il momento di fare una pausa meritata!',
      },
    },
    list: {
      title: 'I tuoi promemoria',
      empty: 'Nessun promemoria impostato',
      emptySub:
        'Crea il tuo primo promemoria o aggiungi un promemoria predefinito',
    },
    toast: {
      added: 'Promemoria aggiunto con successo!',
      deleted: 'Promemoria eliminato',
    },
    tip: {
      title: 'Suggerimento:',
      description:
        'Assicurati di consentire le notifiche nelle impostazioni del browser per una migliore esperienza.',
      extra:
        "I promemoria funzioneranno anche quando l'app è in esecuzione in background.",
    },
    weekdays: {
      monday: 'Lunedì',
      tuesday: 'Martedì',
      wednesday: 'Mercoledì',
      thursday: 'Giovedì',
      friday: 'Venerdì',
      saturday: 'Sabato',
      sunday: 'Domenica',
    },
  },

  viewTimetables: {
    title: 'Orari salvati',
    description:
      'Visualizza, anteprima, avvia, esporta e gestisci i tuoi piani salvati.',
    stats: {
      sessions: 'Sessioni',
      subjects: 'Materie',
      hoursPerDay: 'Ore/giorno',
    },
    empty: {
      title: 'Nessun orario salvato',
      description: 'Non hai ancora creato nessun orario.',
      create: 'Crea un orario',
    },
    card: {
      untitled: 'Orario senza titolo',
      active: 'Attivo',
      created: 'Creato il {{date}}',
      breakEvery: 'Pausa ogni {{minutes}} min',
    },
    actions: {
      view: 'Visualizza',
      preview: 'Anteprima',
      start: "Avvia l'orario",
      merge: 'Unisci',
      overwrite: 'Sovrascrivi',
      duplicate: 'Duplica',
      delete: 'Elimina',
      exportCsv: 'Esporta CSV',
      exportJson: 'Esporta JSON',
      exportPdf: 'Esporta PDF',
    },
    confirm: {
      delete: 'Sei sicuro di voler eliminare questo orario?',
    },
    dialog: {
      useThisTimetable: 'Usare questo orario?',
      myTimetable: 'Il mio orario',
      description: {
        before: 'Hai già delle sessioni in ',
        after:
          '. Puoi unire questo orario al tuo piano attuale oppure sovrascrivere tutto.',
      },
    },
    export: {
      pdfTitle: 'Orario',
      csvTitle: 'Orario',
      createdOn: 'Creato il {{date}}',
      createdOnShort: 'Creato il {{date}}',
      generatedOn: 'Generato il {{date}}',
      studyHoursPerDay: 'Ore di studio al giorno: {{value}}',
      studyTime: 'Fascia oraria: {{start}} - {{end}}',
      sessionLength: 'Durata sessione: {{value}}',
      breakDuration: 'Durata pausa: {{value}}',
      studyHoursPerDayLabel: 'Ore di studio al giorno:',
      studyTimeLabel: 'Fascia oraria:',
      sessionLengthLabel: 'Durata sessione:',
      breakDurationLabel: 'Durata pausa:',
      subjects: 'Materie:',
      weeklySchedule: 'Programma settimanale:',
      priority: 'priorità',
    },
    days: {
      monday: 'Lunedì',
      tuesday: 'Martedì',
      wednesday: 'Mercoledì',
      thursday: 'Giovedì',
      friday: 'Venerdì',
      saturday: 'Sabato',
      sunday: 'Domenica',
    },
    toasts: {
      showingSubject: 'Visualizzazione di "{{subject}}" in {{name}}',
      deleted: 'Orario eliminato con successo',
      started: 'Orario avviato!',
      startedOverwriteDescription:
        'Il tuo orario è stato sostituito con questo orario salvato',
      startedMerged: 'Orario avviato (unito)',
      startedMergeDescription:
        'Il tuo orario salvato è stato unito al calendario attuale',
      sessionUnavailable: 'Una o più sessioni non sono disponibili',
      generatingPdf: 'Generazione PDF in corso…',
      pdfDownloaded: 'PDF scaricato con successo!',
      pdfFailed: 'Generazione PDF non riuscita. Riprova.',
      generatingCsv: 'Generazione del file CSV in corso…',
      csvDownloaded:
        'File CSV scaricato con successo! (Aprilo con Excel)',
      exportFailed: 'Esportazione non riuscita. Riprova.',
      jsonDownloaded: 'JSON scaricato con successo!',
      jsonFailed: 'Esportazione JSON non riuscita',
    },
  },

  sharedTimetable: {
    title: 'Orari condivisi',
    subtitle: 'Collabora sugli orari con il tuo team',
    searchPlaceholder: 'Cerca orari…',
    noDescription: 'Nessuna descrizione',
    personal: {
      description: 'Orario personale',
      defaultName: 'Il mio orario',
      sharedSuffix: 'Condiviso',
      copySuffix: 'Copia',
      importedDescription: 'Importato dall’orario personale',
    },
    stats: {
      total: 'Totale accessibili',
      owned: 'Di tua proprietà',
      editable: 'Modificabile',
      viewOnly: 'Sola lettura',
    },
    filters: {
      all: 'Tutti gli orari',
      owner: 'I miei orari',
      editor: 'Modificabili',
      viewer: 'Sola lettura',
    },
    actions: {
      importMyTimetable: 'Importa il mio orario',
      createShared: 'Crea un orario condiviso',
      copyToPersonal: 'Copia nel personale',
      managePermissions: 'Gestisci permessi',
      viewSessions: 'Visualizza sessioni',
      createTimetable: 'Crea un orario',
      importTimetable: 'Importa un orario',
      savePermissions: 'Salva permessi',
    },
    badges: {
      owner: 'Proprietario',
      canEdit: 'Può modificare',
      viewOnly: 'Sola lettura',
    },
    visibility: {
      public: 'Pubblico',
      private: 'Privato',
      publicHelp:
        'Tutti i membri dello spazio di lavoro possono vedere',
      privateHelp:
        'Solo i membri selezionati possono vedere',
      publicDescription: 'Pubblico - Tutti i membri possono vedere',
      privateDescription: 'Privato - Accesso limitato',
      publicDialog: 'Pubblico - Tutti i membri possono vedere',
      privateDialog: 'Privato - Solo membri selezionati',
    },
    fields: {
      name: "Nome dell'orario",
      description: 'Descrizione',
      visibility: 'Visibilità',
      editors: 'Chi può modificare? (Seleziona membri)',
      editorsSimple: 'Editor',
      sessions: 'Sessioni',
    },
    placeholders: {
      name: 'es.: Programma corsi Primavera 2025',
      description: 'Breve descrizione di questo orario',
    },
    roles: {
      admin: 'Admin',
      member: 'Membro',
    },
    createDialog: {
      title: 'Crea un orario condiviso',
      description:
        'Crea un nuovo orario modificabile dai membri del team',
    },
    importDialog: {
      title: 'Importa orario personale',
      description:
        'Importa il tuo orario attivo come orario condiviso',
      alert:
        'Questo creerà un nuovo orario condiviso con tutte le sessioni del tuo orario personale attivo. Tutti i membri dello spazio di lavoro potranno modificarlo per impostazione predefinita.',
    },
    permissionsDialog: {
      title: 'Gestisci permessi',
      description: 'Controlla chi può vedere e modificare questo orario',
    },
    viewDialog: {
      title: "Visualizza l'orario",
      description: 'Consulta le sessioni di questo orario',
    },
    selectedEditorsInfo:
      'Selezionato/i: {{count}} membro/i. Tu (proprietario) puoi sempre modificare.',
    sessionsCount: '{{count}} sessioni',
    editorsCount: '{{count}} editor',
    byOwner: 'da {{name}}',
    modifiedAt: 'Modificato il {{date}}',
    modifiedBy: 'da {{name}}',
    confirm: {
      delete: 'Sei sicuro di voler eliminare "{{name}}"?',
    },
    success: {
      created: 'Orario condiviso creato con successo!',
      importedWithCount:
        'Orario importato con {{count}} sessioni!',
      deleted: 'Orario eliminato con successo',
      permissionsUpdated: 'Permessi aggiornati con successo',
      copiedToPersonal:
        'Orario copiato nei tuoi orari personali!',
    },
    errors: {
      enterName: "Inserisci un nome dell'orario",
      noPersonalToImport:
        'Nessun orario personale trovato da importare',
      noActiveFound: 'Nessun orario attivo trovato',
      deletePermission:
        "Solo il proprietario o l'admin può eliminare questo orario",
      permissionsPermission:
        "Solo il proprietario o l'admin può modificare i permessi",
    },
    info: {
      viewingWithCount: 'Visualizzazione di {{name}} - {{count}} sessioni',
    },
    confirmDelete: {
      title: 'Elimina orario condiviso',
      description: 'Questo elimina definitivamente "{{name}}" dagli orari condivisi dello spazio di lavoro.',
      fallbackName: 'questo orario',
    },
    history: {
      createdPersonal: 'Orario personale creato',
      created: 'Orario creato',
      importedFromPersonal: 'Importato da orario personale',
      updatedPermissions: 'Permessi aggiornati',
    },
  },

  teamCollaboration: {
    defaults: {
      member: 'Membro',
    },
    stats: {
      sharedSchedules: 'Piani condivisi',
      activeMembers: 'Membri attivi',
      avgCompletion: 'Completamento medio',
      recentUpdates: 'Aggiornamenti recenti',
    },
    sharedSchedules: {
      title: 'Piani condivisi',
      description: 'Piani condivisi con il team',
    },
    progress: {
      title: 'Progresso del team',
      description: 'Monitora i tassi di completamento del team',
      completedCount: '{{completed}}/{{total}} completato/i',
      details: '{{hours}}h · Serie {{streak}}g · Obiettivo {{goal}}%',
    },
    activity: {
      title: 'Attività recente',
      description: 'Cosa sta facendo il tuo team',
    },
    actions: {
      shareSchedule: 'Condividi un piano',
      view: 'Visualizza',
      import: 'Importa',
    },
    empty: {
      schedulesTitle: 'Nessun piano condiviso',
      schedulesDescription:
        'Condividi un piano per collaborare con il tuo team',
      progress: 'Nessun dato di progresso',
      activity: 'Nessuna attività recente',
    },
    visibility: {
      allMembers: 'Tutti i membri',
      allMembersHelp: 'Tutti possono vedere e usare',
      adminsOnly: 'Solo admin',
      adminsOnlyHelp: 'Solo gli admin possono vedere',
    },
    shareDialog: {
      title: 'Condividi un piano con il team',
      description:
        'Seleziona un piano da condividere con i membri del tuo spazio di lavoro',
      selectSchedule: 'Seleziona un piano',
      schedulePlaceholder: 'Scegli un piano da condividere',
      noSchedules: 'Nessun piano disponibile',
      createFirst: 'Crea prima un orario',
      visibility: 'Visibilità',
    },
    errors: {
      selectSchedule: 'Seleziona un piano',
      scheduleNotFound: 'Piano non trovato',
    },
    success: {
      shared: 'Piano "{{name}}" condiviso con successo!',
      progressUpdated: 'Progresso aggiornato con successo!',
    },
    info: {
      viewingDetails: 'Visualizzazione dettagli del piano…',
    },
    activities: {
      scheduleShared:
        'ha condiviso il piano "{{name}}" con il team',
      progressUpdated:
        'ha aggiornato il proprio progresso a {{completed}}/{{total}} sessioni completate',
    },
    sessionsCount: '{{count}} sessioni',
    sharedBy: 'Condiviso da {{name}}',
    time: {
      justNow: 'Proprio adesso',
      minutesAgo: '{{count}} min fa',
      hoursAgo: '{{count}} h fa',
      daysAgo: '{{count}} g fa',
    },
  },

  welcomeWalkthrough: {
    greeting: 'Ciao {{name}}. ',
    stepCounter: 'Passaggio {{current}} / {{total}}',
    quickTips: 'Suggerimenti rapidi',
    actions: {
      skipWalkthrough: 'Salta il tutorial',
      openThisPage: 'Apri questa pagina',
      skip: 'Salta',
      finish: 'Fine',
      next: 'Avanti',
    },
    steps: {
      welcome: {
        title: 'Benvenuto su U PLAN',
        description:
          'Questo rapido tutorial ti mostra dove si trovano gli elementi importanti. Puoi saltarlo in qualsiasi momento e tornarci più tardi.',
        tips: [
          "Suggerimento: puoi aggiornare senza preoccuparti — l'app conserva la tua pagina.",
        ],
      },
      autoGenerate: {
        title: 'Genera automaticamente un orario',
        description:
          'Usa la generazione automatica per creare un piano settimanale. Puoi mescolare per ottenere un risultato diverso oppure mantenere un seed per riprodurlo.',
        tips: [
          'Prova: Generazione automatica → Mescola',
          "Poi: Salva orario → Applica alla settimana",
        ],
      },
      assessments: {
        title: 'Valutazioni e scadenze',
        description:
          'Aggiungi scadenze ed esami affinché il generatore assegni più tempo ai corsi urgenti, anche quando più esami cadono nella stessa settimana.',
        tips: ['Prova: aggiungi 2 esami nella stessa settimana e rigenera'],
      },
      workspace: {
        title: 'Spazio di lavoro',
        description:
          'Gli spazi di lavoro ti permettono di collaborare con i tuoi compagni tramite chat e pianificazione condivisa.',
        tips: [
          'La chat si aggiorna in tempo reale quando ti trovi nella pagina chat.',
        ],
      },
    },
  },

  timetable: {
    back: 'Indietro',
    title: "Risultati dell'orario",
    subtitle:
      'Visualizza, perfeziona e salva il tuo piano accademico generato.',
    blocked: {
      sleep: 'Sonno',
      lunchBreak: 'Pausa pranzo',
      dinnerBreak: 'Pausa cena',
      default: 'Fascia bloccata',
    },
    break: 'Pausa',
    unavailable: 'Non disponibile',
    minutes: '{{count}} min',
    stats: {
      sessions: 'Sessioni',
      hours: 'Ore',
      courses: 'Corsi',
    },
    summary: {
      title: 'Riepilogo del piano',
      description:
        'Il tuo piano è stato generato tenendo conto delle priorità dei corsi, delle fasce orarie preferite, degli intervalli bloccati e delle impostazioni di sessione/pausa.',
      priorityLabel: 'Allocazione basata sulla priorità:',
      priorityText:
        'i corsi più prioritari vengono collocati nelle fasce orarie migliori.',
      timePreferencesLabel: 'Preferenze orarie:',
      timePreferencesText:
        'i corsi vengono collocati nelle fasce preferite di mattina, pomeriggio o sera, se possibile.',
      conflictAvoidanceLabel: 'Evitamento conflitti:',
      conflictAvoidanceText:
        'le sessioni di studio evitano {{count}} fascia/e bloccata/e.',
      sessionStructureLabel: 'Struttura delle sessioni:',
      sessionStructureText:
        'sessioni di {{sessionDuration}} minuti con pause di {{breakDuration}} minuti.',
    },
    actions: {
      save: "Salva l'orario",
      editCourses: 'Modifica corsi',
      splitLongSessions: 'Dividi sessioni lunghe',
      mergeAdjacentSessions: 'Unisci sessioni adiacenti',
      createNew: 'Creane uno nuovo',
    },
    unavailableTime: {
      title: 'Tempi non disponibili rispettati',
      description:
        'Le sessioni di studio sono state pianificate tenendo conto di {{count}} fascia/e non disponibile/i.',
    },
    availability: {
      title: 'Disponibilità e impostazioni pause',
      weekdayHours: 'Ore nei giorni feriali:',
      weekendHours: 'Ore nel weekend:',
      sleepHours: 'Ore di sonno:',
      lunchBreak: 'Pausa pranzo:',
      dinnerBreak: 'Pausa cena:',
      commuteBuffer: 'Margine spostamenti:',
      commuteMinutes: '{{count}} minuti',
      noneFound:
        'Nessuna impostazione di disponibilità trovata per questo orario.',
    },
    empty: {
      title: 'Nessun piano generato',
      description:
        'Si è verificato un problema durante la generazione del piano. Verifica di aver selezionato giorni di studio e aggiunto corsi.',
    },
    dayDescription: '{{count}} sessione/i di studio • {{hours}}h totali',
    dayEmpty: 'Nessuna sessione pianificata per questo giorno',
    tips: {
      title: 'Suggerimenti di studio',
      followScheduleLabel: 'Segui il piano:',
      followScheduleText:
        'l’orario è stato generato in base alle tue priorità e al tuo tempo libero.',
      useBreaksLabel: 'Usa bene le pause:',
      useBreaksText:
        'riposa, idratati e ricaricati tra i blocchi di studio.',
      adjustWhenNeededLabel: 'Adatta quando necessario:',
      adjustWhenNeededText:
        'rigenera se i tuoi corsi o i tuoi tempi non disponibili cambiano.',
      stayConsistentLabel: 'Sii costante:',
      stayConsistentText:
        'sessioni brevi e ripetute funzionano di solito meglio che concentrare tutto in un solo giorno.',
    },
    unsaved: {
      title: 'Orario non salvato',
      titleWithWarning: '⚠️ Orario non salvato',
      backDescription:
        'Non hai ancora salvato il tuo orario. Se torni ora alla dashboard, tutto il piano generato andrà perso.',
      backQuestion:
        'Vuoi restare e salvare il tuo orario, oppure ignorarlo e tornare indietro?',
      createNewDescription:
        'Non hai ancora salvato il tuo orario. Se ne crei uno nuovo adesso, tutto il piano generato andrà perso.',
      createNewQuestion:
        'Vuoi restare e salvare il tuo orario, oppure ignorarlo e crearne uno nuovo?',
      discardAndGoBack: 'Ignora e torna indietro',
      stayAndSave: 'Resta e salva',
      discardAndCreateNew: 'Ignora e crea nuovo',
    },
    courseDialog: {
      title: 'Modifica impostazioni del corso',
      description:
        'Seleziona un corso per modificarne i dettagli, cambiare gli orari o eliminarlo.',
      courseMeta: '{{hours}}h/settimana • priorità {{priority}}',
      noCourses: 'Nessun corso disponibile',
    },
    toast: {
      splitSuccess:
        'Sessioni lunghe divise in Pomodori! Le sessioni oltre 90 minuti sono state suddivise con pause.',
      mergeSuccess:
        'Sessioni adiacenti unite! Le sessioni della stessa materia vicine tra loro sono state combinate.',
      savedWithWeek:
        'Orario salvato! Sessioni aggiunte alla settimana {{weekId}}',
      addedToMyTimetable:
        '{{count}} sessione/i aggiunta/e al Mio orario per la settimana {{weekId}}!',
      pdfComingSoon: 'Esportazione PDF in arrivo!',
      googleCalendarConnectFirst:
        'Collegati prima a Google Calendar nelle Impostazioni',
      exportingGoogleCalendar:
        'Esportazione su Google Calendar in corso…',
      exportedGoogleCalendar:
        '{{count}} sessione/i di studio esportata/e con successo su Google Calendar!',
      failedGoogleCalendar:
        'Esportazione su Google Calendar non riuscita',
      courseUpdated:
        'Corso "{{name}}" aggiornato! Piano rigenerato.',
      cannotDeleteLastCourse:
        'Impossibile eliminare l’ultimo corso. Aggiungine prima un altro.',
      courseDeleted: 'Corso eliminato! Piano rigenerato.',
    },
  },

  terms: {
    back: 'Indietro',
    title: 'Termini di utilizzo',
    lastUpdated: 'Ultimo aggiornamento: 24 ottobre 2025',
    sections: {
      acceptance: {
        title: '1. Accettazione dei termini',
        content:
          'Accedendo e utilizzando U PLAN ("il Servizio"), accetti di essere vincolato dai termini e dalle disposizioni di questo accordo. Se non accetti questi Termini di utilizzo, ti invitiamo a non usare il Servizio.',
      },
      service: {
        title: '2. Descrizione del Servizio',
        description:
          'U PLAN fornisce agli studenti strumenti per creare, gestire e ottimizzare i propri orari. Il Servizio include:',
        items: [
          'Calendario settimanale interattivo per pianificare sessioni di studio',
          'Algoritmi di pianificazione intelligenti basati sulle priorità dei corsi',
          'Creazione e modifica manuale delle sessioni di studio',
          'Funzionalità di salvataggio e gestione degli orari',
          'Modalità scura e opzioni di personalizzazione',
        ],
      },
      accounts: {
        title: '3. Account utente',
        description:
          'Per utilizzare alcune funzionalità del Servizio, devi creare un account. Accetti di:',
        items: [
          'Fornire informazioni accurate, aggiornate e complete durante la registrazione',
          'Mantenere la sicurezza della tua password e del tuo account',
          'Informarci immediatamente di qualsiasi utilizzo non autorizzato del tuo account',
          'Assumerti la responsabilità di tutte le attività svolte con il tuo account',
        ],
      },
      storage: {
        title: '4. Dati utente e archiviazione locale',
        content:
          'Il Servizio archivia i tuoi dati localmente nel browser tramite localStorage. Questo include informazioni sull’account, orari, sessioni di studio e preferenze. Sei responsabile del backup dei tuoi dati. Non siamo responsabili per eventuali perdite di dati archiviati localmente sul tuo dispositivo.',
      },
      use: {
        title: '5. Uso accettabile',
        description: 'Accetti di non utilizzare il Servizio per:',
        items: [
          'Violare leggi o regolamenti applicabili',
          'Ledere i diritti di altri',
          'Trasmettere codice dannoso o malevolo',
          'Tentare di ottenere accesso non autorizzato al Servizio',
          'Usare il Servizio per scopi commerciali senza autorizzazione',
          'Interferire con il Servizio o con i server',
        ],
      },
      ip: {
        title: '6. Proprietà intellettuale',
        content:
          'Il Servizio e i suoi contenuti originali, funzionalità e caratteristiche appartengono a U PLAN e sono protetti dalle leggi internazionali su copyright, marchi, brevetti, segreti commerciali e altri diritti di proprietà intellettuale. L’uso del Servizio non ti conferisce alcun diritto di proprietà intellettuale.',
      },
      disclaimer: {
        title: '7. Esclusione di garanzie',
        content:
          'IL SERVIZIO È FORNITO "COSÌ COM’È" E "COME DISPONIBILE" SENZA GARANZIE DI ALCUN TIPO, ESPRESSE O IMPLICITE, INCLUSE MA NON LIMITATE ALLE GARANZIE IMPLICITE DI COMMERCIABILITÀ, IDONEITÀ A UNO SCOPO PARTICOLARE E NON VIOLAZIONE. Non garantiamo che il Servizio sarà ininterrotto, puntuale, sicuro o privo di errori.',
      },
      liability: {
        title: '8. Limitazione di responsabilità',
        content:
          'IN NESSUN CASO U PLAN, I SUOI DIRIGENTI, DIPENDENTI O AGENTI SARANNO RESPONSABILI PER DANNI INDIRETTI, INCIDENTALI, SPECIALI, CONSEQUENZIALI O PUNITIVI, INCLUSI SENZA LIMITAZIONE PERDITA DI PROFITTI, DATI, UTILIZZO O ALTRE PERDITE IMMATERIALI, DERIVANTI DAL TUO ACCESSO O USO O DALL’IMPOSSIBILITÀ DI ACCEDERE O USARE IL SERVIZIO.',
      },
      education: {
        title: '9. Finalità educativa',
        content:
          'Il Servizio è progettato per aiutare nella pianificazione dello studio e nella gestione del tempo. Non sostituisce il supporto accademico professionale. Gli orari generati dal Servizio sono suggerimenti e devono essere adattati alle esigenze e circostanze individuali.',
      },
      modifications: {
        title: '10. Modifiche al Servizio',
        content:
          'Ci riserviamo il diritto di modificare o interrompere, temporaneamente o definitivamente, il Servizio (o qualsiasi sua parte) con o senza preavviso. Accetti che non saremo responsabili verso di te o terzi per eventuali modifiche, sospensioni o interruzioni del Servizio.',
      },
      changes: {
        title: '11. Modifiche ai termini',
        content:
          'Ci riserviamo il diritto di aggiornare o modificare questi Termini di utilizzo in qualsiasi momento senza preavviso. L’uso continuato del Servizio dopo tali modifiche costituisce accettazione dei nuovi Termini. Aggiorneremo la data di "Ultimo aggiornamento" in cima a questa pagina quando verranno apportate modifiche.',
      },
      termination: {
        title: '12. Risoluzione',
        content:
          'Possiamo terminare o sospendere il tuo account e il tuo accesso al Servizio immediatamente, senza preavviso né responsabilità, per qualsiasi motivo, incluso il caso in cui tu violi questi Termini. Alla risoluzione, il tuo diritto di utilizzare il Servizio cesserà immediatamente.',
      },
      law: {
        title: '13. Legge applicabile',
        content:
          'Questi Termini sono regolati e interpretati in conformità con le leggi applicabili, senza considerare disposizioni sui conflitti di legge. Qualsiasi controversia derivante da questi Termini o dall’uso del Servizio sarà risolta tramite arbitrato vincolante.',
      },
      contact: {
        title: '14. Informazioni di contatto',
        content:
          'Se hai domande riguardo a questi Termini di utilizzo, contattaci tramite i canali di supporto dell’applicazione o la pagina impostazioni.',
      },
      consent:
        'Utilizzando U PLAN, riconosci di aver letto, compreso e accettato di essere vincolato da questi Termini di utilizzo.',
    },
  },

  dashboard: {
    refresh: 'Aggiorna',
    tasksDone: 'Valutazioni completate in tempo',
    tasks: 'attività',
    dailyOverview: 'Panoramica giornaliera',
    welcomeBack: 'Bentornato, {{name}}',
    studyHours: 'Ore di studio',
    sessions: 'Sessioni',
    upcoming: 'In arrivo',
    focusTimer: 'Timer concentrazione',
    focus: 'Concentrazione',
    break: 'Pausa',
    longBreak: 'Pausa lunga',
    timerRunning: 'Timer in esecuzione',
    timerReady: 'Pronto per iniziare',
    start: 'Avvia',
    pause: 'Pausa',
    reset: 'Reimposta',
    open: 'Apri',
    todayProgress: 'Progresso di oggi',
    studyCompletion: 'Completamento studio',
    weekGoal: 'Obiettivo settimanale',
    notSet: 'Non impostato',
    completedSessions: 'Sessioni completate',
    currentSession: 'Sessione corrente',
    noActiveSession: 'Nessuna sessione attiva',
    none: 'Nessuna',
    today: 'Oggi',
    todayShort: 'Oggi',
    calendar: 'Calendario',
    insights: 'Insight',
    fullView: 'Vista completa',
    focusView: 'Vista concentrazione',
    nextSession: 'Prossima sessione',
    live: 'In diretta',
    startsAt: 'Inizia alle {{time}}',
    noMoreSessionsToday: 'Nessun’altra sessione oggi',
    todaysScheduleProgress: 'Programma e progresso di oggi',
    totalHours: 'Ore totali',
    completed: 'Completate',
    minutesShort: 'min',
    noSessionsToday: 'Nessuna sessione pianificata per oggi',
    addSessions: 'Aggiungi sessioni',
    studyProgressOverview: 'Panoramica progresso studio',
    week: 'Settimana',
    month: 'Mese',
    completedHours: 'Ore completate',
    weeklyGoal: 'Obiettivo settimanale',
    setWeeklyGoalHint:
      'Imposta un obiettivo settimanale in Obiettivi e risultati',
    noStudyDataWeek:
      'Nessun dato di studio per questa settimana. Inizia a pianificare sessioni per monitorare i tuoi progressi.',
    deadlines: 'Scadenze',
    priority: {
      high: 'Alta',
      medium: 'Media',
      low: 'Bassa',
    },
    taskTypes: {
      assignment: 'Compito',
      exam: 'Esame',
      quiz: 'Quiz',
      project: 'Progetto',
    },
    calendarTag: 'Calendario',
    tomorrow: 'Domani',
    overdue: 'In ritardo',
    daysCount: '{{count}} giorni',
    markDone: 'Segna come fatto',
    noUpcomingDeadlines: 'Nessuna scadenza imminente',
    smartInsights: 'Insight intelligenti',
    aiRecommendations: "Raccomandazioni basate sull'IA",
    todaysRecommendations: 'Raccomandazioni di oggi',
    quickStats: 'Statistiche rapide',
    todaysHours: 'Ore di oggi',
    studyStreak: 'Serie di studio',
    completedToday: 'Completate oggi',
    nextFocusSession: 'Prossima sessione di concentrazione',
    allDoneToday: 'Hai finito tutto per oggi',
    nextSessionAt: 'Prossima sessione: {{subject}} alle {{time}}',
    considerBreak:
      'Hai studiato molto. Valuta di fare una breve pausa.',
    morningGreat:
      'Questo è un ottimo momento per uno studio concentrato.',
    focusDeadline:
      'Concentrati su {{subject}} — scadenza in avvicinamento',
    allCaughtUp: 'Tutto aggiornato. Porta avanti qualcosa.',
    thisIsBreak: 'Questa è una sessione di pausa.',
    sessionAlreadyMissed:
      'Questa sessione è già stata segnata come persa.',
    startingEarly: 'Stai iniziando "{{subject}}" in anticipo.',
    countTowardRecent:
      'Conteggiare questo tempo per la tua sessione più recente "{{recent}}" invece?',
    okCountsToward: 'OK = conta per "{{recent}}"',
    cancelStartsEarly: 'Annulla = avvia "{{subject}}" in anticipo',
    addNewTask: 'Aggiungi una nuova attività',
    addTaskDescription:
      'Crea un nuovo compito, esame, quiz o scadenza di progetto.',
    taskTitle: "Titolo dell'attività",
    taskTitlePlaceholder: 'es.: Compito di matematica capitolo 5',
    taskTitleHint:
      'Facoltativo — lascia vuoto per assegnare un nome automaticamente (es.: "{{example}}").',
    subject: 'Materia',
    selectCourse: 'Seleziona un corso',
    fillClassScheduleFirst:
      "Compila prima l'orario delle lezioni",
    priorityLocked: "La priorità è bloccata dal tuo orario",
    type: 'Tipo',
    dueDate: 'Data di scadenza',
    cancel: 'Annulla',
    addTask: 'Aggiungi attività',
    monthlyHours: 'Ore mensili',
    activeDays: 'Giorni attivi',
    dailyAverage: 'Media giornaliera',
    monthlyOverview: 'Panoramica mensile',
    bestDay: 'Giorno migliore',
    line: 'Linea',
    bar: 'Barra',
    todayLabel: 'Oggi',
    shortDays: {
      mon: 'Lun',
      tue: 'Mar',
      wed: 'Mer',
      thu: 'Gio',
      fri: 'Ven',
      sat: 'Sab',
      sun: 'Dom',
    },
    study: 'Studio',
    skipped: 'Saltate',
    missed: 'Perse',
    success: {
      taskAdded: 'Attività aggiunta con successo',
      taskUpdated: 'Attività aggiornata',
      taskDeleted: 'Attività eliminata',
      deadlineRemoved: 'Scadenza rimossa dalla sessione del calendario',
      timetableActivated: 'Orario attivato con successo',
    },
    savedTimetables: 'Orari salvati',
    viewAll: 'Vedi tutto',
    untitledTimetable: 'Orario senza titolo',
    active: 'Attivo',
    activate: 'Attiva',
    noSavedTimetables: 'Nessun orario salvato',
    createFirstTimetableHint:
      'Crea un orario e attivalo direttamente dalla tua dashboard.',
    createTimetable: 'Crea un orario',
    sessionsCount_one: '{{count}} sessione',
    sessionsCount_other: '{{count}} sessioni',
    errors: {
      missingUser: 'Utente mancante. Effettua nuovamente l’accesso.',
      missingSessionId: "La sessione non ha un identificatore.",
      failedStartSession: 'Avvio della sessione non riuscito',
      loginToAddDeadline:
        'Accedi per aggiungere scadenze',
      failedAddTask: "Aggiunta dell'attività non riuscita",
      pleaseLogin: 'Effettua l’accesso',
      failedUpdateTask:
        "Aggiornamento dell'attività non riuscito",
      failedDeleteTask: "Eliminazione dell'attività non riuscita",
      fillRequired: 'Compila tutti i campi obbligatori',
      activateUnavailable:
        "L'attivazione dell'orario non è disponibile qui",
      failedActivateTimetable:
        "Attivazione dell'orario non riuscita",
    },
    pages: {
      dashboard: 'Dashboard',
      academicTimetable: 'Orario accademico',
      scheduleGenerator: 'Generatore di piani',
      assessments: 'Valutazioni',
      studyNotes: 'Note di studio',
      collaboration: 'Collaborazione',
      performance: 'Prestazioni',
      createSchedule: 'Crea un piano',
      savedSchedules: 'Piani salvati',
    },
    sections: {
      planning: 'Pianificazione',
      academicWork: 'Lavoro accademico',
      performance: 'Prestazioni',
      system: 'Sistema',
    },
    search: {
      placeholder: 'Cerca orari, pagine, materie…',
      short: 'Cerca…',
      page: 'Pagina',
      savedTimetable: 'Orario salvato',
      inTimetable: 'in {{name}}',
      noResults: 'Nessun risultato trovato',
      noResultsWithQuery: 'Nessun risultato per "{{query}}"',
      tryDifferent: 'Prova un altro orario o un’altra materia',
    },
    actions: {
      lightMode: 'Passa alla modalità chiara',
      darkMode: 'Passa alla modalità scura',
      pomodoro: 'Apri timer Pomodoro',
    },
    notifications: {
      title: 'Notifiche',
      markAll: 'Segna tutto come letto',
      empty: 'Nessuna notifica',
    },
    user: {
      student: 'Studente',
      profile: 'Impostazioni profilo',
      planner: 'Pianificatore studente',
    },
    sidebar: {
      expand: 'Espandi barra laterale',
      collapse: 'Comprimi barra laterale',
      portal: 'Portale studente',
      workspace: 'Spazio di lavoro accademico',
    },
    footer: 'Organizza il tuo apprendimento',
  },

  workspace: {
    title: 'Spazio di lavoro',
    loading: 'Caricamento dello spazio di lavoro…',
    switch: 'Cambia spazio di lavoro',
    choose:
      'Scegli uno spazio di lavoro o apri un sottospazio',
    under: 'Sotto {{name}}',
    subworkspaces: 'Sottospazi di lavoro',
    loadingSubworkspaces: 'Caricamento dei sottospazi…',
    noSub: 'Nessun sottospazio di lavoro.',
    createSub: 'Crea un sottospazio',
    createNew: 'Crea un nuovo spazio di lavoro',
    new: 'Nuovo spazio di lavoro',
    share: 'Condividi',
    edit: 'Modifica spazio di lavoro',
    delete: 'Elimina spazio di lavoro',
    uploadAvatar: 'Carica un avatar per lo spazio di lavoro',
    searchMembers:
      'Cerca membri per nome, email o ruolo…',
    defaults: {
      name: 'Il mio spazio di studio',
      description: 'Pianificazione collaborativa dello studio',
    },
    chat: {
      welcome:
        'Benvenuto in {{name}}! Inizia a collaborare con il tuo team.',
      teamActivity: 'Attività del team',
      online: 'Online',
      onlineCount_one: '{{count}} online',
      onlineCount_other: '{{count}} online',
      activeNow: 'Attivo ora',
      lastSeen: 'Visto {{time}} fa',
      justNow: 'Proprio adesso',
      emptyTitle: 'Nessun messaggio',
      emptySubtitle: 'Inizia la conversazione',
      me: 'Io',
      edited: 'modificato',
      newMessages: 'Nuovi messaggi',
      newMessagesCount_one: '{{count}} nuovo messaggio',
      newMessagesCount_other: '{{count}} nuovi messaggi',
      quickEmojis: 'Emoji rapide',
      placeholder: 'Scrivi il tuo messaggio…',
      hint:
        'Premi Invio per inviare, Maiusc+Invio per una nuova riga',
      yesterdayAt: 'Ieri alle {{time}}',
      link: 'Link condiviso',
      confirmDeleteMessage:
        'Sei sicuro di voler eliminare questo messaggio?',
      actions: {
        send: 'Invia',
        save: 'Salva',
        cancel: 'Annulla',
        edit: 'Modifica',
        delete: 'Elimina',
        addEmoji: 'Aggiungi emoji',
        attachFile: 'Allega file',
      },
      success: {
        messageUpdated: 'Messaggio aggiornato',
        messageDeleted: 'Messaggio eliminato',
        fileShared: 'File condiviso nella chat!',
      },
      errors: {
        loadMessages: 'Caricamento dei messaggi non riuscito',
        sendMessage: 'Invio del messaggio non riuscito',
        updateMessage: 'Aggiornamento del messaggio non riuscito',
        deleteMessage: 'Eliminazione del messaggio non riuscita',
        fileTooLarge: 'La dimensione del file deve essere inferiore a 10 MB',
      },
    },
    tabs: {
      members: 'Membri',
      schedule: 'Piano',
      generate: 'Genera',
      progress: 'Progresso',
      collab: 'Collab',
      chat: 'Chat',
    },
    stats: {
      total: 'Totale membri',
      admins: 'Admin',
      members: 'Membri',
    },
    members: {
      title: 'Membri del team',
      description:
        'Gestisci accessi, permessi e ruoli dello spazio di lavoro',
      pendingRequests: 'Richieste in sospeso',
      searchPlaceholder:
        'Cerca membri per nome, email o ruolo…',
      none: 'Nessun membro trovato',
    },
    roles: {
      admin: {
        label: 'Admin',
        description: 'Può gestire membri, ruoli, impostazioni dello spazio di lavoro e qualsiasi attività, incluse quelle degli altri utenti',
      },
      member: {
        label: 'Membro',
        description: 'Può creare, modificare, spostare e commentare le attività, e può archiviare o eliminare solo le proprie attività',
      },
    },
    rolesGuide: {
      title: 'Ruoli e permessi',
      description:
        'Gli admin possono gestire tutto. I membri possono collaborare, ma non possono archiviare o eliminare le attività degli altri utenti.',
    },
    permissions: {
      manage_members: 'Gestire membri',
      delete_workspace: 'Eliminare spazio di lavoro',
      edit_workspace: 'Modificare spazio di lavoro',
      manage_roles: 'Gestire ruoli',
      chat: 'Chat',
      edit_content: 'Modificare contenuto',
    },
    presence: {
      online: 'Online',
      never: 'Mai',
      justNow: 'Proprio adesso',
      yesterday: 'Ieri',
    },
    errors: {
      missingUser:
        'ID utente mancante. Effettua nuovamente l’accesso.',
      loadFailed: 'Caricamento degli spazi di lavoro non riuscito',
      workspaceNameRequired:
        'Il nome dello spazio di lavoro è obbligatorio',
      subworkspaceNameRequired:
        'Inserisci un nome per il sottospazio di lavoro',
      createWorkspace:
        'Creazione dello spazio di lavoro non riuscita',
      createSubworkspace:
        'Creazione del sottospazio di lavoro non riuscita',
      fillFields: 'Compila tutti i campi',
      invalidEmail:
        'Inserisci un indirizzo email valido',
      invalidEmailDetailed:
        'Inserisci un indirizzo email valido (es.: utente@esempio.com)',
      memberExists:
        'Esiste già un membro con questa email',
      memberExistsDetailed:
        'Esiste già un membro con questa email in questo spazio di lavoro',
      maxAdmins:
        'Massimo 2 admin per spazio di lavoro',
      maxAdminsDetailed:
        'Massimo 2 admin per spazio di lavoro. Seleziona invece il ruolo Membro.',
      parentNotFound:
        'Spazio di lavoro padre non trovato. Aggiorna e riprova.',
      addMember: 'Aggiunta membro non riuscita',
      removeMember: 'Rimozione membro non riuscita',
      notAuthenticated: 'Utente non autenticato',
      updateRole: 'Aggiornamento ruolo non riuscito',
      updateRoleUnexpected:
        'Si è verificato un errore durante l’aggiornamento del ruolo',
      approveRequest:
        'Approvazione della richiesta non riuscita',
      rejectRequest: 'Rifiuto della richiesta non riuscito',
      cannotDeleteLast:
        'Impossibile eliminare l’ultimo spazio di lavoro',
      deleteWorkspace:
        'Eliminazione dello spazio di lavoro non riuscita',
      deleteWorkspaceUnexpected:
        'Si è verificato un errore durante l’eliminazione dello spazio di lavoro',
      updateWorkspace:
        'Aggiornamento dello spazio di lavoro non riuscito',
      imageSize:
        'La dimensione dell’immagine deve essere inferiore a 5 MB',
      imageType: 'Seleziona un file immagine',
      uploadAvatar:
        "Caricamento dell'immagine dello spazio di lavoro non riuscito",
      removeAvatar:
        "Rimozione dell'immagine dello spazio di lavoro non riuscita",
      shareFailed: 'Generazione del link di condivisione non riuscita',
      shareUnexpected:
        'Si è verificato un errore durante la generazione del link',
      disableShare:
        'Disattivazione del link di condivisione non riuscita',
      copyFailed: 'Copia del link non riuscita',
      onlyAdminsGenerate:
        'Solo gli admin dello spazio di lavoro possono generare automaticamente',
    },
    actions: {
      share: 'Genera link di condivisione',
      manageLink: 'Gestisci link',
    },
    success: {
      workspaceCreated: 'Spazio di lavoro creato',
      subworkspaceCreated: 'Sottospazio creato',
      switched: 'Passato a "{{name}}"',
      memberAdded: 'Membro aggiunto con successo',
      memberRemoved:
        '{{name}} è stato rimosso dallo spazio di lavoro',
      requestApproved:
        '{{name}} è stato approvato e aggiunto allo spazio di lavoro',
      requestRejected:
        'La richiesta di {{name}} è stata rifiutata',
      deleted: 'Lo spazio di lavoro è stato eliminato',
      updated: 'Spazio di lavoro aggiornato con successo',
      avatarUpdated:
        'Avatar dello spazio di lavoro aggiornato con successo!',
      avatarRemoved:
        'Avatar dello spazio di lavoro rimosso con successo!',
      shareCreated:
        'Link di condivisione generato con successo!',
      shareDisabled:
        'Link di condivisione disattivato (revocato)',
      linkCopied: 'Link copiato negli appunti!',
      accessOpen:
        'Tipo di accesso aggiornato: Aperto a tutti',
      accessRestricted:
        'Tipo di accesso aggiornato: Limitato al dominio',
    },
    confirm: {
      removeMember:
        'Sei sicuro di voler rimuovere {{name}} dallo spazio di lavoro?',
      deleteWorkspace:
        '⚠️ Sei sicuro di voler eliminare questo spazio di lavoro? Questa azione è irreversibile e rimuoverà tutti i membri e i dati.',
      disableShareLink:
        'Sei sicuro di voler disattivare il link di condivisione? Nessuno potrà usarlo per unirsi.',
    },
    memberCount_one: '{{count}} membro',
    memberCount_other: '{{count}} membri',
    subworkspaceCount_one: '{{count}} sottospazio',
    subworkspaceCount_other: '{{count}} sottospazi',
  },

  board: {
    title: 'Bacheca collaborativa',
    description:
      'Pianifica, assegna e monitora il lavoro con il tuo team',
    view: {
      compact: 'Compatta',
      detailed: 'Dettagliata',
    },
    sections: {
      analytics: 'Analisi attività',
      filters: 'Filtri',
    },
    stats: {
      total: 'Totale attività',
      totalCount: '{{count}} attività',
      todo: 'Da fare',
      inProgress: 'In corso',
      inProgressCount: '{{count}} in corso',
      review: 'In revisione',
      done: 'Completato',
      doneCount: '{{count}} completate',
      overdue: 'In ritardo',
    },
    actions: {
      newTask: 'Nuova attività',
      editTask: 'Modifica attività',
      createTask: 'Crea attività',
      updateTask: 'Aggiorna attività',
      cancel: 'Annulla',
      processing: 'Elaborazione...',
      archive: 'Archivia attività',
      restore: 'Ripristina',
      deletePermanent: 'Elimina definitivamente',
    },
    rules: {
      description: 'Regole rapide del flusso di lavoro condiviso.',
      ownership: {
        title: 'Proprietà delle attività',
        label: 'Condivise per impostazione predefinita',
        body: 'Qualsiasi membro dello spazio di lavoro può creare attività, assegnare lavoro, commentare e spostare le attività tra le colonne.',
      },
      workflow: {
        title: 'Fasi del flusso',
        label: 'Da fare -> Completato',
        body: 'Sposta il lavoro da Da fare a In corso, poi In revisione e infine Completato, così la bacheca riflette lo stato reale del progetto.',
      },
      archive: {
        title: 'Archiviazione',
        label: 'Solo attività proprie',
        body: 'I membri possono archiviare o eliminare definitivamente solo le attività che hanno creato. Le attività archiviate possono ancora essere ripristinate.',
      },
      admin: {
        title: 'Controllo admin',
        label: 'Gestione dello spazio',
        body: 'Gli admin dello spazio di lavoro possono ripulire la bacheca, archiviare tutte le attività, eliminare qualsiasi attività e gestire l\'accesso a livello di spazio.',
      },
    },
    dialogs: {
      archiveTaskTitle: 'Archivia attività',
      archiveTaskDescription: 'Questa attività verrà spostata nell\'archivio. Per continuare, digita {{phrase}} qui sotto.',
      deleteAllActiveTitle: 'Elimina tutte le attività attive',
      deleteAllActiveDescription: 'Questo rimuove definitivamente tutte le attività attive in questo spazio di lavoro. Digita {{phrase}} per confermare.',
      deleteArchivedTitle: 'Elimina attività archiviata',
      deleteArchivedDescription: 'Questo elimina definitivamente l\'attività archiviata e non può essere annullato. Digita {{phrase}} per continuare.',
      archiveAllTitle: 'Archivia tutte le attività',
      archiveAllDescription: 'Tutte le attività attive verranno spostate nell\'archivio. Digita {{phrase}} per confermare questa azione massiva.',
      deleteAllArchivedTitle: 'Elimina tutte le attività archiviate',
      deleteAllArchivedDescription: 'Questo elimina definitivamente tutte le attività archiviate. Questa azione non può essere annullata. Digita {{phrase}} per continuare.',
    },
    delete: {
      confirmationPhrase: 'Frase di conferma',
      typePhraseToContinue: 'Digita la frase per continuare',
    },
    filters: {
      search: 'Cerca attività…',
      allPriorities: 'Tutte le priorità',
      allMembers: 'Tutti i membri',
      unassigned: 'Non assegnato',
    },
    columns: {
      todo: 'Da fare',
      inProgress: 'In corso',
      review: 'Revisione',
      done: 'Completato',
    },
    priority: {
      low: 'Bassa',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente',
    },
    task: {
      title: 'Titolo',
      description: 'Descrizione',
      status: 'Stato',
      priority: 'Priorità',
      assignee: 'Assegnato a',
      dueDate: 'Data di scadenza',
      labels: 'Etichette',
      addLabel: 'Aggiungi etichetta…',
      addHint: 'Aggiungi un’attività per iniziare',
      noTasks: 'Nessuna attività',
      selectAssignee: 'Seleziona un assegnatario…',
      you: 'Tu',
      deadlineLocked: 'Scadenza bloccata',
    },
    dates: {
      today: 'Oggi',
      tomorrow: 'Domani',
      yesterday: 'Ieri',
      overdue: 'In ritardo',
    },
    archive: {
      title: 'Attività archiviate',
      empty: 'Nessuna attività archiviata',
      archiveAll: 'Archivia tutto',
      deleteAllActive: 'Elimina tutte le attività',
      deleteAll: 'Elimina tutto',
      restore: 'Ripristina',
      deletePermanent: 'Elimina definitivamente',
      archived: 'Attività archiviata',
      restored: "Attività ripristinata in Da fare",
      deleted: 'Attività eliminata definitivamente',
      allActiveDeleted: 'Tutte le attività attive eliminate',
      allArchived: 'Tutte le attività archiviate',
      allDeleted: 'Tutte le attività archiviate eliminate',
      confirmDelete:
        'Sei sicuro di voler eliminare definitivamente questa attività?',
      confirmDeleteAll:
        'Eliminare definitivamente TUTTE le attività archiviate?',
    },
    messages: {
      created: 'Attività creata con successo',
      updated: 'Attività aggiornata con successo',
      deleted: 'Attività eliminata con successo',
      moved: 'Attività spostata con successo',
      errorLoad: 'Caricamento attività non riuscito',
      errorCreate: 'Creazione attività non riuscita',
      errorUpdate: 'Aggiornamento attività non riuscito',
      errorMove: 'Spostamento attività non riuscito',
      errorDelete: 'Eliminazione attività non riuscita',
      errorRestore: 'Ripristino attività non riuscito',
      errorArchiveAll:
        'Archiviazione di tutte le attività non riuscita',
      errorDeleteAllArchived:
        'Eliminazione di tutte le attività archiviate non riuscita',
      errorAdminOnly:
        'Solo gli admin possono eseguire questa azione per tutto lo spazio di lavoro',
      errorDeletePermission:
        'Solo gli admin o i creatori possono archiviare o eliminare questa attività',
      errorDeadlineLocked:
        'Le attività con una scadenza possono essere archiviate o eliminate solo dopo che la data è passata.',
    },
  },

  homepage: {
    product: {
      heading: 'Un modo piu chiaro per pianificare, adattarsi e progredire',
      description:
        'UPLAN e progettato come un sistema di produttivita moderno: strutturato, adattivo e focalizzato sui progressi reali.',
    },
    hero: {
      badge:
        'Progettato per studenti che vogliono chiarezza, non caos',
      titleLine1: 'Pianifica in modo più intelligente.',
      titleLine2: 'Studia con meno stress.',
      description1:
        'U PLAN crea automaticamente il tuo orario attorno a esami, lezioni, scadenze e al tuo vero tempo libero.',
      description2:
        'Niente più dubbi su quando studiare. Niente più giornate sovraccariche. Un piano flessibile e personalizzato che funziona davvero.',
      getStarted: 'Inizia',
      seeFeatures: 'Vedi funzionalità',
      studentStudyingAlt: 'Studente che studia',
      cards: {
        autoTimetables: {
          title: 'Orari automatici',
          description: 'Generati attorno alla tua agenda reale',
        },
        deadlineAware: {
          title: 'Attento alle scadenze',
          description: 'Pianifica attorno a esami e compiti',
        },
        flexible: {
          title: 'Flessibile',
          description: 'Si adatta quando la vita si fa intensa',
        },
      },
    },
    mockup: {
      todayPlan: 'Piano di oggi',
      organizedAutomatically: 'Organizzato automaticamente',
      smart: 'Intelligente',
      mathRevision: 'Ripasso matematica',
      priorityHigh: 'Priorità: Alta',
      physicsQuizPrep: 'Preparazione quiz di fisica',
      deadlineTomorrow: 'Scadenza domani',
      thisWeek: 'Questa settimana',
      sessions: 'Sessioni',
      deadlines: 'Scadenze',
      planned: 'Pianificato',
      phoneFirst: 'Progettato per essere perfetto prima di tutto sul tuo telefono.',
    },
    about: {
      title: 'Informazioni su U PLAN',
      subtitle:
        'Aiutare gli studenti a gestire il proprio tempo con chiarezza e sicurezza',
      missionTitle: 'La nostra missione',
      missionParagraph1:
        'Abbiamo creato U PLAN per rendere lo studio più organizzato, flessibile e realistico. Gli studenti hanno già abbastanza pressione — il tuo strumento di pianificazione dovrebbe ridurre lo stress, non aumentarlo.',
      missionParagraph2:
        "Combinando automazione intelligente e design centrato sullo studente, U PLAN ti aiuta a integrare lo studio attorno a esami, lezioni, scadenze e vita fuori dalla scuola.",
      startJourney: 'Inizia il tuo percorso',
      studentsStudyingTogetherAlt: 'Studenti che studiano insieme',
    },
    values: {
      title: 'In cosa crediamo',
      subtitle:
        'I principi dietro ogni funzionalità che sviluppiamo',
      phoneAlt: 'App mobile U PLAN',
      mobilePreview: 'Anteprima mobile',
      clearDailyPlan: 'La giornata chiara a colpo d’occhio',
      vision: {
        title: 'Visione',
        description:
          'Gestione intelligente del tempo per ogni studente',
      },
      team: {
        title: 'Team',
        description:
          'Creato da persone che comprendono in prima persona la pressione della vita studentesca',
      },
      innovation: {
        title: 'Innovazione',
        description:
          'IA pratica che aiuta gli studenti a passare all’azione',
      },
      studentFirst: {
        title: 'Lo studente prima di tutto',
        description:
          'Ogni decisione è progettata attorno ai bisogni reali degli studenti',
      },
    },
    whyChoose: {
      title: 'Perché gli studenti scelgono U PLAN',
      paragraph1:
        'U PLAN è stato progettato per la realtà della vita studentesca: scadenze che cambiano, programmi variabili, più materie e energia limitata. I pianificatori tradizionali non si adattano. Noi sì.',
      paragraph2:
        'Che tu stia preparando esami finali, gestendo più corsi o cercando di essere costante senza esaurirti, U PLAN ti aiuta a studiare con più struttura e meno improvvisazione.',
    },
    featuresSection: {
      title: 'Funzionalità principali',
      subtitle:
        'Tutto ciò di cui hai bisogno per avere successo accademico',
    },
    features: {
      smartScheduling: {
        title: 'Pianificazione intelligente',
        description:
          'Ottimizza automaticamente il tuo tempo di studio in base a priorità e scadenze',
      },
      timeManagement: {
        title: 'Gestione del tempo',
        description:
          'Tieni traccia delle sessioni di studio e migliora la tua produttività',
      },
      progressTracking: {
        title: 'Monitoraggio dei progressi',
        description:
          'Monitora il tuo percorso di apprendimento con analisi dettagliate',
      },
      aiPowered: {
        title: "Basato sull'IA",
        description:
          'Raccomandazioni intelligenti basate sulle tue abitudini di studio',
      },
      subjectBalance: {
        title: 'Equilibrio tra materie',
        description:
          'Assicura attenzione equa a tutti i tuoi corsi',
      },
      adaptiveLearning: {
        title: 'Apprendimento adattivo',
        description:
          'Si adatta al tuo ritmo e stile di apprendimento',
      },
    },
    servicesSection: {
      title: 'Cosa puoi fare',
      subtitle:
        'Tutto ciò di cui hai bisogno per pianificare, monitorare e migliorare la tua routine di studio',
      ctaTitle: 'Pronto a studiare con un piano migliore?',
      ctaDescription:
        'Unisciti a U PLAN e trasforma il tuo programma in un sistema di studio realistico e personalizzato.',
      startNow: 'Inizia ora',
    },
    services: {
      smartTimetableGeneration: {
        title: 'Generazione intelligente dell’orario',
        description:
          'Crea automaticamente un piano di studio personalizzato basato sui tuoi dati (date degli esami, ore libere, obiettivi, ecc.). Il nostro algoritmo intelligente considera il tuo programma, le tue priorità e le tue abitudini di apprendimento per generare un orario ottimale.',
        features: {
          conflictFreeScheduling: 'Pianificazione senza conflitti',
          priorityBasedPlanning:
            'Pianificazione basata sulle priorità',
          customizableStudyBlocks:
            'Blocchi di studio personalizzabili',
          exportToCalendarApps:
            'Esporta nelle app calendario',
        },
      },
      adaptiveUpdates: {
        title: 'Aggiornamenti adattivi',
        description:
          'Se salti o completi delle sessioni, il sistema adatta automaticamente il tuo orario. La vita succede — la nostra piattaforma lo capisce e si adatta in tempo reale per aiutarti a restare in carreggiata.',
        features: {
          realTimeRescheduling: 'Ripianificazione in tempo reale',
          automaticDeadlineAdjustments:
            'Adattamenti automatici delle scadenze',
          flexibleSessionManagement:
            'Gestione flessibile delle sessioni',
          smartRecoveryPlanning:
            'Pianificazione intelligente del recupero',
        },
      },
      progressTracking: {
        title: 'Monitoraggio dei progressi',
        description:
          'Monitora i tuoi progressi giornalieri e settimanali per restare motivato. Visualizza i tuoi risultati, individua le tendenze e celebra i traguardi mentre avanzi verso i tuoi obiettivi.',
        features: {
          dailyStudyLogs: 'Registri di studio giornalieri',
          weeklyProgressReports:
            'Report settimanali dei progressi',
          achievementBadges: 'Badge di risultato',
          productivityInsights: 'Insight di produttività',
        },
      },
      examClassIntegration: {
        title: 'Integrazione esami e lezioni',
        description:
          'Importa il tuo calendario di esami e delle lezioni per un piano senza conflitti. Integra perfettamente il tuo calendario accademico per garantire una distribuzione ottimale del tempo di studio.',
        features: {
          calendarSynchronization:
            'Sincronizzazione del calendario',
          examCountdownTimers:
            'Conto alla rovescia per gli esami',
          classConflictDetection:
            'Rilevamento conflitti con le lezioni',
          automaticBufferTimes:
            'Tempi cuscinetto automatici',
        },
      },
    },
    collaborationSection: {
      badge: '🤝 Funzionalità di squadra',
      title: 'Progettato per la collaborazione di team',
      subtitle:
        'Crea gruppi di studio, gestisci membri e collabora facilmente in spazi di lavoro condivisi',
    },
    collaborationFeatures: {
      teamCollaborationWorkspaces: {
        title: 'Spazi di lavoro collaborativi',
        description:
          'Crea spazi dedicati per gruppi di studio, team di progetto o classi. Organizza i membri con controllo di accesso basato sui ruoli (Admin/Membro) e gestisci i permessi senza sforzo.',
      },
      smartMemberSharing: {
        title: 'Condivisione intelligente dei membri',
        description:
          'Genera link di condivisione sicuri per invitare membri. Controlla l’accesso con impostazioni aperte o limitate al dominio. La funzione richieste in sospeso garantisce una crescita controllata dello spazio di lavoro.',
      },
      integratedTeamChat: {
        title: 'Chat di team integrata',
        description:
          'Comunica con i membri del team direttamente negli spazi di lavoro. La messaggistica in tempo reale mantiene le discussioni organizzate e contestualizzate alla tua pianificazione collaborativa.',
      },
      hierarchicalSubworkspaces: {
        title: 'Sottospazi gerarchici',
        description:
          'Organizza strutture di team complesse con sottospazi. Crea gerarchie padre-figlio per dipartimenti, progetti o gruppi di studio con permessi membri ereditati.',
      },
      teamProgressDashboard: {
        title: 'Dashboard del progresso del team',
        description:
          'Monitora il progresso individuale e collettivo. Tieni traccia del completamento delle sessioni, delle scadenze imminenti e delle metriche di produttività del team in tempo reale.',
      },
      workspaceCustomization: {
        title: 'Personalizzazione dello spazio di lavoro',
        description:
          'Carica avatar, imposta permessi, gestisci le impostazioni di condivisione e configura i diritti di modifica degli orari. Controllo totale del tuo ambiente collaborativo.',
      },
    },
    testimonialsSection: {
      badge: '⭐ Testimonianze di successo',
      title: 'Cosa dicono gli studenti',
      subtitle:
        'Unisciti a migliaia di studenti che hanno trasformato il loro percorso accademico',
    },
    testimonials: {
      emily: {
        role: 'Studentessa di ingegneria',
        text:
          'Le funzionalità workspace di U PLAN hanno trasformato il nostro gruppo di studio. Siamo passati da email caotiche a una collaborazione organizzata. La mia media è aumentata di 0,7 punti!',
        highlight:
          'La migliore decisione per lo studio di gruppo',
      },
      james: {
        role: 'Studente di informatica',
        text:
          'La pianificazione basata sull’IA è incredibile. Bilancia perfettamente il mio carico di lavoro e gli strumenti di collaborazione rendono i progetti di gruppo semplicissimi. Lo consiglio vivamente!',
        highlight:
          'Una svolta per la gestione accademica',
      },
      sophia: {
        role: 'Studentessa di medicina',
        text:
          'Gestire più gruppi di studio era un incubo. Con i sottospazi di U PLAN e il monitoraggio dei progressi in tempo reale, tutto è fluido. Ho persino tempo per la mia vita sociale!',
        highlight:
          'Perfetto per programmi complessi',
      },
      marcus: {
        role: 'Studente di economia aziendale',
        text:
          'La chat dello spazio di lavoro e le funzionalità della bacheca collaborativa sono fantastiche. La produttività del nostro gruppo di studio è aumentata del 40%. L’orario condiviso mantiene tutti responsabili.',
        highlight:
          'Ha trasformato la produttività del team',
      },
      lisa: {
        role: 'Studentessa di giurisprudenza',
        text:
          'U PLAN mi ha aiutata a organizzare il mio intenso programma di studio mantenendo attivo anche il mio gruppo di studio. La dashboard del team è preziosa per monitorare il progresso collettivo.',
        highlight:
          'Essenziale per lo studio di gruppo',
      },
      david: {
        role: 'Laureato in economia',
        text:
          'Lo strumento di pianificazione dello studio più intelligente che abbia mai usato. L’automazione dello spazio di lavoro mi ha fatto risparmiare oltre 10 ore a settimana. Ho superato con facilità il mio esame di qualificazione in economia!',
        highlight:
          'Trasformativo a livello accademico',
      },
    },
    stats: {
      activeStudents: 'Studenti attivi',
      hoursPlanned: 'Ore pianificate',
      successRate: 'Tasso di successo',
      averageRating: 'Valutazione media',
    },
    actions: {
      seePlans: 'Vedi piani',
    },
    errors: {
      planLinkMissing: 'Il link di pagamento/contatto non è ancora configurato. Aggiungilo in frontend/UPLAN/.env.',
    },
    phone: {
      kicker: 'Orario di studio',
      today: 'Oggi',
      nextFocus: 'Prossimo focus',
      chemistryReview: 'Ripasso chimica',
      weekdays: {
        mon: 'L',
        tue: 'M',
        wed: 'M',
        thu: 'G',
        fri: 'V',
      },
      sessions: {
        math: {
          title: 'Ripasso matematica',
          label: 'Priorità alta',
        },
        physics: {
          title: 'Preparazione fisica',
          label: 'Scadenza domani',
        },
        essay: {
          title: 'Bozza del saggio',
          label: 'Blocco scrittura',
        },
      },
      nav: {
        plan: 'Piano',
        progress: 'Progressi',
        tasks: 'Attività',
      },
    },
    demo: {
      badge: 'Accesso demo premium',
      title: 'Prenota la demo',
      description1:
        'Questa demo mostra l’esperienza completa di UPLAN, con una panoramica delle funzionalità principali, dei workflow premium e delle capacità avanzate.',
      description2:
        'Invece di un’anteprima limitata, la demo evidenzia il valore reale del prodotto per pianificazione, monitoraggio dei progressi, collaborazione e organizzazione accademica.',
      includedTitle: 'Cosa include',
      includes: {
        walkthrough: 'Tour completo dell’applicazione',
        premium: 'Esperienza premium guidata',
        advanced: 'Funzionalità e workflow avanzati',
        useCases: 'Casi d’uso accademici reali',
      },
      replyTime: 'Di solito rispondiamo entro 24 ore',
      emailLabel: 'Email',
      contactMeta: 'Nessun impegno. Risposta rapida. Accesso diretto.',
      requestDemo: 'Richiedi demo',
      contactNote:
        'Puoi richiedere una demo personalizzata, fare domande sul prodotto o discutere direttamente opportunità di partnership.',
    },
    finalCta: {
      title: 'Inizia oggi la tua trasformazione accademica',
      description:
        'Unisciti a studenti delle migliori università che hanno migliorato i loro voti, bilanciato il carico di lavoro e raggiunto i loro obiettivi accademici con U PLAN.',
      startFreeTrial: 'Inizia prova gratuita',
      bookDemo: 'Prenota una demo',
      footer:
        'Nessuna carta di credito richiesta • Gratis per 14 giorni • Annulla in qualsiasi momento',
    },
  },
  directMessages: {
    title: 'Messaggi',
    subtitle: 'Conversazioni private con gli amici.',
    loading: {
      conversations: 'Caricamento conversazioni...',
      conversation: 'Caricamento conversazione...',
      profile: 'Caricamento profilo...',
    },
    empty: {
      noConversations: 'Apri il tuo profilo, copia il link del profilo e condividilo con la persona a cui vuoi scrivere.',
      noMessages: 'Invia il primo messaggio privato.',
      chooseConversation: 'Scegli una conversazione',
      chooseConversationDescription: 'Gli amici accettati compaiono qui. Usa il link del tuo profilo per collegarti a qualcuno di nuovo.',
    },
    actions: {
      profile: 'Profilo',
      profileShort: 'Profilo',
      info: 'Info',
      pin: 'Fissa',
      pinned: 'Fissato',
      saveNickname: 'Salva soprannome',
      addFriend: 'Aggiungi amico',
      acceptRequest: 'Accetta richiesta',
      accept: 'Accetta',
      message: 'Messaggio',
      copyProfileLink: 'Copia link profilo',
      editSharedProfile: 'Modifica profilo condiviso',
      copyAgain: 'Copia di nuovo',
      saveSharedProfile: 'Salva profilo condiviso',
    },
    placeholders: {
      nickname: 'Aggiungi un soprannome per questo amico',
      message: 'Scrivi al tuo amico...',
      fullName: 'Il tuo nome',
      username: 'username',
    },
    quickReplies: {
      label: 'Risposte rapide',
      ok: 'OK',
      nice: 'Bene',
      done: 'Fatto',
      thanks: 'Grazie',
    },
    templates: {
      studyCheckIn: 'Possiamo rivedere il piano di questa settimana?',
      meetup: 'Sei libero per studiare insieme piu tardi oggi?',
      followUp: 'Un rapido seguito all ultimo messaggio.',
    },
    presence: {
      online: 'Online',
      offline: 'Offline',
      justNow: 'Proprio ora',
      minutesAgo: '{{count}} min fa',
      hoursAgo: '{{count}} h fa',
      daysAgo: '{{count}} g fa',
    },
    defaults: {
      friend: 'Amico',
      profileTitle: 'Pianificatore di studio',
      username: 'uplan-user',
      noSessions: 'Nessuna sessione completata',
      recently: 'Di recente',
    },
    states: {
      sending: 'Invio...',
      saving: 'Salvataggio...',
    },
    status: {
      self: 'Tu',
      none: 'Non collegato',
      friends: 'Amici',
      pendingSent: 'Richiesta inviata',
      pendingReceived: 'Richiesta ricevuta',
    },
    profile: {
      title: 'Profilo',
      description: 'Foto, sfondo, stato della connessione e produttivita di studio.',
      joined: 'Iscritto a UPLAN',
      hoursCompleted: 'Ore completate',
      mostProductiveWeek: 'Settimana piu produttiva',
      mostProductiveMonth: 'Mese piu produttivo',
      connection: 'Connessione',
    },
    edit: {
      title: 'Impostazioni del profilo condiviso con gli amici',
      description: 'Questi dettagli appaiono quando gli amici aprono il tuo profilo dai messaggi.',
      profileTitle: 'Titolo profilo',
      backgroundTitle: 'Design dello sfondo',
      backgroundDescription: 'Scegli un motivo creato a mano per la scheda profilo.',
    },
    backgrounds: {
      blueprint: 'Scrivania tecnica',
      constellation: 'Note notturne',
      paperplane: 'Volo di carta',
      rings: 'Anelli di studio',
      lab: 'Pannello laboratorio',
    },
    friends: {
      title: 'Amici',
      description: 'Amici accettati e richieste in sospeso collegate a questo account.',
      empty: 'Non hai ancora amici. Copia il link del tuo profilo e condividilo.',
      since: 'Amici dal {{date}}',
      requestSent: 'Richiesta inviata',
      requestReceived: 'Richiesta ricevuta',
    },
    success: {
      profileLinkCopied: 'Link del profilo copiato.',
      friendRequestSent: 'Richiesta di amicizia inviata.',
      friendRequestAccepted: 'Richiesta di amicizia accettata.',
      profileUpdated: 'Profilo condiviso aggiornato.',
      friendAdded: 'Amico aggiunto.',
      chatHidden: 'Chat nascosta dal tuo elenco.',
    },
    errors: {
      loginRequired: 'Accedi di nuovo per continuare.',
      friendsOnly: 'I messaggi privati sono disponibili solo con amici accettati.',
      loadMessages: 'Impossibile caricare i messaggi in questo momento.',
      loadProfile: 'Impossibile aprire questo profilo in questo momento.',
      createProfileLink: 'Impossibile creare il link del profilo in questo momento.',
      sendFriendRequest: 'Impossibile inviare la richiesta di amicizia in questo momento.',
      acceptFriendRequest: 'Impossibile accettare la richiesta di amicizia in questo momento.',
      updateProfile: 'Impossibile salvare il profilo condiviso in questo momento.',
      loadConversation: 'Impossibile caricare questa conversazione in questo momento.',
      sendMessage: 'Impossibile inviare il messaggio in questo momento.',
      updateConversation: 'Impossibile aggiornare questa conversazione in questo momento.',
      acceptProfileLink: 'Impossibile usare questo link del profilo in questo momento.',
    },
  },
  postSignupQuestionnaire: {
    kicker: 'Configurazione profilo',
    title: 'Completa il tuo profilo',
    description: 'Benvenuto in U PLAN. Rispondi a poche domande rapide per avere un profilo curato fin dall\'inizio. Queste informazioni appariranno sul tuo profilo.',
    noteTitle: 'Visibile sul tuo profilo',
    noteBody: 'Il tuo nome completo resta fisso dopo la registrazione. Potrai aggiornare il resto piu tardi dal tuo profilo o dal profilo condiviso in Messaggi.',
    questionsBadge: 'Domanda {{current}} di {{total}}',
    inputTitle: 'La tua risposta',
    actions: {
      skipQuestion: 'Salta domanda',
      skipQuestionnaire: 'Salta questionario',
      nextQuestion: 'Domanda successiva',
      saveAndContinue: 'Salva e continua',
      saving: 'Salvataggio...',
    },
    questions: {
      fullName: {
        label: 'Nome completo',
        helper: 'Benvenuto. Questo e il nome completo salvato durante la registrazione e mostrato nel tuo profilo. Non puo essere modificato dopo.',
        placeholder: 'Il tuo nome completo',
      },
      profileTitle: {
        label: 'Titolo del profilo',
        helper: 'Aggiungi una breve riga per aiutare gli altri a capire chi sei quando aprono il tuo profilo.',
        placeholder: 'Per esempio: Studente di informatica',
      },
      role: {
        label: 'Ruolo',
        helper: 'Scegli il ruolo che ti rappresenta meglio. Apparira nel tuo profilo.',
        placeholder: 'Seleziona il tuo ruolo',
      },
      otherRoleInfo: {
        label: 'Dicci di piu',
        helper: 'Se nessun ruolo standard ti rappresenta, inserisci le informazioni del ruolo che vuoi mostrare nel profilo.',
        placeholder: 'Per esempio: Assistente di ricerca',
      },
    },
    roleOptions: {
      student: 'Studente',
      administrator: 'Amministratore',
      teacher: 'Insegnante',
      other: 'Altro',
    },
    preview: {
      kicker: 'Anteprima profilo',
      defaultName: 'Il tuo nome',
      defaultTitle: 'Il tuo titolo del profilo',
      defaultDepartment: 'Il tuo ruolo',
      visibilityTitle: 'Come apparira',
      visibilityBody: 'Questi dettagli vengono mostrati nella tua scheda profilo e nelle viste profilo dell\'app.',
      editLaterTitle: 'Modificabile in seguito',
      editLaterBody: 'Potrai aggiornare questi dettagli in seguito quando cambiera il tuo ruolo o il tuo titolo.',
    },
    success: {
      saved: 'Dettagli profilo salvati.',
    },
    errors: {
      notLoggedIn: 'Devi effettuare l\'accesso per salvare i dettagli del profilo.',
      otherRoleRequired: 'Inserisci le informazioni del ruolo che vuoi mostrare nel tuo profilo.',
      saveFailed: 'Impossibile salvare i dettagli del profilo in questo momento.',
    },
  },
  welcomeOverlay: {
    alt: 'Benvenuto',
    close: 'Chiudi benvenuto',
    badge: 'Configurazione guidata',
    headline: 'Configura il tuo spazio di studio in meno di un minuto.',
    step: 'Passaggio',
    body: 'Ti guideremo attraverso l\'essenziale con un tour rapido cosi potrai generare un orario di studio chiaro in pochi minuti.',
    cards: {
      profile: 'Profilo pronto',
      schedule: 'Orario configurato',
      progress: 'Monitoraggio progressi',
    },
  },
  tourOverlay: {
    title: 'Introduzione',
    note: 'L\'area evidenziata e l\'azione da esaminare prima di continuare.',
    success: 'Tour completato. Sei pronto per usare U PLAN.',
    actions: {
      close: 'Chiudi tour',
      skip: 'Salta',
      done: 'Fine',
    },
    pages: {
      dashboard: 'Dashboard',
      settings: 'Impostazioni',
      autoGenerate: 'Generazione automatica',
      myTimetable: 'Il mio orario',
      goals: 'Obiettivi',
      workspace: 'Spazio di lavoro',
      default: 'U PLAN',
    },
    steps: {
      profile: {
        title: 'Il tuo profilo e le impostazioni',
        body: 'Apri il menu del tuo nome e avatar per accedere alle impostazioni del profilo e mantenere aggiornate le informazioni del tuo account.',
      },
      settings: {
        title: 'Modifica il tuo profilo',
        body: 'Apri **Impostazioni** dalla barra laterale, poi usa **Modifica profilo** per aggiornare nome, dettagli professionali, foto e informazioni dell\'account.',
      },
      studyWindow: {
        title: 'Finestra di studio',
        body: 'Definisci le ore in cui puoi studiare in modo che l\'orario generato segua la tua routine reale e i periodi d\'esame.',
      },
      classSchedule: {
        title: 'Orario lezioni e priorita',
        body: 'Aggiungi le tue lezioni e assegna priorita cosi i corsi piu importanti ricevano una copertura di studio migliore.',
      },
      busyTime: {
        title: 'Tempo occupato',
        body: 'Blocca lavoro, commissioni e impegni personali cosi il generatore non inserira sessioni di studio sopra di essi.',
      },
      generate: {
        title: 'Genera il tuo piano',
        body: 'Genera crea le sessioni di studio della settimana usando le regole e le preferenze impostate sopra.',
      },
      timetable: {
        title: 'Il mio orario',
        body: 'Questo e il tuo piano di studio settimanale. Puoi spostare le sessioni, rifinire i blocchi orari e mantenere la settimana coerente con la tua routine.',
      },
      today: {
        title: 'Sessioni di oggi',
        body: 'La vista giornaliera ti mantiene concentrato. Avvia la sessione corrente e gestisci cio che viene dopo senza perdere ritmo.',
      },
      assessments: {
        title: 'Valutazioni e scadenze',
        body: 'Gestisci qui esami, test e compiti cosi le scadenze influenzano la pianificazione durante le settimane piu intense.',
      },
      goalsWeek: {
        title: 'Questa settimana',
        body: 'Controlla quante sessioni sono programmate questa settimana in base al tuo orario.',
      },
      deadlines: {
        title: 'Prossime scadenze',
        body: 'Usa quest\'area per vedere cosa sta per arrivare e restare in anticipo sulla prossima consegna o sul prossimo esame importante.',
      },
      progress: {
        title: 'Progresso e serie',
        body: 'Monitora le ore completate e la tua serie per mantenere visibile l\'andamento nel tempo.',
      },
      todaySession: {
        title: 'Sessione di oggi',
        body: 'Controlla le sessioni di oggi ed espandile quando ti servono piu dettagli o azioni rapide.',
      },
      weeklyGoals: {
        title: 'Obiettivi settimanali e completamenti',
        body: 'Imposta obiettivi settimanali, proteggi la tua serie e monitora le scadenze completate man mano che avanzi.',
      },
      workspace: {
        title: 'Intestazione dello spazio di lavoro',
        body: 'Questa intestazione mostra lo spazio attivo, i membri e le azioni rapide. Cambia spazio qui e usa le schede sotto per navigare all\'interno dello spazio.',
      },
    },
  },
  app: {
    toasts: {
      signedInWithGoogle: 'Accesso con Google completato',
      freePlanSelected: 'Piano gratuito selezionato',
      paymentLinkMissing: 'Il link di pagamento non e ancora configurato. Aggiungilo in frontend/UPLAN/.env.',
      noAdminAccess: "Non hai accesso all'area amministrazione.",
    },
    welcome: {
      title: 'Benvenuto in U PLAN',
      body:
        "Pronto a trasformare lo stress scolastico in un piano chiaro?\n\nNei prossimi 60 secondi ti mostreremo dove:\n- aggiornare il profilo\n- generare un orario ordinato\n- seguire le sessioni di oggi\n\nTocca Avanti per iniziare.",
    },
  },
};

export default it;
