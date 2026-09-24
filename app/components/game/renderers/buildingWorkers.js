const INK = '#294844'
const WORKER_FACE = '#f2d36f'

// A shared deterministic work cycle. Motion-off is a fixed working pose.
export function getWorkerCycle(time, index = 0, seed = 0, active = true) {
  const cycle = time ? ((time / (active ? 10000 : 16000) + seed + index * .29) % 1 + 1) % 1 : .4
  const stage = cycle < .2 ? 'approach' : cycle < .65 ? 'work' : cycle < .85 ? 'return' : 'unload'
  const progress = stage === 'approach' ? cycle / .2 : stage === 'return' ? (cycle - .65) / .2 : stage === 'unload' ? (cycle - .85) / .15 : (cycle - .2) / .45
  return { stage, progress, walking: !!time && (stage === 'approach' || stage === 'return'),
    travel: stage === 'approach' ? -9 + progress * 9 : stage === 'return' ? -progress * 9 : stage === 'unload' ? -9 : 0 }
}

// Workers operate grounded stations in the foreground. Tools reach their target;
// props stay in world space instead of following the worker like accessories.
export function drawBuildingWorkers(ctx, building, p, time = 0) {
  const { type, level = 1 } = building
  const count = level >= 8 ? 3 : level >= 4 ? 2 : 1
  const active = !!building.upgrade || building.slot?.status === 'processing' || ['town_hall','distribution'].includes(type)
  const task = building.upgrade ? 'repair' : ({town_hall:'inspect',nursery:'water',field:'tend',curing:'leaf',steam:'repair',fermentation:'stir',rolling:'roll',distribution:'carry'}[type] ?? 'inspect')
  const seed = (building.position?.x ?? 0)*.17+(building.position?.y ?? 0)*.23
  const line=(x,y,ex,ey)=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.stroke()}
  const box=(x,y,w,h,fill,r=.5)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();ctx.stroke()}
  const oval=(x,y,rx,ry,fill)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.stroke()}
  const parcel=(x,y)=>{box(x,y,4.5,3.8,p.material);ctx.strokeStyle=p.wall;line(x+2.2,y+.4,x+2.2,y+3.4);ctx.strokeStyle=INK}
  ctx.save();ctx.lineWidth=.75;ctx.strokeStyle=INK;ctx.lineCap='round';ctx.lineJoin='round'
  for(let i=0;i<count;i++) {
    const robot=level>=10||(level>=7&&i>0)
    const state=getWorkerCycle(time,i,seed,active)
    const working=state.stage==='work'
    const returning=state.stage==='return'||state.stage==='unload'
    const wave=time?Math.sin(time/(active?240:400)+i*2):0
    const work=working?wave:0
    const x=count===1?51:count===2?33+i*31:24+i*24
    ctx.save();ctx.translate(x,82)
    // Fixed stations are drawn behind the worker, at reachable arm height.
    if(task==='water'||task==='tend') {
      box(4,-3,9,3,p.material)
      for(const px of [6,9,12]) {
        line(px,-3,px,-7)
        oval(px-1,-6,1.4,2,p.leaf);oval(px+1,-7,1.3,2,p.leafLight)
      }
      if(working && time && (task==='water'||robot)) {
        ctx.fillStyle=p.water
        for(let d=0;d<4;d++) {const f=(time/550+d/4)%1;ctx.fillRect(5+f*6,-9+f*6,.7,1.2)}
      }
    } else if(task==='repair') {
      box(5,-10,7,10,p.material,1)
      oval(8.5,-7,2.6,2.6,p.water)
      const a=working?work*.8:0
      line(8.5-Math.cos(a)*2,-7-Math.sin(a)*2,8.5+Math.cos(a)*2,-7+Math.sin(a)*2)
      line(8.5-Math.sin(a)*2,-7+Math.cos(a)*2,8.5+Math.sin(a)*2,-7-Math.cos(a)*2)
      box(7,-3,3,1,working?p.leafLight:p.water,.2)
    } else if(task==='leaf') {
      line(5,0,5,-14);line(13,0,13,-14);line(5,-13,13,-13)
      for(const px of [8,11]) {line(px,-13,px,-10);oval(px,-8,1.3,3,p.leafLight)}
      parcel(-13,-4)
    } else if(task==='stir') {
      box(4,-6,9,6,p.material,2);oval(8.5,-6,4.5,1.8,p.water)
      ctx.strokeStyle=p.wall
      ctx.beginPath();ctx.ellipse(8.5,-6,2.5,1,0,time/300,time/300+Math.PI);ctx.stroke();ctx.strokeStyle=INK
    } else if(task==='roll') {
      line(5,-3,5,0);line(13,-3,13,0);box(3,-4,11,1.5,p.material)
      oval(9,-4.7,3,1,p.leafLight)
      if(working && state.progress>.6)box(11,-6,3,1,p.material)
      parcel(-13,-4)
    } else if(task==='carry') {
      // A load disappears from the pickup stack and appears at the loading dock.
      box(4,-2,10,2,p.material);parcel(9,-6)
      if(returning)parcel(-14,-4)
      if((working&&state.progress>=.65)||returning)parcel(4,-6)
    } else {
      box(7,-6,2,6,p.material);box(4,-12,9,6,p.water,1)
      ctx.strokeStyle=p.wall
      line(5,-10,working?8+work:11,-10);line(5,-8,10,-8);ctx.strokeStyle=INK
    }
    ctx.save();ctx.translate(state.travel,0)
    if(returning)ctx.scale(-1,1)
    const stride=state.walking?Math.sin(time/100+i)*1.4:0
    const carrying=(task==='carry'&&(state.stage==='approach'||(working&&state.progress<.65))) || (['leaf','roll'].includes(task)&&returning&&state.stage!=='unload')
    ctx.save();ctx.globalAlpha*=.2;ctx.beginPath();ctx.ellipse(0,0,3.5,1,0,0,Math.PI*2);ctx.fillStyle=INK;ctx.fill();ctx.restore()
    if(robot&&level>=9) {
      box(-3.2,-2.6,6.4,2.4,p.material,1)
      for(const wx of [-2,0,2]){oval(wx,-1.4,.65,.65,INK);ctx.strokeStyle=p.water;const a=state.walking?time/90:0;line(wx-Math.cos(a)*.45,-1.4-Math.sin(a)*.45,wx+Math.cos(a)*.45,-1.4+Math.sin(a)*.45);ctx.strokeStyle=INK}
    } else {
      line(-1,-4,-1.5-stride,-.6);line(1,-4,1.5+stride,-.6)
      line(-2.5-stride,-.4,-.5-stride,-.4);line(.5+stride,-.4,2.5+stride,-.4)
    }
    // Bend at the waist while tending or unloading; keep the feet planted.
    const bend=working&&['tend','roll'].includes(task)? .6+work*.4 : state.stage==='unload'?Math.sin(state.progress*Math.PI)*1.4:0
    const bob=state.walking?Math.abs(stride)*.25:0
    ctx.translate(bend*.5,bend+bob)
    box(-2.4,-8,4.8,4.6,robot?p.material:p.roof??'#719ec2',robot?1:.5)
    if(robot){
      box(-2.8,-12.8,5.6,4.4,p.wall,1);box(-2,-11.8,4,1.5,p.water,.3)
      line(0,-12.8,0,-14);oval(0,-14.3,.65,.65,p.water);box(-1.2,-7,2.4,1.7,p.water,.3)
    } else {
      oval(0,-10,2.2,2.4,WORKER_FACE)
      if(level>=5)box(-2.1,-10.8,4.2,1.5,p.water,.4)
      else{ctx.fillStyle=INK;ctx.fillRect(.6,-10.3,.65,.65)}
      box(-2.3,-13,4.6,1.6,p.material,1);line(-3,-11.6,3,-11.6)
    }
    let hx=4,hy=-5+stride*.4
    if(working) {
      if(task==='repair'){hx=7;hy=-7+work}
      else if(task==='inspect'){hx=6;hy=-9+work*.7}
      else if(task==='stir'){hx=7+work*1.5;hy=-8}
      else if(task==='leaf'){hx=5+state.progress*3;hy=-5-Math.sin(state.progress*Math.PI)*7}
      else if(task==='roll'){hx=7+work*2;hy=-5-bend}
      else if(task==='water'){hx=4;hy=-10}
      else if(task==='tend'){hx=5+work;hy=-7-bend}
      else if(task==='carry'){hx=4+state.progress*3;hy=-5-state.progress}
    }
    // Two-segment arms clearly reach the station, rather than waving in place.
    line(2.4,-7,4,-6);line(4,-6,hx,hy)
    line(-2.4,-7,-3,-5);line(-3,-5,carrying?2:-3+work*.3,carrying?-5:-4)
    if(carrying){parcel(hx-2,hy-1)}
    else if(working) {
      if(task==='water'||(task==='tend'&&robot)){box(hx-1,hy-1,3,2.5,p.water,.6);line(hx+2,hy,hx+4,hy-1)}
      else if(task==='tend'){line(hx,hy,8+work,-3-bend);line(6+work,-3-bend,10+work,-3-bend)}
      else if(task==='repair'){line(hx,hy,8.5,-7);oval(hx,hy,.8,.8,p.material)}
      else if(task==='leaf'){oval(hx,hy,1.4,2.7,p.leafLight)}
      else if(task==='stir'){line(hx,hy,8.5+work,-5.8)}
      else if(task==='roll'){box(hx-1,hy,3,1,p.material,.4)}
    }
    ctx.restore();ctx.restore()
  }
  ctx.restore()
}
