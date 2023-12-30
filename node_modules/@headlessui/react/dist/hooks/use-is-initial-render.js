import{useRef as r,useEffect as t}from"react";function n(){let e=r(!0);return t(()=>(e.current=!1,()=>{e.current=!0}),[]),e.current}export{n as useIsInitialRender};
