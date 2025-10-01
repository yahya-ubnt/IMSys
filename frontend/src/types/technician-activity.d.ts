export type TechnicianActivity = {
  _id: string;
  technician: string; // Manual input for technician name
  activityType: 'Installation' | 'Support';
  clientName: string;
  clientPhone: string;
  activityDate: Date;
  description: string;
  // Fields specific to Installation
  installedEquipment?: string;
  installationNotes?: string;
  // Fields specific to Support
  supportCategory?: 'Client Problem' | 'Building Issue'; // ADDED FIELD
  issueDescription?: string;
  solutionProvided?: string;
  partsReplaced?: string;
  configurationChanges?: string;
  // Optional: Link to a Unit or Building if applicable (for CRM context)
  unit?: string; // Unit ID
  building?: string; // Building ID
  createdAt: Date;
  updatedAt: Date;
};