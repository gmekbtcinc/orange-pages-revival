import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Pencil, Plus } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUser } from "@/contexts/UserContext";

interface TierTrackPackage {
  id: string;
  tier_id: string;
  track_id: string;
  name: string;
  description: string | null;
  base_price: number;
  annual_price: number | null;
  is_featured: boolean;
  is_active: boolean;
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
  const { isSuperAdmin } = useUser();
  const { toast } = useToast();
  const [packages, setPackages] = useState<TierTrackPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPackage, setNewPackage] = useState({
    tier_id: '',
    track_id: '',
    name: '',
    base_price: '',
    description: '',
  });

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/admin');
      return;
    }
    loadPackages();
  }, [isSuperAdmin, navigate]);

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('tier_track_packages')
        .select('*, membership_tiers(name), membership_tracks(name)')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      if (data) setPackages(data as unknown as TierTrackPackage[]);

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
    if (!newPackage.tier_id || !newPackage.track_id || !newPackage.name) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase.from('tier_track_packages').insert([{
        tier_id: newPackage.tier_id,
        track_id: newPackage.track_id,
        name: newPackage.name,
        base_price: newPackage.base_price ? Number(newPackage.base_price) : 0,
        description: newPackage.description || null,
      }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Package created successfully',
      });

      setShowCreateDialog(false);
      setNewPackage({
        tier_id: '',
        track_id: '',
        name: '',
        base_price: '',
        description: '',
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
                    <Label>Package Name</Label>
                    <Input
                      value={newPackage.name}
                      onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                      placeholder="Package name"
                    />
                  </div>
                  <div>
                    <Label>Base Price ($)</Label>
                    <Input
                      type="number"
                      value={newPackage.base_price}
                      onChange={(e) => setNewPackage({ ...newPackage, base_price: e.target.value })}
                      placeholder="0"
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Annual Price</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No packages found
                    </TableCell>
                  </TableRow>
                ) : (
                  packages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.name}</TableCell>
                      <TableCell className="capitalize">{pkg.membership_tiers.name}</TableCell>
                      <TableCell>{pkg.membership_tracks.name}</TableCell>
                      <TableCell>${(pkg.base_price || 0).toLocaleString()}</TableCell>
                      <TableCell>${(pkg.annual_price || 0).toLocaleString()}</TableCell>
                      <TableCell>{pkg.is_featured ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/admin/packages/${pkg.id}`)}
                          >
                            <Pencil className="h-4 w-4" />
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