import { ResourceNotFound } from "@/components/ui/resource-not-found";

export const metadata = {
  title: "Page Not Found",
  description: "The requested page doesn't exist inside Eden Academy.",
};

export default function RootNotFoundPage() {
  return (
    <ResourceNotFound mode="404" />
  );
}
