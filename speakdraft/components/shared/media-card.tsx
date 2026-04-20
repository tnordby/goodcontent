import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { formatDistanceToNow } from "date-fns";
import { Copy, DownloadIcon, Link2Icon } from "lucide-react";

interface MediaCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "image" | "video";
  data: {
    url: string;
    prompt: string;
    model: string;
    aspectRatio: string;
    createdAt: number;
    user?: {
      name: string;
      imageUrl?: string;
    };
  } | null;
}

export function MediaCard({ open, onOpenChange, type, data }: MediaCardProps) {
  if (!data) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(data.prompt);
    toast.success("Prompt copied to clipboard");
  };

  const handleDownload = async () => {
    try {
      // 1. Fetch the image as a blob
      const res = await fetch(data.url, { mode: "cors" });
      const blob = await res.blob();

      // 2. Build filename: generated-image-<timestamp>
      const fileName = `generated-${type}-${Date.now()}`;

      // 3. Create an object URL for the blob
      const objectUrl = URL.createObjectURL(blob);

      // 4. Create an <a> tag to trigger the download
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      // 5. Clean up the object URL to free memory
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);

      toast.success(
        `${type === "image" ? "Image" : "Video"} downloaded successfully`
      );
    } catch (error) {
      toast.error(`Failed to download ${type}`);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(data.url);
    toast.success("Link copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95px] w-[95vw] p-0 gap-0 bg-card border-none overflow-hidden rounded-2xl sm:max-w-4xl">
        <DialogTitle className="sr-only">
          {type === "image" ? "Image" : "Video"} Details
        </DialogTitle>
        <DialogDescription className="sr-only">
          Details of the selected {type}
        </DialogDescription>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] h-[85vh] md:h-[600px]">
          {/* Left side */}
          <div className="bg-muted/30 flex items-center justify-center overflow-hidden">
            {type === "image" ? (
              <div className="relative w-full h-full">
                <Image
                  src={data.url}
                  alt={data.prompt}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center group">
                <video
                  src={data.url}
                  className="max-w-full max-h-full object-contain"
                  autoPlay
                  loop
                  muted
                  controls
                  playsInline
                />
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex flex-col p-6 bg-muted/50 text-foreground h-full overflow-y-auto border-l border-none">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage src={data.user?.imageUrl} />
                  <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                    {data.user?.name[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-semibold">
                    {data.user?.name || "Anonymous"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(data.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Prompt section */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Prompt
                </span>
                <button
                  className="text-muted-foreground hover:text-accent-foreground cursor-pointer"
                  onClick={handleCopyPrompt}
                >
                  <Copy className="size-3" />
                </button>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {data.prompt}
              </p>
            </div>

            {/* Metadata section */}
            <div className="space-y-3 pt-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-3 px-4 rounded-md font-medium text-xs text-foreground bg-accent/80">
                  <span>Model</span>
                  <span>{data.model}</span>
                </div>
                <div className="flex items-center justify-between p-3 px-4 rounded-md font-medium text-xs text-foreground bg-accent/80">
                  <span>Aspect Ratio</span>
                  <span>{data.aspectRatio}</span>
                </div>
              </div>
            </div>

            {/* Action section */}
            <div className="mt-auto space-y-6">
              <button
                className="flex items-center gap-3 text-xs font-bold text-muted-foreground hover:text-accent-foreground cursor-pointer transition-colors w-full"
                onClick={handleCopyLink}
              >
                <Link2Icon className="size-4" />
                <span>Copy Link</span>
              </button>
              <button
                className="flex items-center gap-3 text-xs font-bold text-muted-foreground hover:text-accent-foreground cursor-pointer transition-colors w-full"
                onClick={handleDownload}
              >
                <DownloadIcon className="size-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
