import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { BrandSelector } from '@/components/ui/brand-selector';
import { BrandBadge } from '@/components/ui/brand-badge';
import { ImageUpload } from '@/components/ui/image-upload';
import { useMember } from '@/contexts/member/MemberContext';

interface Tier {
  id: string;
  name: string;
  base_annual_price: number;
  display_order: number;
  icon_url: string | null;
  description: string | null;
}

interface Track {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  icon_url: string | null;
}

interface BrandTag {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
}

export default function TiersTracksAdmin() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useMember();
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
    base_annual_price: 0,
    display_order: 0,
    icon_url: null as string | null,
    description: '',
  });

  const [trackForm, setTrackForm] = useState({
    name: '',
    description: '',
    display_order: 0,
    icon_url: null as string | null,
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
        .select('track_id, brand_tag_id, brand_tags(id, name, logo_url, website_url)')
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
        const { error } = await supabase
          .from('membership_tiers')
          .update(tierForm)
          .eq('id', editingTier.id);

        if (error) throw error;
        toast({ title: 'Tier updated successfully' });
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
      if (editingTrack) {
        const { error } = await supabase
          .from('membership_tracks')
          .update(trackForm)
          .eq('id', editingTrack.id);

        if (error) throw error;

        await supabase
          .from('track_brand_tags')
          .delete()
          .eq('track_id', editingTrack.id);

        if (selectedBrandIds.length > 0) {
          const associations = selectedBrandIds.map(brandId => ({
            track_id: editingTrack.id,
            brand_tag_id: brandId,
          }));

          const { error: brandError } = await supabase
            .from('track_brand_tags')
            .insert(associations);

          if (brandError) throw brandError;
        }

        toast({ title: 'Track updated successfully' });
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
    setTierForm({ name: '', base_annual_price: 0, display_order: 0, icon_url: null, description: '' });
  };

  const resetTrackForm = () => {
    setEditingTrack(null);
    setTrackForm({ name: '', description: '', display_order: 0, icon_url: null });
    setSelectedBrandIds([]);
  };

  const handleEditTier = (tier: Tier) => {
    setEditingTier(tier);
    setTierForm({
      name: tier.name,
      base_annual_price: tier.base_annual_price,
      display_order: tier.display_order,
      icon_url: tier.icon_url,
      description: tier.description || '',
    });
    setTierDialogOpen(true);
  };

  const handleEditTrack = async (track: Track) => {
    setEditingTrack(track);
    setTrackForm({
      name: track.name,
      description: track.description || '',
      display_order: track.display_order,
      icon_url: track.icon_url,
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
              <CardHeader>
                <CardTitle>Membership Tiers ({tiers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Icon</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Base Annual Price</TableHead>
                      <TableHead>Display Order</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tiers.map((tier) => (
                      <TableRow key={tier.id}>
                        <TableCell>
                          {tier.icon_url ? (
                            <img src={tier.icon_url} alt={tier.name} className="h-8 w-8 object-contain" />
                          ) : (
                            <div className="h-8 w-8 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                              N/A
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium capitalize">{tier.name}</TableCell>
                        <TableCell>${tier.base_annual_price.toLocaleString()}</TableCell>
                        <TableCell>{tier.display_order}</TableCell>
                        <TableCell>
                          <Dialog open={tierDialogOpen && editingTier?.id === tier.id} onOpenChange={setTierDialogOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost" onClick={() => handleEditTier(tier)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Tier</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleTierSubmit} className="space-y-4">
                                <div>
                                  <Label htmlFor="tier-name">Name</Label>
                                  <Input
                                    id="tier-name"
                                    value={tierForm.name}
                                    onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="tier-description">Description</Label>
                                  <Textarea
                                    id="tier-description"
                                    value={tierForm.description}
                                    onChange={(e) => setTierForm({ ...tierForm, description: e.target.value })}
                                    rows={2}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="tier-price">Base Annual Price</Label>
                                  <Input
                                    id="tier-price"
                                    type="number"
                                    value={tierForm.base_annual_price}
                                    onChange={(e) => setTierForm({ ...tierForm, base_annual_price: parseFloat(e.target.value) })}
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="tier-order">Display Order</Label>
                                  <Input
                                    id="tier-order"
                                    type="number"
                                    value={tierForm.display_order}
                                    onChange={(e) => setTierForm({ ...tierForm, display_order: parseInt(e.target.value) })}
                                  />
                                </div>
                                <div>
                                  <Label>Tier Icon</Label>
                                  <ImageUpload
                                    bucket="brand-logos"
                                    value={tierForm.icon_url}
                                    onChange={(url) => setTierForm({ ...tierForm, icon_url: url })}
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button type="button" variant="outline" onClick={() => setTierDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button type="submit">Update</Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracks">
            <Card>
              <CardHeader>
                <CardTitle>Membership Tracks ({tracks.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Icon</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Associated Brands</TableHead>
                      <TableHead>Display Order</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tracks.map((track) => (
                      <TableRow key={track.id}>
                        <TableCell>
                          {track.icon_url ? (
                            <img src={track.icon_url} alt={track.name} className="h-8 w-8 object-contain" />
                          ) : (
                            <div className="h-8 w-8 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                              N/A
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{track.name}</TableCell>
                        <TableCell className="max-w-md truncate">{track.description || '—'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {brandTags[track.id]?.map((brand) => (
                              <BrandBadge
                                key={brand.id}
                                name={brand.name}
                                logoUrl={brand.logo_url}
                                websiteUrl={brand.website_url}
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
                          <Dialog open={trackDialogOpen && editingTrack?.id === track.id} onOpenChange={setTrackDialogOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost" onClick={() => handleEditTrack(track)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Edit Track</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleTrackSubmit} className="space-y-4">
                                <div>
                                  <Label htmlFor="track-name">Name</Label>
                                  <Input
                                    id="track-name"
                                    value={trackForm.name}
                                    onChange={(e) => setTrackForm({ ...trackForm, name: e.target.value })}
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="track-description">Description</Label>
                                  <Textarea
                                    id="track-description"
                                    value={trackForm.description}
                                    onChange={(e) => setTrackForm({ ...trackForm, description: e.target.value })}
                                    rows={3}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="track-order">Display Order</Label>
                                  <Input
                                    id="track-order"
                                    type="number"
                                    value={trackForm.display_order}
                                    onChange={(e) => setTrackForm({ ...trackForm, display_order: parseInt(e.target.value) })}
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
                                <div className="flex justify-end gap-2">
                                  <Button type="button" variant="outline" onClick={() => setTrackDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button type="submit">Update</Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
