interface BarcodeDetector {
  detect(image: ImageBitmapSource | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Promise<DetectedBarcode[]>;
}

interface DetectedBarcode {
  rawValue: string;
  format: string;
  boundingBox: DOMRectReadOnly;
  cornerPoints: ReadonlyArray<{ x: number; y: number }>;
}

declare var BarcodeDetector: {
  prototype: BarcodeDetector;
  new(options?: { formats: string[] }): BarcodeDetector;
  getSupportedFormats(): Promise<string[]>;
};
