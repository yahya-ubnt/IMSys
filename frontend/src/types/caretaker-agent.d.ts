export interface CaretakerAgent {
  _id: string;
  name: string;
  email: string;
  phone: string;
  assignedBuildings: string[]; // Array of building IDs
  createdAt: string;
  updatedAt: string;
}