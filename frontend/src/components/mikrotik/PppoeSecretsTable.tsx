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
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Trash2, Edit } from 'lucide-react';
import { PppoeSecretForm, PppoeSecretFormValues } from './PppoeSecretForm';
import { useAuth } from '@/components/auth-provider';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';

interface Secret {
  '.id': string;
  name: string;
  service: string;
  profile: string;
  'remote-address': string;
  disabled: 'true' | 'false';
}

export function PppoeSecretsTable({ routerId }: { routerId: string }) {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);

  const fetchSecrets = useCallback(async () => {
    try {
      const response = await fetch(`/api/routers/${routerId}/dashboard/pppoe/secrets`);
      if (!response.ok) {
        throw new Error('Failed to fetch PPPoE secrets');
      }
      const data = await response.json();
      setSecrets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  }, [routerId]);

  useEffect(() => {
    if (!routerId) return;
    setLoading(true);
    fetchSecrets().finally(() => setLoading(false));
  }, [routerId, fetchSecrets]);

  const handleFormSubmit = async (values: PppoeSecretFormValues) => {
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
      alert(`Error: ${err instanceof Error ? err.message : 'An unknown error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSecret) return;

    try {
      const response = await fetch(
        `/api/routers/${routerId}/dashboard/pppoe/secrets/${selectedSecret['.id']}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete secret');
      }

      await fetchSecrets();
      setIsAlertOpen(false);
      setSelectedSecret(null);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'An unknown error occurred'}`);
    }
  };

  const columns: ColumnDef<Secret>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className="font-medium text-white">{row.original.name}</span>,
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
        cell: ({ row }) => (
          <Badge variant={row.original.disabled === 'true' ? 'secondary' : 'success'}>
            {row.original.disabled === 'true' ? 'Disabled' : 'Enabled'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedSecret(row.original);
                setIsDialogOpen(true);
              }}
            >
              <Edit className="h-4 w-4 text-zinc-400 hover:text-blue-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedSecret(row.original);
                setIsAlertOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 text-zinc-400 hover:text-red-500" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  if (loading) {
    return <div className="text-center text-zinc-400">Loading PPPoE secrets...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setSelectedSecret(null)}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Secret
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
            <DialogHeader>
              <DialogTitle>{selectedSecret ? 'Edit' : 'Add'} PPPoE Secret</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Make changes to the PPPoE secret here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <PppoeSecretForm
              initialData={selectedSecret ? {
                name: selectedSecret.name,
                password: '',
                service: selectedSecret.service,
                profile: selectedSecret.profile,
                disabled: selectedSecret.disabled === 'true',
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
        filterColumn="name"
        paginationEnabled={false}
        tableClassName="[&_tr]:border-zinc-800"
        headerClassName="[&_th]:text-zinc-400"
        rowClassName="hover:bg-zinc-800/50"
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. This will permanently delete the PPPoE secret
              &quot;{selectedSecret?.name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}