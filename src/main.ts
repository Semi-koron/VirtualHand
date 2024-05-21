import * as BABYLON from "@babylonjs/core";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

type position = {
  xpos: number;
  ypos: number;
  zpos: number;
};
let sphere: BABYLON.Mesh[] = [];
const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const source = document.getElementById("source") as HTMLVideoElement;

console.log("test1");
let time = -1;
let camera: boolean = false;
let pos: position[] = Array.from({ length: 21 }, () => ({
  xpos: 0,
  ypos: 0,
  zpos: 0,
}));

const engine = new BABYLON.Engine(canvas, true);

const createScene = () => {
  const scene = new BABYLON.Scene(engine);

  scene.createDefaultCameraOrLight(true, false, true);
  for (let i = 0; i < 21; i++) {
    sphere[i] = BABYLON.MeshBuilder.CreateSphere(
      "sphere",
      { diameter: 0.5 },
      scene
    );
    sphere[i].position = new BABYLON.Vector3(
      pos[i].xpos,
      pos[i].ypos,
      pos[i].zpos
    );
  }
  console.log("done");
  return scene;
};

const scene = createScene();

const cameraSetting = () => {
  if (!camera) {
    camera = true;
    console.log("camera");
  }
  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then((stream) => {
      source.srcObject = stream;
      source.addEventListener("loadeddata", createHandLandmarker);
      source.play();
    })
    .catch((error) => {
      console.log("Failed to access camera:", error);
    });
};

cameraSetting();

const createHandLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );
  const handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "CPU",
    },
    numHands: 2,
  });
  const videoChange = async () => {
    handLandmarker.setOptions({ runningMode: "VIDEO" }).then(() => {
      if (source.currentTime !== time) {
        const detections = handLandmarker.detectForVideo(source, time);
        time = source.currentTime;
        if (detections.landmarks.length > 0) {
          for (let i = 0; i < 21; i++) {
            pos[i].xpos = detections.landmarks[0][i].x * 10;
            pos[i].ypos = detections.landmarks[0][i].y * -10;
            pos[i].zpos = detections.landmarks[0][i].z * 10;
          }
          console.log(pos);
        }
      }
    });

    requestAnimationFrame(() => {
      videoChange();
    });
  };
  videoChange();
};

engine.runRenderLoop(() => {
  for (let i = 0; i < 21; i++) {
    sphere[i].position.x = pos[i].xpos;
    sphere[i].position.y = pos[i].ypos;
    sphere[i].position.z = pos[i].zpos;
  }
  scene.render();
});

window.addEventListener("resize", function () {
  engine.resize();
});
