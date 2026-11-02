(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const ui = {
    start: $('startScreen'), pause: $('pauseScreen'), finish: $('finishScreen'), collection: $('collectionScreen'), memory: $('memoryScreen'),
    hud: $('hud'), mobile: $('mobileControls'), progress: $('progressFill'), distance: $('distanceReadout'), runCount: $('inRunCount'), count: $('collectionCount'),
    memoryGrid: $('memoryGrid'), title: $('memoryTitle'), message: $('memoryMessage'), eyebrow: $('memoryEyebrow'), toast: $('toast'), toastTitle: $('toastTitle'), toastBody: $('toastBody')
  };

  const COURSE_LENGTH = 4200;
  const memories = [
    { id: 'laugh', x: 510, icon: '☺', title: 'That one-of-a-kind laugh', message: 'I remember that laugh of yours so clearly. The kind that made me start laughing too, even when I had no idea what was so funny. I still carry it with me.' },
    { id: 'wrestle', x: 1450, icon: '✊', title: 'The wrestling champion', message: 'I remember when we used to wrestle and tumble around together. You were little, but somehow you had the strength of about twelve tiny bears. Those moments mean the world to me.' },
    { id: 'fortnite', x: 2580, icon: '🎮', title: 'Battle Royale legend', message: 'You were one of the greatest five-year-olds I ever saw play Fortnite. Your strategy was elite. Your victory dances were… legally unstoppable.' },
    { id: 'love', x: 3650, icon: '💛', title: 'A note that never changes', message: 'I love you. I always want to be with you, and I will never leave you. Being apart was not my choice. You are always in my heart, wherever you are.' }
  ];
  const obstacles = [
    { x: 760, w: 70, h: 65, type: 'crate', label: 'BONK BOX' },
    { x: 1040, w: 130, h: 25, type: 'bar', label: 'DUCK!' },
    { x: 1320, w: 90, h: 76, type: 'crate', label: 'BONK BOX' },
    { x: 1830, w: 58, h: 99, type: 'spinner', label: 'WHOOSH' },
    { x: 2110, w: 95, h: 67, type: 'crate', label: 'BONK BOX' },
    { x: 2390, w: 135, h: 24, type: 'bar', label: 'DUCK!' },
    { x: 2860, w: 65, h: 90, type: 'spinner', label: 'WHOOSH' },
    { x: 3140, w: 120, h: 66, type: 'crate', label: 'BONK BOX' },
    { x: 3470, w: 70, h: 75, type: 'crate', label: 'BONK BOX' },
    { x: 3910, w: 125, h: 25, type: 'bar', label: 'DUCK!' }
  ];
  const gaps = [{x:900,w:95},{x:1580,w:115},{x:2260,w:90},{x:3000,w:105},{x:3730,w:100}];
  const checkpoints = [0, 1200, 2400, 3500];
  const achievements = [
    { id:'first-jump', title:'Gravity? Never heard of her.', body:'You made your first jump!', check:g=>g.jumps>0 },
    { id:'first-memory', title:'Pocket-sized nostalgia', body:'You found your first keepsake.', check:g=>g.collected.size>0 },
    { id:'all-memory', title:'A full heart (and pockets)', body:'You found every keepsake.', check:g=>g.collected.size===memories.length },
    { id:'finish', title:'Legend status: confirmed', body:'You conquered the whole course!', check:g=>g.finished }
  ];
  let W=0,H=0,dpr=1,last=0,raf=0,toastTimer=0,soundOn=false,audio;
  let state='start', keys={left:false,right:false}, game=null;

  function resize(){
    const r=canvas.getBoundingClientRect(); dpr=Math.min(window.devicePixelRatio||1,2);
    W=r.width; H=r.height; canvas.width=Math.max(1,Math.round(W*dpr)); canvas.height=Math.max(1,Math.round(H*dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener('resize',resize,{passive:true}); resize();
  function groundY(){ return H * (W<650 ? .76 : .78); }
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const lerp=(a,b,t)=>a+(b-a)*t;
  function newGame(){
    game={x:65,y:0,vy:0,jumpHeight:0,vyJump:0,onGround:true,camera:0,checkpoint:65,checkpointIndex:0,collected:new Set(),jumps:0,stumbles:0,started:performance.now(),elapsed:0,finished:false,toastDone:new Set(),invulnerable:0,particles:[],lastJump:false};
    memories.forEach(m=>{m.taken=false});
    state='playing';
    hideScreens(); ui.hud.hidden=false; ui.mobile.hidden=false; updateCount(); last=performance.now();
    playSound('start');
    cancelAnimationFrame(raf); raf=requestAnimationFrame(loop);
  }
  function hideScreens(){[ui.start,ui.pause,ui.finish,ui.collection,ui.memory].forEach(el=>el.hidden=true);}
  function openCollection(){
    buildMemoryGrid(); ui.collection.hidden=false;
    if(state==='playing'){state='collection-paused';}
  }
  function closeCollection(){
    ui.collection.hidden=true;
    if(state==='collection-paused'){state='playing';last=performance.now();raf=requestAnimationFrame(loop);}
    else if(state==='finish'){ui.finish.hidden=false;}
  }
  function buildMemoryGrid(){
    ui.memoryGrid.innerHTML='';
    memories.forEach(m=>{
      const unlocked=game?.collected.has(m.id) || state==='finish';
      const item=document.createElement('article'); item.className='memory-tile'+(unlocked?'':' locked');
      item.innerHTML=unlocked?`<h3>${m.title}</h3><p>${m.message}</p>`:`<h3>Not found yet</h3><p>There's a little note tucked away somewhere on the course.</p>`;
      ui.memoryGrid.appendChild(item);
    });
    updateCount();
  }
  function updateCount(){
    const n=game?.collected.size||0;ui.count.textContent=`${n}/${memories.length}`;
    if(game){ui.runCount.textContent=n;}
  }
  function showMemory(m){
    state='memory'; ui.eyebrow.textContent='A KEEPSAKE FOUND';ui.title.textContent=m.title;ui.message.textContent=m.message;
    ui.memory.hidden=false; playSound('memory');
  }
  function closeMemory(){ui.memory.hidden=true;if(state==='memory'){state='playing';last=performance.now();raf=requestAnimationFrame(loop);}}
  function showToast(title,body){
    ui.toastTitle.textContent=title;ui.toastBody.textContent=body;ui.toast.classList.add('show');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>ui.toast.classList.remove('show'),2500);
  }
  function checkAchievements(){
    for(const a of achievements){if(!game.toastDone.has(a.id)&&a.check(game)){game.toastDone.add(a.id);showToast(a.title,a.body);playSound('achievement');break;}}
  }
  function playSound(type){
    if(!soundOn)return;
    try{
      audio ||= new (window.AudioContext||window.webkitAudioContext)();
      const osc=audio.createOscillator(),gain=audio.createGain();
      const notes=type==='memory'?[659,880,1046]:type==='achievement'?[523,659,784]:type==='start'?[440,660]:[330];
      osc.type=type==='stumble'?'triangle':'sine';osc.frequency.setValueAtTime(notes[0],audio.currentTime);
      if(notes.length>1)osc.frequency.setValueAtTime(notes[1],audio.currentTime+.09);
      if(notes.length>2)osc.frequency.setValueAtTime(notes[2],audio.currentTime+.18);
      gain.gain.setValueAtTime(.0001,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.08,audio.currentTime+.025);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.3);
      osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+.31);
    }catch(_){/* Audio is an optional treat. */}
  }

  function loop(now){
    if(state!=='playing')return;
    const dt=Math.min(.034,(now-last)/1000||0);last=now;
    update(dt);draw(now/1000);raf=requestAnimationFrame(loop);
  }
  function update(dt){
    if(!game)return;
    game.elapsed=(performance.now()-game.started)/1000;
    const speed=game.falling?0:(keys.right?315:keys.left?95:220);
    game.x+=speed*dt;
    const jumpKey=keys.jump||keys.up;
    if(jumpKey&&!game.lastJump&&game.onGround){game.vyJump=620;game.onGround=false;game.jumps++;playSound('jump');makeParticles(game.x,groundY()-5,'#fff0a8',7);checkAchievements();}
    game.lastJump=jumpKey;
    if(!game.onGround){game.vyJump-=1480*dt;game.jumpHeight+=game.vyJump*dt;if(game.jumpHeight<=0){game.jumpHeight=0;game.vyJump=0;game.onGround=true;makeParticles(game.x,groundY()-4,'#ffffff',5);}}
    const gy=groundY();
    const inGap=gaps.some(g=>game.x+13>g.x&&game.x-13<g.x+g.w);
    if(inGap&&game.jumpHeight<25){
      game.falling=true;
      game.y+=dt*760;
      if(game.y>H*.35){respawn();return;}
    }else if(!game.falling){game.y=0;}
    if(game.falling&&game.jumpHeight>30){game.falling=false;game.y=0;}
    if(game.invulnerable>0)game.invulnerable-=dt;
    for(const o of obstacles){
      if(Math.abs(game.x-o.x)<(o.w/2+18)&&game.jumpHeight<o.h-12&&game.invulnerable<=0){
        game.stumbles++;game.x=Math.max(game.checkpoint,game.x-125);game.invulnerable=1.15;game.jumpHeight=20;game.vyJump=260;game.onGround=false;showToast('A very dramatic stumble','The obstacle says “my bad.” You’re okay!');playSound('stumble');makeParticles(game.x,gy-15,'#ffb1a2',9);break;
      }
    }
    for(const m of memories){
      if(!game.collected.has(m.id)&&Math.abs(game.x-m.x)<38){game.collected.add(m.id);m.taken=true;updateCount();showMemory(m);checkAchievements();return;}
    }
    const passed=checkpoints.filter(c=>c<=game.x).length-1;
    if(passed>game.checkpointIndex){game.checkpointIndex=passed;game.checkpoint=checkpoints[passed];if(passed>0)showToast('Checkpoint!','A little progress saved. Keep being awesome.');}
    game.camera=lerp(game.camera,Math.max(0,game.x-W*.28),Math.min(1,dt*5));
    updateParticles(dt);
    ui.distance.innerHTML=`${Math.max(0,Math.floor(game.x/10))} <i>m</i>`;
    const p=clamp(game.x/COURSE_LENGTH,0,1)*100;ui.progress.style.width=`${p}%`;
    const runner=document.querySelector('.progress-runner');if(runner)runner.style.left=`${p}%`;
    if(game.x>=COURSE_LENGTH){finishGame();}
  }
  function respawn(){
    game.x=game.checkpoint+20;game.y=0;game.falling=false;game.jumpHeight=0;game.vyJump=0;game.onGround=true;game.invulnerable=1.4;game.stumbles++;
    showToast('Boing! Back to your checkpoint','Even legends occasionally meet gravity.');playSound('stumble');
  }
  function finishGame(){
    game.finished=true;state='finish';ui.hud.hidden=true;ui.mobile.hidden=true;ui.finish.hidden=false;
    $('finishTime').textContent=formatTime(game.elapsed);$('finishCards').textContent=`${game.collected.size}/${memories.length}`;
    playSound('achievement');checkAchievements();
  }
  function formatTime(s){const m=Math.floor(s/60),sec=Math.floor(s%60);return `${m}:${String(sec).padStart(2,'0')}`;}

  function draw(t){
    if(!W||!H)return;
    ctx.clearRect(0,0,W,H);
    drawSky(t);drawWorld(t);if(game)drawRunner(t);drawParticles();
  }
  function drawSky(t){
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#83d1eb');sky.addColorStop(.65,'#b4e8e8');sky.addColorStop(1,'#e3f2d4');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    const sunX=W*.82,sunY=H*.21;ctx.fillStyle='#ffe69255';ctx.beginPath();ctx.arc(sunX,sunY,56,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffedaa';ctx.beginPath();ctx.arc(sunX,sunY,38,0,Math.PI*2);ctx.fill();
    drawCloud((W*.14-(game?.camera||0)*.08% (W+160)+W+160)%(W+160)-70,H*.2,.75);
    drawCloud((W*.57-(game?.camera||0)*.045%(W+180)+W+180)%(W+180)-80,H*.32,.56);
    ctx.fillStyle='#91d8c6';ctx.beginPath();ctx.moveTo(0,H*.61);for(let x=0;x<=W+40;x+=40){ctx.lineTo(x,H*.58+Math.sin((x+(game?.camera||0)*.14)*.007)*24+Math.sin(x*.022)*8);}ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
    ctx.fillStyle='#84cbbd';ctx.beginPath();ctx.moveTo(0,H*.7);for(let x=0;x<=W+30;x+=30){ctx.lineTo(x,H*.67+Math.sin((x+(game?.camera||0)*.23)*.008)*18);}ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
  }
  function drawCloud(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#ffffffad';ctx.beginPath();ctx.ellipse(32,12,39,12,0,0,Math.PI*2);ctx.ellipse(18,6,19,16,0,0,Math.PI*2);ctx.ellipse(42,1,16,19,0,0,Math.PI*2);ctx.fill();ctx.restore();}
  function drawWorld(t){
    const gy=groundY(),cam=game?.camera||0;
    ctx.fillStyle='#61c89f';ctx.fillRect(0,gy,W,H-gy);
    ctx.fillStyle='#a5edc2';ctx.fillRect(0,gy,W,9);
    // Little grass strokes lend the course a hand-painted feel.
    for(let i=0;i<45;i++){const x=((i*73-cam*.7)%(W+40)+W+40)%(W+40);ctx.strokeStyle=i%2?'#4fb98e':'#c3f1c9';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,gy+20+(i%4)*19);ctx.lineTo(x+4,gy+14+(i%4)*19);ctx.stroke();}
    gaps.forEach(g=>{const x=g.x-cam;if(x+g.w<-20||x>W+20)return;ctx.fillStyle='#394e71';ctx.fillRect(x,gy,g.w,H-gy);ctx.fillStyle='#315268';ctx.fillRect(x+7,gy+15,g.w-14,H-gy);ctx.fillStyle='#b9eed1';ctx.fillRect(x-4,gy,g.w+8,8);ctx.fillStyle='#e2f5ef';for(let j=0;j<3;j++){ctx.beginPath();ctx.arc(x+g.w*.25+j*20,gy+48+(j%2)*18,3,0,Math.PI*2);ctx.fill();}});
    drawCheckpointMarkers(cam,gy);
    obstacles.forEach(o=>drawObstacle(o,cam,gy,t));
    memories.forEach(m=>{if(game?.collected.has(m.id))return;drawKeepsake(m,cam,gy,t);});
    // Finish arch
    const fx=COURSE_LENGTH-cam;if(fx>-70&&fx<W+70){ctx.fillStyle='#796de4';roundRect(ctx,fx-14,gy-150,18,150,8);roundRect(ctx,fx+55,gy-150,18,150,8);ctx.fillStyle='#ffd86b';roundRect(ctx,fx-23,gy-163,105,24,10);ctx.fillStyle='#fff';ctx.font='800 10px "DM Sans"';ctx.textAlign='center';ctx.fillText('YOU DID IT!',fx+30,gy-147);for(let i=0;i<5;i++){ctx.fillStyle=i%2?'#fff':'#ffd86b';ctx.fillRect(fx+4+(i%2)*14,gy-130+Math.floor(i/2)*15,10,9);}}
  }
  function drawCheckpointMarkers(cam,gy){
    checkpoints.slice(1).forEach((c,i)=>{const x=c-cam;if(x< -20||x>W+20)return;ctx.fillStyle='#ffffff8a';ctx.fillRect(x,gy-95,2,95);ctx.fillStyle='#fff8dc';roundRect(ctx,x,gy-95,66,21,6);ctx.fillStyle='#7970cf';ctx.font='700 8px "DM Sans"';ctx.textAlign='center';ctx.fillText('CHECKPOINT',x+33,gy-81);});
  }
  function drawObstacle(o,cam,gy,t){
    const x=o.x-cam;if(x+o.w<-40||x>W+40)return;
    if(o.type==='crate'){
      ctx.fillStyle='#db6d67';roundRect(ctx,x-o.w/2+5,gy-o.h+7,o.w,o.h,12);ctx.fillStyle='#ff907c';roundRect(ctx,x-o.w/2,gy-o.h,o.w,o.h,12);ctx.fillStyle='#ffb299';roundRect(ctx,x-o.w/2+8,gy-o.h+8,o.w-16,o.h-16,8);ctx.strokeStyle='#ee7c70';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x-o.w/2+15,gy-o.h+15);ctx.lineTo(x+o.w/2-15,gy-15);ctx.moveTo(x+o.w/2-15,gy-o.h+15);ctx.lineTo(x-o.w/2+15,gy-15);ctx.stroke();
    } else if(o.type==='bar'){
      ctx.fillStyle='#f7d466';roundRect(ctx,x-o.w/2,gy-31,o.w,22,10);ctx.fillStyle='#fff1a4';roundRect(ctx,x-o.w/2+8,gy-27,o.w-16,7,5);ctx.fillStyle='#8276d8';roundRect(ctx,x-o.w/2+3,gy-8,10,8,3);roundRect(ctx,x+o.w/2-13,gy-8,10,8,3);
    } else {
      ctx.save();ctx.translate(x,gy-o.h*.55);ctx.rotate(Math.sin(t*2.6+o.x)*.3);ctx.fillStyle='#8276da';roundRect(ctx,-o.w/2, -10,o.w,20,10);ctx.fillStyle='#b1a4ff';ctx.beginPath();ctx.arc(-o.w/2+8,0,8,0,Math.PI*2);ctx.arc(o.w/2-8,0,8,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    ctx.fillStyle='#fff';ctx.font='800 7px "DM Sans"';ctx.textAlign='center';ctx.fillText(o.label,x,gy+20);
  }
  function drawKeepsake(m,cam,gy,t){
    const x=m.x-cam;if(x< -35||x>W+35)return;
    const y=gy-100+Math.sin(t*3+m.x)*8;
    ctx.fillStyle='#ffd86b33';ctx.beginPath();ctx.arc(x,y,24+Math.sin(t*3)*2,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*2+m.x)*.1);ctx.fillStyle='#ffdf77';ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(5,-5);ctx.lineTo(17,0);ctx.lineTo(5,5);ctx.lineTo(0,17);ctx.lineTo(-5,5);ctx.lineTo(-17,0);ctx.lineTo(-5,-5);ctx.closePath();ctx.fill();ctx.fillStyle='#fff5c3';ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function drawRunner(t){
    const gy=groundY(),sx=game.x-game.camera,sy=gy-43-game.jumpHeight-game.y;
    if(game.invulnerable>0&&Math.floor(t*13)%2===0)return;
    const bob=game.onGround?Math.sin(t*14)*2:0;
    ctx.fillStyle='#2c5e7180';ctx.beginPath();ctx.ellipse(sx,gy-3,23+game.jumpHeight*.035,7,0,0,Math.PI*2);ctx.fill();
    // tiny cape
    ctx.fillStyle='#7366d5';ctx.beginPath();ctx.moveTo(sx-11,sy+6+bob);ctx.lineTo(sx-30,sy+33+bob);ctx.lineTo(sx-5,sy+30+bob);ctx.closePath();ctx.fill();
    // feet
    ctx.fillStyle='#ffd86b';roundRect(ctx,sx-17,sy+31+bob,15,12,6);roundRect(ctx,sx+3,sy+31+bob,15,12,6);
    // arms
    ctx.strokeStyle='#ffbda0';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(sx-12,sy+5+bob);ctx.lineTo(sx-20,sy+22+bob+Math.sin(t*12)*3);ctx.moveTo(sx+12,sy+5+bob);ctx.lineTo(sx+21,sy+19+bob-Math.sin(t*12)*3);ctx.stroke();
    // body
    ctx.fillStyle='#f77972';roundRect(ctx,sx-17,sy-7+bob,34,43,15);ctx.fillStyle='#ffad8d';ctx.beginPath();ctx.ellipse(sx,sy-15+bob,19,19,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff0d6';ctx.beginPath();ctx.ellipse(sx,sy-13+bob,14,13,0,0,Math.PI*2);ctx.fill();
    // eyes + grin
    ctx.fillStyle='#253350';ctx.beginPath();ctx.arc(sx-5,sy-15+bob,1.8,0,Math.PI*2);ctx.arc(sx+5,sy-15+bob,1.8,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#253350';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(sx,sy-12+bob,5,0.2,Math.PI-.2);ctx.stroke();
    // tiny star badge
    ctx.fillStyle='#ffe47e';ctx.beginPath();ctx.arc(sx,sy+13+bob,4,0,Math.PI*2);ctx.fill();
    if(game.jumpHeight>60){ctx.fillStyle='#fff';ctx.font='700 12px "Fredoka"';ctx.textAlign='center';ctx.fillText('WHEEE!',sx,sy-39);}
  }
  function roundRect(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,Math.min(r,w/2,h/2));c.fill();}
  function makeParticles(x,y,color,n){for(let i=0;i<n;i++)game.particles.push({x,y,vx:(Math.random()-.5)*140,vy:Math.random()*100+30,life:.45+Math.random()*.4,color,size:2+Math.random()*4});}
  function updateParticles(dt){game.particles=game.particles.filter(p=>p.life>0);game.particles.forEach(p=>{p.life-=dt;p.x+=p.vx*dt;p.y-=p.vy*dt;p.vy-=220*dt;});}
  function drawParticles(){if(!game)return;game.particles.forEach(p=>{ctx.globalAlpha=clamp(p.life*2,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x-game.camera,p.y,p.size,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;}

  function togglePause(){if(state==='playing'){state='pause';ui.pause.hidden=false;ui.mobile.hidden=true;}else if(state==='pause'){ui.pause.hidden=true;state='playing';ui.mobile.hidden=false;last=performance.now();raf=requestAnimationFrame(loop);}}
  function setControl(name,on){keys[name]=on;}
  $('playButton').addEventListener('click',newGame);
  $('resumeButton').addEventListener('click',togglePause);
  $('pauseButton').addEventListener('click',togglePause);
  $('restartFromPause').addEventListener('click',newGame);
  $('playAgainButton').addEventListener('click',newGame);
  $('collectionButton').addEventListener('click',openCollection);
  $('closeCollection').addEventListener('click',closeCollection);
  $('finishKeepsakes').addEventListener('click',()=>{ui.finish.hidden=true;buildMemoryGrid();ui.collection.hidden=false;});
  $('continueButton').addEventListener('click',closeMemory);
  $('soundButton').addEventListener('click',()=>{soundOn=!soundOn;$('soundButton').textContent=soundOn?'♫':'♩';$('soundButton').setAttribute('aria-label',soundOn?'Mute sound':'Enable sound');playSound('achievement');});
  $('leftControl').addEventListener('pointerdown',e=>{e.preventDefault();setControl('left',true);});
  $('rightControl').addEventListener('pointerdown',e=>{e.preventDefault();setControl('right',true);});
  $('jumpControl').addEventListener('pointerdown',e=>{e.preventDefault();setControl('jump',true);});
  window.addEventListener('pointerup',()=>{setControl('left',false);setControl('right',false);setControl('jump',false);});
  window.addEventListener('keydown',e=>{
    if(['ArrowLeft','ArrowRight','ArrowUp','Space'].includes(e.code))e.preventDefault();
    if(e.code==='ArrowLeft'||e.code==='KeyA')setControl('left',true);
    if(e.code==='ArrowRight'||e.code==='KeyD')setControl('right',true);
    if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW')setControl(e.code==='ArrowUp'||e.code==='KeyW'?'up':'jump',true);
    if(e.code==='Escape'||e.code==='KeyP'){if(state==='playing'||state==='pause')togglePause();}
  });
  window.addEventListener('keyup',e=>{
    if(e.code==='ArrowLeft'||e.code==='KeyA')setControl('left',false);
    if(e.code==='ArrowRight'||e.code==='KeyD')setControl('right',false);
    if(e.code==='Space')setControl('jump',false);
    if(e.code==='ArrowUp'||e.code==='KeyW')setControl('up',false);
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')togglePause();});
  // Draw a living, welcoming course even before the first run.
  draw(0);
})();
