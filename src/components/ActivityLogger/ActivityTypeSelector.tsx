import { useTranslation } from 'react-i18next';
import { User, Users, Package, ShoppingCart } from 'lucide-react';
import { ActivityType } from '@/types';
import { cn } from '@/lib/utils';

interface ActivityTypeSelectorProps {
  selected: ActivityType | null;
  onSelect: (type: ActivityType) => void;
}

const activityTypes: { type: ActivityType; icon: React.ElementType; color: string }[] = [
  { type: 'one-on-one', icon: User, color: 'bg-blue-500' },
  { type: 'group-meeting', icon: Users, color: 'bg-green-500' },
  { type: 'sample-distribution', icon: Package, color: 'bg-purple-500' },
  { type: 'sale', icon: ShoppingCart, color: 'bg-orange-500' },
];

export function ActivityTypeSelector({ selected, onSelect }: ActivityTypeSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-4">
      {activityTypes.map(({ type, icon: Icon, color }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={cn(
            'activity-type-card flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all',
            'min-h-[140px] touch-target',
            selected === type
              ? 'border-teal-600 bg-teal-50'
              : 'border-gray-200 bg-white hover:border-teal-300'
          )}
        >
          <div className={cn('p-4 rounded-full mb-3', color)}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <span className="text-mobile-base font-medium text-center">
            {t(`activity.${type.replace(/-/g, '')}`)}
          </span>
        </button>
      ))}
    </div>
  );
}
