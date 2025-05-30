import React, { useState } from 'react';
import { BookmarkManager } from '../components/maps/bookmark-manager';
import { MapPreferencesPanel } from '../components/maps/map-preferences-panel';
import { RecentlyViewedParcels } from '../components/maps/recently-viewed-parcels';

export function MapSettingsPage() {
  const [currentPosition, setCurrentPosition] = useState({
    latitude: 44.5645,
    longitude: -123.2620,
    zoom: 12,
  });

  const handleBookmarkClick = (bookmark: any) => {
    setCurrentPosition({
      latitude: bookmark.latitude,
      longitude: bookmark.longitude,
      zoom: bookmark.zoom,
    });
    console.log('Clicked bookmark:', bookmark);
  };

  const handleParcelClick = (parcelId: number) => {
    console.log('Clicked parcel:', parcelId);
  };

  const handlePreferencesUpdate = (preferences: any) => {
    console.log('Updated preferences:', preferences);
  };

  return (
    <div className="min-h-screen bg-[url('/background-pattern.svg')] bg-cover bg-center bg-fixed flex flex-col">
      <header className="py-6 px-4 sm:px-6 bg-background/90 backdrop-blur-md border-b shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Map Settings</h1>
        <p className="text-muted-foreground">Manage your map preferences and bookmarks</p>
      </header>

      <main className="flex-1 p-4 sm:p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Map Preferences</h2>
          <MapPreferencesPanel 
            currentPosition={currentPosition}
            onPreferencesUpdate={handlePreferencesUpdate}
          />
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Map Bookmarks</h2>
          <BookmarkManager 
            currentPosition={currentPosition}
            onBookmarkClick={handleBookmarkClick}
          />
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Recently Viewed Parcels</h2>
          <RecentlyViewedParcels 
            onParcelClick={handleParcelClick}
            limit={10}
          />
        </div>
      </main>
    </div>
  );
}