import { useMutation } from '@apollo/client';

import {
  CREATE_UPLOAD_SESSION,
  FINALIZE_GYM_IMAGES,
  CREATE_ADMIN_UPLOAD_TICKET,
  FINALIZE_GYM_IMAGES_ADMIN,
  APPLY_TAXONOMIES,
} from '../graphql/uploadSession.graphql';

export function useCreateUploadSession(options?: any) {
  const [mutate, result] = useMutation(CREATE_UPLOAD_SESSION, options);
  return [mutate, result] as const;
}

export function useFinalizeGymImages(options?: any) {
  const [mutate, result] = useMutation(FINALIZE_GYM_IMAGES, options);
  return [mutate, result] as const;
}

export function useCreateAdminUploadTicket(options?: any) {
  const [mutate, result] = useMutation(CREATE_ADMIN_UPLOAD_TICKET, options);
  return [mutate, result] as const;
}

export function useFinalizeGymImagesAdmin(options?: any) {
  const [mutate, result] = useMutation(FINALIZE_GYM_IMAGES_ADMIN, options);
  return [mutate, result] as const;
}

export function useApplyTaxonomiesToGymImages(options?: any) {
  const [mutate, result] = useMutation(APPLY_TAXONOMIES, options);
  return [mutate, result] as const;
}
