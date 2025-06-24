"use client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Building,
  Clock,
  Loader2,
  Locate,
  MapPin,
  Navigation,
  Route,
  Search,
  WifiOff,
  X,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Flag,
  ArrowLeftCircle,
  ArrowRightCircle,
} from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Source,
} from "react-map-gl/maplibre";
import { v4 as uuidv4 } from "uuid";

interface LocationSuggestion {
  id: string;
  display_name: string;
  name: string;
  type: string;
  coordinates: [number, number];
  category: string;
}

interface OfflineRoute {
  start: string;
  end: string;
  geojson: any;
  info: {
    distance: string;
    duration: string;
  };
  steps: Array<{
    instruction: string;
    distance: number;
    duration: number;
  }>;
}

interface RouteSegment {
  startIndex: number;
  endIndex: number;
  coordinates: [number, number][];
  distance: number; // in meters
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

const NavigationPage = () => {
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
    steps?: Array<{
      instruction: string;
      distance: number;
      duration: number;
    }>;
  } | null>(null);
  const [recentSearches, setRecentSearches] = useState<LocationSuggestion[]>(
    []
  );
  const [isOffline, setIsOffline] = useState(false);
  const [offlineLocations, setOfflineLocations] = useState<
    LocationSuggestion[]
  >([]);
  const [offlineRoutes, setOfflineRoutes] = useState<OfflineRoute[]>([]);
  const [mapLoadError, setMapLoadError] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [distanceToNextManeuver, setDistanceToNextManeuver] = useState(0);
  const [navigationStarted, setNavigationStarted] = useState(false);
  const speechSynth = useRef(
    typeof window !== "undefined" && window.speechSynthesis
      ? window.speechSynthesis
      : null
  );
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);

  const mapRef = useRef<any>(null);
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>(null);

  const MAP_STYLE =
    "https://tile.openstreetmap.jp/styles/osm-bright-en/style.json";
  const FALLBACK_MAP_STYLE = "https://demotiles.maplibre.org/style.json";

  // Offline cache keys
  const OFFLINE_CACHE_KEYS = {
    LOCATIONS: "offline-locations",
    ROUTES: "offline-routes",
  };

  const DEFAULT_OFFLINE_LOCATION = [-74.006, 40.7128] as [number, number]; // New York

  // Update offline detection useEffect
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check if map loading is taking too long
    const mapLoadTimer = setTimeout(() => {
      if (!mapLoaded) {
        setIsOffline(true);
        setMapLoadError(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearTimeout(mapLoadTimer);
    };
  }, [mapLoaded]);

  useEffect(() => {
    // Set up online/offline detection
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([longitude, latitude]);
        },
        (error) => console.error("Geolocation error:", error)
      );
    }

    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem("recentSearches");
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }

    // Load offline locations
    const savedLocations = localStorage.getItem(OFFLINE_CACHE_KEYS.LOCATIONS);
    if (savedLocations) {
      setOfflineLocations(JSON.parse(savedLocations));
    }

    // Load offline routes
    const savedRoutes = localStorage.getItem(OFFLINE_CACHE_KEYS.ROUTES);
    if (savedRoutes) {
      setOfflineRoutes(JSON.parse(savedRoutes));
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [OFFLINE_CACHE_KEYS.LOCATIONS, OFFLINE_CACHE_KEYS.ROUTES]);

  // Update the useEffect for offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Initial check
    setIsOffline(!navigator.onLine);

    // Listen for changes
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Additional check for slow connections
    const timeout = setTimeout(() => {
      if (!mapLoaded) {
        setIsOffline(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearTimeout(timeout);
    };
  }, [mapLoaded]);

  const saveToRecentSearches = (location: LocationSuggestion) => {
    const updated = [
      location,
      ...recentSearches.filter((item) => item.id !== location.id),
    ].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));

    // Save to offline locations
    const locationExists = offlineLocations.some(
      (loc) => loc.id === location.id
    );

    if (!locationExists) {
      const updatedOffline = [location, ...offlineLocations].slice(0, 100);

      setOfflineLocations(updatedOffline);
      localStorage.setItem(
        OFFLINE_CACHE_KEYS.LOCATIONS,
        JSON.stringify(updatedOffline)
      );
    }
  };

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

      // Online search
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

  const selectStartLocation = (suggestion: LocationSuggestion) => {
    setStart(suggestion.name);
    setShowStartDropdown(false);
    setStartSuggestions([]);
    saveToRecentSearches(suggestion);
  };

  const selectEndLocation = (suggestion: LocationSuggestion) => {
    setEnd(suggestion.name);
    setShowEndDropdown(false);
    setEndSuggestions([]);
    saveToRecentSearches(suggestion);
  };

  const getLocationCoordinates = async (
    locationName: string
  ): Promise<[number, number] | null> => {
    // First check offline cache
    const cachedLocation = offlineLocations.find(
      (loc) => loc.name.toLowerCase() === locationName.toLowerCase()
    );

    if (cachedLocation) {
      return cachedLocation.coordinates;
    }

    // Fallback to online search
    const suggestions = await searchLocations(locationName);
    return suggestions.length > 0 ? suggestions[0].coordinates : null;
  };

  // --- Navigation Geometry Utilities ---
  function calculateDistance(a: [number, number], b: [number, number]): number {
    // Haversine formula
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(b[1] - a[1]);
    const dLon = toRad(b[0] - a[0]);
    const lat1 = toRad(a[1]);
    const lat2 = toRad(b[1]);
    const x = dLon * Math.cos((lat1 + lat2) / 2);
    const y = dLat;
    return Math.sqrt(x * x + y * y) * R;
  }

  function calculateBearing(a: [number, number], b: [number, number]): number {
    // Returns bearing in degrees from point a to b
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
  }

  function bearingToCardinal(bearing: number): string {
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
  }

  function formatDistance(meters: number): string {
    if (meters > 1000) {
      return (meters / 1000).toFixed(1) + " km";
    }
    return Math.round(meters) + " meters";
  }

  // Move helpers outside the component to avoid useEffect dependency warning
  const splitRouteIntoSegments = (
    coordinates: [number, number][],
    maxSegmentLength: number = 100
  ): RouteSegment[] => {
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
      if (
        Math.abs(currentBearing - currentSegment.bearing!) > 20 ||
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
  };

  const generateNavigationInstructions = (
    segments: RouteSegment[]
  ): RouteSegment[] => {
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
          instruction: "You have reached your destination",
          maneuver: "arrive",
        };
      } else {
        const prevSegment = segments[index - 1];
        const turnAngle = segment.bearing! - prevSegment.bearing!;
        let maneuver: RouteSegment["maneuver"] = "continue";
        let instruction = "Continue straight";
        if (turnAngle > 30 && turnAngle < 160) {
          maneuver = "turn-right";
          instruction = "Turn right";
        } else if (turnAngle < -30 && turnAngle > -160) {
          maneuver = "turn-left";
          instruction = "Turn left";
        } else if (turnAngle > 160) {
          maneuver = "turn-sharp-right";
          instruction = "Take a sharp right";
        } else if (turnAngle < -160) {
          maneuver = "turn-sharp-left";
          instruction = "Take a sharp left";
        } else if (turnAngle > 10 && turnAngle < 30) {
          maneuver = "turn-slight-right";
          instruction = "Take a slight right";
        } else if (turnAngle < -10 && turnAngle > -30) {
          maneuver = "turn-slight-left";
          instruction = "Take a slight left";
        }
        return {
          ...segment,
          instruction: `${instruction} and head ${bearingToCardinal(
            segment.bearing!
          )} for ${formatDistance(segment.distance)}`,
          maneuver,
        };
      }
    });
  };

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
    setCurrentStepIndex(0);

    // Define fitMapToRoute outside the conditional blocks
    const fitMapToRoute = (routeData: any) => {
      if (mapRef.current && routeData?.geometry?.coordinates) {
        setTimeout(() => {
          const map = mapRef.current.getMap();
          const coords: [number, number][] = routeData.geometry.coordinates;
          const bounds = coords.reduce(
            (bounds: maplibregl.LngLatBounds, coord: [number, number]) => {
              return bounds.extend(coord);
            },
            new maplibregl.LngLatBounds(coords[0], coords[0])
          );
          map.fitBounds(bounds, {
            padding: 80,
            duration: 1000,
          });
        }, 300);
      }
    };

    // Check offline route cache first
    if (isOffline) {
      const cachedRoute = offlineRoutes.find(
        (r) => r.start === start && r.end === end
      );
      if (cachedRoute) {
        setRoute(cachedRoute.geojson);
        setRouteInfo({ ...cachedRoute.info, steps: cachedRoute.steps });
        setIsSearchPanelOpen(false);
        setTimeout(() => {
          fitMapToRoute(cachedRoute.geojson);
        }, 100);
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
        let steps: any[] = [];
        if (data.routes[0].legs?.[0]?.steps?.length > 0) {
          // Use OSRM steps if available
          steps = data.routes[0].legs[0].steps.map((step: any) => ({
            instruction: step.maneuver.instruction || "Continue",
            distance: step.distance,
            duration: step.duration,
            pointIndex: 0,
            bearing: 0,
          }));
        } else if (routeData.geometry?.coordinates) {
          // Generate steps from geometry if no OSRM steps (offline mode)
          steps = generateNavigationInstructions(
            splitRouteIntoSegments(routeData.geometry.coordinates)
          );
        }
        const routeInfoData = {
          distance: `${distance} km`,
          duration: `${duration} min`,
          steps,
        };
        setRouteInfo(routeInfoData);
        // Save to offline cache
        const newRoute: OfflineRoute = {
          start,
          end,
          geojson: routeData,
          info: { distance: `${distance} km`, duration: `${duration} min` },
          steps,
        };
        const updatedRoutes = [
          newRoute,
          ...offlineRoutes.filter((r) => !(r.start === start && r.end === end)),
        ].slice(0, 20);
        setOfflineRoutes(updatedRoutes);
        localStorage.setItem(
          OFFLINE_CACHE_KEYS.ROUTES,
          JSON.stringify(updatedRoutes)
        );
        setTimeout(() => {
          fitMapToRoute(routeData);
        }, 100);
        setIsSearchPanelOpen(false);
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

  const clearRoute = () => {
    setRoute(null);
    setRouteInfo(null);
    setError("");
    setStart("");
    setEnd("");
    setIsSearchPanelOpen(true);
  };

  const useCurrentLocation = async () => {
    if (userLocation) {
      setSearchingStart(true);
      try {
        // Only try to reverse geocode if online
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

  // Offline status indicator
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

  // Voice guidance effect
  useEffect(() => {
    if (isNavigating && routeInfo?.steps) {
      const text = routeInfo.steps[currentStepIndex]?.instruction;
      if (
        !isOffline &&
        typeof window !== "undefined" &&
        "speechSynthesis" in window &&
        text
      ) {
        const utterance = new window.SpeechSynthesisUtterance(text);
        window.speechSynthesis.cancel(); // Stop any previous
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [currentStepIndex, isNavigating, isOffline, routeInfo]);

  // useEffect for route segmentation and instructions
  useEffect(() => {
    if (route) {
      const coords = route.geometry.coordinates;
      const segs = splitRouteIntoSegments(coords);
      const segsWithInstructions = generateNavigationInstructions(segs);
      setSegments(segsWithInstructions);
    }
  }, [route]);

  // Simulate navigation progress
  useEffect(() => {
    if (!navigationStarted || segments.length === 0) return;
    const interval = setInterval(() => {
      setDistanceToNextManeuver((prevDistance) => {
        const newDistance = prevDistance - 15; // 15 meters per second
        if (newDistance <= 0) {
          if (currentSegmentIndex < segments.length - 1) {
            const nextSegmentIndex = currentSegmentIndex + 1;
            // Use local variable instead of setCurrentSegmentIndex to avoid unused var
            setCurrentSegmentIndex(nextSegmentIndex);
            // Announce the next instruction if it's a maneuver
            if (
              nextSegmentIndex > 0 &&
              segments[nextSegmentIndex].maneuver !== "continue"
            ) {
              if (speechSynth.current) {
                utterance.current = new SpeechSynthesisUtterance(
                  segments[nextSegmentIndex].instruction!
                );
                speechSynth.current.speak(utterance.current);
              }
            }
            return segments[nextSegmentIndex].distance;
          } else {
            setNavigationStarted(false);
            return 0;
          }
        }
        return newDistance;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [navigationStarted, segments, currentSegmentIndex]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
      {isOffline && renderOfflineAlert()}

      {/* Map Container */}
      <div className="absolute inset-0">
        <Map
          ref={mapRef}
          mapLib={maplibregl}
          initialViewState={{
            longitude:
              userLocation?.[0] ||
              (isOffline ? DEFAULT_OFFLINE_LOCATION[0] : 0),
            latitude:
              userLocation?.[1] ||
              (isOffline ? DEFAULT_OFFLINE_LOCATION[1] : 0),
            zoom: userLocation ? 12 : isOffline ? 12 : 2,
          }}
          mapStyle={isOffline ? "/offline-map-style.json" : MAP_STYLE}
          style={{ width: "100%", height: "100%" }}
          onLoad={() => setMapLoaded(true)}
          onError={(e: any) => {
            if (isOffline) {
              // Create a simple fallback style
              const fallbackStyle = {
                version: 8,
                sources: {},
                layers: [
                  {
                    id: "background",
                    type: "background",
                    paint: { "background-color": "#e0e0e0" },
                  },
                ],
              };
              if (mapRef.current) {
                mapRef.current.getMap().setStyle(fallbackStyle);
              }
              return;
            }
            console.error("Map error:", e.error);
            if (e.error?.status === 404 && mapRef.current) {
              mapRef.current.getMap().setStyle(FALLBACK_MAP_STYLE);
            }
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
                    // Force re-render map
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

          {isOffline && (
            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-md text-sm">
              Offline Map Mode
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
            <Card className="backdrop-blur-md bg-white/90 border-0 shadow-2xl">
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
                    disabled={loading || !start || !end}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
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
                {routeInfo.steps && routeInfo.steps.length > 0 && (
                  <Button
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      setIsNavigating(true);
                      setCurrentStepIndex(0);
                    }}
                  >
                    Start Navigation
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Panel */}
      {navigationStarted && segments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 left-6 right-6 z-20 bg-white/90 backdrop-blur-md rounded-xl shadow-2xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Navigation</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNavigationStarted(false)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`p-2 rounded-lg ${
                segments[currentSegmentIndex].maneuver?.includes("left")
                  ? "bg-blue-100 text-blue-600"
                  : segments[currentSegmentIndex].maneuver?.includes("right")
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {segments[currentSegmentIndex].maneuver === "turn-left" && (
                <ArrowLeft className="w-5 h-5" />
              )}
              {segments[currentSegmentIndex].maneuver === "turn-right" && (
                <ArrowRight className="w-5 h-5" />
              )}
              {segments[currentSegmentIndex].maneuver ===
                "turn-slight-left" && <ArrowLeft className="w-5 h-5" />}
              {segments[currentSegmentIndex].maneuver ===
                "turn-slight-right" && <ArrowRight className="w-5 h-5" />}
              {segments[currentSegmentIndex].maneuver === "turn-sharp-left" && (
                <ArrowLeftCircle className="w-5 h-5" />
              )}
              {segments[currentSegmentIndex].maneuver ===
                "turn-sharp-right" && <ArrowRightCircle className="w-5 h-5" />}
              {segments[currentSegmentIndex].maneuver === "continue" && (
                <ArrowUp className="w-5 h-5" />
              )}
              {segments[currentSegmentIndex].maneuver === "depart" && (
                <Navigation className="w-5 h-5" />
              )}
              {segments[currentSegmentIndex].maneuver === "arrive" && (
                <Flag className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-lg font-medium">
                {segments[currentSegmentIndex].instruction}
              </p>
              <p className="text-sm text-gray-600">
                {Math.round(distanceToNextManeuver)} meters to go in this
                segment
              </p>
            </div>
          </div>
          {currentSegmentIndex < segments.length - 1 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Next: {segments[currentSegmentIndex + 1].instruction}
                </span>
                <span>
                  {Math.round(segments[currentSegmentIndex + 1].distance)}{" "}
                  meters
                </span>
              </div>
            </div>
          )}
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
    </div>
  );
};

export default NavigationPage;
