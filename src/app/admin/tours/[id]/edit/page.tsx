import { AdminTourForm } from "@/components/admin/AdminTourForm";
import type { Id } from "@convex/_generated/dataModel";

export default function EditTourPage({ params }: { params: { id: string } }) {
  const { id } = params;
  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Edit tour</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Update this tour’s itinerary, images, and pricing.
      </p>
      <div className="mt-8">
        <AdminTourForm mode="edit" tourId={id as Id<"tours">} />
      </div>
    </main>
  );
}
