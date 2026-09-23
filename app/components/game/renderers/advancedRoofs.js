// Each late-game roof is a type-specific landmark, in the unmuted prestige palette.
export function drawAdvancedRoof(ctx, type, level, left, right, e, p, time, { box, path, line, ellipse }) {
  const b=(x,y,w,h,c,r=1)=>box(ctx,x,y,w,h,c,r)
  const l=(x,y,x2,y2)=>line(ctx,x,y,x2,y2)
  const oval=(x,y,rx,ry,c)=>ellipse(ctx,x,y,rx,ry,c)
  const poly=(points,c)=>path(ctx,points,c)
  const width=right-left
  const band=(x,y,w,c=p.water)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,2)}
  if(level===6) {
    poly([[left-3,e],[left+3,e-10],[right-3,e-10],[right+3,e]],p.roof)
    b(left+1,e-4,width-2,4,p.material);band(left+4,e-3,width-8)
    for(const x of [left+9,right-19]){b(x,e-15,10,5,p.material);band(x+2,e-14,6)}
    return
  }
  const top=e-3
  const tall=Math.min(17+(level-7)*3,top-7)
  const span=44+(level-7)*7
  // Broad beveled deck and projecting cornice give the building a substantial cap.
  poly([[left-3,e],[left+2,e-8],[right-2,e-8],[right+3,e]],p.roof)
  b(left-2,e-3,width+4,4,p.material)
  band(left+2,e-2,width-4)

  if(type==='town_hall') {
    // A stepped central tower and paired civic spires dominate the skyline.
    const peak=top-tall
    b(39,peak+3,22,tall-3,p.wall)
    poly([[36,peak+5],[43,peak-1],[57,peak-1],[64,peak+5]],p.roof)
    b(44,peak+8,12,8,p.water,2)
    ctx.strokeStyle=p.wall;l(50,peak+9,50,peak+15);ctx.strokeStyle='#294844'
    for(const x of [left+5,right-17]){
      const h=level>=9?tall-2:tall-7
      b(x,top-h,12,h,p.wall)
      poly([[x-2,top-h],[x+6,top-h-5],[x+14,top-h]],p.roof)
      b(x+3,top-h+4,6,Math.max(4,h-6),p.water,1)
    }
    if(level>=8){b(35,top-5,30,5,p.roof);band(38,top-4,24)}
    if(level>=10){oval(50,peak+3,16,3,p.material);oval(50,peak+3,11,1.5,p.water)}
  } else if(type==='nursery') {
    // Full-width conservatory glass, structural ribs, and roof-mounted plant beds.
    const half=span/2
    ctx.beginPath();ctx.moveTo(50-half,top);ctx.bezierCurveTo(50-half,top-tall*1.3,50+half,top-tall*1.3,50+half,top);ctx.closePath();ctx.fillStyle=p.water;ctx.fill();ctx.stroke()
    for(const dx of [-.55,0,.55]) {
      ctx.strokeStyle=p.wall;ctx.lineWidth=1.5
      ctx.beginPath();ctx.moveTo(50+dx*half,top);ctx.quadraticCurveTo(50+dx*half*.8,top-tall*.65,50+dx*half*.45,top-tall*.9);ctx.stroke()
    }
    ctx.strokeStyle='#294844';ctx.lineWidth=1.7
    for(let i=0;i<(level>=9?5:3);i++){
      const x=50+(i-((level>=9?5:3)-1)/2)*9
      b(x-3,top-5,6,5,p.material)
      oval(x-1,top-7,2,3,p.leaf);oval(x+2,top-8,2,3,p.leafLight)
    }
    if(level>=10){b(left+1,top-11,7,12,p.roof,3);b(right-8,top-11,7,12,p.roof,3);band(left+2,top-7,5);band(right-7,top-7,5)}
  } else if(type==='steam') {
    // Large exposed turbine with mirrored cooling stacks, not tiny roof vents.
    const radius=Math.min(tall/2,10)
    for(const x of [left+6,right-15]){
      b(x,top-tall,9,tall,p.roof,2)
      for(let y=top-tall+3;y<top-2;y+=4)band(x+1,y,7,p.water)
      oval(x+4.5,top-tall,5,2,p.material)
    }
    oval(50,top-radius,radius+4,radius+2,p.material)
    oval(50,top-radius,radius,radius,p.water)
    ctx.save();ctx.translate(50,top-radius);ctx.rotate(time/1000)
    for(let i=0;i<5;i++){ctx.rotate(Math.PI*2/5);poly([[0,0],[2,-radius+1],[6,-radius+4]],p.roof)}ctx.restore()
    if(level>=9){ctx.strokeStyle=p.material;ctx.lineWidth=3;l(left+15,top-5,36,top-5);l(64,top-5,right-15,top-5);ctx.strokeStyle='#294844';ctx.lineWidth=1.7}
  } else if(type==='fermentation') {
    // Tall graduated fermentation vessels and a manifold linking their bases.
    const n=level>=9?4:3,w=level>=9?12:14
    for(let i=0;i<n;i++){
      const x=50+(i-(n-1)/2)*(w+3),h=tall-(i%2?4:0)
      b(x-w/2,top-h,w,h,p.roof,4);oval(x,top-h,w/2,3,p.material)
      b(x-2,top-h+4,4,h-7,p.water,1)
      band(x-w/2+1,top-5,w-2,p.material)
    }
    b(50-span/2,top-2,span,3,p.material)
    if(level>=10){for(const x of [left+4,right-7]){b(x,top-13,3,13,p.water);oval(x+1.5,top-14,3,3,p.material)}}
  } else if(type==='curing') {
    // Sawtooth ventilation towers with exposed fans and a broad collector hood.
    const n=level>=9?4:3,w=span/n
    for(let i=0;i<n;i++){
      const x=50-span/2+i*w,h=tall-(i%2?4:0)
      b(x,top-h,w-2,h,p.wall)
      poly([[x-1,top-h],[x+w-3,top-h-3],[x+w-3,top-h+2],[x-1,top-h+2]],p.roof)
      oval(x+(w-2)/2,top-h+8,4,4,p.water)
      const angle=time/800;ctx.strokeStyle=p.material;l(x+w/2-1-Math.cos(angle)*3,top-h+8-Math.sin(angle)*3,x+w/2-1+Math.cos(angle)*3,top-h+8+Math.sin(angle)*3);ctx.strokeStyle='#294844'
    }
    b(50-span/2-2,top-3,span+2,4,p.roof);band(50-span/2,top-2,span-2)
  } else if(type==='rolling') {
    // A wide robot gantry with articulated arms and a bright production rail.
    const y=top-tall
    for(const x of [50-span/2,50+span/2-5]) {b(x,y,5,tall,p.roof);b(x+1,y+4,3,tall-6,p.water)}
    b(50-span/2-2,y,span+4,5,p.material);band(50-span/2+2,y+1,span-4)
    const n=level>=9?3:2
    for(let i=0;i<n;i++){
      const x=50+(i-(n-1)/2)*14,move=time?Math.sin(time/1000+i)*2:0
      b(x-3,y+5,6,4,p.roof)
      ctx.lineWidth=2.5;ctx.strokeStyle=p.material;l(x,y+9,x+move,y+13);l(x+move,y+13,x+4,top-2);ctx.lineWidth=1.7;ctx.strokeStyle='#294844'
      oval(x+move,y+13,1.7,1.7,p.water);l(x+4,top-2,x+1,top);l(x+4,top-2,x+7,top)
    }
  } else {
    // Elevated flight deck, communications tower, and perimeter landing lights.
    const x=right-18,y=top-tall
    b(x+3,y+6,9,tall-6,p.wall)
    poly([[x,y],[x+17,y],[x+15,y+8],[x+2,y+8]],p.roof)
    b(x+3,y+2,11,4,p.water)
    oval(43,top-4,span/2-2,7,p.material);oval(43,top-4,span/2-7,4,p.water)
    ctx.strokeStyle=p.wall;l(38,top-6,38,top-2);l(48,top-6,48,top-2);l(38,top-4,48,top-4);ctx.strokeStyle='#294844'
    for(const x of [24,34,44,54,64])oval(x,top,.8,.8,p.water)
    if(level>=9){l(left+5,top,left+5,top-14);oval(left+5,top-15,4,2,p.water)}
  }
}
