import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

interface AddOfficerDialogProps {
    onSuccess: () => void;
}

export function AddOfficerDialog({ onSuccess }: AddOfficerDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { token } = useAuthStore();

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        territory: 'Jaipur',
        language: 'en',
        password: 'password123'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await axios.post('/api/admin/officers', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Officer created successfully');
            setOpen(false);
            onSuccess();

            // Reset form
            setFormData({
                name: '',
                phone: '',
                email: '',
                territory: 'Jaipur',
                language: 'en',
                password: 'password123'
            });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create officer');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700">
                    <Plus className="h-4 w-4 mr-2" /> Add Officer
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add New Officer</DialogTitle>
                        <DialogDescription>
                            Create a new field officer account instantly. Credentials will be sent via SMS.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input
                                id="name"
                                className="col-span-3"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">Phone</Label>
                            <Input
                                id="phone"
                                className="col-span-3"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                required
                                maxLength={10}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                className="col-span-3"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="territory" className="text-right">Region</Label>
                            <Select
                                value={formData.territory}
                                onValueChange={val => setFormData({ ...formData, territory: val })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select region" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Jaipur">Jaipur</SelectItem>
                                    <SelectItem value="Indore">Indore</SelectItem>
                                    <SelectItem value="Ahmedabad">Ahmedabad</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Account
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
