/* EurUsdVPN — 3D живые фоны (three.js). Выбор сцены: window.SCENE = tunnel|network|grid|field */
(function(){
  if(!window.THREE){return;}
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvas = document.getElementById('scene');
  if(!canvas) return;
  var mobile = window.innerWidth < 680;

  var renderer = new THREE.WebGLRenderer({canvas:canvas, alpha:true, antialias:!mobile, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
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

  // ── TUNNEL ──
  var tunnelData;
  function buildTunnel(){
    group=new THREE.Group();scene.add(group);
    var N = mobile?1400:3200, pos=new Float32Array(N*3), col=new Float32Array(N*3), spd=new Float32Array(N);
    var col3=new THREE.Color();
    for(var i=0;i<N;i++){
      var a=Math.random()*Math.PI*2, rad=42+Math.random()*16, z=-Math.random()*1100;
      pos[i*3]=Math.cos(a)*rad; pos[i*3+1]=Math.sin(a)*rad; pos[i*3+2]=z;
      col3.copy(rc()); col[i*3]=col3.r;col[i*3+1]=col3.g;col[i*3+2]=col3.b;
      spd[i]=1.6+Math.random()*2.4;
    }
    var geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    var mat=new THREE.PointsMaterial({size:mobile?1.5:1.9,map:DOT,vertexColors:true,transparent:true,opacity:.95,depthWrite:false,blending:THREE.AdditiveBlending});
    var pts=new THREE.Points(geo,mat);group.add(pts);
    // тонкие кольца-каркас
    for(var r=0;r<10;r++){
      var rg=new THREE.RingGeometry(48,48.4,64);
      var rm=new THREE.MeshBasicMaterial({color:r%2?C.cyan:C.emerald,transparent:true,opacity:.10,side:THREE.DoubleSide});
      var ring=new THREE.Mesh(rg,rm);ring.position.z=-r*110;group.add(ring);
    }
    camera.position.z=60;
    tunnelData={geo:geo,pos:pos,spd:spd,N:N};
  }
  function animTunnel(){
    var p=tunnelData.pos,spd=tunnelData.spd;
    for(var i=0;i<tunnelData.N;i++){ p[i*3+2]+=spd[i]; if(p[i*3+2]>60){p[i*3+2]=-1100;} }
    tunnelData.geo.attributes.position.needsUpdate=true;
    group.rotation.z+=0.0011;
    camera.position.x+=((tmx*14)-camera.position.x)*.05;
    camera.position.y+=((-tmy*14)-camera.position.y)*.05;
    camera.lookAt(0,0,-200);
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

  var anim;
  if(mode==='tunnel'){buildTunnel();anim=animTunnel;}
  else if(mode==='network'){buildNetwork();anim=animNetwork;}
  else if(mode==='grid'){buildGrid();anim=animGrid;}
  else {buildField();anim=animField;}

  function loop(){ t+=0.01; tmx+=(mx-tmx)*0.04; tmy+=(my-tmy)*0.04; anim(); renderer.render(scene,camera); if(!reduce) requestAnimationFrame(loop); }

  window.addEventListener('mousemove',function(e){mx=(e.clientX/window.innerWidth-.5)*2;my=(e.clientY/window.innerHeight-.5)*2;},{passive:true});
  window.addEventListener('resize',function(){clearTimeout(window.__sr);window.__sr=setTimeout(function(){
    camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);
  },180);});
  loop();
})();
