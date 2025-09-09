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

  const createUploadTicket = (
    gymId: number,
    ext: string,
    contentLength?: number,
  ) =>
    createTicket({variables: {gymId, ext, contentLength}});

  const recognizeImage = async (ticketToken: string, limit = 3) => {
    const {data} = await recognize({
      variables: {ticketToken, limit},
      fetchPolicy: 'no-cache',
    });
    return data?.recognizeImage ?? null;
  };

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

  const uploadAndRecognize = async (
    gymId: number,
    blob: Blob,
    limit = 3,
  ) => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const ticket = await createUploadTicket(gymId, 'jpg', blob.size);
      const t = ticket.data?.createRecognitionUploadTicket;
      if (!t) throw new Error('Failed to create upload ticket');
      const putResp = await fetch(t.putUrl, {
        method: 'PUT',
        headers: {'Content-Type': 'image/jpeg'},
        body: blob,
      });
      if (putResp.status === 403 && attempt === 0) {
        continue;
      }
      if (!putResp.ok) {
        throw new Error(`Upload failed with status ${putResp.status}`);
      }
      const {data} = await recognize({
        variables: {ticketToken: t.ticketToken, limit},
        fetchPolicy: 'no-cache',
      });
      return data?.recognizeImage ?? null;
    }
    throw new Error('Upload failed');
  };

  return {
    createUploadTicket,
    uploadAndRecognize,
    recognizeImage,
    confirmRecognition,
    discardRecognition,
  };
};

export default useRecognition;