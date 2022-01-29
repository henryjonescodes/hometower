import React from 'react';
import * as dat from 'dat.gui'
import * as THREE from "three";
import TWEEN from '@tweenjs/tween.js'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { Water } from 'three/examples/jsm/objects/Water.js';
import ProgressBar from '../components/ProgressBar/ProgressBar';
// import ScrollController from '../components/ScrollController/ScrollController';
// import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'

import {scenes, perspecitveCameraSettings, sceneSettings} from '../data/TowerSceneConfig'
import DetailPanel from '../components/DetailPanel/DetailPanel';

class Tower extends React.Component{
    constructor(props){
        super(props)

        this.state = {
            loaded: false,
            progress: 0,
            progressText: "",
            verbose: false,
            doRouting: false,
            routeTo: null,
            navigateTo: "",
            currentFloor: "roof",
            currentScene: null,
            sceneChangeReady: false,
            resetRequested: false,
            spinBuilding: true,
            lockAnimations: false,
            zoom: "standard",
            zooming: false
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
    route(to) {
        if(this.state.doRouting){
            this.setState({routeTo: to})
        }
    }
    navigate = (direction) => {
        if(this.state.loaded){
            this.setState({navigateTo: direction})
        }
    }
    back = () =>{
        this.setState({resetRequested: true})
    }
    componentDidMount(){
        //Setup GUI
        const gui = new dat.GUI({ closed: true, width: 700})
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
            
            //Sepparated Imports
            const gltfData = await loadWithPromise(url, loader)
            console.log(gltfData)
            const objects = gltfData.scene.children.find((child) => child.name.includes('Scene'))
            const windows = gltfData.scene.children.find((child) => child.name.includes('Window'))
            const black = gltfData.scene.children.find((child) => child.name.includes('Black'))
            const metalDark = gltfData.scene.children.find((child) => child.name.includes('MetalDark'))
            const clickable = gltfData.scene.children.filter((child) => child.name.includes('Clickable'))
            const bobbers = gltfData.scene.children.filter((child) => child.name.includes('Bobber'))
            
            //Texture main model
            const texture = await loadWithPromise(textureUrl, textureLoader)
            texture.flipY = false
            const bakeMaterial = new THREE.MeshBasicMaterial({map: texture})
            objects.traverse((child) => {child.material = bakeMaterial});    
            clickableObjects.push(objects);
            applyModelSettings(objects)
            outGroup.add(objects)

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

            //Texture floating objects (bobbers)
            if(bobbers){
                bobbers.forEach((bobber) => {
                    bobber.traverse((child) => {
                        child.material = bakeMaterial
                        applyModelSettings(bobber)   
                        outGroup.add(bobber)
                    })
                }); 
            }

            //Texture small black objects
            if(black){
                const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000});
                black.traverse((child) => {child.material = blackMaterial}); 
                applyModelSettings(black)   
                outGroup.add(black)
            }

            //Texture dark metal objects
            if(metalDark){
                const metalDarkMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 1, roughness: 0.8});
                metalDark.traverse((child) => {child.material = metalDarkMaterial}); 
                applyModelSettings(metalDark)   
                outGroup.add(metalDark)
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


            scene.add(outGroup)
            return outGroup
        }
        
        // //Load single asset
        // async function doModelLoading(url, material, loader, scene){
        //     const data = await loadWithPromise(url, loader)  
        //     data.scene.traverse((child) => {child.material = material});      
        //     let model = data.scene
        //     applyModelSettings(model)
        //     scene.add(model)
        //     return model
        // }

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
            
            if(!this.setState.zooming){
                if(sizes.width >= 1200){
                    this.setState({zoom: "widescreen"})
                } else if (sizes.width >= 800){
                    this.setState({zoom: "standard"})
                } else {
                    this.setState({zoom: "mobile"})
                }
                this.setState({zooming: true})
            }
            
    
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
                // if((this.state.currentScene !== null) && (currentIntersect.object.name === "Roof_Scene" || "Floor4_Scene" || "Floor3_Scene" || "Floor2_Scene")){
                //     this.setState({resetRequested: true})
                // } 
                if(this.state.currentScene == null) {
                    let target = null
                    switch(currentIntersect.object.name)
                    {
                        case "Roof_Clickable_Down":
                            this.setState({navigateTo: "floor4"})
                            break
                        case "Floor4_Clickable_Drums":
                            target = scenes.Floor4_Clickable_Drums
                            break
                        case "Floor4_Clickable_Nook":
                            target = scenes.Floor4_Clickable_Nook
                            break
                        case "Floor4_Clickable_Desk":
                            target = scenes.Floor4_Clickable_Desk
                            break
                        case "Floor4_Clickable_Down":
                            this.setState({navigateTo: "floor3"})
                            break
                        case "Floor4_Clickable_Up":
                            this.setState({navigateTo: "roof"})
                            break
                        case "Floor3_Clickable_Home":
                            target = scenes.Floor3_Clickable_Home
                            break
                        case "Floor3_Clickable_Acomplices":
                            target = scenes.Floor3_Clickable_Acomplices
                            break
                        case "Floor3_Clickable_MixedMessages":
                            target = scenes.Floor3_Clickable_MixedMessages
                            break
                        case "Floor3_Clickable_HiddenWorlds":
                            target = scenes.Floor3_Clickable_HiddenWorlds
                            break
                        case "Floor3_Clickable_WorldsEdge":
                            target = scenes.Floor3_Clickable_WorldsEdge
                            break
                        case "Floor3_Clickable_Graduation":
                            target = scenes.Floor3_Clickable_Graduation
                            break
                        case "Floor3_Clickable_Lombard":
                            target = scenes.Floor3_Clickable_Lombard
                            break
                        case "Floor3_Clickable_BlueHaze":
                            target = scenes.Floor3_Clickable_BlueHaze
                            break
                        case "Floor3_Clickable_Up":
                            this.setState({navigateTo: "floor4"})
                            break
                        case "Floor3_Clickable_Down":
                            this.setState({navigateTo: "floor2"})
                            break
                        case "Floor2_Clickable_BugLight":
                            target = scenes.Floor2_Clickable_BugLight
                            break
                        case "Floor2_Clickable_Moxie":
                            target = scenes.Floor2_Clickable_Moxie
                            break
                        case "Floor2_Clickable_Down":
                            this.setState({navigateTo: "floor1"})
                            break
                        case "Floor2_Clickable_Up":
                            this.setState({navigateTo: "floor3"})
                            break
                        default:
                            console.log("Unhandled Click Event: ", currentIntersect.object)
                            break
                    }

                    if(target){
                        zeroRotation()
                        this.setState({currentScene: target})
                    }
                }
            } 
        }

        //Attatch listeners to window
        function attatchListeners(){
            window.addEventListener('resize', handleResize)
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('click', handleClick) 
        }

        // // Remove Listeners From Window, also dismantles gui
        // function removeListeners(){
        //     window.removeEventListener('resize',handleResize)
        //     window.removeEventListener('mousemove',handleMouseMove)
        //     window.removeEventListener('click',handleClick)

        //     //Hide the gui first so it doesnt require reload to go away
        //     this.gui.hide()
        //     this.gui.remove()
        // }

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
        // let floor1Group = new THREE.Group()
        let floor2Group = new THREE.Group()
        let floor3Group = new THREE.Group()
        let floor4Group = new THREE.Group()
        let roofGroup = new THREE.Group()
        
        //Main imported models
        doCombinedLoading(
            '/models/floor2/floor2.glb',
            gltfLoader, 
            '/models/floor2/floor2.png',
            textureLoader, 
            floor2Group)
        doCombinedLoading(
            '/models/floor3/floor3.glb',
            gltfLoader, 
            '/models/floor3/floor3.png',
            textureLoader, 
            floor3Group)
        doCombinedLoading(
            '/models/floor4/floor4.glb',
            gltfLoader, 
            '/models/floor4/floor4.png',
            textureLoader, 
            floor4Group)
        doCombinedLoading(
            '/models/roof/roof.glb',
            gltfLoader, 
            '/models/roof/roof.png',
            textureLoader, 
            roofGroup)
        
        buildingGroup.add(floor2Group,floor3Group,floor4Group,roofGroup)
        buildingGroup.rotation.y = Math.PI / 4;
        this.scene.add(buildingGroup)

        //Water
        const buildWater = (scene) => {
            const waterGeometry = new THREE.PlaneGeometry(11, 11);
            const water = new Water(
            waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: waterTexture,
                alpha: 1.0,
                sunDirection: new THREE.Vector3(),
                sunColor: sceneSettings.water.oceanSunColor,
                waterColor: sceneSettings.water.oceanColor,
                distortionScale: sceneSettings.water.distortionScale,
                fog: scene.fog !== undefined
            }
            );
            water.position.set(3.2,48,3.2)
            water.rotation.x =- Math.PI / 2;
            scene.add(water);
            
            return water;
        }

        const water = buildWater(buildingGroup)

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
        debugObject.zeroRotation = () =>{
            zeroRotation()
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
        spinGUI.add(debugObject, 'zeroRotation')
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
            this.camera = new THREE.PerspectiveCamera(sceneSettings.fov.standard, sizes.width / sizes.height, 0.1, 1000)
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
         * 
         * 
         * All values are tweened simultaniously (via chaining the onStart() methods)
         * Special thanks to Dan Hammond and his wonderful blog post detailing this 
         * method: https://blogs.perficient.com/2020/05/21/3d-camera-movement-in-three-js-i-learned-the-hard-way-so-you-dont-have-to/
         */

        function updateFov(cam, newFov){
            let time = {t:0};

            new TWEEN.Tween(time)
                .to({t:1}, sceneSettings.animationDurations.updateFov)
                .onStart(()=>{
                    new TWEEN.Tween(cam)
                        .to({fov: newFov}, sceneSettings.animationDurations.updateFov)
                        .easing(TWEEN.Easing.Quadratic.InOut)
                        .onUpdate(()=>{cam.updateProjectionMatrix()})
                        .start();
                    })
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start();
        }

        function shiftCamera(destination, cam, controls, duration){
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
                        }, sceneSettings.animationDurations.moveFloor)
                        .easing(TWEEN.Easing.Quadratic.InOut)
                        .start();
                })
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start();
            
        }

        const zeroRotation = () => {
            if(this.state.spinBuilding){
                this.setState({spinBuilding: false})
                let time = {t:0};
                
                let oneTurn = 2 * Math.PI
                const numTurns = Math.floor(buildingGroup.rotation.y / oneTurn)
                const zeroMin = numTurns * oneTurn
                const zeroMax = (numTurns + 1) * oneTurn
                let targetRot
                if(buildingGroup.rotation.y >= (zeroMin + Math.pi)){
                    targetRot = zeroMax
                } else {
                    targetRot = zeroMin
                }
                
                if(this.verbose){
                    console.log("numTurns", numTurns)
                    console.log("zeroMin", zeroMin)
                    console.log("zeroMax", zeroMax)
                    console.log("currentRot", buildingGroup.rotation.y)
                    console.log("targetRot", targetRot)
                }
                
                new TWEEN.Tween(time)
                    .to({t:1}, sceneSettings.animationDurations.zeroRotation)
                    .onStart(()=>{
                        new TWEEN.Tween(buildingGroup.rotation)
                        .to({
                            x: 0,
                            y: targetRot,
                            z: 0
                        }, sceneSettings.animationDurations.zeroRotation)
                        .easing(TWEEN.Easing.Quadratic.InOut)
                        .start();
                    })
                    .easing(TWEEN.Easing.Quadratic.InOut)
                    .onComplete(()=>{this.setState({sceneChangeReady: true})})
                    .start();
            }
        }

        function changeFloor (destination){
            console.log("changeFloor: ", destination);
            const origin = new THREE.Vector3(0,0,0)
            const dest = new THREE.Vector3(0,100,0)
            const duration = sceneSettings.animationDurations.changeFloor
            switch(destination){
                case "floor1":
                    water.visible = false
                    moveFloor(roofGroup, dest)
                    moveFloor(floor4Group, dest)
                    moveFloor(floor3Group, dest)
                    moveFloor(floor2Group, origin)
                    resetCamera(destination, duration)
                    break;
                case "floor2":
                    water.visible = false
                    moveFloor(roofGroup, dest)
                    moveFloor(floor4Group, dest)
                    moveFloor(floor3Group, dest)
                    moveFloor(floor2Group, origin)
                    resetCamera(destination, duration)
                    break;
                case "floor3":
                    water.visible = false
                    moveFloor(roofGroup, dest)
                    moveFloor(floor4Group, dest)
                    moveFloor(floor3Group, origin)
                    moveFloor(floor2Group, origin)
                    resetCamera(destination, duration)
                    break;
                case "floor4":
                    water.visible = false
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
            this.setState({spinBuilding: true, currentScene: null})
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


        // const clock = new THREE.Clock()
        // let previousTime = 0
        const raycaster = new THREE.Raycaster() 

        const tick = () =>
        {
            // const elapsedTime = clock.getElapsedTime()
            // const deltaTime = elapsedTime - previousTime
            // previousTime = elapsedTime
            TWEEN.update();

            //Water
            water.material.uniforms[ 'time' ].value += 1.0 / sceneSettings.water.timeModifier;

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

            //Reset camera to overview
            if(this.state.resetRequested){
                const duration = sceneSettings.animationDurations.resetCamera
                resetCamera(this.state.currentFloor, duration)
                this.setState({resetRequested: false})
            }

            //Handle camera navigation flags
            if(this.state.navigateTo !== ""){
                changeFloor(this.state.navigateTo)
            }
            this.setState({navigateTo: ""})

            //Move camera AFTER building resets to original rotation
            if(this.state.sceneChangeReady && this.state.currentScene){
                shiftCamera(this.state.currentScene, this.camera, this.controls, sceneSettings.animationDurations.clickFocus)
                this.setState({sceneChangeReady: false})
            }

            // Update Camera FOV
            if(this.state.zooming){
                switch(this.state.zoom){
                    case "widescreen":
                        updateFov(this.camera, sceneSettings.fov.widescreen)
                        break
                    case "standard":
                        updateFov(this.camera, sceneSettings.fov.standard)
                        break
                    case "mobile":
                        updateFov(this.camera, sceneSettings.fov.mobile)
                        break
                    default:
                        updateFov(this.camera, sceneSettings.fov.standard)
                        break
                            
                }
                this.setState({zooming: false})
            }


            // Update controls
            if(this.controls != null){
                this.controls.update()
            }

            // Render
            if(this.renderer != null){
                this.renderer.render(this.scene,  this.camera)
            }

            // Focus object for camera debugging
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
                {/* <ScrollController navigate = {this.navigate} back = {this.back}/> */}
                <DetailPanel scene={this.state.currentScene} back = {this.back}/>
                <ProgressBar value={Math.ceil(this.state.progress)} max={100} text={this.state.progressText} loaded={this.state.loaded}/>
                <div ref={ref => (this.mount = ref)} />
            </>
        )

    }
}

export default Tower