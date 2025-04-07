// Test script for map features
import fetch from 'node-fetch';

async function testMapFeatures() {
  console.log('========== MAP FEATURES TESTING ==========');
  
  // Base URL for API requests
  const API_BASE = 'http://localhost:5000/api';
  
  try {
    // 1. Test Map Bookmarks API
    console.log('\n----- Test: Map Bookmarks -----');
    
    // 1.1 Create a bookmark
    const bookmarkData = {
      name: "Downtown Corvallis",
      zoom: 15,
      latitude: 44.5646,
      longitude: -123.2620,
      color: "#4caf50",
      icon: "building"
    };
    
    const createBookmarkResponse = await fetch(`${API_BASE}/map-bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookmarkData)
    });
    
    if (!createBookmarkResponse.ok) throw new Error(`Failed to create bookmark: ${createBookmarkResponse.status}`);
    const bookmark = await createBookmarkResponse.json();
    console.log('✓ Bookmark created successfully:', bookmark.id);
    
    // 1.2 Get all bookmarks
    const getBookmarksResponse = await fetch(`${API_BASE}/map-bookmarks`);
    
    if (!getBookmarksResponse.ok) throw new Error(`Failed to get bookmarks: ${getBookmarksResponse.status}`);
    const bookmarks = await getBookmarksResponse.json();
    console.log(`✓ Retrieved ${bookmarks.length} bookmarks successfully`);
    
    // 1.3 Update a bookmark
    const updateBookmarkData = {
      name: "Downtown Corvallis - Updated",
      color: "#2196f3"
    };
    
    const updateBookmarkResponse = await fetch(`${API_BASE}/map-bookmarks/${bookmark.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateBookmarkData)
    });
    
    if (!updateBookmarkResponse.ok) throw new Error(`Failed to update bookmark: ${updateBookmarkResponse.status}`);
    const updatedBookmark = await updateBookmarkResponse.json();
    console.log('✓ Bookmark updated successfully with new name:', updatedBookmark.name);
    
    // 2. Test Map Preferences API
    console.log('\n----- Test: Map Preferences -----');
    
    // 2.1 Get user preferences
    const getPreferencesResponse = await fetch(`${API_BASE}/map-preferences`);
    
    if (!getPreferencesResponse.ok && getPreferencesResponse.status !== 404) {
      throw new Error(`Failed to get preferences: ${getPreferencesResponse.status}`);
    }
    
    // 2.2 Create or update preferences
    const preferencesData = {
      defaultCenter: { lat: 44.5634, lng: -123.2582 },
      defaultZoom: 14,
      theme: "satellite",
      layerVisibility: {
        parcels: true,
        buildings: true,
        labels: true,
        terrain: false
      },
      measurement: {
        enabled: true,
        unit: "imperial"
      },
      animation: true,
      showGrid: false,
      showCompass: true,
      showScale: true,
      showLabels: true
    };
    
    const updatePreferencesResponse = await fetch(`${API_BASE}/map-preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferencesData)
    });
    
    if (!updatePreferencesResponse.ok) throw new Error(`Failed to update preferences: ${updatePreferencesResponse.status}`);
    const preferences = await updatePreferencesResponse.json();
    console.log('✓ Map preferences saved successfully');
    
    // 3. Test Recently Viewed Parcels API
    console.log('\n----- Test: Recently Viewed Parcels -----');
    
    // 3.1 Record a parcel view
    const viewParcelData = {
      parcelId: "09404AA901200",
      address: "123 Main St, Corvallis, OR 97333",
      location: { lat: 44.5634, lng: -123.2582 },
      metadata: {
        owner: "Test Owner",
        acreage: 1.5,
        zoning: "residential"
      }
    };
    
    const viewParcelResponse = await fetch(`${API_BASE}/recently-viewed-parcels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(viewParcelData)
    });
    
    if (!viewParcelResponse.ok) throw new Error(`Failed to record parcel view: ${viewParcelResponse.status}`);
    const parcelView = await viewParcelResponse.json();
    console.log('✓ Parcel view recorded successfully');
    
    // 3.2 Get recently viewed parcels
    const getRecentParcelsResponse = await fetch(`${API_BASE}/recently-viewed-parcels`);
    
    if (!getRecentParcelsResponse.ok) throw new Error(`Failed to get recent parcels: ${getRecentParcelsResponse.status}`);
    const recentParcels = await getRecentParcelsResponse.json();
    console.log(`✓ Retrieved ${recentParcels.length} recently viewed parcels`);
    
    // 4. Test Parcel Comparison
    console.log('\n----- Test: Parcel Comparison -----');
    
    // 4.1 Compare two parcels
    const compareData = {
      parcel1: "09404AA901200",
      parcel2: "09404AA901300",
      comparisonType: "full"
    };
    
    const compareResponse = await fetch(`${API_BASE}/parcel-comparison`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(compareData)
    });
    
    if (!compareResponse.ok && compareResponse.status !== 404) {
      throw new Error(`Failed to compare parcels: ${compareResponse.status}`);
    }
    
    if (compareResponse.ok) {
      const comparison = await compareResponse.json();
      console.log('✓ Parcel comparison completed successfully');
    } else {
      console.log('ℹ️ Parcel comparison endpoint not implemented or returned 404');
    }
    
    console.log('\n✅ Map features tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testMapFeatures();