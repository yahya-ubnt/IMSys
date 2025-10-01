'use client'

import { Topbar } from '@/components/topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { FileText, Map, Bell } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className='flex flex-col min-h-screen'>
      <Topbar />

      <div className='flex-1 p-6 space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Reports</h1>
            <p className='text-muted-foreground'>
              Generate and view reports for different aspects of your business.
            </p>
          </div>
        </div>

        {/* Report Navigation Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <Link href='/reports/location'>
            <Card className='hover:shadow-md transition-shadow'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Location Report
                </CardTitle>
                <Map className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <p className='text-xs text-muted-foreground'>
                  Revenue generated from specific buildings.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href='/reports/mpesa-alert'>
            <Card className='hover:shadow-md transition-shadow'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  M-Pesa Alerts
                </CardTitle>
                <Bell className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <p className='text-xs text-muted-foreground'>
                  View and manage M-Pesa payment alerts.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href='/reports/mpesa-report'>
            <Card className='hover:shadow-md transition-shadow'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  M-Pesa Report
                </CardTitle>
                <FileText className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <p className='text-xs text-muted-foreground'>
                  Detailed report of all M-Pesa transactions.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
