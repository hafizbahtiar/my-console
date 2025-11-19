export interface Person {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  maidenName?: string;
  nickname?: string;
  title?: string;
  gender: 'M' | 'F' | 'O' | 'U';
  birthDate?: string;
  birthPlace?: string;
  birthCountry?: string;
  deathDate?: string;
  deathPlace?: string;
  deathCountry?: string;
  isDeceased: boolean;
  photo?: string;
  photoThumbnail?: string;
  bio?: string;
  wikiId?: string;
  occupation?: string;
  education?: string;
  nationality?: string;
  ethnicity?: string;
  religion?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  notes?: string;
  metadata?: string;
  status: 'active' | 'inactive' | 'archived' | 'draft';
  isPublic: boolean;
  displayOrder: number;
}

export interface Family {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  husband?: string;
  wife?: string;
  partners: string[];
  children: string[];
  familyName?: string;
  marriageDate?: string;
  marriagePlace?: string;
  divorceDate?: string;
  isDivorced: boolean;
  isHistoric: boolean;
  notes?: string;
  metadata?: string;
  status: 'active' | 'inactive' | 'archived' | 'draft';
  displayOrder: number;
}

export interface Relationship {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  personA: string;
  personB: string;
  type: 'married' | 'divorced' | 'engaged' | 'parent' | 'child' | 'sibling' | 'half_sibling' | 'step_sibling' | 'adopted' | 'adoptive_parent' | 'cousin' | 'uncle_aunt' | 'nephew_niece' | 'grandparent' | 'grandchild' | 'in_law' | 'godparent' | 'godchild' | 'guardian' | 'ward' | 'other';
  date?: string;
  place?: string;
  note?: string;
  isBidirectional: boolean;
  status: 'active' | 'inactive' | 'archived' | 'draft';
  metadata?: string;
}

