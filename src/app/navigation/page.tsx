"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowLeftCircle,
  ArrowRight,
  ArrowRightCircle,
  ArrowUp,
  Building,
  Clock,
  Flag,
  Loader2,
  Locate,
  MapPin,
  Navigation,
  Route,
  Search,
  WifiOff,
  X,
} from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Source,
} from "react-map-gl/maplibre";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import ServiceWorkerSetup from "@/components/ServiceWorkerSetup";
import ClientProviders from "@/components/ClientProviders";
import { UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";

interface LocationSuggestion {
  id: string;
  display_name: string;
  name: string;
  type: string;
  coordinates: [number, number];
  category: string;
}

interface RouteSegment {
  startIndex: number;
  endIndex: number;
  coordinates: [number, number][];
  distance: number;
  instruction?: string;
  maneuver?:
    | "turn-left"
    | "turn-right"
    | "continue"
    | "depart"
    | "arrive"
    | "turn-sharp-left"
    | "turn-sharp-right"
    | "turn-slight-left"
    | "turn-slight-right";
  bearing?: number;
}

interface NavigationStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver?: string;
}

const NavigationPage: React.FC = () => {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [startSuggestions, setStartSuggestions] = useState<
    LocationSuggestion[]
  >([]);
  const [endSuggestions, setEndSuggestions] = useState<LocationSuggestion[]>(
    []
  );
  const [showStartDropdown, setShowStartDropdown] = useState(false);
  const [showEndDropdown, setShowEndDropdown] = useState(false);
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchingStart, setSearchingStart] = useState(false);
  const [searchingEnd, setSearchingEnd] = useState(false);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(true);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    steps?: NavigationStep[];
  } | null>(null);
  const [recentSearches, setRecentSearches] = useState<LocationSuggestion[]>(
    []
  );
  const [isOffline, setIsOffline] = useState(false);
  const [offlineLocations, setOfflineLocations] = useState<
    LocationSuggestion[]
  >([]);
  const [mapLoadError, setMapLoadError] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [distanceToNextManeuver, setDistanceToNextManeuver] = useState(0);
  const [navigationPosition, setNavigationPosition] = useState<
    [number, number] | null
  >(null);
  const [navigationIntervalId, setNavigationIntervalId] =
    useState<NodeJS.Timeout | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [locationAvailable, setLocationAvailable] = useState(false);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [isFlying, setIsFlying] = useState(false);

  const mapRef = useRef<any>(null);
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const speechSynth = useRef<SpeechSynthesis | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);

  const { isSignedIn } = useAuth();
  const [subStatus, setSubStatus] = useState<null | boolean>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      speechSynth.current = window.speechSynthesis;
    }
  }, []);

  const MAPTILER_API_KEY =
    process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "your-maptiler-key";
  const MAP_STYLE = `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_API_KEY}`;

  // Offline cache keys
  const OFFLINE_CACHE_KEYS = {
    LOCATIONS: "offline-locations",
    ROUTES: "offline-routes",
  };

  // Navigation utilities
  const calculateDistance = useCallback(
    (a: [number, number], b: [number, number]): number => {
      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const R = 6371000; // meters
      const dLat = toRad(b[1] - a[1]);
      const dLon = toRad(b[0] - a[0]);
      const lat1 = toRad(a[1]);
      const lat2 = toRad(b[1]);
      const x = dLon * Math.cos((lat1 + lat2) / 2);
      const y = dLat;
      return Math.sqrt(x * x + y * y) * R;
    },
    []
  );

  const calculateBearing = useCallback(
    (a: [number, number], b: [number, number]): number => {
      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const toDeg = (rad: number) => (rad * 180) / Math.PI;
      const lat1 = toRad(a[1]);
      const lat2 = toRad(b[1]);
      const dLon = toRad(b[0] - a[0]);
      const y = Math.sin(dLon) * Math.cos(lat2);
      const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
      return (toDeg(Math.atan2(y, x)) + 360) % 360;
    },
    []
  );

  const bearingToCardinal = useCallback((bearing: number): string => {
    const directions = [
      "north",
      "northeast",
      "east",
      "southeast",
      "south",
      "southwest",
      "west",
      "northwest",
    ];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  }, []);

  const formatDistance = useCallback((meters: number): string => {
    if (meters > 1000) {
      return (meters / 1000).toFixed(1) + " km";
    }
    return Math.round(meters) + " meters";
  }, []);

  const splitRouteIntoSegments = useCallback(
    (
      coordinates: [number, number][],
      maxSegmentLength: number = 200
    ): RouteSegment[] => {
      if (coordinates.length < 2) return [];

      const segments: RouteSegment[] = [];
      let currentSegment: RouteSegment = {
        startIndex: 0,
        endIndex: 1,
        coordinates: [coordinates[0], coordinates[1]],
        distance: calculateDistance(coordinates[0], coordinates[1]),
        bearing: calculateBearing(coordinates[0], coordinates[1]),
      };

      for (let i = 2; i < coordinates.length; i++) {
        const prevPoint = coordinates[i - 1];
        const currentPoint = coordinates[i];
        const segmentDistance = calculateDistance(prevPoint, currentPoint);
        const currentBearing = calculateBearing(prevPoint, currentPoint);

        // Create new segment if bearing changes significantly or distance is too long
        if (
          Math.abs(currentBearing - (currentSegment.bearing || 0)) > 25 ||
          currentSegment.distance + segmentDistance > maxSegmentLength
        ) {
          segments.push({ ...currentSegment });
          currentSegment = {
            startIndex: i - 1,
            endIndex: i,
            coordinates: [prevPoint, currentPoint],
            distance: segmentDistance,
            bearing: currentBearing,
          };
        } else {
          currentSegment.coordinates.push(currentPoint);
          currentSegment.distance += segmentDistance;
          currentSegment.endIndex = i;
        }
      }
      segments.push(currentSegment);
      return segments;
    },
    [calculateDistance, calculateBearing]
  );

  const generateNavigationInstructions = useCallback(
    (segments: RouteSegment[]): RouteSegment[] => {
      return segments.map((segment, index) => {
        if (index === 0) {
          return {
            ...segment,
            instruction: `Head ${bearingToCardinal(
              segment.bearing!
            )} for ${formatDistance(segment.distance)}`,
            maneuver: "depart",
          };
        } else if (index === segments.length - 1) {
          return {
            ...segment,
            instruction: "You have arrived at your destination",
            maneuver: "arrive",
          };
        } else {
          const prevSegment = segments[index - 1];
          let turnAngle = (segment.bearing || 0) - (prevSegment.bearing || 0);

          // Normalize angle to [-180, 180]
          while (turnAngle > 180) turnAngle -= 360;
          while (turnAngle < -180) turnAngle += 360;

          let maneuver: RouteSegment["maneuver"] = "continue";
          let instruction = "Continue straight";

          if (Math.abs(turnAngle) > 15) {
            if (turnAngle > 45 && turnAngle <= 135) {
              maneuver = "turn-right";
              instruction = `Turn right and continue for ${formatDistance(
                segment.distance
              )}`;
            } else if (turnAngle >= -135 && turnAngle < -45) {
              maneuver = "turn-left";
              instruction = `Turn left and continue for ${formatDistance(
                segment.distance
              )}`;
            } else if (turnAngle > 135) {
              maneuver = "turn-sharp-right";
              instruction = `Take a sharp right and continue for ${formatDistance(
                segment.distance
              )}`;
            } else if (turnAngle < -135) {
              maneuver = "turn-sharp-left";
              instruction = `Take a sharp left and continue for ${formatDistance(
                segment.distance
              )}`;
            } else if (turnAngle > 15 && turnAngle <= 45) {
              maneuver = "turn-slight-right";
              instruction = `Take a slight right and continue for ${formatDistance(
                segment.distance
              )}`;
            } else if (turnAngle >= -45 && turnAngle < -15) {
              maneuver = "turn-slight-left";
              instruction = `Take a slight left and continue for ${formatDistance(
                segment.distance
              )}`;
            }
          } else {
            instruction = `Continue straight for ${formatDistance(
              segment.distance
            )}`;
          }

          return {
            ...segment,
            instruction,
            maneuver,
          };
        }
      });
    },
    [bearingToCardinal, formatDistance]
  );

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load cached data
    const savedSearches = localStorage.getItem("recentSearches");
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }

    const savedLocations = localStorage.getItem(OFFLINE_CACHE_KEYS.LOCATIONS);
    if (savedLocations) {
      setOfflineLocations(JSON.parse(savedLocations));
    }

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([longitude, latitude]);
        },
        (error) => console.error("Geolocation error:", error)
      );
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [OFFLINE_CACHE_KEYS.LOCATIONS]);

  // Search locations function
  const searchLocations = useCallback(
    async (query: string): Promise<LocationSuggestion[]> => {
      if (!query || query.length < 2) return [];

      // Use offline cache when offline
      if (isOffline) {
        return offlineLocations
          .filter(
            (loc) =>
              loc.display_name.toLowerCase().includes(query.toLowerCase()) ||
              loc.name.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 8);
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
            `format=json&q=${encodeURIComponent(query)}&` +
            `limit=8&addressdetails=1&extratags=1&namedetails=1`
        );

        const data = await response.json();

        return data.map((item: any) => {
          const getCategory = (item: any) => {
            if (
              item.type === "city" ||
              item.type === "town" ||
              item.type === "village"
            )
              return "City";
            if (item.type === "country") return "Country";
            if (item.type === "state" || item.type === "province")
              return "State";
            if (item.class === "amenity") return "Amenity";
            if (item.class === "tourism") return "Tourism";
            if (item.class === "shop") return "Shop";
            if (item.class === "highway") return "Street";
            if (item.class === "building") return "Building";
            return "Place";
          };

          return {
            id: uuidv4(),
            display_name: item.display_name,
            name: item.name || item.display_name.split(",")[0],
            type: item.type,
            coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
            category: getCategory(item),
          };
        });
      } catch (error) {
        console.error("Search error:", error);
        return [];
      }
    },
    [isOffline, offlineLocations]
  );

  // Save to recent searches
  const saveToRecentSearches = useCallback(
    (location: LocationSuggestion) => {
      setRecentSearches((prevRecent) => {
        const updated = [
          location,
          ...prevRecent.filter((item) => item.id !== location.id),
        ].slice(0, 5);
        localStorage.setItem("recentSearches", JSON.stringify(updated));
        return updated;
      });

      setOfflineLocations((prevOffline) => {
        const locationExists = prevOffline.some(
          (loc) => loc.id === location.id
        );
        if (!locationExists) {
          const updatedOffline = [location, ...prevOffline].slice(0, 100);
          localStorage.setItem(
            OFFLINE_CACHE_KEYS.LOCATIONS,
            JSON.stringify(updatedOffline)
          );
          return updatedOffline;
        }
        return prevOffline;
      });
    },
    [OFFLINE_CACHE_KEYS.LOCATIONS]
  );

  // Search handlers
  const handleStartSearch = useCallback(
    (value: string) => {
      setStart(value);
      setShowStartDropdown(true);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (value.length >= 2) {
        setSearchingStart(true);
        searchTimeoutRef.current = setTimeout(async () => {
          const suggestions = await searchLocations(value);
          setStartSuggestions(suggestions);
          setSearchingStart(false);
        }, 300);
      } else {
        setStartSuggestions([]);
        setSearchingStart(false);
      }
    },
    [searchLocations]
  );

  const handleEndSearch = useCallback(
    (value: string) => {
      setEnd(value);
      setShowEndDropdown(true);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (value.length >= 2) {
        setSearchingEnd(true);
        searchTimeoutRef.current = setTimeout(async () => {
          const suggestions = await searchLocations(value);
          setEndSuggestions(suggestions);
          setSearchingEnd(false);
        }, 300);
      } else {
        setEndSuggestions([]);
        setSearchingEnd(false);
      }
    },
    [searchLocations]
  );

  const selectStartLocation = useCallback(
    (suggestion: LocationSuggestion) => {
      setStart(suggestion.name);
      setShowStartDropdown(false);
      setStartSuggestions([]);
      saveToRecentSearches(suggestion);
    },
    [saveToRecentSearches]
  );

  const selectEndLocation = useCallback(
    (suggestion: LocationSuggestion) => {
      setEnd(suggestion.name);
      setShowEndDropdown(false);
      setEndSuggestions([]);
      saveToRecentSearches(suggestion);
    },
    [saveToRecentSearches]
  );

  const getLocationCoordinates = useCallback(
    async (locationName: string): Promise<[number, number] | null> => {
      const cachedLocation = offlineLocations.find(
        (loc) => loc.name.toLowerCase() === locationName.toLowerCase()
      );

      if (cachedLocation) {
        return cachedLocation.coordinates;
      }

      const suggestions = await searchLocations(locationName);
      return suggestions.length > 0 ? suggestions[0].coordinates : null;
    },
    [offlineLocations, searchLocations]
  );

  // Route calculation
  const calculateRoute = async () => {
    if (!start || !end) {
      setError("Please enter both locations");
      return;
    }

    setLoading(true);
    setError("");
    setRoute(null);
    setRouteInfo(null);
    setIsNavigating(false);

    // Check offline route cache first
    if (isOffline) {
      const cachedRouteString = localStorage.getItem(`route-${start}-${end}`);
      if (cachedRouteString) {
        const cachedRoute = JSON.parse(cachedRouteString);
        setRoute(cachedRoute.geojson);
        setRouteInfo({ ...cachedRoute.info, steps: cachedRoute.steps });
        setIsSearchPanelOpen(false);
        setLoading(false);
        return;
      } else {
        setError("Route not available offline");
        setLoading(false);
        return;
      }
    }

    try {
      const startCoords = await getLocationCoordinates(start);
      const endCoords = await getLocationCoordinates(end);

      if (!startCoords || !endCoords) {
        setError("Could not find one or both locations");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/` +
          `${startCoords[0]},${startCoords[1]};` +
          `${endCoords[0]},${endCoords[1]}?` +
          `overview=full&geometries=geojson&steps=true`
      );

      const data = await response.json();

      if (data.routes?.length > 0) {
        const routeData = {
          type: "Feature",
          properties: {},
          geometry: data.routes[0].geometry,
        };

        setRoute(routeData);

        const distance = (data.routes[0].distance / 1000).toFixed(1);
        const duration = Math.round(data.routes[0].duration / 60);

        // Generate navigation steps from segments
        const coords = routeData.geometry.coordinates;
        const segs = splitRouteIntoSegments(coords);
        const segsWithInstructions = generateNavigationInstructions(segs);
        setSegments(segsWithInstructions);

        const steps: NavigationStep[] = segsWithInstructions.map((seg) => ({
          instruction: seg.instruction || "Continue",
          distance: seg.distance,
          duration: Math.round(seg.distance / 15), // Assuming 15 m/s average speed
          maneuver: seg.maneuver,
        }));

        const routeInfoData = {
          distance: `${distance} km`,
          duration: `${duration} min`,
          steps,
        };

        setRouteInfo(routeInfoData);

        // Cache for offline use
        const routeToCache = {
          start,
          end,
          geojson: routeData,
          info: { distance: `${distance} km`, duration: `${duration} min` },
          steps,
        };

        localStorage.setItem(
          `route-${start}-${end}`,
          JSON.stringify(routeToCache)
        );

        if (mapRef.current && routeData) {
          setIsFlying(true);
          // Always fly to start and end at zoom 14 for context
          mapRef.current.getMap().flyTo({
            center: routeData.geometry.coordinates[0],
            zoom: 14,
            speed: 1.2,
          });
          setTimeout(() => {
            mapRef.current.getMap().flyTo({
              center:
                routeData.geometry.coordinates[
                  routeData.geometry.coordinates.length - 1
                ],
              zoom: 14,
              speed: 1.2,
            });
            setIsFlying(false);
            // Only for premium users, do flyAndCacheRoute
            if (hasSubscription) {
              toast.info("Caching route tiles for offline use...");
              flyAndCacheRoute(mapRef.current.getMap(), routeData, 18, 30);
              setTimeout(
                () => toast.success("Route cached for offline use!"),
                2000
              );
            } else {
              toast.info("Upgrade to premium for full offline caching.");
            }
          }, 1200);
        }

        setIsSearchPanelOpen(false);
        toast.success("Route calculated successfully!");
      } else {
        setError("No route found");
      }
    } catch (err) {
      console.error("Routing error:", err);
      setError("Failed to get directions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Navigation functions
  const startNavigation = () => {
    if (!route || !route.geometry?.coordinates || segments.length === 0) return;
    setIsNavigating(true);
    setCurrentSegmentIndex(0);
    setDistanceToNextManeuver(segments[0]?.distance || 0);
    setNavigationPosition(route.geometry.coordinates[0]);
    setIsSyncing(false); // Start in manual mode
    // Announce first instruction
    if (speechSynth.current && segments[0]?.instruction) {
      utterance.current = new SpeechSynthesisUtterance(segments[0].instruction);
      speechSynth.current.speak(utterance.current);
    }
  };

  // Manual navigation handlers
  const goToNextSegment = () => {
    if (currentSegmentIndex < segments.length - 1) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
      setNavigationPosition(segments[currentSegmentIndex + 1].coordinates[0]);
      speakInstruction(segments[currentSegmentIndex + 1].instruction || "");
      setDistanceToNextManeuver(
        segments[currentSegmentIndex + 1].distance || 0
      );
    }
  };

  const goToPreviousSegment = () => {
    if (currentSegmentIndex > 0) {
      setCurrentSegmentIndex(currentSegmentIndex - 1);
      setNavigationPosition(segments[currentSegmentIndex - 1].coordinates[0]);
      speakInstruction(segments[currentSegmentIndex - 1].instruction || "");
      setDistanceToNextManeuver(
        segments[currentSegmentIndex - 1].distance || 0
      );
    }
  };

  function speakInstruction(instruction: string) {
    if (speechSynth.current && instruction) {
      utterance.current = new SpeechSynthesisUtterance(instruction);
      speechSynth.current.speak(utterance.current);
    }
  }

  // Sync (auto-follow) logic
  useEffect(() => {
    let watchId: number | null = null;
    if (isNavigating && isSyncing && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setNavigationPosition([longitude, latitude]);
          // Find closest segment
          let closestSegmentIndex = 0;
          let minDistance = Infinity;
          segments.forEach((segment, index) => {
            segment.coordinates.forEach((coord) => {
              const dx = longitude - coord[0];
              const dy = latitude - coord[1];
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < minDistance) {
                minDistance = dist;
                closestSegmentIndex = index;
              }
            });
          });
          if (closestSegmentIndex !== currentSegmentIndex) {
            setCurrentSegmentIndex(closestSegmentIndex);
            speakInstruction(segments[closestSegmentIndex].instruction || "");
            setDistanceToNextManeuver(
              segments[closestSegmentIndex].distance || 0
            );
          }
        },
        (err) => {
          console.log(err);
          // If error, stop syncing
          setIsSyncing(false);
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      );
    }
    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSyncing, isNavigating, segments, currentSegmentIndex]);

  const stopNavigation = () => {
    setIsNavigating(false);
    if (navigationIntervalId) {
      clearInterval(navigationIntervalId);
      setNavigationIntervalId(null);
    }
    if (speechSynth.current) {
      speechSynth.current.cancel();
    }
  };

  const clearRoute = () => {
    setRoute(null);
    setRouteInfo(null);
    setError("");
    setStart("");
    setEnd("");
    setIsSearchPanelOpen(true);
    setSegments([]);
    stopNavigation();
  };

  const useCurrentLocation = async () => {
    if (userLocation) {
      setSearchingStart(true);
      try {
        if (!isOffline) {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?` +
              `format=json&lat=${userLocation[1]}&lon=${userLocation[0]}`
          );
          const data = await response.json();
          if (data.display_name) {
            const locationName = data.name || data.display_name.split(",")[0];
            setStart(locationName);
          } else {
            setStart("Current Location");
          }
        } else {
          setStart("Current Location");
        }
      } catch (error) {
        console.error(error);
        setStart("Current Location");
      } finally {
        setSearchingStart(false);
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "City":
      case "Country":
      case "State":
        return <Building className="w-4 h-4" />;
      case "Street":
        return <Route className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const renderDropdown = (
    suggestions: LocationSuggestion[],
    isSearching: boolean,
    onSelect: (suggestion: LocationSuggestion) => void,
    showRecent: boolean = false
  ) => (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-gray-100 z-50 max-h-80 overflow-y-auto"
    >
      {isSearching && (
        <div className="p-3 flex items-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Searching...</span>
        </div>
      )}

      {showRecent &&
        recentSearches.length > 0 &&
        suggestions.length === 0 &&
        !isSearching && (
          <>
            <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Recent Searches
            </div>
            {recentSearches.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <div className="text-gray-400">
                  {getCategoryIcon(item.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {item.display_name}
                  </div>
                </div>
                <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  {item.category}
                </div>
              </button>
            ))}
          </>
        )}

      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          onClick={() => onSelect(suggestion)}
          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
        >
          <div className="text-gray-400">
            {getCategoryIcon(suggestion.category)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {suggestion.name}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {suggestion.display_name}
            </div>
          </div>
          <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
            {suggestion.category}
          </div>
        </button>
      ))}

      {!isSearching &&
        suggestions.length === 0 &&
        recentSearches.length === 0 && (
          <div className="p-3 text-center text-gray-500 text-sm">
            No locations found
          </div>
        )}
    </motion.div>
  );

  const renderOfflineAlert = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-md px-4"
    >
      <Alert variant="destructive" className="flex items-center">
        <WifiOff className="h-4 w-4 mr-2" />
        <AlertTitle>Offline Mode</AlertTitle>
        <AlertDescription>
          Using cached data. Some features limited.
        </AlertDescription>
      </Alert>
    </motion.div>
  );

  const getManeuverIcon = (maneuver?: string) => {
    switch (maneuver) {
      case "turn-left":
      case "turn-slight-left":
        return <ArrowLeft className="w-5 h-5" />;
      case "turn-right":
      case "turn-slight-right":
        return <ArrowRight className="w-5 h-5" />;
      case "turn-sharp-left":
        return <ArrowLeftCircle className="w-5 h-5" />;
      case "turn-sharp-right":
        return <ArrowRightCircle className="w-5 h-5" />;
      case "arrive":
        return <Flag className="w-5 h-5" />;
      case "depart":
        return <Navigation className="w-5 h-5" />;
      default:
        return <ArrowUp className="w-5 h-5" />;
    }
  };

  // Add this function after route calculation utilities
  const flyAndCacheRoute = useCallback(
    (map: maplibregl.Map, routeGeoJson: any, maxZoom = 18, delay = 30) => {
      if (!map || !routeGeoJson?.geometry?.coordinates) return;
      const coords = routeGeoJson.geometry.coordinates;
      let i = 0;
      function flyToNext() {
        if (i >= coords.length) {
          // After reaching end, fly back to start
          setTimeout(() => {
            map.flyTo({ center: coords[0], zoom: maxZoom, speed: 2 });
          }, 500);
          return;
        }
        map.jumpTo({ center: coords[i], zoom: maxZoom });
        i++;
        setTimeout(flyToNext, delay);
      }
      // Start at the first point
      map.flyTo({ center: coords[0], zoom: maxZoom, speed: 2 });
      setTimeout(flyToNext, 800); // Give a moment for the initial fly
    },
    []
  );

  // Check for geolocation availability and permission
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.permissions
        ?.query({ name: "geolocation" as PermissionName })
        .then((result) => {
          setLocationAvailable(
            result.state === "granted" || result.state === "prompt"
          );
          result.onchange = () => {
            setLocationAvailable(
              result.state === "granted" || result.state === "prompt"
            );
          };
        })
        .catch(() => {
          setLocationAvailable(true); // fallback if Permissions API not supported
        });
    }
  }, []);

  // Check subscription status on mount
  useEffect(() => {
    fetch("/api/payment/status")
      .then((res) => res.json())
      .then((data) => {
        setHasSubscription(!!data.active);
        setSubStatus(!!data.active);
      });
  }, []);

  // Center map on navigationPosition change
  useEffect(() => {
    if (navigationPosition && mapRef.current) {
      mapRef.current
        .getMap()
        .flyTo({ center: navigationPosition, zoom: 18, speed: 1.2 });
    }
  }, [navigationPosition]);

  return (
    <ClientProviders>
      <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
        {isOffline && renderOfflineAlert()}

        {/* Map Container */}
        <div className="absolute inset-0">
          <Map
            ref={mapRef}
            mapLib={maplibregl}
            initialViewState={{
              longitude: userLocation?.[0] || 0,
              latitude: userLocation?.[1] || 0,
              zoom: userLocation ? 12 : 2,
            }}
            mapStyle={MAP_STYLE}
            style={{ width: "100%", height: "100%" }}
            onLoad={() => setMapLoaded(true)}
            onError={(e: any) => {
              console.error("Map error:", e.error);
              setMapLoadError(true);
            }}
          >
            {mapLoadError && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <div className="bg-white p-6 rounded-lg text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">Map Loading Failed</h3>
                  <p className="mb-4">
                    Unable to load map data. Please check your connection.
                  </p>
                  <Button
                    onClick={() => {
                      setMapLoadError(false);
                      setMapLoaded(false);
                      if (mapRef.current) {
                        mapRef.current.getMap().resize();
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Retry Loading Map
                  </Button>
                </div>
              </div>
            )}

            <NavigationControl position="top-right" />

            {/* User Location Marker */}
            {userLocation && (
              <Marker
                longitude={userLocation[0]}
                latitude={userLocation[1]}
                anchor="bottom"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative"
                >
                  <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg relative z-10"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
                </motion.div>
              </Marker>
            )}

            {/* Navigation Position Marker */}
            {navigationPosition && isNavigating && (
              <Marker
                longitude={navigationPosition[0]}
                latitude={navigationPosition[1]}
                anchor="bottom"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative"
                >
                  <div className="w-6 h-6 bg-green-500 rounded-full border-3 border-white shadow-lg relative z-10 flex items-center justify-center">
                    <Navigation className="w-3 h-3 text-white" />
                  </div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-green-500 rounded-full opacity-30 animate-ping"></div>
                </motion.div>
              </Marker>
            )}

            {/* Route Display */}
            {route && (
              <>
                <Source type="geojson" data={route}>
                  <Layer
                    id="route"
                    type="line"
                    layout={{
                      "line-join": "round",
                      "line-cap": "round",
                    }}
                    paint={{
                      "line-color": "#3b82f6",
                      "line-width": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        5,
                        3,
                        10,
                        6,
                        15,
                        8,
                      ],
                      "line-opacity": 0.8,
                    }}
                  />
                </Source>

                {/* Start Marker */}
                {route?.geometry?.coordinates[0] && (
                  <Marker
                    longitude={route.geometry.coordinates[0][0]}
                    latitude={route.geometry.coordinates[0][1]}
                    anchor="bottom"
                  >
                    <motion.div
                      initial={{ scale: 0, y: -20 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex flex-col items-center"
                    >
                      <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium mb-1 shadow-lg">
                        Start
                      </div>
                      <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                    </motion.div>
                  </Marker>
                )}

                {/* End Marker */}
                {route?.geometry?.coordinates[
                  route.geometry.coordinates.length - 1
                ] && (
                  <Marker
                    longitude={
                      route.geometry.coordinates[
                        route.geometry.coordinates.length - 1
                      ][0]
                    }
                    latitude={
                      route.geometry.coordinates[
                        route.geometry.coordinates.length - 1
                      ][1]
                    }
                    anchor="bottom"
                  >
                    <motion.div
                      initial={{ scale: 0, y: -20 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex flex-col items-center"
                    >
                      <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium mb-1 shadow-lg">
                        End
                      </div>
                      <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
                    </motion.div>
                  </Marker>
                )}
              </>
            )}

            {!mapLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700">
                    Loading map...
                  </p>
                </motion.div>
              </div>
            )}
          </Map>
        </div>

        {/* Floating Search Panel */}
        <AnimatePresence>
          {isSearchPanelOpen && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="absolute top-6 left-6 right-6 z-20 lg:left-8 lg:right-auto lg:w-96"
            >
              <Card className="backdrop-blur-md bg-white/90 border-0 shadow-2xl mt-20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 rounded-full">
                        <Navigation className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Navigation
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {isOffline && (
                      <Alert className="text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Offline mode: Only cached locations available
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Start Location Input */}
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-green-600 z-10" />
                      <Input
                        ref={startInputRef}
                        type="text"
                        value={start}
                        onChange={(e) => handleStartSearch(e.target.value)}
                        onFocus={() => setShowStartDropdown(true)}
                        onBlur={() =>
                          setTimeout(() => setShowStartDropdown(false), 200)
                        }
                        placeholder="Start location"
                        className="pl-10 pr-20 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={useCurrentLocation}
                        disabled={searchingStart || !userLocation}
                        className="absolute right-10 top-2 h-8 w-8 p-0"
                      >
                        {searchingStart ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Locate className="w-4 h-4" />
                        )}
                      </Button>
                      {start && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setStart("");
                            setStartSuggestions([]);
                          }}
                          className="absolute right-2 top-2 h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}

                      <AnimatePresence>
                        {showStartDropdown &&
                          renderDropdown(
                            startSuggestions,
                            searchingStart,
                            selectStartLocation,
                            start.length < 2
                          )}
                      </AnimatePresence>
                    </div>

                    {/* End Location Input */}
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-red-600 z-10" />
                      <Input
                        ref={endInputRef}
                        type="text"
                        value={end}
                        onChange={(e) => handleEndSearch(e.target.value)}
                        onFocus={() => setShowEndDropdown(true)}
                        onBlur={() =>
                          setTimeout(() => setShowEndDropdown(false), 200)
                        }
                        placeholder="Destination"
                        className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      {end && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEnd("");
                            setEndSuggestions([]);
                          }}
                          className="absolute right-2 top-2 h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}

                      <AnimatePresence>
                        {showEndDropdown &&
                          renderDropdown(
                            endSuggestions,
                            searchingEnd,
                            selectEndLocation,
                            end.length < 2
                          )}
                      </AnimatePresence>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}

                    <Button
                      onClick={calculateRoute}
                      disabled={
                        loading || !start || !end || hasSubscription === null
                      }
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {hasSubscription === null ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Checking subscription...
                        </>
                      ) : loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Finding Route...
                        </>
                      ) : (
                        <>
                          <Route className="w-5 h-5 mr-2" />
                          Get Directions
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Route Info Panel */}
        <AnimatePresence>
          {route && routeInfo && !isNavigating && (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="absolute bottom-6 left-6 z-20 lg:left-8"
            >
              <Card className="backdrop-blur-md bg-white/90 border-0 shadow-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Route Info</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRoute}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Route className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{routeInfo.distance}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Navigation className="w-4 h-4 text-green-600" />
                      <span className="font-medium">{routeInfo.duration}</span>
                    </div>
                  </div>
                  <Button
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={startNavigation}
                    disabled={segments.length === 0}
                  >
                    Start Navigation
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Panel */}
        {isNavigating && segments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-6 left-6 right-6 z-20 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">
                Turn-by-Turn Navigation
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={stopNavigation}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {/* Current Instruction */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
              <div
                className={`p-2 rounded-lg ${
                  segments[currentSegmentIndex]?.maneuver?.includes("left")
                    ? "bg-blue-100 text-blue-600"
                    : segments[currentSegmentIndex]?.maneuver?.includes("right")
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {getManeuverIcon(segments[currentSegmentIndex]?.maneuver)}
              </div>
              <div className="flex-1">
                <p className="text-lg font-medium text-gray-900">
                  {segments[currentSegmentIndex]?.instruction ||
                    "Continue straight"}
                </p>
                <p className="text-sm text-gray-600">
                  {Math.round(distanceToNextManeuver)} meters remaining
                </p>
              </div>
            </div>
            {/* Next/Previous and Sync Buttons */}
            <div className="flex gap-2 mt-4 justify-center">
              <Button
                onClick={goToPreviousSegment}
                disabled={currentSegmentIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <Button
                onClick={goToNextSegment}
                disabled={currentSegmentIndex === segments.length - 1}
              >
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              {locationAvailable && (
                <Button
                  variant={isSyncing ? "default" : "outline"}
                  onClick={() => setIsSyncing((prev) => !prev)}
                  className="ml-2"
                >
                  {isSyncing ? "Stop Sync" : "Sync"}
                </Button>
              )}
            </div>
            {/* Next Instruction Preview */}
            {currentSegmentIndex < segments.length - 1 && (
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg mt-4">
                <div className="p-1 bg-gray-200 rounded">
                  {getManeuverIcon(segments[currentSegmentIndex + 1]?.maneuver)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">
                    Then: {segments[currentSegmentIndex + 1]?.instruction}
                  </p>
                  <p className="text-xs text-gray-500">
                    In{" "}
                    {formatDistance(
                      segments[currentSegmentIndex + 1]?.distance || 0
                    )}
                  </p>
                </div>
              </div>
            )}
            {/* Progress */}
            <div className="mt-3 flex justify-between text-xs text-gray-500">
              <span>
                Step {currentSegmentIndex + 1} of {segments.length}
              </span>
              <span>
                {routeInfo?.distance} • {routeInfo?.duration}
              </span>
            </div>
          </motion.div>
        )}

        {/* Toggle Search Button */}
        {!isSearchPanelOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-6 left-6 z-20"
          >
            <Button
              onClick={() => setIsSearchPanelOpen(true)}
              className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-2xl"
            >
              <Search className="w-5 h-5" />
            </Button>
          </motion.div>
        )}

        {/* Show spinner/progress indicator while flying */}
        {isFlying && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white/80 rounded-xl shadow-lg p-6 flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <span className="text-blue-700 font-medium">
                Zooming to route...
              </span>
            </div>
          </div>
        )}

        {/* Fixed top-right button showing subscription status */}
        <div className="fixed top-4 right-14 z-50 flex items-center gap-3">
          {isSignedIn &&
            subStatus !== null &&
            (subStatus ? (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold text-sm">
                Premium
              </span>
            ) : (
              <Link href="/payment">
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-semibold text-sm cursor-pointer hover:bg-yellow-200 transition">
                  Free
                </span>
              </Link>
            ))}
          {isSignedIn && <UserButton afterSignOutUrl="/" />}
        </div>
      </div>
      <ServiceWorkerSetup />
    </ClientProviders>
  );
};

export default NavigationPage;
