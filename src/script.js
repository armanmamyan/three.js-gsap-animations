console.clear();

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "https://cdn.skypack.dev/gsap/ScrollTrigger";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

gsap.registerPlugin(ScrollTrigger);

/** constant */
const modelsToLoad = [
  { 
name: "witch", 
  file: "witch.gltf" ,
  group: new THREE.Group(),
},
  { name: "bear", group: new THREE.Group(), file: "bear.gltf" },
];

const COLORS = {
  background: "white",
  light: "#fff",
  sky: "#aaaaff",
  ground: "#88ff88",
  blue: "steelblue"
};

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const PI = Math.PI;
const models = {};
const clones = {};
let cameras = null;
let bears = null;
let witches = null
let cameraTarget = new THREE.Vector3(0, 3, 0);

/**
 * Scroll Animations
 */

const desktopAnimation = () => {
    let section = 0;
    // Tell animation where to start.
    const tl = gsap.timeline({
        defaults: {
            duration: 1,
            ease: "power2.inOut"
        },
        scrollTrigger: {
            trigger: ".page",
            start: "top top",
            end: "bottom bottom",
            scrub: .1,
            markers: true
        }
    });
    tl.to(witches.position, {x: 1}, section);
    tl.to(bears.position, {x: -1}, section);
    tl.to(cameraTarget, {y: 1}, section)
    tl.to(cameras.position, {z: 4,  ease: "power2.out"}, section)
    // Section 2
    section += 1;
    tl.to(witches.position, {x: 6, ease: "power4.in"}, section);
    tl.to(bears.position, {x: -1, z: 1 }, section);
    tl.to(views[1], {height: 1, ease: 'linear'}, section)

    // Section 3
    section += 1;
    tl.to(witches.position, {x: 0, z: 1, ease: "power4.out" }, section);
    tl.to(bears.position, {x: -6, z: 0, ease: "power4.in" }, section);

     // Section 4
     section += 1;
     tl.to(witches.position, {x: 1, z: 0 }, section);
     tl.to(bears.position, {x: -1, z: 0 }, section);
     tl.to(views[1], {height: 0, bottom: 1, ease: "none" }, section);
};

const setupAnimation = () => {
    cameras = {
        position: [views[0].camera.position, views[1].camera.position]
    }
    witches = {
        position: [models.witch.position, clones.witch.position],
        rotation: [models.witch.rotation, clones.witch.rotation]
    }
    bears = {
        position: [models.bear.position, clones.bear .position],
        rotation: [models.bear.rotation, clones.bear.rotation]
    }
    gsap.set(witches.position, {x: 6})
    gsap.set(bears.position, {x: -6})
    ScrollTrigger.matchMedia({"(prefers-reduced-motion: no-preference)" : desktopAnimation })
}

/**
 * Loader
 */

const loadingManager = new THREE.LoadingManager(setupAnimation);
const gltfLoader = new GLTFLoader(loadingManager);

/**
 * Base
 */
// Canvas
const canvas = document.querySelector(".canvas-container");

// Scene
const wireframeMaterial = new THREE.MeshBasicMaterial({color: "white", wireframe: true})
const scenes = {
    real: new THREE.Scene(),
    wire: new THREE.Scene()
}

scenes.wire.overrideMaterial = wireframeMaterial;

const views = [
    {
        height: 1,
        bottom: 0,
        scene: scenes.real,
        camera: null
    },
    {
        height: 0,
        bottom: 0,
        scene: scenes.wire,
        camera: null
    }
];

scenes.wire.background = new THREE.Color(COLORS.blue);
scenes.real.background = new THREE.Color(COLORS.background);
scenes.real.fog = new THREE.Fog(COLORS.background, 15, 20);



// Camera
views.forEach( view => {
    view.camera = new THREE.PerspectiveCamera(
      75,
      sizes.width / sizes.height,
      0.1,
      100
    );
    view.camera.position.set(0, 1, 0) 
    view.scene.add(view.camera);
})

// Lights
const directionalLight = new THREE.DirectionalLight(COLORS.light, 2);
directionalLight.castShadow = true;
directionalLight.shadow.camera.far = 10;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(2, 5, 3);

scenes.real.add(directionalLight);

const hemisphereLight = new THREE.HemisphereLight(
  COLORS.sky,
  COLORS.ground,
  0.5
);
scenes.real.add(hemisphereLight);

// Elements
const plane = new THREE.PlaneGeometry(100, 100);
const planeMaterial = new THREE.MeshStandardMaterial({ color: COLORS.ground });
const floor = new THREE.Mesh(plane, planeMaterial);
floor.receiveShadow = true;
floor.rotateX(-PI * 0.5);

scenes.real.add(floor);

// Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
});

// Smth that can be carry on project to project
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 5;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
canvas.appendChild(renderer.domElement);

// Load Models
modelsToLoad.forEach((item) =>
  gltfLoader.load(item.file, (model) => {
    model.scene.traverse((child) => {
      if (child?.isMesh || child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    item.group.add(model.scene)
    scenes.real.add(item.group);
    models[item.name] = item.group;
    const clone = item.group.clone();
    clones[item.name] = clone;
    scenes.wire.add(clone);
  })
);

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  views.forEach(view => {
    view.camera.aspect = sizes.width / sizes.height;
    view.camera.updateProjectionMatrix();
  })

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Animate
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  views.forEach(view => {
    let bottom = sizes.height * view.bottom;
    let height = sizes.height * view.height;
    view.camera.lookAt(cameraTarget);
    // Render
    renderer.setViewport(0,0,sizes.width, sizes.height);
    renderer.setScissor(0, bottom, sizes.width, height);
    renderer.setScissorTest(true);
    renderer.render(view.scene, view.camera);
  })
  
  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
