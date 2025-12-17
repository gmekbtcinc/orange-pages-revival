import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from './checkbox';
import { Label } from './label';
import { Input } from './input';
import { ScrollArea } from './scroll-area';
import { BrandBadge } from './brand-badge';

interface BrandTag {
  id: string;
  name: string;
  logo_url: string | null;
  slug: string;
  is_active: boolean;
}

interface BrandSelectorProps {
  selectedBrandIds: string[];
  onChange: (brandIds: string[]) => void;
  categoryFilter?: string;
  subCategoryFilter?: string;
}

export function BrandSelector({
  selectedBrandIds,
  onChange,
  categoryFilter,
}: BrandSelectorProps) {
  const [brands, setBrands] = useState<BrandTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBrands();
  }, [categoryFilter]);

  const loadBrands = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('brand_tags')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (categoryFilter) {
        const { data: mappings } = await supabase
          .from('brand_tag_category_mappings')
          .select('brand_tag_id')
          .eq('category_id', categoryFilter);

        if (mappings) {
          const brandIds = mappings.map(m => m.brand_tag_id);
          query = query.in('id', brandIds.length > 0 ? brandIds : ['none']);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      setBrands(data || []);
    } catch (error) {
      console.error('Error loading brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBrand = (brandId: string) => {
    if (selectedBrandIds.includes(brandId)) {
      onChange(selectedBrandIds.filter(id => id !== brandId));
    } else {
      onChange([...selectedBrandIds, brandId]);
    }
  };

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading brands...</div>;
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search brands..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {selectedBrandIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedBrandIds.map(id => {
            const brand = brands.find(b => b.id === id);
            if (!brand) return null;
            return (
              <BrandBadge
                key={id}
                name={brand.name}
                logoUrl={brand.logo_url}
                size="sm"
              />
            );
          })}
        </div>
      )}

      <ScrollArea className="h-[300px] rounded-md border p-4">
        <div className="space-y-3">
          {filteredBrands.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No brands found
            </p>
          ) : (
            filteredBrands.map((brand) => (
              <div key={brand.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`brand-${brand.id}`}
                  checked={selectedBrandIds.includes(brand.id)}
                  onCheckedChange={() => handleToggleBrand(brand.id)}
                />
                <Label
                  htmlFor={`brand-${brand.id}`}
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  {brand.logo_url && (
                    <img
                      src={brand.logo_url}
                      alt={brand.name}
                      className="h-6 w-6 object-contain"
                    />
                  )}
                  <span>{brand.name}</span>
                </Label>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
