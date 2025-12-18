import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { fetchBusinessSuggestions, BusinessSuggestion } from "@/lib/businessQueries";

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchAutocomplete = ({
  value,
  onChange,
  placeholder = "Search by name, description, location, CEO...",
}: SearchAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<BusinessSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Debounced fetch suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (value.trim().length >= 2) {
        setIsLoading(true);
        const results = await fetchBusinessSuggestions(value, 6);
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setIsLoading(false);
        setHighlightedIndex(-1);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (suggestion: BusinessSuggestion) => {
    setIsOpen(false);
    navigate(`/business/${suggestion.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        ref={inputRef}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className="pl-10"
        autoComplete="off"
      />

      {/* Suggestions dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 overflow-hidden">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                index === highlightedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
            >
              {suggestion.logo_url ? (
                <img
                  src={suggestion.logo_url}
                  alt=""
                  className="w-8 h-8 rounded object-contain bg-muted"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{suggestion.name}</p>
                {suggestion.category_name && (
                  <p className="text-xs text-muted-foreground truncate">
                    {suggestion.category_name}
                  </p>
                )}
              </div>
            </button>
          ))}
          {isLoading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Searching...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
