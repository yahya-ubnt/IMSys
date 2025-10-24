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
import { Switch } from "@/components/ui/switch";
import { MoreHorizontal, Play, Eye, Pencil, Trash2, PlusCircle } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import cronstrue from 'cronstrue';

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
    const { user } = useAuth();
    const { toast } = useToast();

    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Partial<ScheduledTask> | null>(null);

    const isSuperAdmin = user?.roles.includes('SUPER_ADMIN');

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/scheduled-tasks');
            if (!response.ok) throw new Error('Failed to fetch tasks');
            setTasks(await response.json());
        } catch (error) {
            toast({ title: 'Error', description: 'Could not fetch scheduled tasks.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (user) {
            fetchTasks();
        }
    }, [fetchTasks, user]);

    const handleToggle = async (task: ScheduledTask) => {
        try {
            const response = await fetch(`/api/scheduled-tasks/${task._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isEnabled: !task.isEnabled }),
            });
            if (!response.ok) throw new Error('Failed to update task');
            fetchTasks(); // Refresh the list
            toast({ title: 'Success', description: `Task '${task.name}' has been ${!task.isEnabled ? 'enabled' : 'disabled'}.` });
        } catch (error) {
            toast({ title: 'Error', description: 'Could not update the task.', variant: 'destructive' });
        }
    };
    
    const handleRunNow = async (taskId: string) => {
        try {
            const response = await fetch(`/api/scheduled-tasks/${taskId}/run`, {
                method: 'POST',
            });
            if (!response.ok) throw new Error('Failed to run task');
            toast({ title: 'Success', description: 'Task execution has been triggered.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Could not trigger the task.', variant: 'destructive' });
        }
    };

    const superAdminColumns: ColumnDef<ScheduledTask>[] = [
        {
            accessorKey: "isEnabled",
            header: "Status",
            cell: ({ row }) => (
                <Switch
                    checked={row.original.isEnabled}
                    onCheckedChange={() => handleToggle(row.original)}
                />
            ),
        },
        { accessorKey: "name", header: "Task Name" },
        { 
            accessorKey: "schedule", 
            header: "Schedule",
            cell: ({ row }) => {
                try {
                    return cronstrue.toString(row.original.schedule);
                } catch (e) {
                    return row.original.schedule;
                }
            }
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
                        <DropdownMenuItem onClick={() => handleRunNow(row.original._id)}><Play className="mr-2 h-4 w-4" /> Run Now</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedTask(row.original); setIsEditModalOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedTask(row.original); setIsLogModalOpen(true); }}><Eye className="mr-2 h-4 w-4" /> View Last Log</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const tenantColumns: ColumnDef<ScheduledTask>[] = [
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
                        <p className="text-sm text-zinc-400">Manage your application's automated jobs.</p>
                    </div>
                    {isSuperAdmin && (
                        <Button onClick={() => { setSelectedTask(null); setIsEditModalOpen(true); }} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
                            <PlusCircle className="mr-2 h-4 w-4" /> New Task
                        </Button>
                    )}
                </div>

                <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden">
                    <Card className="bg-transparent border-none">
                        <CardHeader>
                            <CardTitle>Task Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={isSuperAdmin ? superAdminColumns : tenantColumns} data={tasks} filterColumn="name" />
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
                <DialogContent className="bg-zinc-900 text-white border-zinc-800">
                    <DialogHeader>
                        <DialogTitle>Log for {selectedTask?.name}</DialogTitle>
                        <DialogDescription>
                            This is the raw log output from the last time this task was executed.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 bg-zinc-800 p-4 rounded-md max-h-96 overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap">
                            {selectedTask?.logOutput || 'No log output available.'}
                        </pre>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="bg-zinc-900 text-white border-zinc-800">
                    <DialogHeader>
                        <DialogTitle>{isSuperAdmin ? (selectedTask?._id ? 'Edit Task' : 'Create New Task') : 'Edit Schedule Time'}</DialogTitle>
                        <DialogDescription>
                            {isSuperAdmin ? 'Manage all details of this scheduled task.' : 'Change the time of day this task will run.'}
                        </DialogDescription>
                    </DialogHeader>
                    {isSuperAdmin ? (
                        <SuperAdminTaskForm task={selectedTask} onSave={() => { setIsEditModalOpen(false); fetchTasks(); }} />
                    ) : (
                        <TenantTaskForm task={selectedTask} onSave={() => { setIsEditModalOpen(false); fetchTasks(); }} />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Renamed from TaskForm to TenantTaskForm
function TenantTaskForm({ task, onSave }: { task: Partial<ScheduledTask> | null, onSave: () => void }) {
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
        if (!task) return;

        let twentyFourHour = parseInt(hour, 10);
        if (ampm === 'PM' && twentyFourHour !== 12) {
            twentyFourHour += 12;
        } else if (ampm === 'AM' && twentyFourHour === 12) {
            twentyFourHour = 0;
        }

        const newCronMinute = parseInt(minute, 10);
        const newSchedule = `${newCronMinute} ${twentyFourHour} * * *`;
        const formData = { ...task, schedule: newSchedule };

        try {
            const response = await fetch(`/api/scheduled-tasks/${task._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
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

// The original, full-featured form for Super Admins
function SuperAdminTaskForm({ task, onSave }: { task: Partial<ScheduledTask> | null, onSave: () => void }) {
    const [name, setName] = useState(task?.name || '');
    const [description, setDescription] = useState(task?.description || '');
    const [scriptPath, setScriptPath] = useState(task?.scriptPath || '');
    const [scheduleType, setScheduleType] = useState('Daily');
    const [minute, setMinute] = useState('0');
    const [hour, setHour] = useState('8');
    const [dayOfMonth, setDayOfMonth] = useState('1');
    const [dayOfWeek, setDayOfWeek] = useState('0');
    const [advancedCron, setAdvancedCron] = useState(task?.schedule || '* * * * *');
    
    const { toast } = useToast();

    const handleSave = async () => {
        let schedule = '';
        switch (scheduleType) {
            case 'Every Minute': schedule = '* * * * *'; break;
            case 'Hourly': schedule = `${minute} * * * *`; break;
            case 'Daily': schedule = `${minute} ${hour} * * *`; break;
            case 'Weekly': schedule = `${minute} ${hour} * * ${dayOfWeek}`; break;
            case 'Monthly': schedule = `${minute} ${hour} ${dayOfMonth} * *`; break;
            case 'Advanced': schedule = advancedCron; break;
        }

        const formData = { name, description, scriptPath, schedule };
        const url = task?._id ? `/api/scheduled-tasks/${task._id}` : '/api/scheduled-tasks';
        const method = task?._id ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!response.ok) throw new Error('Failed to save task');
            toast({ title: 'Success', description: `Task has been ${task?._id ? 'updated' : 'created'}.` });
            onSave();
        } catch (error) {
            toast({ title: 'Error', description: 'Could not save the task.', variant: 'destructive' });
        }
    };

    return (
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="scriptPath" className="text-right">Script Path</Label>
                <Input id="scriptPath" value={scriptPath} onChange={(e) => setScriptPath(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="scheduleType" className="text-right">Schedule Type</Label>
                <Select value={scheduleType} onValueChange={setScheduleType}>
                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Daily">Daily</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Advanced">Advanced (Cron String)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {scheduleType === 'Advanced' && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="advancedCron" className="text-right">Cron String</Label>
                    <Input id="advancedCron" value={advancedCron} onChange={(e) => setAdvancedCron(e.target.value)} className="col-span-3" />
                </div>
            )}
            {['Daily', 'Weekly', 'Monthly'].includes(scheduleType) && (
                <>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="minute" className="text-right">Minute</Label>
                        <Input id="minute" type="number" min="0" max="59" value={minute} onChange={(e) => setMinute(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="hour" className="text-right">Hour (24h)</Label>
                        <Input id="hour" type="number" min="0" max="23" value={hour} onChange={(e) => setHour(e.target.value)} className="col-span-3" />
                    </div>
                </>
            )}
            {scheduleType === 'Weekly' && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dayOfWeek" className="text-right">Day of Week</Label>
                    <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">Sunday</SelectItem>
                            <SelectItem value="1">Monday</SelectItem>
                            <SelectItem value="2">Tuesday</SelectItem>
                            <SelectItem value="3">Wednesday</SelectItem>
                            <SelectItem value="4">Thursday</SelectItem>
                            <SelectItem value="5">Friday</SelectItem>
                            <SelectItem value="6">Saturday</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
            {scheduleType === 'Monthly' && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dayOfMonth" className="text-right">Day of Month</Label>
                    <Input id="dayOfMonth" type="number" min="1" max="31" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} className="col-span-3" />
                </div>
            )}
            <DialogFooter>
                <Button onClick={handleSave}>Save Task</Button>
            </DialogFooter>
        </div>
    );
}
