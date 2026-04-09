"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

interface ProviderFiltersProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: Record<string, string>) => void;
}

export default function ProviderFilters({ onSearch, onFilterChange }: ProviderFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search doctors by name or specialty..."
            className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </form>

      {/* Expandable filters panel */}
      {showFilters && (
        <div className="grid grid-cols-2 gap-4 rounded-lg border bg-gray-50 p-4 md:grid-cols-4">
          {/* TODO: Add specialty, city, rating, price range filters */}
          <select className="rounded-lg border bg-white px-3 py-2 text-sm" onChange={(e) => onFilterChange({ specialty: e.target.value })}>
            <option value="">All Specialties</option>
            <option value="cardiology">Cardiology</option>
            <option value="dermatology">Dermatology</option>
            <option value="dentistry">Dentistry</option>
          </select>
          <select className="rounded-lg border bg-white px-3 py-2 text-sm" onChange={(e) => onFilterChange({ city: e.target.value })}>
            <option value="">All Cities</option>
            <option value="cairo">Cairo</option>
            <option value="alexandria">Alexandria</option>
            <option value="giza">Giza</option>
          </select>
          <select className="rounded-lg border bg-white px-3 py-2 text-sm" onChange={(e) => onFilterChange({ sortBy: e.target.value })}>
            <option value="rating">Best Rated</option>
            <option value="price_asc">Lowest Price</option>
            <option value="price_desc">Highest Price</option>
            <option value="reviews">Most Reviews</option>
          </select>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
