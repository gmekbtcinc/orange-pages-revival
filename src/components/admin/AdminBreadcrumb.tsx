import { Home } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function AdminBreadcrumb({ items }: AdminBreadcrumbProps) {
  return (
    <div className="py-2 px-4 bg-muted/30 border-b border-border">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/admin" className="flex items-center gap-1 hover:underline">
                <Home className="h-3.5 w-3.5" />
                <span>Admin</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {items.map((item, index) => (
            <span key={index} className="contents">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {item.href ? (
                  <BreadcrumbLink asChild>
                    <Link to={item.href} className="hover:underline">
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="font-medium">
                    {item.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
