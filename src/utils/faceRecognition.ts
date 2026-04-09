import * as faceapi from 'face-api.js';

let modelsLoaded = false;
let modelsLoading: Promise<void> | null = null;

const MODEL_URL = '/models';

export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return;
  
  if (modelsLoading) {
    return modelsLoading;
  }

  modelsLoading = (async () => {
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      modelsLoaded = true;
    } catch (error) {
      console.error('Error loading face models:', error);
      modelsLoading = null;
      throw error;
    }
  })();

  return modelsLoading;
}

export async function extractFaceDescriptors(imageUrl: string): Promise<number[][]> {
  await loadFaceModels();
  
  const img = await faceapi.fetchImage(imageUrl);
  const detections = await faceapi
    .detectAllFaces(img)
    .withFaceLandmarks()
    .withFaceDescriptors();
  
  return detections.map(d => Array.from(d.descriptor));
}

export function findMatchingFaces(
  selfieDescriptor: Float32Array,
  photoDescriptors: number[][],
  threshold = 0.6
): boolean {
  if (!photoDescriptors || photoDescriptors.length === 0) return false;
  
  return photoDescriptors.some(stored => {
    const storedFloat = new Float32Array(stored);
    const distance = faceapi.euclideanDistance(selfieDescriptor, storedFloat);
    return distance < threshold;
  });
}

export async function extractSingleFaceDescriptor(imageUrl: string): Promise<Float32Array | null> {
  await loadFaceModels();
  
  const img = await faceapi.fetchImage(imageUrl);
  const detection = await faceapi
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();
  
  return detection?.descriptor || null;
}

export function isModelsLoaded(): boolean {
  return modelsLoaded;
}
