import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, X, ExternalLink } from "lucide-react";

interface Article {
  id?: string;
  title: string;
  url: string;
  published_date?: string;
  source?: string;
}

interface ArticleManagerProps {
  articles: Article[];
  onChange: (articles: Article[]) => void;
}

export function ArticleManager({ articles, onChange }: ArticleManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newArticle, setNewArticle] = useState<Omit<Article, "id">>({
    title: "",
    url: "",
    source: "",
    published_date: "",
  });

  const addArticle = () => {
    if (!newArticle.title || !newArticle.url) return;
    onChange([...articles, { ...newArticle }]);
    setNewArticle({ title: "", url: "", source: "", published_date: "" });
    setIsAdding(false);
  };

  const removeArticle = (index: number) => {
    onChange(articles.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Related Articles & Announcements
        </label>
        {!isAdding && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Article
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="p-4 space-y-3 border-primary/50">
          <Input
            placeholder="Article title"
            value={newArticle.title}
            onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
          />
          <Input
            placeholder="Article URL"
            value={newArticle.url}
            onChange={(e) => setNewArticle({ ...newArticle, url: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Source (e.g., Forbes)"
              value={newArticle.source}
              onChange={(e) => setNewArticle({ ...newArticle, source: e.target.value })}
            />
            <Input
              type="date"
              placeholder="Published date"
              value={newArticle.published_date}
              onChange={(e) => setNewArticle({ ...newArticle, published_date: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={addArticle}>
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewArticle({ title: "", url: "", source: "", published_date: "" });
              }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {articles.length > 0 ? (
        <div className="space-y-2">
          {articles.map((article, index) => (
            <Card key={index} className="p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {article.title}
                  </h4>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <p className="text-xs text-muted-foreground">
                  {article.source}
                  {article.published_date && ` • ${article.published_date}`}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => removeArticle(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        !isAdding && (
          <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
            No articles added yet
          </p>
        )
      )}
    </div>
  );
}
