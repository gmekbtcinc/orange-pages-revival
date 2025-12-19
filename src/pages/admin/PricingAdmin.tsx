import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useUser } from "@/contexts/UserContext";

interface PricingThreshold {
  id: string;
  threshold_type: string;
  threshold_value: number;
  discount_percentage: number;
  discount_label: string;
  is_active: boolean;
  display_order: number;
}

export default function PricingAdmin() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useUser();
  const { toast } = useToast();
  const [thresholds, setThresholds] = useState<PricingThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<PricingThreshold | null>(null);
  const [formData, setFormData] = useState({
    threshold_type: 'benefit_count',
    threshold_value: 0,
    discount_percentage: 0,
    discount_label: '',
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/admin');
      return;
    }
    loadData();
  }, [isSuperAdmin, navigate]);

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_thresholds')
        .select('*')
        .order('display_order');

      if (error) throw error;
      if (data) setThresholds(data);
    } catch (error) {
      console.error('Error loading thresholds:', error);
      toast({ title: 'Error loading thresholds', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingThreshold) {
        const { error } = await supabase
          .from('pricing_thresholds')
          .update(formData)
          .eq('id', editingThreshold.id);

        if (error) throw error;
        toast({ title: 'Threshold updated successfully' });
      } else {
        const { error } = await supabase
          .from('pricing_thresholds')
          .insert([formData]);

        if (error) throw error;
        toast({ title: 'Threshold created successfully' });
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving threshold:', error);
      toast({ title: 'Error saving threshold', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this threshold?')) return;

    try {
      const { error } = await supabase
        .from('pricing_thresholds')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Threshold deleted successfully' });
      loadData();
    } catch (error) {
      console.error('Error deleting threshold:', error);
      toast({ title: 'Error deleting threshold', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      threshold_type: 'benefit_count',
      threshold_value: 0,
      discount_percentage: 0,
      discount_label: '',
      is_active: true,
      display_order: 0,
    });
    setEditingThreshold(null);
  };

  const handleEdit = (threshold: PricingThreshold) => {
    setFormData({
      threshold_type: threshold.threshold_type,
      threshold_value: threshold.threshold_value,
      discount_percentage: threshold.discount_percentage,
      discount_label: threshold.discount_label,
      is_active: threshold.is_active,
      display_order: threshold.display_order,
    });
    setEditingThreshold(threshold);
    setDialogOpen(true);
  };

  const getThresholdTypeLabel = (type: string) => {
    switch (type) {
      case 'benefit_count': return 'Benefit Count';
      case 'total_value': return 'Total Value';
      case 'tier_based': return 'Tier Based';
      default: return type;
    }
  };

  if (loading) {
    return (
      <AdminLayout breadcrumbs={[{ label: 'Pricing' }]}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout breadcrumbs={[{ label: 'Pricing' }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pricing Thresholds</h1>
            <p className="text-muted-foreground">
              Manage automatic discounts based on benefit count or total value
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Threshold
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingThreshold ? 'Edit Threshold' : 'Create Threshold'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="threshold_type">Threshold Type</Label>
                    <Select
                      value={formData.threshold_type}
                      onValueChange={(value) => setFormData({ ...formData, threshold_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="benefit_count">Benefit Count</SelectItem>
                        <SelectItem value="total_value">Total Value ($)</SelectItem>
                        <SelectItem value="tier_based">Tier Based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="threshold_value">
                      Threshold Value {formData.threshold_type === 'total_value' && '($)'}
                    </Label>
                    <Input
                      id="threshold_value"
                      type="number"
                      step={formData.threshold_type === 'total_value' ? '0.01' : '1'}
                      value={formData.threshold_value}
                      onChange={(e) => setFormData({ ...formData, threshold_value: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discount_percentage">Discount %</Label>
                    <Input
                      id="discount_percentage"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_label">Display Label</Label>
                  <Input
                    id="discount_label"
                    value={formData.discount_label}
                    onChange={(e) => setFormData({ ...formData, discount_label: e.target.value })}
                    placeholder="e.g., 5+ benefits: 5% discount"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingThreshold ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pricing Thresholds ({thresholds.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {thresholds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No pricing thresholds configured
                    </TableCell>
                  </TableRow>
                ) : (
                  thresholds.map((threshold) => (
                    <TableRow key={threshold.id}>
                      <TableCell>{getThresholdTypeLabel(threshold.threshold_type)}</TableCell>
                      <TableCell>
                        {threshold.threshold_type === 'total_value'
                          ? `$${threshold.threshold_value.toLocaleString()}`
                          : threshold.threshold_value
                        }
                      </TableCell>
                      <TableCell>{threshold.discount_percentage}%</TableCell>
                      <TableCell>{threshold.discount_label}</TableCell>
                      <TableCell>
                        <span className={threshold.is_active ? 'text-green-600' : 'text-muted-foreground'}>
                          {threshold.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>{threshold.display_order}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(threshold)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(threshold.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
