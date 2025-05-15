// equipment.graphql.ts
import {gql} from '@apollo/client';

export const GET_ALL_EQUIPMENTS = gql`
  query GetAllEquipments($search: String) {
    allEquipments(search: $search) {
      id
      name
      description
      brand
      manualUrl
      createdAt
      updatedAt
      images {
        id
        url
      }
      category {
        id
        name
      }
      subcategory {
        id
        name
      }
    }
  }
`;


export const GET_EQUIPMENT_BY_ID = gql`
  query GetEquipmentById($id: Int!) {
    equipment(id: $id) {
      id
      name
      description
      brand
      manualUrl
      categoryId
      subcategoryId
      createdAt
      updatedAt
      images {
        id
        url
      }
      category {
        id
        name
      }
      subcategory {
        id
        name
      }
    }
  }
`;

export const CREATE_EQUIPMENT = gql`
  mutation CreateEquipment($input: CreateEquipmentInput!) {
    createEquipment(input: $input) {
      id
      name
    }
  }
`;

export const UPDATE_EQUIPMENT = gql`
  mutation UpdateEquipment($id: Int!, $input: UpdateEquipmentInput!) {
    updateEquipment(id: $id, input: $input) {
      id
      name
    }
  }
`;

export const DELETE_EQUIPMENT = gql`
  mutation DeleteEquipment($id: Int!) {
    deleteEquipment(id: $id)
  }
`;

export const GET_EQUIPMENT_CATEGORIES = gql`
  query GetEquipmentCategories {
    equipmentCategories {
      id
      name
      slug
      subcategories {
        id
        name
        slug
      }
    }
  }
`;

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($input: CreateEquipmentCategoryInput!) {
    createEquipmentCategory(input: $input) {
      id
      name
      slug
    }
  }
`;

export const CREATE_SUBCATEGORY = gql`
  mutation CreateSubcategory($input: CreateEquipmentSubcategoryInput!) {
    createEquipmentSubcategory(input: $input) {
      id
      name
      slug
    }
  }
`;

export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($id: Int!, $input: UpdateEquipmentCategoryInput!) {
    updateEquipmentCategory(id: $id, input: $input) {
      id
      name
    }
  }
`;

export const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: Int!) {
    deleteEquipmentCategory(id: $id)
  }
`;

export const UPDATE_SUBCATEGORY = gql`
  mutation UpdateSubcategory(
    $id: Int!
    $input: UpdateEquipmentSubcategoryInput!
  ) {
    updateEquipmentSubcategory(id: $id, input: $input) {
      id
      name
    }
  }
`;

export const DELETE_SUBCATEGORY = gql`
  mutation DeleteSubcategory($id: Int!) {
    deleteEquipmentSubcategory(id: $id)
  }
`;
