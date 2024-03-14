import './style.css'

import * as THREE from 'three';

import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';

let cubeThree;
let carModel;
let enableFollow = true;
let gui;
let obstacleBody;
let keyboard = {};
let world;
let cannonDebugger;
let timestep = 1 / 60;
let planeBody;
let slipperyMaterial;
let cubeBody;
let groundMaterial;
let obstaclesBodies = [];
let obstaclesMeshes = [];

const scene = new THREE.Scene(); 
const camera = new  THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 10;
camera.position.y = 5;
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});



renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.outputEncoding = THREE.sRGBEncoding;


const geometry = new THREE.TorusGeometry(20,3,16,600);
const material = new THREE.MeshStandardMaterial({color:0xFF6347});
const torus = new THREE.Mesh(geometry, material);
scene.add(torus)

const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(8,8,8);


const ambientLight = new THREE.AmbientLight(0xffffff)
scene.add(pointLight, ambientLight)

const lightHelper = new THREE.PointLightHelper(pointLight)
scene.add(lightHelper)

const axesHelper = new THREE.AxesHelper(100);
scene.add(axesHelper);

// const gridHelper = new THREE.GridHelper(200,50);
// scene.add(gridHelper)

const controls = new OrbitControls(camera, renderer.domElement);
controls.rotateSpeed = 1.0
controls.zoomSpeed = 1.2
controls.enablePan = false
controls.dampingFactor = 0.2
controls.minDistance = 10
controls.maxDistance = 500
controls.enabled = false

function addStar() {
  const geometry = new THREE.SphereGeometry(0.25,24,24);
  const material = new THREE.MeshStandardMaterial({color:0xffffff});
  const star = new THREE.Mesh(geometry,material);

  const [x,y,z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));

  star.position.set(x,y,z);

  scene.add(star)
}

Array(200).fill().forEach(addStar);


// Configurar el cargador GLTF
const loader = new GLTFLoader();
const modelPath = './car/uploads_files_2815692_Mclaren+Senna.glb';

// // Cargar el modelo
// loader.load(modelPath, (gltf) => {
//     carModel = gltf.scene;
//     scene.add(carModel);
// });


function addRaceTrack() {

  const curveSegment1 = createCurveSegment(20, Math.PI / 2); // Curva a la derecha
  const straightSegment2 = createStraightSegment(20,20);
  const curveSegment2 = createCurveSegment(20, -Math.PI / 2); // Curva a la izquierda
  const straightSegment4 = addPlane(20,200);
  const straightSegment5 = addPlane(20,150);

  curveSegment1.position.set(30, 0, 10); // Colocar la curva a la derecha
  straightSegment2.position.set(20, 0, 20); // Colocar el segundo segmento recto
  curveSegment2.position.set(10, 0, 10); // Colocar la curva a la izquierda
  straightSegment4.position.set(0, 0, -90);
  straightSegment5.position.set(40,0,-90);
  
  scene.add( curveSegment1, straightSegment2, curveSegment2,straightSegment4,  straightSegment5);
}

function createStraightSegment(weight,length) {
  // Crear geometría y material para un segmento recto
  const geometry = new THREE.BoxGeometry(weight, 0.1, length);
  const material = new THREE.MeshBasicMaterial({ color: 'white' });
  // Crear un mesh con la geometría y el material
  const segment = new THREE.Mesh(geometry, material);
  return segment;
}

function createCurveSegment(radius, angle) {
  // Crear geometría y material para un segmento curvo
  const geometry = new THREE.CylinderGeometry(radius, radius, 0.1, 32, 1, false, 0, angle);
  const material = new THREE.MeshBasicMaterial({ color: 'red' });
  // Crear un mesh con la geometría y el material
  const segment = new THREE.Mesh(geometry, material);
  return segment;
}



// Plano en el cual se mueve el cubo
function addPlaneBody(){
  groundMaterial = new CANNON.Material('ground')
  const planeShape = new CANNON.Box(new CANNON.Vec3(10, 0.01, 100));
	planeBody = new CANNON.Body({ mass: 0, material: groundMaterial });
	planeBody.addShape(planeShape);
	planeBody.position.set(0, 0, -90);
	world.addBody(planeBody);
}
function addPlane(weight,length){
  let geometry =  new THREE.BoxGeometry(weight, 0, length);
    // let geometry =  new THREE.BoxGeometry(20, 0, 200);
    let material = new THREE.MeshBasicMaterial({color:'gray'});
    let planeThree = new THREE.Mesh(geometry, material);

    return planeThree
  }


 async function addObstacleBody(){


  const gltfLoader = new GLTFLoader();
  const modelPath = './car/WoodenCrate.glb'; // Ruta al archivo .glb del obstáculo
  const obstacleLoadded = await gltfLoader.loadAsync(modelPath);
  let obstacle = obstacleLoadded.scene;

  // Escalar el obstáculo según tus necesidades
  const scaleFactor = 0.4; // Factor de escala, ajusta según sea necesario
  obstacle.scale.set(scaleFactor, scaleFactor, scaleFactor);

  obstacle.position.set(0, 1, -10);
  scene.add(obstacle);
  obstaclesMeshes.push(obstacle);

  }

  function addObstaclePhysics(){
    let cubeShape = new CANNON.Box(new CANNON.Vec3(1,1,1));
    obstacleBody = new CANNON.Body({mass: 100, material:slipperyMaterial});
    obstacleBody.addShape(cubeShape);
    obstacleBody.position.set(0,1,-10);
    world.addBody(obstacleBody);
    obstaclesBodies.push(obstacleBody);
  }

// cubo en el cual se mueve el carro
async function addCube(){

  const gltfLoader = new GLTFLoader().setPath( './car/' );
	const carLoaddedd = await gltfLoader.loadAsync( 'uploads_files_2815692_Mclaren+Senna_reves.glb' );
  cubeThree = carLoaddedd.scene.children[0];

  // let geometry = new THREE.BoxGeometry(2,2,2);
  // let material = new THREE.MeshBasicMaterial({color: 'pink'});
  // cubeThree = new THREE.Mesh(geometry, material);
  // cubeThree.position.set(0, 1, 0);
  // console.log(cubeThree, "cube");
  scene.add(cubeThree);
}
function addCubePhysics(){
  slipperyMaterial = new CANNON.Material('slippery');
  let cubeShape = new CANNON.Box(new CANNON.Vec3(1,1,1));
  cubeBody = new CANNON.Body({mass: 100, material:slipperyMaterial});
  cubeBody.addShape(cubeShape);
  cubeBody.position.set(0,2,-5);
  world.addBody(cubeBody);
}

function addContactMaterials(){
    // Initialize slipperyMaterial here

  const slippery_ground = new CANNON.ContactMaterial(groundMaterial, slipperyMaterial, {
    friction: 0.0001,
    restitution: 0.3, //bounciness
    contactEquationStiffness: 1e8,
    contactEquationRelaxation: 3,
  })

  // We must add the contact materials to the world
  world.addContactMaterial(slippery_ground)

}

// // Manejar eventos de teclado
// document.addEventListener('keydown', onKeyDown);
// document.addEventListener('keyup', onKeyUp);

// const keys = {
//     ArrowUp: false,
//     ArrowDown: false,
//     ArrowLeft: false,
//     ArrowRight: false
// };

// function onKeyDown(event) {
//     keys[event.key] = true;
// }

// function onKeyUp(event) {
//     keys[event.key] = false;
// }

// Definir la gravedad
const gravity = new THREE.Vector3(0, -0.1, 0); // Ajusta según sea necesario


function followPlayer(){
    camera.position.x = cubeThree.position.x;
    camera.position.y = cubeThree.position.y + 5;
    camera.position.z = cubeThree.position.z + 10;
}

function addKeysListener(){
    window.addEventListener('keydown', function(event){
      keyboard[event.keyCode] = true;
    } , false);
    window.addEventListener('keyup', function(event){
      keyboard[event.keyCode] = false;
    } , false);
  }

  function movePlayer(){
    // if(keyboard[87]) cubeBody.translateZ(-0.1);
    // if(keyboard[83]) cubeBody.translateZ(0.1);
    // if(keyboard[65]) cubeBody.rotateY(0.01);
    // if(keyboard[68]) cubeBody.rotateY(-0.01);


        // up letter W
    const strengthWS = 200;
    const forceForward = new CANNON.Vec3(0, 0, -strengthWS)
    if(keyboard[87]) cubeBody.applyLocalForce(forceForward);

    // down letter S
    const forceBack = new CANNON.Vec3(0, 0, strengthWS)
    if(keyboard[83]) cubeBody.applyLocalForce(forceBack);

    // left letter A
    const strengthAD = 50;
    const forceLeft= new CANNON.Vec3(0, strengthAD, 0)
    if(keyboard[65]) cubeBody.applyTorque(forceLeft);

    // right letter D
    const forceRigth= new CANNON.Vec3(0, -strengthAD, 0)
    if(keyboard[68]) cubeBody.applyTorque(forceRigth);
  }

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  
  movePlayer();

  if(enableFollow) followPlayer();



  world.step(timestep);
  cannonDebugger.update();

  cubeThree.position.copy(cubeBody.position);
  cubeThree.position.y = cubeBody.position.y - 0.58;
  cubeThree.quaternion.copy(cubeBody.quaternion);

  // Invertir la rotación del cubo
  cubeThree.rotation.y += Math.PI;



  for (let i = 0; i < obstaclesBodies.length; i++) {
    obstaclesMeshes[i].position.copy(obstaclesBodies[i].position);
    obstaclesMeshes[i].position.y = obstaclesBodies[i].position.y - 1;
		obstaclesMeshes[i].quaternion.copy(obstaclesBodies[i].quaternion);
	}




    // Movimiento del carro
    // const movementSpeed = 0.1;
    // const rotationSpeed = 0.05;

    // if (carModel) {
    //     // Calcula la dirección de movimiento basada en la rotación del carro
    //     // const moveDirection = new THREE.Vector3(0, 0, -1); // Hacia adelante por defecto
    //     // moveDirection.applyQuaternion(carModel.quaternion);

    //     // // Aplicar gravedad
    //     // carModel.position.add(gravity);


    //     // // Dentro de la función animate()
    //     // if (carModel && torus) {
    //     //   // Actualizar las cajas envolventes
    //     //   const carBoundingBox = new THREE.Box3().setFromObject(carModel);
    //     //   const torusBoundingBox = new THREE.Box3().setFromObject(torus);

    //     //   // Comprobar si las cajas envolventes se intersectan
    //     //   if (carBoundingBox.intersectsBox(torusBoundingBox)) {
    //     //       console.log('¡Colisión detectada!');
    //     //   } else {
    //     //       // No hay colisión, mover el carro
    //     //       carModel.position.addScaledVector(moveDirection, movementSpeed);
    //     //   }
    //     // }

    //     // // Avance o retroceso basado en las teclas presionadas
    //     // if (keys.ArrowDown) {
    //     //     carModel.position.addScaledVector(moveDirection, movementSpeed);
    //     // }
    //     // if (keys.ArrowUp) {
    //     //     carModel.position.addScaledVector(moveDirection, -movementSpeed);
    //     // }

    //     // // Rotación del carro basada en las teclas presionadas
    //     // if (keys.ArrowLeft) {
    //     //     carModel.rotation.y += rotationSpeed;
    //     // }
    //     // if (keys.ArrowRight) {
    //     //     carModel.rotation.y -= rotationSpeed;
    //     // }
    // }

    // Rotar el torus
    torus.rotation.z += 0.01;
    torus.rotation.y += 0.005;
    torus.rotation.x += 0.01;

    // controls.update();


}

function initCannon() {
	// Setup world
	world = new CANNON.World();
	world.gravity.set(0, -9.8, 0);

  

	initCannonDebugger();
}

function initCannonDebugger(){
    cannonDebugger = new CannonDebugger(scene, world, {
          onInit(body, mesh) {
        // mesh.visible = false;
              // Toggle visibiliy on "d" press
              document.addEventListener("keydown", (event) => {
                  if (event.key === "f") {
                      mesh.visible = !mesh.visible;
                  }
              });
          },
      });
  }

function addGUI(){
    gui = new GUI();
    const options = {
          orbitsControls: false
      }
  
    gui.add(options, 'orbitsControls').onChange( value => {
          if (value){
              controls.enabled = true;
              enableFollow = false;
          }else{
              controls.enabled = false;
              enableFollow = true;
          }
      });
    }


initCannon();

// Llamar a la función para agregar la pista de carreras al iniciar el juego
addRaceTrack();

addPlaneBody()
addPlane();

addCubePhysics();
addCube();

addObstaclePhysics();
addObstacleBody();

addContactMaterials();

addKeysListener();
addGUI();

animate();