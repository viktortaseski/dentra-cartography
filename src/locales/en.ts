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
