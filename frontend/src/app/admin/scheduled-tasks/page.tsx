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

    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
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
        } else {
            // Clear tasks and set loading to false if no token (logged out)
            setTasks([]);
            setLoading(false);
        }
    }, [fetchTasks, token]);

    const handleToggle = async (task: ScheduledTask) => {
        try {
            const response = await fetch(`/api/scheduled-tasks/${task._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to run task');
            toast({ title: 'Success', description: 'Task execution has been triggered.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Could not trigger the task.', variant: 'destructive' });
        }
    };

    const columns: ColumnDef<ScheduledTask>[] = [
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

    return (
        <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
            <Topbar />
            <div className="flex-1 p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Scheduled Tasks</h1>
                        <p className="text-sm text-zinc-400">Manage your application's automated jobs.</p>
                    </div>
                    <Button onClick={() => { setSelectedTask(null); setIsEditModalOpen(true); }} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
                        <PlusCircle className="mr-2 h-4 w-4" /> New Task
                    </Button>
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

            {/* Log Viewer Modal */}
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

            {/* Edit/Create Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="bg-zinc-900 text-white border-zinc-800">
                    <DialogHeader>
                        <DialogTitle>{selectedTask?._id ? 'Edit Task' : 'Create New Task'}</DialogTitle>
                        <DialogDescription>
                            {selectedTask?._id ? 'Modify the details of this scheduled task.' : 'Create a new automated task to run on a schedule.'}
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

// Form Component for Creating/Editing Tasks
function TaskForm({ task, onSave, token }: { task: Partial<ScheduledTask> | null, onSave: () => void, token: string | null }) {
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
        if (!token) return;

        let schedule = '';
        switch (scheduleType) {
            case 'Every Minute':
                schedule = '* * * * *';
                break;
            case 'Hourly':
                schedule = `${minute} * * * *`;
                break;
            case 'Daily':
                schedule = `${minute} ${hour} * * *`;
                break;
            case 'Weekly':
                schedule = `${minute} ${hour} * * ${dayOfWeek}`;
                break;
            case 'Monthly':
                schedule = `${minute} ${hour} ${dayOfMonth} * *`;
                break;
            case 'Advanced':
                schedule = advancedCron;
                break;
        }

        const formData = { name, description, scriptPath, schedule };
        const url = task?._id ? `/api/scheduled-tasks/${task._id}` : '/api/scheduled-tasks';
        const method = task?._id ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
            {/* Basic Info */}
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

            {/* Schedule Builder */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="scheduleType" className="text-right">Schedule Type</Label>
                <Select value={scheduleType} onValueChange={setScheduleType}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a schedule type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Every Minute">Every Minute</SelectItem>
                        <SelectItem value="Hourly">Hourly</SelectItem>
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

            {['Hourly', 'Daily', 'Weekly', 'Monthly'].includes(scheduleType) && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="minute" className="text-right">Minute</Label>
                    <Input id="minute" type="number" min="0" max="59" value={minute} onChange={(e) => setMinute(e.target.value)} className="col-span-3" />
                </div>
            )}

            {['Daily', 'Weekly', 'Monthly'].includes(scheduleType) && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="hour" className="text-right">Hour (24h)</Label>
                    <Input id="hour" type="number" min="0" max="23" value={hour} onChange={(e) => setHour(e.target.value)} className="col-span-3" />
                </div>
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
