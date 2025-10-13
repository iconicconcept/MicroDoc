//mock for the recent activites fetch
// const getMockClinicalNoteActivities = (): ActivityItem[] => {
  //   return [
  //     {
  //       id: 'mock-note-1',
  //       type: 'clinical_note',
  //       title: 'Clinical Note - John Doe',
  //       description: 'Patient presents with fever and cough for 3 days. Temperature 38.5°C...',
  //       timestamp: new Date().toISOString(),
  //       icon: FileText,
  //       color: 'text-green-600'
  //     },
  //     {
  //       id: 'mock-note-2',
  //       type: 'clinical_note',
  //       title: 'Clinical Note - Sarah Smith',
  //       description: 'Follow-up visit for hypertension management. Blood pressure well controlled...',
  //       timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  //       icon: FileText,
  //       color: 'text-green-600'
  //     }
  //   ];
  // };

  // const getMockLabReportActivities = (): ActivityItem[] => {
  //   return [
  //     {
  //       id: "mock-report-1",
  //       type: "lab_report",
  //       title: "Lab Report - S-2024-001",
  //       description:
  //         "Gram stain shows Gram-positive cocci in clusters. Culture pending...",
  //       timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  //       icon: Microscope,
  //       color: "text-purple-600",
  //     },
  //     {
  //       id: "mock-report-2",
  //       type: "lab_report",
  //       title: "Lab Report - S-2024-002",
  //       description:
  //         "Culture shows E. coli growth. Antibiotic sensitivity testing completed...",
  //       timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  //       icon: Microscope,
  //       color: "text-purple-600",
  //     },
  //   ];
  // };

  // const getMockActivities = (): ActivityItem[] => {
  //   return [
  //     ...getMockClinicalNoteActivities(),
  //     ...getMockLabReportActivities()
  //   ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  //    .slice(0, 4);
  // };

// const getMockClinicalNotes = (): ClinicalNote[] => {
//   return [
//     {
//       _id: "1",
//       patientId: "patient1",
//       clinicianId: "clinician1",
//       type: "clinical",
//       content:
//         "Patient presents with fever and cough for 3 days. Temperature 38.5°C, respiratory rate 22. Suspected respiratory infection.",
//       transcript: "Patient presents with fever and cough for 3 days",
//       summary: "Respiratory infection suspected, recommend chest X-ray and CBC",
//       priority: "high",
//       isSynced: true,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//       patient: {
//         name: "John Doe",
//         patientId: "P001",
//         age: 45,
//         gender: "male",
//       },
//     },
//     {
//       id: "2",
//       patientId: "patient2",
//       clinicianId: "clinician1",
//       type: "procedure",
//       content:
//         "Blood sample collected for CBC and culture. Patient tolerated well.",
//       transcript: "Blood sample collected for CBC and culture",
//       summary: "Routine blood work completed",
//       priority: "medium",
//       isSynced: true,
//       createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
//       updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
//       patient: {
//         name: "Sarah Smith",
//         patientId: "P002",
//         age: 32,
//         gender: "female",
//       },
//     },
//     {
//       id: "3",
//       patientId: "patient3",
//       clinicianId: "clinician1",
//       type: "clinical",
//       content:
//         "Follow-up visit for diabetes management. Blood glucose levels stable with current insulin regimen.",
//       transcript: "Follow-up visit for diabetes management",
//       summary: "Diabetes well controlled, continue current treatment",
//       priority: "low",
//       isSynced: true,
//       createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
//       updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
//       patient: {
//         name: "Michael Brown",
//         patientId: "P003",
//         age: 58,
//         gender: "male",
//       },
//     },
//   ];
// };

// const getMockLabReports = (): LabReport[] => {
//   return [
//     {
//       id: "1",
//       sampleId: "S-2024-001",
//       patientId: "patient1",
//       microbiologistId: "micro1",
//       testType: "culture_sensitivity",
//       pathogen: "Escherichia coli",
//       results:
//         "Culture shows significant growth of E. coli. Antibiotic sensitivity testing completed.",
//       antibioticSensitivity: ["Ciprofloxacin", "Gentamicin", "Ceftriaxone"],
//       findings:
//         "Gram stain shows Gram-negative rods. Culture confirms E. coli with sensitivity patterns as noted.",
//       status: "completed",
//       aiSuggestions: [
//         "Consider testing for ESBL production",
//         "Monitor for resistance patterns",
//       ],
//       isSynced: true,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//       // patient: {
//       //   name: 'John Doe',
//       //   patientId: 'P001',
//       //   age: 45,
//       //   gender: 'male'
//       // }
//     },
//     {
//       id: "2",
//       sampleId: "S-2024-002",
//       patientId: "patient2",
//       microbiologistId: "micro1",
//       testType: "gram_stain",
//       pathogen: "Staphylococcus aureus",
//       results:
//         "Gram-positive cocci in clusters observed. Culture pending for confirmation.",
//       antibioticSensitivity: ["Vancomycin", "Clindamycin"],
//       findings:
//         "Microscopy shows Gram-positive cocci in clusters, suggestive of Staphylococcus species.",
//       status: "pending",
//       aiSuggestions: [
//         "Consider culture for species identification",
//         "Perform coagulase test",
//       ],
//       isSynced: true,
//       createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
//       updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
//       // patient: {
//       //   name: 'Sarah Smith',
//       //   patientId: 'P002',
//       //   age: 32,
//       //   gender: 'female'
//       // }
//     },
//     {
//       id: "3",
//       sampleId: "S-2024-003",
//       patientId: "patient3",
//       microbiologistId: "micro1",
//       testType: "pcr",
//       pathogen: "Mycobacterium tuberculosis",
//       results: "PCR positive for Mycobacterium tuberculosis complex.",
//       antibioticSensitivity: ["Rifampin", "Isoniazid", "Ethambutol"],
//       findings:
//         "Molecular testing confirms presence of M. tuberculosis complex DNA.",
//       status: "completed",
//       aiSuggestions: [
//         "Initiate standard TB treatment regimen",
//         "Perform drug susceptibility testing",
//       ],
//       isSynced: true,
//       createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
//       updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
//       // patient: {
//       //   name: 'Michael Brown',
//       //   patientId: 'P003',
//       //   age: 58,
//       //   gender: 'male'
//       // }
//     },
//   ];
// };
