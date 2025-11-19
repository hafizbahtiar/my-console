"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, AlertCircle, Users, User } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { Person } from "@/app/auth/family-tree/persons/types";

interface PersonsFiltersProps {
  searchTerm: string;
  statusFilter: string;
  genderFilter: string;
  allPersons: Person[];
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onGenderFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

export function PersonsFilters({
  searchTerm,
  statusFilter,
  genderFilter,
  allPersons,
  onSearchChange,
  onStatusFilterChange,
  onGenderFilterChange,
  onClearFilters,
}: PersonsFiltersProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2 p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2" suppressHydrationWarning>
          <Search className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
          {t('family_tree.persons.filters.title')}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
          {t('family_tree.persons.filters.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1 space-y-2 min-w-0">
            <label className="text-xs sm:text-sm font-medium text-muted-foreground" suppressHydrationWarning>
              {t('family_tree.persons.filters.search_label')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                type="text"
                placeholder={t('family_tree.persons.filters.search_placeholder')}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium text-muted-foreground" suppressHydrationWarning>
              {t('family_tree.persons.filters.status_filter')}
            </label>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={t('family_tree.persons.filters.status_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <span suppressHydrationWarning>{t('family_tree.persons.filters.all_status')}</span>
                    <Badge variant="secondary" className="text-xs">
                      {allPersons.length}
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    <span suppressHydrationWarning>{t('family_tree.persons.status_active')}</span>
                    <Badge variant="secondary" className="text-xs">
                      {allPersons.filter(p => p.status === 'active').length}
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="inactive">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-500 shrink-0" />
                    <span suppressHydrationWarning>{t('family_tree.persons.status_inactive')}</span>
                    <Badge variant="secondary" className="text-xs">
                      {allPersons.filter(p => p.status === 'inactive').length}
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="archived">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
                    <span suppressHydrationWarning>{t('family_tree.persons.status_archived')}</span>
                    <Badge variant="secondary" className="text-xs">
                      {allPersons.filter(p => p.status === 'archived').length}
                    </Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium text-muted-foreground" suppressHydrationWarning>
              {t('family_tree.persons.filters.gender_filter')}
            </label>
            <Select value={genderFilter} onValueChange={onGenderFilterChange}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={t('family_tree.persons.filters.gender_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 shrink-0" />
                    <span suppressHydrationWarning>{t('family_tree.persons.gender_all')}</span>
                    <Badge variant="secondary" className="text-xs">
                      {allPersons.length}
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="M">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500 shrink-0" />
                    <span suppressHydrationWarning>{t('family_tree.persons.gender_male')}</span>
                    <Badge variant="secondary" className="text-xs">
                      {allPersons.filter(p => p.gender === 'M').length}
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="F">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-pink-500 shrink-0" />
                    <span suppressHydrationWarning>{t('family_tree.persons.gender_female')}</span>
                    <Badge variant="secondary" className="text-xs">
                      {allPersons.filter(p => p.gender === 'F').length}
                    </Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchTerm || statusFilter !== 'all' || genderFilter !== 'all') && (
            <Button
              variant="ghost"
              onClick={onClearFilters}
              className="w-full md:w-auto shrink-0"
              suppressHydrationWarning
            >
              {t('family_tree.persons.filters.clear_filters')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

