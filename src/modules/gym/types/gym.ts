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

  equipment: Equipment[];
  trainers: Trainer[];
  gymRoles: GymRole[];
}

export interface Equipment {
  id: number;
  name?: string;
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
