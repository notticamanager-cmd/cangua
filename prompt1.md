# PROMPT 1 + IDEA — Reference Image Generation for 3D Hull Projection

## 1. OBJECTIVE

Generate a complete set of 2D reference images required to:
1. Reconstruct a 3D hull (mesh) via an image-to-3D model (e.g., Tencent Hunyuan3D-2).
2. Project those 2D images back onto the 3D hull using orthographic projected texturing (three-projected-material).

This document defines **what images are needed**, **from which angles**, **with which camera parameters**, and **the exact prompt** to generate any missing view.

---

## 2. PIPELINE OVERVIEW

```
[IDEA / CONCEPT]
      │
      ▼
[PROMPT 1] ──► [IMAGE GENERATOR] ──► 1 × HULL RENDER (front orthographic)
      │                                n × PROJECTION VIEWS (4 orthogonal)
      ▼
[IMAGE-TO-3D MODEL (Hunyuan3D-2)]
      │
      ▼
[3D HULL .glb]
      │
      ▼
[CAMERA FIT + WARP + PROJECTED MATERIAL]
      │
      ▼
[TEXTURED 3D ASSET FOR THREE.JS WEB GAME]
```

---

## 3. REQUIRED IMAGE SET

### 3.1 Quantity & Purpose

| # | Image Role | Purpose | Angle (Yaw) |
|---|-----------|---------|-------------|
| 1 | **Hull Render** | Input for image-to-3D model | Front (270°) |
| 2 | **Front View** | Projection texture | 270° |
| 3 | **Right View** | Projection texture | 0° |
| 4 | **Back View** | Projection texture | 90° |
| 5 | **Left View** | Projection texture | 180° |

> **Total: 5 images minimum** (1 hull render + 4 orthogonal projection views).
> The hull render can be the same as the Front View if style/geometry match exactly.

### 3.2 Angular Convention (Y-up, Front = +X)

```
          FRONT (+X)
             │
             │  yaw = 270°
             │
LEFT (+Z) ───┼─── RIGHT (−Z)
yaw = 180°   │    yaw = 0°
             │
          BACK (−X)
          yaw = 90°
```

- Hull's **Y axis points up**.
- Hull's **front face (e.g., horse head) points toward +X**.
- Yaw angles are fixed at **multiples of 90°**.

---

## 4. CAMERA SPECIFICATIONS (MANDATORY)

All images MUST follow these parameters to ensure valid orthographic projection:

| Parameter | Required Value | Notes |
|-----------|---------------|-------|
| **Projection** | Orthographic (or orthographic-like) | No perspective distortion |
| **Pitch** | ≈ 5.7° downward tilt | Shared across all 4 views |
| **Yaw** | 0° / 90° / 180° / 270° | Fixed orthogonal angles only |
| **Background** | Pure white (#FFFFFF) | Required for alpha extraction |
| **Ground Shadow** | None | Shadow breaks silhouette extraction |
| **Framing** | Full object visible, centered | Include base/pedestal if present |
| **Resolution** | 1024 × 1024 px (minimum) | Square aspect ratio |
| **Lighting** | Consistent across all views | Same direction & intensity |
| **Scale** | Identical across all views | Object must occupy same bounding box |

### 4.1 Why These Constraints Matter

- **Orthographic projection** ensures parallel projection rays, matching `THREE.OrthographicCamera` used in `ProjectedMaterial`.
- **Pure white background** allows automated background removal and alpha channel generation.
- **No ground shadow** prevents silhouette contamination during IoU-based camera fitting.
- **Consistent scale & framing** ensures the hull silhouette aligns with image silhouette after camera fitting.
- **Shared pitch (~5.7°)** compensates for typical slight top-down reference photography and is optimized via Nelder–Mead during camera fit.

---

## 5. PROMPT 1 — MASTER IMAGE GENERATION PROMPT

Use this prompt with any high-quality image generator (Midjourney, DALL·E 3, Stable Diffusion XL, Leonardo AI, Bing Image Creator, Ideogram).

### 5.1 Template (Replace `{SUBJECT}` and `{STYLE}`)

```text
Orthographic front view of {SUBJECT} in {STYLE} style.
Full body visible, centered in frame, including base/pedestal.
Pure white background, no ground shadow, no cast shadow.
Consistent studio lighting from upper-left at 30° elevation.
Camera: orthographic projection, horizon level, very slight 5° downward tilt.
Object occupies 80% of frame height. Square 1024x1024 composition.
No text, no watermark, no border, no vignette.
Highly detailed, clean edges, sharp silhouette.
```

### 5.2 Concrete Example (Sea-Horse Chess Piece)

```text
Orthographic front view of a teal-green scaled hippocampus (sea-horse) chess-piece statue, rearing upright on a three-tier gold-trimmed teal base with carved stylized waves. Fantasy sculptural style, glossy ceramic material with metallic gold accents.
Full statue visible, centered in frame, including base.
Pure white background, no ground shadow, no cast shadow.
Consistent studio lighting from upper-left at 30° elevation.
Camera: orthographic projection, horizon level, very slight 5° downward tilt.
Statue occupies 80% of frame height. Square 1024x1024 composition.
No text, no watermark, no border, no vignette.
Highly detailed, clean edges, sharp silhouette.
```

### 5.3 View-Specific Prompt Additions

Append one of the following lines to the base prompt for each required view:

| View | Append This Line |
|------|-----------------|
| **Front** | `View: directly facing the front of the subject (face/chest visible).` |
| **Right** | `View: directly facing the right side profile of the subject (90° rotation from front).` |
| **Back** | `View: directly facing the back of the subject (180° rotation from front). Show back of head, spine, tail, and rear of base.` |
| **Left** | `View: directly facing the left side profile of the subject (270° rotation from front).` |

---

## 6. BACK VIEW GENERATION (CRITICAL — OFTEN MISSING)

In most reference photo sets, the **back view (180° / yaw = 90°)** is missing. Use this dedicated prompt to generate it via AI, using the Front and Right images as style references.

### 6.1 Back View Prompt

```text
Rear view (exactly 180° from the front) of the same {SUBJECT}: {STYLE_DESCRIPTION}. Keep identical design, materials, colours, lighting, scale and framing as the reference views.
Camera: orthographic-like, horizon level (very slight 5° downward tilt), subject centred, full subject visible including base, pure white background, no shadow on the ground, 1024x1024.
Show the back of the head and mane, the spine ridge, dorsal fin, tail fin and the back of the base.
```

### 6.2 Example (Sea-Horse Chess Piece)

```text
Rear view (exactly 180° from the front) of the same sea-horse chess-piece statue: teal-green scaled hippocampus rearing on a three-tier gold-trimmed teal base with carved stylized waves. Keep identical design, materials, colours, lighting, scale and framing as the reference views.
Camera: orthographic-like, horizon level (very slight 5° downward tilt), statue centred, full statue visible including base, pure white background, no shadow on the ground, 1024x1024.
Show the back of the head and mane, the spine ridge, dorsal fin, tail fin and the back of the base.
```

### 6.3 Reference Image Guidance

- **Always attach** the Front view and Right view as reference images when generating the Back view.
- This preserves design consistency (color palette, material, proportions, base geometry).
- If the generator supports ControlNet or pose conditioning, use the hull's back silhouette as a depth/pose guide.

---

## 7. IMAGE PRE-PROCESSING CHECKLIST

Before passing images to the image-to-3D model or projection pipeline, verify:

- [ ] Background is pure white (RGB 255,255,255)
- [ ] No ground shadow or cast shadow
- [ ] Object is centered and occupies consistent frame area
- [ ] All 4 views share identical scale (bounding box height matches)
- [ ] Pitch is approximately 5° downward tilt
- [ ] Yaw angles are exactly 0° / 90° / 180° / 270°
- [ ] Resolution is at least 1024×1024
- [ ] No watermarks, text, borders, or vignettes
- [ ] Alpha channel extracted (white background removed, 2px edge erosion to avoid white fringing)

---

## 8. ACCEPTANCE CRITERIA

The image set is accepted when:

1. All 4 orthogonal views exist (Front, Right, Back, Left).
2. Each image passes the pre-processing checklist.
3. Silhouette IoU between hull projection and image silhouette reaches **≥ 0.70 after camera fit** (target: ≥ 0.90 after warp).
4. The hull render successfully produces a watertight mesh in Hunyuan3D-2 (or equivalent).

---

## 9. AGENT INSTRUCTIONS

When executing this document, the agent MUST:

1. Read Section 3 to determine the number and type of images required.
2. Use Section 5 to construct the generation prompt for each view.
3. Use Section 6 to generate the Back view if it is missing from the reference set.
4. Validate all images against Section 7 before proceeding to 3D reconstruction.
5. Reject and regenerate any image that fails the acceptance criteria in Section 8.
6. Output the final image set with filenames: `tex_front.png`, `tex_right.png`, `tex_back.png`, `tex_left.png`, `hull_render.png`.

---

*Document Version: 1.0 — Generated for AI Agent Consumption*
*Compatible Agents: Cursor, Claude, GPT-4, Codeium, GitHub Copilot*
