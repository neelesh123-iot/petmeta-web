import type {CSSProperties} from 'react';

export default function CategoryIcon({index,animal=false}:{index:number;animal?:boolean}) {
  if(!animal&&(index===0||index===5))return <span className="discovery-icon"><img src={`/discovery/${index===0?'hospital':'training'}.webp`} alt="" loading="lazy" width="256" height="256"/></span>;
  const columns=animal?3:4,row=Math.floor(index/columns),bounds=[0,294/1254,568/1254,880/1254,1];
  const top=animal?row/2:bounds[row],fraction=animal ? .5 : bounds[row+1]-bounds[row];
  return <span className="discovery-icon discovery-atlas" aria-hidden="true" style={{backgroundImage:`url(/discovery/${animal?'species':'services'}.webp)`,backgroundSize:`${columns*100}% ${100/fraction}%`,backgroundPosition:`${index%columns*100/(columns-1)}% ${top*100/(1-fraction)}%`} as CSSProperties}/>;
}
