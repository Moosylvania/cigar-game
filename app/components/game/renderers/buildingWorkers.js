const INK = '#294844'
// A single toy-like golden face color, without naturalistic skin tones.
const WORKER_FACE = '#f2d36f'

// Decorative crews share the building's normalized space and motion clock.
// No agents, paths, simulation state, or timers are added to saved games.
export function drawBuildingWorkers(ctx, building, palette, time = 0) {
  const { type, level = 1 } = building
  const count = level >= 8 ? 3 : level >= 4 ? 2 : 1
  const active = !building.upgrade && (building.slot?.status === 'processing' || ['town_hall', 'distribution'].includes(type))
  const seed = (building.position?.x ?? 0) * 1.7 + (building.position?.y ?? 0) * 2.3
  const task = building.upgrade ? 'repair' : ({
    town_hall: 'inspect', nursery: 'water', field: 'tend', curing: 'leaf',
    steam: 'repair', fermentation: 'stir', rolling: 'roll', distribution: 'carry'
  }[type] ?? 'inspect')
  const drawLine = (x,y,ex,ey) => {ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.stroke()}
  const box = (x,y,w,h,fill,r=0.6) => {ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();ctx.stroke()}
  const oval = (x,y,rx,ry,fill) => {ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.stroke()}
  ctx.save()
  ctx.lineWidth = 0.75
  ctx.strokeStyle = INK
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (let i = 0; i < count; i++) {
    const robot = level >= 10 || (level >= 7 && i > 0)
    const phase = time ? time / (active ? 420 : 1200) + seed + i * 2.1 : 0
    const cycle = time ? ((time / (active ? 9000 : 14000) + seed * 0.13 + i * 0.31) % 1 + 1) % 1 : 0.3
    const walking = !!time && (cycle < 0.25 || (cycle >= 0.5 && cycle < 0.75))
    const returning = cycle >= 0.5
    const progress = cycle < 0.25 ? cycle * 4 : cycle < 0.5 ? 1 : cycle < 0.75 ? 3 - cycle * 4 : 0
    const work = time && !walking ? Math.sin(phase) : 0
    const stride = walking ? Math.sin(time / 100 + i * 2) * 1.3 : 0
    const carrying = task === 'carry' || (count > 1 && i === count - 1 && task !== 'inspect')
    const x = count === 1 ? 55 : count === 2 ? 34 + i * 31 : 26 + i * 24
    const travel = time ? (progress - 0.5) * 11 : 0
    ctx.save()
    ctx.translate(x + travel, 82 + (i % 2 ? -1 : 0))
    ctx.scale(returning ? -1 : 1, 1)
    // A small ground shadow, below the feet, never a floating worker.
    ctx.save();ctx.globalAlpha *= 0.2
    ctx.beginPath();ctx.ellipse(0,0,4,1,0,0,Math.PI*2);ctx.fillStyle=INK;ctx.fill();ctx.restore()
    if (robot && level >= 9) {
      box(-3.2,-2.6,6.4,2.4,palette.material,1)
      for(const wx of [-2,0,2]) {
        oval(wx,-1.4,.65,.65,INK)
        ctx.strokeStyle=palette.water
        const angle=walking?time/90:0
        drawLine(wx-Math.cos(angle)*.45,-1.4-Math.sin(angle)*.45,wx+Math.cos(angle)*.45,-1.4+Math.sin(angle)*.45)
        ctx.strokeStyle=INK
      }
    } else {
      drawLine(-1,-4,-1.5-stride,-0.6)
      drawLine(1,-4,1.5+stride,-0.6)
      drawLine(-2.5-stride,-0.4,-.5-stride,-0.4)
      drawLine(.5+stride,-0.4,2.5+stride,-0.4)
    }
    const bob = walking ? Math.abs(stride)*0.3 : time ? Math.sin(phase*2)*0.2 : 0
    ctx.translate(0,bob)
    box(-2.4,-8,4.8,4.6,robot?palette.material:palette.roof ?? '#719ec2',robot?1:.5)
    if(robot) {
      box(-2.8,-12.8,5.6,4.4,palette.wall,1)
      box(-2,-11.8,4,1.5,palette.water,.3)
      drawLine(0,-12.8,0,-14)
      oval(0,-14.3,.65,.65,palette.water)
      box(-1.2,-7,2.4,1.7,palette.water,.3)
      for(const sx of [-2.7,2.7]) oval(sx,-7,.7,.7,palette.material)
    } else {
      oval(0,-10,2.2,2.4,WORKER_FACE)
      // Human crews acquire protective visors before robot crews arrive.
      if(level>=5) box(-2.1,-10.8,4.2,1.5,palette.water,.4)
      else {ctx.fillStyle=INK;ctx.fillRect(.6,-10.3,.65,.65)}
      box(-2.3,-13,4.6,1.6,palette.material,1)
      drawLine(-3,-11.6,3,-11.6)
      if(level>=8) box(-3.2,-7.5,1.2,3.5,palette.material,.5)
    }
    const handY = -5.3 + (carrying ? (walking ? 0 : work * 0.8) : walking ? stride * .5 : work * 1.8)
    drawLine(-2.4,-7,-3.7,-5+work*.5)
    drawLine(2.4,-7,4,handY)
    if(carrying) {
      box(1,handY-.7,5,4,palette.material,.4)
      ctx.strokeStyle=palette.wall;drawLine(3.5,handY-.3,3.5,handY+2.8);ctx.strokeStyle=INK
    } else if(task==='water'||task==='tend') {
      if(task==='tend' && !robot) {drawLine(4,handY,6,-1);drawLine(4.5,-1,7.5,-1)}
      else {
        box(3,handY,3.5,2.5,palette.water,.7)
        drawLine(6,handY+1,8,handY-.5)
        if(!walking && time) {ctx.fillStyle=palette.water;for(let d=0;d<3;d++){const fall=(time/600+d/3)%1;ctx.fillRect(8+fall,handY+fall*4,.6,1)}}
      }
    } else if(task==='repair') {
      drawLine(4,handY,6,handY-3)
      drawLine(6,handY-3,5,handY-4);drawLine(6,handY-3,7,handY-3.5)
    } else if(task==='leaf') {
      oval(5,handY-1,1.4,2.4,palette.leafLight);drawLine(5,handY-3,5,handY+1)
    } else if(task==='stir') {
      box(3,-4,4,3,palette.material,1)
      drawLine(5,-2.5,4+work,handY-2)
    } else if(task==='roll') {
      box(3,-4,5,1.2,palette.material,.4);drawLine(4,handY,6,-4.5)
    } else {
      box(3,handY-2,3.4,4.5,palette.wall,.4)
      ctx.strokeStyle=palette.water;drawLine(3.5,handY-1,5.7,handY-1);drawLine(3.5,handY,5.7,handY);ctx.strokeStyle=INK
    }
    ctx.restore()
  }
  ctx.restore()
}
