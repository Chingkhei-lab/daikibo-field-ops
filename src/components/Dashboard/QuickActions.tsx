import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Leaf, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QuickActions() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="space-y-3">
            <div className="flex gap-3">
                <Button
                    className="flex-1 h-12 rounded-xl shadow-md bg-teal-600 hover:bg-teal-700 text-white text-base font-semibold gap-2"
                    onClick={() => navigate('/activity/new')}
                >
                    <ClipboardList className="h-5 w-5" />
                    {t('actions.logActivity')}
                </Button>

                <Button
                    className="flex-1 h-12 rounded-xl shadow-md bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold gap-2"
                    onClick={() => navigate('/farm/new')}
                >
                    <Leaf className="h-5 w-5" />
                    {t('actions.addFarm')}
                </Button>
            </div>

            <Button
                variant="outline"
                className="w-full h-11 rounded-xl border-2 border-blue-200 hover:bg-blue-50 text-blue-700 font-semibold gap-2"
                onClick={() => navigate('/farms')}
            >
                <Home className="h-5 w-5" />
                {t('actions.farmDatabase')}
            </Button>
        </div>
    );
}
