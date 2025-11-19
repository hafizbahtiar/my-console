"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Link as LinkIcon } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { Relationship } from "@/app/auth/family-tree/persons/types";

interface RelationshipsFiltersProps {
  typeFilter: string;
  allRelationships: Relationship[];
  onTypeFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

export function RelationshipsFilters({
  typeFilter,
  allRelationships,
  onTypeFilterChange,
  onClearFilters,
}: RelationshipsFiltersProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2 p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2" suppressHydrationWarning>
          <Search className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
          {t('family_tree.relationships.filters.title')}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
          {t('family_tree.relationships.filters.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium text-muted-foreground" suppressHydrationWarning>
              {t('family_tree.relationships.filters.type_filter')}
            </label>
            <Select value={typeFilter} onValueChange={onTypeFilterChange}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={t('family_tree.relationships.filters.type_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 shrink-0" />
                    <span suppressHydrationWarning>{t('family_tree.relationships.filters.all_types')}</span>
                    <Badge variant="secondary" className="text-xs">
                      {allRelationships.length}
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="married">
                  <div className="flex items-center gap-2">
                    <span suppressHydrationWarning>{t('family_tree.relationships.type_married')}</span>
                    <Badge variant="secondary" className="text-xs">
                      {allRelationships.filter(r => r.type === 'married').length}
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="parent">
                  <div className="flex items-center gap-2">
                    <span suppressHydrationWarning>{t('family_tree.relationships.type_parent')}</span>
                    <Badge variant="secondary" className="text-xs">
                      {allRelationships.filter(r => r.type === 'parent').length}
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="sibling">
                  <div className="flex items-center gap-2">
                    <span suppressHydrationWarning>{t('family_tree.relationships.type_sibling')}</span>
                    <Badge variant="secondary" className="text-xs">
                      {allRelationships.filter(r => r.type === 'sibling').length}
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="cousin">
                  <div className="flex items-center gap-2">
                    <span suppressHydrationWarning>{t('family_tree.relationships.type_cousin')}</span>
                    <Badge variant="secondary" className="text-xs">
                      {allRelationships.filter(r => r.type === 'cousin').length}
                    </Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {typeFilter !== 'all' && (
            <Button
              variant="ghost"
              onClick={onClearFilters}
              className="w-full md:w-auto shrink-0"
              suppressHydrationWarning
            >
              {t('family_tree.relationships.filters.clear_filters')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

