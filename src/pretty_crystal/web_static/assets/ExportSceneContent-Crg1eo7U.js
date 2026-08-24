const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/AmbientOcclusionEffect-BFWqUJMv.js","assets/index-Bq2MPSfh.js","assets/index-CXKjCYlq.css","assets/three.module-CRArYzVK.js","assets/react-three-fiber.esm-CtCNyLLf.js"])))=>i.map(i=>d[i]);
import{r as x,F as h,_ as gt,m as Ye,a5 as ve,a6 as Ee,a7 as xt,a8 as re,a1 as Xe,a9 as St,aa as yt,ab as vt,ac as Qe,ad as Et,ae as Je,af as de,ag as wt,ah as bt,ai as _t,aj as Mt,ak as At,al as Re,am as Ze,I as Ct,K as It,an as Ot,J as Rt,Q as Pt,P as Tt,ao as Pe,ap as Bt,aq as Lt}from"./index-Bq2MPSfh.js";import{n as jt,o as Dt,p as Te,d as se,q as ie,V as M,Q as we,D as ae,g as ce,r as et,F as U,s as Ft,e as Ut,t as ne,u as tt,b as zt,v as oe,w as Nt,x as Se,y as V,z as Gt,A as be,E as nt,h as Ht,G as Q,H as Wt,c as Vt,J as $t,K as qt,X as kt,O as Kt}from"./three.module-CRArYzVK.js";import{S as G}from"./StructureMaterial-DWVA9XLv.js";import{u as H,a as ot}from"./react-three-fiber.esm-CtCNyLLf.js";const Be=["performance","low","medium","high","ultra"];let _e=null,Le=null;function Yt(){return Le??(Le=gt(()=>import("./AmbientOcclusionEffect-BFWqUJMv.js"),__vite__mapDeps([0,1,2,3,4])).then(t=>(_e=t,t))),Le}function vo(t){return t.length>0&&!_e}function Eo({effects:t}){const e=t.find(r=>r.type==="ambientOcclusion"),[n,o]=x.useState(_e);return x.useEffect(()=>{if(!e||n)return;let r=!1;return Yt().then(s=>{r||o(s)}),()=>{r=!0}},[e,n]),!e||!n?null:h.jsx(n.AmbientOcclusionEffect,{ambientOcclusion:Xt(e.props,"ambientOcclusion.props")})}function Xt(t,e){const n={};for(const[o,r]of Object.entries(t))if(r!=null)switch(o){case"aoRadius":case"aoSamples":case"denoiseRadius":case"denoiseSamples":case"distanceFalloff":case"intensity":n[o]=Qt(r,`${e}.${o}`);break;case"depthAwareUpsampling":case"halfRes":case"screenSpaceRadius":n[o]=Jt(r,`${e}.${o}`);break;case"color":n.color=Zt(r,`${e}.${o}`);break;case"quality":n.quality=en(r,`${e}.${o}`);break;default:throw new Error(`${e}.${o} is not supported.`)}return n}function Qt(t,e){if(typeof t!="number"||!Number.isFinite(t))throw new Error(`${e} must be a finite number.`);return t}function Jt(t,e){if(typeof t!="boolean")throw new Error(`${e} must be a boolean.`);return t}function Zt(t,e){if(typeof t!="string"||t.trim()==="")throw new Error(`${e} must be a non-empty string.`);return t}function en(t,e){if(typeof t!="string"||!Be.includes(t))throw new Error(`${e} must be one of ${Be.join(", ")}.`);return t}function wo(t){return rt(Ye(t.materialPreset))}function bo(t){return{atom:fe(t,"atom"),bond:fe(t,"bond"),polyhedron:fe(t,"polyhedron")}}function fe(t,e){return rt(Ye(t.materialPreset),e)}function rt(t,e){const n=tn(t,e);return{effects:t.effects??[],id:t.id,label:t.label,lighting:t.lighting,material:n}}function tn(t,e){var o,r;const n=e?(r=(o=t.overrides)==null?void 0:o[e])==null?void 0:r.material:void 0;return n?{props:{...t.material.props,...n.props},type:n.type}:t.material}const P={atomMesh:10,bondMesh:11,unitCellFrame:12,polyhedronSurface:20,polyhedronEdge:21,atomSelectionRing:40};let j;function st({materialRef:t,opacity:e=Ee,position:n,radius:o,ringRef:r,scale:s=ve}){const a=x.useMemo(()=>nn(),[]);if(!a)return null;const i=Math.max(.01,o*xt);return h.jsx("group",{ref:r,position:n,scale:s,children:h.jsx("sprite",{raycast:on,renderOrder:P.atomSelectionRing,scale:[i,i,1],children:h.jsx("spriteMaterial",{ref:t,map:a,depthWrite:!1,opacity:e,transparent:!0})})})}function nn(){if(j!==void 0)return j;if(typeof document>"u")return j=null,j;const t=512,e=document.createElement("canvas");e.width=t,e.height=t;const n=e.getContext("2d");if(!n)return j=null,j;const o=t/2,r=206;n.clearRect(0,0,t,t),n.lineCap="round",n.lineJoin="round",n.beginPath(),n.arc(o,o,r,0,Math.PI*2),n.strokeStyle="rgba(15, 23, 42, 0.5)",n.lineWidth=60,n.stroke(),n.beginPath(),n.arc(o,o,r,0,Math.PI*2),n.strokeStyle="rgba(255, 255, 255, 0.98)",n.lineWidth=14,n.stroke(),n.beginPath(),n.arc(o,o,r,0,Math.PI*2),n.strokeStyle="rgba(15, 23, 42, 0.34)",n.lineWidth=4,n.stroke();const s=new jt(e);return s.colorSpace=Dt,s.minFilter=Te,s.magFilter=Te,j=s,j}function on(){}function je({atoms:t,colorScheme:e,colorOverrides:n,inspectedAtomId:o,interactionLocked:r,materialFamily:s,meshDetail:a,onInspect:i,onPulse:c,onLockedInteractionAttempt:d,opacity:l,pulseAtomId:u,pulseToken:f,radiusModel:p,radiusScale:g}){const m=x.useRef(null),E=H(v=>v.invalidate),y=l<1,w=x.useMemo(()=>t.map(v=>{const _=re(v,e,n);return{atom:v,baseColor:new se(_),color:_}}),[t,n,e]),S=x.useMemo(()=>w.map(v=>({...v,radius:Xe(v.atom,p)*g})),[w,p,g]),b=x.useMemo(()=>{const v=new Map;return S.forEach((_,R)=>{v.set(_.atom.id,R)}),v},[S]),O=De(S,b,o),q=u&&f!==0?{atomId:u}:null,ue=O||!q?null:De(S,b,q.atomId),D=O??ue,k=x.useCallback(()=>{},[]);x.useLayoutEffect(()=>{const v=m.current;if(!v)return;const _=new ie,R=new M,Ie=new M,pt=new we;for(let J=0;J<S.length;J+=1){const Oe=S[J];R.fromArray(Oe.atom.position),Ie.setScalar(Oe.radius),_.compose(R,pt,Ie),v.setMatrixAt(J,_)}v.count=S.length,v.instanceMatrix.needsUpdate=!0,v.computeBoundingSphere(),E()},[S,E]),x.useLayoutEffect(()=>{const v=m.current;if(v){for(let _=0;_<w.length;_+=1){const R=w[_];v.setColorAt(_,R.baseColor)}v.instanceColor&&(v.instanceColor.needsUpdate=!0),E()}},[w,E]);const W=x.useCallback(v=>{var _;return v.instanceId===void 0?null:((_=S[v.instanceId])==null?void 0:_.atom)??null},[S]),le=x.useCallback(v=>{const _=W(v);_&&(v.stopPropagation(),!r&&(c==null||c(_.id)))},[W,r,c]),K=x.useCallback(v=>{const _=W(v);if(_){if(v.stopPropagation(),r){d==null||d();return}i==null||i(_.id)}},[W,r,i,d]);return S.length===0?null:h.jsxs(h.Fragment,{children:[h.jsxs("instancedMesh",{ref:m,args:[void 0,void 0,S.length],castShadow:!0,onClick:le,onDoubleClick:K,receiveShadow:!0,renderOrder:P.atomMesh,userData:{prettyCrystalComponent:"atom-instances",renderAtomIds:S.map(v=>v.atom.id)},children:[h.jsx("sphereGeometry",{args:[1,a.sphereWidthSegments,a.sphereHeightSegments]}),h.jsx(G,{color:"#ffffff",depthWrite:!0,materialFamily:s,opacity:l,transparent:y})]}),D?h.jsx(rn,{baseColor:D.instance.baseColor,index:D.index,inspected:O!==null,meshRef:m,onComplete:k},[D.instance.atom.id,O?"selected":"pulse",O?"":f,D.instance.color].join(":")):null,O?h.jsx(sn,{position:O.instance.atom.position,radius:O.instance.radius},O.instance.atom.id):null]})}function De(t,e,n){if(!n)return null;const o=e.get(n);if(o===void 0)return null;const r=t[o];return r?{index:o,instance:r}:null}function me(t,e,n){t.setColorAt(e,n),t.instanceColor&&(t.instanceColor.needsUpdate=!0)}function rn({baseColor:t,index:e,inspected:n,meshRef:o,onComplete:r}){const s=H(c=>c.invalidate),a=x.useRef(performance.now()),i=x.useRef(!0);return x.useEffect(()=>(a.current=performance.now(),i.current=!0,s(),()=>{const c=o.current;c&&(me(c,e,t),s())}),[t,e,n,s,o]),ot(()=>{if(!i.current)return;const c=o.current;if(!c)return;const d=performance.now()-a.current,l=n?yt:vt,f=Math.min(1,d/(n?Je:wt)),p=n?Qe(f):Et(f),g=t.clone().lerp(St,l*p);if(me(c,e,g),f>=1){n||(me(c,e,t),r()),i.current=!1;return}s()}),null}function sn({position:t,radius:e}){const n=H(c=>c.invalidate),o=x.useRef(null),r=x.useRef(null),s=x.useRef(performance.now()),[a,i]=x.useState(!0);return x.useEffect(()=>{s.current=performance.now(),i(!0),n()},[n]),ot(()=>{if(!a)return;const c=o.current,d=r.current;if(!c||!d)return;const l=Math.min(1,(performance.now()-s.current)/Je),u=Qe(l),f=de+(ve-de)*u;if(c.scale.setScalar(f),d.opacity=Ee*u,l>=1){i(!1);return}n()}),h.jsx(st,{materialRef:r,opacity:0,position:t,radius:e,ringRef:o,scale:de})}const an="#dfe2e6",$=Math.PI*2,Fe=.001;function cn({atoms:t,colorScheme:e,colorOverrides:n,inspectedAtomId:o,interactionLocked:r,materialFamily:s,meshDetail:a,onInspect:i,onPulse:c,onLockedInteractionAttempt:d,opacity:l,radiusModel:u,radiusScale:f}){const p=l<1,g=x.useMemo(()=>t.map(y=>({atom:y,radius:Xe(y,u)*f,sectors:ln(y,e,n)})),[t,n,e,u,f]),m=x.useCallback(y=>w=>{w.stopPropagation(),!r&&(c==null||c(y.id))},[r,c]),E=x.useCallback(y=>w=>{if(w.stopPropagation(),r){d==null||d();return}i==null||i(y.id)},[r,i,d]);return g.length===0?null:h.jsx(h.Fragment,{children:g.map(({atom:y,radius:w,sectors:S})=>h.jsxs("group",{position:y.position,children:[S.map((b,O)=>h.jsx(un,{color:b.color,depthWrite:!0,materialFamily:s,meshDetail:a,onClick:m(y),onDoubleClick:E(y),opacity:l,phiLength:b.phiLength,phiStart:b.phiStart,radius:w,transparent:p},O)),o===y.id?h.jsx(st,{opacity:Ee,position:[0,0,0],radius:w,scale:ve}):null]},y.id))})}function un({color:t,depthWrite:e,materialFamily:n,meshDetail:o,onClick:r,onDoubleClick:s,opacity:a,phiLength:i,phiStart:c,radius:d,transparent:l}){const f=i>=$-1e-6?[]:[Ue(c),Ue(c+i)];return h.jsxs(h.Fragment,{children:[h.jsxs("mesh",{castShadow:!0,onClick:r,onDoubleClick:s,receiveShadow:!0,renderOrder:P.atomMesh,children:[h.jsx("sphereGeometry",{args:[d,Math.max(3,Math.ceil(o.sphereWidthSegments*i/$)),o.sphereHeightSegments,c,i]}),h.jsx(G,{color:t,depthWrite:e,materialFamily:n,opacity:a,transparent:l})]}),f.map((p,g)=>h.jsxs("mesh",{onClick:r,onDoubleClick:s,renderOrder:P.atomMesh,rotation:[0,p,0],children:[h.jsx("circleGeometry",{args:[d,o.sphereHeightSegments,-Math.PI/2,Math.PI]}),h.jsx(G,{color:t,depthWrite:e,materialFamily:n,opacity:a,side:ae,transparent:l})]},g))]})}function Ue(t){return Math.PI-t}function ln(t,e,n){const o=bt(t),r=[];let s=0;for(const a of o){const i=Math.min(1,Math.max(0,a.occupancy));if(i<Fe)continue;const c=i*$;r.push({color:_t(a.element,e,n),phiLength:c,phiStart:s}),s+=c}return s<$-Fe*$&&r.push({color:an,phiLength:$-s,phiStart:s}),r}const Y=[[0,0,0],[1,0,0],[0,1,0],[0,0,1],[1,1,0],[1,0,1],[0,1,1],[1,1,1]],dn=[[0,1],[0,2],[0,3],[1,4],[1,5],[2,4],[2,6],[3,5],[3,6],[4,7],[5,7],[6,7]],F=1e-9,X=1e-6;function it(t){return t!==null&&(t.h!==0||t.k!==0||t.l!==0)}function fn(t,e){if(!it(e)||t.length!==3)return null;const n=Y.map(d=>e.h*d[0]+e.k*d[1]+e.l*d[2]),o=Math.min(...n),r=Math.max(...n);if(r-o<F)return null;const s=Math.min(100,Math.max(0,e.offsetPercent))/100,a=o+(r-o)*s,i=[];for(const[d,l]of dn){const u=n[d],f=n[l];if((u-a)*(f-a)>F||Math.abs(f-u)<F){Math.abs(u-a)<F&&he(i,Y[d]),Math.abs(f-a)<F&&he(i,Y[l]);continue}const p=(a-u)/(f-u);if(p<-F||p>1+F)continue;const g=Y[d],m=Y[l];he(i,[g[0]+(m[0]-g[0])*p,g[1]+(m[1]-g[1])*p,g[2]+(m[2]-g[2])*p])}if(i.length<3)return null;const c=i.map(d=>hn(d,t));return pn(c)}function mn(t){const e=t.length-2,n=new Float32Array(e*9);for(let o=0;o<e;o+=1){const r=t[0],s=t[o+1],a=t[o+2];n.set([r.x,r.y,r.z,s.x,s.y,s.z,a.x,a.y,a.z],o*9)}return n}function hn(t,e){const n=new M;for(let o=0;o<3;o+=1)n.x+=t[o]*e[o][0],n.y+=t[o]*e[o][1],n.z+=t[o]*e[o][2];return n}function he(t,e){for(const n of t)if(Math.abs(n[0]-e[0])<X&&Math.abs(n[1]-e[1])<X&&Math.abs(n[2]-e[2])<X)return;t.push(e)}function pn(t){const e=t.reduce((a,i)=>a.add(i),new M).divideScalar(t.length),n=t[0].clone().sub(e);if(n.lengthSq()<X)return null;const o=n.normalize();let r=null;for(let a=1;a<t.length;a+=1){const i=t[a].clone().sub(e).cross(o);if(i.lengthSq()>X){r=i.normalize();break}}if(!r)return null;const s=r.clone().cross(o).normalize();return t.map(a=>{const i=a.clone().sub(e);return{angle:Math.atan2(i.dot(s),i.dot(o)),point:a}}).sort((a,i)=>a.angle-i.angle).map(a=>a.point)}function gn({cellVectors:t,plane:e}){const n=(e==null?void 0:e.color)??Mt,o=Math.min(100,Math.max(0,(e==null?void 0:e.opacityPercent)??At))/100,r=x.useMemo(()=>{if(!it(e))return null;const s=fn(t,e);if(!s)return null;const a=new ce;return a.setAttribute("position",new et(mn(s),3)),a.computeVertexNormals(),{outlinePoints:s,surface:a}},[t,e]);return r?h.jsxs(h.Fragment,{children:[h.jsx("mesh",{geometry:r.surface,renderOrder:P.polyhedronSurface,children:h.jsx("meshBasicMaterial",{color:n,depthWrite:!1,opacity:o,side:ae,transparent:!0})}),h.jsx(xn,{color:n,points:r.outlinePoints})]}):null}function xn({color:t,points:e}){const n=x.useMemo(()=>{const o=new ce,r=new Float32Array(e.length*3);return e.forEach((s,a)=>{r.set([s.x,s.y,s.z],a*3)}),o.setAttribute("position",new et(r,3)),o},[e]);return h.jsx("lineLoop",{geometry:n,renderOrder:P.polyhedronSurface,children:h.jsx("lineBasicMaterial",{color:t,transparent:!0,opacity:.9})})}const Sn=1.7,yn=.28,vn=.045,En=.13,wn=.32,ze=12,bn=new M(0,1,0);function _n({atoms:t,materialFamily:e,property:n,scalePercent:o}){const r=x.useMemo(()=>{var c;let s=0;const a=[];for(const d of t){const l=(c=d.siteVectors)==null?void 0:c[n];if(!l)continue;const u=new M(...l),f=u.length();f<=1e-9||(s=Math.max(s,f),a.push({atom:d,magnitude:f,vector:u}))}if(s<=0)return[];const i=Sn*o/100/s;return a.map(({atom:d,magnitude:l,vector:u})=>({key:d.id,length:Math.max(yn,l*i),position:d.position,quaternion:new we().setFromUnitVectors(bn,u.clone().normalize())}))},[t,n,o]);return r.length===0?null:h.jsx(h.Fragment,{children:r.map(s=>h.jsx(Mn,{arrow:s,materialFamily:e},s.key))})}function Mn({arrow:t,materialFamily:e}){const n=t.length*wn,o=t.length-n,r=t.length*vn,s=t.length*En;return h.jsxs("group",{position:t.position,quaternion:t.quaternion,children:[h.jsxs("mesh",{castShadow:!0,position:[0,-t.length/2+o/2,0],children:[h.jsx("cylinderGeometry",{args:[r,r,o,ze]}),h.jsx(G,{color:Re,depthWrite:!0,materialFamily:e,opacity:1,transparent:!1})]}),h.jsxs("mesh",{castShadow:!0,position:[0,t.length/2-n/2,0],renderOrder:P.atomMesh,children:[h.jsx("coneGeometry",{args:[s,n,ze]}),h.jsx(G,{color:Re,depthWrite:!0,materialFamily:e,opacity:1,transparent:!1})]})]})}function An({endColor:t,length:e,radialSegments:n,radius:o,startColor:r}){const s=Math.max(3,Math.floor(n)),a=e/2,i=[],c=[],d=[],l=[],u=new se(r),f=new se(t),p=[{color:u,y:-a},{color:u,y:0},{color:f,y:0},{color:f,y:a}];for(const E of p)for(let y=0;y<=s;y+=1){const w=y/s*Math.PI*2,S=Math.sin(w),b=Math.cos(w);i.push(o*S,E.y,o*b),c.push(S,0,b),d.push(E.color.r,E.color.g,E.color.b)}const g=s+1;Ne(l,0,1,g,s),Ne(l,2,3,g,s);const m=new ce;return m.setAttribute("position",new U(i,3)),m.setAttribute("normal",new U(c,3)),m.setAttribute("color",new U(d,3)),m.setIndex(l),m}function Ne(t,e,n,o,r){const s=e*o,a=n*o;for(let i=0;i<r;i+=1){const c=s+i,d=a+i,l=a+i+1,u=s+i+1;t.push(c,u,d,d,u,l)}}function Me(t,e){const n=[];for(const s of t.hullAtomIndices){const a=e[s];if(!a)return null;n.push(...a.position)}const o=[];for(const s of t.faces){if(s.length!==3||new Set(s).size!==3||s.some(a=>!Number.isInteger(a)||a<0||a>=t.hullAtomIndices.length))return null;o.push(...s)}if(o.length===0)return null;const r=new ce;return r.setAttribute("position",new U(n,3)),r.setIndex(o),r.computeVertexNormals(),r}function Cn({bondRenderItems:t,colorMode:e,materialFamily:n,meshDetail:o,opacity:r,thicknessScale:s}){var g;const a=x.useRef(null),i=x.useRef(null),c=x.useRef(null),d=H(m=>m.invalidate),l=x.useMemo(()=>In({bondRenderItems:t,colorMode:e,radialSegments:o.bondRadialSegments,radius:Ct*s}),[t,e,o.bondRadialSegments,s]);if(x.useLayoutEffect(()=>{const m=a.current;if(!m||!l){i.current=null,c.current=null;return}i.current===m&&c.current===l.key||(On(m,l),i.current=m,c.current=l.key,m.computeBoundingBox(),m.computeBoundingSphere(),d())},[l,d]),!l)return null;const u=r<1,f=l.mode==="bicolor",p=((g=l.items[0])==null?void 0:g.startColor)??Ze;return h.jsx("batchedMesh",{ref:a,args:[l.itemCount,l.maxVertexCount,l.maxIndexCount],castShadow:!0,receiveShadow:!0,renderOrder:P.bondMesh,userData:{displayBondIndices:l.items.map(m=>m.bondIndex),prettyCrystalComponent:"bond-instances"},children:h.jsx(G,{color:f?void 0:p,depthWrite:!u,materialFamily:n,opacity:r,transparent:u,vertexColors:f})},l.key)}function In({bondRenderItems:t,colorMode:e,radialSegments:n,radius:o}){var d;const r=Math.max(3,Math.floor(n)),s=t;if(s.length===0||o<=0)return null;if(e==="bicolor"){const l=s.length*Pn(r),u=s.length*Tn(r);return{itemCount:s.length,items:s,key:Ge({colorMode:e,items:s,radialSegments:r,radius:o}),maxIndexCount:u,maxVertexCount:l,mode:e,radialSegments:r,radius:o}}const a=ct(o,r),i=a.getAttribute("position").count,c=((d=a.getIndex())==null?void 0:d.count)??i;return a.dispose(),{itemCount:s.length,items:s,key:Ge({colorMode:e,items:s,radialSegments:r,radius:o}),maxIndexCount:c,maxVertexCount:i,mode:e,radialSegments:r,radius:o}}function On(t,e){const n=new ie,o=e.mode==="unicolor"?ct(e.radius,e.radialSegments):null,r=o?t.addGeometry(at(o)):null;for(const s of e.items){const a=r??Rn(t,s,e),i=t.addInstance(a),c=e.mode==="unicolor"?new M(1,s.length,1):new M(1,1,1);n.compose(s.center,s.quaternion,c),t.setMatrixAt(i,n)}o==null||o.dispose()}function Rn(t,e,n){const o=at(An({endColor:e.endColor,length:e.length,radialSegments:n.radialSegments,radius:n.radius,startColor:e.startColor})),r=t.addGeometry(o);return o.dispose(),r}function at(t){return t.computeBoundingBox(),t.computeBoundingSphere(),t}function ct(t,e){return new Ft(t,t,1,e)}function Pn(t){return 4*(t+1)}function Tn(t){return 12*t}function Ge({colorMode:t,items:e,radialSegments:n,radius:o}){let r=He(`${t}:${n}:${o}`);for(const s of e)r=He([r,s.startAtomIndex,s.endAtomIndex,s.length,s.center.toArray().join(","),s.quaternion.toArray().join(","),s.startColor,s.endColor].join(":"));return`bonds:${e.length}:${r.toString(36)}`}function He(t){let e=2166136261;for(let n=0;n<t.length;n+=1)e^=t.charCodeAt(n),e=Math.imul(e,16777619);return e>>>0}const Bn=new M(0,1,0);function Ln({atoms:t,bondColor:e,bonds:n,colorMode:o,colorScheme:r,colorOverrides:s}){const a=[];for(const[i,c]of n.entries()){const d=t[c.startAtomIndex],l=t[c.endAtomIndex];if(!d||!l)continue;const u=new M(...d.position),f=new M(...l.position),p=f.clone().sub(u),g=p.length();g<=0||a.push({bondIndex:i,center:u.clone().add(f).multiplyScalar(.5),endAtomIndex:c.endAtomIndex,endColor:o==="bicolor"?re(l,r,s):e,length:g,quaternion:new we().setFromUnitVectors(Bn,p.clone().normalize()),startAtomIndex:c.startAtomIndex,startColor:o==="bicolor"?re(d,r,s):e})}return a}oe.line={worldUnits:{value:1},linewidth:{value:1},resolution:{value:new zt(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}};ne.line={uniforms:tt.merge([oe.common,oe.fog,oe.line]),vertexShader:`
		#include <common>
		#include <color_pars_vertex>
		#include <fog_pars_vertex>
		#include <logdepthbuf_pars_vertex>
		#include <clipping_planes_pars_vertex>

		uniform float linewidth;
		uniform vec2 resolution;

		attribute vec3 instanceStart;
		attribute vec3 instanceEnd;

		attribute vec3 instanceColorStart;
		attribute vec3 instanceColorEnd;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#ifdef USE_DASH

			uniform float dashScale;
			attribute float instanceDistanceStart;
			attribute float instanceDistanceEnd;
			varying float vLineDistance;

		#endif

		void trimSegment( const in vec4 start, inout vec4 end ) {

			// trim end segment so it terminates between the camera plane and the near plane

			// conservative estimate of the near plane
			float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
			float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
			float nearEstimate = - 0.5 * b / a;

			float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

			end.xyz = mix( start.xyz, end.xyz, alpha );

		}

		void main() {

			#ifdef USE_COLOR

				vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

			#endif

			#ifdef USE_DASH

				vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
				vUv = uv;

			#endif

			float aspect = resolution.x / resolution.y;

			// camera space
			vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
			vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

			#ifdef WORLD_UNITS

				worldStart = start.xyz;
				worldEnd = end.xyz;

			#else

				vUv = uv;

			#endif

			// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
			// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
			// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
			// perhaps there is a more elegant solution -- WestLangley

			bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

			if ( perspective ) {

				if ( start.z < 0.0 && end.z >= 0.0 ) {

					trimSegment( start, end );

				} else if ( end.z < 0.0 && start.z >= 0.0 ) {

					trimSegment( end, start );

				}

			}

			// clip space
			vec4 clipStart = projectionMatrix * start;
			vec4 clipEnd = projectionMatrix * end;

			// ndc space
			vec3 ndcStart = clipStart.xyz / clipStart.w;
			vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

			// direction
			vec2 dir = ndcEnd.xy - ndcStart.xy;

			// account for clip-space aspect ratio
			dir.x *= aspect;
			dir = normalize( dir );

			#ifdef WORLD_UNITS

				vec3 worldDir = normalize( end.xyz - start.xyz );
				vec3 tmpFwd = normalize( mix( start.xyz, end.xyz, 0.5 ) );
				vec3 worldUp = normalize( cross( worldDir, tmpFwd ) );
				vec3 worldFwd = cross( worldDir, worldUp );
				worldPos = position.y < 0.5 ? start: end;

				// height offset
				float hw = linewidth * 0.5;
				worldPos.xyz += position.x < 0.0 ? hw * worldUp : - hw * worldUp;

				// don't extend the line if we're rendering dashes because we
				// won't be rendering the endcaps
				#ifndef USE_DASH

					// cap extension
					worldPos.xyz += position.y < 0.5 ? - hw * worldDir : hw * worldDir;

					// add width to the box
					worldPos.xyz += worldFwd * hw;

					// endcaps
					if ( position.y > 1.0 || position.y < 0.0 ) {

						worldPos.xyz -= worldFwd * 2.0 * hw;

					}

				#endif

				// project the worldpos
				vec4 clip = projectionMatrix * worldPos;

				// shift the depth of the projected points so the line
				// segments overlap neatly
				vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
				clip.z = clipPose.z * clip.w;

			#else

				vec2 offset = vec2( dir.y, - dir.x );
				// undo aspect ratio adjustment
				dir.x /= aspect;
				offset.x /= aspect;

				// sign flip
				if ( position.x < 0.0 ) offset *= - 1.0;

				// endcaps
				if ( position.y < 0.0 ) {

					offset += - dir;

				} else if ( position.y > 1.0 ) {

					offset += dir;

				}

				// adjust for linewidth
				offset *= linewidth;

				// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
				offset /= resolution.y;

				// select end
				vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

				// back to clip space
				offset *= clip.w;

				clip.xy += offset;

			#endif

			gl_Position = clip;

			vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

			#include <logdepthbuf_vertex>
			#include <clipping_planes_vertex>
			#include <fog_vertex>

		}
		`,fragmentShader:`
		uniform vec3 diffuse;
		uniform float opacity;
		uniform float linewidth;

		#ifdef USE_DASH

			uniform float dashOffset;
			uniform float dashSize;
			uniform float gapSize;

		#endif

		varying float vLineDistance;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#include <common>
		#include <color_pars_fragment>
		#include <fog_pars_fragment>
		#include <logdepthbuf_pars_fragment>
		#include <clipping_planes_pars_fragment>

		vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

			float mua;
			float mub;

			vec3 p13 = p1 - p3;
			vec3 p43 = p4 - p3;

			vec3 p21 = p2 - p1;

			float d1343 = dot( p13, p43 );
			float d4321 = dot( p43, p21 );
			float d1321 = dot( p13, p21 );
			float d4343 = dot( p43, p43 );
			float d2121 = dot( p21, p21 );

			float denom = d2121 * d4343 - d4321 * d4321;

			float numer = d1343 * d4321 - d1321 * d4343;

			mua = numer / denom;
			mua = clamp( mua, 0.0, 1.0 );
			mub = ( d1343 + d4321 * ( mua ) ) / d4343;
			mub = clamp( mub, 0.0, 1.0 );

			return vec2( mua, mub );

		}

		void main() {

			#include <clipping_planes_fragment>

			#ifdef USE_DASH

				if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

				if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

			#endif

			float alpha = opacity;

			#ifdef WORLD_UNITS

				// Find the closest points on the view ray and the line segment
				vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
				vec3 lineDir = worldEnd - worldStart;
				vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

				vec3 p1 = worldStart + lineDir * params.x;
				vec3 p2 = rayEnd * params.y;
				vec3 delta = p1 - p2;
				float len = length( delta );
				float norm = len / linewidth;

				#ifndef USE_DASH

					#ifdef USE_ALPHA_TO_COVERAGE

						float dnorm = fwidth( norm );
						alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

					#else

						if ( norm > 0.5 ) {

							discard;

						}

					#endif

				#endif

			#else

				#ifdef USE_ALPHA_TO_COVERAGE

					// artifacts appear on some hardware if a derivative is taken within a conditional
					float a = vUv.x;
					float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
					float len2 = a * a + b * b;
					float dlen = fwidth( len2 );

					if ( abs( vUv.y ) > 1.0 ) {

						alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

					}

				#else

					if ( abs( vUv.y ) > 1.0 ) {

						float a = vUv.x;
						float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
						float len2 = a * a + b * b;

						if ( len2 > 1.0 ) discard;

					}

				#endif

			#endif

			vec4 diffuseColor = vec4( diffuse, alpha );

			#include <logdepthbuf_fragment>
			#include <color_fragment>

			gl_FragColor = vec4( diffuseColor.rgb, alpha );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>
			#include <fog_fragment>
			#include <premultiplied_alpha_fragment>

		}
		`};class Ae extends Ut{constructor(e){super({type:"LineMaterial",uniforms:tt.clone(ne.line.uniforms),vertexShader:ne.line.vertexShader,fragmentShader:ne.line.fragmentShader,clipping:!0}),this.isLineMaterial=!0,this.setValues(e)}get color(){return this.uniforms.diffuse.value}set color(e){this.uniforms.diffuse.value=e}get worldUnits(){return"WORLD_UNITS"in this.defines}set worldUnits(e){e===!0?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}get linewidth(){return this.uniforms.linewidth.value}set linewidth(e){this.uniforms.linewidth&&(this.uniforms.linewidth.value=e)}get dashed(){return"USE_DASH"in this.defines}set dashed(e){e===!0!==this.dashed&&(this.needsUpdate=!0),e===!0?this.defines.USE_DASH="":delete this.defines.USE_DASH}get dashScale(){return this.uniforms.dashScale.value}set dashScale(e){this.uniforms.dashScale.value=e}get dashSize(){return this.uniforms.dashSize.value}set dashSize(e){this.uniforms.dashSize.value=e}get dashOffset(){return this.uniforms.dashOffset.value}set dashOffset(e){this.uniforms.dashOffset.value=e}get gapSize(){return this.uniforms.gapSize.value}set gapSize(e){this.uniforms.gapSize.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}get resolution(){return this.uniforms.resolution.value}set resolution(e){this.uniforms.resolution.value.copy(e)}get alphaToCoverage(){return"USE_ALPHA_TO_COVERAGE"in this.defines}set alphaToCoverage(e){this.defines&&(e===!0!==this.alphaToCoverage&&(this.needsUpdate=!0),e===!0?this.defines.USE_ALPHA_TO_COVERAGE="":delete this.defines.USE_ALPHA_TO_COVERAGE)}}const We=new be,Z=new M;class Ce extends Nt{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry";const e=[-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],n=[-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],o=[0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5];this.setIndex(o),this.setAttribute("position",new U(e,3)),this.setAttribute("uv",new U(n,2))}applyMatrix4(e){const n=this.attributes.instanceStart,o=this.attributes.instanceEnd;return n!==void 0&&(n.applyMatrix4(e),o.applyMatrix4(e),n.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));const o=new Se(n,6,1);return this.setAttribute("instanceStart",new V(o,3,0)),this.setAttribute("instanceEnd",new V(o,3,3)),this.instanceCount=this.attributes.instanceStart.count,this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));const o=new Se(n,6,1);return this.setAttribute("instanceColorStart",new V(o,3,0)),this.setAttribute("instanceColorEnd",new V(o,3,3)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new Gt(e.geometry)),this}fromLineSegments(e){const n=e.geometry;return this.setPositions(n.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new be);const e=this.attributes.instanceStart,n=this.attributes.instanceEnd;e!==void 0&&n!==void 0&&(this.boundingBox.setFromBufferAttribute(e),We.setFromBufferAttribute(n),this.boundingBox.union(We))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new nt),this.boundingBox===null&&this.computeBoundingBox();const e=this.attributes.instanceStart,n=this.attributes.instanceEnd;if(e!==void 0&&n!==void 0){const o=this.boundingSphere.center;this.boundingBox.getCenter(o);let r=0;for(let s=0,a=e.count;s<a;s++)Z.fromBufferAttribute(e,s),r=Math.max(r,o.distanceToSquared(Z)),Z.fromBufferAttribute(n,s),r=Math.max(r,o.distanceToSquared(Z));this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}const pe=new Q,Ve=new M,$e=new M,A=new Q,C=new Q,T=new Q,ge=new M,xe=new ie,I=new Wt,qe=new M,ee=new be,te=new nt,B=new Q;let L,z;function ke(t,e,n){return B.set(0,0,-e,1).applyMatrix4(t.projectionMatrix),B.multiplyScalar(1/B.w),B.x=z/n.width,B.y=z/n.height,B.applyMatrix4(t.projectionMatrixInverse),B.multiplyScalar(1/B.w),Math.abs(Math.max(B.x,B.y))}function jn(t,e){const n=t.matrixWorld,o=t.geometry,r=o.attributes.instanceStart,s=o.attributes.instanceEnd,a=Math.min(o.instanceCount,r.count);for(let i=0,c=a;i<c;i++){I.start.fromBufferAttribute(r,i),I.end.fromBufferAttribute(s,i),I.applyMatrix4(n);const d=new M,l=new M;L.distanceSqToSegment(I.start,I.end,l,d),l.distanceTo(d)<z*.5&&e.push({point:l,pointOnLine:d,distance:L.origin.distanceTo(l),object:t,face:null,faceIndex:i,uv:null,uv1:null})}}function Dn(t,e,n){const o=e.projectionMatrix,s=t.material.resolution,a=t.matrixWorld,i=t.geometry,c=i.attributes.instanceStart,d=i.attributes.instanceEnd,l=Math.min(i.instanceCount,c.count),u=-e.near;L.at(1,T),T.w=1,T.applyMatrix4(e.matrixWorldInverse),T.applyMatrix4(o),T.multiplyScalar(1/T.w),T.x*=s.x/2,T.y*=s.y/2,T.z=0,ge.copy(T),xe.multiplyMatrices(e.matrixWorldInverse,a);for(let f=0,p=l;f<p;f++){if(A.fromBufferAttribute(c,f),C.fromBufferAttribute(d,f),A.w=1,C.w=1,A.applyMatrix4(xe),C.applyMatrix4(xe),A.z>u&&C.z>u)continue;if(A.z>u){const S=A.z-C.z,b=(A.z-u)/S;A.lerp(C,b)}else if(C.z>u){const S=C.z-A.z,b=(C.z-u)/S;C.lerp(A,b)}A.applyMatrix4(o),C.applyMatrix4(o),A.multiplyScalar(1/A.w),C.multiplyScalar(1/C.w),A.x*=s.x/2,A.y*=s.y/2,C.x*=s.x/2,C.y*=s.y/2,I.start.copy(A),I.start.z=0,I.end.copy(C),I.end.z=0;const m=I.closestPointToPointParameter(ge,!0);I.at(m,qe);const E=Vt.lerp(A.z,C.z,m),y=E>=-1&&E<=1,w=ge.distanceTo(qe)<z*.5;if(y&&w){I.start.fromBufferAttribute(c,f),I.end.fromBufferAttribute(d,f),I.start.applyMatrix4(a),I.end.applyMatrix4(a);const S=new M,b=new M;L.distanceSqToSegment(I.start,I.end,b,S),n.push({point:b,pointOnLine:S,distance:L.origin.distanceTo(b),object:t,face:null,faceIndex:f,uv:null,uv1:null})}}}class ut extends Ht{constructor(e=new Ce,n=new Ae({color:Math.random()*16777215})){super(e,n),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){const e=this.geometry,n=e.attributes.instanceStart,o=e.attributes.instanceEnd,r=new Float32Array(2*n.count);for(let a=0,i=0,c=n.count;a<c;a++,i+=2)Ve.fromBufferAttribute(n,a),$e.fromBufferAttribute(o,a),r[i]=i===0?0:r[i-1],r[i+1]=r[i]+Ve.distanceTo($e);const s=new Se(r,2,1);return e.setAttribute("instanceDistanceStart",new V(s,1,0)),e.setAttribute("instanceDistanceEnd",new V(s,1,1)),this}raycast(e,n){const o=this.material.worldUnits,r=e.camera;r===null&&!o&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');const s=e.params.Line2!==void 0&&e.params.Line2.threshold||0;L=e.ray;const a=this.matrixWorld,i=this.geometry,c=this.material;z=c.linewidth+s,i.boundingSphere===null&&i.computeBoundingSphere(),te.copy(i.boundingSphere).applyMatrix4(a);let d;if(o)d=z*.5;else{const u=Math.max(r.near,te.distanceToPoint(L.origin));d=ke(r,u,c.resolution)}if(te.radius+=d,L.intersectsSphere(te)===!1)return;i.boundingBox===null&&i.computeBoundingBox(),ee.copy(i.boundingBox).applyMatrix4(a);let l;if(o)l=z*.5;else{const u=Math.max(r.near,ee.distanceToPoint(L.origin));l=ke(r,u,c.resolution)}ee.expandByScalar(l),L.intersectsBox(ee)!==!1&&(o?jn(this,n):Dn(this,r,n))}onBeforeRender(e){const n=this.material.uniforms;n&&n.resolution&&(e.getViewport(pe),this.material.uniforms.resolution.value.set(pe.z,pe.w))}}const Fn=.08,Un=.03;function zn({color:t=Ot,fog:e,lineWidthScale:n,lineStyle:o,opacity:r,vectors:s}){const a=x.useMemo(()=>{const i=new Ce;i.setPositions(It(s));const c=Rt*n,d=new Ae({alphaToCoverage:!0,color:t,dashed:o==="dashed",depthTest:!0,depthWrite:!1,dashSize:Fn,fog:e,gapSize:Un,linewidth:c,opacity:r,transparent:!0,worldUnits:!1}),l=new ut(i,d);return l.renderOrder=P.unitCellFrame,l.userData.prettyCrystalComponent="unit-cell-frame",o==="dashed"&&(d.defines.USE_DASH="",d.needsUpdate=!0,l.computeLineDistances()),l},[t,e,o,n,r,s]);return x.useEffect(()=>()=>{a.geometry.dispose(),a.material.dispose()},[a]),h.jsx("primitive",{object:a})}const Nn=1;function Gn({atoms:t,polyhedra:e}){const n=[],o=[],r=new Map,s=[];return e.forEach((a,i)=>{if(Hn(a,t)){s.push(i),a.faces.forEach((c,d)=>{const l=lt(a,t,c);if(!l)return;const u=[...c],f={centerAtomIndex:a.centerAtomIndex,faceIndex:d,faceVertexIndices:u,polyhedronIndex:i},p=r.get(l);if(p){p.owners.push(f);return}const g=u.map(y=>a.hullAtomIndices[y]),m=g.map(y=>t[y].id),E={atomIndices:g,owners:[f],renderAtomIds:m,surfaceIndex:o.length};r.set(l,E),o.push(E)});for(const[c,d]of Wn(a,t)){const l=a.hullAtomIndices[c],u=a.hullAtomIndices[d],f=t[l],p=t[u];n.push({centerAtomIndex:a.centerAtomIndex,edgeIndex:n.length,endAtomIndex:u,endPosition:Ke(p.position),endRenderAtomId:p.id,polyhedronIndex:i,startAtomIndex:l,startPosition:Ke(f.position),startRenderAtomId:f.id})}}}),{edges:n,surfaces:o,validPolyhedronIndices:s}}function Hn(t,e){return!e[t.centerAtomIndex]||t.faces.length===0||t.hullAtomIndices.some(n=>!e[n])?!1:t.faces.every(n=>lt(t,e,n)!==null)}function lt(t,e,n){if(n.length!==3||new Set(n).size!==3||n.some(r=>!Number.isInteger(r)||r<0||r>=t.hullAtomIndices.length))return null;const o=[];for(const r of n){const s=t.hullAtomIndices[r],a=s===void 0?void 0:e[s];if(!a||a.position.some(i=>!Number.isFinite(i)))return null;o.push(a.position.map(i=>String(i)).join(","))}return o.sort().join("|")}function Wn(t,e){const n=Me(t,e);if(!n)return[];try{const o=n.getIndex(),r=n.getAttribute("position"),s=(o==null?void 0:o.count)??r.count,a=Math.cos(Math.PI/180*Nn),i=new $t,c=new M,d=new Map,l=[];for(let u=0;u<s;u+=3){const f=[0,1,2].map(g=>o?o.getX(u+g):u+g);i.a.fromBufferAttribute(r,f[0]),i.b.fromBufferAttribute(r,f[1]),i.c.fromBufferAttribute(r,f[2]),i.getNormal(c);const p=[i.a,i.b,i.c].map(Vn);if(!(p[0]===p[1]||p[1]===p[2]||p[2]===p[0]))for(let g=0;g<3;g+=1){const m=(g+1)%3,E=f[g],y=f[m],w=`${p[g]}_${p[m]}`,S=`${p[m]}_${p[g]}`,b=d.get(S);b?(c.dot(b.normal)<=a&&l.push([E,y]),d.set(S,null)):d.has(w)||d.set(w,{endVertexIndex:y,normal:c.clone(),startVertexIndex:E})}}for(const u of d.values())u&&l.push([u.startVertexIndex,u.endVertexIndex]);return l}finally{n.dispose()}}function Vn(t){return[t.x,t.y,t.z].map(n=>Math.round(n*1e4)).join(",")}function Ke(t){const e=new U(t,3);return[e.getX(0),e.getY(0),e.getZ(0)]}const $n=.5,qn="#cfd6e2",kn=1,Kn=.6,Yn=Kn/$n;function Xn({atoms:t,colorScheme:e,colorOverrides:n,lineWidthScale:o,materialFamily:r,opacity:s,polyhedra:a}){const i=x.useRef(null),c=x.useRef(null),d=x.useRef(null),l=H(f=>f.invalidate),u=x.useMemo(()=>Jn({atoms:t,colorScheme:e,colorOverrides:n,polyhedra:a}),[t,e,n,a]);return x.useLayoutEffect(()=>{const f=i.current;if(!f||!u){c.current=null,d.current=null;return}c.current===f&&d.current===u.key||(to(f,u),c.current=f,d.current=u.key,f.computeBoundingBox(),f.computeBoundingSphere(),l())},[u,l]),x.useEffect(()=>()=>{ft(u)},[u]),u?h.jsxs("group",{children:[u.itemCount>0?h.jsx("batchedMesh",{ref:i,args:[u.itemCount,u.maxVertexCount,u.maxIndexCount],receiveShadow:!0,renderOrder:P.polyhedronSurface,userData:{prettyCrystalComponent:"polyhedron-surfaces"},children:h.jsx(G,{color:"#ffffff",depthWrite:!0,materialFamily:r,opacity:s,polygonOffset:!0,polygonOffsetFactor:3,side:ae,transparent:!0})},u.key):null,u.edgeItems.map(f=>h.jsx(oo,{atoms:t,edges:f.edges,lineWidthScale:o,opacity:s,polyhedron:f.polyhedron,polyhedronIndex:f.polyhedronIndex},f.polyhedronIndex))]}):null}const Qn=x.memo(Xn);function Jn({atoms:t,colorScheme:e,colorOverrides:n,polyhedra:o}){const r=[],s=[],a=new Set;let i=0,c=0;const d=Gn({atoms:t,polyhedra:o}),l=new Map;for(const u of d.edges){const f=l.get(u.polyhedronIndex)??[];f.push(u),l.set(u.polyhedronIndex,f)}return o.forEach((u,f)=>{var S;const p=t[u.centerAtomIndex];if(!p||!Zn(u,t))return;r.push({edges:l.get(f)??[],polyhedron:u,polyhedronIndex:f});const g=eo(u,t,a);if(!g)return;const m=ro(Me(g,t));if(!m)return;const E=m.getAttribute("position"),y=(E==null?void 0:E.count)??0,w=((S=m.getIndex())==null?void 0:S.count)??y;if(y<=0||w<=0){m.dispose();return}s.push({color:new se(re(p,e,n)),geometry:m,polyhedron:u,polyhedronIndex:f}),i+=w,c+=y}),s.length===0&&r.length===0?null:{edgeItems:r,itemCount:s.length,items:s,key:so(s),maxIndexCount:i,maxVertexCount:c}}function Zn(t,e){return t.faces.length===0||t.hullAtomIndices.some(n=>!e[n])?!1:t.faces.every(n=>dt(t,e,n)!==null)}function eo(t,e,n){const o=new Set,r=[];for(const s of t.hullAtomIndices)if(!e[s])return null;for(const s of t.faces){const a=dt(t,e,s);if(!a)return null;n.has(a)||o.has(a)||(o.add(a),r.push(s))}for(const s of o)n.add(s);return r.length===t.faces.length?t:{...t,faces:r}}function dt(t,e,n){if(n.length!==3||new Set(n).size!==3||n.some(r=>!Number.isInteger(r)||r<0||r>=t.hullAtomIndices.length))return null;const o=[];for(const r of n){const s=t.hullAtomIndices[r];if(s===void 0)return null;const a=e[s];if(!a||a.position.some(i=>!Number.isFinite(i)))return null;o.push(a.position.map(i=>String(i)).join(","))}return o.sort().join("|")}function ft(t){for(const e of(t==null?void 0:t.items)??[])e.geometry.dispose()}function to(t,e){const n=new ie;t.perObjectFrustumCulled=!0,t.sortObjects=!0;for(const o of e.items){const r=t.addGeometry(o.geometry),s=t.addInstance(r);t.setMatrixAt(s,n),t.setColorAt(s,o.color)}ft(e)}function no({atoms:t,edges:e,lineWidthScale:n,opacity:o,polyhedron:r,polyhedronIndex:s}){const a=t[r.centerAtomIndex],i=x.useMemo(()=>a?Me(r,t):null,[t,a,r]),c=x.useMemo(()=>{if(!i)return null;const d=new qt(i),l=d.getAttribute("position");if(l.count!==e.length*2)throw d.dispose(),new Error("Polyhedron edge provenance does not match the rendered geometry.");const u=new Ce;u.setPositions(Array.from(l.array)),d.dispose();const f=new Ae({alphaToCoverage:!0,color:qn,depthWrite:!1,fog:!1,linewidth:kn*n,opacity:Math.min(1,o*Yn),side:ae,transparent:!0,worldUnits:!1}),p=new ut(u,f);return p.renderOrder=P.polyhedronEdge,p.userData.polyhedronEdgeIndices=e.map(g=>g.edgeIndex),p.userData.polyhedronIndex=s,p.userData.prettyCrystalComponent="polyhedron-edge-lines",p},[e,i,n,o,s]);return x.useEffect(()=>()=>{i==null||i.dispose()},[i]),x.useEffect(()=>()=>{c==null||c.geometry.dispose(),c==null||c.material.dispose()},[c]),c?h.jsx("primitive",{object:c}):null}const oo=x.memo(no);function ro(t){return t?(t.computeBoundingBox(),t.computeBoundingSphere(),t):null}function so(t){let e=ye("polyhedra");for(const n of t)e=N(e,n.polyhedronIndex),e=ye(n.color.getHexString(),e),e=io(n.geometry,"position",e),e=ao(n.geometry,e);return`polyhedra:${t.length}:${e.toString(36)}`}function io(t,e,n){const o=t.getAttribute(e);let r=N(n,o.itemSize);r=N(r,o.count);for(let s=0;s<o.array.length;s+=1)r=N(r,o.array[s]??0);return r}function ao(t,e){const n=t.getIndex();if(!n)return N(e,0);let o=N(e,n.count);for(let r=0;r<n.array.length;r+=1)o=N(o,n.array[r]??0);return o}function ye(t,e=2166136261){let n=e;for(let o=0;o<t.length;o+=1)n^=t.charCodeAt(o),n=Math.imul(n,16777619);return n>>>0}function N(t,e){const n=Number.isFinite(e)?e:0;return ye(String(n),t)}const _o=Ze,co=24,uo="#fafafa",lo=.4,fo={bondRadialSegments:16,sphereHeightSegments:24,sphereWidthSegments:32},Mo={low:{bondRadialSegments:12,sphereHeightSegments:16,sphereWidthSegments:24},medium:fo,high:{bondRadialSegments:co,sphereHeightSegments:32,sphereWidthSegments:48},xhigh:{bondRadialSegments:32,sphereHeightSegments:48,sphereWidthSegments:72}};function Ao({componentOpacity:t,layout:e,materialFamilies:n,meshDetail:o,scene:r,inspectedAtomId:s,interactionLocked:a,onAtomInspect:i,onAtomPulse:c,onLockedInteractionAttempt:d,polyhedronEdgeLineWidthScale:l=1,pulseAtomId:u,pulseToken:f,showAtoms:p,showUnitCell:g,style:m,unitCellLineStyle:E="solid",unitCellLineWidthScale:y=1}){return h.jsxs(h.Fragment,{children:[h.jsx(mt,{layout:e,style:m}),h.jsx(ht,{componentOpacity:t,groupPosition:e.groupPosition,materialFamilies:n,meshDetail:o,scene:r,inspectedAtomId:s,interactionLocked:a,onAtomInspect:i,onAtomPulse:c,onLockedInteractionAttempt:d,polyhedronEdgeLineWidthScale:l,pulseAtomId:u,pulseToken:f,showAtoms:p,showUnitCell:g,style:m,unitCellLineStyle:E,unitCellLineWidthScale:y})]})}function mt({layout:t,style:e}){const{invalidate:n,scene:o}=H(),r=x.useMemo(()=>e.fogEnabled?mo(t.standardPose.distance,t.span,t.depthCueingBackOffset,t.depthCueingFrontOffset,e.fogAmount,e.fogStart):null,[t.span,t.depthCueingBackOffset,t.depthCueingFrontOffset,t.standardPose.distance,e.fogAmount,e.fogEnabled,e.fogStart]);return x.useLayoutEffect(()=>{const s=o.fog;return o.fog=r,n(),()=>{o.fog===r&&(o.fog=s,n())}},[r,n,o]),null}function mo(t,e,n,o,r,s){const a=Number.isFinite(r)?r:0,i=Number.isFinite(s)?s:0,c=Math.min(1,Math.max(0,a/100)),d=Math.min(1,Math.max(0,i/100));if(c<=0)return null;const l=Number.isFinite(e)?Math.max(1,e):1,u=Number.isFinite(n)?Math.max(.01*l,n):.01*l,f=Number.isFinite(o)?Math.min(u,o):0,p=Number.isFinite(t)?Math.max(.01,t):.01,g=l*lo,m=f-g,E=Math.max(m,u-g),y=ho(m,E,d),w=p+y,S=p+u,b=w+(S-w)/c;return new kt(uo,w,b)}function ho(t,e,n){return t+(e-t)*n}function po({componentOpacity:t,groupPosition:e,interactionLocked:n=!1,materialFamilies:o,meshDetail:r,scene:s,inspectedAtomId:a=null,onAtomInspect:i,onAtomPulse:c,onLockedInteractionAttempt:d,polyhedronEdgeLineWidthScale:l=1,pulseAtomId:u=null,pulseToken:f=0,showAtoms:p,showUnitCell:g,style:m,unitCellLineColor:E,unitCellLineStyle:y="solid",unitCellLineWidthScale:w=1}){const S=x.useMemo(()=>Pt(s.atoms,m),[s.atoms,m]),b=Tt(m),O=m.asuHighlight,{asuContextAtoms:q,disorderedAtoms:ue,orderedAtoms:D}=x.useMemo(()=>{const K=O?s.atoms.filter(R=>R.isSymmetryUnique!==!1):s.atoms,v=O?s.atoms.filter(R=>R.isSymmetryUnique===!1):[],_=K.filter(R=>Pe(R));return{asuContextAtoms:v,disorderedAtoms:_,orderedAtoms:_.length===0?K:K.filter(R=>!Pe(R))}},[O,s.atoms]),k=O?Math.min(1,Math.max(0,m.asuGhostOpacity/100)):1,W=x.useMemo(()=>Ln({atoms:s.atoms,bondColor:m.bondColor,bonds:s.bonds,colorMode:m.bondColorMode,colorScheme:b,colorOverrides:S}),[b,S,s.atoms,s.bonds,m.bondColor,m.bondColorMode]),le=x.useCallback(()=>{n||i==null||i(null)},[n,i]);return h.jsx("group",{onPointerMissed:le,children:h.jsxs("group",{position:e,children:[h.jsx(gn,{cellVectors:s.cell.vectors,plane:m.latticePlane}),g?h.jsx(zn,{color:E,fog:m.fogEnabled&&m.fogAffectsUnitCell,lineWidthScale:w,opacity:t.unitCell/100,lineStyle:y,vectors:s.cell.vectors}):null,h.jsx(Qn,{atoms:s.atoms,colorScheme:b,colorOverrides:S,materialFamily:o.polyhedron,opacity:t.polyhedra/100*k,polyhedra:s.polyhedra,lineWidthScale:l}),h.jsx(Cn,{bondRenderItems:W,colorMode:m.bondColorMode,materialFamily:o.bond,meshDetail:r,thicknessScale:m.bondThickness/100,opacity:t.bonds/100*k}),p?h.jsxs(h.Fragment,{children:[h.jsx(je,{atoms:D,colorScheme:b,colorOverrides:S,inspectedAtomId:a,interactionLocked:n,materialFamily:o.atom,meshDetail:r,onInspect:i,onPulse:c,onLockedInteractionAttempt:d,pulseAtomId:u,pulseToken:f,radiusModel:m.atomRadiusModel,radiusScale:m.atomRadius/100,opacity:t.atoms/100}),h.jsx(cn,{atoms:ue,colorScheme:b,colorOverrides:S,inspectedAtomId:a,interactionLocked:n,materialFamily:o.atom,meshDetail:r,onInspect:i,onPulse:c,onLockedInteractionAttempt:d,radiusModel:m.atomRadiusModel,radiusScale:m.atomRadius/100,opacity:t.atoms/100}),m.vectorGlyphProperty?h.jsx(_n,{atoms:s.atoms,materialFamily:o.atom,property:m.vectorGlyphProperty,scalePercent:m.vectorGlyphScale}):null,q.length>0?h.jsx(je,{atoms:q,colorScheme:b,colorOverrides:S,inspectedAtomId:a,interactionLocked:n,materialFamily:o.atom,meshDetail:r,onInspect:i,onPulse:c,onLockedInteractionAttempt:d,pulseAtomId:u,pulseToken:f,radiusModel:m.atomRadiusModel,radiusScale:m.atomRadius/100,opacity:t.atoms/100*k}):null]}):null]})})}const ht=x.memo(po),Co={alpha:!0,antialias:!0,preserveDrawingBuffer:!0};function Io({cameraPose:t,componentOpacity:e,exportFramePlan:n,layout:o,materialFamilies:r,meshDetail:s,polyhedronEdgeLineWidthScale:a=1,scene:i,showAtoms:c,showUnitCell:d,style:l,unitCellLineColor:u,unitCellLineStyle:f="solid",unitCellLineWidthScale:p=1}){const{camera:g}=H();return x.useLayoutEffect(()=>{Bt(g,t,o.standardPose.distance,o.span)},[g,t,o.span,o.standardPose.distance]),x.useLayoutEffect(()=>{g instanceof Kt&&Lt(g,n)},[g,n]),h.jsxs(h.Fragment,{children:[h.jsx(mt,{layout:o,style:l}),h.jsx(ht,{componentOpacity:e,groupPosition:o.groupPosition,materialFamilies:r,meshDetail:s,polyhedronEdgeLineWidthScale:a,scene:i,showAtoms:c,showUnitCell:d,style:l,unitCellLineColor:u,unitCellLineStyle:f,unitCellLineWidthScale:p})]})}export{_o as B,Co as D,Mo as E,ut as L,Eo as M,Ao as P,uo as S,bo as a,co as b,Io as c,qn as d,Kn as e,$n as f,fo as g,P as h,mo as i,Ce as j,Ae as k,Yt as l,vo as m,Gn as n,Me as p,wo as r,An as t};
