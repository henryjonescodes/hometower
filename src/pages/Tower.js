import React from 'react';
import * as dat from 'dat.gui'
import * as THREE from "three";
import TWEEN from '@tweenjs/tween.js'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { Water } from 'three/examples/jsm/objects/Water.js';
import ProgressBar from '../components/ProgressBar/ProgressBar';
import ScrollController from '../components/ScrollController/ScrollController';

import {scenes, perspecitveCameraSettings, sceneSettings} from '../data/TowerSceneConfig'

class Tower extends React.Component{
    constructor(props){
        super(props)

        this.state = {
            loaded: false,
            progress: 0,
            progressText: "",
            doRouting: false,
            target: null,
            camDestination: "",
            verbose: false,
            currentFloor: "roof",
            resetRequested: false,
            spinBuilding: true,
            lockAnimations: false,
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
    back = () =>{
        this.setState({resetRequested: true})
        console.log("RESET!")
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

        const debugParams = {
            focusx: 0,
            focusy: 30,
            focusz: 0
        }

        /**
        * Set Up File loaders-----------------------------------------------------------------------
        */


        //Loaders
        const loadingManager = new THREE.LoadingManager()
        const dracoLoader = new DRACOLoader(loadingManager)                     //Compressed file loader
        dracoLoader.setDecoderPath('./draco/')
        const gltfLoader = new GLTFLoader(loadingManager)                       //glTF format loader
        gltfLoader.setDRACOLoader(dracoLoader)                          
        const textureLoader = new THREE.TextureLoader(loadingManager)           //Texture (image) loader
        const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager)   //Cube texture (sky texture) loader
        // const fontLoader = new FontLoader(loadingManager)

        //Enable cache
        THREE.Cache.enabled = true

        loadingManager.onStart = function ( url, itemsLoaded, itemsTotal ) {
            console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
        };
        loadingManager.onLoad = () => {
            this.setState({loaded: true})
            console.log( 'Loading complete!');
        };
        loadingManager.onProgress = ( url, itemsLoaded, itemsTotal ) => {
            //update state for progress bar
            this.setState({progress: (100/itemsTotal) * itemsLoaded})
            this.setState({progressText: 'Loading file: ' + url})
            console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
        };
        loadingManager.onError = function ( url ) {
            console.log( 'There was an error loading ' + url );
        };

        //Helper functions for main file loading
        function loadWithPromise(url, loader){
            return new Promise((resolve, reject) => {
                loader.load(url, data=> resolve(data), null, reject);
            });
        }

        //Load model and image together
        async function doCombinedLoading(url, loader, textureUrl, textureLoader, scene){
            let outGroup = new THREE.Group()
            
            const gltfData = await loadWithPromise(url, loader)
            const objects = gltfData.scene.children.find((child) => child.name.includes('Scene'))
            const windows = gltfData.scene.children.find((child) => child.name.includes('Window'))
            const black = gltfData.scene.children.find((child) => child.name.includes('Black'))
            const clickable = gltfData.scene.children.filter((child) => child.name.includes('Clickable'))

            //Handle Clickable Objects
            if(clickable){
                const nullMaterial = new THREE.MeshBasicMaterial({transparent: true, opacity: 0});
                clickable.forEach((obj) => {
                    obj.traverse((child) => {child.material = nullMaterial});    
                    clickableObjects.push(obj);
                    applyModelSettings(obj)
                    outGroup.add(obj)
                })
            }

            //Handle small black objects
            if(black){
                const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000});
                black.traverse((child) => {child.material = blackMaterial}); 
                applyModelSettings(black)   
                outGroup.add(black)
            }
            
            //Texture Windows .. or don't i guess
            if(windows && false){
                const windowMaterial = new THREE.MeshPhysicalMaterial({  
                    roughness: 0,  
                    transmission: 1, // Add transparency
                });
                windows.traverse((child) => {child.material = windowMaterial});  
                applyModelSettings(windows)  
                outGroup.add(windows)
            }

            //Texture main model
            const texture = await loadWithPromise(textureUrl, textureLoader)
            texture.flipY = false
            const material = new THREE.MeshBasicMaterial({ map: texture})
            objects.traverse((child) => {child.material = material});    
            applyModelSettings(objects)
            outGroup.add(objects)

            scene.add(outGroup)
            return outGroup
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
                this.camera.aspect = sizes.aspect
                this.camera.updateProjectionMatrix()
            }
    
            //Update renderer
            if(this.renderer){
                this.renderer.setSize(sizes.width, sizes.height)
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
            }
        }

        const handleMouseMove = (evt) => {
            mouse.x = evt.clientX / sizes.width * 2 - 1
            mouse.y = - (evt.clientY / sizes.height) * 2 + 1
        }
    
        const handleClick = () => {
            if(currentIntersect)
            {
                const duration = sceneSettings.animationDurations.clickFocus
                switch(currentIntersect.object.name)
                {
                    case "Floor3_Clickable_Home":
                        if(this.state.spinBuilding){
                            zeroRotation(buildingGroup)
                        }
                        this.setState({spinBuilding: false})
                        shiftCamera(scenes.Floor3_Clickable_Home, this.camera, this.controls, duration)
                        break
                    case "Floor3_Clickable_Acomplices":
                        if(this.state.spinBuilding){
                            zeroRotation(buildingGroup)
                        }
                        this.setState({spinBuilding: false})
                        shiftCamera(scenes.Floor3_Clickable_Acomplices, this.camera, this.controls, duration)
                        break
                    case "Floor3_Clickable_MixedMessages":
                        if(this.state.spinBuilding){
                            zeroRotation(buildingGroup)
                        }
                        this.setState({spinBuilding: false})
                        shiftCamera(scenes.Floor3_Clickable_MixedMessages, this.camera, this.controls, duration)
                        break
                    case "Floor3_Clickable_HiddenWorlds":
                        if(this.state.spinBuilding){
                            zeroRotation(buildingGroup)
                        }
                        this.setState({spinBuilding: false})
                        shiftCamera(scenes.Floor3_Clickable_HiddenWorlds, this.camera, this.controls, duration)
                        break
                    case "Floor3_Clickable_WorldsEdge":
                        if(this.state.spinBuilding){
                            zeroRotation(buildingGroup)
                        }
                        this.setState({spinBuilding: false})
                        shiftCamera(scenes.Floor3_Clickable_WorldsEdge, this.camera, this.controls, duration)
                        break
                    case "Floor3_Clickable_Graduation":
                        if(this.state.spinBuilding){
                            zeroRotation(buildingGroup)
                        }
                        this.setState({spinBuilding: false})
                        shiftCamera(scenes.Floor3_Clickable_Graduation, this.camera, this.controls, duration)
                        break
                    case "Floor3_Clickable_Lombard":
                        if(this.state.spinBuilding){
                            zeroRotation(buildingGroup)
                        }
                        this.setState({spinBuilding: false})
                        shiftCamera(scenes.Floor3_Clickable_Lombard, this.camera, this.controls, duration)
                        break
                    case "Floor3_Clickable_BlueHaze":
                        if(this.state.spinBuilding){
                            zeroRotation(buildingGroup)
                        }
                        this.setState({spinBuilding: false})
                        shiftCamera(scenes.Floor3_Clickable_BlueHaze, this.camera, this.controls, duration)
                        break
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

        //General
        const waterTexture = textureLoader.load('/textures/misc/waternormals.jpg', function ( texture ) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }) 

        //Sky Textures
        const skyCubeTexture = cubeTextureLoader.load([
            'textures/sky/px.png',
            'textures/sky/nx.png',
            'textures/sky/py.png',
            'textures/sky/ny.png',
            'textures/sky/pz.png',
            'textures/sky/nz.png'
        ]);
        
        this.scene.background = skyCubeTexture;
        
        //Loaded Data
        let buildingGroup = new THREE.Group()
        let floor1Group = new THREE.Group()
        let floor2Group = new THREE.Group()
        let floor3Group = new THREE.Group()
        let floor4Group = new THREE.Group()
        let roofGroup = new THREE.Group()
       
        //Pre-Vis Objects
        const demoMaterial = new THREE.MeshStandardMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
        const demoMaterial1 = new THREE.MeshStandardMaterial( {color: 0xff0000, side: THREE.DoubleSide} );
        const floor1 = doModelLoading('/models/floor1/floor1.glb',demoMaterial, gltfLoader, floor1Group)
        const floor2 = doModelLoading('/models/floor2/floor2.glb',demoMaterial1, gltfLoader, floor2Group)
        
        //Main imported models
        const floor3 = doCombinedLoading(
            '/models/floor3/floor3.glb',
            gltfLoader, 
            '/models/floor3/floor3.png',
            textureLoader, 
            floor3Group)
        const floor4 = doCombinedLoading(
            '/models/floor4/floor4.glb',
            gltfLoader, 
            '/models/floor4/floor4.png',
            textureLoader, 
            floor4Group)
        const roof = doCombinedLoading(
            '/models/roof/roof.glb',
            gltfLoader, 
            '/models/roof/roof.png',
            textureLoader, 
            roofGroup)
        
        buildingGroup.add(floor1Group,floor2Group,floor3Group,floor4Group,roofGroup)
        buildingGroup.rotation.y = Math.PI / 4;
        this.scene.add(buildingGroup)

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
        targetObject.position.set(0, 40, 0)
        directionalLight.castShadow = true
        directionalLight.shadow.mapSize.set(1024, 1024)
        directionalLight.shadow.camera.far = 15
        directionalLight.shadow.camera.left = - 7
        directionalLight.shadow.camera.top = 7
        directionalLight.shadow.camera.right = 7
        directionalLight.shadow.camera.bottom = - 7
        directionalLight.position.set(15, 60, 15)
        directionalLight.visible = true
        directionalLight.target = targetObject
        this.scene.add(directionalLight, targetObject)

        const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 0.2)
        directionalLightHelper.visible = false
        this.scene.add(directionalLightHelper)

        /**
         * GUI ---------------------------------------------------------------------------------
         */

        const debugObject = {}
        let focus = null
        
        //Debug Functions ====================================>

        const createBox = (width, height, depth, position) =>{
            const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
            const boxMaterial = new THREE.MeshStandardMaterial({
                metalness: 0.3,
                roughness: 0.4,
            })
            const mesh = new THREE.Mesh(boxGeometry, boxMaterial)
            mesh.scale.set(width, height, depth)
            mesh.castShadow = true
            mesh.position.copy(position)
            return mesh
        }
        
        debugObject.logCamera = () => {
            console.log("Camera Details")
            console.log(this.camera)
            console.log(this.controls)
        }
        debugObject.toggleControls = () =>{
            if(this.controls){
                this.controls.enabled = !this.controls.enabled
            } else {
                console.log("controls not found")
            }
        }
        debugObject.toggleVerbose = () =>{
            this.setState({verbose: !this.state.verbose})
        }
        debugObject.toggleAnimations = () =>{
            this.setState({lockAnimations: !this.state.lockAnimations})
        }
        debugObject.toggleSpin = () =>{
            this.setState({spinBuilding: !this.state.spinBuilding})
        }
        debugObject.placefocus = () => {
            if(!focus){
                focus = createBox(1,1,1,{ x: debugParams.focusx, y: debugParams.focusy, z: debugParams.focusz })
                this.scene.add(focus)
            } else {
                this.scene.remove(focus)
                focus = null
            }
        }

        //Scene GUI ==========================================>
        var sceneGUI = gui.addFolder("Scene")
        sceneGUI.add(debugObject, 'toggleAnimations')

        //Spin GUI
        var spinGUI = sceneGUI.addFolder("Building Rotation")
        spinGUI.add(debugObject, 'toggleSpin').name("Toggle Spin")
        spinGUI.add(sceneSettings, 'rotationSpeed').min(-.001).max(.001).step(0.0001).name("Rotation Speed")

        //Lights GUI
        var lightsGUI = sceneGUI.addFolder("Lighting")
        
        var ambientGUI = lightsGUI.addFolder("Ambient Light")
        ambientGUI.addColor(lightColors, 'ambientLightColor').onChange(() =>{ambientLight.color.set(lightColors.ambientLightColor)}).name("Color")
        ambientGUI.add(ambientLight, 'intensity').min(0).max(1).step(0.001)
        ambientGUI.add(ambientLight, 'visible')
        
        //Directional Light
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

        //Camera GUI =========================================>
        var cameraGUI = gui.addFolder("Camera")
        cameraGUI.add(debugObject, 'logCamera')
        cameraGUI.add(debugObject, 'toggleControls')
        
        // Focus
        var focusGUI = cameraGUI.addFolder("Focus Object")
        focusGUI.add(debugObject, 'placefocus')
        focusGUI.add(debugParams, 'focusx').min(-100).max(100).step(0.001)
        focusGUI.add(debugParams, 'focusy').min(-100).max(100).step(0.001)
        focusGUI.add(debugParams, 'focusz').min(-100).max(100).step(0.001)
        
        

        
        //Debug GUI ==========================================>
        var debugGUI = gui.addFolder("Debug")
        debugGUI.add(debugObject, 'toggleVerbose')



        /**
        * Initialize Scene Objects -------------------------------------------------------------
        */
        
        /**
         * Scene Setup Functions
         */
        // Camera
        const setupPerspectiveCamera = () => {
            this.camera = new THREE.PerspectiveCamera(perspecitveCameraSettings.roof.fov, sizes.width / sizes.height, 0.1, 1000)
            this.camera.position.set(
                perspecitveCameraSettings.roof.cameraPositionX,
                perspecitveCameraSettings.roof.cameraPositionY,
                perspecitveCameraSettings.roof.cameraPositionZ)
            // this.camera.updateProjectionMatrix()
            this.scene.add(this.camera)
        }

        // Renderer
        const setupRenderer = () => {
            this.renderer = new THREE.WebGLRenderer()
            this.renderer.setSize(sizes.width, sizes.height)
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
            this.mount.appendChild( this.renderer.domElement );
        }

        // Controls
        const setupPerspectiveCamControls = () => {
            this.controls = new OrbitControls(this.camera, this.renderer.domElement)
            this.controls.target.set(
                perspecitveCameraSettings.roof.targetx,
                perspecitveCameraSettings.roof.targety,
                perspecitveCameraSettings.roof.targetz)
            this.controls.enableDamping = false
            this.controls.enabled = false
        }

        const init = () => {
            attatchListeners()
            setupRenderer()
            setupPerspectiveCamera()
            setupPerspectiveCamControls()
        }

        init()        

        /**
         * Scene Animation Functions -------------------------------------------------------
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
        function shiftCamera(destination, cam, controls, duration){
            console.log("duration:", duration)
            let time = {t:0};
            let currentTarget = {x: controls.target.x,y: controls.target.y,z: controls.target.z}

            new TWEEN.Tween(time)
                .to({t:1}, duration)
                .onStart(()=>{
                    new TWEEN.Tween(cam.position)
                        .to({
                            x: destination.cameraPositionX,
                            y: destination.cameraPositionY,
                            z: destination.cameraPositionZ
                        }, duration)
                        .onStart(() => {
                            new TWEEN.Tween(currentTarget)
                            .to({
                                x: destination.targetx,
                                y: destination.targety,
                                z: destination.targetz
                            }, duration)
                            .easing(TWEEN.Easing.Quadratic.InOut)
                            .onUpdate(()=>{
                                controls.target.set(currentTarget.x, currentTarget.y, currentTarget.z)
                            })
                            .start();
                        })
                        .easing(TWEEN.Easing.Quadratic.InOut)
                        .start();
                   
                })
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start();
        }

        function moveFloor (floor, destination){
            let time = {t:0};

            new TWEEN.Tween(time)
                .to({t:1}, sceneSettings.animationDurations.moveFloor)
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

        function zeroRotation (object){
            let time = {t:0};

            let oneTurn = 2 * Math.PI
            const numTurns = Math.floor(object.rotation.y / oneTurn)
            const zeroMin = numTurns * oneTurn
            const zeroMax = (numTurns + 1) * oneTurn
            let targetRot
            if(object.rotation.y >= (zeroMin + Math.pi)){
                targetRot = zeroMax
            } else {
                targetRot = zeroMin
            }
            
            console.log("numTurns", numTurns)
            console.log("zeroMin", zeroMin)
            console.log("zeroMax", zeroMax)
            console.log("currentRot", object.rotation.y)
            console.log("targetRot", targetRot)

            new TWEEN.Tween(time)
                .to({t:1}, sceneSettings.animationDurations.zeroRotation)
                .onStart(()=>{
                    new TWEEN.Tween(object.rotation)
                        .to({
                            x: 0,
                            y: targetRot,
                            z: 0
                        })
                        .easing(TWEEN.Easing.Quadratic.InOut)
                        .start();
                })
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start();
        }

        function changeScene (destination){
            console.log("changescene: ", destination);
            const origin = new THREE.Vector3(0,0,0)
            const dest = new THREE.Vector3(0,100,0)
            const duration = sceneSettings.animationDurations.changeScene
            switch(destination){
                case "floor1":
                    moveFloor(roofGroup, dest)
                    moveFloor(floor4Group, dest)
                    moveFloor(floor3Group, dest)
                    moveFloor(floor2Group, dest)
                    resetCamera(destination, duration)
                    break;
                case "floor2":
                    moveFloor(roofGroup, dest)
                    moveFloor(floor4Group, dest)
                    moveFloor(floor3Group, dest)
                    moveFloor(floor2Group, origin)
                    resetCamera(destination, duration)
                    break;
                case "floor3":
                    moveFloor(roofGroup, dest)
                    moveFloor(floor4Group, dest)
                    moveFloor(floor3Group, origin)
                    moveFloor(floor2Group, origin)
                    resetCamera(destination, duration)
                    break;
                case "floor4":
                    moveFloor(roofGroup, dest)
                    moveFloor(floor4Group, origin)
                    moveFloor(floor3Group, origin)
                    moveFloor(floor2Group, origin)
                    resetCamera(destination, duration)
                    break;
                case "roof":
                    moveFloor(roofGroup, origin)
                    moveFloor(floor4Group, origin)
                    moveFloor(floor3Group, origin)
                    moveFloor(floor2Group, origin)
                    resetCamera(destination, duration)
                    break;
                default:
                    moveFloor(roofGroup, origin)
                    moveFloor(floor4Group, origin)
                    moveFloor(floor3Group, origin)
                    moveFloor(floor2Group, origin)
                    resetCamera("roof", duration)
                    break;
            }
            // cam.updateProjectionMatrix();
        }

        const resetCamera = (key, duration) => {
            this.setState({spinBuilding: true})
            switch(key){
                case "floor1":
                    shiftCamera(perspecitveCameraSettings.floor1, this.camera, this.controls, duration)
                    this.setState({currentFloor: "floor1"})
                    break;
                case "floor2":
                    shiftCamera(perspecitveCameraSettings.floor2, this.camera, this.controls, duration)
                    moveFloor(floor2Group, origin)
                    this.setState({currentFloor: "floor2"})
                    break;
                case "floor3":
                    shiftCamera(perspecitveCameraSettings.floor3, this.camera, this.controls, duration)
                    this.setState({currentFloor: "floor3"})
                    break;
                case "floor4":
                    shiftCamera(perspecitveCameraSettings.floor4, this.camera, this.controls, duration)
                    this.setState({currentFloor: "floor4"})
                    break;
                case "roof":
                    shiftCamera(perspecitveCameraSettings.roof, this.camera, this.controls, duration)
                    this.setState({currentFloor: "roof"})
                    break;
                default:
                    shiftCamera(perspecitveCameraSettings.roof, this.camera, this.controls, duration)
                    this.setState({currentFloor: "roof"})
                    break;
            }
        }

        /**
         * Animation Loop -------------------------------------------------------
         */


        const clock = new THREE.Clock()
        let previousTime = 0
        const raycaster = new THREE.Raycaster() 

        const tick = () =>
        {
            const elapsedTime = clock.getElapsedTime()
            // const deltaTime = elapsedTime - previousTime
            previousTime = elapsedTime
            TWEEN.update();

            //Move stuff 
            if(this.state.spinBuilding && !this.state.lockAnimations){
                buildingGroup.rotation.y += Math.PI * sceneSettings.rotationSpeed;
            }

            //Raycasting from mouse pointer
            if(this.camera != null && this.state.loaded){
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
            }
            
            if(this.state.camDestination !== ""){
                changeScene(this.state.camDestination)
            }
            this.setState({camDestination: ""})

            if(this.state.resetRequested){
                const duration = sceneSettings.animationDurations.resetCamera
                resetCamera(this.state.currentFloor, duration)
                this.setState({resetRequested: false})
            }

            // Update controls
            if(this.controls != null){
                this.controls.update()
            }

            // Render
            if(this.renderer != null){
                this.renderer.render(this.scene,  this.camera)
            }

            // Focus
            if(focus){ 
                focus.position.set(debugParams.focusx,debugParams.focusy,debugParams.focusz)
                this.camera.lookAt(focus)
                this.controls.target.set(
                    focus.position.x,
                    focus.position.y,
                    focus.position.z
            )
            }

            // Call tick again on the next frame
            window.requestAnimationFrame(tick)
        }
        //Enable Router Links (raycaster)
        this.setState({doRouting: true})
        tick()
    }
    componentWillUnmount(){
        this.scene = null
        this.camera = null
        this.renderer = null
        this.controls = null
        this.mixer = null
    }
    render(){
        return (
            <>
                <ScrollController navigate = {this.navigate} back = {this.back}/>
                {!this.state.loaded && <ProgressBar value={Math.ceil(this.state.progress)} max={100} text={this.state.progressText}/>}
                <div ref={ref => (this.mount = ref)} />
            </>
        )

    }
}

export default Tower