import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Slider } from "../ui/slider";

const OUTPUT_SIZE = 512;

type AvatarCropDialogProps = {
  imageUrl: string | null;
  fileName: string;
  onCancel: () => void;
  onCropped: (file: File) => Promise<void> | void;
};

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Không thể đọc ảnh đã chọn."));
    image.src = source;
  });
}

function createAvatarFileName(fileName: string): string {
  const extensionIndex = fileName.lastIndexOf(".");
  const baseName = extensionIndex > 0 ? fileName.slice(0, extensionIndex) : fileName;
  return `${baseName || "avatar"}-cropped.jpg`;
}

async function createCroppedAvatar(
  imageUrl: string,
  croppedAreaPixels: Area,
  fileName: string,
): Promise<File> {
  const image = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Không thể tạo ảnh avatar đã crop.");

  context.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("Không thể xuất ảnh avatar đã crop."));
    }, "image/jpeg", 0.92);
  });

  return new File([blob], createAvatarFileName(fileName), { type: "image/jpeg" });
}

export function AvatarCropDialog({ imageUrl, fileName, onCancel, onCropped }: AvatarCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!imageUrl) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, [imageUrl]);

  const handleOpenChange = (open: boolean) => {
    if (!open && !processing) onCancel();
  };

  const handleConfirm = async () => {
    if (!imageUrl || !croppedAreaPixels) return;

    setProcessing(true);
    try {
      const croppedFile = await createCroppedAvatar(imageUrl, croppedAreaPixels, fileName);
      await onCropped(croppedFile);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xử lý ảnh avatar.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={Boolean(imageUrl)} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-0 text-slate-900 shadow-[0_28px_80px_rgba(15,23,42,0.24)] sm:max-w-xl [&>button]:right-5 [&>button]:top-5 [&>button]:rounded-lg [&>button]:p-1 [&>button]:text-slate-400 [&>button]:hover:bg-slate-100 [&>button]:hover:text-slate-700">
        <DialogHeader className="px-5 pb-0 pt-5 pr-12 text-left sm:px-6 sm:pt-6">
          <DialogTitle className="text-lg font-black tracking-[-0.02em] text-slate-950">Chọn ảnh đại diện</DialogTitle>
          <DialogDescription className="text-sm leading-6 text-slate-500">
            Kéo ảnh để chọn vùng hiển thị, sau đó dùng thanh trượt để phóng to hoặc thu nhỏ.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          <div className="relative h-[min(72vw,360px)] min-h-[280px] overflow-hidden rounded-2xl bg-slate-950">
            {imageUrl && (
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                zoomWithScroll
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                style={{
                  cropAreaStyle: {
                    border: "2px solid rgba(255,255,255,0.92)",
                    boxShadow: "0 0 0 9999px rgba(15,23,42,0.46)",
                  },
                }}
              />
            )}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <ZoomIn className="h-4 w-4 shrink-0 text-[#FF6B00]" aria-hidden="true" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.01}
              disabled={processing}
              onValueChange={(value) => setZoom(value[0] ?? 1)}
              aria-label="Phóng to ảnh đại diện"
              className="[&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-track]]:bg-orange-100 [&_[data-slot=slider-range]]:bg-[#FF6B00] [&_[data-slot=slider-thumb]]:border-[#FF6B00]"
            />
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={processing}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={processing || !croppedAreaPixels}
              className="rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(255,107,0,0.24)] transition hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? "Đang xử lý..." : "Dùng ảnh này"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
