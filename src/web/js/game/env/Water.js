/*
Water.js
Launcher section water handler.
*/

var KAIOPUA = (function (main) {
    
    var shared = main.shared = main.shared || {},
        game = main.game = main.game || {},
		env = game.env = game.env || {},
        water = env.water = env.water || {},
		rayTexturePath = "assets/textures/light_ray.png",
		wavesTexturePath = "assets/textures/waves_512.png";
    
    /*===================================================
    
    public properties
    
    =====================================================*/
    
    water.make_water_env = make_water_env;
        
    /*===================================================
    
    water
    
    =====================================================*/
    
    function make_water_env ( parameters ) {
		
		parameters = parameters || {};
		
        var i, l,
			assets = main.utils.loader.assets,
			environment,
			wavesInfo,
			vvInfo,
			raysInfo,
			container,
			wavesGeometry,
			wavesMaterial,
			wavesMesh,
			wavesVertsW,
			wavesVertsH,
			wavesNumHorizontal,
			wavesNumVertical,
			wavesSpeed,
			wavesAmplitude,
			wavesFrequency,
			wavesColor,
			wavesSize,
			wavesMaterialsOpacityBase,
			wavesMaterialsOpacitySteps,
			wavesMaterialsDarknessSteps,
			wavesDarknessColor,
			materialStep,
			waves,
			wavesGeomMaterials,
			wavesVertsNum,
			wavesFaces,
			face,
			faceCentroid,
			faceDist,
			darknessDistMin,
			darknessDistMax,
			opacityDistMin,
			opacityDistMax,
			centerPoint,
			vvAmpMax,
			vvAmpMin,
			vvAmpDelta,
			vvFreqMax,
			vvFreqMin,
			vvFreqDelta,
			vvFreqLast,
			vvDirSwitchDelta,
			ray,
			rayGeometry,
			rayMaterial,
			raysInactive,
			raysActive,
			rayHeight,
			rayOpacityOn,
			rayOpacityDelta,
			rayShowChance,
			rayTexture,
			numRays;
        
        // environment
        
        environment = {};
		
		// waves info
		
		wavesInfo = environment.waves = {};
		wavesInfo.time = 0;
		wavesColor = parameters.wavesColor || 0x0bdafa;
		wavesSize = parameters.wavesSize || 10000;
		wavesMaterialsOpacityBase = parameters.wavesOpacityBase || 0.95;
		wavesMaterialsOpacitySteps = parameters.wavesOpacitySteps || 40;
		wavesMaterialsDarknessSteps = parameters.wavesDarknessSteps || 30;
		wavesDarknessColor = parameters.wavesDarknessColor || 0x341479;
		wavesInfo.vertsW = wavesVertsW = parameters.wavesVertsW || 100;
		wavesInfo.vertsH = wavesVertsH = parameters.wavesVertsH || 100;
		wavesInfo.numHorizontal = wavesNumHorizontal = parameters.wavesNumHorizontal || 80;
		wavesInfo.numVertical = wavesNumVertical = parameters.wavesNumVertical || 80;
		wavesInfo.speed = wavesSpeed = parameters.wavesSpeed || 0.001;
		wavesInfo.amplitude = wavesAmplitude = parameters.wavesAmplitude || 50;
		wavesInfo.frequency = wavesFrequency = parameters.wavesFrequency || 0.5;
		wavesInfo.timePerCycle = 1000 * ( Math.PI * 2 ) * ( 1000 * wavesSpeed );
		
		// vertex variations information
		vvInfo = wavesInfo.vv = {};
		vvInfo.list = [];
		vvInfo.ampAbs = parameters.vvAmpAbs || 35;
		vvInfo.ampMin = vvAmpMin = -Math.min(wavesInfo.amplitude * 0.5, vvInfo.ampAbs);
		vvInfo.ampMax = vvAmpMax = Math.min(wavesInfo.amplitude * 0.5, vvInfo.ampAbs);
		vvInfo.ampDelta = vvAmpDelta = (vvAmpMax - vvAmpMin) * 0.01;
		vvInfo.freqAbs = wavesFrequency;
		vvInfo.freqMin = vvFreqMin = -vvInfo.freqAbs * 0.05;
		vvInfo.freqMax = vvFreqMax = vvInfo.freqAbs * 0.05;
		vvInfo.freqDelta = vvFreqDelta = (vvFreqMax - vvFreqMin) * 0.001;
		vvInfo.dirSwitchPause = wavesInfo.timePerCycle * 0.5;
		vvInfo.dirSwitchDelta = vvDirSwitchDelta = vvInfo.dirSwitchPause / 60;
		
		// container
		
		environment.container = container = new THREE.Object3D();
        
        // create water geometry
		
        wavesGeometry = new THREE.PlaneGeometry( wavesSize, wavesSize, wavesVertsW - 1, wavesVertsH - 1 );
        wavesGeometry.dynamic = true;
        
        // per vert variation
		
        wavesVertsNum = wavesGeometry.vertices.length;
		
		vvFreqLast = (vvFreqMax - vvFreqMin) * 0.5;
		
        for ( i = 0; i < wavesVertsNum; i += 1 ) {
			
            vvInfo.list[ i ] = {
                amplitude: Math.random() * (vvAmpMax - vvAmpMin) + vvAmpMin,
				frequency: vvFreqLast * 0.75 + (Math.random() * (vvFreqMax - vvFreqMin) + vvFreqMin) * 0.25,
                dir: 1,
                dirSwitch: Math.round(Math.random() * (vvInfo.dirSwitchPause * 0.5) + (vvInfo.dirSwitchPause * 0.5)),
                dirSwitchCount: Math.round(Math.random() * (vvInfo.dirSwitchPause * 0.5) + (vvInfo.dirSwitchPause * 0.5))
            };
			
			vvFreqLast = vvInfo.list[ i ].frequency;
			
        }
        
        // single material, much more efficient
        
        if ( typeof assets[ wavesTexturePath ] !== 'undefined' ) {
			
			var wavesTexture = new THREE.Texture( assets[ wavesTexturePath ] );
			wavesTexture.needsUpdate = true;
			
			wavesMaterial = new THREE.MeshPhongMaterial( { 
				ambient: wavesColor, 
				color: wavesColor,
				map: wavesTexture,
				specular: 0x00daff, 
				shininess: 10, 
				shading: THREE.SmoothShading
			} );
			
		}
		// per face materials, similar effect but not smooth
		else {
			
			wavesGeomMaterials = wavesGeometry.materials;
			
			// create darkness materials
			
			var colorOriginal = new THREE.Color( wavesColor );
			var colorDarkness = new THREE.Color( wavesDarknessColor );
			
			for ( i = 0, l = wavesMaterialsDarknessSteps; i < l; i += 1 ) {
				
				materialStep = i / (wavesMaterialsDarknessSteps - 1);
				var colorDist = new THREE.Color().setRGB( colorOriginal.r * materialStep + colorDarkness.r * ( 1 - materialStep ), colorOriginal.g * materialStep + colorDarkness.g * ( 1 - materialStep ), colorOriginal.b * materialStep + colorDarkness.b * ( 1 - materialStep ) ); 
				
				wavesGeomMaterials.push( new THREE.MeshPhongMaterial( { 
					ambient: colorDist.getHex(), 
					color: colorDist.getHex(), 
					specular: 0x00daff, 
					shininess: 10, 
					shading: THREE.SmoothShading,
					transparent: true,
					opacity: wavesMaterialsOpacityBase
				} ) );
			}
			
			// create opacity materials
			
			for ( i = 0, l = wavesMaterialsOpacitySteps; i < l; i += 1 ) {
				
				materialStep = i / (wavesMaterialsOpacitySteps - 1);
				var opacityDist = 1 - materialStep;
				
				wavesGeomMaterials.push( new THREE.MeshPhongMaterial( { 
					ambient: wavesColor, 
					color: wavesColor, 
					specular: 0x00daff, 
					shininess: 10, 
					shading: THREE.SmoothShading,
					transparent: true,
					opacity: wavesMaterialsOpacityBase * opacityDist
				} ) );
			}
			
			// assign opacity materials to faces based on distance from center
			
			wavesFaces = wavesGeometry.faces;
			darknessDistMin = parameters.darknessDistMin || 1200;
			darknessDistMax = parameters.darknessOpacityDistMeet || 1850;
			opacityDistMin = Math.max( parameters.opacityDistMin || wavesSize * 0.35, darknessDistMax );
			opacityDistMax = parameters.opacityDistMax || wavesSize * 0.5;
			centerPoint = new THREE.Vector3( 0, 0, 0 );
			
			for ( i = 0, l = wavesFaces.length; i < l; i += 1 ) {
				
				face = wavesFaces[ i ];
				faceCentroid = face.centroid;
				
				faceDist = faceCentroid.distanceTo( centerPoint );
				
				// in darkness
				
				if ( faceDist < darknessDistMax ) {
					
					face.materialIndex = Math.round( (wavesMaterialsDarknessSteps - 1) * Math.min( 1, Math.max( 0, (faceDist - darknessDistMin) / (darknessDistMax - darknessDistMin) ) ) );
					
				}
				// or opacity
				else {
				
					face.materialIndex = (wavesMaterialsDarknessSteps - 1) + Math.round( (wavesMaterialsOpacitySteps- 1) * Math.min( 1, Math.max( 0, (faceDist - opacityDistMin) / (opacityDistMax - opacityDistMin) ) ) );
				
				}
				
			}
			
		}
		
		// create wave morph targets
		
		var numWavesMorphs = 10,
			morphTimeDelta = wavesInfo.timePerCycle / numWavesMorphs,
			waveVertices, 
			morphTarget, 
			morphTargetVertices,
			morphTargetVertexIndex,
			morphTargetVertex,
			v;
		
		function zeroPad(num,count)
		{
			var numZeropad = num + '';
			while(numZeropad.length < count) {
				numZeropad = "0" + numZeropad;
			}
			return numZeropad;
		}
		
		for ( i = 0, l = numWavesMorphs; i < l; i += 1 ) {
			
			// init next morph target
			morphTarget = wavesGeometry.morphTargets[ i ] = {};
			morphTarget.name = 'waves_' + zeroPad( i, 4 );
			morphTarget.vertices = [];
			
			// get next morph target
			
			waveVertices = make_waves( morphTimeDelta );
			
			// add vertices
			
			morphTargetVertices = morphTarget.vertices;
			
			for ( v = 0; v < wavesVertsW * wavesVertsH; v += 1 ) {
					
				morphTargetVertexIndex = v;
				
				morphTargetVertex = wavesGeometry.vertices[ morphTargetVertexIndex ];
				
				morphTargetVertices.push( new THREE.Vertex( new THREE.Vector3( morphTargetVertex.position.x, morphTargetVertex.position.y, waveVertices[ morphTargetVertexIndex ] ) ) );
				
			}
			
		}
		
		// add morph at end identical to base
		// required to avoid webgl bugs
		
		morphTarget = wavesGeometry.morphTargets[ numWavesMorphs ] = {};
		morphTarget.name = 'source_' + zeroPad( numWavesMorphs, 4 );
		morphTarget.vertices = [];
		
		morphTargetVertices = morphTarget.vertices;
		
		for ( v = 0; v < wavesVertsW * wavesVertsH; v += 1 ) {
				
			morphTargetVertexIndex = v;
			
			morphTargetVertex = wavesGeometry.vertices[ morphTargetVertexIndex ];
			
			morphTargetVertices.push( new THREE.Vertex( new THREE.Vector3( morphTargetVertex.position.x, morphTargetVertex.position.y, morphTargetVertex.position.z ) ) );
			
		}
		
        // water mesh
        wavesInfo.model = game.workers.objectmaker.make_model({
			geometry: wavesGeometry,
			materials: wavesMaterial,
			doubleSided: true,
			targetable: false,
			interactive: false,
			rotation: new THREE.Vector3( -90, 0, 0 )
		});
		
		wavesMesh = wavesInfo.model.mesh;
        
        container.add( wavesMesh );
        
        // water rays
        
		raysInfo = environment.rays = {};
		
		numRays = numRays = parameters.numRays || 20;
		raysInfo.active = raysActive = [];
		raysInfo.inactive = raysInactive = [];
		raysInfo.width = parameters.rayWidth || 700;
		raysInfo.height = rayHeight = parameters.rayHeight || 2000;
		raysInfo.heightVariation = parameters.rayHeightVariation || raysInfo.height * 0.5;
		raysInfo.lightAngle = parameters.lightAngle || (-Math.PI * 0.1);
		raysInfo.showChance = rayShowChance = parameters.rayShowChance || 0.001;
		raysInfo.opacityDelta = rayOpacityDelta = parameters.rayOpacityDelta || 0.02;
		raysInfo.opacityOn = rayOpacityOn = parameters.rayOpacityOn || 0.6;
		
        rayGeometry = new THREE.PlaneGeometry ( raysInfo.width, raysInfo.height + (Math.random() * (raysInfo.heightVariation) - (raysInfo.heightVariation * 0.5)) );
        
        rayTexture = new THREE.Texture( assets[rayTexturePath] ); 
        rayTexture.needsUpdate = true;
        
        for ( i = 0; i < numRays; i += 1 ) {
        
            rayMaterial = new THREE.MeshBasicMaterial( { color: wavesColor, map: rayTexture, opacity: 0, depthTest: false } );
            
			ray = new THREE.Mesh( rayGeometry, rayMaterial );
            
            ray.rotation.set( Math.PI * 0.5 - raysInfo.lightAngle, -Math.PI * 0.5, 0);
            
            // add to inactive water rays list
            raysInactive[ raysInactive.length ] = {
                ray: ray,
                material: rayMaterial,
                targetOpacity: raysInfo.opacityOn,
                targetOpacityDir: 1
            };
            
            // add to container
            container.add( ray );
        }
		
		// functions
		
		function make_waves ( time ) {
			
			var wavesVerts = wavesGeometry.vertices,
				wavesTime,
				wavesVertsNew = new Array( wavesVertsW * wavesVertsH * 3 ),
				vertVariations = vvInfo.list,
				vertIndex,
				vert,
				variation,
				vvAmp,
				vvFreq,
				vvw = wavesVertsW - 1,
				vvh = wavesVertsH - 1,
				vvpv,
				vvph,
				rayInfo,
				i, l;
			
			// update wave time
			wavesTime = wavesInfo.time += time * wavesSpeed;
			
			for ( i = 0; i < wavesVertsW; i += 1 ) {
				for ( l = 0; l < wavesVertsH; l += 1 ) {
					
					vertIndex = i + l * wavesVertsH;
					
					vert = wavesVerts[ vertIndex ];
					
					vvpw = wavesNumHorizontal * ( i / wavesVertsW );
					vvph = wavesNumVertical * ( l / wavesVertsH );
					
					// reset variation amp
					
					vvAmp = 0;
					
					// set water vert variation
					if( i !== 0 && i !== vvw && l !== 0 && l !== vvh) {
						variation = vertVariations[ i + l * wavesVertsH ];
						
						// update variation wavesAmplitude
						variation.amplitude = Math.min(vvAmpMax, Math.max(vvAmpMin, variation.amplitude + vvAmpDelta * variation.dir ));
						
						// update variation wavesFrequency
						vvFreq = wavesFrequency + Math.min( vvFreqMax, Math.max(vvFreqMin, variation.frequency + vvFreqDelta * variation.dir) );
						
						// check for switch direction of variation
						if ( variation.dirSwitch > variation.dirSwitchCount ) {
							variation.dir = -variation.dir;
							variation.dirSwitch = 0;
						}
						variation.dirSwitch += vvInfo.dirSwitchDelta * variation.dir;
						
						// set variation amp
						vvAmp = variation.amplitude;
					}
					else {
						vvAmp = 0;
						vvFreq = wavesFrequency;
					}
					
					// set water vert, x/y/z
					
					vertIndex = i + l * wavesVertsH;
					
					//wavesVertsNew[ vertIndex ] = vert.position.x;
					//wavesVertsNew[ vertIndex + 1 ] = vert.position.y;
					wavesVertsNew[ vertIndex ] = vvAmp + wavesAmplitude * ( Math.cos( vvpw * vvFreq + wavesTime ) + Math.sin( vvph * vvFreq + wavesTime ) );
					
					//vert.position.z = vvAmp + wavesAmplitude * ( Math.cos( vvpw / vvFreq + wavesTime ) + Math.sin( vvph / vvFreq + wavesTime ) );
					
					/*
					// check vert z, if low enough 
					// and there are inactive water rays, show water ray
					if (vert.position.z < -wavesAmplitude && raysInactive.length > 0 && Math.random() <= rayShowChance) {
					
						// get next ray by removing last from inactive
						rayInfo = raysInactive.pop();
						ray = rayInfo.ray;
						
						// set ray position to position of triggering water vertex
						ray.position.set(vert.position.x, vert.position.y, -(vert.position.z + rayHeight * 0.5 + wavesAmplitude));
						
						// record active index for later so we dont have to search
						rayInfo.activeIndex = raysActive.length;
						
						// add to list of active rays
						raysActive[raysActive.length] = rayInfo;
						
						// show ray
						environment.show_ray(rayInfo);
					}
					*/
				}
			}
			/*
			// recompute normals for correct lighting
			// very heavy on processing
			wavesGeometry.computeFaceNormals();
			wavesGeometry.computeVertexNormals();
			
			// tell three to update vertices
			wavesGeometry.__dirtyVertices = true;
			wavesGeometry.__dirtyNormals = true;
			*/
			
			return wavesVertsNew;
			
		}
		
		function show_ray( tri ) {
			
			var rayMat = tri.material,
				halfDelta = rayOpacityDelta * 0.5,
				targetOpacity = tri.targetOpacity;
			
			// increase material opacity towards target
			rayMat.opacity += (halfDelta + Math.random() * halfDelta) * tri.targetOpacityDir;
			
			// if at or below 0, stop showing
			if (targetOpacity === 0 && rayMat.opacity <= targetOpacity) {
				tri.targetOpacityDir = 1;
				tri.targetOpacity = rayOpacityOn;
				
				raysActive.splice( tri.activeIndex, 1 );
				
				raysInactive[ raysInactive.length ] = tri;
			}
			// else keep ray showing
			else {
				if (targetOpacity === rayOpacityOn && rayMat.opacity >= targetOpacity){
					tri.targetOpacityDir = -1;
					tri.targetOpacity = 0;
				}
				
				// recursive call until done
				window.requestAnimationFrame(function () { environment.show_ray(tri); });   
			}
			
		}
		
		return environment;
        
    }
    
    return main; 
    
}(KAIOPUA || {}));