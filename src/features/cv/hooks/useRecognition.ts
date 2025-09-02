+41
-0

import {useMutation} from '@apollo/client';
import {
  CREATE_RECOGNITION_UPLOAD_TICKET,
  RECOGNIZE_IMAGE,
  CONFIRM_RECOGNITION,
  DISCARD_RECOGNITION,
} from '../graphql/recognition.graphql';

export const useRecognition = () => {
  const [createTicket] = useMutation(CREATE_RECOGNITION_UPLOAD_TICKET);
  const [recognize] = useMutation(RECOGNIZE_IMAGE);
  const [confirm] = useMutation(CONFIRM_RECOGNITION);
  const [discard] = useMutation(DISCARD_RECOGNITION);

  const createUploadTicket = (gymId: number, ext: string) =>
    createTicket({variables: {gymId, ext}});

  const recognizeImage = (ticketToken: string, limit = 3) =>
    recognize({variables: {ticketToken, limit}});

  const confirmRecognition = (
    attemptId: string,
    selectedEquipmentId: number,
    offerForTraining: boolean,
  ) =>
    confirm({
      variables: {input: {attemptId, selectedEquipmentId, offerForTraining}},
    });

  const discardRecognition = (attemptId: string) =>
    discard({variables: {attemptId}});

  return {
    createUploadTicket,
    recognizeImage,
    confirmRecognition,
    discardRecognition,
  };
};

export default useRecognition;