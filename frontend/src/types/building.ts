export type Building = {
  _id: string
  name: string
  address: string
  gps?: { lat: number; lng: number }
  owner?: string
  staffName: string
  staffPhone: string
  notes?: string
  images?: string[]
  providers: string[]
  totalUnits: number
  active: boolean
  createdAt: string
}
