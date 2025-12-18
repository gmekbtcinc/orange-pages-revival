import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// CSV template headers
const CSV_HEADERS = [
  "name",
  "description",
  "long_description",
  "website",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "country",
  "founded",
  "employees",
  "markets",
  "company_type",
  "ceo_name",
  "ceo_title",
  "is_bitcoin_only",
  "accepts_crypto",
  "is_bfc_member",
  "is_verified",
  "is_conference_sponsor",
  "btc_holdings_source",
  "referral_url",
  "logo_url",
  "category",
];

const EXAMPLE_ROWS = [
  {
    name: "Example Company",
    description: "A Bitcoin-focused financial services company",
    long_description: "Detailed description of the company and its services...",
    website: "https://example.com",
    email: "info@example.com",
    phone: "+1-555-123-4567",
    address: "123 Main St",
    city: "Austin",
    state: "TX",
    country: "USA",
    founded: "2020",
    employees: "50-100",
    markets: "North America, Europe",
    company_type: "private",
    ceo_name: "John Doe",
    ceo_title: "CEO & Founder",
    is_bitcoin_only: "TRUE",
    accepts_crypto: "TRUE",
    is_bfc_member: "TRUE",
    is_verified: "FALSE",
    is_conference_sponsor: "FALSE",
    btc_holdings_source: "NYSE: EXM",
    referral_url: "https://example.com/ref",
    logo_url: "",
    category: "Financial Services",
  },
];

interface ImportResult {
  row: number;
  name: string;
  success: boolean;
  error?: string;
}

interface ParsedRow {
  rowNumber: number;
  data: Record<string, string>;
  errors: string[];
}

export function ImportCompaniesDialog() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "results">("upload");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Fetch categories for validation
  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("id, name");
    setCategories(data || []);
    return data || [];
  };

  const generateTemplate = () => {
    const headerRow = CSV_HEADERS.join(",");
    const notesRow = [
      "# REQUIRED",
      "# REQUIRED",
      "# Optional detailed description",
      "# URL",
      "# Email",
      "# Phone",
      "# Street address",
      "# City",
      "# State/Province",
      "# Country",
      "# Year (e.g. 2020)",
      "# e.g. 1-10, 50-100, 500+",
      "# Comma-separated markets",
      "# public|private|subsidiary",
      "# CEO name",
      "# CEO title",
      "# TRUE/FALSE",
      "# TRUE/FALSE",
      "# TRUE/FALSE",
      "# TRUE/FALSE",
      "# TRUE/FALSE",
      "# e.g. NYSE: MSTR",
      "# Referral URL",
      "# Logo URL",
      "# Category name (must match existing)",
    ].join(",");
    const exampleRow = CSV_HEADERS.map(h => {
      const val = EXAMPLE_ROWS[0][h as keyof typeof EXAMPLE_ROWS[0]] || "";
      return val.includes(",") ? `"${val}"` : val;
    }).join(",");

    const csvContent = [headerRow, notesRow, exampleRow].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "companies-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const parseCSV = (content: string): ParsedRow[] => {
    const lines = content.split(/\r?\n/).filter(line => line.trim() && !line.startsWith("#"));
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const data: Record<string, string> = {};
      const errors: string[] = [];

      headers.forEach((header, idx) => {
        data[header.toLowerCase().trim()] = values[idx]?.trim() || "";
      });

      // Validate required fields
      if (!data.name) errors.push("Missing required field: name");
      if (!data.description) errors.push("Missing required field: description");

      // Validate company_type enum
      if (data.company_type && !["public", "private", "subsidiary"].includes(data.company_type.toLowerCase())) {
        errors.push(`Invalid company_type: ${data.company_type} (must be public, private, or subsidiary)`);
      }

      rows.push({ rowNumber: i + 1, data, errors });
    }

    return rows;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await fetchCategories();

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const rows = parseCSV(content);
      setParsedRows(rows);
      setStep("preview");
    };
    reader.readAsText(file);
  };

  const importMutation = useMutation({
    mutationFn: async (rows: ParsedRow[]) => {
      const results: ImportResult[] = [];
      const validRows = rows.filter(r => r.errors.length === 0);
      
      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        setImportProgress(Math.round(((i + 1) / validRows.length) * 100));

        try {
          // Find category ID if provided
          let categoryId: string | null = null;
          if (row.data.category) {
            const cat = categories.find(
              c => c.name.toLowerCase() === row.data.category.toLowerCase()
            );
            categoryId = cat?.id || null;
          }

          const parseBoolean = (val: string) => {
            const lower = val.toLowerCase();
            return lower === "true" || lower === "yes" || lower === "1";
          };

          const { error } = await supabase.from("businesses").insert({
            name: row.data.name,
            description: row.data.description,
            long_description: row.data.long_description || null,
            website: row.data.website || null,
            email: row.data.email || null,
            phone: row.data.phone || null,
            address: row.data.address || null,
            city: row.data.city || null,
            state: row.data.state || null,
            country: row.data.country || null,
            founded: row.data.founded || null,
            employees: row.data.employees || null,
            markets: row.data.markets || null,
            company_type: row.data.company_type?.toLowerCase() as any || "private",
            ceo_name: row.data.ceo_name || null,
            ceo_title: row.data.ceo_title || null,
            is_bitcoin_only: row.data.is_bitcoin_only ? parseBoolean(row.data.is_bitcoin_only) : false,
            accepts_crypto: row.data.accepts_crypto ? parseBoolean(row.data.accepts_crypto) : false,
            is_bfc_member: row.data.is_bfc_member ? parseBoolean(row.data.is_bfc_member) : false,
            is_verified: row.data.is_verified ? parseBoolean(row.data.is_verified) : false,
            is_conference_sponsor: row.data.is_conference_sponsor ? parseBoolean(row.data.is_conference_sponsor) : false,
            btc_holdings_source: row.data.btc_holdings_source || null,
            referral_url: row.data.referral_url || null,
            logo_url: row.data.logo_url || null,
            category_id: categoryId,
            status: "approved",
            is_active: true,
          });

          if (error) throw error;
          results.push({ row: row.rowNumber, name: row.data.name, success: true });
        } catch (err: any) {
          results.push({ row: row.rowNumber, name: row.data.name, success: false, error: err.message });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setImportResults(results);
      setStep("results");
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      if (failCount === 0) {
        toast.success(`Successfully imported ${successCount} companies`);
      } else {
        toast.warning(`Imported ${successCount} companies, ${failCount} failed`);
      }
    },
    onError: (error: any) => {
      toast.error("Import failed", { description: error.message });
    },
  });

  const handleImport = () => {
    setStep("importing");
    setImportProgress(0);
    importMutation.mutate(parsedRows);
  };

  const resetDialog = () => {
    setStep("upload");
    setParsedRows([]);
    setImportProgress(0);
    setImportResults([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validCount = parsedRows.filter(r => r.errors.length === 0).length;
  const invalidCount = parsedRows.filter(r => r.errors.length > 0).length;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDialog(); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Companies from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import companies into the directory.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Download the template CSV to get started</span>
              </div>
              <Button variant="outline" size="sm" onClick={generateTemplate}>
                Download Template
              </Button>
            </div>

            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground mt-1">CSV files only</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Required fields:</strong> name, description</p>
              <p><strong>Company type values:</strong> public, private, subsidiary</p>
              <p><strong>Boolean fields:</strong> Use TRUE/FALSE, Yes/No, or 1/0</p>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{validCount} valid rows</span>
              </div>
              {invalidCount > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span>{invalidCount} rows with errors</span>
                </div>
              )}
            </div>

            <ScrollArea className="h-[300px] rounded-md border">
              <div className="p-4 space-y-2">
                {parsedRows.map((row) => (
                  <div
                    key={row.rowNumber}
                    className={`p-2 rounded text-sm ${
                      row.errors.length > 0 ? "bg-destructive/10" : "bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {row.errors.length > 0 ? (
                        <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                      <span className="font-medium">{row.data.name || "(no name)"}</span>
                      <span className="text-muted-foreground">Row {row.rowNumber}</span>
                    </div>
                    {row.errors.length > 0 && (
                      <div className="ml-6 mt-1 text-xs text-destructive">
                        {row.errors.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {invalidCount > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>Rows with errors will be skipped. Only valid rows will be imported.</span>
              </div>
            )}
          </div>
        )}

        {step === "importing" && (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-medium">Importing companies...</p>
            </div>
            <Progress value={importProgress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">{importProgress}% complete</p>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{importResults.filter(r => r.success).length} imported</span>
              </div>
              {importResults.some(r => !r.success) && (
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span>{importResults.filter(r => !r.success).length} failed</span>
                </div>
              )}
            </div>

            <ScrollArea className="h-[300px] rounded-md border">
              <div className="p-4 space-y-2">
                {importResults.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded text-sm ${
                      result.success ? "bg-muted/50" : "bg-destructive/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      )}
                      <span className="font-medium">{result.name}</span>
                      <span className="text-muted-foreground">Row {result.row}</span>
                    </div>
                    {result.error && (
                      <div className="ml-6 mt-1 text-xs text-destructive">{result.error}</div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={resetDialog}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Import {validCount} {validCount === 1 ? "Company" : "Companies"}
              </Button>
            </>
          )}
          {step === "results" && (
            <Button onClick={() => { setOpen(false); resetDialog(); }}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
