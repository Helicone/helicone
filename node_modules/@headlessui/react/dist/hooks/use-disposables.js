import{useState as s,useEffect as o}from"react";import{disposables as t}from'../utils/disposables.js';function p(){let[e]=s(t);return o(()=>()=>e.dispose(),[e]),e}export{p as useDisposables};
