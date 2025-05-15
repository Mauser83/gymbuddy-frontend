export interface Equipment {
  id: number;
  name: string;
  description?: string;
  brand: string;
  manualUrl?: string;
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

  images?: EquipmentImage[]; // ✅ Global image catalog
}

export interface EquipmentImage {
  id: number;
  url: string;
  createdAt: string;
}

export interface CreateEquipmentInput {
  name: string;
  description?: string;
  categoryId: number | null;
  subcategoryId?: number | null;
  brand: string;
  manualUrl?: string;
}

export interface UpdateEquipmentInput {
  name?: string;
  description?: string;
  categoryId?: number;
  subcategoryId?: number;
  brand?: string;
  manualUrl?: string;
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

export interface CreateEquipmentCategoryInput {
  name: string;
  slug: string;
}

export interface UpdateEquipmentCategoryInput {
  name: string;
  slug: string;
}

export interface CreateEquipmentSubcategoryInput {
  name: string;
  slug: string;
  categoryId: number;
}

export interface UpdateEquipmentSubcategoryInput {
  name: string;
  slug: string;
}
