import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dropdown-menu";
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
} from "lucide-react";

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

export default function CompaniesAdmin() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "members" | "non-members">("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-companies", searchQuery, filter, page],
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
        `, { count: "exact" })
        .order("created_at", { ascending: false });

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

      // Paginate
      const start = (page - 1) * ITEMS_PER_PAGE;
      const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

      return {
        companies: paginated,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / ITEMS_PER_PAGE),
      };
    },
  });

  const companies = data?.companies || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

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

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative w-full md:w-80">
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

          <Tabs value={filter} onValueChange={(v) => { setFilter(v as any); setPage(1); }}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="non-members">Non-Members</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

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
                    <TableHead>Company</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Membership</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow
                      key={company.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/admin/companies/${company.id}`)}
                    >
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
