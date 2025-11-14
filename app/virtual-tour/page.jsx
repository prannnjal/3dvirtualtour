"use client";

import { useEffect, useRef } from "react";
import "photo-sphere-viewer/dist/photo-sphere-viewer.css";
import "photo-sphere-viewer/dist/plugins/markers.css";

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const ZOOM_LEVELS = {
  start: 10,
  target: 45,
  max: 120,
  speed: "1rpm",
};

const AUTO_ROTATE = {
  speed: "0.5rpm",
  idleDelayMs: 1000,
};

const USER_INTERACTION_EVENTS = ["pointerdown", "pointermove", "wheel", "keydown"];
const VIEWER_INTERACTION_EVENTS = ["zoom-updated", "click"];

const CONVERTED_IMAGES = [
  "IMG_20251015_170923_00_034.jpg",
  "IMG_20251015_171004_00_035.jpg",
  "IMG_20251015_171046_00_036.jpg",
  "IMG_20251015_171141_00_037.jpg",
  "IMG_20251015_171243_00_038.jpg",
  "IMG_20251015_173920_00_039.jpg",
  "IMG_20251015_174016_00_040.jpg",
  "IMG_20251015_174227_00_042.jpg",
  "IMG_20251015_174314_00_043.jpg",
  "IMG_20251015_174441_00_044.jpg",
  "IMG_20251015_174532_00_045.jpg",
  "IMG_20251015_174600_00_046.jpg",
  "IMG_20251015_174720_00_047.jpg",
  "IMG_20251015_174803_00_048.jpg",
  "IMG_20251015_174836_00_049.jpg",
  "IMG_20251015_174901_00_050.jpg",
  "IMG_20251015_174945_00_051.jpg",
  "IMG_20251015_175025_00_052.jpg",
  "IMG_20251015_175046_00_053.jpg",
  "IMG_20251015_175211_00_054.jpg",
];

const FLOOR_PITCH = -80;
const CENTER_YAWS = {
  prev: -8,
  next: 8,
};

const SCENE_LINK_OVERRIDES = {
  "IMG_20251015_171004_00_035.jpg": {
    extraLinks: [
      { targetFilename: "IMG_20251015_174016_00_040.jpg", yaw: -20, pitch: FLOOR_PITCH, label: "Go to Upper Scene" },
      { targetFilename: "IMG_20251015_174016_00_040.jpg", yaw: 0, pitch: FLOOR_PITCH, label: "Go to Upper Scene" },
      { targetFilename: "IMG_20251015_174016_00_040.jpg", yaw: 20, pitch: FLOOR_PITCH, label: "Go to Upper Scene" },
    ],
  },
};

const getSceneIdFromIndex = (index) => `scene-${index + 1}`;

const SCENES = CONVERTED_IMAGES.map((filename, index, arr) => {
  const prevIndex = (index - 1 + arr.length) % arr.length;
  const nextIndex = (index + 1) % arr.length;

  const links =
    arr.length > 1
      ? [
          {
            targetId: getSceneIdFromIndex(prevIndex),
            yaw: CENTER_YAWS.prev,
            pitch: FLOOR_PITCH,
            label: "Previous Scene",
          },
          {
            targetId: getSceneIdFromIndex(nextIndex),
            yaw: CENTER_YAWS.next,
            pitch: FLOOR_PITCH,
            label: "Next Scene",
          },
        ]
      : [];

  const overrides = SCENE_LINK_OVERRIDES[filename];
  if (overrides?.extraLinks?.length) {
    overrides.extraLinks.forEach((link) => {
      const targetIndex = CONVERTED_IMAGES.indexOf(link.targetFilename);
      if (targetIndex !== -1) {
        links.push({
          targetId: getSceneIdFromIndex(targetIndex),
          yaw: link.yaw,
          pitch: link.pitch,
          label: link.label ?? "Go to linked scene",
        });
      }
    });
  }

  return {
    id: getSceneIdFromIndex(index),
    name: `Scene ${index + 1}`,
    caption: `Saplings Scene ${index + 1}`,
    panorama: `/converted/${filename}`,
    links,
  };
});

const getSceneById = (id) => SCENES.find((scene) => scene.id === id);

export default function VirtualTourPage() {
  const viewerContainerRef = useRef(null);
  const viewerRef = useRef(null);
  const markersPluginRef = useRef(null);
  const idleTimerRef = useRef(null);
  const isAutorotatingRef = useRef(false);

  const clearIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  const stopAutorotate = () => {
    if (!viewerRef.current || !isAutorotatingRef.current) return;
    try {
      viewerRef.current.stopAutorotate?.();
    } catch {
      // ignore autorotate stop errors
    } finally {
      isAutorotatingRef.current = false;
    }
  };

  const startAutorotate = () => {
    if (!viewerRef.current || isAutorotatingRef.current) return;
    try {
      viewerRef.current.setOptions?.({
        autorotateSpeed: AUTO_ROTATE.speed,
      });
      viewerRef.current.startAutorotate?.();
      isAutorotatingRef.current = true;
    } catch {
      // ignore autorotate start errors
    }
  };

  const resetIdleTimer = () => {
    clearIdleTimer();
    idleTimerRef.current = setTimeout(() => {
      startAutorotate();
    }, AUTO_ROTATE.idleDelayMs);
  };

  const handleUserInteraction = () => {
    stopAutorotate();
    resetIdleTimer();
  };

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
    const domListeners = [];

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
          maxFov: ZOOM_LEVELS.max,
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

          resetIdleTimer();
        });

        VIEWER_INTERACTION_EVENTS.forEach((eventName) => {
          viewer.on(eventName, handleUserInteraction);
        });

        const container = viewer.container ?? viewerContainerRef.current;
        const domInteractionHandler = () => handleUserInteraction();
        USER_INTERACTION_EVENTS.forEach((eventName) => {
          const target = eventName === "keydown" ? window : container;
          if (!target) return;
          target.addEventListener(eventName, domInteractionHandler, { passive: true });
          domListeners.push({ target, eventName, handler: domInteractionHandler });
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
        html: `<button
                  class="psv-marker-arrow"
                  type="button"
                  aria-label="${link.label}"
                  title="${link.label}"
                  style="background: transparent; border: none; padding: 0;"
               >
                  <span class="psv-marker-arrow__icon" style="transform: rotate(${link.yaw}deg);">➤</span>
               </button>`,
        width: 180,
        height: 64,
        anchor: "center",
        static: true,
        tooltip: null,
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
      handleUserInteraction();
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
        VIEWER_INTERACTION_EVENTS.forEach((eventName) => {
          viewerRef.current?.off(eventName, handleUserInteraction);
        });
      } catch {
        // ignore
      }
      domListeners.forEach(({ target, eventName, handler }) => {
        try {
          target?.removeEventListener?.(eventName, handler);
        } catch {
          // ignore
        }
      });
      try {
        viewerRef.current?.destroy();
      } catch (e) {
        // ignore
      }
      clearIdleTimer();
      stopAutorotate();
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

