import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Pencil, Plus, Copy, Archive, CheckCircle2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PackageStatusBadge } from '@/components/ui/package-status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMember } from '@/contexts/member/MemberContext';

interface TierTrackPackage {
  id: string;
  tier_id: string;
  track_id: string;
  display_name: string;
  description: string | null;
  annual_price_override: number | null;
  term_default_years: number;
  benefits: unknown;
  status: 'active' | 'draft' | 'archived';
  usage_count: number;
  cloned_from_id: string | null;
  membership_tiers: { name: string };
  membership_tracks: { name: string };
}

interface Tier {
  id: string;
  name: string;
}

interface Track {
  id: string;
  name: string;
}

export default function PackagesAdmin() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useMember();
  const { toast } = useToast();
  const [packages, setPackages] = useState<TierTrackPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'draft' | 'archived'>('active');
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPackage, setNewPackage] = useState({
    tier_id: '',
    track_id: '',
    display_name: '',
    annual_price_override: '',
    term_default_years: '1',
  });

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/admin');
      return;
    }
    loadPackages();
  }, [isSuperAdmin, navigate]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadPackages();
    }
  }, [activeTab, isSuperAdmin]);

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('tier_track_packages')
        .select('*, membership_tiers(name), membership_tracks(name)')
        .eq('status', activeTab)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      if (data) setPackages(data as TierTrackPackage[]);

      const [tiersRes, tracksRes] = await Promise.all([
        supabase.from('membership_tiers').select('id, name').order('display_order'),
        supabase.from('membership_tracks').select('id, name').order('display_order'),
      ]);

      if (tiersRes.data) setTiers(tiersRes.data);
      if (tracksRes.data) setTracks(tracksRes.data);
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePackage = async () => {
    if (!newPackage.tier_id || !newPackage.track_id || !newPackage.display_name) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase.from('tier_track_packages').insert({
        tier_id: newPackage.tier_id,
        track_id: newPackage.track_id,
        display_name: newPackage.display_name,
        annual_price_override: newPackage.annual_price_override ? Number(newPackage.annual_price_override) : null,
        term_default_years: Number(newPackage.term_default_years),
        benefits: [],
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Package created successfully',
      });

      setShowCreateDialog(false);
      setNewPackage({
        tier_id: '',
        track_id: '',
        display_name: '',
        annual_price_override: '',
        term_default_years: '1',
      });
      loadPackages();
    } catch (error) {
      console.error('Error creating package:', error);
      toast({
        title: 'Error',
        description: 'Failed to create package',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleClonePackage = async (pkg: TierTrackPackage) => {
    try {
      const { error } = await supabase.from('tier_track_packages').insert({
        tier_id: pkg.tier_id,
        track_id: pkg.track_id,
        display_name: `${pkg.display_name} (Copy)`,
        description: pkg.description,
        annual_price_override: pkg.annual_price_override,
        term_default_years: pkg.term_default_years,
        benefits: pkg.benefits,
        status: 'draft',
        cloned_from_id: pkg.id,
      });

      if (error) throw error;

      toast({
        title: 'Package cloned',
        description: 'Package cloned as draft successfully',
      });

      loadPackages();
    } catch (error) {
      console.error('Error cloning package:', error);
      toast({
        title: 'Error',
        description: 'Failed to clone package',
        variant: 'destructive',
      });
    }
  };

  const handleChangeStatus = async (packageId: string, newStatus: 'active' | 'draft' | 'archived') => {
    try {
      const { error } = await supabase
        .from('tier_track_packages')
        .update({ status: newStatus })
        .eq('id', packageId);

      if (error) throw error;

      toast({
        title: 'Status updated',
        description: `Package marked as ${newStatus}`,
      });

      loadPackages();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const getBenefitCount = (benefits: unknown): number => {
    if (!benefits) return 0;
    if (Array.isArray(benefits)) return benefits.length;
    return 0;
  };

  if (loading) {
    return (
      <AdminLayout breadcrumbs={[{ label: 'Packages' }]}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout breadcrumbs={[{ label: 'Packages' }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manage Packages</h1>
            <p className="text-muted-foreground">
              Configure tier-track packages and benefit combinations
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/admin/tiers')}>
              Tiers & Tracks
            </Button>
            <Button variant="secondary" onClick={() => navigate('/admin/benefits')}>
              Benefits
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Tier × Track Packages ({packages.length})</CardTitle>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Package
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Package</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Tier</Label>
                    <Select value={newPackage.tier_id} onValueChange={(value) => setNewPackage({ ...newPackage, tier_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiers.map((tier) => (
                          <SelectItem key={tier.id} value={tier.id} className="capitalize">{tier.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Track</Label>
                    <Select value={newPackage.track_id} onValueChange={(value) => setNewPackage({ ...newPackage, track_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select track" />
                      </SelectTrigger>
                      <SelectContent>
                        {tracks.map((track) => (
                          <SelectItem key={track.id} value={track.id}>{track.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Display Name</Label>
                    <Input
                      value={newPackage.display_name}
                      onChange={(e) => setNewPackage({ ...newPackage, display_name: e.target.value })}
                      placeholder="Package name"
                    />
                  </div>
                  <div>
                    <Label>Annual Price Override</Label>
                    <Input
                      type="number"
                      value={newPackage.annual_price_override}
                      onChange={(e) => setNewPackage({ ...newPackage, annual_price_override: e.target.value })}
                      placeholder="Leave empty for default"
                    />
                  </div>
                  <div>
                    <Label>Default Term (Years)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newPackage.term_default_years}
                      onChange={(e) => setNewPackage({ ...newPackage, term_default_years: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleCreatePackage} disabled={creating}>
                      {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'draft' | 'archived')} className="space-y-4">
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Track</TableHead>
                      <TableHead>Annual Price</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead># Benefits</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          No packages found with status "{activeTab}"
                        </TableCell>
                      </TableRow>
                    ) : (
                      packages.map((pkg) => (
                        <TableRow key={pkg.id}>
                          <TableCell>
                            <PackageStatusBadge status={pkg.status} />
                          </TableCell>
                          <TableCell className="font-medium">{pkg.display_name}</TableCell>
                          <TableCell className="capitalize">{pkg.membership_tiers.name}</TableCell>
                          <TableCell>{pkg.membership_tracks.name}</TableCell>
                          <TableCell>
                            ${(pkg.annual_price_override || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>{pkg.term_default_years}y</TableCell>
                          <TableCell>{getBenefitCount(pkg.benefits)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{pkg.usage_count}</span>
                              <span className="text-xs text-muted-foreground">used</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`/admin/packages/${pkg.id}`)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost">
                                    ⋮
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleClonePackage(pkg)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Clone Package
                                  </DropdownMenuItem>
                                  {pkg.status !== 'active' && (
                                    <DropdownMenuItem onClick={() => handleChangeStatus(pkg.id, 'active')}>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Mark as Active
                                    </DropdownMenuItem>
                                  )}
                                  {pkg.status !== 'draft' && (
                                    <DropdownMenuItem onClick={() => handleChangeStatus(pkg.id, 'draft')}>
                                      Move to Draft
                                    </DropdownMenuItem>
                                  )}
                                  {pkg.status !== 'archived' && (
                                    <DropdownMenuItem onClick={() => handleChangeStatus(pkg.id, 'archived')}>
                                      <Archive className="h-4 w-4 mr-2" />
                                      Archive
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
