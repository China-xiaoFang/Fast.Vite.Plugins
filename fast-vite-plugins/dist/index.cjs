"use strict";var U=Object.create;var $=Object.defineProperty;var M=Object.getOwnPropertyDescriptor;var O=Object.getOwnPropertyNames;var b=Object.getPrototypeOf,R=Object.prototype.hasOwnProperty;var J=(t,e)=>{for(var n in e)$(t,n,{get:e[n],enumerable:!0})},T=(t,e,n,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let o of O(e))!R.call(t,o)&&o!==n&&$(t,o,{get:()=>e[o],enumerable:!(i=M(e,o))||i.enumerable});return t};var g=(t,e,n)=>(n=t!=null?U(b(t)):{},T(e||!t||!t.__esModule?$(n,"default",{value:t,enumerable:!0}):n,t)),L=t=>T($({},"__esModule",{value:!0}),t);var X={};J(X,{buildSvgIcon:()=>B,cdnImport:()=>z,findSvgFile:()=>w,tsxComponentAutoImport:()=>V,versionUpdatePlugin:()=>G,vueComponentAutoImport:()=>Y,writeTSXIcon:()=>A});module.exports=L(X);var h=g(require("fs"),1),d=g(require("path"),1),w=t=>{let e=[];return h.default.readdirSync(t,{withFileTypes:!0}).forEach(i=>{if(i.isDirectory())e.push(...w(d.default.join(t,i.name)));else{let o=i.name.replace(".svg",""),p=h.default.readFileSync(d.default.join(t,i.name),"utf-8").replace(/<\?xml.*?\?>/,"").replace(/<!DOCTYPE svg.*?>/,"").trimStart().trimEnd().replace(/<svg([^>+].*?)>/,(c,m)=>{let s=m.match(/viewBox="[^"]+"/),r=m.match(/width="(\d+)"/),a=m.match(/height="(\d+)"/),u=1024,l=1024;r&&(u=r[0]),a&&(l=a[0]);let f="";return s?f=s[0]:f=`viewBox="0 0 ${u} ${l}"`,`<svg xmlns="http://www.w3.org/2000/svg" ${f}>`});e.push({iconName:o,componentName:o.charAt(0).toUpperCase()+o.slice(1),iconContent:p})}}),e.sort((i,o)=>i.iconName<o.iconName?-1:i.iconName>o.iconName?1:0)},A=(t,e,n)=>{h.default.mkdirSync(e,{recursive:!0});let i=`import { defineComponent } from "vue";

/**
 * ${t} \u56FE\u6807\u7EC4\u4EF6
 */
export const ${t} = defineComponent({
	name: "${t}",
	render() {
		return (
${n.split(`
`).map(o=>`			${o}`).join(`
`)}
		);
	},
});

export default ${t};
`;h.default.writeFileSync(d.default.join(e,"index.tsx"),i)};function B(t,e){if(!t||!e)return;let n;return{name:"fast-vite-plugin-build-svg-icon",configResolved:i=>{n=i},buildStart(){let i=w(d.default.resolve(n.root,t)),o=d.default.resolve(n.root,e);h.default.mkdirSync(o,{recursive:!0});let p="",c="",m="";i.forEach((s,r)=>{A(s.componentName,d.default.join(o,s.iconName),s.iconContent),p+=`import { ${s.componentName} } from "./${s.iconName}";
`,c+=`	${s.componentName},`,m+=`export * from "./${s.iconName}";
`,r+1<i.length&&(c+=`
`)}),h.default.writeFileSync(d.default.join(o,"index.ts"),`import type { DefineComponent } from "vue";
${p}
${m}
export default [
${c}
] as unknown as DefineComponent[];
`)}}}var N=g(require("fs"),1),j=g(require("path"),1),k=g(require("rollup-plugin-external-globals"),1),E=require("vite-plugin-externals"),H=process.env.NODE_ENV==="development";function W(t){let e=process.cwd(),n=j.default.join(e,"node_modules",t,"package.json");return N.default.existsSync(n)?JSON.parse(N.default.readFileSync(n,"utf8")).version:""}function I(t){return!!(t.startsWith("http:")||t.startsWith("https:")||t.startsWith("//"))}function D(t,e){let{path:n}=e;return I(n)&&(t=n),t.replace(/\{name\}/g,e.name).replace(/\{version\}/g,e.version).replace(/\{path\}/g,n)}function _(t,e){e=t.prodUrl||e;let n=t,i=t.version||W(n.name),o=[];Array.isArray(n.path)?o=n.path:o.push(n.path);let p={...n,version:i};o=o.map(s=>{if(!i&&!I(s))throw new Error(`modules: ${p.name} package.json file does not exist`);return D(e,{name:p.name,version:p.version,path:s})});let c=n.css||[];!Array.isArray(c)&&c&&(c=[c]);let m=Array.isArray(c)?c.map(s=>D(e,{name:p.name,version:p.version,path:s})):[];return{...n,version:i,pathList:o,cssList:m}}function z(t){let{modules:e=[],prodUrl:n="https://cdn.jsdelivr.net/npm/{name}@{version}/{path}",enableInDevMode:i=!1,generateCssLinkTag:o,generateScriptTag:p}=t,c=!1,m=(Array.isArray(e)?e:[e]).map(a=>typeof a=="function"?a(n):a).map(a=>_(a,n)),s={};m.forEach(a=>{s[a.name]=a.var,Array.isArray(a.alias)&&a.alias.forEach(u=>{s[u]=a.var})});let r=[{name:"fast-vite-plugin-cdn-import",enforce:"pre",config(a,{command:u}){c=u==="build";let l={build:{rollupOptions:{plugins:[]}}};return c&&(l.build.rollupOptions.plugins=[(0,k.default)(s)]),l},transformIndexHtml(a){if(!c&&!i)return a;let u=[];return m.forEach(l=>{l.pathList.forEach(f=>{let C=p?.(l.name,f)||{},S={src:f,crossorigin:"anonymous",...l?.attrs??{},...C.attrs};u.push({tag:"script",attrs:S,...C})}),l.cssList.forEach(f=>{let C=o?.(l.name,f)||{},S={href:f,rel:"stylesheet",crossorigin:"anonymous",...l?.attrs??{},...C.attrs};u.push({tag:"link",attrs:S,...C})})}),u}}];return H&&i&&r.push((0,E.viteExternalsPlugin)(s,{enforce:"pre"})),r}var x=g(require("fs"),1),P=g(require("path"),1);function V(t){if(t)return{name:"fast-vite-plugin-tsx-component-auto-import",buildStart(){let e=typeof t=="string"?t:t.dir,n=r=>r.charAt(0).toUpperCase()+r.slice(1),i=typeof t=="string"?n:t.formatter??n,o=x.default.readdirSync(e,{withFileTypes:!0});if(o?.length===0)return;let p=o.filter(r=>r.name!=="index.ts").map(r=>({componentName:i(r.name),fileName:r.name})).sort((r,a)=>r.componentName<a.componentName?-1:r.componentName>a.componentName?1:0),c="",m="",s="";p.forEach(({componentName:r,fileName:a},u)=>{c+=`import { ${r} } from "./${a}";
`,m+=`export * from "./${a}";
`,s+=`	${r},`,u+1<p.length&&(s+=`
`)}),x.default.writeFileSync(P.default.join(e,"index.ts"),`import type { Plugin } from "vue";
${c}
${m}
export default [
${s}
] as Plugin[];
`)}}}function Y(t){if(t)return{name:"fast-vite-plugin-vue-component-auto-import",buildStart(){let e=typeof t=="string"?t:t.dir,n=r=>r.charAt(0).toUpperCase()+r.slice(1),i=typeof t=="string"?n:t.formatter??n,o=x.default.readdirSync(e,{withFileTypes:!0});if(o?.length===0)return;let p=o.filter(r=>r.name!=="index.ts").map(r=>({componentName:i(r.name),fileName:r.name})).sort((r,a)=>r.componentName<a.componentName?-1:r.componentName>a.componentName?1:0),c="",m="",s="";p.forEach(({componentName:r,fileName:a},u)=>{c+=`import ${r} from "./${a}/index.vue";
`,m+=`export * from "./${a}/index.vue";
`,s+=`	${r},`,u+1<p.length&&(s+=`
`)}),x.default.writeFileSync(P.default.join(e,"index.ts"),`import type { DefineComponent } from "vue";
${c}
${m}
export default [
${s}
] as unknown as DefineComponent[];
`)}}}var v=g(require("fs"),1),F=g(require("path"),1);function y(t,e=2){return t.toString().padStart(e,"0")}function Z(t){let e=t.getUTCFullYear(),n=y(t.getUTCMonth()+1),i=y(t.getUTCDate()),o=y(t.getUTCHours()),p=y(t.getUTCMinutes()),c=y(t.getUTCSeconds()),m=y(t.getUTCMilliseconds(),3);return`Z ${e}-${n}-${i} ${o}:${p}:${c}.${m}`}function G(t){let e;return{name:"fast-vite-plugin-version-update",configResolved:n=>{e=n},buildStart(){let i=Z(new Date),o=e.publicDir,p=F.default.join(o,"version.json");v.default.existsSync(o)||v.default.mkdirSync(o);let c=JSON.stringify({version:`v${t}`,dateTime:i},null,4);v.default.writeFileSync(p,c);let m=F.default.join(e.base,"package.json");if(v.default.existsSync(m)){let s=JSON.parse(v.default.readFileSync(m,"utf-8"));s.version=t,v.default.writeFileSync(m,JSON.stringify(s,null,2),"utf-8")}}}}0&&(module.exports={buildSvgIcon,cdnImport,findSvgFile,tsxComponentAutoImport,versionUpdatePlugin,vueComponentAutoImport,writeTSXIcon});
//# sourceMappingURL=index.cjs.map