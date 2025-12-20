import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Trash2, Save, Package, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useUser } from "@/contexts/UserContext";

interface PackageData {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  annual_price: number | null;
  is_featured: boolean;
  is_active: boolean;
  tier_id: string;
  track_id: string;
  membership_tiers: { name: string };
  membership_tracks: { name: string };
}

interface PackageBenefit {
  benefit_id: string;
  quantity: number | null;
  is_unlimited: boolean;
  notes: string | null;
  benefits: {
    id: string;
    label: string;
    description: string | null;
    icon: string | null;
    is_quantifiable: boolean;
    unit_label: string | null;
    benefit_categories: { name: string } | null;
  };
}

interface AvailableBenefit {
  id: string;
  label: string;
  description: string | null;
  icon: string | null;
  is_quantifiable: boolean;
  unit_label: string | null;
  benefit_categories: { name: string } | null;
}

export default function PackageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isSuperAdmin } = useUser();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pkg, setPkg] = useState<PackageData | null>(null);
  const [packageBenefits, setPackageBenefits] = useState<PackageBenefit[]>([]);
  const [availableBenefits, setAvailableBenefits] = useState<AvailableBenefit[]>([]);

  // Form state for package details
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: 0,
    annual_price: 0,
    is_featured: false,
    is_active: true,
  });

  // Add benefit dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedBenefitId, setSelectedBenefitId] = useState('');
  const [benefitQuantity, setBenefitQuantity] = useState('1');
  const [benefitUnlimited, setBenefitUnlimited] = useState(false);
  const [benefitNotes, setBenefitNotes] = useState('');
  const [addingBenefit, setAddingBenefit] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/admin');
      return;
    }
    if (id) {
      loadPackageData();
    }
  }, [id, isSuperAdmin, navigate]);

  const loadPackageData = async () => {
    if (!id) return;

    try {
      // Load package details
      const { data: packageData, error: packageError } = await supabase
        .from('tier_track_packages')
        .select('*, membership_tiers(name), membership_tracks(name)')
        .eq('id', id)
        .single();

      if (packageError) throw packageError;
      if (!packageData) {
        navigate('/admin/packages');
        return;
      }

      setPkg(packageData as unknown as PackageData);
      setFormData({
        name: packageData.name,
        description: packageData.description || '',
        base_price: packageData.base_price || 0,
        annual_price: packageData.annual_price || 0,
        is_featured: packageData.is_featured || false,
        is_active: packageData.is_active ?? true,
      });

      // Load package benefits
      const { data: benefitsData, error: benefitsError } = await supabase
        .from('package_benefits')
        .select(`
          benefit_id,
          quantity,
          is_unlimited,
          notes,
          benefits (
            id,
            label,
            description,
            icon,
            is_quantifiable,
            unit_label,
            benefit_categories (name)
          )
        `)
        .eq('package_id', id);

      if (benefitsError) throw benefitsError;
      setPackageBenefits((benefitsData || []) as unknown as PackageBenefit[]);

      // Load all available benefits
      const { data: allBenefits, error: allBenefitsError } = await supabase
        .from('benefits')
        .select('id, label, description, icon, is_quantifiable, unit_label, benefit_categories(name)')
        .eq('is_active', true)
        .order('label');

      if (allBenefitsError) throw allBenefitsError;
      setAvailableBenefits((allBenefits || []) as unknown as AvailableBenefit[]);

    } catch (error) {
      console.error('Error loading package:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load package' });
      navigate('/admin/packages');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePackage = async () => {
    if (!id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('tier_track_packages')
        .update({
          name: formData.name,
          description: formData.description || null,
          base_price: formData.base_price,
          annual_price: formData.annual_price || null,
          is_featured: formData.is_featured,
          is_active: formData.is_active,
        })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Package updated', description: 'Package details have been saved.' });
      loadPackageData();
    } catch (error) {
      console.error('Error saving package:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save package' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddBenefit = async () => {
    if (!id || !selectedBenefitId) return;

    setAddingBenefit(true);
    try {
      const { error } = await supabase
        .from('package_benefits')
        .insert({
          package_id: id,
          benefit_id: selectedBenefitId,
          quantity: benefitUnlimited ? null : parseInt(benefitQuantity) || 1,
          is_unlimited: benefitUnlimited,
          notes: benefitNotes || null,
        });

      if (error) throw error;

      toast({ title: 'Benefit added', description: 'Benefit has been added to this package.' });
      setShowAddDialog(false);
      resetAddForm();
      loadPackageData();
    } catch (error) {
      console.error('Error adding benefit:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add benefit' });
    } finally {
      setAddingBenefit(false);
    }
  };

  const handleRemoveBenefit = async (benefitId: string) => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('package_benefits')
        .delete()
        .eq('package_id', id)
        .eq('benefit_id', benefitId);

      if (error) throw error;

      toast({ title: 'Benefit removed', description: 'Benefit has been removed from this package.' });
      loadPackageData();
    } catch (error) {
      console.error('Error removing benefit:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove benefit' });
    }
  };

  const handleUpdateBenefitQuantity = async (benefitId: string, quantity: number | null, isUnlimited: boolean) => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('package_benefits')
        .update({
          quantity: isUnlimited ? null : quantity,
          is_unlimited: isUnlimited,
        })
        .eq('package_id', id)
        .eq('benefit_id', benefitId);

      if (error) throw error;
      loadPackageData();
    } catch (error) {
      console.error('Error updating benefit:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update benefit' });
    }
  };

  const resetAddForm = () => {
    setSelectedBenefitId('');
    setBenefitQuantity('1');
    setBenefitUnlimited(false);
    setBenefitNotes('');
  };

  // Filter out benefits already added to this package
  const unassignedBenefits = availableBenefits.filter(
    (b) => !packageBenefits.some((pb) => pb.benefit_id === b.id)
  );

  if (loading) {
    return (
      <AdminLayout breadcrumbs={[{ label: 'Packages', href: '/admin/packages' }, { label: 'Loading...' }]}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!pkg) {
    return null;
  }

  return (
    <AdminLayout breadcrumbs={[{ label: 'Packages', href: '/admin/packages' }, { label: pkg.name }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Package className="h-6 w-6" />
              {pkg.name}
            </h1>
            <p className="text-muted-foreground">
              <span className="capitalize">{pkg.membership_tiers.name}</span> tier × {pkg.membership_tracks.name} track
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/packages')}>
              Back to Packages
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Package Details */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Package Details</CardTitle>
              <CardDescription>Edit package information and pricing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="base_price">Base Price ($)</Label>
                  <Input
                    id="base_price"
                    type="number"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="annual_price">Annual Price ($)</Label>
                  <Input
                    id="annual_price"
                    type="number"
                    value={formData.annual_price}
                    onChange={(e) => setFormData({ ...formData, annual_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="is_featured" className="cursor-pointer">Featured</Label>
                  <p className="text-xs text-muted-foreground">Highlight this package</p>
                </div>
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
                  <p className="text-xs text-muted-foreground">Available for new members</p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              <Button onClick={handleSavePackage} disabled={saving} className="w-full gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Package
              </Button>
            </CardContent>
          </Card>

          {/* Package Benefits */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Package Benefits ({packageBenefits.length})
                </CardTitle>
                <CardDescription>Benefits included in this package</CardDescription>
              </div>
              <Button onClick={() => setShowAddDialog(true)} size="sm" className="gap-1" disabled={unassignedBenefits.length === 0}>
                <Plus className="h-4 w-4" />
                Add Benefit
              </Button>
            </CardHeader>
            <CardContent>
              {packageBenefits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No benefits assigned to this package yet.</p>
                  <p className="text-sm">Click "Add Benefit" to include benefits.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Benefit</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packageBenefits.map((pb) => (
                      <TableRow key={pb.benefit_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{pb.benefits.label}</p>
                            {pb.benefits.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{pb.benefits.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {pb.benefits.benefit_categories?.name || 'Uncategorized'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {pb.benefits.is_quantifiable ? (
                              <>
                                <Checkbox
                                  checked={pb.is_unlimited}
                                  onCheckedChange={(checked) =>
                                    handleUpdateBenefitQuantity(pb.benefit_id, pb.quantity, checked as boolean)
                                  }
                                />
                                <span className="text-xs text-muted-foreground">Unlimited</span>
                                {!pb.is_unlimited && (
                                  <Input
                                    type="number"
                                    min="1"
                                    value={pb.quantity || 1}
                                    onChange={(e) =>
                                      handleUpdateBenefitQuantity(pb.benefit_id, parseInt(e.target.value) || 1, false)
                                    }
                                    className="w-20 h-8"
                                  />
                                )}
                                {pb.benefits.unit_label && !pb.is_unlimited && (
                                  <span className="text-xs text-muted-foreground">{pb.benefits.unit_label}</span>
                                )}
                              </>
                            ) : (
                              <Badge variant="secondary">Included</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                          {pb.notes || '—'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveBenefit(pb.benefit_id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Benefit Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Benefit to Package</DialogTitle>
              <DialogDescription>
                Select a benefit to include in this package
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Benefit</Label>
                <Select value={selectedBenefitId} onValueChange={setSelectedBenefitId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a benefit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedBenefits.map((benefit) => (
                      <SelectItem key={benefit.id} value={benefit.id}>
                        <div className="flex items-center gap-2">
                          <span>{benefit.label}</span>
                          {benefit.benefit_categories?.name && (
                            <Badge variant="outline" className="text-xs">
                              {benefit.benefit_categories.name}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedBenefitId && (
                <>
                  {unassignedBenefits.find(b => b.id === selectedBenefitId)?.is_quantifiable && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="unlimited"
                          checked={benefitUnlimited}
                          onCheckedChange={(checked) => setBenefitUnlimited(checked as boolean)}
                        />
                        <Label htmlFor="unlimited" className="cursor-pointer">Unlimited quantity</Label>
                      </div>
                      {!benefitUnlimited && (
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={benefitQuantity}
                            onChange={(e) => setBenefitQuantity(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <Label>Notes (optional)</Label>
                    <Input
                      value={benefitNotes}
                      onChange={(e) => setBenefitNotes(e.target.value)}
                      placeholder="e.g., VIP access only"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setShowAddDialog(false); resetAddForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleAddBenefit} disabled={!selectedBenefitId || addingBenefit}>
                  {addingBenefit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Benefit
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
