import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { compressAndConvertToBase64, createThumbnail } from '@/services/compression';

interface PhotoCaptureProps {
  onCapture: (photoData: string, thumbnail: string) => void;
  onCancel: () => void;
}

export function PhotoCapture({ onCapture, onCancel }: PhotoCaptureProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not access camera. Please check permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsLoading(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.9);

    try {
      // Compress image
      const compressed = await compressAndConvertToBase64(
        await fetch(imageData).then(r => r.blob()),
        { maxSizeMB: 0.3, maxWidthOrHeight: 1920 }
      );

      // Create thumbnail
      await createThumbnail(compressed, 150);

      setCapturedImage(compressed);
      stopCamera();
    } catch (error) {
      console.error('Error processing photo:', error);
    } finally {
      setIsLoading(false);
    }
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (capturedImage) {
      createThumbnail(capturedImage, 150).then(thumbnail => {
        onCapture(capturedImage, thumbnail);
      });
    }
  }, [capturedImage, onCapture]);

  // Start camera on mount
  useState(() => {
    startCamera();
    return () => stopCamera();
  });

  return (
    <div className="flex flex-col h-full max-h-[80vh] md:max-h-[60vh]">
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {!capturedImage ? (
        <>
          {/* Camera Preview */}
          <div className="relative flex-1 bg-black rounded-lg overflow-hidden min-h-[300px] max-h-[500px]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
              </div>
            )}
          </div>

          {/* Camera Controls */}
          <div className="flex justify-center gap-4 mt-4 relative z-10">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onCancel}
              className="rounded-full h-14 w-14 bg-white/80 backdrop-blur-sm"
            >
              <X className="h-6 w-6" />
            </Button>

            <Button
              type="button"
              onClick={capturePhoto}
              disabled={isLoading || !stream}
              className="rounded-full h-16 w-16 bg-white border-4 border-teal-600 hover:bg-gray-100"
            >
              <div className="h-12 w-12 rounded-full bg-teal-600" />
            </Button>
          </div>

          {/* Guide Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[80%] aspect-[3/4] border-2 border-white/50 rounded-lg relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white/80 text-sm font-medium bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                  Frame the farm/shop
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Captured Photo Preview */}
          <div className="relative flex-1 bg-black rounded-lg overflow-hidden">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Preview Controls */}
          <div className="flex justify-center gap-4 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={retakePhoto}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-5 w-5" />
              {t('groupMeeting.retake')}
            </Button>

            <Button
              type="button"
              onClick={confirmPhoto}
              className="flex items-center gap-2"
            >
              <Check className="h-5 w-5" />
              {t('common.confirm')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
