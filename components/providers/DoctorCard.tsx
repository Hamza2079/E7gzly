import { Star } from "lucide-react";
import Link from "next/link";
import type { Provider } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";

interface DoctorCardProps {
  provider: Provider;
}

export default function DoctorCard({ provider }: DoctorCardProps) {
  return (
    <Link
      href={`/doctors/${provider.id}`}
      className="group block overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md"
    >
      {/* Avatar placeholder */}
      <div className="flex h-48 items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-200 text-2xl font-bold text-blue-700">
          {provider.user?.fullName?.charAt(0) || "D"}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {provider.user?.fullName || "Doctor Name"}
        </h3>
        <p className="mt-1 text-sm text-gray-500">{provider.specialtyName || "Specialty"}</p>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium text-gray-700">{provider.ratingAvg.toFixed(1)}</span>
          <span className="text-sm text-gray-400">({provider.totalReviews})</span>
        </div>

        {/* Fee */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-blue-600">
            {formatCurrency(provider.consultationFee)}
          </span>
          <span className="text-xs text-gray-400">{provider.city}</span>
        </div>
      </div>
    </Link>
  );
}
