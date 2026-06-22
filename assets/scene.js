/* EurUsdVPN — 3D живые фоны (three.js). Выбор сцены: window.SCENE = tunnel|network|grid|field */
(function(){
  if(!window.THREE){return;}
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvas = document.getElementById('scene');
  if(!canvas) return;
  var mobile = window.innerWidth < 680;

  var renderer = new THREE.WebGLRenderer({canvas:canvas, alpha:true, antialias:!mobile, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, mobile?1.5:2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 2200);
  camera.position.set(0,0,0);

  var C = { violet:0x6d5ef6, cyan:0x22d3ee, emerald:0x2be8a6 };
  var mx=0,my=0,tmx=0,tmy=0, group=null, mode=window.SCENE||'field', t=0;

  function rc(){ // случайный брендовый цвет
    var arr=[C.violet,C.cyan,C.emerald]; return new THREE.Color(arr[(Math.random()*3)|0]);
  }
  function sprite(){
    var c=document.createElement('canvas');c.width=c.height=64;var g=c.getContext('2d');
    var grd=g.createRadialGradient(32,32,0,32,32,32);grd.addColorStop(0,'rgba(255,255,255,1)');grd.addColorStop(.25,'rgba(255,255,255,.9)');grd.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=grd;g.fillRect(0,0,64,64);var tx=new THREE.Texture(c);tx.needsUpdate=true;return tx;
  }
  var DOT = sprite();

  // ── HALO (спокойные орбитальные кольца частиц) ──
  // Частицы НЕ летят на камеру — мягко вращаются вокруг центра + лёгкое «дыхание».
  function buildHalo(){
    group=new THREE.Group();scene.add(group);
    var RINGS = mobile?5:7;
    var perRing = mobile?180:300;
    var N = RINGS*perRing;
    var pos=new Float32Array(N*3),col=new Float32Array(N*3),col3=new THREE.Color();
    var k=0;
    for(var r=0;r<RINGS;r++){
      var R = 60 + r*26;                 // радиус кольца
      var tilt = (r/RINGS)*Math.PI*0.9 - 0.45; // наклон кольца
      var ct=Math.cos(tilt), st=Math.sin(tilt);
      for(var j=0;j<perRing;j++){
        var a = (j/perRing)*Math.PI*2 + Math.random()*0.05;
        var rr = R + (Math.random()-0.5)*7;       // лёгкая толщина кольца
        var x = Math.cos(a)*rr;
        var y0 = Math.sin(a)*rr;
        pos[k*3]   = x;
        pos[k*3+1] = y0*ct;
        pos[k*3+2] = y0*st + (Math.random()-0.5)*6;
        col3.copy(rc()); col[k*3]=col3.r;col[k*3+1]=col3.g;col[k*3+2]=col3.b;
        k++;
      }
    }
    var geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    group.add(new THREE.Points(geo,new THREE.PointsMaterial({size:mobile?1.6:2,map:DOT,vertexColors:true,transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending})));
    // пара тонких каркасных колец
    for(var w=0;w<3;w++){
      var rg=new THREE.RingGeometry(64+w*30,64+w*30+0.5,90);
      var rm=new THREE.MeshBasicMaterial({color:w%2?C.cyan:C.emerald,transparent:true,opacity:.05,side:THREE.DoubleSide});
      var ring=new THREE.Mesh(rg,rm);ring.rotation.x=0.5+w*0.25;group.add(ring);
    }
    group.rotation.x=0.32;
    camera.position.z=290;
  }
  function animHalo(){
    group.rotation.y += 0.0007;                       // очень медленное вращение
    var s = 1 + Math.sin(t*0.45)*0.014;               // едва заметное «дыхание»
    group.scale.set(s,s,s);
    camera.position.x+=((tmx*26)-camera.position.x)*.04;
    camera.position.y+=((-tmy*20)-camera.position.y)*.04;
    camera.lookAt(0,0,0);
  }

  // ── NETWORK (сфера узлов + связи) ──
  var netData;
  function buildNetwork(){
    group=new THREE.Group();scene.add(group);
    var N=mobile?90:150, R=120, nodes=[];
    var pos=new Float32Array(N*3),col=new Float32Array(N*3),col3=new THREE.Color();
    for(var i=0;i<N;i++){
      var th=Math.acos(2*Math.random()-1),ph=Math.random()*Math.PI*2;
      var x=R*Math.sin(th)*Math.cos(ph),y=R*Math.sin(th)*Math.sin(ph),z=R*Math.cos(th);
      nodes.push([x,y,z]);pos[i*3]=x;pos[i*3+1]=y;pos[i*3+2]=z;
      col3.copy(rc());col[i*3]=col3.r;col[i*3+1]=col3.g;col[i*3+2]=col3.b;
    }
    var geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    group.add(new THREE.Points(geo,new THREE.PointsMaterial({size:mobile?3.4:4.2,map:DOT,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));
    // связи между близкими
    var lp=[];
    for(var a=0;a<N;a++)for(var b=a+1;b<N;b++){
      var dx=nodes[a][0]-nodes[b][0],dy=nodes[a][1]-nodes[b][1],dz=nodes[a][2]-nodes[b][2];
      if(dx*dx+dy*dy+dz*dz<46*46){lp.push(nodes[a][0],nodes[a][1],nodes[a][2],nodes[b][0],nodes[b][1],nodes[b][2]);}
    }
    var lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(lp),3));
    group.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:C.cyan,transparent:true,opacity:.14})));
    camera.position.z=300;
  }
  function animNetwork(){
    group.rotation.y+=0.0016;group.rotation.x+=0.0006;
    camera.position.x+=((tmx*40)-camera.position.x)*.05;
    camera.position.y+=((-tmy*40)-camera.position.y)*.05;
    camera.lookAt(0,0,0);
  }

  // ── GRID (волновой террейн) ──
  var gridMesh,gridGeo,gridBase;
  function buildGrid(){
    group=new THREE.Group();scene.add(group);
    var seg=mobile?40:70;
    gridGeo=new THREE.PlaneGeometry(900,900,seg,seg);
    gridBase=gridGeo.attributes.position.array.slice(0);
    gridMesh=new THREE.Mesh(gridGeo,new THREE.MeshBasicMaterial({color:C.emerald,wireframe:true,transparent:true,opacity:.22}));
    gridMesh.rotation.x=-Math.PI/2.3;group.add(gridMesh);
    camera.position.set(0,120,260);camera.lookAt(0,-40,-200);
  }
  function animGrid(){
    var p=gridGeo.attributes.position.array;
    for(var i=0;i<p.length;i+=3){var x=gridBase[i],y=gridBase[i+1];
      p[i+2]=Math.sin((x*0.012)+t*1.4)*16+Math.cos((y*0.014)+t*1.1)*16;}
    gridGeo.attributes.position.needsUpdate=true;
    group.rotation.z=tmx*0.12;camera.position.x+=((tmx*40)-camera.position.x)*.04;
  }

  // ── FIELD (дрейф частиц) ──
  var fieldData;
  function buildField(){
    group=new THREE.Group();scene.add(group);
    var N=mobile?700:1500,pos=new Float32Array(N*3),col=new Float32Array(N*3),col3=new THREE.Color();
    for(var i=0;i<N;i++){pos[i*3]=(Math.random()-.5)*900;pos[i*3+1]=(Math.random()-.5)*600;pos[i*3+2]=(Math.random()-.5)*600;
      col3.copy(rc());col[i*3]=col3.r;col[i*3+1]=col3.g;col[i*3+2]=col3.b;}
    var geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    group.add(new THREE.Points(geo,new THREE.PointsMaterial({size:mobile?2.4:3,map:DOT,vertexColors:true,transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending})));
    camera.position.z=420;fieldData={geo:geo,pos:pos,N:N};
  }
  function animField(){
    var p=fieldData.pos;for(var i=0;i<fieldData.N;i++){p[i*3+1]+=0.25;if(p[i*3+1]>300)p[i*3+1]=-300;}
    fieldData.geo.attributes.position.needsUpdate=true;
    group.rotation.y+=0.0006;
    camera.position.x+=((tmx*60)-camera.position.x)*.04;camera.position.y+=((-tmy*40)-camera.position.y)*.04;camera.lookAt(0,0,0);
  }

  // ── CRYSTALS (парящие каркасные многогранники) ──
  var crystals=[];
  function buildCrystals(){
    group=new THREE.Group();scene.add(group);
    var cols=[C.violet,C.cyan,C.emerald];
    var n=mobile?7:11;
    for(var i=0;i<n;i++){
      var kind=i%3, sz=18+Math.random()*26, geo;
      if(kind===0) geo=new THREE.IcosahedronGeometry(sz,0);
      else if(kind===1) geo=new THREE.OctahedronGeometry(sz,0);
      else geo=new THREE.TetrahedronGeometry(sz,0);
      var wire=new THREE.WireframeGeometry(geo);
      var line=new THREE.LineSegments(wire,new THREE.LineBasicMaterial({color:cols[i%3],transparent:true,opacity:.30}));
      line.position.set((Math.random()-.5)*620,(Math.random()-.5)*420,(Math.random()-.5)*340);
      group.add(line);
      crystals.push({m:line,
        rx:(Math.random()-.5)*0.004, ry:(Math.random()-.5)*0.004,
        by:Math.random()*Math.PI*2, ba:8+Math.random()*10, bs:0.3+Math.random()*0.4,
        y0:line.position.y});
    }
    camera.position.z=360;
  }
  function animCrystals(){
    for(var i=0;i<crystals.length;i++){var c=crystals[i];
      c.m.rotation.x+=c.rx; c.m.rotation.y+=c.ry;
      c.m.position.y=c.y0+Math.sin(t*c.bs+c.by)*c.ba;
    }
    group.rotation.y+=0.0004;
    camera.position.x+=((tmx*30)-camera.position.x)*.04;
    camera.position.y+=((-tmy*22)-camera.position.y)*.04;
    camera.lookAt(0,0,0);
  }

  var anim;
  if(mode==='crystals'){buildCrystals();anim=animCrystals;}
  else if(mode==='halo'||mode==='tunnel'){buildHalo();anim=animHalo;}
  else if(mode==='network'){buildNetwork();anim=animNetwork;}
  else if(mode==='grid'){buildGrid();anim=animGrid;}
  else {buildField();anim=animField;}

  var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints>0);
  function loop(){
    t+=0.01;
    if(isTouch && !touching){ mx+=(0-mx)*0.05; my+=(0-my)*0.05; } // плавный возврат к центру после отрыва пальца
    tmx+=(mx-tmx)*0.06; tmy+=(my-tmy)*0.06;
    anim(); renderer.render(scene,camera);
    if(!reduce) requestAnimationFrame(loop);
  }

  window.addEventListener('mousemove',function(e){mx=(e.clientX/window.innerWidth-.5)*2;my=(e.clientY/window.innerHeight-.5)*2;},{passive:true});
  // тач-параллакс: относительное движение пальца (без резких скачков между касаниями)
  var touching=false, sx=0, sy=0, bmx=0, bmy=0;
  function clamp(v){return v<-1?-1:v>1?1:v;}
  window.addEventListener('touchstart',function(e){var t0=e.touches&&e.touches[0];if(!t0)return;touching=true;sx=t0.clientX;sy=t0.clientY;bmx=mx;bmy=my;},{passive:true});
  window.addEventListener('touchmove',function(e){var t0=e.touches&&e.touches[0];if(!t0)return;mx=clamp(bmx+(t0.clientX-sx)/window.innerWidth*1.8);my=clamp(bmy+(t0.clientY-sy)/window.innerHeight*1.8);},{passive:true});
  window.addEventListener('touchend',function(){touching=false;},{passive:true});
  window.addEventListener('touchcancel',function(){touching=false;},{passive:true});
  window.addEventListener('resize',function(){clearTimeout(window.__sr);window.__sr=setTimeout(function(){
    camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);
  },180);});
  loop();
})();
