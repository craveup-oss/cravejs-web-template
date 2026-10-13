"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/** Route presentation only: product and cart pages retain their canonical owners. */
export function StorefrontDialog({ children, title, kind }: { children: ReactNode; title: string; kind: "product" | "cart" }) {
  const router = useRouter();
  return <Dialog.Root defaultOpen onOpenChange={(open) => { if (!open) router.back(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="storefront-dialog-backdrop" />
      <Dialog.Content className="storefront-dialog" data-kind={kind} aria-describedby={undefined}>
        <Dialog.Title className="sr-only">{title}</Dialog.Title>
        <Dialog.Close className="storefront-dialog-close" aria-label="Close"><X aria-hidden="true" /></Dialog.Close>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
