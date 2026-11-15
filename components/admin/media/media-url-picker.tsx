"use client";

import { useState } from "react";
import { LinkIcon } from "lucide-react";
import { toast } from "sonner";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { MediaPickerDialog } from "@/components/admin/media/media-picker-dialog";

export function MediaUrlPicker({ dict }: { dict: Dictionary }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="soft" onClick={() => setOpen(true)}>
        <LinkIcon className="size-4" aria-hidden />
        {dict.admin.media.picker.tabBrowse}
      </Button>
      <MediaPickerDialog
        open={open}
        onOpenChange={setOpen}
        dict={dict}
        onSelect={(item) => {
          void navigator.clipboard
            .writeText(`${window.location.origin}${item.fullUrl}`)
            .then(() => toast.success(dict.common.copied));
        }}
      />
    </>
  );
}
