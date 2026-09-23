import { drawAdvancedRoof } from './advancedRoofs.js'
import { drawBuildingTechnology } from './buildingTechnology.js'

// Geometry is selected only by building level. Prestige supplies material colors.
// [name, width, eave, roof profile, bays, feature]
const designs = {
  town_hall: [
    ['Village office', 42, 49, 'gable', 1, 'sign'],
    ['Council house', 54, 47, 'hip', 2, 'porch'],
    ['Clock hall', 56, 45, 'gable', 2, 'clock'],
    ['Public hall', 66, 43, 'hip', 3, 'colonnade'],
    ['Borough hall', 68, 42, 'mansard', 3, 'clock'],
    ['Municipal offices', 72, 36, 'flat', 4, 'upper'],
    ['Civic hall', 74, 40, 'hip', 4, 'tower'],
    ['City chambers', 78, 35, 'mansard', 4, 'colonnade'],
    ['Capitol', 80, 39, 'dome', 4, 'clock'],
    ['Grand civic complex', 84, 34, 'dome', 5, 'towers']
  ],
  nursery: [
    ['Seedling shelter', 40, 52, 'lean', 2, 'pots'],
    ['Potting house', 50, 49, 'gable', 3, 'bench'],
    ['Glass nursery', 58, 46, 'arch', 3, 'glass'],
    ['Twin growing house', 64, 45, 'twin', 4, 'glass'],
    ['Irrigated nursery', 66, 42, 'arch', 4, 'water'],
    ['Propagation house', 70, 39, 'saw', 4, 'shelves'],
    ['Climate nursery', 72, 40, 'gable', 4, 'vents'],
    ['Hydroponic nursery', 76, 36, 'flat', 5, 'shelves'],
    ['Botanical conservatory', 80, 36, 'dome', 5, 'glass'],
    ['Grand growing pavilion', 84, 33, 'twin', 6, 'water']
  ],
  curing: [
    ['Drying shed', 42, 51, 'lean', 1, 'rack'],
    ['Leaf barn', 50, 48, 'gable', 2, 'rack'],
    ['Ventilated barn', 56, 46, 'hip', 2, 'fan'],
    ['Twin drying barn', 62, 44, 'twin', 3, 'rack'],
    ['Loft curing house', 64, 38, 'mansard', 3, 'loft'],
    ['Airflow workshop', 70, 42, 'saw', 3, 'fan'],
    ['Climate curing hall', 74, 40, 'flat', 4, 'vents'],
    ['Multi-bay leafworks', 78, 36, 'twin', 4, 'loft'],
    ['Industrial curing hall', 80, 34, 'saw', 5, 'fan'],
    ['Grand curing works', 84, 32, 'mansard', 5, 'vents']
  ],
  steam: [
    ['Boiler shed', 42, 51, 'lean', 1, 'stack'],
    ['Steam workshop', 50, 48, 'gable', 1, 'pipe'],
    ['Twin boiler house', 56, 46, 'hip', 2, 'stack'],
    ['Pressure station', 62, 44, 'flat', 2, 'gauges'],
    ['Triple boiler works', 66, 43, 'saw', 3, 'pipe'],
    ['Steam hall', 70, 40, 'gable', 3, 'stacks'],
    ['Pressure plant', 74, 38, 'twin', 3, 'gauges'],
    ['Heat exchange works', 78, 36, 'saw', 4, 'pipe'],
    ['Steam powerhouse', 80, 34, 'flat', 4, 'stacks'],
    ['Grand thermal works', 84, 32, 'twin', 5, 'gauges']
  ],
  fermentation: [
    ['Barrel shed', 42, 51, 'lean', 1, 'barrels'],
    ['Aging lodge', 50, 48, 'gable', 2, 'barrels'],
    ['Fermentation cellar', 56, 46, 'hip', 2, 'cellar'],
    ['Twin aging house', 62, 44, 'twin', 3, 'barrels'],
    ['Vat house', 66, 42, 'gable', 3, 'vats'],
    ['Maturation loft', 70, 37, 'mansard', 3, 'loft'],
    ['Climate cellar', 74, 40, 'flat', 4, 'vents'],
    ['Fermentation hall', 78, 36, 'saw', 4, 'vats'],
    ['Reserve aging house', 80, 34, 'mansard', 5, 'cellar'],
    ['Grand fermentation works', 84, 32, 'twin', 5, 'vats']
  ],
  rolling: [
    ['Rolling cabin', 42, 51, 'lean', 1, 'bench'],
    ['Rolling workshop', 50, 48, 'gable', 2, 'bench'],
    ['Press house', 56, 46, 'hip', 2, 'press'],
    ['Conveyor workshop', 62, 44, 'flat', 3, 'belt'],
    ['Twin production hall', 66, 42, 'twin', 3, 'press'],
    ['Rolling loft', 70, 37, 'mansard', 3, 'loft'],
    ['Automated rolling hall', 74, 40, 'saw', 4, 'belt'],
    ['Precision rolling works', 78, 36, 'flat', 4, 'press'],
    ['Cigar assembly hall', 80, 34, 'saw', 5, 'belt'],
    ['Grand rolling factory', 84, 32, 'twin', 5, 'press']
  ],
  distribution: [
    ['Dispatch hut', 42, 51, 'lean', 1, 'crates'],
    ['Shipping shed', 50, 48, 'gable', 1, 'awning'],
    ['Twin loading depot', 56, 46, 'hip', 2, 'crates'],
    ['Freight station', 62, 44, 'flat', 2, 'awning'],
    ['Cargo warehouse', 66, 42, 'saw', 3, 'crates'],
    ['Dispatch headquarters', 70, 36, 'mansard', 3, 'office'],
    ['Regional freight hub', 74, 40, 'twin', 4, 'awning'],
    ['Logistics center', 78, 35, 'flat', 4, 'office'],
    ['Continental terminal', 80, 34, 'saw', 5, 'crates'],
    ['Grand freight exchange', 84, 32, 'twin', 5, 'office']
  ]
}
export const BUILDING_DESIGNS = Object.fromEntries(Object.entries(designs).map(([type, rows]) => [type,
  rows.map(([name, width, eave, roof, bays, feature]) => ({ name, width, eave, roof, bays, feature }))]))

export function drawBuildingDesign(ctx, type, level, p, time, processing, helpers) {
  const { box, path, ellipse, line, plant, flag } = helpers
  // Prestige colors stay bright at every level; upgrades change architecture.
  const d = (BUILDING_DESIGNS[type] ?? BUILDING_DESIGNS.distribution)[Math.max(0, Math.min(9, Math.floor(level) - 1))]
  const left = 50 - d.width / 2, right = 50 + d.width / 2, e = d.eave
  const roof = p.roof, trim = p.material, glass = p.water
  const b = (x,y,w,h,color,r=1) => box(ctx,x,y,w,h,color,r)
  const l = (x,y,x2,y2) => line(ctx,x,y,x2,y2)
  const oval = (x,y,rx,ry,color) => ellipse(ctx,x,y,rx,ry,color)
  const poly = (points,color) => path(ctx,points,color)
  const fan = (x,y,r=4) => {
    oval(x,y,r,r,p.wall)
    ctx.save();ctx.translate(x,y);ctx.rotate(time/(processing?350:2000))
    for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);poly([[0,0],[1,-r+1],[r-1,-2]],trim)}
    ctx.restore()
  }
  const window = (x,y,w=7,h=8) => {b(x,y,w,h,glass);l(x+w/2,y+1,x+w/2,y+h-1)}
  // Rear infrastructure is occluded by the shell, never pasted over machinery.
  if(type==='steam' && level<7) {
    const count = d.feature==='stacks' ? 3 : level>=5 ? 2 : 1
    for(let i=0;i<count;i++) {
      const x=left+5+i*11
      b(x,e-22,6,29,trim);b(x-1,e-23,8,3,p.wall)
      if(processing && time) for(let j=0;j<3;j++) {
        const v=(time/1900+j/3+i*.13)%1
        ctx.save();ctx.globalAlpha*=.5*(1-v)
        ellipse(ctx,x+3+Math.sin(v*6)*2,e-25-v*8,2+v*3,2+v*2,p.wall,false);ctx.restore()
      }
    }
  }
  if(type==='town_hall' && level<7 && ['tower','towers'].includes(d.feature)) {
    for(const x of d.feature==='tower'?[left+3]:[left+3,right-15]) {
      b(x,21,12,57,p.wall);poly([[x-2,22],[x+6,10],[x+14,22]],roof)
      window(x+3,28,6,9)
    }
  }
  b(left-3,78,d.width+6,4,trim)
  b(left,e,d.width,78-e,p.wall)
  // The roof profile changes the whole silhouette at each successive level.
  if(level>=6) drawAdvancedRoof(ctx, type, level, left, right, e, p, time, helpers)
  else if(d.roof==='lean') poly([[left-3,e],[left-3,e-13],[right+3,e-5],[right+3,e]],roof)
  else if(d.roof==='flat') {b(left-3,e-6,d.width+6,7,roof);for(let x=left+5;x<right-5;x+=14)b(x,e-12,9,6,trim)}
  else if(d.roof==='arch'||d.roof==='dome') {
    ctx.beginPath();ctx.moveTo(left-3,e);ctx.bezierCurveTo(left-3,e-25,right+3,e-25,right+3,e);ctx.closePath();ctx.fillStyle=roof;ctx.fill();ctx.stroke()
    if(d.roof==='dome'){b(46,e-25,8,7,trim);oval(50,e-27,2,2,p.wall)}
  } else if(d.roof==='twin'||d.roof==='saw') {
    const n=d.roof==='twin'?2:3, width=(d.width+6)/n
    const points=[[left-3,e]]
    for(let i=0;i<n;i++){const x=left-3+i*width;points.push([x+(d.roof==='twin'?width/2:width*.85),e-14],[x+width,e])}
    poly(points,roof)
  } else if(d.roof==='mansard') poly([[left-3,e],[left+4,e-14],[right-4,e-14],[right+3,e]],roof)
  else if(d.roof==='hip') poly([[left-3,e],[left+10,e-13],[right-10,e-13],[right+3,e]],roof)
  else poly([[left-3,e],[50,e-19],[right+3,e]],roof)
  // All facade details are placed relative to the current wall and bay geometry.
  b(left,e,d.width,2,trim,0)
  const bayWidth=(d.width-8)/d.bays
  const centers=Array.from({length:d.bays},(_,i)=>left+4+bayWidth*(i+.5))
  if(type==='town_hall') {
    if(level<7 && ['clock','tower','towers'].includes(d.feature)) {
      b(42,e-14,16,92-e,p.wall);poly([[39,e-14],[50,e-25],[61,e-14]],roof)
      oval(50,e-4,5.5,5.5,p.wall);l(50,e-4,50,e-8);l(50,e-4,53,e-3)
    }
    for(const x of centers) if(Math.abs(x-50)>9) window(x-3.5,d.eave<=36?58:e+8,7,10)
    b(45,62,10,16,trim);b(42,78,16,3,p.wall)
    if(d.feature==='upper'||d.eave<=35) for(const x of centers) if(!['clock','tower','towers'].includes(d.feature)||Math.abs(x-50)>9) window(x-3,e+5,6,7)
    if(d.feature==='porch'||d.feature==='colonnade') {
      const w=d.feature==='porch'?22:d.width-10
      b(50-w/2,58,w,4,roof)
      for(let x=50-w/2+2;x<50+w/2;x+=d.feature==='porch'?16:13)b(x,62,2,16,trim)
    }
    if(d.feature==='sign') b(39,55,22,5,trim)
    if(level===5) flag(ctx,right-5,e-3,time/800,trim)
  } else if(type==='nursery') {
    b(left+3,e+4,d.width-6,72-e,glass)
    for(const x of centers) {
      l(x-bayWidth/2,e+4,x-bayWidth/2,75)
      b(x-4,68,8,7,trim)
      ctx.save();ctx.translate(x,69);ctx.scale(.6,.65);plant(ctx,0,0,time/900+x,false,p);ctx.restore()
      if(d.feature==='shelves'){b(x-4,51,8,5,trim);ctx.save();ctx.translate(x,52);ctx.scale(.4,.4);plant(ctx,0,0,time/900+x,false,p);ctx.restore()}
    }
    if(d.feature==='bench') b(left+4,73,d.width-8,3,trim)
    if(d.feature==='water'){b(right-12,e+7,8,15,p.material,3);l(left+4,e+7,right-4,e+7)}
  } else if(type==='curing') {
    for(const x of centers) {
      const w=bayWidth-3;b(x-w/2,e+9,w,68-e,p.soil)
      l(x-w/2+1,e+12,x+w/2-1,e+12)
      for(let i=0;i<2;i++){const px=x+(i?1:-1)*w*.22;l(px,e+12,px,63);oval(px+Math.sin(time/900+x)*.5,65,Math.min(2,w/5),8,trim)}
    }
    if(d.feature==='fan') for(const x of [left+10,right-10]) fan(x,e+6,3)
    if(d.feature==='loft') for(const x of centers) window(x-3,e+3,6,5)
  } else if(type==='steam') {
    for(const x of centers) {
      const w=Math.min(19,bayWidth-3);b(x-w/2,55,w,23,glass,Math.min(6,w/3));oval(x,55,w/2,3,p.wall)
      oval(x,65,Math.min(4,w/3),Math.min(4,w/3),p.wall);l(x,65,x+Math.sin(time/(processing?180:1200))*2,62)
    }
    if(d.feature==='pipe'||d.feature==='gauges') {b(left+4,e+5,d.width-8,3,trim);l(left+5,e+8,left+5,53);l(right-5,e+8,right-5,53)}
    if(d.feature==='gauges') for(const x of [40,50,60]){oval(x,e-4,3,3,p.wall);l(x,e-4,x+1,e-6)}
  } else if(type==='fermentation') {
    for(const x of centers) {
      const w=Math.min(19,bayWidth-3), vat=d.feature==='vats'
      b(x-w/2,56,w,22,vat?glass:trim,vat?4:6);oval(x,56,w/2,2.5,vat?p.wall:trim)
      l(x-w/2,62,x+w/2,62);l(x-w/2,72,x+w/2,72)
      if(!vat)l(x,58,x,76)
      if(processing&&time){const f=(time/1700+x/100)%1;ctx.save();ctx.globalAlpha*=1-f;ellipse(ctx,x,53-f*9,1+f,1+f,p.wall,false);ctx.restore()}
    }
    if(d.feature==='cellar') {b(45,e-11,10,9,p.soil,4);l(50,e-10,50,e-3)}
    if(d.feature==='loft')for(const x of centers)window(x-3,e+5,6,8)
  } else if(type==='rolling') {
    for(const x of centers) {
      const w=bayWidth-3;b(x-w/2,57,w,14,glass)
      b(x-w/2+1,60,w-2,3,trim)
      if(d.feature==='press'){b(x-2,48,4,11,trim);b(x-w/2,48,w,3,roof)}
    }
    const belt=['belt','press','loft'].includes(d.feature)
    b(left+2,71,d.width-4,6,belt?glass:trim,2)
    for(let i=0;i<d.bays;i++){const x=left+5+((i*(d.width-14)/d.bays+(processing?time/180:0))%(d.width-14));b(x,70,6,2,trim)}
    if(belt)for(const x of [left+7,right-7]){oval(x,77,3,3,trim);l(x-1,77,x+1,77)}
    if(d.feature==='loft')for(const x of centers)window(x-3,e+5,6,8)
  } else {
    for(const x of centers) {
      const w=bayWidth-3;b(x-w/2,54,w,24,glass)
      for(let y=58;y<77;y+=5)l(x-w/2+1,y,x+w/2-1,y)
      b(x-3,71,6,6,trim);l(x,72,x,76)
    }
    b(left+1,78,d.width-2,3,trim)
    if(d.feature==='awning'){poly([[left,e+7],[right,e+7],[right+3,e+16],[left-3,e+16]],roof);l(left,e+16,left,77);l(right,e+16,right,77)}
    if(d.feature==='office')for(const x of centers)window(x-3,e+5,6,8)
  }
  if(level>=7) {
    for(const x of centers) {
      ctx.fillStyle=p.water;ctx.fillRect(x-bayWidth*.3, e+3, bayWidth*.6, 2)
    }
    if(type==='town_hall') {
      b(43,e+12,14,10,p.material,2)
      oval(50,e+17,4,4,p.water)
      ctx.strokeStyle=p.wall;l(47,e+17,53,e+17);l(50,e+14,50,e+20);ctx.strokeStyle='#294844'
    }
  }
  if(d.feature==='vents')for(const x of [left+9,right-9])fan(x,e+8,4)
  drawBuildingTechnology(ctx, { type, level, left, right, eave: e, palette: p, time }, helpers)
}
