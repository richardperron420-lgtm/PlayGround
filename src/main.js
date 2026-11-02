import './styles.css';
import * as THREE from 'three';

const $ = (id) => document.getElementById(id);
const canvas = $('game-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#62d8ff');
scene.fog = new THREE.Fog('#8ce7ff', 100, 280);
const camera = new THREE.PerspectiveCamera(54, innerWidth / innerHeight, .1, 420);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, .7)); renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = false;
scene.add(new THREE.HemisphereLight(0xc9f7ff, 0x7d8cbf, 2.1));
const sun = new THREE.DirectionalLight(0xfff5d6, 3.1); sun.position.set(-34, 58, 24); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -38, right: 38, top: 45, bottom: -45 }); sun.shadow.bias = -.0004; scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff, .55));
const C = { blue: '#00a8ff', pink: '#ff1687', yellow: '#ffe600', green: '#00ff66', orange: '#ff4500', navy: '#15234c', gold: '#ffc928', cyan: '#41e6ff', purple: '#8b5cff', white: '#fff8e9' };
const messages=[
 `MADE JUST FOR YOU! I love you, I miss you, and you are my entire world. Let's tear up this track!`,
 `WRESTLING CHAMP! I still hear your laugh from when we used to wrestle and you'd beg me to keep playing. I miss those matches every single day!`,
 `UNDEFEATED LEGEND! Hands down the greatest 5-year-old Fortnite player I have ever seen—or will EVER see!`,
 `ALWAYS IN YOUR CORNER! I never left by choice—none of this was my choice. I always want to be right there with you, no matter what.`,
 `BOING! Shake it off, champ! Get back in there and grab that crown!`,
 `QUALIFIED! #1 CHAMPION OF THE WORLD! You are my world and my everything. Dad loves you and misses you more than words can say!`
];
const toon = (color, options={}) => new THREE.MeshToonMaterial({ color, ...options });
const glossyMaterials=new Map();
const glossy = (color) => {if(!glossyMaterials.has(color))glossyMaterials.set(color,new THREE.MeshPhysicalMaterial({color,roughness:.2,metalness:.04,clearcoat:.8,clearcoatRoughness:.12}));return glossyMaterials.get(color)};
const basic = (color, options={}) => new THREE.MeshBasicMaterial({ color, ...options });
const glow = (color,intensity=.8) => new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,roughness:.28,metalness:.08});
const M = { blue:toon(C.blue), pink:toon(C.pink), yellow:toon(C.yellow), green:toon(C.green), orange:toon(C.orange), purple:toon(C.purple), gold:toon(C.gold), white:toon(C.white), dark:toon('#172653'), blue2:toon('#079fe9'), pink2:toon('#ed0874'), green2:toon('#08d765'), chrome:toon('#b5f7ff'), outline:new THREE.MeshBasicMaterial({color:'#101a38',side:THREE.BackSide}) };
const geo = { box:new THREE.BoxGeometry(1,1,1), sphere:new THREE.SphereGeometry(1,18,14), cyl:new THREE.CylinderGeometry(1,1,1,20), torus:new THREE.TorusGeometry(1,.1,8,40) };
const mesh = (g,m,parent=scene) => { const o=new THREE.Mesh(g,m); o.castShadow=true; o.receiveShadow=true; parent.add(o); return o; };
function box(x,y,z,sx,sy,sz,mat,parent=scene){ const o=mesh(geo.box,mat,parent); o.position.set(x,y,z); o.scale.set(sx,sy,sz); return o; }
function sphere(x,y,z,sx,sy,sz,mat,parent=scene){ const o=mesh(geo.sphere,mat,parent); o.position.set(x,y,z); o.scale.set(sx,sy,sz); return o; }
function addInstances(geometry,material,items){
 const instanced=new THREE.InstancedMesh(geometry,material,items.length),transform=new THREE.Object3D();
 instanced.castShadow=false;instanced.receiveShadow=false;
 items.forEach((item,index)=>{transform.position.set(...item.position);transform.scale.set(...item.scale);transform.updateMatrix();instanced.setMatrixAt(index,transform.matrix)});
 instanced.instanceMatrix.needsUpdate=true;scene.add(instanced);return instanced;
}
function outline(o, scale=1.075){ const e=new THREE.Mesh(o.geometry,M.outline); e.position.copy(o.position); e.rotation.copy(o.rotation); e.scale.copy(o.scale).multiplyScalar(scale); e.renderOrder=1; o.renderOrder=2; o.parent.add(e); return e; }
function labelTexture(text, bg='#103a75', fg='#fff', size=48){
 const c=document.createElement('canvas');c.width=1536;c.height=512;const x=c.getContext('2d');
 x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);x.strokeStyle='#ffffff';x.lineWidth=16;x.strokeRect(10,10,c.width-20,c.height-20);
 x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';const padding=40,maxWidth=c.width-padding*2,fontSize=Math.max(12,Math.floor(size*.5));x.font=`900 ${fontSize}px Nunito, sans-serif`;
 const lines=[];let line='';for(const word of text.split(/\s+/)){const test=line?`${line} ${word}`:word;if(line&&x.measureText(test).width>maxWidth){lines.push(line);line=word}else line=test}if(line)lines.push(line);
 const fitSize=Math.min(fontSize,Math.floor((c.height-padding*2)/lines.length));x.font=`900 ${fitSize}px Nunito, sans-serif`;const lineHeight=Math.min(fitSize*1.35,(c.height-padding*2)/lines.length),startY=(c.height-(lines.length-1)*lineHeight)/2;
 lines.forEach((value,i)=>x.fillText(value,c.width/2,startY+i*lineHeight,maxWidth));return new THREE.CanvasTexture(c);
}
function banner(text,z,y=7){ const t=new THREE.Mesh(new THREE.PlaneGeometry(19,5.3),new THREE.MeshBasicMaterial({map:labelTexture(text,'#12356c','#fff35b',48),side:THREE.DoubleSide}));t.position.set(0,y,z);scene.add(t);return t; }
function makeArch(z,y=0,text=''){ const h=5.6,arch=glow('#00ff72',1.25);box(-10,y+h/2,z,.72,h,.8,arch);box(10,y+h/2,z,.72,h,.8,arch);box(0,y+h,z,20.8,.8,.9,arch);box(0,y+h-.75,z,18,.18,1,M.dark);if(text)banner(text,z-.5,y+h+1.15);for(let x of [-10,10]){const flag=mesh(new THREE.ConeGeometry(.65,1.3,4),M.white);flag.position.set(x,y+h+.85,z);flag.rotation.z=Math.PI;scene.add(flag)}}
// Sky islands, soft clouds, and the roaming scoreboard blimp.
const cloudInstances=[];for(let i=0;i<24;i++){const x=(Math.random()-.5)*140,z=-Math.random()*240-8,y=20+Math.random()*28;for(let j=0;j<4;j++)cloudInstances.push({position:[x+(j-1.5)*1.6,y+Math.random()*.55,z],scale:[1.8+Math.random()*.8,.7+Math.random()*.35,1.15]});}addInstances(geo.sphere,M.white,cloudInstances);
const blimp=new THREE.Group();scene.add(blimp);sphere(0,0,0,5.2,1.4,1.7,M.gold,blimp);const gondola=box(0,-1.7,0,2.8,.65,1.1,M.pink,blimp);gondola.position.z=.2;const blimpText=new THREE.Mesh(new THREE.PlaneGeometry(4.5,1.15),new THREE.MeshBasicMaterial({map:labelTexture('CROWN RUSH!','#11285c','#ffe600',70),side:THREE.DoubleSide}));blimpText.position.set(0,0,1.6);blimp.add(blimpText);blimp.position.set(-17,18,-24);
// Course deck and checkerboard treatment.
box(0,-.7,-27,22,1.3,72,M.blue2);const startTiles=[[],[]];for(let z=8;z>-64;z-=4)for(let x=-10;x<11;x+=4)startTiles[((Math.round(z/4)+Math.round(x/4))&1)?0:1].push({position:[x,.015,z],scale:[3.98,.08,3.98]});addInstances(geo.box,M.blue2,startTiles[0]);addInstances(geo.box,M.pink2,startTiles[1]);
// Ramp from z=-63 to -96, climbing toward the tile bridge.
const rampGeo=new THREE.BufferGeometry();rampGeo.setAttribute('position',new THREE.Float32BufferAttribute([-11,0,-62,11,0,-62,11,4,-98,-11,4,-98],3));rampGeo.setIndex([0,2,1,0,3,2]);rampGeo.computeVertexNormals();mesh(rampGeo,new THREE.MeshStandardMaterial({color:'#5be89b',roughness:.7,side:THREE.DoubleSide}));
for(let i=0;i<8;i++){const z=-65-i*3.9,y=.35+(i/8)*3.9;const b=mesh(geo.cyl,M.pink);b.position.set(i%2?-6:6,y,z);b.scale.set(1.05,1.2,1.05);b.rotation.x=Math.PI/2;outline(b,1.09)}
// Bridge tiles: animate and respawn tile transforms while rendering the whole field in two draw calls.
box(0,3.6,-120,21,.5,39,M.dark);const tiles=[],tileGeometry=new THREE.CylinderGeometry(1.7,1.7,.55,6),tileMaterial=new THREE.MeshToonMaterial({color:'#ffffff',vertexColors:true});
for(let r=0;r<11;r++)for(let c=0;c<6;c++){const x=(c-2.5)*3.05,z=-101-r*4.55,position=new THREE.Vector3(x,4.05,z),rotation=new THREE.Euler(0,Math.PI/6,0);tiles.push({mesh:{position,rotation,visible:true},outline:{position:position.clone(),rotation:rotation.clone(),visible:true},color:(r+c)%2?'#ffe600':'#ffef55',x,z,state:'ready',timer:0});}
const tileInstances=new THREE.InstancedMesh(tileGeometry,tileMaterial,tiles.length),tileOutlines=new THREE.InstancedMesh(tileGeometry,M.outline,tiles.length),tileTransform=new THREE.Object3D();tileOutlines.renderOrder=1;tileInstances.renderOrder=2;tileInstances.castShadow=tileOutlines.castShadow=false;scene.add(tileOutlines,tileInstances);
for(let i=0;i<tiles.length;i++){tileInstances.setColorAt(i,new THREE.Color(tiles[i].color));}tileInstances.instanceColor.needsUpdate=true;
function syncTileInstances(){for(let i=0;i<tiles.length;i++){const t=tiles[i];tileTransform.position.copy(t.mesh.position);tileTransform.rotation.copy(t.mesh.rotation);tileTransform.scale.setScalar(t.mesh.visible?1:0);tileTransform.updateMatrix();tileInstances.setMatrixAt(i,tileTransform.matrix);tileTransform.position.copy(t.outline.position);tileTransform.rotation.copy(t.outline.rotation);tileTransform.scale.setScalar(t.outline.visible?1.045:0);tileTransform.updateMatrix();tileOutlines.setMatrixAt(i,tileTransform.matrix)}tileInstances.instanceMatrix.needsUpdate=true;tileOutlines.instanceMatrix.needsUpdate=true;}
let tileInstancesDirty=true;syncTileInstances();tileInstancesDirty=false;
// Hex bridge foundation is only a safety visual far below the stepping stones.
for(let i=0;i<4;i++){const pivot=new THREE.Group();pivot.position.set(0,11,-108-i*9);scene.add(pivot);const chain=mesh(new THREE.CylinderGeometry(.18,.18,4.3,12),glow('#b9fbff',.65),pivot);chain.position.y=-2.2;const shaft=mesh(new THREE.CylinderGeometry(.31,.38,4.5,16),glow('#ffb400',.8),pivot);shaft.position.y=-4.25;const grip=mesh(new THREE.CylinderGeometry(.4,.4,.72,16),glow('#fff200',1.25),pivot);grip.position.y=-2.25;const head=sphere(0,-5.35,0,2.1,1.65,2.15,glow(i%2?'#ff3d8e':'#ff602b',1.15),pivot);const face=box(0,-5.35,1.92,2.45,.65,.16,glow('#fff200',1.1),pivot);tiles[i].hammer=pivot;}
// Final climb and striped racing surface.
const finalGeo=new THREE.BufferGeometry();finalGeo.setAttribute('position',new THREE.Float32BufferAttribute([-11,4,-150,11,4,-150,11,9.5,-198,-11,9.5,-198],3));finalGeo.setIndex([0,2,1,0,3,2]);finalGeo.computeVertexNormals();mesh(finalGeo,new THREE.MeshStandardMaterial({color:'#20d9b2',roughness:.65,side:THREE.DoubleSide}));
const finalTiles=[[],[]];for(let z=-152;z>-200;z-=4)for(let x=-10;x<11;x+=4)finalTiles[((Math.round(z/4)+Math.round(x/4))&1)?0:1].push({position:[x,4+(-z-150)*.115+.07,z],scale:[3.98,.08,3.98]});addInstances(geo.box,M.blue2,finalTiles[0]);addInstances(geo.box,M.pink2,finalTiles[1]);
function groundAt(z){if(z>-62)return 0;if(z>-98)return (-z-62)*.111;if(z>-150)return 4;if(z>-198)return 4+(-z-150)*.115;return 9.5}
makeArch(2,0,messages[0]);makeArch(-59,0,messages[1]);makeArch(-96,4,messages[2]);makeArch(-151,4,messages[3]);makeArch(-198,9.5,messages[5]);
// Decorative rails, foam pylons, and stage markers.
const rails={pink:[],yellow:[],green:[]};for(let z=5;z>-199;z-=4){const y=groundAt(z),key=z<-150?'green':z<-98?'yellow':'pink';for(const x of [-11.2,11.2])rails[key].push({position:[x,y+.35,z],scale:[.48,.7,3.8]});}addInstances(geo.box,M.pink,rails.pink);addInstances(geo.box,M.yellow,rails.yellow);addInstances(geo.box,M.green,rails.green);
// Personalized overhead messages are displayed on the start and three zone arches.
// Collectibles / finish crown and podium.
const crown=new THREE.Group();scene.add(crown);crown.position.set(0,10.8,-199);const crownRing=mesh(new THREE.TorusGeometry(1.55,.3,12,48),M.gold,crown);crownRing.rotation.x=Math.PI/2;for(let i=0;i<5;i++){const p=mesh(new THREE.ConeGeometry(.42,1.25,5),M.yellow,crown);const a=i*Math.PI*2/5;p.position.set(Math.cos(a)*1.35,.55,Math.sin(a)*1.35)}sphere(0,0,0,1.7,.32,1.7,M.gold,crown);box(0,9.5,-200,8,1,8,M.gold);box(0,8.5,-200,9,1,9,M.pink);
// Spinner turntables and their broad padded sweeper arms.
const spinners=[];for(let i=0;i<3;i++){const z=-14-i*17;const disk=mesh(new THREE.CylinderGeometry(10,10,.38,40),i%2?M.pink:M.blue);disk.position.set(0,.15,z);const ring=mesh(new THREE.TorusGeometry(9.7,.22,10,60),M.yellow);ring.rotation.x=Math.PI/2;ring.position.set(0,.4,z);const pivot=new THREE.Group();pivot.position.set(0,.65,z);scene.add(pivot);const arm=box(0,0,0,18,.62,1.05,M.orange,pivot);arm.position.y=.35;for(let stripe=-7;stripe<=7;stripe+=2){const band=box(stripe,.69,0,.72,.12,1.12,stripe%4?M.yellow:M.white,pivot);band.renderOrder=3;}const cap1=sphere(-8.6,.35,0,.8,.42,.8,glow('#ffe600',1.2),pivot),cap2=sphere(8.6,.35,0,.8,.42,.8,glow('#ffe600',1.2),pivot);spinners.push({pivot,sign:i%2?1:-1,z});}
// Pinball alley bumpers and cannons.
const bumpers=[];for(let i=0;i<8;i++){const z=-66-i*3.65,x=i%2?-6.5:6.5,y=groundAt(z)+.9;const b=mesh(geo.cyl,M.pink);b.position.set(x,y,z);b.rotation.x=Math.PI/2;b.scale.set(1.1,1.7,1.1);outline(b,1.08);bumpers.push({mesh:b,x,z})}
const cannonBalls=[];const ballColors=['#45ff3d','#ff4b32','#ff35d2'];for(let i=0;i<3;i++){const x=(i-1)*6.5;const barrel=mesh(geo.cyl,M.dark);barrel.position.set(x,5.3,-99);barrel.rotation.x=Math.PI/2;barrel.scale.set(1.1,4,1.1);const rim=mesh(new THREE.TorusGeometry(1.08,.22,10,24),glow('#fff200',1.25));rim.position.set(x,5.3,-96.8);rim.rotation.x=Math.PI/2;
for(let j=0;j<3;j++){const ball=new THREE.Group(),shell=sphere(0,0,0,1.48,1.48,1.48,glow(ballColors[i],.8),ball),ring=mesh(new THREE.TorusGeometry(1.12,.13,10,32),glow('#fff200',1.3),ball);ring.rotation.y=Math.PI/2;const seam=mesh(new THREE.TorusGeometry(1.12,.1,10,32),glow('#ffffff',.9),ball);seam.rotation.x=Math.PI/2;scene.add(ball);ball.visible=false;cannonBalls.push({mesh:ball,x,z:-95,active:false,delay:i*.4+j*1.2});}}

// Sliding foam walls on the climb.
const foamWalls=[];for(let i=0;i<4;i++){const z=-158-i*10;const w=box(0,groundAt(z)+1.5,z,5.2,2.4,1.2,i%2?M.pink:M.orange);outline(w,1.04);foamWalls.push({mesh:w,z,phase:i*1.6});}
// Checkpoint boards carry the personalized messages in-world.
const checkpointZ=[2,-57,-94,-149];
const stageNames=['START LINE','SWEEPER CITY','CANNON ALLEY','HEX-A-DROP','SLIME CLIMB','CROWN PODIUM'];
// Glossy bean runners with expressive faces, caps, articulated arms, and animated legs.
function makeRunner(color,champion=false){
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const skin=glossy(champion?'#ffbf95':color),shirt=glossy(champion?'#ffcb28':color),dark=glossy('#18254a');
 sphere(0,1.04,0,.62,.82,.52,shirt,body);
 sphere(0,.82,-.01,.57,.45,.5,skin,body);
 sphere(0,1.58,-.16,.52,.52,.46,skin,body);
 const eyeWhite=glossy('#fff'),pupil=glossy('#14213e');
 for(const x of [-.2,.2]){sphere(x,1.62,-.565,.13,.16,.07,eyeWhite,body);sphere(x+.025,1.61,-.625,.058,.078,.035,pupil,body)}
 const smile=mesh(new THREE.TorusGeometry(.14,.035,6,16,Math.PI),dark,body);smile.position.set(0,1.36,-.61);smile.rotation.z=Math.PI;
 const capMat=champion?glossy('#ffc928'):dark;
 sphere(0,2.03,.12,.58,.22,.52,capMat,body);
 const brim=mesh(new THREE.CylinderGeometry(.38,.38,.09,18),capMat,body);brim.position.set(0,2.02,.52);brim.rotation.x=Math.PI/2;
 sphere(0,1.06,-.55, .18,.1,.035,glossy('#ffe600'),body);
 const arms=[],legs=[];
 for(const x of [-.68,.68]){
  const arm=sphere(x,1.05,0,.2,.48,.2,skin,body);arm.rotation.z=x<0?-.3:.3;arms.push(arm);
  const leg=sphere(x*.53,.31,0,.22,.38,.23,champion?glossy('#ffc928'):dark,body);legs.push(leg);
  sphere(x*.53,.08,-.13,.3,.14,.4,glossy(champion?'#ff7b32':'#fff8e9'),body);
 }
 const starGroup=new THREE.Group();body.add(starGroup);starGroup.position.y=2.7;
 for(let i=0;i<4;i++){const s=mesh(new THREE.ShapeGeometry(new THREE.Shape().setFromPoints(Array.from({length:10},(_,k)=>{const a=k*Math.PI/5-Math.PI/2,r=k%2?.13:.3;return new THREE.Vector2(Math.cos(a)*r,Math.sin(a)*r)}))),M.yellow,starGroup);s.position.set(Math.cos(i*Math.PI/2)*.72,0,Math.sin(i*Math.PI/2)*.3);s.rotation.y=Math.PI/2;}
 const flashMaterials=[];root.traverse(o=>{if(!o.isMesh)return;o.material=(Array.isArray(o.material)?o.material:[o.material]).map(material=>{const local=material.clone();flashMaterials.push({material:local,opacity:local.opacity,transparent:local.transparent});return local})});
 return {root,body,arms,legs,starGroup,flashMaterials};
}
const playerVisual=makeRunner(C.gold,true);scene.add(playerVisual.root);
const player={...playerVisual,x:0,z:4,y:0,vx:0,vz:0,vy:0,heading:0,grounded:true,stun:0,dive:0,diveUsed:false,checkpoint:0,knock:0,finished:false,walk:0,falling:false,invulnerableUntil:0,knockUntil:0};player.root.position.set(player.x,player.y,player.z);
// Fifteen independently animated racers in distinct bright neon colors.
const botColors=['#19e7f4','#ff487f','#91ff3d','#ab70ff','#ff7b32','#f4e839','#00c7a6','#f553de','#58a3ff','#ff5262','#bfff47','#ff9bd5','#8cfcff','#fb8b1c','#b2a1ff'];
const bots=[];
for(let i=0;i<15;i++){
 const vis=makeRunner(botColors[i]),col=i%5,row=Math.floor(i/5),x=(col-2)*4+(Math.random()-.5)*.5,z=-1.5-row*4;
 vis.root.position.set(x,0,z);scene.add(vis.root);
 bots.push({...vis,x,z,y:0,vx:0,vz:0,vy:0,grounded:true,stun:0,knock:0,walk:Math.random()*5,speed:7.6+Math.random()*1.7,lane:(col-2)*2.1,phase:Math.random()*8,jumpCd:1+Math.random()*3,checkpoint:0,finished:false,invulnerableUntil:0,knockUntil:0});
}
const game={mode:'ready',time:0,countdown:0,bannerTimer:0,checkpoint:0,stage:0,wallClock:0,sound:true,confetti:[],finishCamera:false};
const audioCtx=window.AudioContext?new AudioContext():null;
function tone(freq=660,duration=.16,type='sine',volume=.07){if(!game.sound||!audioCtx)return;if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration)}
function chime(){tone(523,.12);setTimeout(()=>tone(659,.14),80);setTimeout(()=>tone(784,.25),160)}
function horn(){tone(180,.4,'sawtooth',.045);setTimeout(()=>tone(220,.45,'sawtooth',.045),140)}
function spring(){tone(420,.12,'triangle');setTimeout(()=>tone(790,.22,'triangle'),90)}
function showMessage(index,duration=6){const el=$('checkpoint-banner');el.textContent=messages[index];el.classList.add('show');game.bannerTimer=duration;chime()}
function startRace(){if(game.mode==='running'||game.mode==='countdown')return;resetGame();game.mode='countdown';game.countdownStart=performance.now();game.countdownValue=3;game.goDisplayUntil=0;$('start-screen').classList.add('hidden');$('finish-screen').classList.add('hidden');$('race-status').textContent='GET READY';const count=$('countdown');count.textContent='3';count.classList.remove('hidden','count-pop');void count.offsetWidth;count.classList.add('count-pop');horn()}
$('play-button').addEventListener('click',startRace);$('replay-button').addEventListener('click',startRace);$('sound-toggle').addEventListener('click',()=>{$('sound-toggle').classList.toggle('muted');game.sound=!game.sound;$('sound-toggle').textContent=game.sound?'♫':'×'});
function resetGame(){game.mode='ready';game.time=0;game.countdown=0;game.checkpoint=0;game.stage=0;game.wallClock=0;game.bannerTimer=0;$('checkpoint-banner').classList.remove('show');game.finishCamera=false;game.confetti.forEach(p=>scene.remove(p.mesh));game.confetti=[];player.x=0;player.z=4;player.y=0;player.vx=player.vz=player.vy=0;player.grounded=true;player.stun=player.dive=player.knock=0;player.invulnerableUntil=player.knockUntil=0;player.heading=0;player.checkpoint=0;player.finished=false;player.falling=false;player.diveUsed=false;player.slide=0;player.root.position.set(player.x,player.y,player.z);player.root.rotation.set(0,0,0);player.body.rotation.set(0,0,0);player.body.scale.set(1,1,1);player.starGroup.visible=false;for(let i=0;i<bots.length;i++){const b=bots[i],col=i%5,row=Math.floor(i/5);b.x=(col-2)*4;b.z=-1.5-row*4;b.y=0;b.vx=b.vz=b.vy=0;b.stun=b.knock=0;b.invulnerableUntil=b.knockUntil=0;b.checkpoint=0;b.jumpCd=1+Math.random()*2;b.finished=false;b.root.position.set(b.x,b.y,b.z);b.root.rotation.set(0,0,0);b.body.rotation.set(0,0,0);b.body.scale.set(1,1,1)}for(const t of tiles){t.state='ready';t.timer=0;t.mesh.visible=true;t.outline.visible=true;t.mesh.position.y=4.05;t.mesh.rotation.set(0,Math.PI/6,0)}cannonBalls.forEach(b=>{b.active=false;b.mesh.visible=false;b.delay=Math.random()*1.1});$('progress-fill').style.width='0%';$('stage-value').textContent=stageNames[0];$('place-value').innerHTML='16<span>TH</span>';$('timer-value').textContent='00:00';}
// Controls: keyboard and analog virtual stick share one normalized input vector.
const keys=new Set(),input={x:0,y:0,jump:false,dive:false};let jumpQueued=false,diveQueued=false;
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='Space'||e.code==='ArrowUp')jumpQueued=true;if(e.code==='ShiftLeft'||e.code==='ShiftRight'||e.code==='KeyX')diveQueued=true;if(e.code==='Enter'&&(game.mode==='ready'||game.mode==='finished'))startRace();if(e.code==='KeyR'&&game.mode==='finished')startRace()});window.addEventListener('keyup',e=>keys.delete(e.code));
function readInput(){let x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),y=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0);x+=input.x;y+=input.y;const l=Math.hypot(x,y);if(l>1){x/=l;y/=l}return{x,y}}
const joy=$('joystick'),knob=$('joy-knob');let joyPointer=null;
joy.addEventListener('pointerdown',e=>{joyPointer=e.pointerId;joy.setPointerCapture(e.pointerId);moveJoy(e)});joy.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)moveJoy(e)});function moveJoy(e){const r=joy.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),max=r.width*.34,d=Math.min(max,Math.hypot(dx,dy)),a=Math.atan2(dy,dx);input.x=Math.cos(a)*d/max;input.y=-Math.sin(a)*d/max;knob.style.transform=`translate(${input.x*max}px,${-input.y*max}px)`}function endJoy(e){if(e.pointerId===joyPointer){joyPointer=null;input.x=input.y=0;knob.style.transform='translate(0,0)'}}joy.addEventListener('pointerup',endJoy);joy.addEventListener('pointercancel',endJoy);
$('jump-button').addEventListener('pointerdown',e=>{e.preventDefault();jumpQueued=true});$('dive-button').addEventListener('pointerdown',e=>{e.preventDefault();diveQueued=true});
function tileUnder(x,z){if(z>-99||z<-150)return null;let c=Math.round(x/3.05+2.5),r=Math.round((-101-z)/4.55);if(c<0||c>5||r<0||r>10)return null;const t=tiles[r*6+c];return Math.abs(x-t.x)<1.62&&Math.abs(z-t.z)<1.95?t:null}
function surfaceAt(x,z){if(z>-62||z<-198)return groundAt(z);if(z>-98)return groundAt(z);if(z>-150){const t=tileUnder(x,z);return t&&t.state!=='gone'?4:-100}return groundAt(z)}
function trip(tile){if(tile&&tile.state==='ready'){tile.state='shaking';tile.timer=0;}}
function knock(entity,sourceX,sourceZ,force=10){const now=performance.now();if(now<entity.invulnerableUntil)return;let dx=entity.x-sourceX,dz=entity.z-sourceZ,l=Math.hypot(dx,dz)||1;entity.vx+=dx/l*force;entity.vz+=dz/l*force;entity.vy=Math.max(entity.vy,7);entity.stun=.35;entity.knock=.35;entity.knockUntil=now+350;entity.invulnerableUntil=now+2000;if(entity.body&&entity.starGroup)entity.starGroup.visible=true;tone(235,.12,'square',.045)}
function respawn(entity,isPlayer=false){const cp=isPlayer?player.checkpoint:(entity.checkpoint||0),z=cp===0?(isPlayer?4:-1.5):checkpointZ[cp]+2;entity.x=isPlayer?0:(Math.random()-.5)*8;entity.z=z;entity.y=groundAt(z);entity.vx=entity.vz=entity.vy=0;entity.stun=entity.knock=0;entity.grounded=true;entity.falling=false;entity.root.rotation.set(0,0,0);entity.body.rotation.set(0,0,0);if(entity.starGroup)entity.starGroup.visible=false;if(isPlayer){player.dive=0;player.diveUsed=false;$('respawn-flash').classList.remove('blink');void $('respawn-flash').offsetWidth;$('respawn-flash').classList.add('blink');showMessage(4);spring()}else entity.z+=Math.random()*5;}
function stageFor(z){if(z>-60)return 0;if(z>-97)return 1;if(z>-150)return 2;if(z>-198)return 3;return 4}
function hitHazards(entity,isPlayer=false){if(entity.stun>0||performance.now()<entity.invulnerableUntil)return;
 for(const h of spinners){const dx=entity.x,dz=entity.z-h.z,a=h.pivot.rotation.y,localX=dx*Math.cos(a)-dz*Math.sin(a),localZ=dx*Math.sin(a)+dz*Math.cos(a);if(Math.abs(localZ)<1.15&&Math.abs(localX)<9.2&&entity.y<groundAt(entity.z)+2.5){knock(entity,0,h.z,10);return}}
 for(const b of bumpers){if(Math.abs(entity.z-b.z)<1.45&&Math.abs(entity.x-b.x)<1.6&&entity.y<groundAt(entity.z)+2.5){knock(entity,b.x,b.z,14);entity.vy=13.5;return}}
 for(const ball of cannonBalls){if(ball.active&&Math.abs(entity.z-ball.z)<1.7&&Math.abs(entity.x-ball.x)<1.8&&Math.abs(entity.y-(groundAt(ball.z)+1.2))<2.1){knock(entity,ball.x,ball.z,10);return}}
 for(let i=0;i<4;i++){const pivot=tiles[i].hammer,a=pivot.rotation.z,hx=Math.sin(a)*4.8,hY=11-Math.cos(a)*4.8;if(Math.abs(entity.z-pivot.position.z)<2.1&&Math.abs(entity.x-hx)<2.4&&Math.abs(entity.y+1.1-hY)<2.7){knock(entity,hx,pivot.position.z,10);return}}
 for(const w of foamWalls){if(Math.abs(entity.z-w.z)<1.45&&Math.abs(entity.x-w.mesh.position.x)<3.05&&entity.y<groundAt(entity.z)+3){knock(entity,w.mesh.position.x,w.z,14);return}}
}
function updateTiles(dt){for(const t of tiles){if(t.state==='shaking'){t.timer+=dt;t.mesh.position.y=4.05+Math.sin(t.timer*48)*.12;t.mesh.rotation.z=Math.sin(t.timer*38)*.06;tileInstancesDirty=true;if(t.timer>=.6){t.state='gone';t.timer=0;t.mesh.visible=false;t.outline.visible=false}}else if(t.state==='gone'){t.timer+=dt;if(t.timer>=3){t.state='ready';t.timer=0;t.mesh.visible=true;t.outline.visible=true;t.mesh.position.y=4.05;t.mesh.rotation.set(0,Math.PI/6,0);tileInstancesDirty=true}}if(t.mesh.visible){t.outline.position.copy(t.mesh.position);t.outline.rotation.copy(t.mesh.rotation)}}if(tileInstancesDirty){syncTileInstances();tileInstancesDirty=false}}
function updateHazards(dt){for(const h of spinners){h.pivot.rotation.y+=dt*Math.PI/4*.6*h.sign;if(Math.abs(player.z-h.z)<11&&Math.abs(player.x)<11&&player.grounded)player.vx+=Math.sin(h.pivot.rotation.y)*dt*1.7}
 for(let i=0;i<4;i++){const pivot=tiles[i].hammer;pivot.rotation.z=Math.sin(game.wallClock*1.7+i*1.15)*.72}
 for(const w of foamWalls){w.mesh.position.x=Math.sin(game.wallClock*1.25+w.phase)*6.2}
 for(const ball of cannonBalls){ball.delay-=dt;if(!ball.active&&ball.delay<=0){ball.active=true;ball.mesh.visible=true;ball.z=-98.5}if(ball.active){ball.z+=dt*8.6;ball.mesh.position.set(ball.x,groundAt(ball.z)+1.3,ball.z);ball.mesh.rotation.x+=dt*2.8;if(ball.z>-61){ball.active=false;ball.mesh.visible=false;ball.delay=1.2}}}
 crown.rotation.y+=dt*1.3;crown.position.y=10.8+Math.sin(game.wallClock*2.4)*.35;}
function animateRunner(e,dt,moving=true){e.walk+=dt*(moving?9:2);const amt=moving?1:0;const squash=1+Math.sin(e.walk*2)*.07*amt;e.body.scale.set(1,Math.max(.82,squash),1);for(let i=0;i<2;i++){if(e.legs[i])e.legs[i].rotation.x=Math.sin(e.walk+i*Math.PI)*.52*amt;if(e.arms[i])e.arms[i].rotation.x=Math.sin(e.walk+i*Math.PI+Math.PI)*.52*amt}if(e.starGroup.visible){e.starGroup.rotation.y+=dt*5;e.starGroup.position.y=2.65+Math.sin(e.walk*5)*.12}}
function updateRunnerFlash(e,now){const active=now<e.invulnerableUntil,opacity=active?(Math.floor(now/110)%2?.42:.72):1;if(e.flashActive===active&&e.flashOpacity===opacity)return;e.flashActive=active;e.flashOpacity=opacity;for(const entry of e.flashMaterials){entry.material.opacity=active?opacity:entry.opacity;entry.material.transparent=active||entry.transparent;entry.material.needsUpdate=true}}
function stepRunner(e,dt,isPlayer=false){if(e.finished)return;
 const now=performance.now();updateRunnerFlash(e,now);if(now>=e.knockUntil){e.body.rotation.x=0;e.body.rotation.z=0;e.root.rotation.x=0;e.root.rotation.z=0}const floor=surfaceAt(e.x,e.z);if(e.grounded&&floor>-50){e.y=floor;trip(tileUnder(e.x,e.z))}if(e.y<-7||Math.abs(e.x)>11.8||floor<-50&&e.y<2){respawn(e,isPlayer);return}
 if(e.stun>0){e.stun-=dt;e.vx*=Math.max(0,1-dt*1.5);e.vz*=Math.max(0,1-dt*1.5);e.vy-=30*dt;e.y+=e.vy*dt;e.x+=e.vx*dt;e.z+=e.vz*dt;if(!isPlayer){e.x=THREE.MathUtils.clamp(e.x,-9.6,9.6);if(Math.abs(e.x)>=9.6)e.vx=0}if(e.stun<=0){e.body.rotation.set(0,0,0);e.knock=0;if(e.starGroup)e.starGroup.visible=false}}
 else if(isPlayer){const ctl=readInput();const max=e.dive>0?14:11;const accel=e.grounded?26:9;e.vx=THREE.MathUtils.damp(e.vx,ctl.x*max,accel,dt);e.vz=THREE.MathUtils.damp(e.vz,-ctl.y*max,accel,dt);if(Math.abs(ctl.x)+Math.abs(ctl.y)>.12)e.heading=Math.atan2(e.vx,-e.vz);if(jumpQueued&&e.grounded){e.vy=14;e.grounded=false;e.diveUsed=false;tone(520,.11,'sine')}jumpQueued=false;if(diveQueued&&!e.grounded&&!e.diveUsed){e.vz=-18;e.vy=3;e.dive=.48;e.diveUsed=true;e.body.rotation.x=-Math.PI/2;tone(310,.15,'sawtooth',.04)}diveQueued=false;if(e.dive>0)e.dive=Math.max(0,e.dive-dt);if(e.z<-150&&e.grounded)e.vz+=2.8;}
 else {e.jumpCd-=dt;let desired=THREE.MathUtils.clamp(e.lane+Math.sin(game.wallClock*.75+e.phase)*1.3,-8.6,8.6);if(Math.abs(e.x-desired)<1.2&&Math.random()<dt*.4)desired=THREE.MathUtils.clamp(desired+(Math.random()-.5)*3,-8.6,8.6);e.vx=THREE.MathUtils.damp(e.vx,THREE.MathUtils.clamp((desired-e.x)*3,-7,7),7,dt);e.vz=THREE.MathUtils.damp(e.vz,-e.speed,9,dt);if(e.jumpCd<0&&e.grounded&&(Math.random()<dt*.85||Math.abs(e.z+14)<2||Math.abs(e.z+31)<2||Math.abs(e.z+48)<2||Math.abs(e.z+69)<2)){e.vy=13.5;e.grounded=false;e.jumpCd=2+Math.random()*2}if(e.z<-150&&e.grounded)e.vz+=2.4;}
 if(e.grounded&&e.dive>0){e.vz=-14;e.dive=0;e.slide=.4}if(e.slide>0){e.slide-=dt;e.vz=Math.min(e.vz,-12)}
 e.vy-=30*dt;e.y+=e.vy*dt;e.x+=e.vx*dt;e.z+=e.vz*dt;if(!isPlayer){e.x=THREE.MathUtils.clamp(e.x,-9.6,9.6);if(Math.abs(e.x)>=9.6)e.vx=0}
 const newFloor=surfaceAt(e.x,e.z);if(e.vy<=0&&e.y<=newFloor&&newFloor>-50){e.y=newFloor;e.vy=0;e.grounded=true;if(e.diveUsed&&isPlayer)e.slide=.4;if(isPlayer&&e.slide>0)e.vz=-Math.max(10,Math.abs(e.vz));}else e.grounded=false;
 if(e.stun<=0){hitHazards(e,isPlayer)}
 e.root.position.set(e.x,e.y, e.z);e.root.rotation.y=e.heading||0;if(e.knock>0){e.body.rotation.z=Math.sin(game.wallClock*30)*.8;e.body.rotation.x=Math.sin(game.wallClock*24)*.7}
 animateRunner(e,dt,Math.abs(e.vx)+Math.abs(e.vz)>.7);
 if(isPlayer){
   if(Math.abs(e.x)>10.5)e.vx+=Math.sign(-e.x)*18;
   for(let cp=1;cp<=3;cp++)if(e.checkpoint<cp&&e.z<=checkpointZ[cp]){e.checkpoint=cp;game.checkpoint=cp;showMessage(cp)}
   if(e.z<-196&&Math.abs(e.x)<4&&e.y>7.5)winRace();
  }else{
   for(let cp=1;cp<=3;cp++)if((e.checkpoint||0)<cp&&e.z<=checkpointZ[cp])e.checkpoint=cp;
   if(e.z<-196&&Math.abs(e.x)<10){e.finished=true;e.z=-199;e.vx=e.vz=0}
  }
}

function winRace(){
 if(game.mode!=='running')return;
 game.mode='finished';game.finishCamera=true;player.finished=true;player.vx=player.vz=player.vy=0;player.starGroup.visible=true;
 $('race-status').textContent='CHAMPION';$('finish-time').textContent=formatTime(game.time);$('finish-screen').classList.remove('hidden');$('countdown').classList.add('hidden');showMessage(5,9999);
 chime();setTimeout(()=>tone(988,.28,'triangle'),260);spawnConfetti();
}
function formatTime(seconds){const total=Math.floor(seconds),m=Math.floor(total/60),s=total%60;return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function ordinal(n){if(n%100>=11&&n%100<=13)return `${n}TH`;return `${n}${n%10===1?'ST':n%10===2?'ND':n%10===3?'RD':'TH'}`}
function updateHud(){
 const progress=THREE.MathUtils.clamp((-player.z+4)/202,0,1),stage=player.finished?5:stageFor(player.z);
 $('progress-fill').style.width=`${progress*100}%`;$('stage-value').textContent=stageNames[stage];$('timer-value').textContent=formatTime(game.time);
 const ahead=bots.filter(b=>b.finished||b.z<player.z).length+1;$('place-value').innerHTML=`${ahead}<span>${ordinal(ahead).slice(String(ahead).length)}</span>`;
}
function spawnConfetti(){
 const colors=['#ffe600','#ff1687','#00cfff','#58f28b','#ffffff','#ff7b32','#a879ff'];
 for(let i=0;i<190;i++){
  const material=basic(colors[i%colors.length],{side:THREE.DoubleSide});
  const piece=mesh(i%3===0?geo.sphere:geo.box,material);const angle=Math.random()*Math.PI*2,radius=Math.random()*7;
  piece.position.set(Math.cos(angle)*radius,10+Math.random()*11,-199+Math.sin(angle)*radius);
  piece.scale.set(.12+Math.random()*.16,.12+Math.random()*.25,.06+Math.random()*.12);
  game.confetti.push({mesh:piece,vx:(Math.random()-.5)*8,vy:5+Math.random()*9,vz:(Math.random()-.5)*8,spin:(Math.random()-.5)*12,life:5+Math.random()*3});
 }
}
function updateConfetti(dt){
 for(let i=game.confetti.length-1;i>=0;i--){const p=game.confetti[i];p.life-=dt;p.vy-=13*dt;p.mesh.position.x+=p.vx*dt;p.mesh.position.y+=p.vy*dt;p.mesh.position.z+=p.vz*dt;p.mesh.rotation.x+=p.spin*dt;p.mesh.rotation.y+=p.spin*.7*dt;if(p.life<=0||p.mesh.position.y<-3){scene.remove(p.mesh);p.mesh.material.dispose();game.confetti.splice(i,1)}}
}
function updateCamera(dt){
 let desired,target;
 if(game.finishCamera){desired=new THREE.Vector3(0,15,-181);target=new THREE.Vector3(0,10,-200)}
 else {desired=new THREE.Vector3(player.x*.4,player.y+7.6,player.z+14.5);target=new THREE.Vector3(player.x,player.y+1.15,player.z-4.8)}
 const blend=1-Math.exp(-dt*(game.finishCamera?1.5:4.2));camera.position.lerp(desired,blend);camera.lookAt(target);
}
function frame(now){
 requestAnimationFrame(frame);const dt=Math.min((now-lastFrame)/1000,.04);lastFrame=now;game.wallClock+=dt;
 updateHazards(dt);updateTiles(dt);updateConfetti(dt);
 if(game.mode==='countdown'){
  const elapsed=(now-game.countdownStart)/1000;
  if(elapsed>=3){const count=$('countdown');count.textContent='GO!';count.classList.remove('count-pop');void count.offsetWidth;count.classList.add('count-pop');$('race-status').textContent='RACING';game.mode='running';game.goDisplayUntil=now+650;showMessage(0);tone(880,.3,'square')}
  else{const value=3-Math.floor(elapsed);if(value!==game.countdownValue){game.countdownValue=value;const count=$('countdown');count.textContent=String(value);count.classList.remove('count-pop');void count.offsetWidth;count.classList.add('count-pop');tone(490,.12,'square')}}
 }
 if(game.goDisplayUntil&&now>=game.goDisplayUntil){$('countdown').classList.add('hidden');game.goDisplayUntil=0}
 if(game.mode==='running'){
  game.time+=dt;stepRunner(player,dt,true);for(const b of bots)stepRunner(b,dt,false);
  if(game.bannerTimer>0){game.bannerTimer-=dt;if(game.bannerTimer<=0)$('checkpoint-banner').classList.remove('show')}
  if(game.time-lastHudUpdate>.12){updateHud();lastHudUpdate=game.time}
 }
 updateCamera(dt);renderer.render(scene,camera);
}
let lastFrame=performance.now(),lastHudUpdate=0;
function onResize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,.7));renderer.setSize(innerWidth,innerHeight)}
window.addEventListener('resize',onResize);requestAnimationFrame(frame);
requestAnimationFrame(()=>{$('loading').classList.add('done')});
