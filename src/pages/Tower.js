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

class Tower extends React.Component{
    constructor(props){
        super(props)

        this.state = {
            loaded: false,
            progress: 0,
            progressText: "",
            doRouting: false,
            target: null,
            useOrthoCam: false,
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

        const params = {
            focusx: 0,
            focusy: 30,
            focusz: 0
        }

        const rotationSpeed = .0001

        //Camera settings
        const scenes = {
            Floor3_Clickable_Acomplices:{
                cameraPositionX: 3.043798085974042,
                cameraPositionY: 35.28954205740364,
                cameraPositionZ: -12.525289428836645,
                fov: 45,
                targetx: 0,
                targety: 34,
                targetz: 2
            },
            Floor3_Clickable_BlueHaze:{
                cameraPositionX: 2.471026592252894,
                cameraPositionY: 35.37781500055371,
                cameraPositionZ: 2.118975912395376,
                fov: 45,
                targetx: 7.772,
                targety: 34.934,
                targetz: 7.454
            },
            Floor3_Clickable_Graduation:{
                cameraPositionX: -1.927542198269916,
                cameraPositionY: 34.88953982870003,
                cameraPositionZ: -1.828419163495437,
                fov: 45,
                targetx: -8.262,
                targety: 35.176,
                targetz: -7.504
            },
            Floor3_Clickable_HiddenWorlds:{
                cameraPositionX: -11.62155483418708,
                cameraPositionY: 35.38800281290143,
                cameraPositionZ: -7.215452779154688,
                fov: 45,
                targetx: 13.396,
                targety: 33.449,
                targetz: 2
            },
            Floor3_Clickable_Home:{
                cameraPositionX: 9.61799105794982,
                cameraPositionY: 35.95111485872807,
                cameraPositionZ: 8.122425534400904,
                fov: 45,
                targetx: 0,
                targety: 34,
                targetz: 2
            },
            Floor3_Clickable_Lombard:{
                cameraPositionX: 1.2722498915882987,
                cameraPositionY: 35.48618818187341,
                cameraPositionZ: -4.924293617077119,
                fov: 45,
                targetx: 10.579,
                targety: 34.934,
                targetz: -4.177
            },
            Floor3_Clickable_MixedMessages:{
                cameraPositionX: 11.202409523006576,
                cameraPositionY: 36.10464738454277,
                cameraPositionZ: -1.37192947483451,
                fov: 45,
                targetx: 1.512,
                targety: 33.746,
                targetz: -4.426
            },
            Floor3_Clickable_WorldsEdge:{
                cameraPositionX: 0.12869333488445744,
                cameraPositionY: 35.15604075526848,
                cameraPositionZ: -2.3206280947602824,
                fov: 45,
                targetx: 1.368,
                targety: 35.176,
                targetz: -11.233
            },
        }
        const perspecitveCameraSettings = {
            floor1:{
                cameraPositionX: 20,
                cameraPositionY: 24,
                cameraPositionZ: 20,
                fov: 45,
                targetx: 0,
                targety: 18,
                targetz: 2
            },
            floor2:{
                cameraPositionX: 20,
                cameraPositionY: 32,
                cameraPositionZ: 20,
                fov: 45,
                targetx: 0,
                targety: 26,
                targetz: 2
            },
            floor3:{
                cameraPositionX: 20,
                cameraPositionY: 40,
                cameraPositionZ: 20,
                fov: 45,
                targetx: 0,
                targety: 34,
                targetz: 2
            },
            floor4:{
                cameraPositionX: 20,
                cameraPositionY: 48,
                cameraPositionZ: 20,
                fov: 45,
                targetx: 0,
                targety: 42,
                targetz: 2
            },
            roof:{
                cameraPositionX: 20,
                cameraPositionY: 56,
                cameraPositionZ: 20,
                fov: 45,
                targetx: 0,
                targety: 50,
                targetz: 2
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
            },
            roof:{
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
            animationDuration: 2000,
            positionChangeFactor: 1,
            targetChangeFactor: 1,
            floorMoveFactor: 1,
            cameraSpinFactor: 1
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
        const textureLoader = new THREE.TextureLoader(loadingManager)           //Texture (image) loader
        const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager)   //Cube texture (sky texture) loader
        // const fontLoader = new FontLoader(loadingManager)

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
            
            //Texture Windows
            if(windows && false){
                const windowMaterial = new THREE.MeshPhysicalMaterial({  
                    roughness: 0,  
                    transmission: 1, // Add transparency
                });
                windows.traverse((child) => {child.material = windowMaterial});  
                applyModelSettings(windows)  
                // outGroup.add(windows) //For now... No windows
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
                    this.camera.aspect = sizes.aspect
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
                const duration = tweenParams.animationDuration * tweenParams.positionChangeFactor
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
                    // case "Roof_Scene":
                    //     changeScene(this.camera, this.controls, "roof")
                    //     break
                    // case "Floor4_Scene":
                    //     changeScene(this.camera, this.controls, "floor4")
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
        
        //Move this somewhere :)
        this.scene.background = skyCubeTexture;
        // this.scene.background = new THREE.Color( 'skyblue');
        
        //Loaded Data
        let buildingGroup = new THREE.Group()
        let floor1Group = new THREE.Group()
        let floor2Group = new THREE.Group()
        let floor3Group = new THREE.Group()
        let floor4Group = new THREE.Group()
        let roofGroup = new THREE.Group()
        const demoMaterial = new THREE.MeshStandardMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
        const demoMaterial1 = new THREE.MeshStandardMaterial( {color: 0xff0000, side: THREE.DoubleSide} );
        const demoMaterial2 = new THREE.MeshStandardMaterial( {color: 0x00ff00, side: THREE.DoubleSide} );
        const demoMaterial3 = new THREE.MeshStandardMaterial( {color: 0x0000ff, side: THREE.DoubleSide} );
        const floor1 = doModelLoading('/models/floor1/floor1.glb',demoMaterial, gltfLoader, floor1Group)
        const floor2 = doModelLoading('/models/floor2/floor2.glb',demoMaterial1, gltfLoader, floor2Group)
        // const floor3 = doModelLoading('/models/floor3/floor3.glb',demoMaterial2, gltfLoader, floor3Group)
        
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
        
        // clickableObjects.push(floor1Group,floor2Group,floor3Group,floor4Group)
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
        let focus = null

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
                focus = createBox(
                    1,
                    1,
                    1,
                {
                    x: params.focusx,
                    y: params.focusy,
                    z: params.focusz,
                })
                this.scene.add(focus)
            } else {
                this.scene.remove(focus)
                focus = null
            }
        }

        var debugGUI = gui.addFolder("Scene")
        debugGUI.add(debugObject, 'toggleSpin')
        debugGUI.add(debugObject, 'toggleAnimations')


        var debugGUI = gui.addFolder("Debug")
        debugGUI.add(debugObject, 'toggleVerbose')

        //Camera GUI
        var cameraGUI = gui.addFolder("Camera")
        cameraGUI.add(debugObject, 'logCamera')
        cameraGUI.add(debugObject, 'toggleControls')

        // Focus
        var focusGUI = cameraGUI.addFolder("Focus Object")
        focusGUI.add(debugObject, 'placefocus')
        focusGUI.add(params, 'focusx').min(-100).max(100).step(0.001)
        focusGUI.add(params, 'focusy').min(-100).max(100).step(0.001)
        focusGUI.add(params, 'focusz').min(-100).max(100).step(0.001)


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
            this.camera = new THREE.PerspectiveCamera(perspecitveCameraSettings.roof.fov, sizes.width / sizes.height, 0.1, 1000)
            this.camera.position.set(
                perspecitveCameraSettings.roof.cameraPositionX,
                perspecitveCameraSettings.roof.cameraPositionY,
                perspecitveCameraSettings.roof.cameraPositionZ)
            // this.camera.updateProjectionMatrix()
            this.scene.add(this.camera)
        }

        const setupOrthographicCamera = () => {
            this.camera = new THREE.OrthographicCamera(
                orthographicCameraSettings.roof.left,
                orthographicCameraSettings.roof.right,
                orthographicCameraSettings.roof.top,
                orthographicCameraSettings.roof.bottom,
                orthographicCameraSettings.roof.near,
                orthographicCameraSettings.roof.far,
            )
            
            this.camera.position.set(
                orthographicCameraSettings.roof.x,
                orthographicCameraSettings.roof.y,
                orthographicCameraSettings.roof.z
            )

            this.camera.zoom = 8

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
        const setupOrthographicCamControls = () => {
            this.controls = new OrbitControls(this.camera, this.renderer.domElement)
            this.controls.target.set(
                orthographicCameraSettings.roof.targetx,
                orthographicCameraSettings.roof.targety,
                orthographicCameraSettings.roof.targetz)
            this.controls.enableDamping = true    
            this.controls.enabled = false
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
        function shiftCamera(destination, cam, controls, duration){
            let time = {t:0};
            let currentTarget = {x: controls.target.x,y: controls.target.y,z: controls.target.z}

            new TWEEN.Tween(time)
                .to({t:1}, tweenParams.animationDuration * tweenParams.positionChangeFactor)
                .onStart(()=>{
                    new TWEEN.Tween(cam.position)
                        .to({
                            x: destination.cameraPositionX,
                            y: destination.cameraPositionY,
                            z: destination.cameraPositionZ
                        })
                        .onStart(() => {
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
                   
                })
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start();
        }

        function moveFloor (floor, destination){
            let time = {t:0};

            new TWEEN.Tween(time)
                .to({t:1}, tweenParams.animationDuration * tweenParams.floorMoveFactor)
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
                .to({t:1}, tweenParams.animationDuration * tweenParams.cameraSpinFactor)
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
            const duration = tweenParams.animationDuration * tweenParams.positionChangeFactor
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
                buildingGroup.rotation.y += Math.PI * rotationSpeed * 5;
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
                const duration = tweenParams.animationDuration * tweenParams.positionChangeFactor
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
                focus.position.set(params.focusx,params.focusy,params.focusz)
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