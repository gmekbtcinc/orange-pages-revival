import { ExternalLink } from 'lucide-react';
import { Badge } from './badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { cn } from '@/lib/utils';

interface BrandBadgeProps {
  name: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  categoryMappings?: string[];
  className?: string;
  showLogo?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function BrandBadge({
  name,
  logoUrl,
  websiteUrl,
  categoryMappings = [],
  className,
  showLogo = true,
  size = 'md',
}: BrandBadgeProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const badge = (
    <Badge variant="secondary" className={cn('gap-2', className)}>
      {showLogo && logoUrl && (
        <img
          src={logoUrl}
          alt={name}
          className={cn('object-contain', sizeClasses[size])}
        />
      )}
      <span>{name}</span>
      {websiteUrl && (
        <ExternalLink className="h-3 w-3 opacity-50" />
      )}
    </Badge>
  );

  if (websiteUrl || categoryMappings.length > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {websiteUrl ? (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                {badge}
              </a>
            ) : (
              badge
            )}
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-semibold">{name}</p>
              {websiteUrl && (
                <p className="text-xs text-muted-foreground">{websiteUrl}</p>
              )}
              {categoryMappings.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold mb-1">Categories:</p>
                  <ul className="text-xs space-y-0.5">
                    {categoryMappings.map((mapping, index) => (
                      <li key={index}>{mapping}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
