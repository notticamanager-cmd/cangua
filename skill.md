# SKILL GUIDE — Orthographic Image Projection onto 3D Hull
## Using `three-projected-material` Repository Techniques

> **Purpose:** This document teaches an AI agent how to project 2D orthogonal images onto a 3D hull mesh using the exact mathematical and rendering techniques from the `three-projected-material` repository. Follow each step sequentially. Do not skip validation checkpoints.

---

## TABLE OF CONTENTS

1. [Prerequisites](#1-prerequisites)
2. [Step 1 — Hull Orientation & Normals](#2-step-1--hull-orientation--normals)
3. [Step 2 — Camera Fitting (IoU Optimization)](#3-step-2--camera-fitting-iou-optimization)
4. [Step 3 — Silhouette Warping (Optional but Recommended)](#4-step-3--silhouette-warping-optional-but-recommended)
5. [Step 4 — Texture Projection (ProjectedMaterial)](#5-step-4--texture-projection-projectedmaterial)
6. [Step 5 — Compositing & Blend Modes](#6-step-5--compositing--blend-modes)
7. [Step 6 — Handling Missing Views](#7-step-6--handling-missing-views)
8. [Complete Three.js Reference Code](#8-complete-threejs-reference-code)
9. [Validation & Debugging](#9-validation--debugging)
10. [Agent Execution Checklist](#10-agent-execution-checklist)

---

## 1. PREREQUISITES

### 1.1 Required Assets

| Asset | Format | Source |
|-------|--------|--------|
| 3D Hull mesh | `.glb` or `.obj` | Image-to-3D model (Hunyuan3D-2, Tripo3D, etc.) |
| Front texture | `.png` with alpha | Reference image set |
| Right texture | `.png` with alpha | Reference image set |
| Back texture | `.png` with alpha | Reference image set (or AI-generated) |
| Left texture | `.png` with alpha | Reference image set |

### 1.2 Required Libraries

```json
{
  "three": ">=0.150.0",
  "three-projected-material": "latest",
  "GLTFLoader": "from three/examples/jsm/loaders/GLTFLoader.js"
}
```

### 1.3 Coordinate Convention

- **Y-axis**: Up
- **Front of hull**: +X direction
- **Right of hull**: +Z direction
- **Back of hull**: −X direction
- **Left of hull**: −Z direction

---

## 2. STEP 1 — Hull Orientation & Normals

### 2.1 Load the Hull

```javascript
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const gltf = await new GLTFLoader().loadAsync('white_mesh_1.glb');
let geometry;
gltf.scene.traverse(o => { if (o.isMesh) geometry = o.geometry; });
```

### 2.2 Compute Smooth Normals

> ⚠️ **CRITICAL:** Hulls from image-to-3D models often lack normals. You MUST compute them before projection, otherwise backface culling and lighting will fail.

```javascript
geometry.computeVertexNormals(); // Area-weighted smooth normals
geometry.clearGroups();          // Remove existing material groups
```

### 2.3 Validate Orientation

Confirm the hull's front face points toward **+X**. If the model was generated with a different orientation, apply a rotation:

```javascript
// Example: If front faces +Z, rotate -90° around Y to align front with +X
geometry.rotateY(-Math.PI / 2);
```

### 2.4 Checkpoint ✅

- [ ] Geometry loads without errors
- [ ] Normals are computed and point outward
- [ ] Front of hull faces +X
- [ ] Vertex count and triangle count logged for reference

---

## 3. STEP 2 — Camera Fitting (IoU Optimization)

### 3.1 Concept

For each of the 4 views, we must find the orthographic camera parameters that **maximize the Intersection over Union (IoU)** between:
- The hull's projected silhouette (rendered with an orthographic camera)
- The input image's silhouette (alpha mask)

### 3.2 Parameters to Optimize

| Parameter | Symbol | Typical Range | Notes |
|-----------|--------|---------------|-------|
| Scale | `s` | 100–300 | Controls orthographic frustum size |
| Image center X | `cx` | 0–384 | Horizontal offset in image space |
| Image center Y | `cy` | 0–384 | Vertical offset in image space |
| Pitch | `θp` | 0–0.15 rad | Shared across all views (~5.7°) |

> **Yaw is NOT optimized.** It is fixed at multiples of 90°:
> - Front: 270°
> - Right: 0°
> - Back: 90°
> - Left: 180°

### 3.3 Optimization Algorithm

Use **Nelder–Mead simplex optimization** (or equivalent derivative-free optimizer):

```python
# Pseudocode — Agent should implement in Python or JS
def objective(params):
    s, cx, cy, pitch = params
    hull_silhouette = render_orthographic_silhouette(
        geometry, yaw_deg=fixed_yaw, pitch_rad=pitch,
        scale=s, center=(cx, cy), resolution=384
    )
    image_silhouette = load_alpha_mask(image_path)
    iou = intersection_over_union(hull_silhouette, image_silhouette)
    return -iou  # Minimize negative IoU

result = nelder_mead(objective, initial_guess=[170, 192, 192, 0.1])
```

### 3.4 Expected IoU Results

| Stage | Typical IoU | Meaning |
|-------|-------------|---------|
| Naive (bbox, pitch=0) | 0.65–0.78 | Rough bounding-box alignment |
| After camera fit | 0.70–0.80 | Optimized scale, center, pitch |
| After warp | 0.88–0.95 | Silhouette-matched texture |

> ⚠️ **Note:** IoU will never reach 1.0 because the hull is typically "fatter" than the real object (e.g., bloated mane, flared base, extra vertex blocks on top of head). This geometry mismatch is corrected by **warping the image**, not by further camera adjustment.

### 3.5 Checkpoint ✅

- [ ] IoU computed for all 4 views
- [ ] Pitch is shared across views (≈ 0.1 rad / 5.7°)
- [ ] Scale, cx, cy recorded per view
- [ ] IoU after fit ≥ 0.70 for all views

---

## 4. STEP 3 — Silhouette Warping (Optional but Recommended)

### 4.1 Why Warp?

The hull mesh from image-to-3D reconstruction is often geometrically "fatter" or slightly deformed compared to the original reference images. Since camera parameters cannot compensate for shape mismatch, we **warp the 2D image** to match the hull's silhouette.

### 4.2 Algorithm: Demons on Distance Fields

```python
# Pseudocode
hull_dist_field = distance_transform(hull_silhouette)
image_dist_field = distance_transform(image_silhouette)
displacement_field = demons_registration(
    fixed=hull_dist_field,
    moving=image_dist_field,
    iterations=50,
    sigma=2.0
)
warped_image = apply_displacement(original_image, displacement_field)
```

### 4.3 Output

- Save warped images as `tex_front_B.png`, `tex_right_B.png`, `tex_left_B.png`, `tex_back_B.png`.
- The suffix `_B` denotes the warped set. The original set is `_A`.
- **Use the warped set (`_B`) for final projection.**

### 4.4 Known Limitation

If the hull has extra geometry (e.g., a vertex block protruding above the head), the corresponding image region will be **stretched** to cover it. This is a hull defect and cannot be fixed by warping. Accept it or repair the mesh in Blender before projecting.

### 4.5 Checkpoint ✅

- [ ] Warped images generated for all available views
- [ ] IoU after warp ≥ 0.88
- [ ] No visible tearing or folding in warped textures
- [ ] Alpha channel preserved after warp

---

## 5. STEP 4 — Texture Projection (ProjectedMaterial)

### 5.1 Core Principle

`ProjectedMaterial` computes UV coordinates as:

```
UV = Projection_Matrix × View_Matrix × Model_Matrix × vertex_position
```

The camera is **frozen at the moment of `project()`**. After projection, the texture is "baked" onto the geometry from that camera's viewpoint.

### 5.2 Camera Construction

For each view, construct an `OrthographicCamera`:

```javascript
function buildProjectionCamera(yawDeg, pitchRad, halfWidth, offset) {
    const yaw = THREE.MathUtils.degToRad(yawDeg);
    const c = Math.cos(yaw), s = Math.sin(yaw);
    const cp = Math.cos(pitchRad), sp = Math.sin(pitchRad);

    const cam = new THREE.OrthographicCamera(-halfWidth, halfWidth, halfWidth, -halfWidth, 0.1, 20);

    // Position: camera looks toward origin from direction defined by yaw/pitch
    cam.position.set(-cp * s, sp, cp * c).multiplyScalar(5);
    cam.up.set(sp * s, cp, -sp * c);
    cam.lookAt(0, 0, 0);

    return cam;
}
```

### 5.3 Half-Width Calculation

The orthographic half-width (`hw`) is derived from the fitted scale:

```
hw = R / (2 × s)
```

Where:
- `R` = image resolution (e.g., 384)
- `s` = fitted scale parameter from Step 2

### 5.4 Texture Offset

```javascript
const textureOffset = new THREE.Vector2(
    cx / R - 0.5,
    0.5 - cy / R
);
```

### 5.5 Create ProjectedMaterial

```javascript
import ProjectedMaterial from 'three-projected-material/src/ProjectedMaterial.js';

const material = new ProjectedMaterial({
    camera: cam,
    texture: new THREE.TextureLoader().load('tex_front_B.png'),
    textureScale: 1,
    textureOffset: textureOffset,
    color: '#bdbdbd',      // Base color for uncovered areas
    transparent: true,      // Required when stacking multiple materials
});
```

### 5.6 Project the Texture

```javascript
const mesh = new THREE.Mesh(geometry, []);
geometry.addGroup(0, Infinity, 0);  // Assign group index 0
mesh.material = [material];
scene.add(mesh);
material.project(mesh);  // Freeze camera and bake projection
```

> ⚠️ **CRITICAL:** Call `material.project(mesh)` **exactly once** per material. The camera position is captured at this moment. Do not move the camera after projection.

### 5.7 Backface Culling

`ProjectedMaterial` automatically only renders fragments where the surface normal faces the camera:

```glsl
float fc = dot(normal, cameraDirection);
if (fc <= 0.0) discard;  // Back-facing fragment
```

This means **you do NOT need manual backface culling**. However, this also means **occluded but front-facing surfaces will still receive texture** (e.g., legs printing through the body). See Section 6 for occlusion handling.

### 5.8 Checkpoint ✅

- [ ] All 4 cameras constructed with correct yaw/pitch
- [ ] Half-width computed from fitted scale
- [ ] Texture offset applied
- [ ] `project()` called once per material
- [ ] Texture appears correctly on hull from each orthogonal view

---

## 6. STEP 5 — Compositing & Blend Modes

### 6.1 Available Blend Modes

| Mode | ID | Description |
|------|----|-------------|
| **Angle Blend** | 1 | Weighted average using `alpha × cos^n(θ)`. Default `n = 3`. Smooth transitions between views. |
| **Layer Stack** | 0 | Original repo behavior. Multiple transparent materials stacked; later materials overwrite earlier ones. |
| **Coverage Map** | 2 | Debug view: red = 0 textures cover, yellow = 1, green = 2, blue = 3+. |
| **Hull Only** | 3 | No texture. Shows raw hull with base color. |

### 6.2 Angle Blend Shader Logic

```glsl
uniform float uPow;  // Sharpness exponent (default 3.0)

float weight = textureAlpha * pow(max(dot(normal, viewDir), 0.0), uPow);
finalColor = (textureRGB * weight + accumulatedColor) / (weight + accumulatedWeight);
```

### 6.3 Occlusion Test (Depth-Based)

> ⚠️ **The original repo does NOT perform occlusion culling.** It only checks if the surface faces the camera. This causes legs, manes, and internal geometry to "print through" onto visible surfaces.

To fix this, add a **depth pre-pass**:

```javascript
// Render depth from each projection camera into a depth texture
for (let k = 0; k < 4; k++) {
    renderer.setRenderTarget(depthTargets[k]);
    renderer.render(scene, projectionCameras[k]);
}
```

In the fragment shader:

```glsl
uniform sampler2D uDepthTex;
uniform float uOccToggle;

float projectedDepth = gl_FragCoord.z;  // Or compute from projection matrix
float storedDepth = texture(uDepthTex, uv).r;
float visible = (projectedDepth <= storedDepth + 0.012) ? 1.0 : 0.0;

if (uOccToggle > 0.5 && visible < 0.5) discard;
```

### 6.4 Checkpoint ✅

- [ ] Blend mode selectable at runtime
- [ ] Angle blend produces smooth transitions (no hard seams)
- [ ] Occlusion test eliminates "print-through" artifacts
- [ ] Coverage map shows no large gray (uncovered) regions except intentional gaps

---

## 7. STEP 6 — Handling Missing Views

### 7.1 Problem

Most reference sets lack a **back view (yaw = 90°)**. The back camera parameters are still computed, but no texture exists.

### 7.2 Solution

1. **Generate the missing back image** using the prompt in `PROMPT-1-IDEA-REFERENCE-IMAGES.md` Section 6.
2. Attach the Front and Right images as style references.
3. Run the generated image through the same preprocessing pipeline (background removal, alpha extraction, edge erosion).
4. Assign it to the back camera slot.

### 7.3 Temporary Placeholder

Until the back image is generated, use a **gray placeholder** (`color: '#bdbdbd'`) for the back material. The coverage map will show this region as uncovered.

### 7.4 Checkpoint ✅

- [ ] Missing view identified
- [ ] AI generation prompt constructed
- [ ] Generated image validated against Section 7 of PROMPT-1 document
- [ ] Placeholder in place until real texture is ready

---

## 8. COMPLETE THREE.JS REFERENCE CODE

```javascript
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import ProjectedMaterial from './src/ProjectedMaterial.js';

// ============================================================
// CONFIGURATION — Replace with your fitted parameters
// ============================================================
const VIEWS = {
    front: {
        img: 'tex_front_B.png',
        yawDeg: 270,
        pitchRad: 0.1,
        halfWidth: 1.2187,
        offset: [0.0017, -0.0042]
    },
    right: {
        img: 'tex_right_B.png',
        yawDeg: 0,
        pitchRad: 0.1,
        halfWidth: 1.1645,
        offset: [-0.0039, 0.0059]
    },
    back: {
        img: 'tex_back_B.png',  // null if missing
        yawDeg: 90,
        pitchRad: 0.1,
        halfWidth: 1.2917,
        offset: [-0.0029, 0.0015]
    },
    left: {
        img: 'tex_left_B.png',
        yawDeg: 180,
        pitchRad: 0.1,
        halfWidth: 1.2041,
        offset: [0.0190, -0.0054]
    }
};

// ============================================================
// SCENE SETUP
// ============================================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(3, 2, 3);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(800, 800);
document.body.appendChild(renderer.domElement);

// ============================================================
// LOAD HULL
// ============================================================
const gltf = await new GLTFLoader().loadAsync('white_mesh_1.glb');
let geometry;
gltf.scene.traverse(o => { if (o.isMesh) geometry = o.geometry; });

geometry.computeVertexNormals();
geometry.clearGroups();

const mesh = new THREE.Mesh(geometry, []);
scene.add(mesh);

// ============================================================
// BUILD PROJECTION CAMERAS & MATERIALS
// ============================================================
const materials = [];
let groupIndex = 0;

for (const [viewName, v] of Object.entries(VIEWS)) {
    if (!v.img) continue;  // Skip missing views

    const yaw = THREE.MathUtils.degToRad(v.yawDeg);
    const c = Math.cos(yaw), s = Math.sin(yaw);
    const cp = Math.cos(v.pitchRad), sp = Math.sin(v.pitchRad);
    const hw = v.halfWidth;

    const cam = new THREE.OrthographicCamera(-hw, hw, hw, -hw, 0.1, 20);
    cam.position.set(-cp * s, sp, cp * c).multiplyScalar(5);
    cam.up.set(sp * s, cp, -sp * c);
    cam.lookAt(0, 0, 0);

    const material = new ProjectedMaterial({
        camera: cam,
        texture: new THREE.TextureLoader().load(v.img),
        textureScale: 1,
        textureOffset: new THREE.Vector2(...v.offset),
        color: '#bdbdbd',
        transparent: true,
    });

    materials.push(material);
    geometry.addGroup(0, Infinity, groupIndex++);
}

mesh.material = materials;

// ============================================================
// PROJECT ALL TEXTURES (Call ONCE per material)
// ============================================================
materials.forEach(m => m.project(mesh));

// ============================================================
// RENDER LOOP
// ============================================================
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
```

---

## 9. VALIDATION & DEBUGGING

### 9.1 Visual Checks

| Check | Expected Result |
|-------|-----------------|
| Rotate to Front view | Front texture aligns with hull silhouette |
| Rotate to Right view | Right texture aligns, no stretching |
| Rotate to Back view | Back texture covers rear (or gray placeholder) |
| Coverage mode | No large red regions except intentional gaps |
| Occlusion test ON | Legs/mane do NOT print through body |

### 9.2 Common Errors & Fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Texture appears mirrored | Yaw angle off by 180° | Verify yaw convention (Front=270°, Right=0°) |
| Texture slides when rotating mesh | Camera not frozen before `project()` | Call `project()` after final camera placement |
| White fringe around edges | Alpha channel not eroded | Apply 2px alpha erosion during preprocessing |
| Texture too small/large | Wrong `halfWidth` | Recalculate `hw = R / (2 × s)` |
| Texture offset from center | Wrong `textureOffset` | Verify `cx/R - 0.5` and `0.5 - cy/R` |
| Backface visible through front | Occlusion test disabled | Enable depth pre-pass and `uOccToggle` |
| Mesh appears black | Missing normals | Call `geometry.computeVertexNormals()` |

### 9.3 Performance Notes

- 4 ProjectedMaterials = 4 texture fetches per fragment. Acceptable for static assets.
- For animated meshes, consider baking the projected texture into a UV map via `BakeTexture` utility to reduce runtime cost.
- Depth pre-pass adds one extra render pass per view. Disable on low-end mobile if needed.

---

## 10. AGENT EXECUTION CHECKLIST

When executing this skill guide, the agent MUST follow this sequence:

### Phase A: Preparation
- [ ] Verify all 4 texture images exist and have alpha channels
- [ ] Verify hull `.glb` file exists and is loadable
- [ ] Confirm coordinate convention (Y-up, Front=+X)

### Phase B: Geometry Setup
- [ ] Load hull geometry
- [ ] Compute vertex normals
- [ ] Clear existing material groups
- [ ] Validate front faces +X

### Phase C: Camera Construction
- [ ] Read fitted parameters (yaw, pitch, scale, cx, cy)
- [ ] Compute `halfWidth = R / (2 × s)` for each view
- [ ] Compute `textureOffset` for each view
- [ ] Construct 4 OrthographicCameras

### Phase D: Material Creation
- [ ] Create ProjectedMaterial for each available view
- [ ] Assign materials to geometry groups
- [ ] Call `project()` on each material exactly once

### Phase E: Compositing
- [ ] Set blend mode (default: Angle Blend, `n = 3`)
- [ ] Enable occlusion test (depth pre-pass)
- [ ] Verify no print-through artifacts

### Phase F: Validation
- [ ] Visually inspect all 4 orthogonal views
- [ ] Run coverage map check
- [ ] Confirm IoU ≥ 0.70 (fit) or ≥ 0.88 (warp)
- [ ] Log any missing views and trigger back-view generation if needed

### Phase G: Export
- [ ] Export final textured mesh as `.glb` with embedded textures
- [ ] Document all camera parameters in a JSON sidecar file
- [ ] Archive warped textures (`_B` set) separately from originals (`_A` set)

---

## APPENDIX A — Parameter Reference Table

| View | Yaw (deg) | Pitch (rad) | Scale (s) | cx | cy | R | halfWidth |
|------|-----------|-------------|-----------|-----|-----|-----|-----------|
| Front | 270 | 0.10 | 157.79 | 189.67 | 171.42 | 384 | 1.217 |
| Right | 0 | 0.10 | 164.99 | 188.50 | 162.26 | 384 | 1.164 |
| Back | 90 | 0.10 | 148.66 | 188.86 | 154.02 | 384 | 1.291 |
| Left | 180 | 0.10 | 159.52 | 197.32 | 172.07 | 384 | 1.204 |

> These are example values from a sea-horse chess piece hull. **Always re-fit for your specific hull.**

---

## APPENDIX B — File Naming Convention

| File | Meaning |
|------|---------|
| `white_mesh_1.glb` | Raw hull from image-to-3D model |
| `tex_front_A.png` | Original front texture |
| `tex_front_B.png` | Warped front texture (use this) |
| `tex_right_A.png` / `_B.png` | Right texture original / warped |
| `tex_back_A.png` / `_B.png` | Back texture original / warped |
| `tex_left_A.png` / `_B.png` | Left texture original / warped |
| `params.json` | Fitted camera parameters |

---

*Document Version: 1.0 — Skill Guide for AI Agents*
*Repository Reference: three-projected-material (marcofugaro)*
*Compatible Agents: Cursor, Claude, GPT-4, Codeium, GitHub Copilot*
