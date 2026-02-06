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
import { Copy, RefreshCw, Key } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

export function AccessCodeGenerator() {
    const [open, setOpen] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { token } = useAuthStore();

    const handleGenerateValues = async () => {
        setIsLoading(true);
        try {
            const res = await axios.post('/api/admin/generate-invite-code', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGeneratedCode(res.data.code);
        } catch (error) {
            toast.error('Failed to generate code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (generatedCode) {
            navigator.clipboard.writeText(generatedCode);
            toast.success('Code copied to clipboard');
        }
    };

    const handleClose = () => {
        setOpen(false);
        setGeneratedCode(null);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-dashed border-2">
                    <Key className="h-4 w-4 mr-2" /> Invite with Code
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Generate Access Code</DialogTitle>
                    <DialogDescription>
                        Create a one-time use code for a new officer. They can use this code to register and skip the approval queue.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                    {generatedCode ? (
                        <div className="flex items-center gap-2 w-full">
                            <div className="flex-1 bg-gray-100 p-4 rounded-lg text-center font-mono text-2xl font-bold tracking-widest border">
                                {generatedCode}
                            </div>
                            <Button size="icon" variant="outline" className="h-16 w-16" onClick={handleCopy}>
                                <Copy className="h-6 w-6" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            size="lg"
                            className="w-full h-16 text-lg"
                            onClick={handleGenerateValues}
                            disabled={isLoading}
                        >
                            {isLoading ? <RefreshCw className="h-6 w-6 animate-spin mr-2" /> : <Key className="h-6 w-6 mr-2" />}
                            Generate Code
                        </Button>
                    )}

                    {generatedCode && (
                        <p className="text-xs text-orange-600 flex items-center">
                            * This code is valid for one-time use only.
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={handleClose}>
                        Done
                    </Button>
                    {generatedCode && (
                        <Button onClick={handleGenerateValues} disabled={isLoading} variant="secondary">
                            <RefreshCw className="h-4 w-4 mr-2" /> Generate New
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
