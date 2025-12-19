import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/contexts/UserContext";
import { useState } from "react";

interface CompanySwitcherProps {
  className?: string;
}

export function CompanySwitcher({ className }: CompanySwitcherProps) {
  const { companies, activeCompanyId, activeCompany, switchCompany } = useUser();
  const [open, setOpen] = useState(false);

  // Don't render if user has 0 or 1 company
  if (companies.length <= 1) {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a company"
          className={cn("w-[200px] justify-between", className)}
        >
          <div className="flex items-center gap-2 truncate">
            {activeCompany?.business?.logo_url ? (
              <Avatar className="h-5 w-5">
                <AvatarImage src={activeCompany.business.logo_url} alt={activeCompany.business.name || ""} />
                <AvatarFallback className="text-xs">
                  {getInitials(activeCompany.business.name || "?")}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Building2 className="h-4 w-4 shrink-0 opacity-50" />
            )}
            <span className="truncate">
              {activeCompany?.business?.name || "Select company"}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search companies..." />
          <CommandList>
            <CommandEmpty>No company found.</CommandEmpty>
            <CommandGroup heading="Your Companies">
              {companies.map((membership) => (
                <CommandItem
                  key={membership.id}
                  onSelect={() => {
                    if (membership.business_id) {
                      switchCompany(membership.business_id);
                      setOpen(false);
                    }
                  }}
                  className="text-sm"
                >
                  <div className="flex items-center gap-2">
                    {membership.businesses?.logo_url ? (
                      <Avatar className="h-5 w-5">
                        <AvatarImage 
                          src={membership.businesses.logo_url} 
                          alt={membership.businesses.name || ""} 
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(membership.businesses?.name || "?")}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Building2 className="h-4 w-4 opacity-50" />
                    )}
                    <span className="truncate">{membership.businesses?.name || "Unknown"}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      activeCompanyId === membership.business_id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
