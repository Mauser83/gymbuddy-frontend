import { Equipment } from 'features/equipment/types/equipment.types';

export interface Gym {
  id: number;
  name: string;
  description?: string | null;

  country: string;
  countryCode?: string | null;
  state?: string | null;
  stateCode?: string | null;
  city: string;
  address?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  websiteUrl?: string | null;
  imageUrl?: string | null;
  phone?: string | null;
  email?: string | null;

  isApproved: boolean;
  createdAt: string;

  creator?: UserSummary | null;

  gymEquipment: GymEquipment[]; // ✅ new normalized structure
  trainers: Trainer[];
  gymRoles: GymRole[];
}

export interface GymEquipment {
  id: number;
  quantity: number;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  images: GymEquipmentImage[];
  equipment: Equipment;
}

export interface GymEquipmentImage {
  id: number;
  url: string;
  createdAt: string;
}

export interface Trainer {
  id: number;
  username?: string;
}

export interface GymRole {
  role: 'GYM_ADMIN' | 'GYM_MODERATOR';
  user: {
    id: number;
    username: string;
  };
  gym: {
    id: number;
    name: string;
    isApproved: boolean;
  };
}

export interface UserSummary {
  id: number;
  username: string;
  email?: string;
}

export interface AssignEquipmentToGymInput {
  gymId: number;
  equipmentId: number;
  quantity: number;
  note?: string;
}
