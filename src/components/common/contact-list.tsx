"use client";

import { Mail, Phone } from "lucide-react";
import { ContactDetailRow } from "@/components/clients/contact-detail-row";

interface ContactItem {
  id: string;
  name: string;
  type: "EMAIL" | "PHONE";
  value: string;
}

export function ContactList({ contacts }: { contacts: ContactItem[] }) {
  if (contacts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No contacts added yet.</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="flex items-center gap-3 rounded-lg border border-border bg-accent/50 px-4 py-2.5"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            {contact.type === "EMAIL" ? (
              <Mail className="h-4 w-4 text-primary" />
            ) : (
              <Phone className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{contact.name}</p>
            <ContactDetailRow
              value={contact.value}
              icon={contact.type === "EMAIL" ? "mail" : "phone"}
              href={contact.type === "EMAIL" ? `mailto:${contact.value}` : `tel:${contact.value}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
