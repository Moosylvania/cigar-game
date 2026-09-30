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
  if(generation >= 2) return drawExpandedSpaceport(ctx,building,p,time,h)
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
  drawLaunchApron(ctx,p,time,h)
  // Freight yard: cargo stacks and one compact autonomous tug.
  crate(12,69);crate(20,69);crate(12,63)
  b(32,65,10,5,p.roof,1);b(36,62,5,4,p.water)
  oval(34,71,1.4,1.4,INK);oval(40,71,1.4,1.4,INK)
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
  for(let x=15;x<87;x+=12)leaf(x,79,.65)
  const cartX=12+(time/3200%1)*66
  b(cartX,44,8,4,p.material,1)
  b(cartX+2,43,3,2,p.water,.2)
}

const PRODUCTION_DESIGNS = { nursery, curing, steam, fermentation, rolling, field }

export function drawMergedComplex(ctx, building, p, time, h) {
  if(building.type==='distribution' && building.level >= 10) return drawSpaceport(ctx,building,p,time,h)
  if(building.mergeGeneration >= 2) return drawExpandedProduction(ctx,building,p,time,h)
  const {b,crate} = tools(ctx,p,h)
  ctx.save();ctx.strokeStyle=INK;ctx.lineWidth=building.type==='field'?.7:1.05;ctx.lineJoin='round'
  foundation(ctx,p,h)
  if(building.type==='distribution') {
    hall(ctx,p,h,{x:9,y:38,w:78,height:35,saw:true})
    for(let x=15;x<80;x+=22){b(x,45,17,26,DECK);b(x+2,47,13,20,p.water);crate(x,73)}
  } else PRODUCTION_DESIGNS[building.type]?.(ctx,building,p,time,h)
  // A row of small equipment indicators records continued generations.
  for(let i=0;i<Math.min(6,building.mergeGeneration);i++) {
    ctx.save();ctx.fillStyle=i%2?p.water:p.material
    ctx.fillRect(74+i*2.4,77,1.4,1);ctx.restore()
  }
  ctx.restore()
}

function drawLaunchApron(ctx,p,time,h) {
  const {b,l,poly,oval} = tools(ctx,p,h)
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
}

// Generations 2–5 use independent floor plans. Every type retains its own
// production machinery, materials, and motion within those new silhouettes.
function productionBay(ctx,type,p,time,h,x,y,w,height) {
  const {b,l,oval,window,leaf} = tools(ctx,p,h)
  b(x,y,w,height,DECK,1)
  const count = Math.max(2,Math.floor(w/13))
  const step = w/count
  for(let i=0;i<count;i++) {
    const cx=x+step*(i+.5)
    if(type==='nursery') {
      window(cx-step*.4,y+1,step*.8,height-2)
      for(const row of [.45,.85]) {
        b(cx-step*.35,y+height*row,step*.7,2,p.soil)
        leaf(cx,y+height*row,.75)
      }
    } else if(type==='curing') {
      l(cx-step*.38,y+3,cx+step*.38,y+3)
      for(const offset of [-2.5,2.5]) {
        l(cx+offset,y+3,cx+offset,y+6)
        oval(cx+offset+Math.sin(time/1500+i)*.25,y+height*.55,1.7,height*.28,p.material)
      }
    } else if(type==='steam') {
      b(cx-step*.37,y+3,step*.74,height-5,p.water,3)
      oval(cx,y+3,step*.37,2,p.wall)
      b(cx-step*.37,y+height*.7,step*.74,1.5,p.material,0)
      oval(cx,y+height*.42,2,2,p.wall)
      l(cx,y+height*.42,cx+1,y+height*.42-1)
    } else if(type==='fermentation') {
      b(cx-step*.38,y+2,step*.76,height-3,p.material,3)
      oval(cx,y+3,step*.37,2,p.wall)
      for(const row of [.35,.8])b(cx-step*.38,y+height*row,step*.76,1.4,DECK,0)
      oval(cx,y+height*.57,1.4,1.4,p.water)
    } else {
      b(cx-3,y+height-5,6,4,p.material)
      const reach=Math.sin(time/900+i)*2
      l(cx,y+height-5,cx-3,y+5);l(cx-3,y+5,cx+3+reach,y+8)
      oval(cx-3,y+5,1.4,1.4,p.water)
      b(cx+2+reach,y+8,3,2,p.roof)
    }
  }
}

function roofEquipment(ctx,type,p,time,h,x,y,w) {
  const {b,l,oval,vent,solar} = tools(ctx,p,h)
  if(type==='nursery')solar(x,y,w,5)
  else if(type==='curing')for(let dx=0;dx<w-5;dx+=10)vent(x+dx,y,8)
  else if(type==='steam') {
    for(let dx=0;dx<w-5;dx+=12) {
      b(x+dx,y-9,5,12,DECK);b(x+dx-1,y-10,7,2,p.material)
      if(time) {
        const phase=(time/2600+dx/30)%1
        ctx.save();ctx.globalAlpha*=.4*(1-phase)
        oval(x+dx+2+phase*3,y-10-phase*2,2+phase*2,1+phase,p.wall,false);ctx.restore()
      }
    }
  } else if(type==='fermentation') {
    b(x,y,w,3,p.material);for(let dx=4;dx<w;dx+=9){l(x+dx,y,x+dx,y-5);oval(x+dx,y-5,2,2,p.water)}
  } else {
    b(x,y,w,3,p.material);b(x+2,y-5,3,5,p.water);b(x+w-5,y-5,3,5,p.water)
    l(x+3,y-5,x+w-3,y-5)
  }
}

function drawExpandedProduction(ctx,building,p,time,h) {
  if(building.type==='field') return drawExpandedField(ctx,building,p,time,h)
  const {b,l,poly,window,crate} = tools(ctx,p,h)
  const generation=Math.min(5,building.mergeGeneration)
  const type=building.type
  ctx.save();ctx.strokeStyle=INK;ctx.lineWidth=.8;ctx.lineJoin='round'
  foundation(ctx,p,h)
  if(generation===2) {
    // Offset clerestory wing and broad, open production floor.
    hall(ctx,p,h,{x:12,y:28,w:45,height:23})
    window(17,31,34,10)
    hall(ctx,p,h,{x:9,y:53,w:77,height:22})
    productionBay(ctx,type,p,time,h,14,56,65,16)
    roofEquipment(ctx,type,p,time,h,19,21,29)
    b(82,57,4,16,p.material)
  } else if(generation===3) {
    // Two deep wings connected by a low service bridge; central loading court.
    hall(ctx,p,h,{x:12,y:27,w:70,height:16})
    window(18,29,57,9)
    hall(ctx,p,h,{x:8,y:49,w:27,height:27,saw:true})
    hall(ctx,p,h,{x:61,y:49,w:27,height:27,saw:true})
    productionBay(ctx,type,p,time,h,11,52,21,20)
    productionBay(ctx,type,p,time,h,64,52,21,20)
    b(41,47,14,5,p.material)
    for(let y=56;y<76;y+=7){b(42,y,12,2,p.wall,0)}
    roofEquipment(ctx,type,p,time,h,25,18,39)
    crate(47,70)
  } else if(generation===4) {
    // Long diagonal monitor roof above a continuous industrial shed.
    b(10,39,78,36,p.wall)
    poly([[7,39],[27,16],[92,16],[91,39]],p.roof)
    for(let x=22;x<82;x+=12) {
      poly([[x-6,34],[x+5,20],[x+11,20],[x,34]],p.water)
      l(x-6,35,x,35)
    }
    b(8,38,83,3,p.material)
    productionBay(ctx,type,p,time,h,15,47,66,23)
    window(14,42,67,3)
    b(5,53,7,23,p.material);b(87,49,7,27,p.material)
    roofEquipment(ctx,type,p,time,h,28,14,40)
  } else {
    // Terraced megafactory: three staggered rooflines and two working floors.
    hall(ctx,p,h,{x:25,y:24,w:49,height:19})
    window(30,27,37,8)
    hall(ctx,p,h,{x:15,y:45,w:66,height:18,saw:true})
    productionBay(ctx,type,p,time,h,20,48,54,12)
    hall(ctx,p,h,{x:7,y:66,w:81,height:12})
    productionBay(ctx,type,p,time,h,12,67,69,9)
    roofEquipment(ctx,type,p,time,h,34,13,31)
    for(const x of [10,84]){b(x,38,4,39,p.material);l(x+1,42,x+1,71)}
  }
  if(type==='rolling')cargoBelt(ctx,p,h,16,76,64,time)
  else {crate(13,75);crate(78,75)}
  ctx.restore()
}

function growingHouse(ctx,p,h,x,y,w,height,arched=false) {
  const {b,l,poly,leaf} = tools(ctx,p,h)
  b(x,y,w,height,p.water,arched?Math.min(w/2,9):1)
  if(!arched)poly([[x-2,y+2],[x+5,y-6],[x+w+2,y-6],[x+w+2,y+2]],p.roof)
  for(let dx=5;dx<w-2;dx+=7) {
    l(x+dx,y+2,x+dx,y+height-1)
    for(let dy=9;dy<height;dy+=9){b(x+dx-2,y+dy,4,1.5,p.soil,0);leaf(x+dx,y+dy,.55)}
  }
  b(x,y+height-2,w,2,p.material,0)
}

function drawExpandedField(ctx,building,p,time,h) {
  const {b,l,poly,oval,solar,leaf} = tools(ctx,p,h)
  const generation=Math.min(5,building.mergeGeneration)
  ctx.save();ctx.strokeStyle=INK;ctx.lineWidth=.65;ctx.lineJoin='round'
  foundation(ctx,p,h)
  b(8,23,83,54,p.soil,2)
  if(generation===2) {
    // Parallel barrel-vault growing tunnels, with an open irrigation headland.
    for(const x of [12,39,66])growingHouse(ctx,p,h,x,26,22,45,true)
    b(12,17,76,4,p.material);solar(33,16,32,6)
    for(const x of [23,50,77])l(x,21,x,26)
  } else if(generation===3) {
    // One working glasshouse and a side potting shed overlook broad crop rows.
    b(9,23,82,51,PAVING,1)
    b(12,32,49,24,p.wall)
    // Roof ribs meet the actual glass edges; they do not fan from an
    // offset point or run through the solid ridge trim.
    poly([[10,32],[36,15],[62,32]],p.roof)
    poly([[15,30],[36,18],[57,30]],p.water)
    for(const x of [22,29,36,43,50]) {
      const roofEdgeY=18+Math.abs(x-36)*12/21
      l(x,roofEdgeY,x,30)
    }
    b(11,32,51,2,p.material,0)
    b(16,36,40,16,p.water)
    for(const x of [26,36,46])l(x,36,x,52)
    for(const x of [21,31,41,51])leaf(x,49,.65)
    b(15,53,43,3,p.material)
    hall(ctx,p,h,{x:68,y:34,w:18,height:22,roof:p.roof})
    b(72,39,10,17,DECK)
    solar(70,29,13,4)
    // Two long beds make this stage read as a farm even at map scale.
    // Keep irrigation in the service gaps and plants inside their beds.
    b(62,37,3,20,p.water,0)
    l(64,57,88,57);l(88,57,88,74)
    for(const y of [58,68])l(14,y,88,y)
    for(const y of [64,73]) {
      b(13,y-4,72,7,p.soil,1)
      for(let x=18;x<84;x+=9)leaf(x,y+1,.65)
    }
  } else if(generation===4) {
    // A low twin-span glasshouse opens onto working tobacco beds.
    b(9,23,82,51,PAVING,1)
    for(const x of [12,52]) {
      b(x,29,35,26,p.wall)
      poly([[x-2,29],[x+16,14],[x+37,29]],p.water)
      poly([[x+16,14],[x+37,29],[x+37,33],[x+16,19]],p.roof)
      for(let dx=7;dx<32;dx+=8)l(x+dx,28,x+16,17)
      b(x+3,33,29,18,p.water)
      for(let dx=7;dx<32;dx+=8) {
        l(x+dx,33,x+dx,51)
        leaf(x+dx-3,48,.6)
      }
      b(x+2,52,31,3,p.material)
    }
    // Exposed soil and full leafy rows keep this recognizably a farm.
    for(const x of [13,54])for(const y of [62,71]) {
      b(x,y-3,32,6,p.soil,1)
      for(let dx=4;dx<31;dx+=7)leaf(x+dx,y+1,.85)
    }
    b(48,34,3,39,p.water,0)
    for(const y of [58,68]){l(49,y,14,y);l(49,y,85,y)}
    b(40,18,8,9,p.material,2);oval(44,18,4,1.5,p.water)
  } else {
    // A wide farming estate: packing barn, separate growing wings, and
    // an irrigated harvest court. All structures stay low and grounded.
    b(9,22,82,53,PAVING,1)
    hall(ctx,p,h,{x:29,y:25,w:39,height:16,roof:p.roof})
    b(34,28,12,10,p.water);b(51,28,12,12,DECK)
    solar(36,18,25,4)
    // Long glasshouse wings flank a clear central service lane.
    for(const x of [11,68]) {
      b(x,42,21,29,p.wall)
      poly([[x-2,42],[x+10,29],[x+23,42]],p.water)
      poly([[x+10,29],[x+23,42],[x+23,45],[x+10,33]],p.roof)
      b(x+3,45,15,22,p.water)
      for(const dx of [7,14]) {
        l(x+dx,44,x+dx,67)
        for(const y of [53,63])leaf(x+dx-2,y,.6)
      }
      b(x+2,69,17,3,p.material)
    }
    for(const x of [36,53])for(const y of [51,62,72]) {
      b(x,y-4,12,7,p.soil,1)
      leaf(x+3,y+1,.8);leaf(x+9,y+1,.8)
    }
    b(49,43,2,31,p.water,0)
    for(const y of [46,57,68]) {
      l(35,y,65,y)
      oval(50,y,1.3,1.3,p.material)
    }
    // Rear irrigation tanks and a small crate collection station.
    for(const x of [12,79]) {
      b(x,20,9,14,p.material,3);oval(x+4.5,20,4.5,2,p.water)
      l(x+4,34,x+4,38)
    }
  }
  const cartX=18+(time/3400%1)*56
  b(cartX,77,7,3,p.material);oval(cartX+1,81,1,1,INK);oval(cartX+6,81,1,1,INK)
  ctx.restore()
}

function drawExpandedSpaceport(ctx,building,p,time,h) {
  const {b,l,poly,window,solar,crate,vent} = tools(ctx,p,h)
  const generation=Math.min(5,building.mergeGeneration)
  ctx.save();ctx.strokeStyle=INK;ctx.lineWidth=.8;ctx.lineJoin='round'
  foundation(ctx,p,h)
  b(8,45,85,34,PAVING,1)
  if(generation===2) {
    // Twin-bay freight terminal and a cantilevered flight-control bridge.
    hall(ctx,p,h,{x:8,y:40,w:35,height:31,saw:true})
    for(const x of [12,28]){b(x,46,12,22,DECK);window(x+1,47,10,7)}
    b(47,24,42,13,p.wall);poly([[44,24],[54,14],[93,14],[91,24]],p.roof)
    window(51,27,33,6);solar(58,19,22,4)
  } else if(generation===3) {
    // A curved assembly hangar alongside the separate launch apron.
    b(9,25,34,47,p.roof,14)
    b(13,40,26,30,DECK,9)
    for(let x=17;x<39;x+=6)l(x,43,x,67)
    b(13,64,26,5,p.material)
    hall(ctx,p,h,{x:50,y:25,w:36,height:12})
    window(54,28,28,6)
    for(const x of [11,39]){b(x,42,3,29,p.material)}
    b(9,41,34,3,p.material)
  } else if(generation===4) {
    // Angular mission center with a long, low wing and detached cargo silos.
    poly([[8,35],[18,13],[39,13],[46,35],[42,71],[9,71]],p.wall)
    poly([[8,35],[18,13],[39,13],[46,35]],p.roof)
    window(15,37,22,10);b(15,53,21,18,DECK)
    for(const x of [51,64,77]){b(x,21,10,17,p.material,3);vent(x+1,23,8)}
    solar(17,27,20,6)
  } else {
    // Stepped orbital freight campus, with two decks and a tracking dish.
    hall(ctx,p,h,{x:16,y:24,w:65,height:13})
    window(22,27,52,6)
    hall(ctx,p,h,{x:8,y:49,w:33,height:24,saw:true})
    b(12,54,24,18,DECK);window(14,55,20,5)
    b(48,16,4,7,p.material)
    poly([[38,9],[62,9],[57,16],[44,16]],p.water)
    l(50,10,53,5)
    for(const x of [12,24,36])solar(x,38,9,4)
  }
  drawLaunchApron(ctx,p,time,h)
  crate(12,74);crate(21,74);crate(30,74)
  ctx.restore()
}
