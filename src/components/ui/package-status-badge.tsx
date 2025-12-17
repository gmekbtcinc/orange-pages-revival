import { Badge } from './badge';
import { CheckCircle2, FileEdit, Archive } from 'lucide-react';

interface PackageStatusBadgeProps {
  status: 'active' | 'draft' | 'archived';
}

export function PackageStatusBadge({ status }: PackageStatusBadgeProps) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    case 'draft':
      return (
        <Badge variant="secondary">
          <FileEdit className="h-3 w-3 mr-1" />
          Draft
        </Badge>
      );
    case 'archived':
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <Archive className="h-3 w-3 mr-1" />
          Archived
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
