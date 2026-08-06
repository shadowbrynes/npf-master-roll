/**
 * AI-Assisted High-Fidelity Canvas Blending Engine for NPF EOD CBRN Dashboard
 * Combines EOD-CBRN1 and EOD-CBRN2 with tactical gradient masks, contrast enhancement,
 * dark vignette overlays, and multi-resolution responsive outputs.
 */

export interface BlendOptions {
  width: number;
  height: number;
  quality?: number; // 0.8 - 0.95
  darknessOverlay?: number; // 0.4 - 0.85
  accentColor?: string; // default '#06b6d4'
}

export async function blendEodCbrnImages(
  img1Url: string,
  img2Url: string,
  options: BlendOptions
): Promise<Blob> {
  const { width, height, quality = 0.9, darknessOverlay = 0.75, accentColor = '#06b6d4' } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return reject(new Error('Canvas 2D Context initialization failed.'));
    }

    const image1 = new Image();
    const image2 = new Image();
    image1.crossOrigin = 'anonymous';
    image2.crossOrigin = 'anonymous';

    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount === 2) {
        try {
          renderComposite();
        } catch (err) {
          reject(err);
        }
      }
    };

    image1.onload = checkLoaded;
    image2.onload = checkLoaded;
    image1.onerror = () => reject(new Error('Failed to load EOD-CBRN1 base image.'));
    image2.onerror = () => reject(new Error('Failed to load EOD-CBRN2 secondary image.'));

    image1.src = img1Url;
    image2.src = img2Url;

    function renderComposite() {
      if (!ctx) return;

      // 1. Draw Base Layer (EOD-CBRN1)
      ctx.drawImage(image1, 0, 0, width, height);

      // 2. Multi-Stage Gradient Blend Layer (EOD-CBRN2)
      ctx.save();
      ctx.globalAlpha = 0.65;
      ctx.globalCompositeOperation = 'screen';
      ctx.drawImage(image2, 0, 0, width, height);
      ctx.restore();

      // 3. Tactical Color Balance & Contrast Overlay
      const tintGradient = ctx.createLinearGradient(0, 0, width, height);
      tintGradient.addColorStop(0, 'rgba(6, 182, 212, 0.25)'); // Cyan Accent
      tintGradient.addColorStop(0.5, 'rgba(15, 23, 42, 0.50)'); // Dark Slate
      tintGradient.addColorStop(1, 'rgba(16, 185, 129, 0.20)'); // Emerald Accent

      ctx.save();
      ctx.fillStyle = tintGradient;
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // 4. Dark Transparent Vignette & Legibility Overlay
      const darkOverlay = ctx.createLinearGradient(0, 0, 0, height);
      darkOverlay.addColorStop(0, `rgba(9, 13, 22, ${darknessOverlay})`);
      darkOverlay.addColorStop(0.5, `rgba(9, 13, 22, ${darknessOverlay * 0.85})`);
      darkOverlay.addColorStop(1, `rgba(9, 13, 22, ${darknessOverlay})`);

      ctx.fillStyle = darkOverlay;
      ctx.fillRect(0, 0, width, height);

      // 5. Convert Canvas to Blob (WebP / JPEG)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas image blob generation failed.'));
        },
        'image/jpeg',
        quality
      );
    }
  });
}
