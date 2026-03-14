import React, {
    useRef,
    useMemo,
    useState,
    useLayoutEffect,
} from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture, Text } from "@react-three/drei";
import * as THREE from "three";
import { easing } from "maath";
import { CONFIG } from "./gridConfig";
import { rigState } from "./gridState";
import { CloseButton } from "../CloseButton";
import { useTheme } from "@/context/ThemeContext";

// Theme colors for Three.js (CSS variables don't work in WebGL)
const THEME_COLORS = {
    light: {
        title: "#1a1a1a",
        price: "#666666",
    },
    dark: {
        title: "#f5f5f5",
        price: "#a0a0a0",
    },
};

/**
 * Render a 3D shoe tile with image, optional title/price text, hover/focus interactions, and enter/exit animations.
 *
 * Renders a textured card that animates on grid visibility, filtering, hover, and focus; updates shared rigState on click to control focus/zoom.
 *
 * @param {Object} props
 * @param {Object} props.data - Item data (expects { image_url, title, price?, randomDelay? }).
 * @param {number} props.index - Zero-based index of this tile in the grid.
 * @param {{x:number,y:number}} props.basePos - Base x/y position for the tile in grid coordinates.
 * @param {boolean} props.gridVisible - Whether the grid is currently visible (controls enter/exit rendering).
 * @param {number} props.transitionStartTime - Epoch ms when the grid transition was triggered (used for per-item staggering).
 * @param {boolean} props.interactive - Whether pointer interactions (hover/click) are enabled.
 * @param {boolean} [props.matchesFilter=true] - Whether this item passes the current filter (affects opacity/scale).
 * @param {number} props.gridHeight - Total grid height used to normalize vertical enter/exit offsets.
 * @returns {JSX.Element} The React Three Fiber group representing the shoe tile.
 */
export function ShoeTile({
    data,
    index,
    basePos,
    gridVisible,
    transitionStartTime,
    interactive,
    matchesFilter = true,
    gridHeight,
}) {
    const ref = useRef();
    const imageRef = useRef();
    const titleRef = useRef();
    const priceRef = useRef();
    const [hovered, setHovered] = useState(false);
    const texture = useTexture(data.image_url);
    const { theme } = useTheme();
    const themeColors = THEME_COLORS[theme] || THEME_COLORS.light;
    // Animation Refs
    const focusZ = useRef(0);
    const rotationX = useRef(0);
    const rotationY = useRef(0);
    const curveZ = useRef(0);
    const transitionZ = useRef(0);
    const transitionY = useRef(0);
    const breathScale = useRef(1);
    // Animated position for filter transitions
    const animatedPos = useRef({
        x: basePos.x,
        y: basePos.y,
    });
    const filterOpacity = useRef(1);
    const filterScale = useRef(1);
    // State to track if we should stop processing entirely (optimization)
    const isSleep = useRef(false);
    // Track if this item was dimmed due to focus mode (for fast recovery)
    const wasDimmedByFocus = useRef(false);
    // RESET ANIMATION STATE ON MOUNT

    useLayoutEffect(() => {
        const normalizedY =
            gridHeight > 0 ? basePos.y / (gridHeight / 2) : 0;
        if (gridVisible) {
            transitionZ.current = CONFIG.enterStartZ;
            transitionY.current =
                normalizedY * CONFIG.enterSpreadY;
            if (imageRef.current)
                imageRef.current.material.uOpacity =
                    CONFIG.enterStartOpacity;
            isSleep.current = false;
        } else {
            transitionZ.current = 0;
            transitionY.current = 0;
            if (imageRef.current)
                imageRef.current.material.uOpacity = 1;
        }
    }, []);
    const imageDims = useMemo(() => {
        const maxSize = CONFIG.itemSize * 0.9;
        if (!texture.image)
            return { width: maxSize, height: maxSize };
        const imgAspect =
            texture.image.width / texture.image.height;
        return imgAspect > 1
            ? { width: maxSize, height: maxSize / imgAspect }
            : { width: maxSize * imgAspect, height: maxSize };
    }, [texture]);
    useFrame((state, delta) => {
        // OPTIMIZATION 1: If sleeping or ref missing, stop immediately.
        if (!ref.current || isSleep.current) return;
        // --- 0. Filter Animation ---
        easing.damp(
            animatedPos.current,
            "x",
            basePos.x,
            0.2,
            delta
        );
        easing.damp(
            animatedPos.current,
            "y",
            basePos.y,
            0.2,
            delta
        );
        const targetFilterOpacity = matchesFilter ? 1 : 0;
        const targetFilterScale = matchesFilter ? 1 : CONFIG.filterScaleTarget;
        easing.damp(
            filterOpacity,
            "current",
            targetFilterOpacity,
            CONFIG.filterOpacityDamp,
            delta
        );
        easing.damp(
            filterScale,
            "current",
            targetFilterScale,
            CONFIG.filterOpacityDamp,
            delta
        );
        // Sleep check: If filtered out and visually invisible, stop processing
        // Check actual material opacity, not filterOpacity ref, to avoid popping
        const actualOpacity = imageRef.current?.material?.uOpacity ?? 1;
        if (actualOpacity < 0.01 && !matchesFilter) {
            ref.current.visible = false;
            return;
        }
        // --- 1. Stagger Logic ---
        const now = Date.now();
        const timeSinceTrigger = now - transitionStartTime;
        const staggerDelay = data.randomDelay || 0;
        const canTransition = timeSinceTrigger > staggerDelay;

        // --- 2. Calculate Targets ---
        let targetTransitionOpacity = 1.0;
        let targetTransitionZ = 0;
        const normalizedY =
            gridHeight > 0 ? basePos.y / (gridHeight / 2) : 0;
        let targetTransitionY = 0;
        if (gridVisible) {
            // ENTERING
            if (canTransition) {
                targetTransitionOpacity = 1.0;
                targetTransitionZ = 0;
                targetTransitionY = 0;
            } else {
                targetTransitionOpacity = CONFIG.enterStartOpacity;
                targetTransitionZ = CONFIG.enterStartZ;
                targetTransitionY =
                    normalizedY * CONFIG.enterSpreadY;
            }
        } else {
            // EXITING
            if (canTransition) {
                targetTransitionOpacity = 0.0;
                targetTransitionZ = CONFIG.exitEndZ;
                targetTransitionY =
                    normalizedY * CONFIG.exitSpreadY;
            } else {
                targetTransitionOpacity = 1.0;
                targetTransitionZ = 0;
                targetTransitionY = 0;
            }
        }
        // --- 3. Base Position ---
        const x = animatedPos.current.x + rigState.current.x;
        const y = animatedPos.current.y + rigState.current.y;
        // --- 4. Dynamic Culling ---
        const currentCull =
            CONFIG.cullDistance * (rigState.zoom / 8);
        const isPositionVisible =
            Math.abs(x) < currentCull &&
            Math.abs(y) < currentCull;
        // OPTIMIZATION 2: Strict Visibility Culling
        // If exiting and invisible, stop running this loop forever
        if (
            !gridVisible &&
            targetTransitionOpacity < 0.01 &&
            filterOpacity.current < 0.01
        ) {
            ref.current.visible = false;
            isSleep.current = true;
            return;
        }
        // Standard view culling
        if (
            !isPositionVisible &&
            !(!gridVisible && canTransition)
        ) {
            ref.current.visible = false;
            return;
        }
        // If opacity is effectively 0, hide mesh to save GPU rasterization
        if (
            imageRef.current?.material.uOpacity < 0.01 &&
            targetTransitionOpacity < 0.01
        ) {
            ref.current.visible = false;
            return;
        }
        ref.current.visible = true;
        // --- 5. Curvature & Zoom ---
        const isZoomedIn = rigState.zoom <= CONFIG.zoomIn + 0.5;
        const maxZoom = CONFIG.zoomOut || 50;
        const zoomRatio = isZoomedIn
            ? 0
            : THREE.MathUtils.clamp(
                (rigState.zoom - CONFIG.zoomIn) /
                (maxZoom - CONFIG.zoomIn),
                0,
                1
            );
        const smoothRatio = easing.cubic.inOut(zoomRatio);
        const distSq = x * x + y * y;
        const dist = Math.sqrt(distSq);
        const targetCurveZ =
            -distSq * CONFIG.curvatureStrength * smoothRatio;
        // Optimization: Skip complex rotation math if fading out
        let rotX = 0,
            rotY = 0;
        if (targetTransitionOpacity > 0.1) {
            const rotationIntensity =
                Math.min(dist * 0.4, 2.0) * smoothRatio;
            rotX =
                y *
                CONFIG.curvatureStrength *
                CONFIG.rotationStrength *
                rotationIntensity;
            rotY =
                -x *
                CONFIG.curvatureStrength *
                CONFIG.rotationStrength *
                rotationIntensity;
        }
        // --- 6. Interaction State ---
        const isFocusMode = rigState.activeId !== null;
        const isActive = rigState.activeId === index;
        const isHovered = hovered && interactive;
        let interactionScale = 1.0;
        let interactionOpacity = 1.0;
        let targetTextOpacity = 0;
        let targetFocusZ = 0;
        if (isFocusMode) {
            if (isActive) {
                interactionScale = CONFIG.focusScale;
                interactionOpacity = 1.0;
                targetTextOpacity = 1.0;
                targetFocusZ = 2;
            } else {
                interactionScale = CONFIG.dimScale;
                interactionOpacity = CONFIG.dimOpacity;
                targetTextOpacity = 0;
                targetFocusZ = -0.5;
                // Track that this item was dimmed
                wasDimmedByFocus.current = true;
            }
        } else {
            interactionScale =
                isHovered && !rigState.isDragging ? 1.05 : 1.0;
            targetFocusZ =
                isHovered && !rigState.isDragging ? 0.5 : 0;
        }
        const finalOpacity =
            interactionOpacity *
            targetTransitionOpacity *
            filterOpacity.current;
        const combinedScale =
            interactionScale * filterScale.current;
        // --- 7. Apply Animations ---
        easing.damp(
            ref.current.scale,
            "x",
            combinedScale,
            0.15,
            delta
        );
        easing.damp(
            ref.current.scale,
            "y",
            combinedScale,
            0.15,
            delta
        );
        easing.damp(
            focusZ,
            "current",
            targetFocusZ,
            0.2,
            delta
        );
        easing.damp(
            curveZ,
            "current",
            targetCurveZ,
            0.2,
            delta
        );
        easing.damp(
            transitionZ,
            "current",
            targetTransitionZ,
            CONFIG.transitionZDamp,
            delta
        );
        easing.damp(
            transitionY,
            "current",
            targetTransitionY,
            CONFIG.transitionYDamp,
            delta
        );
        ref.current.position.set(
            x,
            y + transitionY.current,
            curveZ.current + focusZ.current + transitionZ.current
        );
        easing.damp(rotationX, "current", rotX, 0.2, delta);
        easing.damp(rotationY, "current", rotY, 0.2, delta);
        ref.current.rotation.set(
            rotationX.current,
            rotationY.current,
            0
        );
        if (imageRef.current) {
            // Update shader uniforms
            imageRef.current.material.uTime =
                state.clock.elapsedTime;
            // Smoothly animate active state for shader effects
            const isActive = rigState.activeId === index;
            const activeDamp = isActive ? 0.6 : 0.15; // Slow open, fast close
            easing.damp(
                imageRef.current.material,
                "uActive",
                isActive ? 1 : 0,
                activeDamp,
                delta
            );
            // Animate opacity via shader uniform
            // Use faster damp for filter transitions and focus recovery, slower for grid enter/exit
            let opacityDamp;
            const isFilterTransition = !matchesFilter || filterOpacity.current < 0.99;
            // Focus recovery: item was dimmed and is now recovering
            const isFocusRecovery = !isFocusMode && wasDimmedByFocus.current;
            if (isFilterTransition && gridVisible) {
                // Filtering in or out - use filter damp for faster fade
                opacityDamp = CONFIG.filterOpacityDamp;
            } else if (isFocusRecovery && gridVisible) {
                // Recovering from dimmed state after deselection - use faster damp
                opacityDamp = CONFIG.filterOpacityDamp;
                // Reset flag once opacity is recovered
                if (imageRef.current.material.uOpacity > 0.95) {
                    wasDimmedByFocus.current = false;
                }
            } else if (gridVisible) {
                opacityDamp = CONFIG.enterOpacityDamp;
            } else {
                opacityDamp = CONFIG.exitOpacityDamp;
            }
            easing.damp(
                imageRef.current.material,
                "uOpacity",
                finalOpacity,
                opacityDamp,
                delta
            );
        }
        // Only update text opacity if text is actually rendered
        if (gridVisible) {
            const textTarget =
                targetTransitionOpacity < 0.8
                    ? 0
                    : targetTextOpacity;
            if (titleRef.current)
                easing.damp(
                    titleRef.current,
                    "fillOpacity",
                    textTarget,
                    0.1,
                    delta
                );
            if (priceRef.current)
                easing.damp(
                    priceRef.current,
                    "fillOpacity",
                    textTarget,
                    0.1,
                    delta
                );
            // Breathing animation for text when active
            const isActiveItem = rigState.activeId === index;
            const targetBreath = isActiveItem
                ? 1 +
                Math.sin(state.clock.elapsedTime * 2.0) * 0.035
                : 1;
            easing.damp(
                breathScale,
                "current",
                targetBreath,
                0.1,
                delta
            );
            // Apply breathing scale to text
            if (titleRef.current) {
                titleRef.current.scale.setScalar(
                    breathScale.current
                );
            }
            if (priceRef.current) {
                priceRef.current.scale.setScalar(
                    breathScale.current
                );
            }
        }
    });

    const handleClick = (e) => {
        if (!interactive) return;
        if (rigState.isDragging) {
            e.stopPropagation();
            return;
        }
        e.stopPropagation();
        if (rigState.activeId === index) {
            rigState.activeId = null;
        } else {
            const isZoomedOut = rigState.zoom > CONFIG.zoomIn + 2;
            rigState.target.set(-basePos.x, -basePos.y, 0);
            if (isZoomedOut) {
                rigState.activeId = index;
                rigState.zoom = CONFIG.zoomIn;
            } else {
                rigState.activeId = index;
            }
        }
    };
    const textY = -(imageDims.height / 2) - 0.25;
    const isActive = rigState.activeId === index;
    return (
        <group ref={ref}>
            <mesh
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                onClick={handleClick}
            >
                <planeGeometry
                    args={[
                        imageDims.width * 1.1,
                        imageDims.height * 1.1,
                    ]}
                />
                <meshBasicMaterial visible={false} />
            </mesh>
            <mesh ref={imageRef}>
                <planeGeometry
                    args={[imageDims.width, imageDims.height, 16, 16]}
                />
                <holoCardMaterial
                    transparent={true}
                    uTexture={texture}
                />
            </mesh>
            {/* OPTIMIZATION 3: CONDITIONAL TEXT RENDERING */}
            {/* Do NOT render text if the grid is exiting. Saves massive CPU overhead. */}
            {gridVisible && (
                <>
                    <Text
                        ref={titleRef}
                        position={[0, textY, 0.01]}
                        fontSize={0.1}
                        color={themeColors.title}
                        anchorY="top"
                        anchorX="center"
                        maxWidth={2.5}
                        fillOpacity={0}
                    >
                        {data.title}
                    </Text>
                    {data.price && (
                        <Text
                            ref={priceRef}
                            position={[0, textY - 0.22, 0.01]}
                            fontSize={0.09}
                            color={themeColors.price}
                            anchorY="top"
                            anchorX="center"
                            fillOpacity={0}
                        >
                            {data.price}
                        </Text>
                    )}
                </>
            )}
            <CloseButton
                isActive={isActive}
                position={[
                    imageDims.width / 2 - 0.15,
                    imageDims.height / 2 - 0.15,
                    0.02,
                ]}
                onClose={() => {
                    rigState.activeId = null;
                }}
            />
        </group>
    );
}
