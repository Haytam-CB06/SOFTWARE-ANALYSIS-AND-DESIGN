const spanishOverrides = {
  common: {
    admin: 'Administrador',
    total: 'Total',
    settings: 'Configuración',
    logout: 'Cerrar sesión',
    open: 'Abrir',
    new: 'Nuevo',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    loading: 'Cargyo...',
  },
  dashboard: {
    user: {
      student: 'Estudiante',
      profile: 'Perfil',
      planner: 'Planificador',
    },
    sidebar: {
      portal: 'Portal',
      expand: 'Expandir barra lateral',
      collapse: 'Contraer barra lateral',
    },
    search: {
      short: 'Buscar...',
      noResults: 'Sin resultados',
    },
    actions: {
      lightMode: 'Modo claro',
      darkMode: 'Modo oscuro',
    },
    pages: {
      dashboard: 'Panel',
      academicTimetable: 'Horario académico',
      autoGenerate: 'Generar con IA',
      assessmentsDeadlines: 'Evaluaciones y fechas',
      progress: 'Progreso',
      workspaces: 'Espacios',
      settings: 'Configuración',
    },
    footer: 'Planificador de estudio con IA',
    study: 'Estudio',
    todayShort: 'Hoy',
    tomorrow: 'Mañana',
    overdue: 'Vencido',
    daysCount: '{{count}} días',
    thisIsBreak: 'Este bloque es un descanso.',
    success: {
      timetableActivated: 'Horario activado.',
      taskAdded: 'Fecha agregada.',
      taskUpdated: 'Fecha actualizada.',
      deadlineRemoved: 'Fecha eliminada.',
      taskDeleted: 'Tarea eliminada.',
    },
    errors: {
      activateUnavailable: 'No se pudo activar este horario.',
      failedActivateTimetable: 'No se pudo activar el horario.',
      missingUser: 'Falta el usuario.',
      missingSessionId: 'Falta el ID de sesión.',
      failedStartSession: 'No se pudo iniciar la sesión.',
      loginToAddDeadline: 'Inicia sesión para agregar una fecha.',
      failedAddTask: 'No se pudo agregar la tarea.',
      pleaseLogin: 'Inicia sesión.',
      failedUpdateTask: 'No se pudo actualizar la tarea.',
      failedDeleteTask: 'No se pudo eliminar la tarea.',
      fillRequired: 'Completa los campos obligatorios.',
    },
  },
  workspace: {
    loading: 'Cargyo espacio...',
    switch: 'Cambiar espacio',
    choose: 'Elige un espacio o subespacio',
    createNew: 'Crear espacio',
    createSub: 'Crear subespacio',
    subworkspaces: 'Subespacios',
    under: 'Debajo de {{name}}',
    loadingSubworkspaces: 'Cargyo subespacios...',
    noSub: 'Sin subespacios todavía',
    tabs: {
      members: 'Miembros',
      schedule: 'Horario',
      generate: 'Generar',
      progress: 'Progreso',
      collab: 'Colaboración',
      chat: 'Chat',
    },
    stats: {
      total: 'Miembros totales',
      admins: 'Administradores',
      members: 'Miembros',
    },
    roles: {
      admin: {
        label: 'Administrador',
        description: 'Gestiona miembros, roles y ajustes',
      },
      member: {
        label: 'Miembro',
        description: 'Colabora y actualiza contenido',
      },
    },
    members: {
      title: 'Miembros',
      description: 'Gestiona el acceso del equipo',
      pendingRequests: 'Solicitudes pendientes',
      searchPlaceholder: 'Buscar miembros...',
      none: 'No se encontraron miembros',
    },
    rolesGuide: {
      title: 'Guía de roles',
      description: 'Revisa qué puede hacer cada rol',
    },
    actions: {
      manageLink: 'Gestionar enlace',
      share: 'Compartir',
    },
    defaults: {
      name: 'Mi espacio de estudio',
      description: 'Planificación colaborativa de estudio',
    },
    success: {
      workspaceCreated: 'Espacio creado.',
      subworkspaceCreated: 'Subespacio creado.',
      switched: 'Cambiaste a {{name}}.',
      memberRemoved: '{{name}} eliminado.',
      roleUpdated: 'Rol de {{name}} actualizado.',
      requestApproved: '{{name}} aprobado.',
      requestRejected: '{{name}} rechazado.',
      deleted: 'Espacio eliminado.',
      updated: 'Espacio actualizado.',
      avatarUpdated: 'Imagen actualizada.',
    },
    errors: {
      missingUser: 'Falta el usuario.',
      loadFailed: 'No se pudieron cargar los espacios.',
      subworkspaceNameRequired: 'Escribe un nombre para el subespacio.',
      createSubworkspace: 'No se pudo crear el subespacio.',
      workspaceNameRequired: 'Escribe un nombre para el espacio.',
      createWorkspace: 'No se pudo crear el espacio.',
      fillFields: 'Completa los campos obligatorios.',
      maxAdmins: 'Máximo 2 administradores por espacio.',
      notAuthenticated: 'No autenticado.',
      updateRole: 'No se pudo actualizar el rol.',
      updateRoleUnexpected: 'Error inesperado al actualizar el rol.',
      removeMember: 'No se pudo eliminar el miembro.',
      cannotDeleteLast: 'No puedes eliminar tu último espacio.',
      imageSize: 'La imagen debe ser menor de 2 MB.',
      imageType: 'Sube JPG, PNG o GIF.',
      uploadAvatar: 'No se pudo subir la imagen.',
    },
    confirm: {
      removeMember: '¿¿Seguro que quieres eliminar a {{name}} del espacio?',
    },
    presence: {
      online: 'En línea',
      never: 'Nunca',
      justNow: 'Ahora mismo',
      yesterday: 'Ayer',
    },
    memberCount_one: '{{count}} miembro',
    memberCount_other: '{{count}} miembros',
    subworkspaceCount_one: '{{count}} subespacio',
    subworkspaceCount_other: '{{count}} subespacios',
  },
  homepage: {
    product: {
      heading: 'Una forma mas clara de planificar, adaptarte y avanzar',
      description:
        'UPLAN funciona como un sistema moderno de productividad: estructurado, adaptable y centrado en el progreso real.',
    },
    hero: {
      badge: 'Creado para estudiantes que quieren claridad, no caos',
      titleLine1: 'Planifica mejor.',
      titleLine2: 'Estudia con menos estres.',
      description1:
        'U PLAN crea automaticamente tu horario de estudio segun examenes, clases, fechas limite y tu tiempo libre real.',
      description2:
        'Sin adivinar cuando estudiar. Sin dias saturados. Solo un plan flexible, personalizado y que realmente funciona.',
      getStarted: 'Empezar',
      seeFeatures: 'Ver funciones',
      studentStudyingAlt: 'Estudiante estudiando',
      cards: {
        autoTimetables: {
          title: 'Horarios automaticos',
          description: 'Generados segun tu horario real',
        },
        deadlineAware: {
          title: 'Atento a fechas limite',
          description: 'Planifica segun examenes y tareas',
        },
        flexible: {
          title: 'Flexible',
          description: 'Se ajusta cuando tu dia se complica',
        },
      },
    },
    mockup: {
      todayPlan: 'Plan de hoy',
      organizedAutomatically: 'Organizado automaticamente',
      smart: 'Inteligente',
      mathRevision: 'Repaso de matematicas',
      priorityHigh: 'Prioridad alta',
      physicsQuizPrep: 'Preparacion de fisica',
      deadlineTomorrow: 'Entrega manana',
      thisWeek: 'Esta semana',
      sessions: 'Sesiones',
      deadlines: 'Fechas limite',
      planned: 'Planificado',
      phoneFirst: 'Disenado para sentirse excelente primero en tu telefono.',
    },
    about: {
      title: 'Acerca de U PLAN',
      subtitle: 'Ayudamos a estudiantes a gestionar su tiempo con claridad y confianza',
      missionTitle: 'Nuestra mision',
      missionParagraph1:
        'Creamos U PLAN para que estudiar sea mas organizado, flexible y realista. Los estudiantes ya tienen suficiente presion; tu herramienta de planificacion debe reducir el estres, no aumentarlo.',
      missionParagraph2:
        'Combinando automatizacion inteligente con un diseno centrado en estudiantes, U PLAN te ayuda a encajar el estudio alrededor de examenes, clases, fechas limite y tu vida fuera de la escuela.',
      startJourney: 'Empieza tu camino',
      studentsStudyingTogetherAlt: 'Estudiantes estudiando juntos',
    },
    values: {
      title: 'Lo que defendemos',
      subtitle: 'Los principios detras de cada funcion que construimos',
      phoneAlt: 'Aplicacion movil de U PLAN',
      mobilePreview: 'Vista movil',
      clearDailyPlan: 'Tu dia claro de un vistazo',
      vision: {
        title: 'Vision',
        description: 'Gestion inteligente del tiempo para cada estudiante',
      },
      team: {
        title: 'Equipo',
        description: 'Creado por personas que entienden de primera mano la presion estudiantil',
      },
      innovation: {
        title: 'Innovacion',
        description: 'IA practica que ayuda a los estudiantes a pasar a la accion',
      },
      studentFirst: {
        title: 'Primero el estudiante',
        description: 'Cada decision esta disenada alrededor de necesidades reales de estudiantes',
      },
    },
    whyChoose: {
      title: 'Por que los estudiantes eligen U PLAN',
      paragraph1:
        'U PLAN fue creado para la realidad de la vida estudiantil: fechas que cambian, horarios variables, varias materias y energia limitada. Los planificadores tradicionales no se adaptan. Nosotros si.',
      paragraph2:
        'Ya sea que prepares finales, equilibres varios cursos o busques constancia sin agotarte, U PLAN te ayuda a estudiar con mas estructura y menos incertidumbre.',
    },
    featuresSection: {
      title: 'Funciones principales',
      subtitle: 'Todo lo que necesitas para tener exito academico',
    },
    features: {
      smartScheduling: {
        title: 'Planificacion inteligente',
        description: 'Optimiza automaticamente tu tiempo de estudio segun prioridades y fechas limite',
      },
      timeManagement: {
        title: 'Gestion del tiempo',
        description: 'Registra tus sesiones de estudio y mejora tu productividad',
      },
      progressTracking: {
        title: 'Seguimiento del progreso',
        description: 'Monitorea tu aprendizaje con analiticas detalladas',
      },
      aiPowered: {
        title: 'Con IA',
        description: 'Recomendaciones inteligentes segun tus patrones de estudio',
      },
      subjectBalance: {
        title: 'Equilibrio de materias',
        description: 'Asegura una atencion equilibrada en todos tus cursos',
      },
      adaptiveLearning: {
        title: 'Aprendizaje adaptable',
        description: 'Se ajusta a tu ritmo y estilo de aprendizaje',
      },
    },
    servicesSection: {
      title: 'Que puedes hacer',
      subtitle: 'Todo lo que necesitas para planificar, seguir y mejorar tu rutina de estudio',
      ctaTitle: 'Listo para estudiar con un mejor plan?',
      ctaDescription:
        'Unete a U PLAN y convierte tu horario en un sistema de estudio realista y personalizado.',
      startNow: 'Empezar ahora',
    },
    services: {
      smartTimetableGeneration: {
        title: 'Generacion inteligente de horarios',
        description:
          'Crea automaticamente un plan de estudio personalizado segun tus examenes, horas libres, objetivos y prioridades. Nuestro algoritmo considera tu horario, prioridades y patrones de aprendizaje para generar un horario optimo.',
        features: {
          conflictFreeScheduling: 'Planificacion sin conflictos',
          priorityBasedPlanning: 'Planificacion por prioridad',
          customizableStudyBlocks: 'Bloques de estudio personalizables',
          exportToCalendarApps: 'Exportacion a aplicaciones de calendario',
        },
      },
      adaptiveUpdates: {
        title: 'Actualizaciones adaptables',
        description:
          'Si omites o completas sesiones, el sistema ajusta tu horario automaticamente. La vida cambia; nuestra plataforma lo entiende y hace ajustes en tiempo real para mantenerte encaminado.',
        features: {
          realTimeRescheduling: 'Reprogramacion en tiempo real',
          automaticDeadlineAdjustments: 'Ajustes automaticos de fechas limite',
          flexibleSessionManagement: 'Gestion flexible de sesiones',
          smartRecoveryPlanning: 'Planificacion inteligente de recuperacion',
        },
      },
      progressTracking: {
        title: 'Seguimiento del progreso',
        description:
          'Sigue tu progreso diario y semanal para mantener la motivacion. Visualiza tus logros, identifica patrones y celebra hitos mientras avanzas hacia tus objetivos.',
        features: {
          dailyStudyLogs: 'Registros diarios de estudio',
          weeklyProgressReports: 'Informes semanales de progreso',
          achievementBadges: 'Insignias de logro',
          productivityInsights: 'Insights de productividad',
        },
      },
      examClassIntegration: {
        title: 'Integracion de examenes y clases',
        description:
          'Importa tu calendario de examenes y clases para crear un plan sin conflictos. Integra tu calendario academico para distribuir mejor tu tiempo de estudio.',
        features: {
          calendarSynchronization: 'Sincronizacion de calendario',
          examCountdownTimers: 'Cuenta atras para examenes',
          classConflictDetection: 'Deteccion de conflictos de clase',
          automaticBufferTimes: 'Tiempos de margen automaticos',
        },
      },
    },
    collaborationSection: {
      badge: 'Funciones para equipos',
      title: 'Creado para la colaboracion en equipo',
      subtitle:
        'Crea grupos de estudio, gestiona miembros y colabora facilmente en espacios compartidos',
    },
    collaborationFeatures: {
      teamCollaborationWorkspaces: {
        title: 'Espacios de colaboracion para equipos',
        description:
          'Crea espacios dedicados para grupos de estudio, equipos de proyecto o clases. Organiza miembros con control de acceso por roles y gestiona permisos sin esfuerzo.',
      },
      smartMemberSharing: {
        title: 'Invitaciones inteligentes',
        description:
          'Genera enlaces seguros para invitar miembros. Controla el acceso con opciones abiertas o restringidas por dominio, y usa solicitudes pendientes para mantener el control del crecimiento.',
      },
      integratedTeamChat: {
        title: 'Chat de equipo integrado',
        description:
          'Comunicate con miembros directamente dentro de los espacios. La mensajeria en tiempo real mantiene las conversaciones organizadas y conectadas al trabajo colaborativo.',
      },
      hierarchicalSubworkspaces: {
        title: 'Subespacios jerarquicos',
        description:
          'Organiza estructuras complejas con subespacios. Crea jerarquias padre-hijo para departamentos, proyectos o grupos de estudio con permisos heredados.',
      },
      teamProgressDashboard: {
        title: 'Panel de progreso del equipo',
        description:
          'Monitorea el progreso individual y colectivo. Sigue tasas de finalizacion, proximas fechas limite y metricas de productividad del equipo en tiempo real.',
      },
      workspaceCustomization: {
        title: 'Personalizacion del espacio',
        description:
          'Sube avatares, configura permisos, gestiona ajustes para compartir y define derechos de edicion de horarios. Control total sobre tu entorno colaborativo.',
      },
    },
    testimonialsSection: {
      badge: 'Historias de exito',
      title: 'Lo que dicen los estudiantes',
      subtitle: 'Unete a miles de estudiantes que transformaron su camino academico',
    },
    testimonials: {
      emily: {
        role: 'Estudiante de ingenieria',
        text:
          'Las funciones de espacios de U PLAN transformaron nuestro grupo de estudio. Pasamos de cadenas de correos caoticas a una colaboracion organizada. Mi promedio subio 0.7 puntos.',
        highlight: 'La mejor decision para estudiar en grupo',
      },
      james: {
        role: 'Estudiante de informatica',
        text:
          'La planificacion con IA es increible. Equilibra perfectamente mi carga de trabajo y las herramientas de colaboracion hacen que los proyectos grupales sean mucho mas faciles.',
        highlight: 'Un cambio total para la gestion academica',
      },
      sophia: {
        role: 'Estudiante de medicina',
        text:
          'Gestionar varios grupos de estudio era una pesadilla. Con los subespacios y el seguimiento en tiempo real de U PLAN, todo fluye mejor. Incluso tengo tiempo para mi vida social.',
        highlight: 'Perfecto para horarios complejos',
      },
      marcus: {
        role: 'Estudiante de negocios',
        text:
          'El chat del espacio y el tablero de colaboracion son fantasticos. La productividad de nuestro grupo aumento un 40%. El horario compartido mantiene a todos responsables.',
        highlight: 'Transformo la productividad del equipo',
      },
      lisa: {
        role: 'Estudiante de derecho',
        text:
          'U PLAN me ayudo a organizar mi exigente horario de estudio mientras mantenia mi grupo. El panel del equipo es invaluable para seguir el progreso colectivo.',
        highlight: 'Esencial para estudiar en grupo',
      },
      david: {
        role: 'Graduado en economia',
        text:
          'La herramienta de planificacion de estudio mas inteligente que he usado. La automatizacion del espacio me ahorro mas de 10 horas por semana.',
        highlight: 'Transformador para el rendimiento academico',
      },
    },
    stats: {
      activeStudents: 'Estudiantes activos',
      hoursPlanned: 'Horas planificadas',
      successRate: 'Tasa de exito',
      averageRating: 'Valoracion media',
    },
    actions: {
      seePlans: 'Ver planes',
    },
    errors: {
      planLinkMissing: 'El enlace de pago o contacto aun no esta configurado. Agregalo en frontend/UPLAN/.env.',
    },
    phone: {
      kicker: 'Horario de estudio',
      today: 'Hoy',
      nextFocus: 'Proximo enfoque',
      chemistryReview: 'Repaso de quimica',
      weekdays: {
        mon: 'L',
        tue: 'M',
        wed: 'X',
        thu: 'J',
        fri: 'V',
      },
      sessions: {
        math: {
          title: 'Repaso de matematicas',
          label: 'Prioridad alta',
        },
        physics: {
          title: 'Preparacion de fisica',
          label: 'Entrega manana',
        },
        essay: {
          title: 'Borrador de ensayo',
          label: 'Bloque de escritura',
        },
      },
      nav: {
        plan: 'Plan',
        progress: 'Progreso',
        tasks: 'Tareas',
      },
    },
    demo: {
      badge: 'Acceso demo premium',
      title: 'Reserva tu demo',
      description1:
        'Esta demo esta disenada para mostrar la experiencia completa de UPLAN, con un recorrido por las funciones principales, flujos premium y capacidades avanzadas.',
      description2:
        'En lugar de una vista limitada, la demo muestra el valor real del producto en planificacion, seguimiento del progreso, colaboracion y organizacion academica inteligente.',
      includedTitle: 'Que incluye',
      includes: {
        walkthrough: 'Recorrido completo de la aplicacion',
        premium: 'Experiencia tipo premium',
        advanced: 'Funciones y flujos avanzados',
        useCases: 'Casos academicos reales',
      },
      replyTime: 'Normalmente respondemos en 24 h',
      emailLabel: 'Email',
      contactMeta: 'Sin compromiso. Respuesta rapida. Acceso directo.',
      requestDemo: 'Solicitar demo',
      contactNote:
        'Puedes solicitar una demo personalizada, hacer preguntas sobre el producto o hablar de oportunidades de colaboracion.',
    },
    finalCta: {
      title: 'Empieza hoy tu transformacion academica',
      description:
        'Unete a estudiantes de universidades destacadas que mejoraron sus notas, equilibraron su carga de trabajo y alcanzaron sus objetivos academicos con U PLAN.',
      startFreeTrial: 'Iniciar prueba gratis',
      bookDemo: 'Reservar una demo',
      footer: 'No se requiere tarjeta de credito - Gratis por 14 dias - Cancela cuando quieras',
    },
  },
};

export default spanishOverrides;
