import { GymRole } from "../../gym/types/gym.types";

export interface User {
    id: string;
    email: string;
    username?: string;
    appRole?: string;
    userRole?: string;
    createdAt: string;
    gymManagementRoles?: GymRole[];
  }