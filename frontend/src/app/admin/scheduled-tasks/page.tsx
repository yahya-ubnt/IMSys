"use client"

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { Topbar } from "@/components/topbar";
import { motion } from "framer-motion";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// --- Helper Functions for Time Conversion ---
const cronToTime = (cronString: string): string => {
    try {
        const parts = cronString.split(' ');
        const minute = parseInt(parts[0], 10);
        const hour = parseInt(parts[1], 10);

        if (isNaN(minute) || isNaN(hour)) return "Invalid Schedule";

        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        const displayMinute = minute < 10 ? `0${minute}` : minute;

        return `${displayHour}:${displayMinute} ${ampm}`;
    } catch (e) {
        return "Invalid Schedule";
    }
};

interface ScheduledTask {
    _id: string;
    name: string;
    description: string;
    scriptPath: string;
    schedule: string;
    isEnabled: boolean;
    lastRun?: string;
    lastStatus?: 'Success' | 'Failed' | 'Pending' | 'Running';
    logOutput?: string;
}

export default function ScheduledTasksPage() {
    const [tasks, setTasks] = useState<ScheduledTask[]>([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();
    const { toast } = useToast();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Partial<ScheduledTask> | null>(null);

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/scheduled-tasks', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch tasks');
            setTasks(await response.json());
        } catch (error) {
            toast({ title: 'Error', description: 'Could not fetch scheduled tasks.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [token, toast]);

    useEffect(() => {
        if (token) {
            fetchTasks();
        }
    }, [fetchTasks, token]);

    const columns: ColumnDef<ScheduledTask>[] = [
        { accessorKey: "name", header: "Task Name" },
        { 
            accessorKey: "schedule", 
            header: "Scheduled Time",
            cell: ({ row }) => cronToTime(row.original.schedule)
        },
        { 
            accessorKey: "lastStatus", 
            header: "Last Status",
            cell: ({ row }) => {
                const status = row.original.lastStatus || 'Pending';
                const variant = status === 'Success' ? 'default' : status === 'Failed' ? 'destructive' : 'secondary';
                return <Badge variant={variant}>{status}</Badge>
            }
        },
        { 
            accessorKey: "lastRun", 
            header: "Last Run",
            cell: ({ row }) => row.original.lastRun ? new Date(row.original.lastRun).toLocaleString() : 'Never'
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedTask(row.original); setIsEditModalOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Edit Time</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
            <Topbar />
            <div className="flex-1 p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Scheduled Tasks</h1>
                        <p className="text-sm text-zinc-400">Manage the execution time for your automated jobs.</p>
                    </div>
                </div>

                <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
                    <Card className="bg-transparent border-none">
                        <CardHeader>
                            <CardTitle>Task Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={columns} data={tasks} filterColumn="name" />
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Edit Time Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="bg-zinc-900 text-white border-zinc-800">
                    <DialogHeader>
                        <DialogTitle>Edit Schedule Time</DialogTitle>
                        <DialogDescription>
                            Change the time of day this task will run. All times are in the server's local timezone.
                        </DialogDescription>
                    </DialogHeader>
                    <TaskForm
                        task={selectedTask}
                        onSave={() => {
                            setIsEditModalOpen(false);
                            fetchTasks();
                        }}
                        token={token}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Simplified Form Component for Editing Time
function TaskForm({ task, onSave, token }: { task: Partial<ScheduledTask> | null, onSave: () => void, token: string | null }) {
    const [hour, setHour] = useState('12');
    const [minute, setMinute] = useState('00');
    const [ampm, setAmpm] = useState('AM');
    const { toast } = useToast();

    useEffect(() => {
        if (task && task.schedule) {
            try {
                const parts = task.schedule.split(' ');
                const cronMinute = parseInt(parts[0], 10);
                const cronHour = parseInt(parts[1], 10);

                if (!isNaN(cronMinute) && !isNaN(cronHour)) {
                    const newAmpm = cronHour >= 12 ? 'PM' : 'AM';
                    const newHour = cronHour % 12 === 0 ? 12 : cronHour % 12;
                    
                    setHour(String(newHour));
                    setMinute(String(cronMinute).padStart(2, '0'));
                    setAmpm(newAmpm);
                }
            } catch (e) {
                console.error("Could not parse cron string:", e);
            }
        }
    }, [task]);

    const handleSave = async () => {
        if (!token || !task) return;

        // Convert friendly time back to a 24-hour format for cron
        let twentyFourHour = parseInt(hour, 10);
        if (ampm === 'PM' && twentyFourHour !== 12) {
            twentyFourHour += 12;
        } else if (ampm === 'AM' && twentyFourHour === 12) {
            twentyFourHour = 0; // Midnight case
        }

        const newCronMinute = parseInt(minute, 10);
        
        // Reconstruct the cron string, preserving other parts (* * *)
        const newSchedule = `${newCronMinute} ${twentyFourHour} * * *`;

        // The backend expects the full task object, so we spread the original task data
        // and overwrite the schedule with the new one.
        const formData = { ...task, schedule: newSchedule };

        try {
            const response = await fetch(`/api/scheduled-tasks/${task._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save task');
            }
            toast({ title: 'Success', description: `Task schedule has been updated.` });
            onSave();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Could not save the task.', variant: 'destructive' });
        }
    };

    return (
        <div className="grid gap-6 py-4">
            <div className="grid grid-cols-3 items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="hour">Hour</Label>
                    <Select value={hour} onValueChange={setHour}>
                        <SelectTrigger id="hour"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                <SelectItem key={h} value={String(h)}>{h}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="minute">Minute</Label>
                    <Select value={minute} onValueChange={setMinute}>
                        <SelectTrigger id="minute"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="ampm">AM/PM</Label>
                    <Select value={ampm} onValueChange={setAmpm}>
                        <SelectTrigger id="ampm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleSave}>Update Schedule</Button>
            </DialogFooter>
        </div>
    );
}
