import { GymRole } from "../../gyms/types/gym.types";

export interface User {
    id: number;
    email: string;
    username?: string;
    appRole?: string;
    userRole?: string;
    createdAt: string;
    gymManagementRoles?: GymRole[];
  }