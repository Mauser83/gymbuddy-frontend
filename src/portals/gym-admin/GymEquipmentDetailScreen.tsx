import React, {useCallback, useEffect, useState} from 'react';
import {Alert, FlatList, Image, TouchableOpacity, View, Text} from 'react-native';
import {useNavigate, useParams} from 'react-router-native';
import {useQuery, useMutation} from '@apollo/client';
import * as ImagePicker from 'expo-image-picker';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import DetailField from 'shared/components/DetailField';
import LoadingState from 'shared/components/LoadingState';
import NoResults from 'shared/components/NoResults';
import Button from 'shared/components/Button';
import ButtonRow from 'shared/components/ButtonRow';
import Card from 'shared/components/Card';
import {useTheme} from 'shared/theme/ThemeProvider';
import {useAuth} from 'features/auth/context/AuthContext';
import {
  GET_GYM_EQUIPMENT_DETAIL,
  REMOVE_GYM_EQUIPMENT,
  LIST_GYM_EQUIPMENT_IMAGES,
  CREATE_EQUIPMENT_TRAINING_UPLOAD_TICKET,
  FINALIZE_EQUIPMENT_TRAINING_IMAGE,
  DELETE_GYM_EQUIPMENT_IMAGE,
} from 'features/gyms/graphql/gymEquipment';
import {GymEquipment, GymEquipmentImage} from 'features/gyms/types/gym.types';

const Chip = ({
  text,
  tone = 'default',
}: {
  text: string;
  tone?: 'default' | 'warning';
}) => {
  const {theme} = useTheme();
  const colorMap: Record<string, string> = {
    warning: (theme.colors as any).warning ?? '#eab308',
    default: '#666',
  };
  const bg = colorMap[tone] ?? colorMap.default;
  return (
    <View
      style={{
        backgroundColor: bg,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
      }}>
      <Text style={{color: '#fff', fontSize: 12}}>{text}</Text>
    </View>
  );
};

export default function GymEquipmentDetailScreen() {
  const {gymId, gymEquipmentId} = useParams<{gymId: string; gymEquipmentId: string}>();
  const navigate = useNavigate();
  const {user} = useAuth();
  const isAdmin = user?.appRole === 'ADMIN';

  const {data, loading} = useQuery<{getGymEquipmentDetail: GymEquipment}>(
    GET_GYM_EQUIPMENT_DETAIL,
    {
      variables: {gymEquipmentId: Number(gymEquipmentId)},
    },
  );

  const [removeEquipment, {loading: removing}] = useMutation(REMOVE_GYM_EQUIPMENT);

  const equipment = data?.getGymEquipmentDetail;

  const {
    data: imagesData,
    loading: imagesLoading,
    error: imagesError,
    fetchMore,
    refetch: refetchImages,
  } = useQuery<{
    listGymEquipmentImages: {
      items: GymEquipmentImage[];
      nextCursor?: string | null;
    };
  }>(LIST_GYM_EQUIPMENT_IMAGES, {
    variables: {gymEquipmentId: Number(gymEquipmentId), limit: 24},
  });

  const [createTicket] = useMutation(CREATE_EQUIPMENT_TRAINING_UPLOAD_TICKET);
  const [finalizeImage] = useMutation(FINALIZE_EQUIPMENT_TRAINING_IMAGE);
  const [deleteImage] = useMutation(DELETE_GYM_EQUIPMENT_IMAGE);
  const [uploading, setUploading] = useState(false);

  const rawImages = imagesData?.listGymEquipmentImages.items ?? [];
  const images = rawImages.filter(img => isAdmin || img.status !== 'QUARANTINED');
  const nextCursor = imagesData?.listGymEquipmentImages.nextCursor ?? undefined;

  const loadMore = useCallback(() => {
    if (!nextCursor) return;
    fetchMore({
      variables: {cursor: nextCursor},
      updateQuery: (prev, {fetchMoreResult}) => {
        if (!fetchMoreResult) return prev;
        return {
          listGymEquipmentImages: {
            ...fetchMoreResult.listGymEquipmentImages,
            items: [
              ...prev.listGymEquipmentImages.items,
              ...fetchMoreResult.listGymEquipmentImages.items,
            ],
          },
        };
      },
    });
  }, [nextCursor, fetchMore]);

  const handleAddPhotos = useCallback(async () => {
    if (!equipment) return;
    setUploading(true);
    try {
      const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Media library permission required.');
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 1,
      });
      if (res.canceled || !res.assets?.length) {
        setUploading(false);
        return;
      }
      for (const asset of res.assets) {
        const blob = await fetch(asset.uri).then(r => r.blob());
        const name = asset.fileName || '';
        const extMatch = name.match(/\.([a-zA-Z0-9]+)$/);
        let ext = extMatch ? extMatch[1].toLowerCase() : '';
        if (!ext) {
          const mime = blob.type;
          if (mime === 'image/png') ext = 'png';
          else if (mime === 'image/jpeg') ext = 'jpg';
          else ext = 'jpg';
        }
        const ticketRes = await createTicket({
          variables: {
            gymId: Number(gymId),
            equipmentId: equipment.equipment.id,
            ext,
          },
        });
        const putUrl = ticketRes.data?.createEquipmentTrainingUploadTicket.putUrl;
        const storageKey = ticketRes.data?.createEquipmentTrainingUploadTicket.storageKey;
        if (!putUrl || !storageKey) {
          throw new Error('Failed to obtain upload ticket.');
        }
        const putResp = await fetch(putUrl, {
          method: 'PUT',
          body: blob,
          headers: {
            'Content-Type': blob.type || 'application/octet-stream',
          },
        });
        if (!putResp.ok) {
          throw new Error(`Upload failed with status ${putResp.status}`);
        }
        await finalizeImage({
          variables: {
            gymEquipmentId: Number(gymEquipmentId),
            storageKey,
          },
        });
      }
      await refetchImages();
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message || String(e));
    } finally {
      setUploading(false);
    }
  }, [equipment, createTicket, finalizeImage, gymId, gymEquipmentId, refetchImages]);

const handleTakePhoto = useCallback(async () => {
    if (!equipment) return;
    setUploading(true);
    try {
      const {status} = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Camera permission required.');
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (res.canceled || !res.assets?.length) {
        setUploading(false);
        return;
      }
      const asset = res.assets[0];
      const blob = await fetch(asset.uri).then(r => r.blob());
      const name = asset.fileName || '';
      const extMatch = name.match(/\.([a-zA-Z0-9]+)$/);
      let ext = extMatch ? extMatch[1].toLowerCase() : '';
      if (!ext) {
        const mime = blob.type;
        if (mime === 'image/png') ext = 'png';
        else if (mime === 'image/jpeg') ext = 'jpg';
        else ext = 'jpg';
      }
      const ticketRes = await createTicket({
        variables: {
          gymId: Number(gymId),
          equipmentId: equipment.equipment.id,
          ext,
        },
      });
      const putUrl = ticketRes.data?.createEquipmentTrainingUploadTicket.putUrl;
      const storageKey = ticketRes.data?.createEquipmentTrainingUploadTicket.storageKey;
      if (!putUrl || !storageKey) {
        throw new Error('Failed to obtain upload ticket.');
      }
      const putResp = await fetch(putUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': blob.type || 'application/octet-stream',
        },
      });
      if (!putResp.ok) {
        throw new Error(`Upload failed with status ${putResp.status}`);
      }
      await finalizeImage({
        variables: {
          gymEquipmentId: Number(gymEquipmentId),
          storageKey,
        },
      });
      await refetchImages();
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message || String(e));
    } finally {
      setUploading(false);
    }
  }, [equipment, createTicket, finalizeImage, gymId, gymEquipmentId, refetchImages]);

    useEffect(() => {
    if (images.some(img => img.status === 'PENDING')) {
      const id = setInterval(() => {
        refetchImages();
      }, 3000);
      return () => clearInterval(id);
    }
  }, [images, refetchImages]);

    const confirmDelete = useCallback(
    (id: string) => {
      Alert.alert('Delete photo?', undefined, [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteImage({variables: {imageId: id}});
              await refetchImages();
            } catch (e: any) {
              Alert.alert('Delete failed', e?.message || String(e));
            }
          },
        },
      ]);
    },
    [deleteImage, refetchImages],
  );

  const handleRemove = async () => {
    try {
      await removeEquipment({variables: {gymEquipmentId: Number(gymEquipmentId)}});
      navigate(`/gym-admin/gyms/${gymId}/equipment`);
    } catch (error) {
      console.error('Failed to remove gym equipment:', error);
    }
  };

  return (
    <ScreenLayout scroll>
      <Title
        text={equipment?.equipment.name || 'Equipment Detail'}
      />
      {loading ? (
        <LoadingState text="Loading equipment..." />
      ) : !equipment ? (
        <NoResults message="Equipment not found." />
      ) : (
        <>
          <DetailField label="Brand" value={equipment.equipment.brand || 'N/A'} />
          <DetailField
            label="Category"
            value={equipment.equipment.category?.name || 'N/A'}
          />
          <DetailField
            label="Subcategory"
            value={equipment.equipment.subcategory?.name || 'N/A'}
          />
          <DetailField label="Quantity" value={String(equipment.quantity)} />
          {equipment.note ? (
            <DetailField label="Note" value={equipment.note} />
          ) : null}
<Card
            title="Gym photos"
            text="Environment-specific training images"
          >
            {imagesLoading ? (
              <LoadingState text="Loading photos..." />
            ) : imagesError ? (
              <>
                <NoResults message="Failed to load photos." />
                <Button text="Retry" onPress={() => refetchImages()} />
              </>
            ) : images.length === 0 ? (
              <NoResults message="No gym photos yet." />
            ) : (
              <FlatList
                data={images}
                numColumns={3}
                keyExtractor={item => item.id}
                renderItem={({item}) => (
                  <TouchableOpacity
                    onLongPress={() => confirmDelete(item.id)}
                    style={{flex: 1, margin: 4}}
                  >
                    <Image
                      source={{uri: item.url!}}
                      style={{width: '100%', aspectRatio: 1, borderRadius: 12}}
                    />
                    {item.status === 'PENDING' && (
                      <View style={{position: 'absolute', top: 4, left: 4}}>
                        <Chip text="Processing…" />
                      </View>
                    )}
                    {item.status === 'QUARANTINED' && isAdmin && (
                      <View style={{position: 'absolute', top: 4, left: 4}}>
                        <Chip text="Blocked" tone="warning" />
                      </View>
                    )}
                  </TouchableOpacity>
                )}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
              />
            )}
            <ButtonRow>
              <Button
                text={uploading ? 'Uploading...' : 'Add photos'}
                onPress={handleAddPhotos}
                disabled={uploading}
                fullWidth
              />
              <Button
                text={uploading ? 'Uploading...' : 'Take photo'}
                onPress={handleTakePhoto}
                disabled={uploading}
                fullWidth
              />
            </ButtonRow>
          </Card>
            <Card title="Global photos" text="Catalog images">
              <DetailField
                label="Count"
                value={String(equipment.equipment.images?.length ?? 0)}
              />
              {/* TODO: implement catalog images grid */}
            </Card>
            <Button
              text={removing ? 'Removing...' : 'Remove from Gym'}
              onPress={handleRemove}
              disabled={removing}
            />
        </>
      )}
    </ScreenLayout>
  );
}