// Shared GraphQL Hook Example: useEquipment.js
import {useQuery, useMutation} from '@apollo/client';
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
} from '../graphql/equipment.graphql';

export function useEquipment() {
  const getAllEquipments = (search?: string) =>
    useQuery(GET_ALL_EQUIPMENTS, {
      variables: {search},
    });
  const getEquipmentById = (id: number) =>
    useQuery(GET_EQUIPMENT_BY_ID, {variables: {id}});
  const [createEquipment] = useMutation(CREATE_EQUIPMENT);
  const [updateEquipment] = useMutation(UPDATE_EQUIPMENT);
  const [deleteEquipment] = useMutation(DELETE_EQUIPMENT);

  const getCategories = () => useQuery(GET_EQUIPMENT_CATEGORIES);
  const [createCategory] = useMutation(CREATE_CATEGORY);
  const [createSubcategory] = useMutation(CREATE_SUBCATEGORY);
  const [updateCategory] = useMutation(UPDATE_CATEGORY);
  const [deleteCategory] = useMutation(DELETE_CATEGORY);
  const [updateSubcategory] = useMutation(UPDATE_SUBCATEGORY);
  const [deleteSubcategory] = useMutation(DELETE_SUBCATEGORY);

  return {
    getAllEquipments,
    getEquipmentById,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    getCategories,
    createCategory,
    createSubcategory,
    updateCategory,
    deleteCategory,
    updateSubcategory,
    deleteSubcategory,
  };
}
