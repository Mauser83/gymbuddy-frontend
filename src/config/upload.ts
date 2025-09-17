export const uploadConfig = {
  gymImage: {
    longSide: 1600,
    quality: 0.8,
  },
  recognitionImage: {
    longSide: 1280,
    quality: 0.8,
  },
};

export type UploadFlow = keyof typeof uploadConfig;
