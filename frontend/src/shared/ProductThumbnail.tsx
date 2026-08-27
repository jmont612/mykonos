// src/shared/ProductThumbnail.tsx
import type { ProductImage } from '../api/types';
import { imageUrl } from './imageUrl';

export function ProductThumbnail({ images, alt }: { images?: ProductImage[]; alt: string }) {
  const primary = images?.find((image) => image.isPrimary) ?? images?.[0];
  if (!primary) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-surface-2 text-sm text-muted">
        Sin foto
      </div>
    );
  }
  return <img src={imageUrl(primary.url)} alt={alt} className="aspect-[4/3] w-full object-cover" />;
}
