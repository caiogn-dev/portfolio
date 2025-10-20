// src/components/SiteModal.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type SiteModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  url?: string;
};

export default function SiteModal({ open, onOpenChange, title, url }: SiteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1200px] h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-4 py-3">
          <DialogTitle className="text-base">{title ?? "Visualização do site"}</DialogTitle>
        </DialogHeader>
        {/* Container para o iframe ocupar todo o espaço */}
        <div className="w-full h-[calc(85vh-56px)]">
          {url ? (
            <iframe
              src={url}
              title={title ?? "Site"}
              className="w-full h-full border-0"
              allow="fullscreen; geolocation; microphone; camera; clipboard-read; clipboard-write; autoplay"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              // Se quiser reforçar segurança:
              // sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-sm opacity-70">
              URL não definida para este projeto.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
