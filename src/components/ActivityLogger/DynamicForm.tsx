import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Star } from 'lucide-react';
import { ActivityType, UserCategory, MeetingType, SaleType, ActivityFormData } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface DynamicFormProps {
  type: ActivityType;
  onSubmit: (data: ActivityFormData) => void;
  defaultValues?: Partial<ActivityFormData>;
}

const oneOnOneSchema = z.object({
  person_name: z.string().min(1, 'Name is required'),
  category: z.enum(['Farmer', 'Seller', 'Influencer']),
  phone: z.string().regex(/^\d{10}$/, 'Must be 10 digits').optional().or(z.literal('')),
  village_name: z.string().min(1, 'Village name is required'),
  business_potential: z.number().min(0).max(10, 'Must be between 0-10').optional().default(0),
  topics_discussed: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const groupMeetingSchema = z.object({
  village_name: z.string().min(1, 'Village name is required'),
  attendee_count: z.number().min(2, 'At least 2 attendees required'),
  meeting_type: z.enum(['Awareness', 'Product Demo', 'Training', 'Feedback']),
  key_topics: z.array(z.string()).min(1, 'Select at least one topic'),
  farmer_interest_level: z.number().min(1).max(5),
});

const sampleDistributionSchema = z.object({
  product_name: z.string().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1').max(5, 'Max 5 per product'),
  recipient_name: z.string().min(1, 'Recipient name is required'),
  purpose: z.string().min(1, 'Purpose is required'),
  expected_feedback_date: z.number().optional(), // timestamp
});

const saleProductSchema = z.object({
  sku: z.string().min(1, 'Required'),
  pack_size: z.string().min(1, 'Required'),
  quantity: z.number().min(1),
  unit_price: z.number().min(0),
  total_amount: z.number(),
});

const saleSchema = z.object({
  sale_type: z.enum(['B2C', 'B2B']),
  customer_name: z.string().min(1, 'Customer name is required'),
  products: z.array(saleProductSchema).min(1, 'Add at least one product'),
  payment_mode: z.enum(['Cash', 'UPI', 'Credit', 'Part-Payment']),
  amount_paid: z.number().min(0),
  balance: z.number(),
});

const KEY_TOPICS = ['Price', 'Quality', 'Delivery', 'Payment', 'Usage', 'Results'];

export function DynamicForm({ type, onSubmit, defaultValues }: DynamicFormProps) {
  const { t } = useTranslation();

  const getSchema = () => {
    switch (type) {
      case 'one-on-one': return oneOnOneSchema;
      case 'group-meeting': return groupMeetingSchema;
      case 'sample-distribution': return sampleDistributionSchema;
      case 'sale': return saleSchema;
      default: return z.object({});
    }
  };

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      type,
      products: [{ sku: '', pack_size: '', quantity: 1, unit_price: 0, total_amount: 0 }],
      key_topics: [],
      topics_discussed: [],
      farmer_interest_level: 3,
      payment_mode: 'Cash',
      amount_paid: 0,
      balance: 0,
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "products"
  });

  // Watchers for calculations
  const products = useWatch({ control, name: "products" });
  const amountPaid = useWatch({ control, name: "amount_paid" });
  const paymentMode = useWatch({ control, name: "payment_mode" });

  // Auto-calculate Sale Totals
  useEffect(() => {
    if (type === 'sale' && products) {
      const total = products.reduce((sum: number, p: any) => sum + (p.quantity * p.unit_price), 0);

      // Update row totals
      products.forEach((p: any, index: number) => {
        const rowTotal = p.quantity * p.unit_price;
        if (p.total_amount !== rowTotal) {
          setValue(`products.${index}.total_amount`, rowTotal);
        }
      });

      // Update balance
      if (paymentMode !== 'Part-Payment') {
        setValue('amount_paid', total);
        setValue('balance', 0);
      } else {
        setValue('balance', total - (amountPaid || 0));
      }
    }
  }, [products, amountPaid, paymentMode, setValue, type]);


  const renderOneOnOneForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="person_name">{t('oneOnOne.personName')} *</Label>
        <Input id="person_name" {...register('person_name')} placeholder="Farmer Name" className="mt-1" />
        {errors.person_name && <p className="text-red-500 text-sm">{errors.person_name?.message as string}</p>}
      </div>

      <div>
        <Label htmlFor="category">{t('oneOnOne.category')} *</Label>
        <Select onValueChange={(v) => setValue('category', v as UserCategory)} defaultValue={defaultValues?.category}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Select Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Farmer">Farmer</SelectItem>
            <SelectItem value="Seller">Seller</SelectItem>
            <SelectItem value="Influencer">Influencer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" type="tel" {...register('phone')} placeholder="10-digit number" className="mt-1" />
        {errors.phone && <p className="text-red-500 text-sm">{errors.phone?.message as string}</p>}
      </div>

      <div>
        <Label htmlFor="village_name">Village Name *</Label>
        <Input id="village_name" {...register('village_name')} placeholder="Enter Village" className="mt-1" />
        {errors.village_name && <p className="text-red-500 text-sm">{errors.village_name?.message as string}</p>}
      </div>

      <div>
        <Label htmlFor="business_potential">Business Potential (out of 10)</Label>
        <Input id="business_potential" type="number" min="0" max="10" {...register('business_potential', { valueAsNumber: true })} className="mt-1" placeholder="0-10" />
        {errors.business_potential && <p className="text-red-500 text-sm">{errors.business_potential?.message as string}</p>}
      </div>

      <div>
        <Label className="mb-2 block">Topics Discussed</Label>
        <div className="grid grid-cols-2 gap-2">
          {KEY_TOPICS.map((topic) => (
            <div key={topic} className="flex items-center space-x-2">
              <Checkbox
                id={`o-topic-${topic}`}
                onCheckedChange={(checked) => {
                  const current = watch('topics_discussed') || [];
                  if (checked) {
                    setValue('topics_discussed', [...current, topic]);
                  } else {
                    setValue('topics_discussed', current.filter((t: string) => t !== topic));
                  }
                }}
                checked={(watch('topics_discussed') || []).includes(topic)}
              />
              <label htmlFor={`o-topic-${topic}`} className="text-sm cursor-pointer">{topic}</label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="notes">{t('oneOnOne.notes')}</Label>
        <Textarea id="notes" {...register('notes')} placeholder="Discussed feed quality..." className="mt-1" />
      </div>
    </div>
  );

  const renderGroupMeetingForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="village_name">{t('groupMeeting.villageName')} *</Label>
        <Input id="village_name" {...register('village_name')} placeholder="Village Name" className="mt-1" />
        {errors.village_name && <p className="text-red-500 text-sm">{errors.village_name?.message as string}</p>}
      </div>

      <div>
        <Label htmlFor="attendee_count">{t('groupMeeting.attendeeCount')} *</Label>
        <Input id="attendee_count" type="number" min="2" {...register('attendee_count', { valueAsNumber: true })} className="mt-1" />
        {errors.attendee_count && <p className="text-red-500 text-sm">{errors.attendee_count?.message as string}</p>}
      </div>

      <div>
        <Label htmlFor="meeting_type">{t('groupMeeting.meetingType')} *</Label>
        <Select onValueChange={(v) => setValue('meeting_type', v as MeetingType)} defaultValue={defaultValues?.meeting_type}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Select Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Awareness">Awareness</SelectItem>
            <SelectItem value="Product Demo">Product Demo</SelectItem>
            <SelectItem value="Training">Training</SelectItem>
            <SelectItem value="Feedback">Feedback</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 block">Key Topics Discussed *</Label>
        <div className="grid grid-cols-2 gap-2">
          {KEY_TOPICS.map((topic) => (
            <div key={topic} className="flex items-center space-x-2">
              <Checkbox
                id={`topic-${topic}`}
                onCheckedChange={(checked) => {
                  const current = watch('key_topics') || [];
                  if (checked) {
                    setValue('key_topics', [...current, topic]);
                  } else {
                    setValue('key_topics', current.filter((t: string) => t !== topic));
                  }
                }}
                checked={(watch('key_topics') || []).includes(topic)}
              />
              <label htmlFor={`topic-${topic}`} className="text-sm cursor-pointer">{topic}</label>
            </div>
          ))}
        </div>
        {errors.key_topics && <p className="text-red-500 text-sm">{errors.key_topics?.message as string}</p>}
      </div>

      <div>
        <Label>Farmer Interest Level</Label>
        <div className="flex gap-2 mt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setValue('farmer_interest_level', star)}
              className={`p-2 rounded-full transition-colors ${(watch('farmer_interest_level') || 0) >= star ? 'text-yellow-500 bg-yellow-50' : 'text-gray-300'
                }`}
            >
              <Star className="w-8 h-8 fill-current" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSampleDistributionForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="product_name">Product Name *</Label>
        <Select onValueChange={(v) => setValue('product_name', v)}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Select Product" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="CattleFeed-5kg">CattleFeed-5kg</SelectItem>
            <SelectItem value="CattleFeed-25kg">CattleFeed-25kg</SelectItem>
            <SelectItem value="MineralMix-1kg">MineralMix-1kg</SelectItem>
          </SelectContent>
        </Select>
        {errors.product_name && <p className="text-red-500 text-sm">{errors.product_name?.message as string}</p>}
      </div>

      <div>
        <Label htmlFor="quantity">Quantity (Max 5) *</Label>
        <Input id="quantity" type="number" min="1" max="5" {...register('quantity', { valueAsNumber: true })} className="mt-1" />
        {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity?.message as string}</p>}
      </div>

      <div>
        <Label htmlFor="recipient_name">Recipient Name *</Label>
        <Input id="recipient_name" {...register('recipient_name')} className="mt-1" />
      </div>

      <div>
        <Label htmlFor="purpose">Purpose *</Label>
        <Select onValueChange={(v) => setValue('purpose', v)}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Select Purpose" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Trial">Trial</SelectItem>
            <SelectItem value="Demo">Demo</SelectItem>
            <SelectItem value="Follow-up">Follow-up</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="expected_feedback_date">Expected Feedback Date</Label>
        <Input
          id="expected_feedback_date"
          type="date"
          className="mt-1"
          onChange={(e) => setValue('expected_feedback_date', new Date(e.target.value).getTime())}
        />
      </div>
    </div>
  );

  const renderSaleForm = () => (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex items-center space-x-2">
          <RadioGroup
            defaultValue={defaultValues?.sale_type || 'B2C'}
            onValueChange={(v) => setValue('sale_type', v as SaleType)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="B2C" id="B2C" />
              <Label htmlFor="B2C">B2C Farmer</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="B2B" id="B2B" />
              <Label htmlFor="B2B">B2B Distributor</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div>
        <Label htmlFor="customer_name">Customer Name *</Label>
        <Input id="customer_name" {...register('customer_name')} placeholder="Find or add customer" className="mt-1" />
        {errors.customer_name && <p className="text-red-500 text-sm">{errors.customer_name?.message as string}</p>}
      </div>

      {/* Products Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 p-2 text-sm font-medium grid grid-cols-12 gap-2">
          <div className="col-span-4">SKU</div>
          <div className="col-span-2">Pack</div>
          <div className="col-span-2">Qty</div>
          <div className="col-span-2">Price</div>
          <div className="col-span-2"></div>
        </div>
        <div className="divide-y">
          {fields.map((field, index) => (
            <div key={field.id} className="p-2 grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4">
                <Select onValueChange={(v) => setValue(`products.${index}.sku`, v)}>
                  <SelectTrigger h-8><SelectValue placeholder="SKU" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FEED-001">FEED-001</SelectItem>
                    <SelectItem value="FEED-002">FEED-002</SelectItem>
                    <SelectItem value="MIN-001">MIN-001</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Input {...register(`products.${index}.pack_size`)} placeholder="Size" className="h-8" />
              </div>
              <div className="col-span-2">
                <Input type="number" {...register(`products.${index}.quantity`, { valueAsNumber: true })} className="h-8" />
              </div>
              <div className="col-span-2">
                <Input type="number" {...register(`products.${index}.unit_price`, { valueAsNumber: true })} className="h-8" />
              </div>
              <div className="col-span-2 flex justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-2 bg-gray-50 border-t">
          <Button type="button" variant="outline" size="sm" onClick={() => append({ sku: '', pack_size: '', quantity: 1, unit_price: 0, total_amount: 0 })}>
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>
      {errors.products && <p className="text-red-500 text-sm">{errors.products?.message as string}</p>}

      {/* Payment Section */}
      <div className="space-y-3 bg-teal-50 p-4 rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Payment Mode</Label>
            <Select onValueChange={(v) => setValue('payment_mode', v as any)} defaultValue="Cash">
              <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Credit">Credit</SelectItem>
                <SelectItem value="Part-Payment">Part-Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Total Amount</Label>
            <div className="text-2xl font-bold text-teal-700 mt-1">
              ₹{products?.reduce((sum: number, p: any) => sum + ((p.quantity || 0) * (p.unit_price || 0)), 0).toFixed(2)}
            </div>
          </div>
        </div>

        {paymentMode === 'Part-Payment' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Amount Paid</Label>
              <Input type="number" {...register('amount_paid', { valueAsNumber: true })} className="mt-1 bg-white" />
            </div>
            <div>
              <Label>Balance</Label>
              <Input type="number" readOnly {...register('balance', { valueAsNumber: true })} className="mt-1 bg-gray-100" />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderForm = () => {
    switch (type) {
      case 'one-on-one': return renderOneOnOneForm();
      case 'group-meeting': return renderGroupMeetingForm();
      case 'sample-distribution': return renderSampleDistributionForm();
      case 'sale': return renderSaleForm();
      default: return null;
    }
  };

  return (
    <form id="activity-form" onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 pb-20">
      {renderForm()}
    </form>
  );
}
