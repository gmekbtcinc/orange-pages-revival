import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Pencil, Search, ArrowUpDown, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ImageUpload } from '@/components/ui/image-upload';
import { BrandSelector } from '@/components/ui/brand-selector';
import { BrandBadge } from '@/components/ui/brand-badge';
import { useMember } from '@/contexts/member/MemberContext';

interface Benefit {
  id: string;
  label: string;
  description: string | null;
  benefit_category_id: string;
  sub_category: string | null;
  block_value: number | null;
  base_price: number;
  region_multiplier: number | null;
  is_add_on: boolean | null;
  inventory_limit: string | null;
  internal_notes: string | null;
  image_url: string | null;
  benefit_categories: { name: string };
}

interface BenefitCategory {
  id: string;
  name: string;
}

interface BrandTag {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
}

export default function BenefitsAdmin() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useMember();
  const { toast } = useToast();
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [categories, setCategories] = useState<BenefitCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    benefit_category_id: '',
    sub_category: '',
    block_value: 0,
    base_price: 0,
    region_multiplier: 1.0,
    is_add_on: false,
    inventory_limit: '',
    internal_notes: '',
    image_url: null as string | null,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortField, setSortField] = useState<'label' | 'category' | 'price'>('label');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [brandTags, setBrandTags] = useState<Record<string, BrandTag[]>>({});

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/admin');
      return;
    }
    loadData();
  }, [isSuperAdmin, navigate]);

  const loadData = async () => {
    try {
      const [benefitsRes, categoriesRes] = await Promise.all([
        supabase
          .from('benefits')
          .select('*, benefit_categories(name)')
          .order('label')
          .limit(500),
        supabase
          .from('benefit_categories')
          .select('*')
          .order('display_order'),
      ]);

      if (benefitsRes.data) {
        setBenefits(benefitsRes.data as Benefit[]);
        await loadBrandAssociations(benefitsRes.data.map(b => b.id));
      }
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBrandAssociations = async (benefitIds: string[]) => {
    try {
      const { data } = await supabase
        .from('benefit_brand_tags')
        .select('benefit_id, brand_tag_id, brand_tags(id, name, logo_url, website_url)')
        .in('benefit_id', benefitIds);

      if (data) {
        const brandMap: Record<string, BrandTag[]> = {};
        data.forEach(item => {
          if (!brandMap[item.benefit_id]) {
            brandMap[item.benefit_id] = [];
          }
          if (item.brand_tags) {
            brandMap[item.benefit_id].push(item.brand_tags as unknown as BrandTag);
          }
        });
        setBrandTags(brandMap);
      }
    } catch (error) {
      console.error('Error loading brand associations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dataToSave = {
        ...formData,
        sub_category: formData.sub_category || null,
        inventory_limit: formData.inventory_limit || null,
        internal_notes: formData.internal_notes || null,
        description: formData.description || null,
      };

      let benefitId: string;

      if (editingBenefit) {
        const { error } = await supabase
          .from('benefits')
          .update(dataToSave)
          .eq('id', editingBenefit.id);

        if (error) throw error;
        benefitId = editingBenefit.id;
        toast({ title: 'Benefit updated successfully' });
      } else {
        const { data, error } = await supabase
          .from('benefits')
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;
        benefitId = data.id;
        toast({ title: 'Benefit created successfully' });
      }

      await supabase
        .from('benefit_brand_tags')
        .delete()
        .eq('benefit_id', benefitId);

      if (selectedBrandIds.length > 0) {
        const associations = selectedBrandIds.map(brandId => ({
          benefit_id: benefitId,
          brand_tag_id: brandId,
        }));

        const { error: brandError } = await supabase
          .from('benefit_brand_tags')
          .insert(associations);

        if (brandError) throw brandError;
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving benefit:', error);
      toast({ title: 'Error saving benefit', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setEditingBenefit(null);
    setFormData({
      label: '',
      description: '',
      benefit_category_id: '',
      sub_category: '',
      block_value: 0,
      base_price: 0,
      region_multiplier: 1.0,
      is_add_on: false,
      inventory_limit: '',
      internal_notes: '',
      image_url: null,
    });
    setSelectedBrandIds([]);
  };

  const handleEdit = async (benefit: Benefit) => {
    setEditingBenefit(benefit);
    setFormData({
      label: benefit.label,
      description: benefit.description || '',
      benefit_category_id: benefit.benefit_category_id,
      sub_category: benefit.sub_category || '',
      block_value: benefit.block_value || 0,
      base_price: benefit.base_price || 0,
      region_multiplier: benefit.region_multiplier || 1.0,
      is_add_on: benefit.is_add_on || false,
      inventory_limit: benefit.inventory_limit || '',
      internal_notes: benefit.internal_notes || '',
      image_url: benefit.image_url || null,
    });

    const { data } = await supabase
      .from('benefit_brand_tags')
      .select('brand_tag_id')
      .eq('benefit_id', benefit.id);

    if (data) {
      setSelectedBrandIds(data.map(item => item.brand_tag_id));
    }

    setDialogOpen(true);
  };

  const filteredAndSortedBenefits = useMemo(() => {
    let filtered = benefits.filter(benefit => {
      const matchesSearch =
        benefit.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        benefit.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        filterCategory === 'all' || benefit.benefit_categories.name === filterCategory;

      return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => {
      let aVal: string | number, bVal: string | number;

      switch (sortField) {
        case 'label':
          aVal = a.label.toLowerCase();
          bVal = b.label.toLowerCase();
          break;
        case 'category':
          aVal = a.benefit_categories.name.toLowerCase();
          bVal = b.benefit_categories.name.toLowerCase();
          break;
        case 'price':
          aVal = a.base_price;
          bVal = b.base_price;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [benefits, searchQuery, filterCategory, sortField, sortDirection]);

  const handleSort = (field: 'label' | 'category' | 'price') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (loading) {
    return (
      <AdminLayout breadcrumbs={[{ label: 'Benefits' }]}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout breadcrumbs={[{ label: 'Benefits' }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manage Benefits</h1>
            <p className="text-muted-foreground">
              Add, edit, and organize membership benefits and categories
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Create Benefit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingBenefit ? 'Edit' : 'Create'} Benefit</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="label">Name *</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.benefit_category_id}
                    onValueChange={(value) => setFormData({ ...formData, benefit_category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sub_category">Sub-Category</Label>
                  <Input
                    id="sub_category"
                    value={formData.sub_category}
                    onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                    placeholder="e.g., Display Ads, Booth Space"
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

                <div>
                  <Label>Benefit Image (Optional)</Label>
                  <ImageUpload
                    bucket="benefit-images"
                    value={formData.image_url}
                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="block_value">Block Value</Label>
                    <Input
                      id="block_value"
                      type="number"
                      value={formData.block_value}
                      onChange={(e) => setFormData({ ...formData, block_value: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="base_price">Base Price ($)</Label>
                    <Input
                      id="base_price"
                      type="number"
                      step="0.01"
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="region_multiplier">Region Multiplier</Label>
                    <Input
                      id="region_multiplier"
                      type="number"
                      step="0.1"
                      value={formData.region_multiplier}
                      onChange={(e) => setFormData({ ...formData, region_multiplier: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="inventory_limit">Inventory Limit</Label>
                    <Input
                      id="inventory_limit"
                      value={formData.inventory_limit}
                      onChange={(e) => setFormData({ ...formData, inventory_limit: e.target.value })}
                      placeholder="e.g., 10 spots"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_add_on"
                    checked={formData.is_add_on}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_add_on: checked })}
                  />
                  <Label htmlFor="is_add_on">Is Add-On?</Label>
                </div>

                <div>
                  <Label htmlFor="internal_notes">Internal Notes</Label>
                  <Textarea
                    id="internal_notes"
                    value={formData.internal_notes}
                    onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Associated Brands (Optional)</Label>
                  <BrandSelector
                    selectedBrandIds={selectedBrandIds}
                    onChange={setSelectedBrandIds}
                    categoryFilter={formData.benefit_category_id}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingBenefit ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search benefits by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-xs mb-1.5 block">Category</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories ({benefits.length})</SelectItem>
                      {categories.map((cat) => {
                        const count = benefits.filter(b => b.benefit_category_id === cat.id).length;
                        return (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name} ({count})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {(searchQuery || filterCategory !== 'all') && (
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setFilterCategory('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                Showing {filteredAndSortedBenefits.length} of {benefits.length} benefits
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Benefits ({benefits.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -ml-2"
                      onClick={() => handleSort('label')}
                    >
                      Name
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -ml-2"
                      onClick={() => handleSort('category')}
                    >
                      Category
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Brands</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -ml-2"
                      onClick={() => handleSort('price')}
                    >
                      Base Price
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedBenefits.map((benefit) => (
                  <TableRow key={benefit.id}>
                    <TableCell>
                      {benefit.image_url ? (
                        <img
                          src={benefit.image_url}
                          alt={benefit.label}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          N/A
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{benefit.label}</TableCell>
                    <TableCell>{benefit.benefit_categories.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {brandTags[benefit.id]?.map((brand) => (
                          <BrandBadge
                            key={brand.id}
                            name={brand.name}
                            logoUrl={brand.logo_url}
                            websiteUrl={brand.website_url}
                            size="sm"
                            showLogo={false}
                          />
                        ))}
                        {(!brandTags[benefit.id] || brandTags[benefit.id].length === 0) && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>${benefit.base_price?.toLocaleString() || '0'}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(benefit)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
