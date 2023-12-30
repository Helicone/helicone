import{useLayoutEffect as t,useEffect as c}from"react";import{env as i}from'../utils/env.js';let l=(e,f)=>{i.isServer?c(e,f):t(e,f)};export{l as useIsoMorphicEffect};
