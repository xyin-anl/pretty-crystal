const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/AmbientOcclusionEffect-C5tXYCMP.js","assets/index-B_3Meemo.js","assets/index-CXKjCYlq.css","assets/three.module-UfTwTrAo.js","assets/react-three-fiber.esm-CepKRhZ9.js"])))=>i.map(i=>d[i]);
import{r as p,F as f,_ as ht,m as ke,a5 as ve,a6 as Ee,a7 as pt,a8 as oe,a1 as Ye,a9 as gt,aa as St,ab as xt,ac as Ke,ad as yt,ae as Xe,af as de,ag as vt,ah as Et,ai as wt,aj as bt,ak as _t,al as Re,am as Qe,I as Mt,K as Ct,an as At,J as Ot,Q as Rt,P as It,ao as Ie,ap as Tt,aq as Pt}from"./index-B_3Meemo.js";import{l as Bt,m as Lt,n as Te,d as se,o as ie,V as M,Q as we,D as ae,p as ce,q as Je,F as q,r as jt,e as Ut,s as ne,t as Ze,b as Ft,u as re,v as Dt,w as xe,x as W,y as zt,z as be,A as et,E as Nt,G as Q,H as Gt,c as Ht,J as Wt,K as Vt,O as qt}from"./three.module-UfTwTrAo.js";import{S as N}from"./StructureMaterial-C2KiUdSE.js";import{u as G,a as tt}from"./react-three-fiber.esm-CepKRhZ9.js";const Pe=["performance","low","medium","high","ultra"];let _e=null,Be=null;function $t(){return Be??(Be=ht(()=>import("./AmbientOcclusionEffect-C5tXYCMP.js"),__vite__mapDeps([0,1,2,3,4])).then(t=>(_e=t,t))),Be}function dr(t){return t.length>0&&!_e}function fr({effects:t}){const e=t.find(s=>s.type==="ambientOcclusion"),[n,r]=p.useState(_e);return p.useEffect(()=>{if(!e||n)return;let s=!1;return $t().then(o=>{s||r(o)}),()=>{s=!0}},[e,n]),!e||!n?null:f.jsx(n.AmbientOcclusionEffect,{ambientOcclusion:kt(e.props,"ambientOcclusion.props")})}function kt(t,e){const n={};for(const[r,s]of Object.entries(t))if(s!=null)switch(r){case"aoRadius":case"aoSamples":case"denoiseRadius":case"denoiseSamples":case"distanceFalloff":case"intensity":n[r]=Yt(s,`${e}.${r}`);break;case"depthAwareUpsampling":case"halfRes":case"screenSpaceRadius":n[r]=Kt(s,`${e}.${r}`);break;case"color":n.color=Xt(s,`${e}.${r}`);break;case"quality":n.quality=Qt(s,`${e}.${r}`);break;default:throw new Error(`${e}.${r} is not supported.`)}return n}function Yt(t,e){if(typeof t!="number"||!Number.isFinite(t))throw new Error(`${e} must be a finite number.`);return t}function Kt(t,e){if(typeof t!="boolean")throw new Error(`${e} must be a boolean.`);return t}function Xt(t,e){if(typeof t!="string"||t.trim()==="")throw new Error(`${e} must be a non-empty string.`);return t}function Qt(t,e){if(typeof t!="string"||!Pe.includes(t))throw new Error(`${e} must be one of ${Pe.join(", ")}.`);return t}function mr(t){return nt(ke(t.materialPreset))}function hr(t){return{atom:fe(t,"atom"),bond:fe(t,"bond"),polyhedron:fe(t,"polyhedron")}}function fe(t,e){return nt(ke(t.materialPreset),e)}function nt(t,e){const n=Jt(t,e);return{effects:t.effects??[],id:t.id,label:t.label,lighting:t.lighting,material:n}}function Jt(t,e){var r,s;const n=e?(s=(r=t.overrides)==null?void 0:r[e])==null?void 0:s.material:void 0;return n?{props:{...t.material.props,...n.props},type:n.type}:t.material}const T={atomMesh:10,bondMesh:11,unitCellFrame:12,polyhedronSurface:20,polyhedronEdge:21,atomSelectionRing:40};let j;function rt({materialRef:t,opacity:e=Ee,position:n,radius:r,ringRef:s,scale:o=ve}){const i=p.useMemo(()=>Zt(),[]);if(!i)return null;const a=Math.max(.01,r*pt);return f.jsx("group",{ref:s,position:n,scale:o,children:f.jsx("sprite",{raycast:en,renderOrder:T.atomSelectionRing,scale:[a,a,1],children:f.jsx("spriteMaterial",{ref:t,map:i,depthWrite:!1,opacity:e,transparent:!0})})})}function Zt(){if(j!==void 0)return j;if(typeof document>"u")return j=null,j;const t=512,e=document.createElement("canvas");e.width=t,e.height=t;const n=e.getContext("2d");if(!n)return j=null,j;const r=t/2,s=206;n.clearRect(0,0,t,t),n.lineCap="round",n.lineJoin="round",n.beginPath(),n.arc(r,r,s,0,Math.PI*2),n.strokeStyle="rgba(15, 23, 42, 0.5)",n.lineWidth=60,n.stroke(),n.beginPath(),n.arc(r,r,s,0,Math.PI*2),n.strokeStyle="rgba(255, 255, 255, 0.98)",n.lineWidth=14,n.stroke(),n.beginPath(),n.arc(r,r,s,0,Math.PI*2),n.strokeStyle="rgba(15, 23, 42, 0.34)",n.lineWidth=4,n.stroke();const o=new Bt(e);return o.colorSpace=Lt,o.minFilter=Te,o.magFilter=Te,j=o,j}function en(){}function Le({atoms:t,colorScheme:e,colorOverrides:n,inspectedAtomId:r,interactionLocked:s,materialFamily:o,meshDetail:i,onInspect:a,onPulse:c,onLockedInteractionAttempt:l,opacity:u,pulseAtomId:d,pulseToken:h,radiusModel:S,radiusScale:g}){const m=p.useRef(null),b=G(y=>y.invalidate),v=u<1,_=p.useMemo(()=>t.map(y=>{const w=oe(y,e,n);return{atom:y,baseColor:new se(w),color:w}}),[t,n,e]),x=p.useMemo(()=>_.map(y=>({...y,radius:Ye(y.atom,S)*g})),[_,S,g]),E=p.useMemo(()=>{const y=new Map;return x.forEach((w,I)=>{y.set(w.atom.id,I)}),y},[x]),R=je(x,E,r),$=d&&h!==0?{atomId:d}:null,le=R||!$?null:je(x,E,$.atomId),U=R??le,k=p.useCallback(()=>{},[]);p.useLayoutEffect(()=>{const y=m.current;if(!y)return;const w=new ie,I=new M,Ae=new M,mt=new we;for(let J=0;J<x.length;J+=1){const Oe=x[J];I.fromArray(Oe.atom.position),Ae.setScalar(Oe.radius),w.compose(I,mt,Ae),y.setMatrixAt(J,w)}y.count=x.length,y.instanceMatrix.needsUpdate=!0,y.computeBoundingSphere(),b()},[x,b]),p.useLayoutEffect(()=>{const y=m.current;if(y){for(let w=0;w<_.length;w+=1){const I=_[w];y.setColorAt(w,I.baseColor)}y.instanceColor&&(y.instanceColor.needsUpdate=!0),b()}},[_,b]);const H=p.useCallback(y=>{var w;return y.instanceId===void 0?null:((w=x[y.instanceId])==null?void 0:w.atom)??null},[x]),ue=p.useCallback(y=>{const w=H(y);w&&(y.stopPropagation(),!s&&(c==null||c(w.id)))},[H,s,c]),Y=p.useCallback(y=>{const w=H(y);if(w){if(y.stopPropagation(),s){l==null||l();return}a==null||a(w.id)}},[H,s,a,l]);return x.length===0?null:f.jsxs(f.Fragment,{children:[f.jsxs("instancedMesh",{ref:m,args:[void 0,void 0,x.length],castShadow:!0,onClick:ue,onDoubleClick:Y,receiveShadow:!0,renderOrder:T.atomMesh,userData:{prettyCrystalComponent:"atom-instances",renderAtomIds:x.map(y=>y.atom.id)},children:[f.jsx("sphereGeometry",{args:[1,i.sphereWidthSegments,i.sphereHeightSegments]}),f.jsx(N,{color:"#ffffff",depthWrite:!0,materialFamily:o,opacity:u,transparent:v})]}),U?f.jsx(tn,{baseColor:U.instance.baseColor,index:U.index,inspected:R!==null,meshRef:m,onComplete:k},[U.instance.atom.id,R?"selected":"pulse",R?"":h,U.instance.color].join(":")):null,R?f.jsx(nn,{position:R.instance.atom.position,radius:R.instance.radius},R.instance.atom.id):null]})}function je(t,e,n){if(!n)return null;const r=e.get(n);if(r===void 0)return null;const s=t[r];return s?{index:r,instance:s}:null}function me(t,e,n){t.setColorAt(e,n),t.instanceColor&&(t.instanceColor.needsUpdate=!0)}function tn({baseColor:t,index:e,inspected:n,meshRef:r,onComplete:s}){const o=G(c=>c.invalidate),i=p.useRef(performance.now()),a=p.useRef(!0);return p.useEffect(()=>(i.current=performance.now(),a.current=!0,o(),()=>{const c=r.current;c&&(me(c,e,t),o())}),[t,e,n,o,r]),tt(()=>{if(!a.current)return;const c=r.current;if(!c)return;const l=performance.now()-i.current,u=n?St:xt,h=Math.min(1,l/(n?Xe:vt)),S=n?Ke(h):yt(h),g=t.clone().lerp(gt,u*S);if(me(c,e,g),h>=1){n||(me(c,e,t),s()),a.current=!1;return}o()}),null}function nn({position:t,radius:e}){const n=G(c=>c.invalidate),r=p.useRef(null),s=p.useRef(null),o=p.useRef(performance.now()),[i,a]=p.useState(!0);return p.useEffect(()=>{o.current=performance.now(),a(!0),n()},[n]),tt(()=>{if(!i)return;const c=r.current,l=s.current;if(!c||!l)return;const u=Math.min(1,(performance.now()-o.current)/Xe),d=Ke(u),h=de+(ve-de)*d;if(c.scale.setScalar(h),l.opacity=Ee*d,u>=1){a(!1);return}n()}),f.jsx(rt,{materialRef:s,opacity:0,position:t,radius:e,ringRef:r,scale:de})}const rn="#dfe2e6",V=Math.PI*2,Ue=.001;function on({atoms:t,colorScheme:e,colorOverrides:n,inspectedAtomId:r,interactionLocked:s,materialFamily:o,meshDetail:i,onInspect:a,onPulse:c,onLockedInteractionAttempt:l,opacity:u,radiusModel:d,radiusScale:h}){const S=u<1,g=p.useMemo(()=>t.map(v=>({atom:v,radius:Ye(v,d)*h,sectors:an(v,e,n)})),[t,n,e,d,h]),m=p.useCallback(v=>_=>{_.stopPropagation(),!s&&(c==null||c(v.id))},[s,c]),b=p.useCallback(v=>_=>{if(_.stopPropagation(),s){l==null||l();return}a==null||a(v.id)},[s,a,l]);return g.length===0?null:f.jsx(f.Fragment,{children:g.map(({atom:v,radius:_,sectors:x})=>f.jsxs("group",{position:v.position,children:[x.map((E,R)=>f.jsx(sn,{color:E.color,depthWrite:!0,materialFamily:o,meshDetail:i,onClick:m(v),onDoubleClick:b(v),opacity:u,phiLength:E.phiLength,phiStart:E.phiStart,radius:_,transparent:S},R)),r===v.id?f.jsx(rt,{opacity:Ee,position:[0,0,0],radius:_,scale:ve}):null]},v.id))})}function sn({color:t,depthWrite:e,materialFamily:n,meshDetail:r,onClick:s,onDoubleClick:o,opacity:i,phiLength:a,phiStart:c,radius:l,transparent:u}){const h=a>=V-1e-6?[]:[Fe(c),Fe(c+a)];return f.jsxs(f.Fragment,{children:[f.jsxs("mesh",{castShadow:!0,onClick:s,onDoubleClick:o,receiveShadow:!0,renderOrder:T.atomMesh,children:[f.jsx("sphereGeometry",{args:[l,Math.max(3,Math.ceil(r.sphereWidthSegments*a/V)),r.sphereHeightSegments,c,a]}),f.jsx(N,{color:t,depthWrite:e,materialFamily:n,opacity:i,transparent:u})]}),h.map((S,g)=>f.jsxs("mesh",{onClick:s,onDoubleClick:o,renderOrder:T.atomMesh,rotation:[0,S,0],children:[f.jsx("circleGeometry",{args:[l,r.sphereHeightSegments,-Math.PI/2,Math.PI]}),f.jsx(N,{color:t,depthWrite:e,materialFamily:n,opacity:i,side:ae,transparent:u})]},g))]})}function Fe(t){return Math.PI-t}function an(t,e,n){const r=Et(t),s=[];let o=0;for(const i of r){const a=Math.min(1,Math.max(0,i.occupancy));if(a<Ue)continue;const c=a*V;s.push({color:wt(i.element,e,n),phiLength:c,phiStart:o}),o+=c}return o<V-Ue*V&&s.push({color:rn,phiLength:V-o,phiStart:o}),s}const K=[[0,0,0],[1,0,0],[0,1,0],[0,0,1],[1,1,0],[1,0,1],[0,1,1],[1,1,1]],cn=[[0,1],[0,2],[0,3],[1,4],[1,5],[2,4],[2,6],[3,5],[3,6],[4,7],[5,7],[6,7]],F=1e-9,X=1e-6;function ot(t){return t!==null&&(t.h!==0||t.k!==0||t.l!==0)}function ln(t,e){if(!ot(e)||t.length!==3)return null;const n=K.map(l=>e.h*l[0]+e.k*l[1]+e.l*l[2]),r=Math.min(...n),s=Math.max(...n);if(s-r<F)return null;const o=Math.min(100,Math.max(0,e.offsetPercent))/100,i=r+(s-r)*o,a=[];for(const[l,u]of cn){const d=n[l],h=n[u];if((d-i)*(h-i)>F||Math.abs(h-d)<F){Math.abs(d-i)<F&&he(a,K[l]),Math.abs(h-i)<F&&he(a,K[u]);continue}const S=(i-d)/(h-d);if(S<-F||S>1+F)continue;const g=K[l],m=K[u];he(a,[g[0]+(m[0]-g[0])*S,g[1]+(m[1]-g[1])*S,g[2]+(m[2]-g[2])*S])}if(a.length<3)return null;const c=a.map(l=>dn(l,t));return fn(c)}function un(t){const e=t.length-2,n=new Float32Array(e*9);for(let r=0;r<e;r+=1){const s=t[0],o=t[r+1],i=t[r+2];n.set([s.x,s.y,s.z,o.x,o.y,o.z,i.x,i.y,i.z],r*9)}return n}function dn(t,e){const n=new M;for(let r=0;r<3;r+=1)n.x+=t[r]*e[r][0],n.y+=t[r]*e[r][1],n.z+=t[r]*e[r][2];return n}function he(t,e){for(const n of t)if(Math.abs(n[0]-e[0])<X&&Math.abs(n[1]-e[1])<X&&Math.abs(n[2]-e[2])<X)return;t.push(e)}function fn(t){const e=t.reduce((i,a)=>i.add(a),new M).divideScalar(t.length),n=t[0].clone().sub(e);if(n.lengthSq()<X)return null;const r=n.normalize();let s=null;for(let i=1;i<t.length;i+=1){const a=t[i].clone().sub(e).cross(r);if(a.lengthSq()>X){s=a.normalize();break}}if(!s)return null;const o=s.clone().cross(r).normalize();return t.map(i=>{const a=i.clone().sub(e);return{angle:Math.atan2(a.dot(o),a.dot(r)),point:i}}).sort((i,a)=>i.angle-a.angle).map(i=>i.point)}function mn({cellVectors:t,plane:e}){const n=(e==null?void 0:e.color)??bt,r=Math.min(100,Math.max(0,(e==null?void 0:e.opacityPercent)??_t))/100,s=p.useMemo(()=>{if(!ot(e))return null;const o=ln(t,e);if(!o)return null;const i=new ce;return i.setAttribute("position",new Je(un(o),3)),i.computeVertexNormals(),{outlinePoints:o,surface:i}},[t,e]);return s?f.jsxs(f.Fragment,{children:[f.jsx("mesh",{geometry:s.surface,renderOrder:T.polyhedronSurface,children:f.jsx("meshBasicMaterial",{color:n,depthWrite:!1,opacity:r,side:ae,transparent:!0})}),f.jsx(hn,{color:n,points:s.outlinePoints})]}):null}function hn({color:t,points:e}){const n=p.useMemo(()=>{const r=new ce,s=new Float32Array(e.length*3);return e.forEach((o,i)=>{s.set([o.x,o.y,o.z],i*3)}),r.setAttribute("position",new Je(s,3)),r},[e]);return f.jsx("lineLoop",{geometry:n,renderOrder:T.polyhedronSurface,children:f.jsx("lineBasicMaterial",{color:t,transparent:!0,opacity:.9})})}const pn=1.7,gn=.28,Sn=.045,xn=.13,yn=.32,De=12,vn=new M(0,1,0);function En({atoms:t,materialFamily:e,property:n,scalePercent:r}){const s=p.useMemo(()=>{var c;let o=0;const i=[];for(const l of t){const u=(c=l.siteVectors)==null?void 0:c[n];if(!u)continue;const d=new M(...u),h=d.length();h<=1e-9||(o=Math.max(o,h),i.push({atom:l,magnitude:h,vector:d}))}if(o<=0)return[];const a=pn*r/100/o;return i.map(({atom:l,magnitude:u,vector:d})=>({key:l.id,length:Math.max(gn,u*a),position:l.position,quaternion:new we().setFromUnitVectors(vn,d.clone().normalize())}))},[t,n,r]);return s.length===0?null:f.jsx(f.Fragment,{children:s.map(o=>f.jsx(wn,{arrow:o,materialFamily:e},o.key))})}function wn({arrow:t,materialFamily:e}){const n=t.length*yn,r=t.length-n,s=t.length*Sn,o=t.length*xn;return f.jsxs("group",{position:t.position,quaternion:t.quaternion,children:[f.jsxs("mesh",{castShadow:!0,position:[0,-t.length/2+r/2,0],children:[f.jsx("cylinderGeometry",{args:[s,s,r,De]}),f.jsx(N,{color:Re,depthWrite:!0,materialFamily:e,opacity:1,transparent:!1})]}),f.jsxs("mesh",{castShadow:!0,position:[0,t.length/2-n/2,0],renderOrder:T.atomMesh,children:[f.jsx("coneGeometry",{args:[o,n,De]}),f.jsx(N,{color:Re,depthWrite:!0,materialFamily:e,opacity:1,transparent:!1})]})]})}function bn({endColor:t,length:e,radialSegments:n,radius:r,startColor:s}){const o=Math.max(3,Math.floor(n)),i=e/2,a=[],c=[],l=[],u=[],d=new se(s),h=new se(t),S=[{color:d,y:-i},{color:d,y:0},{color:h,y:0},{color:h,y:i}];for(const b of S)for(let v=0;v<=o;v+=1){const _=v/o*Math.PI*2,x=Math.sin(_),E=Math.cos(_);a.push(r*x,b.y,r*E),c.push(x,0,E),l.push(b.color.r,b.color.g,b.color.b)}const g=o+1;ze(u,0,1,g,o),ze(u,2,3,g,o);const m=new ce;return m.setAttribute("position",new q(a,3)),m.setAttribute("normal",new q(c,3)),m.setAttribute("color",new q(l,3)),m.setIndex(u),m}function ze(t,e,n,r,s){const o=e*r,i=n*r;for(let a=0;a<s;a+=1){const c=o+a,l=i+a,u=i+a+1,d=o+a+1;t.push(c,d,l,l,d,u)}}function st(t,e){const n=[];for(const o of t.hullAtomIndices){const i=e[o];if(!i)return null;n.push(...i.position)}const r=[];for(const o of t.faces){if(o.length!==3||new Set(o).size!==3||o.some(i=>!Number.isInteger(i)||i<0||i>=t.hullAtomIndices.length))return null;r.push(...o)}if(r.length===0)return null;const s=new ce;return s.setAttribute("position",new q(n,3)),s.setIndex(r),s.computeVertexNormals(),s}function _n({bondRenderItems:t,colorMode:e,materialFamily:n,meshDetail:r,opacity:s,thicknessScale:o}){var g;const i=p.useRef(null),a=p.useRef(null),c=p.useRef(null),l=G(m=>m.invalidate),u=p.useMemo(()=>Mn({bondRenderItems:t,colorMode:e,radialSegments:r.bondRadialSegments,radius:Mt*o}),[t,e,r.bondRadialSegments,o]);if(p.useLayoutEffect(()=>{const m=i.current;if(!m||!u){a.current=null,c.current=null;return}a.current===m&&c.current===u.key||(Cn(m,u),a.current=m,c.current=u.key,m.computeBoundingBox(),m.computeBoundingSphere(),l())},[u,l]),!u)return null;const d=s<1,h=u.mode==="bicolor",S=((g=u.items[0])==null?void 0:g.startColor)??Qe;return f.jsx("batchedMesh",{ref:i,args:[u.itemCount,u.maxVertexCount,u.maxIndexCount],castShadow:!0,receiveShadow:!0,renderOrder:T.bondMesh,userData:{displayBondIndices:u.items.map(m=>m.bondIndex),prettyCrystalComponent:"bond-instances"},children:f.jsx(N,{color:h?void 0:S,depthWrite:!d,materialFamily:n,opacity:s,transparent:d,vertexColors:h})},u.key)}function Mn({bondRenderItems:t,colorMode:e,radialSegments:n,radius:r}){var l;const s=Math.max(3,Math.floor(n)),o=t;if(o.length===0||r<=0)return null;if(e==="bicolor"){const u=o.length*On(s),d=o.length*Rn(s);return{itemCount:o.length,items:o,key:Ne({colorMode:e,items:o,radialSegments:s,radius:r}),maxIndexCount:d,maxVertexCount:u,mode:e,radialSegments:s,radius:r}}const i=at(r,s),a=i.getAttribute("position").count,c=((l=i.getIndex())==null?void 0:l.count)??a;return i.dispose(),{itemCount:o.length,items:o,key:Ne({colorMode:e,items:o,radialSegments:s,radius:r}),maxIndexCount:c,maxVertexCount:a,mode:e,radialSegments:s,radius:r}}function Cn(t,e){const n=new ie,r=e.mode==="unicolor"?at(e.radius,e.radialSegments):null,s=r?t.addGeometry(it(r)):null;for(const o of e.items){const i=s??An(t,o,e),a=t.addInstance(i),c=e.mode==="unicolor"?new M(1,o.length,1):new M(1,1,1);n.compose(o.center,o.quaternion,c),t.setMatrixAt(a,n)}r==null||r.dispose()}function An(t,e,n){const r=it(bn({endColor:e.endColor,length:e.length,radialSegments:n.radialSegments,radius:n.radius,startColor:e.startColor})),s=t.addGeometry(r);return r.dispose(),s}function it(t){return t.computeBoundingBox(),t.computeBoundingSphere(),t}function at(t,e){return new jt(t,t,1,e)}function On(t){return 4*(t+1)}function Rn(t){return 12*t}function Ne({colorMode:t,items:e,radialSegments:n,radius:r}){let s=Ge(`${t}:${n}:${r}`);for(const o of e)s=Ge([s,o.startAtomIndex,o.endAtomIndex,o.length,o.center.toArray().join(","),o.quaternion.toArray().join(","),o.startColor,o.endColor].join(":"));return`bonds:${e.length}:${s.toString(36)}`}function Ge(t){let e=2166136261;for(let n=0;n<t.length;n+=1)e^=t.charCodeAt(n),e=Math.imul(e,16777619);return e>>>0}const In=new M(0,1,0);function Tn({atoms:t,bondColor:e,bonds:n,colorMode:r,colorScheme:s,colorOverrides:o}){const i=[];for(const[a,c]of n.entries()){const l=t[c.startAtomIndex],u=t[c.endAtomIndex];if(!l||!u)continue;const d=new M(...l.position),h=new M(...u.position),S=h.clone().sub(d),g=S.length();g<=0||i.push({bondIndex:a,center:d.clone().add(h).multiplyScalar(.5),endAtomIndex:c.endAtomIndex,endColor:r==="bicolor"?oe(u,s,o):e,length:g,quaternion:new we().setFromUnitVectors(In,S.clone().normalize()),startAtomIndex:c.startAtomIndex,startColor:r==="bicolor"?oe(l,s,o):e})}return i}re.line={worldUnits:{value:1},linewidth:{value:1},resolution:{value:new Ft(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}};ne.line={uniforms:Ze.merge([re.common,re.fog,re.line]),vertexShader:`
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
		`};class Me extends Ut{constructor(e){super({type:"LineMaterial",uniforms:Ze.clone(ne.line.uniforms),vertexShader:ne.line.vertexShader,fragmentShader:ne.line.fragmentShader,clipping:!0}),this.isLineMaterial=!0,this.setValues(e)}get color(){return this.uniforms.diffuse.value}set color(e){this.uniforms.diffuse.value=e}get worldUnits(){return"WORLD_UNITS"in this.defines}set worldUnits(e){e===!0?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}get linewidth(){return this.uniforms.linewidth.value}set linewidth(e){this.uniforms.linewidth&&(this.uniforms.linewidth.value=e)}get dashed(){return"USE_DASH"in this.defines}set dashed(e){e===!0!==this.dashed&&(this.needsUpdate=!0),e===!0?this.defines.USE_DASH="":delete this.defines.USE_DASH}get dashScale(){return this.uniforms.dashScale.value}set dashScale(e){this.uniforms.dashScale.value=e}get dashSize(){return this.uniforms.dashSize.value}set dashSize(e){this.uniforms.dashSize.value=e}get dashOffset(){return this.uniforms.dashOffset.value}set dashOffset(e){this.uniforms.dashOffset.value=e}get gapSize(){return this.uniforms.gapSize.value}set gapSize(e){this.uniforms.gapSize.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}get resolution(){return this.uniforms.resolution.value}set resolution(e){this.uniforms.resolution.value.copy(e)}get alphaToCoverage(){return"USE_ALPHA_TO_COVERAGE"in this.defines}set alphaToCoverage(e){this.defines&&(e===!0!==this.alphaToCoverage&&(this.needsUpdate=!0),e===!0?this.defines.USE_ALPHA_TO_COVERAGE="":delete this.defines.USE_ALPHA_TO_COVERAGE)}}const He=new be,Z=new M;class Ce extends Dt{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry";const e=[-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],n=[-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],r=[0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5];this.setIndex(r),this.setAttribute("position",new q(e,3)),this.setAttribute("uv",new q(n,2))}applyMatrix4(e){const n=this.attributes.instanceStart,r=this.attributes.instanceEnd;return n!==void 0&&(n.applyMatrix4(e),r.applyMatrix4(e),n.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));const r=new xe(n,6,1);return this.setAttribute("instanceStart",new W(r,3,0)),this.setAttribute("instanceEnd",new W(r,3,3)),this.instanceCount=this.attributes.instanceStart.count,this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));const r=new xe(n,6,1);return this.setAttribute("instanceColorStart",new W(r,3,0)),this.setAttribute("instanceColorEnd",new W(r,3,3)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new zt(e.geometry)),this}fromLineSegments(e){const n=e.geometry;return this.setPositions(n.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new be);const e=this.attributes.instanceStart,n=this.attributes.instanceEnd;e!==void 0&&n!==void 0&&(this.boundingBox.setFromBufferAttribute(e),He.setFromBufferAttribute(n),this.boundingBox.union(He))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new et),this.boundingBox===null&&this.computeBoundingBox();const e=this.attributes.instanceStart,n=this.attributes.instanceEnd;if(e!==void 0&&n!==void 0){const r=this.boundingSphere.center;this.boundingBox.getCenter(r);let s=0;for(let o=0,i=e.count;o<i;o++)Z.fromBufferAttribute(e,o),s=Math.max(s,r.distanceToSquared(Z)),Z.fromBufferAttribute(n,o),s=Math.max(s,r.distanceToSquared(Z));this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}const pe=new Q,We=new M,Ve=new M,C=new Q,A=new Q,P=new Q,ge=new M,Se=new ie,O=new Gt,qe=new M,ee=new be,te=new et,B=new Q;let L,D;function $e(t,e,n){return B.set(0,0,-e,1).applyMatrix4(t.projectionMatrix),B.multiplyScalar(1/B.w),B.x=D/n.width,B.y=D/n.height,B.applyMatrix4(t.projectionMatrixInverse),B.multiplyScalar(1/B.w),Math.abs(Math.max(B.x,B.y))}function Pn(t,e){const n=t.matrixWorld,r=t.geometry,s=r.attributes.instanceStart,o=r.attributes.instanceEnd,i=Math.min(r.instanceCount,s.count);for(let a=0,c=i;a<c;a++){O.start.fromBufferAttribute(s,a),O.end.fromBufferAttribute(o,a),O.applyMatrix4(n);const l=new M,u=new M;L.distanceSqToSegment(O.start,O.end,u,l),u.distanceTo(l)<D*.5&&e.push({point:u,pointOnLine:l,distance:L.origin.distanceTo(u),object:t,face:null,faceIndex:a,uv:null,uv1:null})}}function Bn(t,e,n){const r=e.projectionMatrix,o=t.material.resolution,i=t.matrixWorld,a=t.geometry,c=a.attributes.instanceStart,l=a.attributes.instanceEnd,u=Math.min(a.instanceCount,c.count),d=-e.near;L.at(1,P),P.w=1,P.applyMatrix4(e.matrixWorldInverse),P.applyMatrix4(r),P.multiplyScalar(1/P.w),P.x*=o.x/2,P.y*=o.y/2,P.z=0,ge.copy(P),Se.multiplyMatrices(e.matrixWorldInverse,i);for(let h=0,S=u;h<S;h++){if(C.fromBufferAttribute(c,h),A.fromBufferAttribute(l,h),C.w=1,A.w=1,C.applyMatrix4(Se),A.applyMatrix4(Se),C.z>d&&A.z>d)continue;if(C.z>d){const x=C.z-A.z,E=(C.z-d)/x;C.lerp(A,E)}else if(A.z>d){const x=A.z-C.z,E=(A.z-d)/x;A.lerp(C,E)}C.applyMatrix4(r),A.applyMatrix4(r),C.multiplyScalar(1/C.w),A.multiplyScalar(1/A.w),C.x*=o.x/2,C.y*=o.y/2,A.x*=o.x/2,A.y*=o.y/2,O.start.copy(C),O.start.z=0,O.end.copy(A),O.end.z=0;const m=O.closestPointToPointParameter(ge,!0);O.at(m,qe);const b=Ht.lerp(C.z,A.z,m),v=b>=-1&&b<=1,_=ge.distanceTo(qe)<D*.5;if(v&&_){O.start.fromBufferAttribute(c,h),O.end.fromBufferAttribute(l,h),O.start.applyMatrix4(i),O.end.applyMatrix4(i);const x=new M,E=new M;L.distanceSqToSegment(O.start,O.end,E,x),n.push({point:E,pointOnLine:x,distance:L.origin.distanceTo(E),object:t,face:null,faceIndex:h,uv:null,uv1:null})}}}class ct extends Nt{constructor(e=new Ce,n=new Me({color:Math.random()*16777215})){super(e,n),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){const e=this.geometry,n=e.attributes.instanceStart,r=e.attributes.instanceEnd,s=new Float32Array(2*n.count);for(let i=0,a=0,c=n.count;i<c;i++,a+=2)We.fromBufferAttribute(n,i),Ve.fromBufferAttribute(r,i),s[a]=a===0?0:s[a-1],s[a+1]=s[a]+We.distanceTo(Ve);const o=new xe(s,2,1);return e.setAttribute("instanceDistanceStart",new W(o,1,0)),e.setAttribute("instanceDistanceEnd",new W(o,1,1)),this}raycast(e,n){const r=this.material.worldUnits,s=e.camera;s===null&&!r&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');const o=e.params.Line2!==void 0&&e.params.Line2.threshold||0;L=e.ray;const i=this.matrixWorld,a=this.geometry,c=this.material;D=c.linewidth+o,a.boundingSphere===null&&a.computeBoundingSphere(),te.copy(a.boundingSphere).applyMatrix4(i);let l;if(r)l=D*.5;else{const d=Math.max(s.near,te.distanceToPoint(L.origin));l=$e(s,d,c.resolution)}if(te.radius+=l,L.intersectsSphere(te)===!1)return;a.boundingBox===null&&a.computeBoundingBox(),ee.copy(a.boundingBox).applyMatrix4(i);let u;if(r)u=D*.5;else{const d=Math.max(s.near,ee.distanceToPoint(L.origin));u=$e(s,d,c.resolution)}ee.expandByScalar(u),L.intersectsBox(ee)!==!1&&(r?Pn(this,n):Bn(this,s,n))}onBeforeRender(e){const n=this.material.uniforms;n&&n.resolution&&(e.getViewport(pe),this.material.uniforms.resolution.value.set(pe.z,pe.w))}}const Ln=.08,jn=.03;function Un({color:t=At,fog:e,lineWidthScale:n,lineStyle:r,opacity:s,vectors:o}){const i=p.useMemo(()=>{const a=new Ce;a.setPositions(Ct(o));const c=Ot*n,l=new Me({alphaToCoverage:!0,color:t,dashed:r==="dashed",depthTest:!0,depthWrite:!1,dashSize:Ln,fog:e,gapSize:jn,linewidth:c,opacity:s,transparent:!0,worldUnits:!1}),u=new ct(a,l);return u.renderOrder=T.unitCellFrame,u.userData.prettyCrystalComponent="unit-cell-frame",r==="dashed"&&(l.defines.USE_DASH="",l.needsUpdate=!0,u.computeLineDistances()),u},[t,e,r,n,s,o]);return p.useEffect(()=>()=>{i.geometry.dispose(),i.material.dispose()},[i]),f.jsx("primitive",{object:i})}const Fn=.5,Dn="#cfd6e2",zn=1,Nn=.6,Gn=Nn/Fn;function Hn({atoms:t,colorScheme:e,colorOverrides:n,lineWidthScale:r,materialFamily:s,opacity:o,polyhedra:i}){const a=p.useRef(null),c=p.useRef(null),l=p.useRef(null),u=G(h=>h.invalidate),d=p.useMemo(()=>Vn({atoms:t,colorScheme:e,colorOverrides:n,polyhedra:i}),[t,e,n,i]);return p.useLayoutEffect(()=>{const h=a.current;if(!h||!d){c.current=null,l.current=null;return}c.current===h&&l.current===d.key||(kn(h,d),c.current=h,l.current=d.key,h.computeBoundingBox(),h.computeBoundingSphere(),u())},[d,u]),p.useEffect(()=>()=>{ut(d)},[d]),d?f.jsxs("group",{children:[d.itemCount>0?f.jsx("batchedMesh",{ref:a,args:[d.itemCount,d.maxVertexCount,d.maxIndexCount],receiveShadow:!0,renderOrder:T.polyhedronSurface,children:f.jsx(N,{color:"#ffffff",depthWrite:!0,materialFamily:s,opacity:o,polygonOffset:!0,polygonOffsetFactor:3,side:ae,transparent:!0})},d.key):null,d.edgeItems.map(h=>f.jsx(Kn,{atoms:t,lineWidthScale:r,opacity:o,polyhedron:h.polyhedron},h.polyhedronIndex))]}):null}const Wn=p.memo(Hn);function Vn({atoms:t,colorScheme:e,colorOverrides:n,polyhedra:r}){const s=[],o=[],i=new Set;let a=0,c=0;return r.forEach((l,u)=>{var v;const d=t[l.centerAtomIndex];if(!d||!qn(l,t))return;s.push({polyhedron:l,polyhedronIndex:u});const h=$n(l,t,i);if(!h)return;const S=Xn(st(h,t));if(!S)return;const g=S.getAttribute("position"),m=(g==null?void 0:g.count)??0,b=((v=S.getIndex())==null?void 0:v.count)??m;if(m<=0||b<=0){S.dispose();return}o.push({color:new se(oe(d,e,n)),geometry:S,polyhedron:l,polyhedronIndex:u}),a+=b,c+=m}),o.length===0&&s.length===0?null:{edgeItems:s,itemCount:o.length,items:o,key:Qn(o),maxIndexCount:a,maxVertexCount:c}}function qn(t,e){return t.faces.length===0||t.hullAtomIndices.some(n=>!e[n])?!1:t.faces.every(n=>lt(t,e,n)!==null)}function $n(t,e,n){const r=new Set,s=[];for(const o of t.hullAtomIndices)if(!e[o])return null;for(const o of t.faces){const i=lt(t,e,o);if(!i)return null;n.has(i)||r.has(i)||(r.add(i),s.push(o))}for(const o of r)n.add(o);return s.length===t.faces.length?t:{...t,faces:s}}function lt(t,e,n){if(n.length!==3||new Set(n).size!==3||n.some(s=>!Number.isInteger(s)||s<0||s>=t.hullAtomIndices.length))return null;const r=[];for(const s of n){const o=t.hullAtomIndices[s];if(o===void 0)return null;const i=e[o];if(!i||i.position.some(a=>!Number.isFinite(a)))return null;r.push(i.position.map(a=>String(a)).join(","))}return r.sort().join("|")}function ut(t){for(const e of(t==null?void 0:t.items)??[])e.geometry.dispose()}function kn(t,e){const n=new ie;t.perObjectFrustumCulled=!0,t.sortObjects=!0;for(const r of e.items){const s=t.addGeometry(r.geometry),o=t.addInstance(s);t.setMatrixAt(o,n),t.setColorAt(o,r.color)}ut(e)}function Yn({atoms:t,lineWidthScale:e,opacity:n,polyhedron:r}){const s=t[r.centerAtomIndex],o=p.useMemo(()=>s?st(r,t):null,[t,s,r]),i=p.useMemo(()=>{if(!o)return null;const a=new Wt(o),c=a.getAttribute("position"),l=new Ce;l.setPositions(Array.from(c.array)),a.dispose();const u=new Me({alphaToCoverage:!0,color:Dn,depthWrite:!1,fog:!1,linewidth:zn*e,opacity:Math.min(1,n*Gn),side:ae,transparent:!0,worldUnits:!1}),d=new ct(l,u);return d.renderOrder=T.polyhedronEdge,d},[o,e,n]);return p.useEffect(()=>()=>{o==null||o.dispose()},[o]),p.useEffect(()=>()=>{i==null||i.geometry.dispose(),i==null||i.material.dispose()},[i]),i?f.jsx("primitive",{object:i}):null}const Kn=p.memo(Yn);function Xn(t){return t?(t.computeBoundingBox(),t.computeBoundingSphere(),t):null}function Qn(t){let e=ye("polyhedra");for(const n of t)e=z(e,n.polyhedronIndex),e=ye(n.color.getHexString(),e),e=Jn(n.geometry,"position",e),e=Zn(n.geometry,e);return`polyhedra:${t.length}:${e.toString(36)}`}function Jn(t,e,n){const r=t.getAttribute(e);let s=z(n,r.itemSize);s=z(s,r.count);for(let o=0;o<r.array.length;o+=1)s=z(s,r.array[o]??0);return s}function Zn(t,e){const n=t.getIndex();if(!n)return z(e,0);let r=z(e,n.count);for(let s=0;s<n.array.length;s+=1)r=z(r,n.array[s]??0);return r}function ye(t,e=2166136261){let n=e;for(let r=0;r<t.length;r+=1)n^=t.charCodeAt(r),n=Math.imul(n,16777619);return n>>>0}function z(t,e){const n=Number.isFinite(e)?e:0;return ye(String(n),t)}const pr=Qe,er=24,tr="#fafafa",nr=.4,rr={bondRadialSegments:16,sphereHeightSegments:24,sphereWidthSegments:32},gr={low:{bondRadialSegments:12,sphereHeightSegments:16,sphereWidthSegments:24},medium:rr,high:{bondRadialSegments:er,sphereHeightSegments:32,sphereWidthSegments:48},xhigh:{bondRadialSegments:32,sphereHeightSegments:48,sphereWidthSegments:72}};function Sr({componentOpacity:t,layout:e,materialFamilies:n,meshDetail:r,scene:s,inspectedAtomId:o,interactionLocked:i,onAtomInspect:a,onAtomPulse:c,onLockedInteractionAttempt:l,polyhedronEdgeLineWidthScale:u=1,pulseAtomId:d,pulseToken:h,showAtoms:S,showUnitCell:g,style:m,unitCellLineStyle:b="solid",unitCellLineWidthScale:v=1}){return f.jsxs(f.Fragment,{children:[f.jsx(dt,{layout:e,style:m}),f.jsx(ft,{componentOpacity:t,groupPosition:e.groupPosition,materialFamilies:n,meshDetail:r,scene:s,inspectedAtomId:o,interactionLocked:i,onAtomInspect:a,onAtomPulse:c,onLockedInteractionAttempt:l,polyhedronEdgeLineWidthScale:u,pulseAtomId:d,pulseToken:h,showAtoms:S,showUnitCell:g,style:m,unitCellLineStyle:b,unitCellLineWidthScale:v})]})}function dt({layout:t,style:e}){const{invalidate:n,scene:r}=G(),s=p.useMemo(()=>e.fogEnabled?or(t.standardPose.distance,t.span,t.depthCueingBackOffset,t.depthCueingFrontOffset,e.fogAmount,e.fogStart):null,[t.span,t.depthCueingBackOffset,t.depthCueingFrontOffset,t.standardPose.distance,e.fogAmount,e.fogEnabled,e.fogStart]);return p.useLayoutEffect(()=>{const o=r.fog;return r.fog=s,n(),()=>{r.fog===s&&(r.fog=o,n())}},[s,n,r]),null}function or(t,e,n,r,s,o){const i=Number.isFinite(s)?s:0,a=Number.isFinite(o)?o:0,c=Math.min(1,Math.max(0,i/100)),l=Math.min(1,Math.max(0,a/100));if(c<=0)return null;const u=Number.isFinite(e)?Math.max(1,e):1,d=Number.isFinite(n)?Math.max(.01*u,n):.01*u,h=Number.isFinite(r)?Math.min(d,r):0,S=Number.isFinite(t)?Math.max(.01,t):.01,g=u*nr,m=h-g,b=Math.max(m,d-g),v=sr(m,b,l),_=S+v,x=S+d,E=_+(x-_)/c;return new Vt(tr,_,E)}function sr(t,e,n){return t+(e-t)*n}function ir({componentOpacity:t,groupPosition:e,interactionLocked:n=!1,materialFamilies:r,meshDetail:s,scene:o,inspectedAtomId:i=null,onAtomInspect:a,onAtomPulse:c,onLockedInteractionAttempt:l,polyhedronEdgeLineWidthScale:u=1,pulseAtomId:d=null,pulseToken:h=0,showAtoms:S,showUnitCell:g,style:m,unitCellLineColor:b,unitCellLineStyle:v="solid",unitCellLineWidthScale:_=1}){const x=p.useMemo(()=>Rt(o.atoms,m),[o.atoms,m]),E=It(m),R=m.asuHighlight,{asuContextAtoms:$,disorderedAtoms:le,orderedAtoms:U}=p.useMemo(()=>{const Y=R?o.atoms.filter(I=>I.isSymmetryUnique!==!1):o.atoms,y=R?o.atoms.filter(I=>I.isSymmetryUnique===!1):[],w=Y.filter(I=>Ie(I));return{asuContextAtoms:y,disorderedAtoms:w,orderedAtoms:w.length===0?Y:Y.filter(I=>!Ie(I))}},[R,o.atoms]),k=R?Math.min(1,Math.max(0,m.asuGhostOpacity/100)):1,H=p.useMemo(()=>Tn({atoms:o.atoms,bondColor:m.bondColor,bonds:o.bonds,colorMode:m.bondColorMode,colorScheme:E,colorOverrides:x}),[E,x,o.atoms,o.bonds,m.bondColor,m.bondColorMode]),ue=p.useCallback(()=>{n||a==null||a(null)},[n,a]);return f.jsx("group",{onPointerMissed:ue,children:f.jsxs("group",{position:e,children:[f.jsx(mn,{cellVectors:o.cell.vectors,plane:m.latticePlane}),g?f.jsx(Un,{color:b,fog:m.fogEnabled&&m.fogAffectsUnitCell,lineWidthScale:_,opacity:t.unitCell/100,lineStyle:v,vectors:o.cell.vectors}):null,f.jsx(Wn,{atoms:o.atoms,colorScheme:E,colorOverrides:x,materialFamily:r.polyhedron,opacity:t.polyhedra/100*k,polyhedra:o.polyhedra,lineWidthScale:u}),f.jsx(_n,{bondRenderItems:H,colorMode:m.bondColorMode,materialFamily:r.bond,meshDetail:s,thicknessScale:m.bondThickness/100,opacity:t.bonds/100*k}),S?f.jsxs(f.Fragment,{children:[f.jsx(Le,{atoms:U,colorScheme:E,colorOverrides:x,inspectedAtomId:i,interactionLocked:n,materialFamily:r.atom,meshDetail:s,onInspect:a,onPulse:c,onLockedInteractionAttempt:l,pulseAtomId:d,pulseToken:h,radiusModel:m.atomRadiusModel,radiusScale:m.atomRadius/100,opacity:t.atoms/100}),f.jsx(on,{atoms:le,colorScheme:E,colorOverrides:x,inspectedAtomId:i,interactionLocked:n,materialFamily:r.atom,meshDetail:s,onInspect:a,onPulse:c,onLockedInteractionAttempt:l,radiusModel:m.atomRadiusModel,radiusScale:m.atomRadius/100,opacity:t.atoms/100}),m.vectorGlyphProperty?f.jsx(En,{atoms:o.atoms,materialFamily:r.atom,property:m.vectorGlyphProperty,scalePercent:m.vectorGlyphScale}):null,$.length>0?f.jsx(Le,{atoms:$,colorScheme:E,colorOverrides:x,inspectedAtomId:i,interactionLocked:n,materialFamily:r.atom,meshDetail:s,onInspect:a,onPulse:c,onLockedInteractionAttempt:l,pulseAtomId:d,pulseToken:h,radiusModel:m.atomRadiusModel,radiusScale:m.atomRadius/100,opacity:t.atoms/100*k}):null]}):null]})})}const ft=p.memo(ir),xr={alpha:!0,antialias:!0,preserveDrawingBuffer:!0};function yr({cameraPose:t,componentOpacity:e,exportFramePlan:n,layout:r,materialFamilies:s,meshDetail:o,polyhedronEdgeLineWidthScale:i=1,scene:a,showAtoms:c,showUnitCell:l,style:u,unitCellLineColor:d,unitCellLineStyle:h="solid",unitCellLineWidthScale:S=1}){const{camera:g}=G();return p.useLayoutEffect(()=>{Tt(g,t,r.standardPose.distance,r.span)},[g,t,r.span,r.standardPose.distance]),p.useLayoutEffect(()=>{g instanceof qt&&Pt(g,n)},[g,n]),f.jsxs(f.Fragment,{children:[f.jsx(dt,{layout:r,style:u}),f.jsx(ft,{componentOpacity:e,groupPosition:r.groupPosition,materialFamilies:s,meshDetail:o,polyhedronEdgeLineWidthScale:i,scene:a,showAtoms:c,showUnitCell:l,style:u,unitCellLineColor:d,unitCellLineStyle:h,unitCellLineWidthScale:S})]})}export{pr as B,xr as D,gr as E,ct as L,fr as M,Sr as P,tr as S,hr as a,er as b,yr as c,Dn as d,Nn as e,Fn as f,rr as g,T as h,or as i,Ce as j,Me as k,$t as l,dr as m,st as p,mr as r,bn as t};
