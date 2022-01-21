import React from 'react';
import * as dat from 'dat.gui'
import * as THREE from "three";
import TWEEN from '@tweenjs/tween.js'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import ProgressBar from '../components/ProgressBar/ProgressBar';
import ScrollController from '../components/ScrollController/ScrollController';

class Tower extends React.Component{
    constructor(props){
        super(props)

        this.state = {
            loaded: false,
            progress: 0,
            progressText: "",
            doRouting: false,
            target: null,
            useOrthoCam: true,
            camDestination: ""
        }
        
        //Core Three.js objects
        this.scene = null 
        this.mixer = null       //animation controller
        this.renderer = null    
        this.camera = null
        this.camHelper = null
        this.controls = null    //camera controller
        this.route = this.route.bind(this)
    }
    route(target) {
        if(this.state.doRouting){
            this.setState({target: target})
        }
    }
    navigate = (direction) => {
        if(this.state.loaded){
            this.setState({camDestination: direction})
        }
    }
    componentDidMount(){
        //Setup GUI
        let gui = new dat.GUI({ closed: true, width: 700})
        // dat.GUI.toggleHide();

        //Setup Three.js scene
        this.scene = new THREE.Scene()

        //Setup listener data
        const mouse = new THREE.Vector2()
        const clickableObjects = []
        let currentIntersect = null

        const sizes = {
            width: window.innerWidth,
            height: window.innerHeight,
            aspect: window.innerWidth/window.innerHeight
        }

        //Camera settings
        const perspecitveCameraSettings = {
            floor1:{
                cameraPositionX: 5,
                cameraPositionY: 5,
                cameraPositionZ: 5,
                fov: 45,
                targetx: 0,
                targety: 0,
                targetz: 0
            },
            floor2:{
                cameraPositionX: 5,
                cameraPositionY: 5,
                cameraPositionZ: 5,
                fov: 45,
                targetx: 0,
                targety: 0,
                targetz: 0
            },
            floor3:{
                cameraPositionX: 5,
                cameraPositionY: 5,
                cameraPositionZ: 5,
                fov: 45,
                targetx: 0,
                targety: 0,
                targetz: 0
            },
            floor4:{
                cameraPositionX: 5,
                cameraPositionY: 5,
                cameraPositionZ: 5,
                fov: 45,
                targetx: 0,
                targety: 0,
                targetz: 0
            } 
        }
        const frustumSize = 500

        const orthographicCameraSettings = {
            floor1:{
                left: 0.5 * frustumSize * sizes.aspect/ (-2),
                right: 0.5 * frustumSize * sizes.aspect/ (2),
                top: frustumSize / 2,
                bottom: frustumSize/(-2),
                near: 1,
                far: 10000,
                x: 23,
                y: 12,
                z: 7,
                targetx: -100,
                targety: -14,
                targetz: -3,
            },
            floor2:{
                left: 0.5 * frustumSize * sizes.aspect/ (-2),
                right: 0.5 * frustumSize * sizes.aspect/ (2),
                top: frustumSize / 2,
                bottom: frustumSize/(-2),
                near: 1,
                far: 10000,
                x: 23,
                y: 32,
                z: 7,
                targetx: -100,
                targety: 6,
                targetz: -3,
            },
            floor3:{
                left: 0.5 * frustumSize * sizes.aspect/ (-2),
                right: 0.5 * frustumSize * sizes.aspect/ (2),
                top: frustumSize / 2,
                bottom: frustumSize/(-2),
                near: 1,
                far: 10000,
                x: 23,
                y: 52,
                z: 7,
                targetx: -100,
                targety: 26,
                targetz: -3,
            },
            floor4:{
                left: 0.5 * frustumSize * sizes.aspect/ (-2),
                right: 0.5 * frustumSize * sizes.aspect/ (2),
                top: frustumSize / 2,
                bottom: frustumSize/(-2),
                near: 1,
                far: 10000,
                x: 23,
                y: 72,
                z: 7,
                targetx: -100,
                targety: 46,
                targetz: -3,
            }
        }

        //tweening params
        const tweenParams = {
            animationDuration: 1000,
            positionChangeFactor: 1,
        }

        /**
        * Set Up File loaders-----------------------------------------------------------------------
        */


        //Loading Manager
        const loadingManager = new THREE.LoadingManager()

        //Enable cache
        THREE.Cache.enabled = true

        loadingManager.onStart = function ( url, itemsLoaded, itemsTotal ) {
            console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
        };
        loadingManager.onLoad = () => {
            //Set loaded flag and print
            this.setState({loaded: true})
            console.log( 'Loading complete!');
        };
        loadingManager.onProgress = ( url, itemsLoaded, itemsTotal ) => {
            this.setState({progress: (100/itemsTotal) * itemsLoaded})
            this.setState({progressText: 'Loading file: ' + url})
            console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
        };

        loadingManager.onError = function ( url ) {
            console.log( 'There was an error loading ' + url );
        };

        //Loaders
        const dracoLoader = new DRACOLoader(loadingManager)                     //Compressed file loader
        dracoLoader.setDecoderPath('./draco/')
        const gltfLoader = new GLTFLoader(loadingManager)                       //glTF format loader
        gltfLoader.setDRACOLoader(dracoLoader)                          
        // const textureLoader = new THREE.TextureLoader(loadingManager)           //Texture (image) loader
        // const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager)   //Cube texture (sky texture) loader
        // const fontLoader = new FontLoader(loadingManager)

        //Helper functions for main file loading
        function loadWithPromise(url, loader){
            return new Promise((resolve, reject) => {
                loader.load(url, data=> resolve(data), null, reject);
            });
        }

        //Load model and image together
        async function doCombinedLoading(url, loader, textureUrl, textureLoader, scene){
            const gltfData = await loadWithPromise(url, loader)
            const texture = await loadWithPromise(textureUrl, textureLoader)
            texture.flipY = false
            const material = new THREE.MeshBasicMaterial({ map: texture})
            gltfData.scene.traverse((child) => {child.material = material});    
            let model = gltfData.scene
            applyModelSettings(model)
            scene.add(model)
            return model
        }
        
        //Load single asset
        async function doModelLoading(url, material, loader, scene){
            const data = await loadWithPromise(url, loader)  
            data.scene.traverse((child) => {child.material = material});      
            let model = data.scene
            applyModelSettings(model)
            scene.add(model)
            return model
        }

        function applyModelSettings(model){
            model.scale.set(10,10,10)
        }

        /**
        * Event Handlers -------------------------------------------------------------------
        */


        const handleResize = () => {
            //Update sizes
            sizes.width = window.innerWidth
            sizes.height = window.innerHeight
            sizes.aspect = sizes.width/ sizes.height
    
            //Update camera
            if(this.camera){
                if(this.state.useOrthoCam){
                    this.camera.left = - 0.5 * frustumSize * sizes.aspect / 2;
                    this.camera.right = 0.5 * frustumSize * sizes.aspect / 2;
                    this.camera.top = frustumSize / 2;
                    this.camera.bottom = - frustumSize / 2;
                    switch(true){
                        case (sizes.width <= 700):
                            this.camera.zoom = 6;
                            break;
                        case (sizes.width <= 1000):
                            this.camera.zoom = 7;
                            break;
                        default:
                            this.camera.zoom = 8;
                            break;
                    }
                } else {
                    this.camera.aspect = 0.5 * sizes.aspect
                }
                this.camera.updateProjectionMatrix()
            }
    
            //Update renderer
            if(this.renderer){
                this.renderer.setSize(sizes.width, sizes.height)
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
            }
            //on every loaded resize
            if(this.state.loaded){
                //do something
            }
        }

        const handleMouseMove = (evt) => {
            mouse.x = evt.clientX / sizes.width * 2 - 1
            mouse.y = - (evt.clientY / sizes.height) * 2 + 1
        }
    
        const handleClick = () => {
            if(currentIntersect)
            {
                switch(currentIntersect.object)
                {
                    // case object1:
                    //     console.log('click on object 1')
                    //     removeListeners()
                    //     this.route("/projects")
                    //     break
                    // case button1:
                    //     changeScene(perspecitveCameraSettings.cam2, this.camera, this.controls)
                    //     break
                    default:
                        console.log("Unhandled Click Event: ", currentIntersect.object)
                        break
                }
            } 
        }

        //Attatch listeners to window
        function attatchListeners(){
            window.addEventListener('resize', handleResize)
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('click', handleClick) 
        }


        // Remove Listeners From Window, also dismantles gui
        function removeListeners(){
            window.removeEventListener('resize',handleResize)
            window.removeEventListener('mousemove',handleMouseMove)
            window.removeEventListener('click',handleClick)

            //Hide the gui first so it doesnt require reload to go away
            gui.hide()
            gui = null
        }

        /**
         * Add Objects to Scene ----------------------------------------------------------------
         */

        this.scene.background = new THREE.Color( 'skyblue');
        
        //Loaded Data
        let BuildingGroup = new THREE.Group()
        const demoMaterial = new THREE.MeshStandardMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
        const demoMaterial1 = new THREE.MeshStandardMaterial( {color: 0xff0000, side: THREE.DoubleSide} );
        const demoMaterial2 = new THREE.MeshStandardMaterial( {color: 0x00ff00, side: THREE.DoubleSide} );
        const demoMaterial3 = new THREE.MeshStandardMaterial( {color: 0x0000ff, side: THREE.DoubleSide} );
        const floor1 = doModelLoading('/models/floor1.glb',demoMaterial, gltfLoader, BuildingGroup)
        const floor2 = doModelLoading('/models/floor2.glb',demoMaterial1, gltfLoader, BuildingGroup)
        const floor3 = doModelLoading('/models/floor3.glb',demoMaterial2, gltfLoader, BuildingGroup)
        const floor4 = doModelLoading('/models/floor4.glb',demoMaterial3, gltfLoader, BuildingGroup)

        BuildingGroup.rotation.y = Math.PI / 4;
        this.scene.add(BuildingGroup)

        //Lights
        const lightColors = {
            ambientLightColor: 0xffffff,
            directionalLightColor: 0xffffff
        }

        const ambientLight = new THREE.AmbientLight(lightColors.ambientLightColor, 0.8)
        ambientLight.visible = true
        this.scene.add(ambientLight)

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
        const targetObject = new THREE.Object3D()
        directionalLight.castShadow = true
        directionalLight.shadow.mapSize.set(1024, 1024)
        directionalLight.shadow.camera.far = 15
        directionalLight.shadow.camera.left = - 7
        directionalLight.shadow.camera.top = 7
        directionalLight.shadow.camera.right = 7
        directionalLight.shadow.camera.bottom = - 7
        directionalLight.position.set(5, 5, 5)
        directionalLight.visible = true
        directionalLight.target = targetObject
        this.scene.add(directionalLight, targetObject)

        const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 0.2)
        directionalLightHelper.visible = false
        this.scene.add(directionalLightHelper)

        /**
         * GUI ---------------------------------------------------------------------------------
         */

        //Debug functions
        const debugObject = {}
        
        // Camera GUI
        debugObject.logCamera = () => {
            console.log("Camera Details")
            console.log(this.camera)
            console.log(this.controls)
        }

        var cameraGUI = gui.addFolder("Camera")
        cameraGUI.add(debugObject, 'logCamera')

        //Lights GUI
        var lightsGUI = gui.addFolder("Lighting")

        var ambientGUI = lightsGUI.addFolder("Ambient Light")
        ambientGUI.addColor(lightColors, 'ambientLightColor').onChange(() =>{ambientLight.color.set(lightColors.ambientLightColor)}).name("Color")
        ambientGUI.add(ambientLight, 'intensity').min(0).max(1).step(0.001)
        ambientGUI.add(ambientLight, 'visible')

        var directionalGUI = lightsGUI.addFolder("Directional Light")
        directionalGUI.addColor(lightColors, 'directionalLightColor').onChange(() =>{directionalLight.color.set(lightColors.directionalLightColor)}).name("Color")
        directionalGUI.add(directionalLight, 'intensity').min(0).max(5).step(0.001)
        directionalGUI.add(directionalLight.position, 'x').min(- 20).max(20).step(0.001).name("Light: x")
        directionalGUI.add(directionalLight.position, 'y').min(- 20).max(20).step(0.001).name("Light: y")
        directionalGUI.add(directionalLight.position, 'z').min(- 20).max(20).step(0.001).name("Light: z")
        directionalGUI.add(targetObject.position, 'x').min(- 20).max(20).step(0.001).onChange(() => { directionalLightHelper.update()}).name("Target: x")
        directionalGUI.add(targetObject.position, 'y').min(- 20).max(20).step(0.001).onChange(() => { directionalLightHelper.update()}).name("Target: y")
        directionalGUI.add(targetObject.position, 'z').min(- 20).max(20).step(0.001).onChange(() => { directionalLightHelper.update()}).name("Target: z")
        directionalGUI.add(directionalLight, 'visible')
        directionalGUI.add(directionalLightHelper, 'visible').name('helper')

        /**
        * Initialize Scene Objects -------------------------------------------------------------
        */
        
        /**
         * Scene Setup Functions
         */
        // Camera
        const setupPerspectiveCamera = () => {
            this.camera = new THREE.PerspectiveCamera(perspecitveCameraSettings.floor4.fov, sizes.width / sizes.height, 0.1, 1000)
            this.camera.position.set(
                perspecitveCameraSettings.floor4.cameraPositionX,
                perspecitveCameraSettings.floor4.cameraPositionY,
                perspecitveCameraSettings.floor4.cameraPositionZ)
            this.scene.add(this.camera)
        }

        const setupOrthographicCamera = () => {
            this.camera = new THREE.OrthographicCamera(
                orthographicCameraSettings.floor4.left,
                orthographicCameraSettings.floor4.right,
                orthographicCameraSettings.floor4.top,
                orthographicCameraSettings.floor4.bottom,
                orthographicCameraSettings.floor4.near,
                orthographicCameraSettings.floor4.far,
            )
            
            this.camera.position.set(
                orthographicCameraSettings.floor4.x,
                orthographicCameraSettings.floor4.y,
                orthographicCameraSettings.floor4.z
            )

            this.camera.zoom = 8

            this.camera.updateProjectionMatrix()
            this.scene.add(this.camera)

            // this.camHelper = new THREE.CameraHelper( this.camera );
            // this.scene.add(this.camHelper)

        }

        // Renderer
        const setupRenderer = () => {
            this.renderer = new THREE.WebGLRenderer()
            this.renderer.setSize(sizes.width, sizes.height)
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
            this.mount.appendChild( this.renderer.domElement );
        }

        // Controls
        const setupOrthographicCamControls = () => {
            this.controls = new OrbitControls(this.camera, this.renderer.domElement)
            this.controls.target.set(
                orthographicCameraSettings.floor4.targetx,
                orthographicCameraSettings.floor4.targety,
                orthographicCameraSettings.floor4.targetz)
            this.controls.enableDamping = true    
        }

        // Controls
        const setupPerspectiveCamControls = () => {
            this.controls = new OrbitControls(this.camera, this.renderer.domElement)
            this.controls.target.set(
                perspecitveCameraSettings.floor4.targetx,
                perspecitveCameraSettings.floor4.targety,
                perspecitveCameraSettings.floor4.targetz)
            this.controls.enableDamping = true
        }

        const init = () => {
            attatchListeners()
            setupRenderer()
            if(this.state.useOrthoCam){
                setupOrthographicCamera()
                setupOrthographicCamControls()
            } else {
                setupPerspectiveCamera()
                setupPerspectiveCamControls()
            }
        }

        init()        

        /**
         * Animation Loop ---------------------------------------------------------------------
         */

        /**
         * Big Boi Tween Time
         * Function Structure is as follows:
         * 
         * 
         * All values are tweened simultaniously (via chaining the onStart() methods)
         * Special thanks to Dan Hammond and his wonderful blog post detailing this 
         * method: https://blogs.perficient.com/2020/05/21/3d-camera-movement-in-three-js-i-learned-the-hard-way-so-you-dont-have-to/
         */
        function shiftCamera(destination, cam, controls){
            let time = {t:0};
            let currentTarget = {x: controls.target.x,y: controls.target.y,z: controls.target.z}

            new TWEEN.Tween(time)
                .to({t:1}, tweenParams.animationDuration * tweenParams.positionChangeFactor)
                .onStart(()=>{
                    new TWEEN.Tween(cam.position)
                        .to({
                            x: destination.x,
                            y: destination.y,
                            z: destination.z
                        })
                        .easing(TWEEN.Easing.Quadratic.InOut)
                        .start();
                    new TWEEN.Tween(currentTarget)
                        .to({
                            x: destination.targetx,
                            y: destination.targety,
                            z: destination.targetz
                        })
                        .easing(TWEEN.Easing.Quadratic.InOut)
                        .onUpdate(()=>{
                            controls.target.set(currentTarget.x, currentTarget.y, currentTarget.z)
                        })
                        .start();
                })
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start();
        }

        function moveFloor (floor, destination){
            let time = {t:0};

            new TWEEN.Tween(time)
                .to({t:1}, tweenParams.animationDuration * tweenParams.positionChangeFactor)
                .onStart(()=>{
                    new TWEEN.Tween(floor.position)
                        .to({
                            x: destination.x,
                            y: destination.y,
                            z: destination.z
                        })
                        .easing(TWEEN.Easing.Quadratic.InOut)
                        .start();
                })
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start();
            
        }

        function changeScene (cam, controls, destination){
            console.log("changescene: ", destination);
            switch(destination){
                case "contact":
                    shiftCamera(orthographicCameraSettings.floor1, cam, controls)
                    break;
                case "photos":
                    shiftCamera(orthographicCameraSettings.floor2, cam, controls)
                    // const dest = new THREE.Vector3(0,100,0)
                    // moveFloor(floor4, dest)
                    break;
                case "gallery":
                    shiftCamera(orthographicCameraSettings.floor3, cam, controls)
                    break;
                case "about":
                    shiftCamera(orthographicCameraSettings.floor4, cam, controls)
                    break;
                default:
                    shiftCamera(orthographicCameraSettings.floor4, cam, controls)
                    break;
            }
            cam.updateProjectionMatrix();
        }

        const clock = new THREE.Clock()
        let previousTime = 0
        const raycaster = new THREE.Raycaster() 

        const tick = () =>
        {
            const elapsedTime = clock.getElapsedTime()
            // const deltaTime = elapsedTime - previousTime
            previousTime = elapsedTime
            TWEEN.update();

            //Raycasting from mouse pointer
            if(this.camera != null && this.state.doRouting){
                raycaster.setFromCamera(mouse,  this.camera)

                let intersects = null
                intersects = raycaster.intersectObjects(clickableObjects)

                //Mouse Enter/Mouse Leave (general)
                if(intersects.length){
                    if(!currentIntersect){}
                    currentIntersect = intersects[0]
                } else {
                    if(currentIntersect) {}
                    currentIntersect = null
                }
                //Do stuff to intersected objects
                for(const object of clickableObjects) {
                    object.material.color.set('#ff0000')
                } 
                for(const intersect of intersects) {
                    intersect.object.material.color.set('#0000ff')
                }
            }
            if(this.camHelper != null){
                this.camHelper.update()
                this.camHelper.visible = true;
            }
            
            if(this.state.camDestination !== ""){
                changeScene(this.camera, this.controls, this.state.camDestination)
                this.setState({camDestination: ""})
            }

            // Update controls
            if(this.controls != null){
                this.controls.update()
            }

            // Render
            if(this.renderer != null){
                this.renderer.render(this.scene,  this.camera)
            }

            // Call tick again on the next frame
            window.requestAnimationFrame(tick)
        }
        //Enable Router Links (raycaster)
        this.setState({doRouting: true})
        tick()
    }
    componentWillUnmount(){

    }
    render(){
        return (
            <>
                <ScrollController navigate = {this.navigate}/>
                {!this.state.loaded && <ProgressBar value={Math.ceil(this.state.progress)} max={100} text={this.state.progressText}/>}
                <div ref={ref => (this.mount = ref)} />
            </>
        )

    }
}

export default Tower