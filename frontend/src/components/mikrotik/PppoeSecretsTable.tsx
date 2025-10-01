'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PlusCircle, Trash2, Edit } from 'lucide-react';
import { PppoeSecretForm, PppoeSecretFormValues } from './PppoeSecretForm';
import { useAuth } from '@/components/auth-provider';
import { DataTable } from '@/components/data-table'; // Import DataTable
import { ColumnDef } from '@tanstack/react-table'; // Import ColumnDef

interface Secret {
  '.id': string;
  name: string;
  service: string;
  profile: string;
  'remote-address': string;
  disabled: boolean;
}

export function PppoeSecretsTable({ routerId }: { routerId: string }) {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const { token } = useAuth();

  const fetchSecrets = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`/api/routers/${routerId}/dashboard/pppoe/secrets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch PPPoE secrets');
      }
      const data = await response.json();
      setSecrets(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  }, [token, routerId, setSecrets, setError]);

  useEffect(() => {
    if (!routerId || !token) return;
    setLoading(true);
    fetchSecrets().finally(() => setLoading(false));
  }, [routerId, token, fetchSecrets]);

  const handleFormSubmit = async (values: PppoeSecretFormValues) => {
    if (!token) return;
    setIsSubmitting(true);
    const method = selectedSecret ? 'PUT' : 'POST';
    const url = selectedSecret
      ? `/api/routers/${routerId}/dashboard/pppoe/secrets/${selectedSecret['.id']}`
      : `/api/routers/${routerId}/dashboard/pppoe/secrets`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${selectedSecret ? 'update' : 'add'} secret`);
      }

      await fetchSecrets();
      setIsDialogOpen(false);
      setSelectedSecret(null);
    } catch (err) {
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      } else {
        alert('Error: An unknown error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSecret || !token) return;

    try {
      const response = await fetch(
        `/api/routers/${routerId}/dashboard/pppoe/secrets/${selectedSecret['.id']}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete secret');
      }

      await fetchSecrets();
      setIsAlertOpen(false);
      setSelectedSecret(null);
    } catch (err) {
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      } else {
        alert('Error: An unknown error occurred');
      }
    }
  };

  // Define columns for the DataTable
  const columns: ColumnDef<Secret>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'service',
        header: 'Service',
      },
      {
        accessorKey: 'profile',
        header: 'Profile',
      },
      {
        accessorKey: 'remote-address',
        header: 'Remote Address',
      },
      {
        accessorKey: 'disabled',
        header: 'Status',
        cell: ({ row }) => (row.original.disabled ? 'Disabled' : 'Enabled'),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSelectedSecret(row.original);
                setIsDialogOpen(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => {
                setSelectedSecret(row.original);
                setIsAlertOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  if (loading) {
    return <div>Loading PPPoE secrets...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedSecret(null)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Secret
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedSecret ? 'Edit' : 'Add'} PPPoE Secret</DialogTitle>
              <DialogDescription>
                Make changes to the PPPoE secret here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <PppoeSecretForm
              initialData={selectedSecret ? {
                name: selectedSecret.name,
                password: '', // Password is not sent for security reasons, user needs to re-enter if they want to change it
                service: selectedSecret.service,
                profile: selectedSecret.profile,
                disabled: selectedSecret.disabled,
              } : undefined}
              onSubmit={handleFormSubmit}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      </div>
      <DataTable
        columns={columns}
        data={secrets}
        filterColumn="name" // Allow filtering by secret name
        className="text-lg [&_td]:p-2 [&_th]:p-2" // Apply styling
        pageSizeOptions={[25, 50, 100, secrets.length]} // Add page size options
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the PPPoE secret
              &quot;{selectedSecret?.name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedSecret(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
