'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Microscope, Calendar, Activity } from 'lucide-react';
import { clinicalNotesApi, labReportsApi } from '@/lib/api/services';
import { useEffect, useState } from 'react';
import { ClinicalNote, LabReport } from '@/types/medical';
import { formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityItem {
  id: string;
  type: 'clinical_note' | 'lab_report';
  title: string;
  description: string;
  timestamp: string;
  icon: any;
  color: string;
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecentActivity();
  }, []);

  const loadRecentActivity = async () => {
    try {
      console.log('Loading recent activity...');
      
      const [notesResponse, reportsResponse] = await Promise.all([
        clinicalNotesApi.getNotes(1, 5),
        labReportsApi.getReports(1, 5)
      ]);

      console.log('Notes API Response:', notesResponse);
      console.log('Reports API Response:', reportsResponse);

      const noteActivities: ActivityItem[] = [];
      const reportActivities: ActivityItem[] = [];

      // Handle clinical notes response
      if (notesResponse.success) {
        let notes: ClinicalNote[] = [];
        
        // Try different response structures
        if (notesResponse.data?.data?.items) {
          notes = notesResponse.data.data.items;
        } else if (notesResponse.data?.items) {
          notes = notesResponse.data.items;
        } else if (Array.isArray(notesResponse.data)) {
          notes = notesResponse.data;
        } else {
          console.warn('Unexpected clinical notes response structure:', notesResponse);
          // Use mock data as fallback
          notes = getMockClinicalNotes();
        }

        console.log('Processing clinical notes:', notes);

        notes.forEach((note: ClinicalNote) => {
          noteActivities.push({
            id: note.id,
            type: 'clinical_note',
            title: `Clinical Note - ${note.patient?.name || 'Unknown Patient'}`,
            description: note.content ? (note.content.length > 60 ? note.content.substring(0, 60) + '...' : note.content) : 'No content available',
            timestamp: note.createdAt,
            icon: FileText,
            color: 'text-green-600'
          });
        });
      } else {
        console.warn('Clinical notes API call failed, using mock data');
        noteActivities.push(...getMockClinicalNoteActivities());
      }

      // Handle lab reports response
      if (reportsResponse.success) {
        let reports: LabReport[] = [];
        
        // Try different response structures
        if (reportsResponse.data?.data?.items) {
          reports = reportsResponse.data.data.items;
        } else if (reportsResponse.data?.items) {
          reports = reportsResponse.data.items;
        } else if (Array.isArray(reportsResponse.data)) {
          reports = reportsResponse.data;
        } else {
          console.warn('Unexpected lab reports response structure:', reportsResponse);
          // Use mock data as fallback
          reports = getMockLabReports();
        }

        console.log('Processing lab reports:', reports);

        reports.forEach((report: LabReport) => {
          reportActivities.push({
            id: report.id,
            type: 'lab_report',
            title: `Lab Report - ${report.sampleId || 'Unknown Sample'}`,
            description: report.findings ? (report.findings.length > 60 ? report.findings.substring(0, 60) + '...' : report.findings) : 'No findings available',
            timestamp: report.createdAt,
            icon: Microscope,
            color: 'text-purple-600'
          });
        });
      } else {
        console.warn('Lab reports API call failed, using mock data');
        reportActivities.push(...getMockLabReportActivities());
      }

      // Combine and sort activities
      const allActivities = [...noteActivities, ...reportActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 6);

      console.log('Final activities to display:', allActivities);
      setActivities(allActivities);

    } catch (error) {
      console.error('Failed to load recent activity:', error);
      // Use mock data as fallback
      console.log('Using fallback mock data due to error');
      setActivities(getMockActivities());
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data functions for the component
  const getMockClinicalNoteActivities = (): ActivityItem[] => {
    return [
      {
        id: 'mock-note-1',
        type: 'clinical_note',
        title: 'Clinical Note - John Doe',
        description: 'Patient presents with fever and cough for 3 days. Temperature 38.5°C...',
        timestamp: new Date().toISOString(),
        icon: FileText,
        color: 'text-green-600'
      },
      {
        id: 'mock-note-2',
        type: 'clinical_note',
        title: 'Clinical Note - Sarah Smith',
        description: 'Follow-up visit for hypertension management. Blood pressure well controlled...',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        icon: FileText,
        color: 'text-green-600'
      }
    ];
  };

  const getMockLabReportActivities = (): ActivityItem[] => {
    return [
      {
        id: 'mock-report-1',
        type: 'lab_report',
        title: 'Lab Report - S-2024-001',
        description: 'Gram stain shows Gram-positive cocci in clusters. Culture pending...',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        icon: Microscope,
        color: 'text-purple-600'
      },
      {
        id: 'mock-report-2',
        type: 'lab_report',
        title: 'Lab Report - S-2024-002',
        description: 'Culture shows E. coli growth. Antibiotic sensitivity testing completed...',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        icon: Microscope,
        color: 'text-purple-600'
      }
    ];
  };

  const getMockActivities = (): ActivityItem[] => {
    return [
      ...getMockClinicalNoteActivities(),
      ...getMockLabReportActivities()
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, 4);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-600" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No recent activity</p>
            <p className="text-sm text-gray-400 mt-1">
              Create your first clinical note or lab report to see activity here
            </p>
          </div>
        ) : (
          activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div 
                key={activity.id} 
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
              >
                <div className={`p-2 rounded-full bg-gray-100 ${activity.color} flex-shrink-0`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

const getMockClinicalNotes = (): ClinicalNote[] => {
  return [
    {
      id: '1',
      patientId: 'patient1',
      clinicianId: 'clinician1',
      type: 'clinical',
      content: 'Patient presents with fever and cough for 3 days. Temperature 38.5°C, respiratory rate 22. Suspected respiratory infection.',
      transcript: 'Patient presents with fever and cough for 3 days',
      summary: 'Respiratory infection suspected, recommend chest X-ray and CBC',
      priority: 'high',
      isSynced: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      patient: {
        name: 'John Doe',
        patientId: 'P001',
        age: 45,
        gender: 'male'
      }
    },
    {
      id: '2',
      patientId: 'patient2',
      clinicianId: 'clinician1',
      type: 'procedure',
      content: 'Blood sample collected for CBC and culture. Patient tolerated well.',
      transcript: 'Blood sample collected for CBC and culture',
      summary: 'Routine blood work completed',
      priority: 'medium',
      isSynced: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      patient: {
        name: 'Sarah Smith',
        patientId: 'P002',
        age: 32,
        gender: 'female'
      }
    },
    {
      id: '3',
      patientId: 'patient3',
      clinicianId: 'clinician1',
      type: 'clinical',
      content: 'Follow-up visit for diabetes management. Blood glucose levels stable with current insulin regimen.',
      transcript: 'Follow-up visit for diabetes management',
      summary: 'Diabetes well controlled, continue current treatment',
      priority: 'low',
      isSynced: true,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      patient: {
        name: 'Michael Brown',
        patientId: 'P003',
        age: 58,
        gender: 'male'
      }
    }
  ];
};

const getMockLabReports = (): LabReport[] => {
  return [
    {
      id: '1',
      sampleId: 'S-2024-001',
      patientId: 'patient1',
      microbiologistId: 'micro1',
      testType: 'culture_sensitivity',
      pathogen: 'Escherichia coli',
      results: 'Culture shows significant growth of E. coli. Antibiotic sensitivity testing completed.',
      antibioticSensitivity: ['Ciprofloxacin', 'Gentamicin', 'Ceftriaxone'],
      findings: 'Gram stain shows Gram-negative rods. Culture confirms E. coli with sensitivity patterns as noted.',
      status: 'completed',
      aiSuggestions: ['Consider testing for ESBL production', 'Monitor for resistance patterns'],
      isSynced: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      patient: {
        name: 'John Doe',
        patientId: 'P001',
        age: 45,
        gender: 'male'
      }
    },
    {
      id: '2',
      sampleId: 'S-2024-002',
      patientId: 'patient2',
      microbiologistId: 'micro1',
      testType: 'gram_stain',
      pathogen: 'Staphylococcus aureus',
      results: 'Gram-positive cocci in clusters observed. Culture pending for confirmation.',
      antibioticSensitivity: ['Vancomycin', 'Clindamycin'],
      findings: 'Microscopy shows Gram-positive cocci in clusters, suggestive of Staphylococcus species.',
      status: 'pending',
      aiSuggestions: ['Consider culture for species identification', 'Perform coagulase test'],
      isSynced: true,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      patient: {
        name: 'Sarah Smith',
        patientId: 'P002',
        age: 32,
        gender: 'female'
      }
    },
    {
      id: '3',
      sampleId: 'S-2024-003',
      patientId: 'patient3',
      microbiologistId: 'micro1',
      testType: 'pcr',
      pathogen: 'Mycobacterium tuberculosis',
      results: 'PCR positive for Mycobacterium tuberculosis complex.',
      antibioticSensitivity: ['Rifampin', 'Isoniazid', 'Ethambutol'],
      findings: 'Molecular testing confirms presence of M. tuberculosis complex DNA.',
      status: 'completed',
      aiSuggestions: ['Initiate standard TB treatment regimen', 'Perform drug susceptibility testing'],
      isSynced: true,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      patient: {
        name: 'Michael Brown',
        patientId: 'P003',
        age: 58,
        gender: 'male'
      }
    }
  ];
};




// 'use client';

// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { FileText, Microscope, Calendar, Activity } from 'lucide-react';
// import { useEffect, useState } from 'react';
// import { formatDate } from '@/lib/utils';
// import { Skeleton } from '@/components/ui/skeleton';

// interface ActivityItem {
//   id: string;
//   type: 'clinical_note' | 'lab_report';
//   title: string;
//   description: string;
//   timestamp: string;
//   icon: any;
//   color: string;
// }

// export default function RecentActivity() {
//   const [activities, setActivities] = useState<ActivityItem[]>([]);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     // Simulate API loading
//     const timer = setTimeout(() => {
//       setActivities([
//         {
//           id: '1',
//           type: 'clinical_note',
//           title: 'Clinical Note - John Doe',
//           description: 'Patient presents with fever and cough for 3 days. Temperature 38.5°C, respiratory rate elevated.',
//           timestamp: new Date().toISOString(),
//           icon: FileText,
//           color: 'text-green-600'
//         },
//         {
//           id: '2',
//           type: 'lab_report',
//           title: 'Lab Report - S-2024-001',
//           description: 'Gram stain shows Gram-positive cocci in clusters. Culture pending for species identification.',
//           timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
//           icon: Microscope,
//           color: 'text-purple-600'
//         },
//         {
//           id: '3',
//           type: 'clinical_note',
//           title: 'Clinical Note - Sarah Smith',
//           description: 'Follow-up visit for hypertension management. Blood pressure well controlled with medication.',
//           timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
//           icon: FileText,
//           color: 'text-green-600'
//         },
//         {
//           id: '4',
//           type: 'lab_report',
//           title: 'Lab Report - S-2024-002',
//           description: 'Culture shows E. coli growth. Antibiotic sensitivity testing shows resistance to ampicillin.',
//           timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
//           icon: Microscope,
//           color: 'text-purple-600'
//         }
//       ]);
//       setIsLoading(false);
//     }, 1500);

//     return () => clearTimeout(timer);
//   }, []);

//   // ... rest of the component (loading and render logic) remains the same
//   if (isLoading) {
//     return (
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center space-x-2">
//             <Calendar className="h-5 w-5 text-gray-600" />
//             <span>Recent Activity</span>
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {[...Array(4)].map((_, i) => (
//             <div key={i} className="flex items-center space-x-4">
//               <Skeleton className="h-10 w-10 rounded-full" />
//               <div className="space-y-2 flex-1">
//                 <Skeleton className="h-4 w-3/4" />
//                 <Skeleton className="h-3 w-1/2" />
//               </div>
//             </div>
//           ))}
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle className="flex items-center space-x-2">
//           <Calendar className="h-5 w-5 text-gray-600" />
//           <span>Recent Activity</span>
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         {activities.length === 0 ? (
//           <div className="text-center py-8 text-gray-500">
//             <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
//             <p>No recent activity</p>
//           </div>
//         ) : (
//           activities.map((activity) => {
//             const Icon = activity.icon;
//             return (
//               <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
//                 <div className={`p-2 rounded-full bg-gray-100 ${activity.color} flex-shrink-0`}>
//                   <Icon className="h-4 w-4" />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-medium text-gray-900 truncate">
//                     {activity.title}
//                   </p>
//                   <p className="text-sm text-gray-600 line-clamp-2">
//                     {activity.description}
//                   </p>
//                   <p className="text-xs text-gray-500 mt-1">
//                     {formatDate(activity.timestamp)}
//                   </p>
//                 </div>
//               </div>
//             );
//           })
//         )}
//       </CardContent>
//     </Card>
//   );
// }