"use client";

import { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  BoldIcon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  Redo2Icon,
  Undo2Icon,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { formatMessage } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { stripHtml } from "@/lib/content/text";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MediaPickerDialog } from "@/components/admin/media/media-picker-dialog";

export function RichTextEditor({
  locale,
  initialHtml,
  dict,
  onChange,
}: {
  locale: Locale;
  initialHtml: string;
  dict: Dictionary;
  onChange: (html: string, text: string) => void;
}) {
  const t = dict.admin.posts.form;
  const [html, setHtml] = useState(initialHtml);
  const [json, setJson] = useState("{}");
  const [pickerOpen, setPickerOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      ImageExtension.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: t.editorPlaceholder }),
      CharacterCount,
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class:
          "prose-editor min-h-[280px] px-4 py-3 text-sm leading-relaxed outline-none focus-visible:outline-none",
      },
    },
    onUpdate: ({ editor: instance }) => {
      const nextHtml = instance.getHTML();
      setHtml(nextHtml);
      setJson(JSON.stringify(instance.getJSON()));
      onChange(nextHtml, stripHtml(nextHtml));
    },
  });

  function setLink() {
    if (!editor) return;
    const url = window.prompt(t.linkPrompt, "https://");
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  const characters = editor?.storage.characterCount.characters() ?? 0;

  return (
    <div className="rounded-lg border border-input bg-card shadow-elevated-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
      <input type="hidden" name={`contentHtml_${locale}`} value={html} />
      <input type="hidden" name={`contentJson_${locale}`} value={json} />

      <div className="flex flex-wrap items-center gap-0.5 border-b border-border p-1.5">
        <ToolbarButton
          label={t.bold}
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <BoldIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={t.italic}
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <ItalicIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={t.heading2}
          active={editor?.isActive("heading", { level: 2 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2Icon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={t.heading3}
          active={editor?.isActive("heading", { level: 3 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3Icon className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolbarButton
          label={t.bulletList}
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <ListIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={t.orderedList}
          active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrderedIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={t.quote}
          active={editor?.isActive("blockquote")}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <QuoteIcon className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolbarButton label={t.link} active={editor?.isActive("link")} onClick={setLink}>
          <LinkIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton label={t.image} onClick={() => setPickerOpen(true)}>
          <ImageIcon className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolbarButton label={t.undo} onClick={() => editor?.chain().focus().undo().run()}>
          <Undo2Icon className="size-4" />
        </ToolbarButton>
        <ToolbarButton label={t.redo} onClick={() => editor?.chain().focus().redo().run()}>
          <Redo2Icon className="size-4" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />

      <div className="flex justify-end border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
        {formatMessage(t.characters, { count: characters })}
      </div>

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        dict={dict}
        accept="image"
        onSelect={(item) => {
          editor?.chain().focus().setImage({ src: item.fullUrl, alt: item.alt || item.filename }).run();
        }}
      />
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(active && "bg-accent text-accent-foreground")}
    >
      {children}
    </Button>
  );
}
