export interface NeighborAnalysisDetails {
  onlineNeighbors: { name: string; phone: string }[];
  offlineNeighbors: { name: string; phone: string }[];
}

export interface DiagnosticStep {
  stepName: string;
  status: 'Success' | 'Failure' | 'Warning' | 'Info' | 'In-Progress';
  summary: string;
  details?: NeighborAnalysisDetails;
}

export interface DiagnosticLog {
  _id: string;
  user: string;
  finalConclusion: string;
  steps: DiagnosticStep[];
  createdAt: string;
}
