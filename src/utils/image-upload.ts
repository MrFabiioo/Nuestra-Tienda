import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'node:crypto';

cloudinary.config({
  cloud_name: import.meta.env.CLOUDINARY_CLOUD_NAME,
  api_key: import.meta.env.CLOUDINARY_API_KEY,
  api_secret: import.meta.env.CLOUDINARY_API_SECRET,
});

type UploadOptions = {
  folder?: string;
  publicIdPrefix?: string;
  resourceType?: 'image' | 'raw' | 'auto';
  useDataUrlFallback?: boolean;
};

export type UploadedAsset = {
  secureUrl: string;
  publicId: string;
  mimeType: string;
  bytes: number;
  originalFilename: string;
  provider: 'cloudinary' | 'inline';
};

function hasCloudinaryCredentials() {
  return Boolean(
    import.meta.env.CLOUDINARY_CLOUD_NAME
    && import.meta.env.CLOUDINARY_API_KEY
    && import.meta.env.CLOUDINARY_API_SECRET,
  );
}

function buildDataUrl(file: File, buffer: Buffer) {
  return `data:${file.type};base64,${buffer.toString('base64')}`;
}

export class ImageUpload {
  static async upload(file: File, options?: UploadOptions) {
    const asset = await ImageUpload.uploadDetailed(file, options);
    return asset.secureUrl;
  }

  static async uploadDetailed(file: File, options: UploadOptions = {}): Promise<UploadedAsset> {
    const buffer = Buffer.from(await file.arrayBuffer());

    if (!hasCloudinaryCredentials()) {
      if (!options.useDataUrlFallback) {
        throw new Error('Cloudinary no está configurado y esta carga no admite fallback local.');
      }

      console.warn(`[ImageUpload] Cloudinary no configurado. Se usa fallback inline para ${file.name}.`);

      return {
        secureUrl: buildDataUrl(file, buffer),
        publicId: `${options.publicIdPrefix ?? 'inline'}-${randomUUID()}`,
        mimeType: file.type,
        bytes: file.size,
        originalFilename: file.name,
        provider: 'inline',
      };
    }

    const response = await cloudinary.uploader.upload(buildDataUrl(file, buffer), {
      folder: options.folder,
      public_id: options.publicIdPrefix ? `${options.publicIdPrefix}-${randomUUID()}` : undefined,
      resource_type: options.resourceType ?? (file.type === 'application/pdf' ? 'raw' : 'image'),
      use_filename: false,
      unique_filename: true,
      overwrite: false,
    });

    return {
      secureUrl: response.secure_url,
      publicId: response.public_id,
      mimeType: file.type,
      bytes: file.size,
      originalFilename: file.name,
      provider: 'cloudinary',
    };
  }

  static async delete(image: string) {
    try {
      if (!hasCloudinaryCredentials() || image.startsWith('data:')) {
        return true;
      }

      const imageName = image.split('/').pop() ?? '';
      const imgId = imageName.split('.')[0];
      await cloudinary.uploader.destroy(imgId);

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
