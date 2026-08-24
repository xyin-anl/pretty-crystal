const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/AmbientOcclusionEffect-KeEnrnMf.js","assets/index-AxEtRNPZ.js","assets/index-CXKjCYlq.css","assets/three.module-ke5eWUd-.js","assets/react-three-fiber.esm-DkvamF7b.js"])))=>i.map(i=>d[i]);
import{r as x,F as h,_ as pt,m as Ye,a5 as ve,a6 as Ee,a7 as gt,a8 as re,a1 as Ke,a9 as xt,aa as St,ab as yt,ac as Xe,ad as vt,ae as Qe,af as de,ag as Et,ah as wt,ai as bt,aj as _t,ak as Mt,al as Oe,am as Je,I as Ct,K as At,an as It,J as Ot,Q as Rt,P as Pt,ao as Re,ap as Tt,aq as Bt}from"./index-AxEtRNPZ.js";import{n as Lt,o as jt,p as Pe,d as se,q as ie,V as M,Q as we,D as ae,g as ce,r as Ze,F,s as Dt,e as Ut,t as ne,u as et,b as Ft,v as oe,w as zt,x as Se,y as V,z as Nt,A as be,E as tt,h as Gt,G as Q,H as Ht,c as Wt,J as Vt,K as $t,O as qt}from"./three.module-ke5eWUd-.js";import{S as G}from"./StructureMaterial-pCREYRcv.js";import{u as H,a as nt}from"./react-three-fiber.esm-DkvamF7b.js";const Te=["performance","low","medium","high","ultra"];let _e=null,Be=null;function kt(){return Be??(Be=pt(()=>import("./AmbientOcclusionEffect-KeEnrnMf.js"),__vite__mapDeps([0,1,2,3,4])).then(t=>(_e=t,t))),Be}function go(t){return t.length>0&&!_e}function xo({effects:t}){const e=t.find(r=>r.type==="ambientOcclusion"),[n,o]=x.useState(_e);return x.useEffect(()=>{if(!e||n)return;let r=!1;return kt().then(s=>{r||o(s)}),()=>{r=!0}},[e,n]),!e||!n?null:h.jsx(n.AmbientOcclusionEffect,{ambientOcclusion:Yt(e.props,"ambientOcclusion.props")})}function Yt(t,e){const n={};for(const[o,r]of Object.entries(t))if(r!=null)switch(o){case"aoRadius":case"aoSamples":case"denoiseRadius":case"denoiseSamples":case"distanceFalloff":case"intensity":n[o]=Kt(r,`${e}.${o}`);break;case"depthAwareUpsampling":case"halfRes":case"screenSpaceRadius":n[o]=Xt(r,`${e}.${o}`);break;case"color":n.color=Qt(r,`${e}.${o}`);break;case"quality":n.quality=Jt(r,`${e}.${o}`);break;default:throw new Error(`${e}.${o} is not supported.`)}return n}function Kt(t,e){if(typeof t!="number"||!Number.isFinite(t))throw new Error(`${e} must be a finite number.`);return t}function Xt(t,e){if(typeof t!="boolean")throw new Error(`${e} must be a boolean.`);return t}function Qt(t,e){if(typeof t!="string"||t.trim()==="")throw new Error(`${e} must be a non-empty string.`);return t}function Jt(t,e){if(typeof t!="string"||!Te.includes(t))throw new Error(`${e} must be one of ${Te.join(", ")}.`);return t}function So(t){return ot(Ye(t.materialPreset))}function yo(t){return{atom:fe(t,"atom"),bond:fe(t,"bond"),polyhedron:fe(t,"polyhedron")}}function fe(t,e){return ot(Ye(t.materialPreset),e)}function ot(t,e){const n=Zt(t,e);return{effects:t.effects??[],id:t.id,label:t.label,lighting:t.lighting,material:n}}function Zt(t,e){var o,r;const n=e?(r=(o=t.overrides)==null?void 0:o[e])==null?void 0:r.material:void 0;return n?{props:{...t.material.props,...n.props},type:n.type}:t.material}const P={atomMesh:10,bondMesh:11,unitCellFrame:12,polyhedronSurface:20,polyhedronEdge:21,atomSelectionRing:40};let j;function rt({materialRef:t,opacity:e=Ee,position:n,radius:o,ringRef:r,scale:s=ve}){const a=x.useMemo(()=>en(),[]);if(!a)return null;const i=Math.max(.01,o*gt);return h.jsx("group",{ref:r,position:n,scale:s,children:h.jsx("sprite",{raycast:tn,renderOrder:P.atomSelectionRing,scale:[i,i,1],children:h.jsx("spriteMaterial",{ref:t,map:a,depthWrite:!1,opacity:e,transparent:!0})})})}function en(){if(j!==void 0)return j;if(typeof document>"u")return j=null,j;const t=512,e=document.createElement("canvas");e.width=t,e.height=t;const n=e.getContext("2d");if(!n)return j=null,j;const o=t/2,r=206;n.clearRect(0,0,t,t),n.lineCap="round",n.lineJoin="round",n.beginPath(),n.arc(o,o,r,0,Math.PI*2),n.strokeStyle="rgba(15, 23, 42, 0.5)",n.lineWidth=60,n.stroke(),n.beginPath(),n.arc(o,o,r,0,Math.PI*2),n.strokeStyle="rgba(255, 255, 255, 0.98)",n.lineWidth=14,n.stroke(),n.beginPath(),n.arc(o,o,r,0,Math.PI*2),n.strokeStyle="rgba(15, 23, 42, 0.34)",n.lineWidth=4,n.stroke();const s=new Lt(e);return s.colorSpace=jt,s.minFilter=Pe,s.magFilter=Pe,j=s,j}function tn(){}function Le({atoms:t,colorScheme:e,colorOverrides:n,inspectedAtomId:o,interactionLocked:r,materialFamily:s,meshDetail:a,onInspect:i,onPulse:u,onLockedInteractionAttempt:d,opacity:l,pulseAtomId:c,pulseToken:f,radiusModel:p,radiusScale:g}){const m=x.useRef(null),E=H(v=>v.invalidate),y=l<1,b=x.useMemo(()=>t.map(v=>{const _=re(v,e,n);return{atom:v,baseColor:new se(_),color:_}}),[t,n,e]),S=x.useMemo(()=>b.map(v=>({...v,radius:Ke(v.atom,p)*g})),[b,p,g]),w=x.useMemo(()=>{const v=new Map;return S.forEach((_,R)=>{v.set(_.atom.id,R)}),v},[S]),O=je(S,w,o),q=c&&f!==0?{atomId:c}:null,le=O||!q?null:je(S,w,q.atomId),D=O??le,k=x.useCallback(()=>{},[]);x.useLayoutEffect(()=>{const v=m.current;if(!v)return;const _=new ie,R=new M,Ae=new M,mt=new we;for(let J=0;J<S.length;J+=1){const Ie=S[J];R.fromArray(Ie.atom.position),Ae.setScalar(Ie.radius),_.compose(R,mt,Ae),v.setMatrixAt(J,_)}v.count=S.length,v.instanceMatrix.needsUpdate=!0,v.computeBoundingSphere(),E()},[S,E]),x.useLayoutEffect(()=>{const v=m.current;if(v){for(let _=0;_<b.length;_+=1){const R=b[_];v.setColorAt(_,R.baseColor)}v.instanceColor&&(v.instanceColor.needsUpdate=!0),E()}},[b,E]);const W=x.useCallback(v=>{var _;return v.instanceId===void 0?null:((_=S[v.instanceId])==null?void 0:_.atom)??null},[S]),ue=x.useCallback(v=>{const _=W(v);_&&(v.stopPropagation(),!r&&(u==null||u(_.id)))},[W,r,u]),Y=x.useCallback(v=>{const _=W(v);if(_){if(v.stopPropagation(),r){d==null||d();return}i==null||i(_.id)}},[W,r,i,d]);return S.length===0?null:h.jsxs(h.Fragment,{children:[h.jsxs("instancedMesh",{ref:m,args:[void 0,void 0,S.length],castShadow:!0,onClick:ue,onDoubleClick:Y,receiveShadow:!0,renderOrder:P.atomMesh,userData:{prettyCrystalComponent:"atom-instances",renderAtomIds:S.map(v=>v.atom.id)},children:[h.jsx("sphereGeometry",{args:[1,a.sphereWidthSegments,a.sphereHeightSegments]}),h.jsx(G,{color:"#ffffff",depthWrite:!0,materialFamily:s,opacity:l,transparent:y})]}),D?h.jsx(nn,{baseColor:D.instance.baseColor,index:D.index,inspected:O!==null,meshRef:m,onComplete:k},[D.instance.atom.id,O?"selected":"pulse",O?"":f,D.instance.color].join(":")):null,O?h.jsx(on,{position:O.instance.atom.position,radius:O.instance.radius},O.instance.atom.id):null]})}function je(t,e,n){if(!n)return null;const o=e.get(n);if(o===void 0)return null;const r=t[o];return r?{index:o,instance:r}:null}function he(t,e,n){t.setColorAt(e,n),t.instanceColor&&(t.instanceColor.needsUpdate=!0)}function nn({baseColor:t,index:e,inspected:n,meshRef:o,onComplete:r}){const s=H(u=>u.invalidate),a=x.useRef(performance.now()),i=x.useRef(!0);return x.useEffect(()=>(a.current=performance.now(),i.current=!0,s(),()=>{const u=o.current;u&&(he(u,e,t),s())}),[t,e,n,s,o]),nt(()=>{if(!i.current)return;const u=o.current;if(!u)return;const d=performance.now()-a.current,l=n?St:yt,f=Math.min(1,d/(n?Qe:Et)),p=n?Xe(f):vt(f),g=t.clone().lerp(xt,l*p);if(he(u,e,g),f>=1){n||(he(u,e,t),r()),i.current=!1;return}s()}),null}function on({position:t,radius:e}){const n=H(u=>u.invalidate),o=x.useRef(null),r=x.useRef(null),s=x.useRef(performance.now()),[a,i]=x.useState(!0);return x.useEffect(()=>{s.current=performance.now(),i(!0),n()},[n]),nt(()=>{if(!a)return;const u=o.current,d=r.current;if(!u||!d)return;const l=Math.min(1,(performance.now()-s.current)/Qe),c=Xe(l),f=de+(ve-de)*c;if(u.scale.setScalar(f),d.opacity=Ee*c,l>=1){i(!1);return}n()}),h.jsx(rt,{materialRef:r,opacity:0,position:t,radius:e,ringRef:o,scale:de})}const rn="#dfe2e6",$=Math.PI*2,De=.001;function sn({atoms:t,colorScheme:e,colorOverrides:n,inspectedAtomId:o,interactionLocked:r,materialFamily:s,meshDetail:a,onInspect:i,onPulse:u,onLockedInteractionAttempt:d,opacity:l,radiusModel:c,radiusScale:f}){const p=l<1,g=x.useMemo(()=>t.map(y=>({atom:y,radius:Ke(y,c)*f,sectors:cn(y,e,n)})),[t,n,e,c,f]),m=x.useCallback(y=>b=>{b.stopPropagation(),!r&&(u==null||u(y.id))},[r,u]),E=x.useCallback(y=>b=>{if(b.stopPropagation(),r){d==null||d();return}i==null||i(y.id)},[r,i,d]);return g.length===0?null:h.jsx(h.Fragment,{children:g.map(({atom:y,radius:b,sectors:S})=>h.jsxs("group",{position:y.position,children:[S.map((w,O)=>h.jsx(an,{color:w.color,depthWrite:!0,materialFamily:s,meshDetail:a,onClick:m(y),onDoubleClick:E(y),opacity:l,phiLength:w.phiLength,phiStart:w.phiStart,radius:b,transparent:p},O)),o===y.id?h.jsx(rt,{opacity:Ee,position:[0,0,0],radius:b,scale:ve}):null]},y.id))})}function an({color:t,depthWrite:e,materialFamily:n,meshDetail:o,onClick:r,onDoubleClick:s,opacity:a,phiLength:i,phiStart:u,radius:d,transparent:l}){const f=i>=$-1e-6?[]:[Ue(u),Ue(u+i)];return h.jsxs(h.Fragment,{children:[h.jsxs("mesh",{castShadow:!0,onClick:r,onDoubleClick:s,receiveShadow:!0,renderOrder:P.atomMesh,children:[h.jsx("sphereGeometry",{args:[d,Math.max(3,Math.ceil(o.sphereWidthSegments*i/$)),o.sphereHeightSegments,u,i]}),h.jsx(G,{color:t,depthWrite:e,materialFamily:n,opacity:a,transparent:l})]}),f.map((p,g)=>h.jsxs("mesh",{onClick:r,onDoubleClick:s,renderOrder:P.atomMesh,rotation:[0,p,0],children:[h.jsx("circleGeometry",{args:[d,o.sphereHeightSegments,-Math.PI/2,Math.PI]}),h.jsx(G,{color:t,depthWrite:e,materialFamily:n,opacity:a,side:ae,transparent:l})]},g))]})}function Ue(t){return Math.PI-t}function cn(t,e,n){const o=wt(t),r=[];let s=0;for(const a of o){const i=Math.min(1,Math.max(0,a.occupancy));if(i<De)continue;const u=i*$;r.push({color:bt(a.element,e,n),phiLength:u,phiStart:s}),s+=u}return s<$-De*$&&r.push({color:rn,phiLength:$-s,phiStart:s}),r}const K=[[0,0,0],[1,0,0],[0,1,0],[0,0,1],[1,1,0],[1,0,1],[0,1,1],[1,1,1]],ln=[[0,1],[0,2],[0,3],[1,4],[1,5],[2,4],[2,6],[3,5],[3,6],[4,7],[5,7],[6,7]],U=1e-9,X=1e-6;function st(t){return t!==null&&(t.h!==0||t.k!==0||t.l!==0)}function un(t,e){if(!st(e)||t.length!==3)return null;const n=K.map(d=>e.h*d[0]+e.k*d[1]+e.l*d[2]),o=Math.min(...n),r=Math.max(...n);if(r-o<U)return null;const s=Math.min(100,Math.max(0,e.offsetPercent))/100,a=o+(r-o)*s,i=[];for(const[d,l]of ln){const c=n[d],f=n[l];if((c-a)*(f-a)>U||Math.abs(f-c)<U){Math.abs(c-a)<U&&me(i,K[d]),Math.abs(f-a)<U&&me(i,K[l]);continue}const p=(a-c)/(f-c);if(p<-U||p>1+U)continue;const g=K[d],m=K[l];me(i,[g[0]+(m[0]-g[0])*p,g[1]+(m[1]-g[1])*p,g[2]+(m[2]-g[2])*p])}if(i.length<3)return null;const u=i.map(d=>fn(d,t));return hn(u)}function dn(t){const e=t.length-2,n=new Float32Array(e*9);for(let o=0;o<e;o+=1){const r=t[0],s=t[o+1],a=t[o+2];n.set([r.x,r.y,r.z,s.x,s.y,s.z,a.x,a.y,a.z],o*9)}return n}function fn(t,e){const n=new M;for(let o=0;o<3;o+=1)n.x+=t[o]*e[o][0],n.y+=t[o]*e[o][1],n.z+=t[o]*e[o][2];return n}function me(t,e){for(const n of t)if(Math.abs(n[0]-e[0])<X&&Math.abs(n[1]-e[1])<X&&Math.abs(n[2]-e[2])<X)return;t.push(e)}function hn(t){const e=t.reduce((a,i)=>a.add(i),new M).divideScalar(t.length),n=t[0].clone().sub(e);if(n.lengthSq()<X)return null;const o=n.normalize();let r=null;for(let a=1;a<t.length;a+=1){const i=t[a].clone().sub(e).cross(o);if(i.lengthSq()>X){r=i.normalize();break}}if(!r)return null;const s=r.clone().cross(o).normalize();return t.map(a=>{const i=a.clone().sub(e);return{angle:Math.atan2(i.dot(s),i.dot(o)),point:a}}).sort((a,i)=>a.angle-i.angle).map(a=>a.point)}function mn({cellVectors:t,plane:e}){const n=(e==null?void 0:e.color)??_t,o=Math.min(100,Math.max(0,(e==null?void 0:e.opacityPercent)??Mt))/100,r=x.useMemo(()=>{if(!st(e))return null;const s=un(t,e);if(!s)return null;const a=new ce;return a.setAttribute("position",new Ze(dn(s),3)),a.computeVertexNormals(),{outlinePoints:s,surface:a}},[t,e]);return r?h.jsxs(h.Fragment,{children:[h.jsx("mesh",{geometry:r.surface,renderOrder:P.polyhedronSurface,children:h.jsx("meshBasicMaterial",{color:n,depthWrite:!1,opacity:o,side:ae,transparent:!0})}),h.jsx(pn,{color:n,points:r.outlinePoints})]}):null}function pn({color:t,points:e}){const n=x.useMemo(()=>{const o=new ce,r=new Float32Array(e.length*3);return e.forEach((s,a)=>{r.set([s.x,s.y,s.z],a*3)}),o.setAttribute("position",new Ze(r,3)),o},[e]);return h.jsx("lineLoop",{geometry:n,renderOrder:P.polyhedronSurface,children:h.jsx("lineBasicMaterial",{color:t,transparent:!0,opacity:.9})})}const gn=1.7,xn=.28,Sn=.045,yn=.13,vn=.32,Fe=12,En=new M(0,1,0);function wn({atoms:t,materialFamily:e,property:n,scalePercent:o}){const r=x.useMemo(()=>{var u;let s=0;const a=[];for(const d of t){const l=(u=d.siteVectors)==null?void 0:u[n];if(!l)continue;const c=new M(...l),f=c.length();f<=1e-9||(s=Math.max(s,f),a.push({atom:d,magnitude:f,vector:c}))}if(s<=0)return[];const i=gn*o/100/s;return a.map(({atom:d,magnitude:l,vector:c})=>({key:d.id,length:Math.max(xn,l*i),position:d.position,quaternion:new we().setFromUnitVectors(En,c.clone().normalize())}))},[t,n,o]);return r.length===0?null:h.jsx(h.Fragment,{children:r.map(s=>h.jsx(bn,{arrow:s,materialFamily:e},s.key))})}function bn({arrow:t,materialFamily:e}){const n=t.length*vn,o=t.length-n,r=t.length*Sn,s=t.length*yn;return h.jsxs("group",{position:t.position,quaternion:t.quaternion,children:[h.jsxs("mesh",{castShadow:!0,position:[0,-t.length/2+o/2,0],children:[h.jsx("cylinderGeometry",{args:[r,r,o,Fe]}),h.jsx(G,{color:Oe,depthWrite:!0,materialFamily:e,opacity:1,transparent:!1})]}),h.jsxs("mesh",{castShadow:!0,position:[0,t.length/2-n/2,0],renderOrder:P.atomMesh,children:[h.jsx("coneGeometry",{args:[s,n,Fe]}),h.jsx(G,{color:Oe,depthWrite:!0,materialFamily:e,opacity:1,transparent:!1})]})]})}function _n({endColor:t,length:e,radialSegments:n,radius:o,startColor:r}){const s=Math.max(3,Math.floor(n)),a=e/2,i=[],u=[],d=[],l=[],c=new se(r),f=new se(t),p=[{color:c,y:-a},{color:c,y:0},{color:f,y:0},{color:f,y:a}];for(const E of p)for(let y=0;y<=s;y+=1){const b=y/s*Math.PI*2,S=Math.sin(b),w=Math.cos(b);i.push(o*S,E.y,o*w),u.push(S,0,w),d.push(E.color.r,E.color.g,E.color.b)}const g=s+1;ze(l,0,1,g,s),ze(l,2,3,g,s);const m=new ce;return m.setAttribute("position",new F(i,3)),m.setAttribute("normal",new F(u,3)),m.setAttribute("color",new F(d,3)),m.setIndex(l),m}function ze(t,e,n,o,r){const s=e*o,a=n*o;for(let i=0;i<r;i+=1){const u=s+i,d=a+i,l=a+i+1,c=s+i+1;t.push(u,c,d,d,c,l)}}function it(t,e){const n=[];for(const s of t.hullAtomIndices){const a=e[s];if(!a)return null;n.push(...a.position)}const o=[];for(const s of t.faces){if(s.length!==3||new Set(s).size!==3||s.some(a=>!Number.isInteger(a)||a<0||a>=t.hullAtomIndices.length))return null;o.push(...s)}if(o.length===0)return null;const r=new ce;return r.setAttribute("position",new F(n,3)),r.setIndex(o),r.computeVertexNormals(),r}function Mn({bondRenderItems:t,colorMode:e,materialFamily:n,meshDetail:o,opacity:r,thicknessScale:s}){var g;const a=x.useRef(null),i=x.useRef(null),u=x.useRef(null),d=H(m=>m.invalidate),l=x.useMemo(()=>Cn({bondRenderItems:t,colorMode:e,radialSegments:o.bondRadialSegments,radius:Ct*s}),[t,e,o.bondRadialSegments,s]);if(x.useLayoutEffect(()=>{const m=a.current;if(!m||!l){i.current=null,u.current=null;return}i.current===m&&u.current===l.key||(An(m,l),i.current=m,u.current=l.key,m.computeBoundingBox(),m.computeBoundingSphere(),d())},[l,d]),!l)return null;const c=r<1,f=l.mode==="bicolor",p=((g=l.items[0])==null?void 0:g.startColor)??Je;return h.jsx("batchedMesh",{ref:a,args:[l.itemCount,l.maxVertexCount,l.maxIndexCount],castShadow:!0,receiveShadow:!0,renderOrder:P.bondMesh,userData:{displayBondIndices:l.items.map(m=>m.bondIndex),prettyCrystalComponent:"bond-instances"},children:h.jsx(G,{color:f?void 0:p,depthWrite:!c,materialFamily:n,opacity:r,transparent:c,vertexColors:f})},l.key)}function Cn({bondRenderItems:t,colorMode:e,radialSegments:n,radius:o}){var d;const r=Math.max(3,Math.floor(n)),s=t;if(s.length===0||o<=0)return null;if(e==="bicolor"){const l=s.length*On(r),c=s.length*Rn(r);return{itemCount:s.length,items:s,key:Ne({colorMode:e,items:s,radialSegments:r,radius:o}),maxIndexCount:c,maxVertexCount:l,mode:e,radialSegments:r,radius:o}}const a=ct(o,r),i=a.getAttribute("position").count,u=((d=a.getIndex())==null?void 0:d.count)??i;return a.dispose(),{itemCount:s.length,items:s,key:Ne({colorMode:e,items:s,radialSegments:r,radius:o}),maxIndexCount:u,maxVertexCount:i,mode:e,radialSegments:r,radius:o}}function An(t,e){const n=new ie,o=e.mode==="unicolor"?ct(e.radius,e.radialSegments):null,r=o?t.addGeometry(at(o)):null;for(const s of e.items){const a=r??In(t,s,e),i=t.addInstance(a),u=e.mode==="unicolor"?new M(1,s.length,1):new M(1,1,1);n.compose(s.center,s.quaternion,u),t.setMatrixAt(i,n)}o==null||o.dispose()}function In(t,e,n){const o=at(_n({endColor:e.endColor,length:e.length,radialSegments:n.radialSegments,radius:n.radius,startColor:e.startColor})),r=t.addGeometry(o);return o.dispose(),r}function at(t){return t.computeBoundingBox(),t.computeBoundingSphere(),t}function ct(t,e){return new Dt(t,t,1,e)}function On(t){return 4*(t+1)}function Rn(t){return 12*t}function Ne({colorMode:t,items:e,radialSegments:n,radius:o}){let r=Ge(`${t}:${n}:${o}`);for(const s of e)r=Ge([r,s.startAtomIndex,s.endAtomIndex,s.length,s.center.toArray().join(","),s.quaternion.toArray().join(","),s.startColor,s.endColor].join(":"));return`bonds:${e.length}:${r.toString(36)}`}function Ge(t){let e=2166136261;for(let n=0;n<t.length;n+=1)e^=t.charCodeAt(n),e=Math.imul(e,16777619);return e>>>0}const Pn=new M(0,1,0);function Tn({atoms:t,bondColor:e,bonds:n,colorMode:o,colorScheme:r,colorOverrides:s}){const a=[];for(const[i,u]of n.entries()){const d=t[u.startAtomIndex],l=t[u.endAtomIndex];if(!d||!l)continue;const c=new M(...d.position),f=new M(...l.position),p=f.clone().sub(c),g=p.length();g<=0||a.push({bondIndex:i,center:c.clone().add(f).multiplyScalar(.5),endAtomIndex:u.endAtomIndex,endColor:o==="bicolor"?re(l,r,s):e,length:g,quaternion:new we().setFromUnitVectors(Pn,p.clone().normalize()),startAtomIndex:u.startAtomIndex,startColor:o==="bicolor"?re(d,r,s):e})}return a}oe.line={worldUnits:{value:1},linewidth:{value:1},resolution:{value:new Ft(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}};ne.line={uniforms:et.merge([oe.common,oe.fog,oe.line]),vertexShader:`
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
		`};class Me extends Ut{constructor(e){super({type:"LineMaterial",uniforms:et.clone(ne.line.uniforms),vertexShader:ne.line.vertexShader,fragmentShader:ne.line.fragmentShader,clipping:!0}),this.isLineMaterial=!0,this.setValues(e)}get color(){return this.uniforms.diffuse.value}set color(e){this.uniforms.diffuse.value=e}get worldUnits(){return"WORLD_UNITS"in this.defines}set worldUnits(e){e===!0?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}get linewidth(){return this.uniforms.linewidth.value}set linewidth(e){this.uniforms.linewidth&&(this.uniforms.linewidth.value=e)}get dashed(){return"USE_DASH"in this.defines}set dashed(e){e===!0!==this.dashed&&(this.needsUpdate=!0),e===!0?this.defines.USE_DASH="":delete this.defines.USE_DASH}get dashScale(){return this.uniforms.dashScale.value}set dashScale(e){this.uniforms.dashScale.value=e}get dashSize(){return this.uniforms.dashSize.value}set dashSize(e){this.uniforms.dashSize.value=e}get dashOffset(){return this.uniforms.dashOffset.value}set dashOffset(e){this.uniforms.dashOffset.value=e}get gapSize(){return this.uniforms.gapSize.value}set gapSize(e){this.uniforms.gapSize.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}get resolution(){return this.uniforms.resolution.value}set resolution(e){this.uniforms.resolution.value.copy(e)}get alphaToCoverage(){return"USE_ALPHA_TO_COVERAGE"in this.defines}set alphaToCoverage(e){this.defines&&(e===!0!==this.alphaToCoverage&&(this.needsUpdate=!0),e===!0?this.defines.USE_ALPHA_TO_COVERAGE="":delete this.defines.USE_ALPHA_TO_COVERAGE)}}const He=new be,Z=new M;class Ce extends zt{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry";const e=[-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],n=[-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],o=[0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5];this.setIndex(o),this.setAttribute("position",new F(e,3)),this.setAttribute("uv",new F(n,2))}applyMatrix4(e){const n=this.attributes.instanceStart,o=this.attributes.instanceEnd;return n!==void 0&&(n.applyMatrix4(e),o.applyMatrix4(e),n.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));const o=new Se(n,6,1);return this.setAttribute("instanceStart",new V(o,3,0)),this.setAttribute("instanceEnd",new V(o,3,3)),this.instanceCount=this.attributes.instanceStart.count,this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));const o=new Se(n,6,1);return this.setAttribute("instanceColorStart",new V(o,3,0)),this.setAttribute("instanceColorEnd",new V(o,3,3)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new Nt(e.geometry)),this}fromLineSegments(e){const n=e.geometry;return this.setPositions(n.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new be);const e=this.attributes.instanceStart,n=this.attributes.instanceEnd;e!==void 0&&n!==void 0&&(this.boundingBox.setFromBufferAttribute(e),He.setFromBufferAttribute(n),this.boundingBox.union(He))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new tt),this.boundingBox===null&&this.computeBoundingBox();const e=this.attributes.instanceStart,n=this.attributes.instanceEnd;if(e!==void 0&&n!==void 0){const o=this.boundingSphere.center;this.boundingBox.getCenter(o);let r=0;for(let s=0,a=e.count;s<a;s++)Z.fromBufferAttribute(e,s),r=Math.max(r,o.distanceToSquared(Z)),Z.fromBufferAttribute(n,s),r=Math.max(r,o.distanceToSquared(Z));this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}const pe=new Q,We=new M,Ve=new M,C=new Q,A=new Q,T=new Q,ge=new M,xe=new ie,I=new Ht,$e=new M,ee=new be,te=new tt,B=new Q;let L,z;function qe(t,e,n){return B.set(0,0,-e,1).applyMatrix4(t.projectionMatrix),B.multiplyScalar(1/B.w),B.x=z/n.width,B.y=z/n.height,B.applyMatrix4(t.projectionMatrixInverse),B.multiplyScalar(1/B.w),Math.abs(Math.max(B.x,B.y))}function Bn(t,e){const n=t.matrixWorld,o=t.geometry,r=o.attributes.instanceStart,s=o.attributes.instanceEnd,a=Math.min(o.instanceCount,r.count);for(let i=0,u=a;i<u;i++){I.start.fromBufferAttribute(r,i),I.end.fromBufferAttribute(s,i),I.applyMatrix4(n);const d=new M,l=new M;L.distanceSqToSegment(I.start,I.end,l,d),l.distanceTo(d)<z*.5&&e.push({point:l,pointOnLine:d,distance:L.origin.distanceTo(l),object:t,face:null,faceIndex:i,uv:null,uv1:null})}}function Ln(t,e,n){const o=e.projectionMatrix,s=t.material.resolution,a=t.matrixWorld,i=t.geometry,u=i.attributes.instanceStart,d=i.attributes.instanceEnd,l=Math.min(i.instanceCount,u.count),c=-e.near;L.at(1,T),T.w=1,T.applyMatrix4(e.matrixWorldInverse),T.applyMatrix4(o),T.multiplyScalar(1/T.w),T.x*=s.x/2,T.y*=s.y/2,T.z=0,ge.copy(T),xe.multiplyMatrices(e.matrixWorldInverse,a);for(let f=0,p=l;f<p;f++){if(C.fromBufferAttribute(u,f),A.fromBufferAttribute(d,f),C.w=1,A.w=1,C.applyMatrix4(xe),A.applyMatrix4(xe),C.z>c&&A.z>c)continue;if(C.z>c){const S=C.z-A.z,w=(C.z-c)/S;C.lerp(A,w)}else if(A.z>c){const S=A.z-C.z,w=(A.z-c)/S;A.lerp(C,w)}C.applyMatrix4(o),A.applyMatrix4(o),C.multiplyScalar(1/C.w),A.multiplyScalar(1/A.w),C.x*=s.x/2,C.y*=s.y/2,A.x*=s.x/2,A.y*=s.y/2,I.start.copy(C),I.start.z=0,I.end.copy(A),I.end.z=0;const m=I.closestPointToPointParameter(ge,!0);I.at(m,$e);const E=Wt.lerp(C.z,A.z,m),y=E>=-1&&E<=1,b=ge.distanceTo($e)<z*.5;if(y&&b){I.start.fromBufferAttribute(u,f),I.end.fromBufferAttribute(d,f),I.start.applyMatrix4(a),I.end.applyMatrix4(a);const S=new M,w=new M;L.distanceSqToSegment(I.start,I.end,w,S),n.push({point:w,pointOnLine:S,distance:L.origin.distanceTo(w),object:t,face:null,faceIndex:f,uv:null,uv1:null})}}}class lt extends Gt{constructor(e=new Ce,n=new Me({color:Math.random()*16777215})){super(e,n),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){const e=this.geometry,n=e.attributes.instanceStart,o=e.attributes.instanceEnd,r=new Float32Array(2*n.count);for(let a=0,i=0,u=n.count;a<u;a++,i+=2)We.fromBufferAttribute(n,a),Ve.fromBufferAttribute(o,a),r[i]=i===0?0:r[i-1],r[i+1]=r[i]+We.distanceTo(Ve);const s=new Se(r,2,1);return e.setAttribute("instanceDistanceStart",new V(s,1,0)),e.setAttribute("instanceDistanceEnd",new V(s,1,1)),this}raycast(e,n){const o=this.material.worldUnits,r=e.camera;r===null&&!o&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');const s=e.params.Line2!==void 0&&e.params.Line2.threshold||0;L=e.ray;const a=this.matrixWorld,i=this.geometry,u=this.material;z=u.linewidth+s,i.boundingSphere===null&&i.computeBoundingSphere(),te.copy(i.boundingSphere).applyMatrix4(a);let d;if(o)d=z*.5;else{const c=Math.max(r.near,te.distanceToPoint(L.origin));d=qe(r,c,u.resolution)}if(te.radius+=d,L.intersectsSphere(te)===!1)return;i.boundingBox===null&&i.computeBoundingBox(),ee.copy(i.boundingBox).applyMatrix4(a);let l;if(o)l=z*.5;else{const c=Math.max(r.near,ee.distanceToPoint(L.origin));l=qe(r,c,u.resolution)}ee.expandByScalar(l),L.intersectsBox(ee)!==!1&&(o?Bn(this,n):Ln(this,r,n))}onBeforeRender(e){const n=this.material.uniforms;n&&n.resolution&&(e.getViewport(pe),this.material.uniforms.resolution.value.set(pe.z,pe.w))}}const jn=.08,Dn=.03;function Un({color:t=It,fog:e,lineWidthScale:n,lineStyle:o,opacity:r,vectors:s}){const a=x.useMemo(()=>{const i=new Ce;i.setPositions(At(s));const u=Ot*n,d=new Me({alphaToCoverage:!0,color:t,dashed:o==="dashed",depthTest:!0,depthWrite:!1,dashSize:jn,fog:e,gapSize:Dn,linewidth:u,opacity:r,transparent:!0,worldUnits:!1}),l=new lt(i,d);return l.renderOrder=P.unitCellFrame,l.userData.prettyCrystalComponent="unit-cell-frame",o==="dashed"&&(d.defines.USE_DASH="",d.needsUpdate=!0,l.computeLineDistances()),l},[t,e,o,n,r,s]);return x.useEffect(()=>()=>{a.geometry.dispose(),a.material.dispose()},[a]),h.jsx("primitive",{object:a})}const Fn=1;function zn({atoms:t,polyhedra:e}){const n=[],o=[],r=new Map,s=[];return e.forEach((a,i)=>{if(Nn(a,t)){s.push(i),a.faces.forEach((u,d)=>{const l=ut(a,t,u);if(!l)return;const c=[...u],f={centerAtomIndex:a.centerAtomIndex,faceIndex:d,faceVertexIndices:c,polyhedronIndex:i},p=r.get(l);if(p){p.owners.push(f);return}const g=c.map(y=>a.hullAtomIndices[y]),m=g.map(y=>t[y].id),E={atomIndices:g,owners:[f],renderAtomIds:m,surfaceIndex:o.length};r.set(l,E),o.push(E)});for(const[u,d]of Gn(a,t)){const l=a.hullAtomIndices[u],c=a.hullAtomIndices[d],f=t[l],p=t[c];n.push({centerAtomIndex:a.centerAtomIndex,edgeIndex:n.length,endAtomIndex:c,endPosition:ke(p.position),endRenderAtomId:p.id,polyhedronIndex:i,startAtomIndex:l,startPosition:ke(f.position),startRenderAtomId:f.id})}}}),{edges:n,surfaces:o,validPolyhedronIndices:s}}function Nn(t,e){return!e[t.centerAtomIndex]||t.faces.length===0||t.hullAtomIndices.some(n=>!e[n])?!1:t.faces.every(n=>ut(t,e,n)!==null)}function ut(t,e,n){if(n.length!==3||new Set(n).size!==3||n.some(r=>!Number.isInteger(r)||r<0||r>=t.hullAtomIndices.length))return null;const o=[];for(const r of n){const s=t.hullAtomIndices[r],a=s===void 0?void 0:e[s];if(!a||a.position.some(i=>!Number.isFinite(i)))return null;o.push(a.position.map(i=>String(i)).join(","))}return o.sort().join("|")}function Gn(t,e){const n=it(t,e);if(!n)return[];try{const o=n.getIndex(),r=n.getAttribute("position"),s=(o==null?void 0:o.count)??r.count,a=Math.cos(Math.PI/180*Fn),i=new Vt,u=new M,d=new Map,l=[];for(let c=0;c<s;c+=3){const f=[0,1,2].map(g=>o?o.getX(c+g):c+g);i.a.fromBufferAttribute(r,f[0]),i.b.fromBufferAttribute(r,f[1]),i.c.fromBufferAttribute(r,f[2]),i.getNormal(u);const p=[i.a,i.b,i.c].map(Hn);if(!(p[0]===p[1]||p[1]===p[2]||p[2]===p[0]))for(let g=0;g<3;g+=1){const m=(g+1)%3,E=f[g],y=f[m],b=`${p[g]}_${p[m]}`,S=`${p[m]}_${p[g]}`,w=d.get(S);w?(u.dot(w.normal)<=a&&l.push([E,y]),d.set(S,null)):d.has(b)||d.set(b,{endVertexIndex:y,normal:u.clone(),startVertexIndex:E})}}for(const c of d.values())c&&l.push([c.startVertexIndex,c.endVertexIndex]);return l}finally{n.dispose()}}function Hn(t){return[t.x,t.y,t.z].map(n=>Math.round(n*1e4)).join(",")}function ke(t){const e=new F(t,3);return[e.getX(0),e.getY(0),e.getZ(0)]}const Wn=.5,Vn="#cfd6e2",$n=1,qn=.6,kn=qn/Wn;function Yn({atoms:t,colorScheme:e,colorOverrides:n,lineWidthScale:o,materialFamily:r,opacity:s,polyhedra:a}){const i=x.useRef(null),u=x.useRef(null),d=x.useRef(null),l=H(f=>f.invalidate),c=x.useMemo(()=>Xn({atoms:t,colorScheme:e,colorOverrides:n,polyhedra:a}),[t,e,n,a]);return x.useLayoutEffect(()=>{const f=i.current;if(!f||!c){u.current=null,d.current=null;return}u.current===f&&d.current===c.key||(Qn(f,c),u.current=f,d.current=c.key,f.computeBoundingBox(),f.computeBoundingSphere(),l())},[c,l]),x.useEffect(()=>()=>{dt(c)},[c]),c?h.jsxs("group",{children:[c.itemCount>0?h.jsx("batchedMesh",{ref:i,args:[c.itemCount,c.maxVertexCount,c.maxIndexCount],receiveShadow:!0,renderOrder:P.polyhedronSurface,userData:{prettyCrystalComponent:"polyhedron-surfaces"},children:h.jsx(G,{color:"#ffffff",depthWrite:!0,materialFamily:r,opacity:s,polygonOffset:!0,polygonOffsetFactor:3,side:ae,transparent:!0})},c.key):null,c.edgeItems.map(f=>h.jsx(Zn,{atoms:t,edges:f.edges,lineWidthScale:o,opacity:s,polyhedron:f.polyhedron,polyhedronIndex:f.polyhedronIndex},f.polyhedronIndex))]}):null}const Kn=x.memo(Yn);function Xn({atoms:t,colorScheme:e,colorOverrides:n,polyhedra:o}){const r=[],s=[];let a=0,i=0;const u=zn({atoms:t,polyhedra:o}),d=new Map;for(const c of u.edges){const f=d.get(c.polyhedronIndex)??[];f.push(c),d.set(c.polyhedronIndex,f)}const l=new Map;for(const c of u.surfaces){const f=c.owners[0],p=l.get(f.polyhedronIndex)??[];p.push(f.faceVertexIndices),l.set(f.polyhedronIndex,p)}return u.validPolyhedronIndices.forEach(c=>{var w;const f=o[c],p=t[f.centerAtomIndex];if(!p)return;r.push({edges:d.get(c)??[],polyhedron:f,polyhedronIndex:c});const g=l.get(c)??[];if(g.length===0)return;const m={...f,faces:g},E=eo(it(m,t));if(!E)return;const y=E.getAttribute("position"),b=(y==null?void 0:y.count)??0,S=((w=E.getIndex())==null?void 0:w.count)??b;if(b<=0||S<=0){E.dispose();return}s.push({color:new se(re(p,e,n)),geometry:E,polyhedron:f,polyhedronIndex:c}),a+=S,i+=b}),s.length===0&&r.length===0?null:{edgeItems:r,itemCount:s.length,items:s,key:to(s),maxIndexCount:a,maxVertexCount:i}}function dt(t){for(const e of(t==null?void 0:t.items)??[])e.geometry.dispose()}function Qn(t,e){const n=new ie;t.perObjectFrustumCulled=!0,t.sortObjects=!0;for(const o of e.items){const r=t.addGeometry(o.geometry),s=t.addInstance(r);t.setMatrixAt(s,n),t.setColorAt(s,o.color)}dt(e)}function Jn({atoms:t,edges:e,lineWidthScale:n,opacity:o,polyhedron:r,polyhedronIndex:s}){const a=t[r.centerAtomIndex],i=x.useMemo(()=>{if(!a||e.length===0)return null;const u=new Ce;u.setPositions(e.flatMap(c=>[...c.startPosition,...c.endPosition]));const d=new Me({alphaToCoverage:!0,color:Vn,depthWrite:!1,fog:!1,linewidth:$n*n,opacity:Math.min(1,o*kn),side:ae,transparent:!0,worldUnits:!1}),l=new lt(u,d);return l.renderOrder=P.polyhedronEdge,l.userData.polyhedronEdgeIndices=e.map(c=>c.edgeIndex),l.userData.polyhedronIndex=s,l.userData.prettyCrystalComponent="polyhedron-edge-lines",l},[a,e,n,o,s]);return x.useEffect(()=>()=>{i==null||i.geometry.dispose(),i==null||i.material.dispose()},[i]),i?h.jsx("primitive",{object:i}):null}const Zn=x.memo(Jn);function eo(t){return t?(t.computeBoundingBox(),t.computeBoundingSphere(),t):null}function to(t){let e=ye("polyhedra");for(const n of t)e=N(e,n.polyhedronIndex),e=ye(n.color.getHexString(),e),e=no(n.geometry,"position",e),e=oo(n.geometry,e);return`polyhedra:${t.length}:${e.toString(36)}`}function no(t,e,n){const o=t.getAttribute(e);let r=N(n,o.itemSize);r=N(r,o.count);for(let s=0;s<o.array.length;s+=1)r=N(r,o.array[s]??0);return r}function oo(t,e){const n=t.getIndex();if(!n)return N(e,0);let o=N(e,n.count);for(let r=0;r<n.array.length;r+=1)o=N(o,n.array[r]??0);return o}function ye(t,e=2166136261){let n=e;for(let o=0;o<t.length;o+=1)n^=t.charCodeAt(o),n=Math.imul(n,16777619);return n>>>0}function N(t,e){const n=Number.isFinite(e)?e:0;return ye(String(n),t)}const vo=Je,ro=24,so="#fafafa",io=.4,ao={bondRadialSegments:16,sphereHeightSegments:24,sphereWidthSegments:32},Eo={low:{bondRadialSegments:12,sphereHeightSegments:16,sphereWidthSegments:24},medium:ao,high:{bondRadialSegments:ro,sphereHeightSegments:32,sphereWidthSegments:48},xhigh:{bondRadialSegments:32,sphereHeightSegments:48,sphereWidthSegments:72}};function wo({componentOpacity:t,layout:e,materialFamilies:n,meshDetail:o,scene:r,inspectedAtomId:s,interactionLocked:a,onAtomInspect:i,onAtomPulse:u,onLockedInteractionAttempt:d,polyhedronEdgeLineWidthScale:l=1,pulseAtomId:c,pulseToken:f,showAtoms:p,showUnitCell:g,style:m,unitCellLineStyle:E="solid",unitCellLineWidthScale:y=1}){return h.jsxs(h.Fragment,{children:[h.jsx(ft,{layout:e,style:m}),h.jsx(ht,{componentOpacity:t,groupPosition:e.groupPosition,materialFamilies:n,meshDetail:o,scene:r,inspectedAtomId:s,interactionLocked:a,onAtomInspect:i,onAtomPulse:u,onLockedInteractionAttempt:d,polyhedronEdgeLineWidthScale:l,pulseAtomId:c,pulseToken:f,showAtoms:p,showUnitCell:g,style:m,unitCellLineStyle:E,unitCellLineWidthScale:y})]})}function ft({layout:t,style:e}){const{invalidate:n,scene:o}=H(),r=x.useMemo(()=>e.fogEnabled?co(t.standardPose.distance,t.span,t.depthCueingBackOffset,t.depthCueingFrontOffset,e.fogAmount,e.fogStart):null,[t.span,t.depthCueingBackOffset,t.depthCueingFrontOffset,t.standardPose.distance,e.fogAmount,e.fogEnabled,e.fogStart]);return x.useLayoutEffect(()=>{const s=o.fog;return o.fog=r,n(),()=>{o.fog===r&&(o.fog=s,n())}},[r,n,o]),null}function co(t,e,n,o,r,s){const a=Number.isFinite(r)?r:0,i=Number.isFinite(s)?s:0,u=Math.min(1,Math.max(0,a/100)),d=Math.min(1,Math.max(0,i/100));if(u<=0)return null;const l=Number.isFinite(e)?Math.max(1,e):1,c=Number.isFinite(n)?Math.max(.01*l,n):.01*l,f=Number.isFinite(o)?Math.min(c,o):0,p=Number.isFinite(t)?Math.max(.01,t):.01,g=l*io,m=f-g,E=Math.max(m,c-g),y=lo(m,E,d),b=p+y,S=p+c,w=b+(S-b)/u;return new $t(so,b,w)}function lo(t,e,n){return t+(e-t)*n}function uo({componentOpacity:t,groupPosition:e,interactionLocked:n=!1,materialFamilies:o,meshDetail:r,scene:s,inspectedAtomId:a=null,onAtomInspect:i,onAtomPulse:u,onLockedInteractionAttempt:d,polyhedronEdgeLineWidthScale:l=1,pulseAtomId:c=null,pulseToken:f=0,showAtoms:p,showUnitCell:g,style:m,unitCellLineColor:E,unitCellLineStyle:y="solid",unitCellLineWidthScale:b=1}){const S=x.useMemo(()=>Rt(s.atoms,m),[s.atoms,m]),w=Pt(m),O=m.asuHighlight,{asuContextAtoms:q,disorderedAtoms:le,orderedAtoms:D}=x.useMemo(()=>{const Y=O?s.atoms.filter(R=>R.isSymmetryUnique!==!1):s.atoms,v=O?s.atoms.filter(R=>R.isSymmetryUnique===!1):[],_=Y.filter(R=>Re(R));return{asuContextAtoms:v,disorderedAtoms:_,orderedAtoms:_.length===0?Y:Y.filter(R=>!Re(R))}},[O,s.atoms]),k=O?Math.min(1,Math.max(0,m.asuGhostOpacity/100)):1,W=x.useMemo(()=>Tn({atoms:s.atoms,bondColor:m.bondColor,bonds:s.bonds,colorMode:m.bondColorMode,colorScheme:w,colorOverrides:S}),[w,S,s.atoms,s.bonds,m.bondColor,m.bondColorMode]),ue=x.useCallback(()=>{n||i==null||i(null)},[n,i]);return h.jsx("group",{onPointerMissed:ue,children:h.jsxs("group",{position:e,children:[h.jsx(mn,{cellVectors:s.cell.vectors,plane:m.latticePlane}),g?h.jsx(Un,{color:E,fog:m.fogEnabled&&m.fogAffectsUnitCell,lineWidthScale:b,opacity:t.unitCell/100,lineStyle:y,vectors:s.cell.vectors}):null,h.jsx(Kn,{atoms:s.atoms,colorScheme:w,colorOverrides:S,materialFamily:o.polyhedron,opacity:t.polyhedra/100*k,polyhedra:s.polyhedra,lineWidthScale:l}),h.jsx(Mn,{bondRenderItems:W,colorMode:m.bondColorMode,materialFamily:o.bond,meshDetail:r,thicknessScale:m.bondThickness/100,opacity:t.bonds/100*k}),p?h.jsxs(h.Fragment,{children:[h.jsx(Le,{atoms:D,colorScheme:w,colorOverrides:S,inspectedAtomId:a,interactionLocked:n,materialFamily:o.atom,meshDetail:r,onInspect:i,onPulse:u,onLockedInteractionAttempt:d,pulseAtomId:c,pulseToken:f,radiusModel:m.atomRadiusModel,radiusScale:m.atomRadius/100,opacity:t.atoms/100}),h.jsx(sn,{atoms:le,colorScheme:w,colorOverrides:S,inspectedAtomId:a,interactionLocked:n,materialFamily:o.atom,meshDetail:r,onInspect:i,onPulse:u,onLockedInteractionAttempt:d,radiusModel:m.atomRadiusModel,radiusScale:m.atomRadius/100,opacity:t.atoms/100}),m.vectorGlyphProperty?h.jsx(wn,{atoms:s.atoms,materialFamily:o.atom,property:m.vectorGlyphProperty,scalePercent:m.vectorGlyphScale}):null,q.length>0?h.jsx(Le,{atoms:q,colorScheme:w,colorOverrides:S,inspectedAtomId:a,interactionLocked:n,materialFamily:o.atom,meshDetail:r,onInspect:i,onPulse:u,onLockedInteractionAttempt:d,pulseAtomId:c,pulseToken:f,radiusModel:m.atomRadiusModel,radiusScale:m.atomRadius/100,opacity:t.atoms/100*k}):null]}):null]})})}const ht=x.memo(uo),bo={alpha:!0,antialias:!0,preserveDrawingBuffer:!0};function _o({cameraPose:t,componentOpacity:e,exportFramePlan:n,layout:o,materialFamilies:r,meshDetail:s,polyhedronEdgeLineWidthScale:a=1,scene:i,showAtoms:u,showUnitCell:d,style:l,unitCellLineColor:c,unitCellLineStyle:f="solid",unitCellLineWidthScale:p=1}){const{camera:g}=H();return x.useLayoutEffect(()=>{Tt(g,t,o.standardPose.distance,o.span)},[g,t,o.span,o.standardPose.distance]),x.useLayoutEffect(()=>{g instanceof qt&&Bt(g,n)},[g,n]),h.jsxs(h.Fragment,{children:[h.jsx(ft,{layout:o,style:l}),h.jsx(ht,{componentOpacity:e,groupPosition:o.groupPosition,materialFamilies:r,meshDetail:s,polyhedronEdgeLineWidthScale:a,scene:i,showAtoms:u,showUnitCell:d,style:l,unitCellLineColor:c,unitCellLineStyle:f,unitCellLineWidthScale:p})]})}export{vo as B,bo as D,Eo as E,lt as L,xo as M,wo as P,so as S,yo as a,ro as b,_o as c,Vn as d,qn as e,Wn as f,ao as g,P as h,co as i,Ce as j,Me as k,kt as l,go as m,zn as n,it as p,So as r,_n as t};
