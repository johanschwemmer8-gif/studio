
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Save, Sparkles } from 'lucide-react';

const profileSchema = z.object({
  id: z.string().optional(),
  profileName: z.string().min(1, 'Profile name is required'),
  personality: z.enum(['Friendly', 'Expert', 'Humorous', 'Formal', 'Casual', 'Energetic']),
  intent: z.array(z.string()).min(1, 'At least one intent is required'),
  constraints: z.string().optional(),
  integrationFlags: z.object({
    use_ecommerce_feed: z.boolean().default(false),
    use_loyalty_api: z.boolean().default(false),
    use_campaign_tags: z.boolean().default(false),
  }),
  samplePrompts: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

type AIProfile = z.infer<typeof profileSchema>;

const intentOptions = ['Upsell', 'Cross-sell', 'Info-only', 'Loyalty-prompt', 'Support'];
const personalityOptions = ['Friendly', 'Expert', 'Humorous', 'Formal', 'Casual', 'Energetic'];

export default function AIProfileManager() {
  const [profiles, setProfiles] = useState<AIProfile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<AIProfile | null>(null);
  const { toast } = useToast();

  const form = useForm<AIProfile>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      profileName: '',
      personality: 'Friendly',
      intent: [],
      constraints: '',
      integrationFlags: {
        use_ecommerce_feed: false,
        use_loyalty_api: false,
        use_campaign_tags: false,
      },
      samplePrompts: [''],
    },
  });

  useEffect(() => {
    try {
      const savedProfiles = localStorage.getItem('aiProfiles');
      if (savedProfiles) {
        setProfiles(JSON.parse(savedProfiles));
      }
    } catch (error) {
      console.error("Failed to parse AI profiles from localStorage", error);
    }
  }, []);

  const saveProfilesToStorage = (updatedProfiles: AIProfile[]) => {
    localStorage.setItem('aiProfiles', JSON.stringify(updatedProfiles));
    setProfiles(updatedProfiles);
  };
  
  const handleOpenDialog = (profile: AIProfile | null = null) => {
    setEditingProfile(profile);
    if (profile) {
      form.reset(profile);
    } else {
      form.reset({
        profileName: '',
        personality: 'Friendly',
        intent: [],
        constraints: '',
        integrationFlags: { use_ecommerce_feed: false, use_loyalty_api: false, use_campaign_tags: false },
        samplePrompts: [''],
      });
    }
    setIsDialogOpen(true);
  };
  
  const onSubmit = (data: AIProfile) => {
    let updatedProfiles;
    const now = new Date().toISOString();

    if (editingProfile) {
      updatedProfiles = profiles.map(p => p.id === editingProfile.id ? { ...data, updatedAt: now } : p);
       toast({ title: "Profile Updated", description: `"${data.profileName}" has been successfully updated.` });
    } else {
      const newProfile = { ...data, id: `profile_${Date.now()}`, createdAt: now, updatedAt: now };
      updatedProfiles = [...profiles, newProfile];
      toast({ title: "Profile Created", description: `New profile "${data.profileName}" has been successfully created.` });
    }
    
    saveProfilesToStorage(updatedProfiles);
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const updatedProfiles = profiles.filter(p => p.id !== id);
    saveProfilesToStorage(updatedProfiles);
    toast({ title: "Profile Deleted", description: "The AI profile has been deleted.", variant: "destructive" });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> AI Profile Manager</CardTitle>
          <CardDescription>
            Create and manage AI personalities to tailor customer interactions.
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2" />
                    Create New Profile
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                 <form onSubmit={form.handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>{editingProfile ? 'Edit' : 'Create'} AI Profile</DialogTitle>
                        <DialogDescription>Define the behavior and personality of your AI assistant.</DialogDescription>
                    </DialogHeader>
                    <div className="grid md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                        <div className="space-y-4">
                            <FormItem field={form.register('profileName')} label="Profile Name"><Input placeholder="e.g., Summer Sale Helper" /></FormItem>
                            <FormItem label="Personality">
                                <Controller name="personality" control={form.control} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{personalityOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
                                )}/>
                            </FormItem>
                             <FormItem label="Intents">
                                <div className="grid grid-cols-2 gap-2 p-3 border rounded-md">
                                    {intentOptions.map(intent => (
                                        <div key={intent} className="flex items-center gap-2">
                                            <input type="checkbox" id={`intent-${intent}`} value={intent} {...form.register('intent')} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                                            <Label htmlFor={`intent-${intent}`} className="font-normal">{intent}</Label>
                                        </div>
                                    ))}
                                </div>
                                {form.formState.errors.intent && <p className="text-sm text-destructive">{form.formState.errors.intent.message}</p>}
                            </FormItem>
                        </div>
                        <div className="space-y-4">
                             <FormItem field={form.register('constraints')} label="Constraints"><Textarea placeholder="e.g., max 3 suggestions, avoid using the word 'cheap'" /></FormItem>
                            <div>
                               <Label className="font-semibold">Integration Flags</Label>
                                <div className="space-y-2 mt-2">
                                    <FormItem field={form.register('integrationFlags.use_ecommerce_feed')} label="Use E-commerce Feed" asSwitch />
                                    <FormItem field={form.register('integrationFlags.use_loyalty_api')} label="Use Loyalty API" asSwitch />
                                    <FormItem field={form.register('integrationFlags.use_campaign_tags')} label="Use Campaign Tags" asSwitch />
                                </div>
                            </div>
                        </div>
                    </div>
                     <DialogFooter>
                        <Button type="submit"><Save className="mr-2"/>Save Profile</Button>
                    </DialogFooter>
                 </form>
            </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profile Name</TableHead>
              <TableHead>Personality</TableHead>
              <TableHead>Intents</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center h-24">No AI profiles created yet.</TableCell></TableRow>
            ) : profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="font-medium">{profile.profileName}</TableCell>
                <TableCell><Badge variant="outline">{profile.personality}</Badge></TableCell>
                <TableCell className="flex flex-wrap gap-1 max-w-xs">{profile.intent.map(i => <Badge key={i} variant="secondary">{i}</Badge>)}</TableCell>
                <TableCell>{profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(profile)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(profile.id!)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}


function FormItem({ field, label, children, asSwitch=false }: { field: any, label: string, children?: React.ReactNode, asSwitch?: boolean }) {
    if (asSwitch) {
        return (
             <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor={field.name} className="font-normal">{label}</Label>
                <Controller name={field.name} control={field.control} render={({ field: controllerField }) => (
                     <Switch id={field.name} checked={controllerField.value} onCheckedChange={controllerField.onChange} />
                )} />
             </div>
        )
    }
    return (
        <div className="space-y-2">
            <Label htmlFor={field.name}>{label}</Label>
            {children}
        </div>
    )
}
