import {gql} from '@apollo/client';

export const CREATE_UPLOAD_SESSION = gql`
  mutation CreateUploadSession($input: CreateUploadSessionInput!) {
    createUploadSession(input: $input) {
      sessionId
      expiresAt
      items {
        url
        storageKey
        expiresAt
        requiredHeaders {
          name
          value
        }
      }
    }
  }
`;

export const FINALIZE_GYM_IMAGES = gql`
  mutation FinalizeGymImages($input: FinalizeGymImagesInput!) {
    finalizeGymImages(input: $input) {
      images {
        id
        gymId
        equipmentId
        status
      }
      queuedJobs
    }
  }
`;

export const IMAGE_URL_MANY = gql`
  query ImageUrlMany($keys: [String!]!, $ttlSec: Int) {
    imageUrlMany(storageKeys: $keys, ttlSec: $ttlSec) {
      storageKey
      url
      expiresAt
    }
  }
`;

export const APPLY_TAXONOMIES = gql`
  mutation ApplyTaxonomiesToGymImages(
    $input: ApplyTaxonomiesToGymImagesInput!
  ) {
    applyTaxonomiesToGymImages(input: $input) {
      updatedCount
    }
  }
`;

export const CREATE_ADMIN_UPLOAD_TICKET = gql`
  mutation CreateAdminUploadTicket($input: CreateAdminUploadTicketInput!) {
    createAdminUploadTicket(input: $input) {
      url
      storageKey
      expiresAt
      requiredHeaders {
        name
        value
      }
    }
  }
`;

export const FINALIZE_GYM_IMAGES_ADMIN = gql`
  mutation FinalizeGymImagesAdmin($input: FinalizeGymImagesAdminInput!) {
    finalizeGymImagesAdmin(input: $input) {
      images {
        id
        gymId
        equipmentId
        status
        storageKey
      }
      queuedJobs
    }
  }
`;