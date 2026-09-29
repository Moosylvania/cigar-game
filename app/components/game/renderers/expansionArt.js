// World and preview art share this normalized 100-unit layout. The launch
// position is also consumed by the fleet animation; it must stay on the apron.
export const LAUNCH_PAD = { x: 73, y: 65 }
const INK = '#294844'
const PAVING = '#b6b8a0'
const DECK = '#4d6968'

function tools(ctx, p, h) {
  const b = (x,y,w,height,c,r=.6) => h.box(ctx,x,y,w,height,c,r)
  const l = (x,y,x2,y2) => h.line(ctx,x,y,x2,y2)
  const poly = (points,c) => h.path(ctx,points,c)
  const oval = (x,y,rx,ry,c,stroke=true) => h.ellipse(ctx,x,y,rx,ry,c,stroke)
  const window = (x,y,w,height) => {
    b(x,y,w,height,p.water)
    ctx.save();ctx.strokeStyle=p.wall;ctx.lineWidth=.65
    l(x+2,y+height-2,x+w*.45,y+2);ctx.restore()
  }
  const vent = (x,y,w=8) => {
    b(x,y,w,4,DECK)
    ctx.save();ctx.strokeStyle=p.wall;ctx.lineWidth=.65
    for(let i=2;i<w;i+=2)l(x+i,y+1,x+i,y+3)
    ctx.restore()
  }
  const solar = (x,y,w=20,height=7) => {
    poly([[x,y],[x+2,y-height],[x+w+2,y-height],[x+w,y]],'#3b6579')
    ctx.save();ctx.strokeStyle=p.water;ctx.lineWidth=.45
    for(let i=4;i<w;i+=4)l(x+i,y-.7,x+i+1.5,y-height+.7)
    l(x+1,y-height*.5,x+w,y-height*.5);ctx.restore()
  }
  const crate = (x,y,c=p.material) => {
    b(x,y,7,5,c);ctx.save();ctx.lineWidth=.6;l(x+2,y+1,x+2,y+4);l(x+5,y+1,x+5,y+4);ctx.restore()
  }
  const leaf = (x,y,scale=1) => {
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.lineWidth=.7
    poly([[0,0],[-3,-2],[-4,-6],[-1,-4],[0,0]],p.leaf)
    poly([[0,0],[3,-3],[4,-7],[1,-5],[0,0]],p.leafLight)
    ctx.restore()
  }
  return {b,l,poly,oval,window,vent,solar,crate,leaf}
}

function foundation(ctx, p, h) {
  const {b,poly} = tools(ctx,p,h)
  // A narrow plinth grounds the architecture without boxing in its silhouette.
  poly([[6,78],[89,78],[96,84],[13,84]],'#344e4630')
  b(6,72,88,9,PAVING,1)
  b(8,78,84,2,p.material,0)
}

function hall(ctx,p,h,{x=9,y=37,w=80,height=36,roof=p.roof,saw=false}={}) {
  const {b,l,poly} = tools(ctx,p,h)
  b(x,y,w,height,p.wall)
  poly([[x+w,y],[x+w+5,y-5],[x+w+5,y+height-5],[x+w,y+height]],p.material)
  if(saw) {
    const points=[[x-2,y],[x-2,y-9]]
    const span=(w+4)/3
    for(let i=0;i<3;i++)points.push([x-2+span*i,y-9],[x-2+span*(i+1),y-16],[x-2+span*(i+1),y-9])
    points.push([x+w+2,y]);poly(points,roof)
    ctx.save();ctx.strokeStyle=p.water;ctx.lineWidth=2
    for(let i=0;i<3;i++)l(x+2+span*i,y-8,x+span*(i+1)-3,y-13)
    ctx.restore()
  } else {
    poly([[x-3,y],[x+5,y-12],[x+w+3,y-12],[x+w+3,y]],roof)
    ctx.save();ctx.strokeStyle=p.wall;ctx.lineWidth=.75
    l(x+7,y-9,x+w-1,y-9);ctx.restore()
  }
  b(x-2,y-1,w+4,2,p.material,0)
}

function cargoBelt(ctx,p,h,x,y,w,time) {
  const {b,l,crate} = tools(ctx,p,h)
  b(x,y,w,5,DECK,1)
  ctx.save();ctx.strokeStyle=p.wall;ctx.lineWidth=.45
  for(let i=2;i<w;i+=4)l(x+i,y+1,x+i,y+4)
  ctx.restore()
  for(let i=0;i<2;i++)crate(x+2+(time/650+i*(w-10)/2)%(w-10),y-2)
}

/** A complete spaceport composition, rather than a pad pasted over a warehouse. */
export function drawSpaceport(ctx, building, p, time, h) {
  const {b,l,poly,oval,window,vent,solar,crate} = tools(ctx,p,h)
  const generation = building.mergeGeneration ?? 0
  ctx.save();ctx.strokeStyle=INK;ctx.lineWidth=1.05
  // Low freight hangar to the left; mission control spans the rear.
  foundation(ctx,p,h)
  b(8,47,86,33,'#8b9d91',2)
  for(let y=57;y<=73;y+=8){ctx.save();ctx.strokeStyle='#bfc5aa';ctx.lineWidth=.55;l(10,y,45,y);ctx.restore()}
  hall(ctx,p,h,{x:9,y:35,w:34,height:25,roof:p.roof})
  b(13,39,26,21,DECK)
  for(let x=15;x<39;x+=8){b(x,41,6,17,p.water);l(x,48,x+6,48);l(x,53,x+6,53)}
  b(11,60,33,3,p.material,0)
  b(47,25,42,15,p.wall)
  poly([[45,25],[50,18],[92,18],[91,25]],p.roof)
  window(51,28,32,7)
  for(let x=59;x<=75;x+=8)l(x,29,x,34)
  vent(20,27,13)
  if(generation>0)solar(55,20,25,6)
  // Small, offset communications equipment has no tower silhouette.
  b(84,29,7,10,p.material)
  l(88,27,88,15);l(85,17,91,17)
  oval(88,14,1,1,p.water)
  // Pad and hangar have a clear air gap and separate ground circulation.
  const {x:cx,y:cy}=LAUNCH_PAD
  const pad=[[cx-22,cy-12],[cx-12,cy-21],[cx+12,cy-21],[cx+22,cy-12],[cx+22,cy+10],[cx+12,cy+18],[cx-12,cy+18],[cx-22,cy+10]]
  poly(pad,p.material)
  poly(pad.map(([x,y])=>[cx+(x-cx)*.89,cy+(y-cy)*.89]),DECK)
  ctx.save();ctx.strokeStyle=p.wall;ctx.lineWidth=.9
  ctx.beginPath();ctx.ellipse(cx,cy,15,11,0,0,Math.PI*2);ctx.stroke()
  // Four short alignment marks read as a launch target, never a second helipad.
  l(cx-19,cy,cx-13,cy);l(cx+13,cy,cx+19,cy)
  l(cx,cy-15,cx,cy-9);l(cx,cy+9,cx,cy+14)
  ctx.restore()
  for(const [x,y] of [[54,54],[91,54],[56,76],[89,76]])oval(x,y,.9,.9,Math.sin(time/700+x)>.4?p.water:'#e6d6a3',false)
  // The service gantry stays at the far edge, with its arm retracted.
  b(94,41,2,28,p.wall,.2)
  ctx.save();ctx.lineWidth=.65
  for(let y=43;y<66;y+=6){l(94,y,96,y+4);l(96,y,94,y+4)}
  ctx.restore()
  b(89,40,8,2,p.material,.3)
  // Freight yard: cargo stacks and one compact autonomous tug.
  crate(12,69);crate(20,69);crate(12,63)
  b(32,65,10,5,p.roof,1);b(36,62,5,4,p.water)
  oval(34,71,1.4,1.4,INK);oval(40,71,1.4,1.4,INK)
  if(generation>=2){vent(51,38,14);vent(69,38,14)}
  ctx.restore()
}

function nursery(ctx,building,p,time,h) {
  const {b,l,window,leaf,vent} = tools(ctx,p,h)
  // One broad conservatory with a shallow sawtooth roof and glass growing floor.
  hall(ctx,p,h,{x:9,y:40,w:78,height:33,saw:true})
  window(13,44,62,25)
  for(let x=15;x<72;x+=10) {
    b(x,62,8,3,p.soil)
    leaf(x+4,62,.75)
    b(x,50,8,2,p.material)
    leaf(x+4,50,.62)
  }
  for(let x=24;x<75;x+=13)l(x,45,x,68)
  b(78,47,7,23,p.material)
  window(79,49,5,8)
  vent(12,34,14)
  // The irrigation rail moves gently along the roof, not across the silhouette.
  const x=18+(time/2200%1)*44
  b(x,39,6,2,p.water,.4)
}

function curing(ctx,building,p,time,h) {
  const {b,l,vent} = tools(ctx,p,h)
  hall(ctx,p,h,{x:9,y:39,w:77,height:34,saw:true})
  for(let x=14;x<78;x+=20) {
    b(x,44,16,25,DECK)
    l(x+2,48,x+14,48)
    for(let i=0;i<3;i++) {
      ctx.save();ctx.fillStyle=p.material;ctx.strokeStyle=INK;ctx.lineWidth=.6
      ctx.beginPath();ctx.ellipse(x+4+i*4,57,1.5,7,Math.sin(time/1400+i)*.025,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore()
    }
    b(x-1,70,18,2,p.material,0)
  }
  for(let x=18;x<80;x+=25)vent(x,35,10)
}

function steam(ctx,building,p,time,h) {
  const {b,l,oval,vent} = tools(ctx,p,h)
  // A long machine hall and horizontal pressure vessels, with short side flues.
  b(12,23,6,22,DECK);b(11,22,8,3,p.material)
  b(22,27,5,17,DECK);b(21,26,7,3,p.material)
  hall(ctx,p,h,{x:9,y:43,w:76,height:30})
  for(let x=15;x<77;x+=31) {
    b(x,49,27,16,p.water,6)
    oval(x+3,57,3,7,p.wall)
    l(x+9,50,x+9,64);l(x+20,50,x+20,64)
    b(x+6,66,3,5,DECK);b(x+21,66,3,5,DECK)
    oval(x+16,54,2,2,p.wall);l(x+16,54,x+17,52)
  }
  vent(54,37,22)
  if(time)for(let i=0;i<3;i++){
    const t=(time/2300+i/3)%1
    ctx.save();ctx.globalAlpha*=.35*(1-t)
    oval(15+t*8,20-t*9,1.8+t*3,1+t*2,p.wall,false);ctx.restore()
  }
}

function fermentation(ctx,building,p,time,h) {
  const {b,l,poly,oval,window} = tools(ctx,p,h)
  // Stepped cellar roof on the left, a sheltered bank of squat casks to the right.
  hall(ctx,p,h,{x:9,y:37,w:44,height:36})
  window(14,42,34,7)
  b(16,55,27,18,DECK,1)
  for(let i=0;i<3;i++) {
    const x=21+i*8
    b(x-3,59,6,11,p.material,2);l(x-3,62,x+3,62);l(x-3,67,x+3,67)
  }
  poly([[53,41],[58,32],[92,32],[92,41]],p.roof)
  for(const x of [56,72]) {
    b(x,47,14,24,p.material,4)
    oval(x+7,47,7,2,p.wall)
    b(x,53,14,2,DECK,0);b(x,64,14,2,DECK,0)
    oval(x+8,58,2,2,p.water)
  }
  l(91,41,91,74)
}

function rolling(ctx,building,p,time,h) {
  const {b,l,window,vent} = tools(ctx,p,h)
  hall(ctx,p,h,{x:9,y:38,w:77,height:35,saw:true})
  window(14,43,43,8)
  b(14,56,44,12,DECK)
  for(let i=0;i<3;i++) {
    const x=20+i*14
    b(x-2,57,4,5,p.material)
    const reach=Math.sin(time/850+i)*2
    l(x,60,x+3+reach,63);l(x+3+reach,63,x+6,65)
  }
  cargoBelt(ctx,p,h,12,71,49,time)
  b(66,46,15,24,p.material)
  for(let y=49;y<68;y+=5)b(68,y,11,2,p.water,0)
  vent(68,35,12)
}

function field(ctx,building,p,time,h) {
  const {b,l,poly,leaf,solar,window} = tools(ctx,p,h)
  // Long growing houses are separated by a service lane and planted perimeter.
  // No central monument, thick neon frame, or repeated miniature buildings.
  b(8,24,84,56,p.soil,1)
  b(8,74,84,6,PAVING,.3)
  for(const y of [29,51]) {
    for(const x of [12,53]) {
      b(x,y+3,34,17,p.wall,.5)
      poly([[x-1,y+4],[x+4,y-4],[x+35,y-4],[x+35,y+4]],p.water)
      for(let i=0;i<4;i++) {
        const px=x+5+i*8
        ctx.save();ctx.strokeStyle=p.wall;ctx.lineWidth=.7;l(px,y+3,px+4,y-3);ctx.restore()
        b(px-3,y+14,6,2,p.soil,0)
        leaf(px,y+14,.68)
      }
      for(let px=x+8;px<x+33;px+=9)l(px,y+5,px,y+17)
    }
  }
  // Irrigation and solar service hut tucked to the rear edge.
  b(10,12,26,10,p.wall)
  poly([[8,13],[12,7],[38,7],[38,13]],p.roof)
  solar(14,11,18,5)
  window(13,15,12,5)
  b(28,15,5,7,p.material,.3)
  b(42,16,43,4,p.water,1)
  ctx.save();ctx.strokeStyle=p.material;ctx.lineWidth=1
  l(46,20,46,71);l(83,20,83,24);ctx.restore()
  if(building.mergeGeneration>=2)for(const y of [37,59]){b(47,y,4,1.5,p.water,.3);l(49,y+1,49,y+4)}
  for(let x=15;x<87;x+=12)leaf(x,79,.65)
  const cartX=12+(time/3200%1)*66
  b(cartX,44,8,4,p.material,1)
  b(cartX+2,43,3,2,p.water,.2)
}

const PRODUCTION_DESIGNS = { nursery, curing, steam, fermentation, rolling, field }

export function drawMergedComplex(ctx, building, p, time, h) {
  if(building.type==='distribution' && building.level >= 10) return drawSpaceport(ctx,building,p,time,h)
  const {b,solar,vent,crate} = tools(ctx,p,h)
  ctx.save();ctx.strokeStyle=INK;ctx.lineWidth=building.type==='field'?.7:1.05;ctx.lineJoin='round'
  foundation(ctx,p,h)
  if(building.type==='distribution') {
    hall(ctx,p,h,{x:9,y:38,w:78,height:35,saw:true})
    for(let x=15;x<80;x+=22){b(x,45,17,26,DECK);b(x+2,47,13,20,p.water);crate(x,73)}
  } else PRODUCTION_DESIGNS[building.type]?.(ctx,building,p,time,h)
  // Generation upgrades add equipment to the building, not a tower above it.
  if(building.mergeGeneration>=2 && building.type!=='field') {
    const roofY={nursery:31,curing:30,steam:39,fermentation:32,rolling:29,distribution:29}[building.type]
    solar(building.type==='fermentation'?17:46,roofY,23,5)
  }
  if(building.mergeGeneration>=3 && building.type!=='field') {
    const equipmentY=building.type==='steam'?36:32
    b(74,equipmentY,12,5,p.material,.5);vent(76,equipmentY+1,8)
  }
  // A row of small equipment indicators records continued generations.
  for(let i=0;i<Math.min(6,building.mergeGeneration);i++) {
    ctx.save();ctx.fillStyle=i%2?p.water:p.material
    ctx.fillRect(74+i*2.4,77,1.4,1);ctx.restore()
  }
  ctx.restore()
}
