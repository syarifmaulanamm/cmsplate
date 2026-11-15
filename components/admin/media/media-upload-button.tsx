"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import type { Dictionary } from "@/lib/i18n";
import { formatMessage } from "@/lib/i18n/format";
import { Button } from "@/components/ui/button";

export function MediaUploadButton({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const t = dict.admin.media;

  async function upload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const formData = new FormData();
    for (const file of Array.from(fileList)) {
      formData.append("files", file);
    }

    setPending(true);
    try {
      const response = await fetch("/api/media/upload", { method: "POST", body: formData });
      const data = (await response.json()) as {
        ok: boolean;
        uploaded?: Array<{ id: string }>;
        errors?: Array<{ code: string }>;
      };

      if (data.uploaded && data.uploaded.length > 0) {
        toast.success(formatMessage(t.toast.uploaded, { count: data.uploaded.length }));
        router.refresh();
      }

      if (data.errors && data.errors.length > 0) {
        const code = data.errors[0]?.code;
        const message =
          code === "TOO_LARGE"
            ? t.toast.tooLarge
            : code === "WRONG_TYPE"
              ? t.toast.wrongType
              : dict.common.unknownError;
        toast.error(message);
      }
    } catch {
      toast.error(dict.common.unknownError);
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml,application/pdf"
        className="sr-only"
        onChange={(event) => void upload(event.target.files)}
      />
      <Button onClick={() => inputRef.current?.click()} disabled={pending}>
        {pending ? (
          <>
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
            {t.uploading}
          </>
        ) : (
          <>
            <UploadIcon className="size-4" aria-hidden />
            {t.upload}
          </>
        )}
      </Button>
    </>
  );
}
