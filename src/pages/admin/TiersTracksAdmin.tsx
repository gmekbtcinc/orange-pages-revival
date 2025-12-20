import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Pencil, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { BrandSelector } from '@/components/ui/brand-selector';
import { BrandBadge } from '@/components/ui/brand-badge';
import { ImageUpload } from '@/components/ui/image-upload';
import { useUser } from "@/contexts/UserContext";

interface Tier {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  icon_url: string | null;
  description: string | null;
  tagline: string | null;
  color_hex: string | null;
  is_active: boolean;
}

interface Track {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  target_audience: string | null;
  display_order: number;
  icon_url: string | null;
  is_active: boolean;
}

interface BrandTag {
  id: string;
  name: string;
  logo_url: string | null;
}

export default function TiersTracksAdmin() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useUser();
  const { toast } = useToast();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [trackDialogOpen, setTrackDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);

  const [tierForm, setTierForm] = useState({
    name: '',
    slug: '',
    display_order: 0,
    icon_url: null as string | null,
    description: '',
    tagline: '',
    color_hex: '',
    is_active: true,
  });

  const [trackForm, setTrackForm] = useState({
    name: '',
    slug: '',
    description: '',
    target_audience: '',
    display_order: 0,
    icon_url: null as string | null,
    is_active: true,
  });

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
      const [tiersRes, tracksRes] = await Promise.all([
        supabase.from('membership_tiers').select('*').order('display_order'),
        supabase.from('membership_tracks').select('*').order('display_order'),
      ]);

      if (tiersRes.data) setTiers(tiersRes.data);
      if (tracksRes.data) {
        setTracks(tracksRes.data);
        await loadBrandAssociations(tracksRes.data.map(t => t.id));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBrandAssociations = async (trackIds: string[]) => {
    try {
      const { data } = await supabase
        .from('track_brand_tags')
        .select('track_id, brand_tag_id, brand_tags(id, name, logo_url)')
        .in('track_id', trackIds);

      if (data) {
        const brandMap: Record<string, BrandTag[]> = {};
        data.forEach(item => {
          if (!brandMap[item.track_id]) {
            brandMap[item.track_id] = [];
          }
          if (item.brand_tags) {
            brandMap[item.track_id].push(item.brand_tags as unknown as BrandTag);
          }
        });
        setBrandTags(brandMap);
      }
    } catch (error) {
      console.error('Error loading brand associations:', error);
    }
  };

  const handleTierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTier) {
        // Update existing tier (don't update slug)
        const { slug, ...updateData } = tierForm;
        const { error } = await supabase
          .from('membership_tiers')
          .update(updateData)
          .eq('id', editingTier.id);

        if (error) throw error;
        toast({ title: 'Tier updated successfully' });
      } else {
        // Create new tier
        const { error } = await supabase
          .from('membership_tiers')
          .insert({
            ...tierForm,
            slug: tierForm.slug || tierForm.name.toLowerCase().replace(/\s+/g, '-'),
          });

        if (error) throw error;
        toast({ title: 'Tier created successfully' });
      }

      setTierDialogOpen(false);
      resetTierForm();
      loadData();
    } catch (error) {
      console.error('Error saving tier:', error);
      toast({ title: 'Error saving tier', variant: 'destructive' });
    }
  };

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let trackId = editingTrack?.id;

      if (editingTrack) {
        // Update existing track (don't update slug)
        const { slug, ...updateData } = trackForm;
        const { error } = await supabase
          .from('membership_tracks')
          .update(updateData)
          .eq('id', editingTrack.id);

        if (error) throw error;

        // Clear existing brand associations
        await supabase
          .from('track_brand_tags')
          .delete()
          .eq('track_id', editingTrack.id);

        toast({ title: 'Track updated successfully' });
      } else {
        // Create new track
        const { data, error } = await supabase
          .from('membership_tracks')
          .insert({
            ...trackForm,
            slug: trackForm.slug || trackForm.name.toLowerCase().replace(/\s+/g, '-'),
          })
          .select('id')
          .single();

        if (error) throw error;
        trackId = data.id;
        toast({ title: 'Track created successfully' });
      }

      // Add brand associations
      if (trackId && selectedBrandIds.length > 0) {
        const associations = selectedBrandIds.map(brandId => ({
          track_id: trackId,
          brand_tag_id: brandId,
        }));

        const { error: brandError } = await supabase
          .from('track_brand_tags')
          .insert(associations);

        if (brandError) throw brandError;
      }

      setTrackDialogOpen(false);
      resetTrackForm();
      loadData();
    } catch (error) {
      console.error('Error saving track:', error);
      toast({ title: 'Error saving track', variant: 'destructive' });
    }
  };

  const resetTierForm = () => {
    setEditingTier(null);
    setTierForm({ name: '', slug: '', display_order: 0, icon_url: null, description: '', tagline: '', color_hex: '', is_active: true });
  };

  const resetTrackForm = () => {
    setEditingTrack(null);
    setTrackForm({ name: '', slug: '', description: '', target_audience: '', display_order: 0, icon_url: null, is_active: true });
    setSelectedBrandIds([]);
  };

  const openCreateTierDialog = () => {
    resetTierForm();
    setTierForm(prev => ({ ...prev, display_order: tiers.length + 1 }));
    setTierDialogOpen(true);
  };

  const openCreateTrackDialog = () => {
    resetTrackForm();
    setTrackForm(prev => ({ ...prev, display_order: tracks.length + 1 }));
    setTrackDialogOpen(true);
  };

  const handleEditTier = (tier: Tier) => {
    setEditingTier(tier);
    setTierForm({
      name: tier.name,
      slug: tier.slug,
      display_order: tier.display_order,
      icon_url: tier.icon_url,
      description: tier.description || '',
      tagline: tier.tagline || '',
      color_hex: tier.color_hex || '',
      is_active: tier.is_active,
    });
    setTierDialogOpen(true);
  };

  const handleEditTrack = async (track: Track) => {
    setEditingTrack(track);
    setTrackForm({
      name: track.name,
      slug: track.slug,
      description: track.description || '',
      target_audience: track.target_audience || '',
      display_order: track.display_order,
      icon_url: track.icon_url,
      is_active: track.is_active,
    });

    const { data } = await supabase
      .from('track_brand_tags')
      .select('brand_tag_id')
      .eq('track_id', track.id);

    if (data) {
      setSelectedBrandIds(data.map(item => item.brand_tag_id));
    }

    setTrackDialogOpen(true);
  };

  if (loading) {
    return (
      <AdminLayout breadcrumbs={[{ label: 'Tiers & Tracks' }]}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout breadcrumbs={[{ label: 'Tiers & Tracks' }]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Tiers & Tracks</h1>
          <p className="text-muted-foreground">
            Edit membership tiers and track configurations
          </p>
        </div>

        <Tabs defaultValue="tiers">
          <div className="flex items-center justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="tiers">Tiers</TabsTrigger>
              <TabsTrigger value="tracks">Tracks</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => navigate('/admin/packages')}>
                Packages
              </Button>
              <Button variant="secondary" onClick={() => navigate('/admin/benefits')}>
                Benefits
              </Button>
            </div>
          </div>

          <TabsContent value="tiers">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Membership Tiers ({tiers.length})</CardTitle>
                <Button onClick={openCreateTierDialog} size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Tier
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Color</TableHead>
                      <TableHead>Icon</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Tagline</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tiers.map((tier) => (
                      <TableRow key={tier.id} className={!tier.is_active ? 'opacity-50' : ''}>
                        <TableCell>
                          {tier.color_hex ? (
                            <div
                              className="h-6 w-6 rounded-full border border-border"
                              style={{ backgroundColor: tier.color_hex }}
                              title={tier.color_hex}
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-muted border border-border" />
                          )}
                        </TableCell>
                        <TableCell>
                          {tier.icon_url ? (
                            <img src={tier.icon_url} alt={tier.name} className="h-8 w-8 object-contain" />
                          ) : (
                            <div className="h-8 w-8 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                              —
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium capitalize">{tier.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{tier.tagline || '—'}</TableCell>
                        <TableCell>{tier.display_order}</TableCell>
                        <TableCell>
                          <Badge variant={tier.is_active ? 'default' : 'secondary'}>
                            {tier.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => handleEditTier(tier)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Tier Dialog */}
            <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingTier ? 'Edit Tier' : 'Create New Tier'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleTierSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tier-name">Name *</Label>
                      <Input
                        id="tier-name"
                        value={tierForm.name}
                        onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                        placeholder="e.g., Executive"
                        required
                      />
                    </div>
                    {!editingTier && (
                      <div>
                        <Label htmlFor="tier-slug">Slug</Label>
                        <Input
                          id="tier-slug"
                          value={tierForm.slug}
                          onChange={(e) => setTierForm({ ...tierForm, slug: e.target.value })}
                          placeholder="auto-generated if empty"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="tier-tagline">Tagline</Label>
                    <Input
                      id="tier-tagline"
                      value={tierForm.tagline}
                      onChange={(e) => setTierForm({ ...tierForm, tagline: e.target.value })}
                      placeholder="Short description shown to members"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tier-description">Description</Label>
                    <Textarea
                      id="tier-description"
                      value={tierForm.description}
                      onChange={(e) => setTierForm({ ...tierForm, description: e.target.value })}
                      placeholder="Full description of this tier's benefits"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tier-color">Brand Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="tier-color"
                          type="color"
                          value={tierForm.color_hex || '#F7931A'}
                          onChange={(e) => setTierForm({ ...tierForm, color_hex: e.target.value })}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={tierForm.color_hex}
                          onChange={(e) => setTierForm({ ...tierForm, color_hex: e.target.value })}
                          placeholder="#F7931A"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="tier-order">Display Order</Label>
                      <Input
                        id="tier-order"
                        type="number"
                        value={tierForm.display_order}
                        onChange={(e) => setTierForm({ ...tierForm, display_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Tier Icon</Label>
                    <ImageUpload
                      bucket="brand-logos"
                      value={tierForm.icon_url}
                      onChange={(url) => setTierForm({ ...tierForm, icon_url: url })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label htmlFor="tier-active" className="cursor-pointer">Active</Label>
                      <p className="text-xs text-muted-foreground">Inactive tiers are hidden from selection</p>
                    </div>
                    <Switch
                      id="tier-active"
                      checked={tierForm.is_active}
                      onCheckedChange={(checked) => setTierForm({ ...tierForm, is_active: checked })}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setTierDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">{editingTier ? 'Update' : 'Create'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="tracks">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Membership Tracks ({tracks.length})</CardTitle>
                <Button onClick={openCreateTrackDialog} size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Track
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Icon</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Target Audience</TableHead>
                      <TableHead>Associated Brands</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tracks.map((track) => (
                      <TableRow key={track.id} className={!track.is_active ? 'opacity-50' : ''}>
                        <TableCell>
                          {track.icon_url ? (
                            <img src={track.icon_url} alt={track.name} className="h-8 w-8 object-contain" />
                          ) : (
                            <div className="h-8 w-8 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                              —
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{track.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{track.target_audience || '—'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {brandTags[track.id]?.map((brand) => (
                              <BrandBadge
                                key={brand.id}
                                name={brand.name}
                                logoUrl={brand.logo_url}
                                size="sm"
                                showLogo={false}
                              />
                            ))}
                            {(!brandTags[track.id] || brandTags[track.id].length === 0) && (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{track.display_order}</TableCell>
                        <TableCell>
                          <Badge variant={track.is_active ? 'default' : 'secondary'}>
                            {track.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => handleEditTrack(track)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Track Dialog */}
            <Dialog open={trackDialogOpen} onOpenChange={setTrackDialogOpen}>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingTrack ? 'Edit Track' : 'Create New Track'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleTrackSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="track-name">Name *</Label>
                      <Input
                        id="track-name"
                        value={trackForm.name}
                        onChange={(e) => setTrackForm({ ...trackForm, name: e.target.value })}
                        placeholder="e.g., Media & Events"
                        required
                      />
                    </div>
                    {!editingTrack && (
                      <div>
                        <Label htmlFor="track-slug">Slug</Label>
                        <Input
                          id="track-slug"
                          value={trackForm.slug}
                          onChange={(e) => setTrackForm({ ...trackForm, slug: e.target.value })}
                          placeholder="auto-generated if empty"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="track-target">Target Audience</Label>
                    <Input
                      id="track-target"
                      value={trackForm.target_audience}
                      onChange={(e) => setTrackForm({ ...trackForm, target_audience: e.target.value })}
                      placeholder="e.g., Media companies, Event organizers"
                    />
                  </div>
                  <div>
                    <Label htmlFor="track-description">Description</Label>
                    <Textarea
                      id="track-description"
                      value={trackForm.description}
                      onChange={(e) => setTrackForm({ ...trackForm, description: e.target.value })}
                      placeholder="What this track offers to members"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="track-order">Display Order</Label>
                    <Input
                      id="track-order"
                      type="number"
                      value={trackForm.display_order}
                      onChange={(e) => setTrackForm({ ...trackForm, display_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Track Icon</Label>
                    <ImageUpload
                      bucket="brand-logos"
                      value={trackForm.icon_url}
                      onChange={(url) => setTrackForm({ ...trackForm, icon_url: url })}
                    />
                  </div>
                  <div>
                    <Label>Associated Brands (Optional)</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Tag which BTC Inc brands are relevant for this membership track
                    </p>
                    <BrandSelector
                      selectedBrandIds={selectedBrandIds}
                      onChange={setSelectedBrandIds}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label htmlFor="track-active" className="cursor-pointer">Active</Label>
                      <p className="text-xs text-muted-foreground">Inactive tracks are hidden from selection</p>
                    </div>
                    <Switch
                      id="track-active"
                      checked={trackForm.is_active}
                      onCheckedChange={(checked) => setTrackForm({ ...trackForm, is_active: checked })}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setTrackDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">{editingTrack ? 'Update' : 'Create'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
