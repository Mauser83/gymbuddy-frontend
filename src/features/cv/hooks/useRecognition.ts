import {useMutation} from '@apollo/client';
import {
  CREATE_RECOGNITION_UPLOAD_TICKET,
  RECOGNIZE_IMAGE,
  CONFIRM_RECOGNITION,
  DISCARD_RECOGNITION,
} from '../graphql/recognition.graphql';

const delay = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

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
    createTicket({
      variables: {
        gymId,
        ext,
        contentType: 'image/jpeg',
        contentLength,
      },
    });
    
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
    let putStatus: number | undefined;
    let retried = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      const ticket = await createUploadTicket(gymId, 'jpg', blob.size);
      const t = ticket.data?.createRecognitionUploadTicket;
      if (!t) throw new Error('Failed to create upload ticket');

      const headers: Record<string, string> = {
        'Content-Type': 'image/jpeg',
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120_000);
      try {
        const putResp = await fetch(t.putUrl, {
          method: 'PUT',
          headers,
          body: blob,
          signal: controller.signal,
        });
        putStatus = putResp.status;
        const transient =
          putResp.status === 403 ||
          putResp.status === 408 ||
          putResp.status === 429 ||
          putResp.status >= 500;
        if (!putResp.ok) {
          if (transient && attempt === 0) {
            retried = true;
            await delay(500 + Math.random() * 1000);
            continue;
          }
          throw new Error(`Upload failed with status ${putResp.status}`);
        }
      } catch (e) {
        if (attempt === 0) {
          retried = true;
          await delay(500 + Math.random() * 1000);
          continue;
        }
        throw e;
      } finally {
        clearTimeout(timeoutId);
      }

      for (let rAttempt = 0; rAttempt < 2; rAttempt++) {
        try {
          const {data} = await recognize({
            variables: {ticketToken: t.ticketToken, limit},
            fetchPolicy: 'no-cache',
          });
          const result = data?.recognizeImage ?? null;
          if (!result) throw new Error('recognizeImage returned no data');
          console.log('recognition upload', {
            size: blob.size,
            putStatus,
            retried,
          });
          return {candidates: result, ticketToken: t.ticketToken};
        } catch (e) {
          if (rAttempt === 0) {
            retried = true;
            await delay(500 + Math.random() * 1000);
            continue;
          }
          throw e;
        }
      }
    }
    console.log('recognition upload failed', {
      size: blob.size,
      putStatus,
      retried,
    });
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