export interface DriverPackage {
  id: string;
  name: string;
  filename: string;
  architecture: string;
  description: string;
  recommendedFor: string;
  isPrimary: boolean;
  fileSize: number;
  sha256: string;
  downloadUrl: string;
  features: string[];
}

export interface PackagesResponse {
  packages: DriverPackage[];
  releaseDate: string;
  driverVersion: string;
  upstreamSource: string;
}

export interface ConversionResult {
  success: boolean;
  originalSize: number;
  hbplSize: number;
  compressionRatio: string;
  pjlHeaderSnippet: string;
  hexPreview: string;
  hbplBase64: string;
}

export interface SourceFileResponse {
  path: string;
  filename: string;
  size: number;
  content: string;
}
