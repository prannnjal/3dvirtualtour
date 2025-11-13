"use client";

import { useEffect, useRef } from "react";
import "photo-sphere-viewer/dist/photo-sphere-viewer.css";
import "photo-sphere-viewer/dist/plugins/markers.css";

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const ZOOM_LEVELS = {
  start: 10,
  target: 45,
  speed: "1rpm",
};

const SCENES = [
  {
    id: "lobby",
    name: "Lobby",
    caption: "Lobby Area - Saplings",
    panorama: "/tours/ab.jpg",
    links: [
      {
        targetId: "assembly",
        yaw: 45,
        pitch: 2,
        label: "Go to Assembly Area",
      },
      {
        targetId: "hall",
        yaw: 190,
        pitch: -1,
        label: "Go to Auditorium",
      },
    ],
  },
  {
    id: "assembly",
    name: "Assembly Area",
    caption: "Assembly Area - Saplings",
    panorama: "/tours/assembly.jpg",
    links: [
      {
        targetId: "lobby",
        yaw: -135,
        pitch: 0,
        label: "Back to Lobby",
      },
      {
        targetId: "hostel",
        yaw: 35,
        pitch: -3,
        label: "Go to Hostel",
      },
    ],
  },
  {
    id: "hostel",
    name: "Hostel",
    caption: "Hostel - Saplings",
    panorama: "/tours/hostel.jpg",
    links: [
      {
        targetId: "assembly",
        yaw: 210,
        pitch: 1,
        label: "Back to Assembly Area",
      },
      {
        targetId: "hall",
        yaw: -10,
        pitch: -2,
        label: "Go to Auditorium",
      },
    ],
  },
  {
    id: "hall",
    name: "Auditorium",
    caption: "Auditorium Hall - Saplings",
    panorama: "/tours/hall.jpg",
    links: [
      {
        targetId: "lobby",
        yaw: 5,
        pitch: -4,
        label: "Back to Lobby",
      },
      {
        targetId: "hostel",
        yaw: 160,
        pitch: 0,
        label: "Go to Hostel",
      },
    ],
  },
];

const getSceneById = (id) => SCENES.find((scene) => scene.id === id);

export default function VirtualTourPage() {
  const viewerContainerRef = useRef(null);
  const viewerRef = useRef(null);
  const markersPluginRef = useRef(null);

  const playZoomIn = (viewer) => {
    if (!viewer) return;

    if (typeof viewer.stopAnimation === "function") {
      viewer.stopAnimation().catch(() => {});
    }

    if (typeof viewer.zoom === "function") {
      try {
        viewer.zoom(ZOOM_LEVELS.start);
      } catch (error) {
        // ignore zoom preset errors
      }
    }

    viewer.animate({
      zoom: ZOOM_LEVELS.target,
      speed: ZOOM_LEVELS.speed,
    });
  };

  useEffect(() => {
    if (!viewerContainerRef.current) return undefined;

    // Dynamically import the viewer and plugin to avoid running DOM-dependent
    // code during server-side rendering where `document` is undefined.
    let mounted = true;
    (async () => {
      try {
        const viewerModule = await import("photo-sphere-viewer");
        const pluginModule = await import("photo-sphere-viewer/dist/plugins/markers");
        const ViewerLib = viewerModule?.Viewer ?? viewerModule?.default ?? viewerModule;
        const MarkersPluginLib = pluginModule?.MarkersPlugin ?? pluginModule?.default ?? pluginModule;

        if (!mounted || !viewerContainerRef.current) return;

        const viewer = new ViewerLib({
          container: viewerContainerRef.current,
          panorama: SCENES[0].panorama,
          caption: SCENES[0].caption,
          loadingImg: "/loading.svg",
          defaultZoomLvl: ZOOM_LEVELS.start,
          plugins: [[MarkersPluginLib, { markers: [] }]],
          navbar: ["zoom", "fullscreen"],
        });

        viewerRef.current = viewer;
        markersPluginRef.current = viewer.getPlugin(MarkersPluginLib);

        // Run initial marker update and zoom when viewer is ready
        viewer.once("ready", () => {
          updateMarkers(SCENES[0].id);

          if (typeof viewer.stopAnimation === "function") {
            viewer.stopAnimation().catch(() => {});
          }

          if (typeof viewer.zoom === "function") {
            try {
              viewer.zoom(ZOOM_LEVELS.target);
            } catch (error) {
              // ignore zoom preset errors
            }
          }
        });

        markersPluginRef.current?.on("select-marker", handleMarkerClick);
      } catch (err) {
        // Fail gracefully if the library can't be loaded
        // (e.g., running in an environment without browser APIs)
        // Keep error for debugging, but don't crash the component.
        // eslint-disable-next-line no-console
        console.error("Failed to load photo-sphere-viewer:", err);
      }
    })();

    const updateMarkers = (sceneId) => {
      const scene = getSceneById(sceneId);
      if (!scene || !markersPluginRef.current) return;

      const markers = scene.links.map((link) => ({
        id: `${sceneId}-${link.targetId}`,
        longitude: toRadians(link.yaw),
        latitude: toRadians(link.pitch),
        html: `<button class="psv-marker-arrow" type="button">
                  <span class="psv-marker-arrow__icon" style="transform: rotate(${link.yaw}deg);">➤</span>
                  <span class="psv-marker-arrow__label">${link.label}</span>
               </button>`,
        width: 180,
        height: 64,
        anchor: "center",
        static: true,
        tooltip: link.label,
        data: {
          targetId: link.targetId,
        },
      }));

      markersPluginRef.current.setMarkers(markers);
    };

    const loadScene = async (sceneId) => {
      const scene = getSceneById(sceneId);
      if (!scene || !viewerRef.current) return;

      const viewerInstance = viewerRef.current;

      if (typeof viewerInstance.stopAnimation === "function") {
        viewerInstance.stopAnimation().catch(() => {});
      }

      if (typeof viewerInstance.zoom === "function") {
        try {
          viewerInstance.zoom(ZOOM_LEVELS.start);
        } catch (error) {
          // ignore zoom preset errors
        }
      }

      await viewerInstance.setPanorama(scene.panorama, {
        caption: scene.caption,
        transition: false,
        showLoader: false,
      });

      updateMarkers(sceneId);
      playZoomIn(viewerInstance);
    };

    const handleMarkerClick = async (event, marker) => {
      const targetId = marker.config?.data?.targetId;
      if (targetId) {
        await loadScene(targetId);
      }
    };

    return () => {
      // mark mounted false to stop the async initializer from proceeding
      // if it's still pending and avoid setting refs after unmount.
      // Also try to remove listeners and destroy the viewer if present.
      try {
        markersPluginRef.current?.off("select-marker", handleMarkerClick);
      } catch (e) {
        // ignore
      }
      try {
        viewerRef.current?.destroy();
      } catch (e) {
        // ignore
      }
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen w-full bg-black text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-6">
        <header className="mb-4 text-center">
          <h1 className="text-3xl font-semibold">
            <span className="font-bold">Saplings</span>{" "}
            <span className="font-semibold">Virtual Tour</span>
          </h1>
          <p className="mt-2 text-base text-gray-300">
            Tap the floating arrows inside each scene to move between rooms.
          </p>
        </header>
        <section className="w-full flex-1 overflow-hidden rounded-lg border border-white/10 shadow-lg">
          <div ref={viewerContainerRef} className="h-[70vh] w-full" />
        </section>
      </div>
    </main>
  );
}

