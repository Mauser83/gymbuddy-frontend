import { useQuery, useMutation } from '@apollo/client';

import {
  GET_ALL_EQUIPMENTS,
  GET_EQUIPMENT_BY_ID,
  CREATE_EQUIPMENT,
  UPDATE_EQUIPMENT,
  DELETE_EQUIPMENT,
  GET_EQUIPMENT_CATEGORIES,
  CREATE_CATEGORY,
  CREATE_SUBCATEGORY,
  UPDATE_CATEGORY,
  DELETE_CATEGORY,
  UPDATE_SUBCATEGORY,
  DELETE_SUBCATEGORY,
} from 'src/features/equipment/graphql/equipment.graphql';

import {
  CreateEquipmentInput,
  UpdateEquipmentInput,
  CreateEquipmentCategoryInput,
  UpdateEquipmentCategoryInput,
  CreateEquipmentSubcategoryInput,
  UpdateEquipmentSubcategoryInput,
} from '../types/equipment.types';

export function useEquipment() {
  const useAllEquipments = (search?: string) =>
    useQuery(GET_ALL_EQUIPMENTS, {
      variables: { search },
    });

  const useEquipmentById = (id: number) => useQuery(GET_EQUIPMENT_BY_ID, { variables: { id } });

  const [createEquipment] = useMutation<{ createEquipment: any }, { input: CreateEquipmentInput }>(
    CREATE_EQUIPMENT,
  );
  const [updateEquipment] = useMutation<
    { updateEquipment: any },
    { id: number; input: UpdateEquipmentInput }
  >(UPDATE_EQUIPMENT);
  const [deleteEquipment] = useMutation<{ deleteEquipment: boolean }, { id: number }>(
    DELETE_EQUIPMENT,
  );

  const useEquipmentCategories = () => useQuery(GET_EQUIPMENT_CATEGORIES);

  const [createCategory] = useMutation<
    { createEquipmentCategory: any },
    { input: CreateEquipmentCategoryInput }
  >(CREATE_CATEGORY);
  const [updateCategory] = useMutation<
    { updateEquipmentCategory: any },
    { id: number; input: UpdateEquipmentCategoryInput }
  >(UPDATE_CATEGORY);
  const [deleteCategory] = useMutation<{ deleteEquipmentCategory: boolean }, { id: number }>(
    DELETE_CATEGORY,
  );

  const [createSubcategory] = useMutation<
    { createEquipmentSubcategory: any },
    { input: CreateEquipmentSubcategoryInput }
  >(CREATE_SUBCATEGORY);
  const [updateSubcategory] = useMutation<
    { updateEquipmentSubcategory: any },
    { id: number; input: UpdateEquipmentSubcategoryInput }
  >(UPDATE_SUBCATEGORY);
  const [deleteSubcategory] = useMutation<{ deleteEquipmentSubcategory: boolean }, { id: number }>(
    DELETE_SUBCATEGORY,
  );

  return {
    useAllEquipments,
    useEquipmentById,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    useEquipmentCategories,
    createCategory,
    createSubcategory,
    updateCategory,
    deleteCategory,
    updateSubcategory,
    deleteSubcategory,
  };
}
