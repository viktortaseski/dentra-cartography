export const en = {
  // App
  appName: 'Dental Cartography',

  // Navigation
  settings: 'Settings',
  calendar: 'Calendar',

  // Patients
  newPatient: 'New Patient',
  selectPatient: 'Select a patient to view their chart',
  selectPatientSub: 'Choose a patient from the sidebar or create a new one.',
  searchPatients: 'Search patients…',
  noPatients: 'No patients yet',
  editPatient: 'Edit',
  archivePatient: 'Archive',
  archiveConfirm: (name: string) => `Archive ${name}? They will be removed from the patient list.`,

  // Patient form
  patientFormCreate: 'New Patient',
  patientFormEdit: 'Edit Patient',
  fullName: 'Full Name',
  dateOfBirth: 'Date of Birth',
  sex: 'Sex',
  sexMale: 'Male',
  sexFemale: 'Female',
  sexOther: 'Other',
  phone: 'Phone',
  email: 'Email',
  medicalAlerts: 'Medical Alerts',
  notes: 'Notes',
  address: 'Address',
  insurance: 'Insurance',
  policy: 'Policy',

  // Buttons
  save: 'Save',
  cancel: 'Cancel',
  confirm: 'Confirm',
  delete: 'Delete',
  close: 'Close',
  saving: 'Saving…',
  loading: 'Loading…',

  // Chart
  upper: 'Upper',
  lower: 'Lower',
  loadingChart: 'Loading chart…',

  // Conditions
  conditions: {
    healthy: 'Healthy',
    caries: 'Caries',
    filling_amalgam: 'Amalgam Filling',
    filling_composite: 'Composite Filling',
    crown: 'Crown',
    extraction: 'Extraction',
    missing_congenital: 'Missing (Congenital)',
    implant: 'Implant',
    root_canal: 'Root Canal',
    bridge_pontic: 'Bridge Pontic',
    fracture: 'Fracture',
    watch: 'Watch',
  },

  // Treatments
  treatmentHistory: 'Treatment History',
  addTreatment: 'Add Treatment',
  noTreatments: 'No treatments recorded',
  allTeeth: 'All Teeth',
  tooth: 'Tooth',
  surface: 'Surface',
  procedure: 'Procedure',
  status: 'Status',
  performedBy: 'Performed By',
  price: 'Price',
  datePerformed: 'Date Performed',
  statusPlanned: 'Planned',
  statusCompleted: 'Completed',
  statusReferred: 'Referred',

  // Appointments
  newAppointment: 'New Appointment',
  noAppointmentsToday: 'No appointments today',
  title: 'Title',
  date: 'Date',
  startTime: 'Start Time',
  endTime: 'End Time',
  patient: 'Patient',
  selectPatientLabel: 'Select Patient',
  appointmentStatusScheduled: 'Scheduled',
  appointmentStatusCompleted: 'Completed',
  appointmentStatusCancelled: 'Cancelled',
  appointmentStatusNoShow: 'No Show',
  emailPatient: 'Email Patient',
  reschedule: 'Reschedule',
  noEmailOnFile: 'No email on file',
  areYouSure: 'Are you sure?',

  // Settings
  settingsTitle: 'Settings',
  clinicDetails: 'Clinic Details',
  appearance: 'Appearance',
  clinicName: 'Clinic Name',
  dentistName: 'Dentist Name',
  website: 'Website',
  saveSettings: 'Save Settings',
  settingsSaved: 'Settings saved',
  darkMode: 'Dark Mode',
  language: 'Language',
  languageEn: 'English',
  languageMk: 'Македонски',
  languageSq: 'Shqip',

  // Revenue
  revenue: 'Revenue',
  totalEarned: 'Total Earned',
  outstanding: 'Outstanding',
  earnedThisMonth: 'Earned This Month',
  outstandingThisMonth: 'Outstanding This Month',
  allTransactions: 'All Transactions',
  noTransactions: 'No transactions with a price recorded yet.',
  revenueLoading: 'Loading revenue data…',

  // PDF documents
  invoice: 'Invoice',
  treatmentPlan: 'Treatment Plan',
  patientReport: 'Patient Report',
  treatmentPlanNotes: 'Treatment Plan Notes',
  doctorNotesLabel: "Doctor's notes (optional)",
  generatePdf: 'Generate PDF',

  // Treatment edit
  estPrice: 'Est. price',
  editNotesAria: 'Edit notes for this treatment',
  saveNotes: 'Save',
  cancelEdit: 'Cancel',

  // Font size (Settings)
  fontSize: 'Font Size',
  fontSizeDesc: 'Increase the text size across the entire application.',
  fontSizeNormal: 'Normal',
  fontSizeNormalDesc: 'Default size',
  fontSizeLarge: 'Large',
  fontSizeLargeDesc: 'Easier to read',

  // Tooth notes
  toothNotes: 'Tooth Notes',
  saveNote: 'Save Note',
  noteSaved: 'Saved',

  // Integrations (Settings tab)
  integrations: 'Integrations',
  integrationDesc: 'Connect to your online appointment booking service to sync appointments into the calendar.',
  apiUrl: 'API URL',
  clinicNameIntegration: 'Clinic Name',
  usernameField: 'Username',
  passwordField: 'Password',
  testConnection: 'Test Connection',
  connectionSuccess: 'Connected',
  saveConfiguration: 'Save Configuration',
  configSaved: 'Configuration saved',

  // Calendar sync
  sync: 'Sync',
  synced: (n: number) => `Synced ${n} appointment${n === 1 ? '' : 's'}`,

  // License
  licenseTab: 'License',
  licenseStatus: 'License Status',
  licenseActivated: 'Activated',
  licenseNotActivated: 'Not Activated',
  licenseActivatedFor: (name: string) => `Licensed to ${name}`,
  licenseExpires: (date: string) => `Expires ${date}`,
  licenseNeverExpires: 'Never expires',
  machineCode: 'Machine Code',
  machineCodeDesc: 'Send this code to support to receive a license key bound to this device.',
  licenseKey: 'License Key',
  licenseKeyPlaceholder: 'Paste your license key here…',
  activateLicense: 'Activate',
  activating: 'Activating…',
  licenseActivateSuccess: (name: string) => `Activated for ${name}`,

  // Misc
  noPatientsMatch: 'No patients match.',

  // PDF
  exportPdf: 'Export PDF',
  generating: 'Generating…',

  // Days (short)
  days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  // Months (full)
  months: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  // Months (short)
  monthsShort: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ],
}

export type Translations = typeof en
