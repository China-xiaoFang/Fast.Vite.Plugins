"use strict";var M=Object.create;var $=Object.defineProperty;var O=Object.getOwnPropertyDescriptor;var b=Object.getOwnPropertyNames;var J=Object.getPrototypeOf,R=Object.prototype.hasOwnProperty;var L=(t,n)=>{for(var e in n)$(t,e,{get:n[e],enumerable:!0})},D=(t,n,e,i)=>{if(n&&typeof n=="object"||typeof n=="function")for(let o of b(n))!R.call(t,o)&&o!==e&&$(t,o,{get:()=>n[o],enumerable:!(i=O(n,o))||i.enumerable});return t};var g=(t,n,e)=>(e=t!=null?M(J(t)):{},D(n||!t||!t.__esModule?$(e,"default",{value:t,enumerable:!0}):e,t)),B=t=>D($({},"__esModule",{value:!0}),t);var K={};L(K,{buildSvgIcon:()=>H,cdnImport:()=>Y,cdnJsDelivrUrl:()=>I,cdnUnpkgUrl:()=>V,findSvgFile:()=>w,tsxComponentAutoImport:()=>Z,versionUpdatePlugin:()=>q,vueComponentAutoImport:()=>G,writeTSXIcon:()=>T});module.exports=B(K);var h=g(require("fs"),1),d=g(require("path"),1),w=t=>{let n=[];return h.default.readdirSync(t,{withFileTypes:!0}).forEach(i=>{if(i.isDirectory())n.push(...w(d.default.join(t,i.name)));else{let o=i.name.replace(".svg",""),p=h.default.readFileSync(d.default.join(t,i.name),"utf-8").replace(/<\?xml.*?\?>/,"").replace(/<!DOCTYPE svg.*?>/,"").trimStart().trimEnd().replace(/<svg([^>+].*?)>/,(c,m)=>{let s=m.match(/viewBox="[^"]+"/),r=m.match(/width="(\d+)"/),a=m.match(/height="(\d+)"/),l=1024,u=1024;r&&(l=r[0]),a&&(u=a[0]);let f="";return s?f=s[0]:f=`viewBox="0 0 ${l} ${u}"`,`<svg xmlns="http://www.w3.org/2000/svg" ${f}>`});n.push({iconName:o,componentName:o.charAt(0).toUpperCase()+o.slice(1),iconContent:p})}}),n.sort((i,o)=>i.iconName<o.iconName?-1:i.iconName>o.iconName?1:0)},T=(t,n,e)=>{h.default.mkdirSync(n,{recursive:!0});let i=`import { defineComponent } from "vue";

/**
 * ${t} \u56FE\u6807\u7EC4\u4EF6
 */
export const ${t} = defineComponent({
	name: "${t}",
	render() {
		return (
${e.split(`
`).map(o=>`			${o}`).join(`
`)}
		);
	},
});

export default ${t};
`;h.default.writeFileSync(d.default.join(n,"index.tsx"),i)};function H(t,n){if(!t||!n)return;let e;return{name:"fast-vite-plugin-build-svg-icon",configResolved:i=>{e=i},buildStart(){let i=w(d.default.resolve(e.root,t)),o=d.default.resolve(e.root,n);h.default.mkdirSync(o,{recursive:!0});let p="",c="",m="";i.forEach((s,r)=>{T(s.componentName,d.default.join(o,s.iconName),s.iconContent),p+=`import { ${s.componentName} } from "./${s.iconName}";
`,c+=`	${s.componentName},`,m+=`export * from "./${s.iconName}";
`,r+1<i.length&&(c+=`
`)}),h.default.writeFileSync(d.default.join(o,"index.ts"),`import type { DefineComponent } from "vue";
${p}
${m}
export default [
${c}
] as unknown as DefineComponent[];
`)}}}var N=g(require("fs"),1),A=g(require("path"),1),U=g(require("rollup-plugin-external-globals"),1),j=require("vite-plugin-externals"),W=process.env.NODE_ENV==="development";function _(t){let n=process.cwd(),e=A.default.join(n,"node_modules",t,"package.json");return N.default.existsSync(e)?JSON.parse(N.default.readFileSync(e,"utf8")).version:""}function E(t){return!!(t.startsWith("http:")||t.startsWith("https:")||t.startsWith("//"))}function k(t,n){let{path:e}=n;return E(e)&&(t=e),t.replace(/\{name\}/g,n.name).replace(/\{version\}/g,n.version).replace(/\{path\}/g,e)}function z(t,n){n=t.prodUrl||n;let e=t,i=t.version||_(e.name),o=[];Array.isArray(e.path)?o=e.path:o.push(e.path);let p={...e,version:i};o=o.map(s=>{if(!i&&!E(s))throw new Error(`modules: ${p.name} package.json file does not exist`);return k(n,{name:p.name,version:p.version,path:s})});let c=e.css||[];!Array.isArray(c)&&c&&(c=[c]);let m=Array.isArray(c)?c.map(s=>k(n,{name:p.name,version:p.version,path:s})):[];return{...e,version:i,pathList:o,cssList:m}}var I="https://cdn.jsdelivr.net/npm/{name}@{version}/{path}",V="https://unpkg.com/{package}@{version}/{path}";function Y(t){let{modules:n=[],prodUrl:e=I,enableInDevMode:i=!1,generateCssLinkTag:o,generateScriptTag:p}=t,c=!1,m=(Array.isArray(n)?n:[n]).map(a=>typeof a=="function"?a(e):a).map(a=>z(a,e)),s={};m.forEach(a=>{s[a.name]=a.var,Array.isArray(a.alias)&&a.alias.forEach(l=>{s[l]=a.var})});let r=[{name:"fast-vite-plugin-cdn-import",enforce:"pre",config(a,{command:l}){c=l==="build";let u={build:{rollupOptions:{plugins:[]}}};return c&&(u.build.rollupOptions.plugins=[(0,U.default)(s)]),u},transformIndexHtml(a){if(!c&&!i)return a;let l=[];return m.forEach(u=>{u.pathList.forEach(f=>{let C=p?.(u.name,f)||{},S={src:f,crossorigin:"anonymous",...u?.attrs??{},...C.attrs};l.push({tag:"script",attrs:S,...C})}),u.cssList.forEach(f=>{let C=o?.(u.name,f)||{},S={href:f,rel:"stylesheet",crossorigin:"anonymous",...u?.attrs??{},...C.attrs};l.push({tag:"link",attrs:S,...C})})}),l}}];return W&&i&&r.push((0,j.viteExternalsPlugin)(s,{enforce:"pre"})),r}var x=g(require("fs"),1),P=g(require("path"),1);function Z(t){if(t)return{name:"fast-vite-plugin-tsx-component-auto-import",buildStart(){let n=typeof t=="string"?t:t.dir,e=r=>r.charAt(0).toUpperCase()+r.slice(1),i=typeof t=="string"?e:t.formatter??e,o=x.default.readdirSync(n,{withFileTypes:!0});if(o?.length===0)return;let p=o.filter(r=>r.name!=="index.ts").map(r=>({componentName:i(r.name),fileName:r.name})).sort((r,a)=>r.componentName<a.componentName?-1:r.componentName>a.componentName?1:0),c="",m="",s="";p.forEach(({componentName:r,fileName:a},l)=>{c+=`import { ${r} } from "./${a}";
`,m+=`export * from "./${a}";
`,s+=`	${r},`,l+1<p.length&&(s+=`
`)}),x.default.writeFileSync(P.default.join(n,"index.ts"),`import type { Plugin } from "vue";
${c}
${m}
export default [
${s}
] as Plugin[];
`)}}}function G(t){if(t)return{name:"fast-vite-plugin-vue-component-auto-import",buildStart(){let n=typeof t=="string"?t:t.dir,e=r=>r.charAt(0).toUpperCase()+r.slice(1),i=typeof t=="string"?e:t.formatter??e,o=x.default.readdirSync(n,{withFileTypes:!0});if(o?.length===0)return;let p=o.filter(r=>r.name!=="index.ts").map(r=>({componentName:i(r.name),fileName:r.name})).sort((r,a)=>r.componentName<a.componentName?-1:r.componentName>a.componentName?1:0),c="",m="",s="";p.forEach(({componentName:r,fileName:a},l)=>{c+=`import ${r} from "./${a}/index.vue";
`,m+=`export * from "./${a}/index.vue";
`,s+=`	${r},`,l+1<p.length&&(s+=`
`)}),x.default.writeFileSync(P.default.join(n,"index.ts"),`import type { DefineComponent } from "vue";
${c}
${m}
export default [
${s}
] as unknown as DefineComponent[];
`)}}}var v=g(require("fs"),1),F=g(require("path"),1);function y(t,n=2){return t.toString().padStart(n,"0")}function X(t){let n=t.getUTCFullYear(),e=y(t.getUTCMonth()+1),i=y(t.getUTCDate()),o=y(t.getUTCHours()),p=y(t.getUTCMinutes()),c=y(t.getUTCSeconds()),m=y(t.getUTCMilliseconds(),3);return`Z ${n}-${e}-${i} ${o}:${p}:${c}.${m}`}function q(t){let n;return{name:"fast-vite-plugin-version-update",configResolved:e=>{n=e},buildStart(){let i=X(new Date),o=n.publicDir,p=F.default.join(o,"version.json");v.default.existsSync(o)||v.default.mkdirSync(o);let c=JSON.stringify({version:`v${t}`,dateTime:i},null,4);v.default.writeFileSync(p,c);let m=F.default.join(n.base,"package.json");if(v.default.existsSync(m)){let s=JSON.parse(v.default.readFileSync(m,"utf-8"));s.version=t,v.default.writeFileSync(m,JSON.stringify(s,null,2),"utf-8")}}}}0&&(module.exports={buildSvgIcon,cdnImport,cdnJsDelivrUrl,cdnUnpkgUrl,findSvgFile,tsxComponentAutoImport,versionUpdatePlugin,vueComponentAutoImport,writeTSXIcon});
//# sourceMappingURL=index.cjs.map