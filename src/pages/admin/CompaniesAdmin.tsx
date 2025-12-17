import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Crown,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Bitcoin,
  Shield,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  FileDown,
  Mail,
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface CompanyWithMembership {
  id: string;
  name: string;
  logo_url: string | null;
  city: string | null;
  country: string | null;
  is_verified: boolean | null;
  is_bfc_member: boolean | null;
  is_bitcoin_only: boolean | null;
  created_at: string;
  memberships: { tier: string; is_active: boolean; member_since: string | null } | null;
  company_users: { id: string }[];
}

type SortField = "name" | "joined" | "tier";
type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE = 20;

const tierColors: Record<string, string> = {
  industry: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  premier: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  executive: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  sponsor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  chairman: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  // Legacy
  silver: "bg-gray-500/10 text-gray-400 border-gray-500/30",
  gold: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  platinum: "bg-orange-500/10 text-orange-400 border-orange-500/30",
};

const tierLabels: Record<string, string> = {
  industry: "Industry",
  premier: "Premier",
  executive: "Executive",
  sponsor: "Sponsor",
  chairman: "Chairman's Circle",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

const tierOrder: Record<string, number> = {
  chairman: 1,
  sponsor: 2,
  executive: 3,
  premier: 4,
  industry: 5,
  platinum: 6,
  gold: 7,
  silver: 8,
};

export default function CompaniesAdmin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "members" | "non-members">("all");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    description: "",
    website: "",
    city: "",
    country: "",
  });

  const addCompanyMutation = useMutation({
    mutationFn: async (company: typeof newCompany) => {
      const { data, error } = await supabase
        .from("businesses")
        .insert({
          name: company.name,
          description: company.description || "No description provided",
          website: company.website || null,
          city: company.city || null,
          country: company.country || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Company added successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      setAddDialogOpen(false);
      setNewCompany({ name: "", description: "", website: "", city: "", country: "" });
      navigate(`/admin/companies/${data.id}`);
    },
    onError: (error: any) => {
      toast.error("Failed to add company", { description: error.message });
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-companies", searchQuery, filter, page, sortField, sortDirection],
    queryFn: async () => {
      let query = supabase
        .from("businesses")
        .select(`
          id,
          name,
          logo_url,
          city,
          country,
          is_verified,
          is_bfc_member,
          is_bitcoin_only,
          created_at,
          memberships (tier, is_active, member_since),
          company_users (id)
        `, { count: "exact" });

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      const { data: allCompanies, error, count } = await query;
      if (error) throw error;

      // Filter by membership status
      let filtered = allCompanies as CompanyWithMembership[];
      if (filter === "members") {
        filtered = filtered.filter((c) => c.memberships?.is_active);
      } else if (filter === "non-members") {
        filtered = filtered.filter((c) => !c.memberships?.is_active);
      }

      // Sort
      filtered.sort((a, b) => {
        let comparison = 0;
        
        switch (sortField) {
          case "name":
            comparison = a.name.localeCompare(b.name);
            break;
          case "joined":
            const dateA = a.memberships?.member_since || "9999-12-31";
            const dateB = b.memberships?.member_since || "9999-12-31";
            comparison = dateA.localeCompare(dateB);
            break;
          case "tier":
            const tierA = tierOrder[a.memberships?.tier || ""] || 99;
            const tierB = tierOrder[b.memberships?.tier || ""] || 99;
            comparison = tierA - tierB;
            break;
        }
        
        return sortDirection === "asc" ? comparison : -comparison;
      });

      // Paginate
      const start = (page - 1) * ITEMS_PER_PAGE;
      const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

      return {
        companies: paginated,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / ITEMS_PER_PAGE),
        allIds: filtered.map(c => c.id),
      };
    },
  });

  const companies = data?.companies || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;
  const allFilteredIds = data?.allIds || [];

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === companies.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(companies.map(c => c.id)));
    }
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(allFilteredIds));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkExport = () => {
    const selectedCompanies = companies.filter(c => selectedIds.has(c.id));
    const csvContent = [
      ["Name", "Tier", "Location", "Joined", "Team Size"].join(","),
      ...selectedCompanies.map(c => [
        `"${c.name}"`,
        c.memberships?.tier || "non-member",
        `"${[c.city, c.country].filter(Boolean).join(", ")}"`,
        c.memberships?.member_since || "",
        c.company_users?.length || 0,
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `companies-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${selectedIds.size} companies`);
  };

  const handleBulkEmail = () => {
    toast.info("Email feature coming soon", {
      description: `${selectedIds.size} companies selected for outreach`,
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="h-4 w-4 ml-1" /> 
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  return (
    <AdminLayout breadcrumbs={[{ label: "Companies" }]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Companies
          </h1>
          <p className="text-muted-foreground">
            Manage all business listings ({total} total)
          </p>
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            
            <Select
              value={`${sortField}-${sortDirection}`}
              onValueChange={(value) => {
                const [field, dir] = value.split("-") as [SortField, SortDirection];
                setSortField(field);
                setSortDirection(dir);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px] text-foreground">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="joined-asc">Oldest Members</SelectItem>
                <SelectItem value="joined-desc">Newest Members</SelectItem>
                <SelectItem value="tier-asc">Tier (Highest First)</SelectItem>
                <SelectItem value="tier-desc">Tier (Lowest First)</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Company
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Company</DialogTitle>
                  <DialogDescription>
                    Add a new company to the directory. You can edit additional details after creation.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      value={newCompany.name}
                      onChange={(e) => setNewCompany(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newCompany.description}
                      onChange={(e) => setNewCompany(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the company"
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={newCompany.website}
                      onChange={(e) => setNewCompany(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={newCompany.city}
                        onChange={(e) => setNewCompany(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="City"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={newCompany.country}
                        onChange={(e) => setNewCompany(prev => ({ ...prev, country: e.target.value }))}
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => addCompanyMutation.mutate(newCompany)}
                    disabled={!newCompany.name.trim() || addCompanyMutation.isPending}
                  >
                    {addCompanyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Company
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs value={filter} onValueChange={(v) => { setFilter(v as any); setPage(1); setSelectedIds(new Set()); }}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="non-members">Non-Members</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {selectedIds.size} {selectedIds.size === 1 ? "company" : "companies"} selected
                  </span>
                  {selectedIds.size < allFilteredIds.length && (
                    <Button variant="link" size="sm" className="h-auto p-0" onClick={selectAllFiltered}>
                      Select all {allFilteredIds.length}
                    </Button>
                  )}
                  <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground" onClick={clearSelection}>
                    Clear selection
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleBulkExport}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleBulkEmail}>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : companies.length === 0 ? (
              <div className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No companies found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try a different search term" : "No businesses in the directory yet"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.size === companies.length && companies.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center hover:text-foreground transition-colors"
                        onClick={() => toggleSort("name")}
                      >
                        Company
                        <SortIcon field="name" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center hover:text-foreground transition-colors"
                        onClick={() => toggleSort("joined")}
                      >
                        Joined
                        <SortIcon field="joined" />
                      </button>
                    </TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>
                      <button
                        className="flex items-center hover:text-foreground transition-colors"
                        onClick={() => toggleSort("tier")}
                      >
                        Membership
                        <SortIcon field="tier" />
                      </button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow
                      key={company.id}
                      className={`cursor-pointer hover:bg-muted/50 ${selectedIds.has(company.id) ? "bg-primary/5" : ""}`}
                      onClick={() => navigate(`/admin/companies/${company.id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(company.id)}
                          onCheckedChange={() => toggleSelect(company.id)}
                          aria-label={`Select ${company.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {company.logo_url ? (
                            <img
                              src={company.logo_url}
                              alt={company.name}
                              className="h-10 w-10 rounded-lg object-contain bg-white"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium">{company.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {company.memberships?.member_since
                            ? format(new Date(company.memberships.member_since), "MMM yyyy")
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {[company.city, company.country].filter(Boolean).join(", ") || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {company.memberships?.is_active ? (
                          <Badge
                            variant="outline"
                            className={tierColors[company.memberships.tier] || ""}
                          >
                            <Crown className="h-3 w-3 mr-1" />
                            {tierLabels[company.memberships.tier] || company.memberships.tier}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Non-Member</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {company.is_verified && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                              <CheckCircle className="h-3 w-3" />
                            </Badge>
                          )}
                          {company.is_bitcoin_only && (
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">
                              <Bitcoin className="h-3 w-3" />
                            </Badge>
                          )}
                          {company.is_bfc_member && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                              <Shield className="h-3 w-3" />
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{company.company_users?.length || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/companies/${company.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/companies/${company.id}#edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/memberships?business_id=${company.id}`)}>
                              <Crown className="h-4 w-4 mr-2" />
                              Manage Membership
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/companies/${company.id}#team`)}>
                              <Users className="h-4 w-4 mr-2" />
                              View Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
