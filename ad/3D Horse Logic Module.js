// 3D Cyber Horse Pawn Engine & Color Manager
(function(window) {
    let scene, camera, renderer, controls;
    let bodyMaterial, eyeMaterial, neonMaterial;
    let horseGroup;

    function init3D(canvasId, containerId) {
        const container = document.getElementById(containerId);
        const canvas = document.getElementById(canvasId);

        // 1. Scene
        scene = new THREE.Scene();

        // 2. Camera
        camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(0, 3.2, 6.0);

        // 3. Renderer
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // 4. Controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.target.set(0, 1.8, 0);

        // 5. Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
        dirLight.position.set(5, 10, 7);
        scene.add(dirLight);

        // 6. Build Horse Model
        buildHorseModel();

        // 7. Event listeners
        window.addEventListener('resize', () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });

        // 8. Render loop
        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }
        animate();
    }

    function buildHorseModel() {
        horseGroup = new THREE.Group();

        // Materials Initialization
        bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x191e28,
            roughness: 0.3,
            metalness: 0.85
        });

        eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0xff00b4,
            emissive: 0xff00b4,
            emissiveIntensity: 0.9,
            roughness: 0.2
        });

        neonMaterial = new THREE.MeshStandardMaterial({
            color: 0x00d2ff,
            emissive: 0x00d2ff,
            emissiveIntensity: 0.95,
            roughness: 0.1
        });

        // Pedestal Base (Bệ đỡ chuẩn)
        const baseBot = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.35, 32), bodyMaterial);
        baseBot.position.y = 0.175;
        horseGroup.add(baseBot);

        const baseRing = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.035, 16, 48), neonMaterial);
        baseRing.rotation.x = Math.PI / 2;
        baseRing.position.y = 0.175;
        horseGroup.add(baseRing);

        const baseMid = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 0.4, 32), bodyMaterial);
        baseMid.position.y = 0.55;
        horseGroup.add(baseMid);

        // Horse Head / Neck Shape (Extrude Geometry)
        const shape = new THREE.Shape();
        shape.moveTo(-0.7, -0.2);
        shape.bezierCurveTo(-1.1, 1.2, -1.2, 2.6, -0.7, 3.8);
        shape.bezierCurveTo(-0.8, 4.5, -0.6, 5.2, -0.2, 5.5);
        shape.lineTo(0.0, 5.6);
        shape.bezierCurveTo(0.1, 4.9, 0.3, 4.5, 0.6, 4.3);
        shape.bezierCurveTo(1.1, 4.0, 1.9, 3.4, 2.2, 2.8);
        shape.bezierCurveTo(2.3, 2.4, 1.9, 2.2, 1.5, 2.3);
        shape.bezierCurveTo(1.2, 2.1, 0.9, 1.8, 0.7, 1.3);
        shape.bezierCurveTo(0.5, 0.7, 0.6, 0.2, 0.7, -0.2);
        shape.closePath();

        const extrudeSettings = {
            steps: 2,
            depth: 0.7,
            bevelEnabled: true,
            bevelThickness: 0.2,
            bevelSize: 0.15,
            bevelSegments: 5
        };

        const headGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        headGeo.center();
        const headMesh = new THREE.Mesh(headGeo, bodyMaterial);
        headMesh.position.set(0, 2.1, 0);
        horseGroup.add(headMesh);

        // Eyes (Đúng vị trí mắt ngựa)
        const eyeGeo = new THREE.BoxGeometry(0.38, 0.16, 0.76);
        
        const eyeRight = new THREE.Mesh(eyeGeo, eyeMaterial);
        eyeRight.position.set(0.42, 2.65, 0);
        eyeRight.rotation.z = -0.12;
        horseGroup.add(eyeRight);

        const eyeLeft = new THREE.Mesh(eyeGeo, eyeMaterial);
        eyeLeft.position.set(-0.42, 2.65, 0);
        eyeLeft.rotation.z = 0.12;
        horseGroup.add(eyeLeft);

        // Neon Circuit Stripes
        const neonGroup = new THREE.Group();

        const createNeonTube = (curvePoints, zOffset) => {
            const curve = new THREE.CatmullRomCurve3(curvePoints);
            const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.03, 8, false);
            const tube = new THREE.Mesh(tubeGeo, neonMaterial);
            if (zOffset) tube.position.z = zOffset;
            return tube;
        };

        const maneCurve = [
            new THREE.Vector3(0.4, 1.2, 0.38),
            new THREE.Vector3(0.7, 1.9, 0.38),
            new THREE.Vector3(0.85, 2.5, 0.38),
            new THREE.Vector3(0.2, 3.2, 0.38)
        ];
        neonGroup.add(createNeonTube(maneCurve, 0));
        neonGroup.add(createNeonTube(maneCurve, -0.76));

        const faceCurve = [
            new THREE.Vector3(-0.5, 2.2, 0.38),
            new THREE.Vector3(-0.1, 2.0, 0.38),
            new THREE.Vector3(0.2, 1.4, 0.38),
            new THREE.Vector3(0.1, 0.7, 0.38)
        ];
        neonGroup.add(createNeonTube(faceCurve, 0));
        neonGroup.add(createNeonTube(faceCurve, -0.76));

        horseGroup.add(neonGroup);
        scene.add(horseGroup);
    }

    // Dynamic Color Customizers
    function setNeonColor(r, g, b) {
        if (!neonMaterial) return;
        const color = new THREE.Color(r / 255, g / 255, b / 255);
        neonMaterial.color = color;
        neonMaterial.emissive = color;
    }

    function setEyeColor(r, g, b) {
        if (!eyeMaterial) return;
        const color = new THREE.Color(r / 255, g / 255, b / 255);
        eyeMaterial.color = color;
        eyeMaterial.emissive = color;
    }

    function setBodyColor(r, g, b) {
        if (!bodyMaterial) return;
        bodyMaterial.color = new THREE.Color(r / 255, g / 255, b / 255);
    }

    // Export module APIs
    window.HorseApp = {
        init: init3D,
        setNeonColor: setNeonColor,
        setEyeColor: setEyeColor,
        setBodyColor: setBodyColor
    };
})(window);