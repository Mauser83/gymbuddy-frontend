export interface Equipment {
  id: number;
  name: string;
  description?: string;
  brand: string;
  manualUrl?: string;
  gymId?: number;
  categoryId: number;
  subcategoryId?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  category?: {
    id: number;
    name: string;
  };
  subcategory?: {
    id: number;
    name: string;
  };
}

export interface CreateEquipmentInput {
  name: string;
  description?: string;
  categoryId: number;
  subcategoryId?: number;
  brand: string;
  manualUrl?: string;
  gymId?: number;
}

export interface UpdateEquipmentInput {
  name?: string;
  description?: string;
  categoryId?: number;
  subcategoryId?: number;
  brand?: string;
  manualUrl?: string;
  gymId?: number;
}

export interface EquipmentCategory {
  id: number;
  name: string;
  slug: string;
  subcategories: EquipmentSubcategory[];
}

export interface EquipmentSubcategory {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
}
