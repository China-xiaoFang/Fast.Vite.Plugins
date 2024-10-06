"use strict";var E=Object.create;var x=Object.defineProperty;var k=Object.getOwnPropertyDescriptor;var U=Object.getOwnPropertyNames;var M=Object.getPrototypeOf,O=Object.prototype.hasOwnProperty;var b=(t,e)=>{for(var n in e)x(t,n,{get:e[n],enumerable:!0})},F=(t,e,n,s)=>{if(e&&typeof e=="object"||typeof e=="function")for(let o of U(e))!O.call(t,o)&&o!==n&&x(t,o,{get:()=>e[o],enumerable:!(s=k(e,o))||s.enumerable});return t};var g=(t,e,n)=>(n=t!=null?E(M(t)):{},F(e||!t||!t.__esModule?x(n,"default",{value:t,enumerable:!0}):n,t)),R=t=>F(x({},"__esModule",{value:!0}),t);var Z={};b(Z,{buildSvgIcon:()=>J,cdnImport:()=>H,findSvgFile:()=>$,tsxComponentAutoImport:()=>W,versionUpdatePlugin:()=>Y,vueComponentAutoImport:()=>_,writeTSXIcon:()=>T});module.exports=R(Z);var f=g(require("fs"),1),l=g(require("path"),1),$=t=>{let e=[];return f.default.readdirSync(t,{withFileTypes:!0}).forEach(s=>{if(s.isDirectory())e.push(...$(l.default.join(t,s.name)));else{let o=s.name.replace(".svg",""),c=f.default.readFileSync(l.default.join(t,s.name),"utf-8").replace(/<\?xml.*?\?>/,"").replace(/<!DOCTYPE svg.*?>/,"").trimStart().trimEnd().replace(/<svg([^>+].*?)>/,(a,p)=>{let r=p.match(/viewBox="[^"]+"/),i=p.match(/width="(\d+)"/),m=p.match(/height="(\d+)"/),u=1024,h=1024;i&&(u=i[0]),m&&(h=m[0]);let C="";return r?C=r[0]:C=`viewBox="0 0 ${u} ${h}"`,`<svg xmlns="http://www.w3.org/2000/svg" ${C}>`});e.push({iconName:o,componentName:o.charAt(0).toUpperCase()+o.slice(1),iconContent:c})}}),e.sort((s,o)=>s.iconName<o.iconName?-1:s.iconName>o.iconName?1:0)},T=(t,e,n,s)=>{let o=l.default.join(n,"src");f.default.mkdirSync(n,{recursive:!0}),f.default.mkdirSync(o,{recursive:!0});let c=`import { defineComponent } from "vue";

/**
 * ${e} \u56FE\u6807\u7EC4\u4EF6
 */
export default defineComponent({
	name: "${e}",
	render() {
		return (
${s.split(`
`).map(r=>`			${r}`).join(`
`)}
		);
	},
});
`;f.default.writeFileSync(l.default.join(o,`${t}.tsx`),c);let a=`import { withInstall } from "fast-element-plus";
import ${e}TSX from "./src/${t}.tsx";

export const ${e} = withInstall(${e}TSX);
export default ${e};
`;f.default.writeFileSync(l.default.join(n,"index.ts"),a);let p=`import type { TSXWithInstall } from "fast-element-plus";
import type { default as ${e}TSX } from "./src/${t}";

export declare const ${e}: TSXWithInstall<typeof ${e}TSX>;
export default ${e};
`;f.default.writeFileSync(l.default.join(n,"index.d.ts"),p)};function J(t,e){if(!t||!e)return;let n;return{name:"fast-vite-plugin-build-svg-icon",configResolved:s=>{n=s},buildStart(){let s=$(l.default.resolve(n.root,t)),o=l.default.resolve(n.root,e);f.default.mkdirSync(o,{recursive:!0});let c="",a="",p="";s.forEach((r,i)=>{T(r.iconName,r.componentName,l.default.join(o,r.iconName),r.iconContent),c+=`import { ${r.componentName} } from "./${r.iconName}";
`,a+=`	${r.iconName},`,p+=`export * from "./${r.iconName}";
`,i+1<s.length&&(a+=`
`)}),f.default.writeFileSync(l.default.join(o,"index.ts"),`import type { DefineComponent } from "vue";
${c}
${p}
export default [
${a}
] as Plugin[];
`)}}}var S=g(require("fs"),1),j=g(require("path"),1),A=g(require("rollup-plugin-external-globals"),1),I=require("vite-plugin-externals"),X=process.env.NODE_ENV==="development";function L(t){let e=process.cwd(),n=j.default.join(e,"node_modules",t,"package.json");return S.default.existsSync(n)?JSON.parse(S.default.readFileSync(n,"utf8")).version:""}function D(t){return!!(t.startsWith("http:")||t.startsWith("https:")||t.startsWith("//"))}function N(t,e){let{path:n}=e;return D(n)&&(t=n),t.replace(/\{name\}/g,e.name).replace(/\{version\}/g,e.version).replace(/\{path\}/g,n)}function B(t,e){e=t.prodUrl||e;let n=t,s=t.version||L(n.name),o=[];Array.isArray(n.path)?o=n.path:o.push(n.path);let c={...n,version:s};o=o.map(r=>{if(!s&&!D(r))throw new Error(`modules: ${c.name} package.json file does not exist`);return N(e,{name:c.name,version:c.version,path:r})});let a=n.css||[];!Array.isArray(a)&&a&&(a=[a]);let p=Array.isArray(a)?a.map(r=>N(e,{name:c.name,version:c.version,path:r})):[];return{...n,version:s,pathList:o,cssList:p}}function H(t){let{modules:e=[],prodUrl:n="https://cdn.jsdelivr.net/npm/{name}@{version}/{path}",enableInDevMode:s=!1}=t,o=!1,c=(Array.isArray(e)?e:[e]).map(r=>typeof r=="function"?r(n):r).map(r=>B(r,n)),a={};c.forEach(r=>{a[r.name]=r.var,Array.isArray(r.alias)&&r.alias.forEach(i=>{a[i]=r.var})});let p=[{name:"fast-vite-plugin-cdn-import",enforce:"pre",config(r,{command:i}){o=i==="build";let m={build:{rollupOptions:{plugins:[]}}};return o&&(m.build.rollupOptions.plugins=[(0,A.default)(a)]),m},transformIndexHtml(r){if(!o&&!s)return r;let i=[];return c.forEach(m=>{m.pathList.forEach(u=>{let h={src:u,crossorigin:"anonymous",...m?.attrs??{}};i.push({tag:"script",attrs:h})}),m.cssList.forEach(u=>{let h={href:u,rel:"stylesheet",crossorigin:"anonymous",...m?.attrs??{}};i.push({tag:"link",attrs:h})})}),i}}];return X&&s&&p.push((0,I.viteExternalsPlugin)(a,{enforce:"pre"})),p}var y=g(require("fs"),1),w=g(require("path"),1);function W(t){if(t)return{name:"fast-vite-plugin-tsx-component-auto-import",buildStart(){let e=typeof t=="string"?t:t.dir,n=i=>i.charAt(0).toUpperCase()+i.slice(1),s=typeof t=="string"?n:t.formatter??n,o=y.default.readdirSync(e,{withFileTypes:!0});if(o?.length===0)return;let c=o.filter(i=>i.name!=="index.ts").map(i=>({componentName:s(i.name),fileName:i.name})).sort((i,m)=>i.componentName<m.componentName?-1:i.componentName>m.componentName?1:0),a="",p="",r="";c.forEach(({componentName:i,fileName:m},u)=>{a+=`import { ${i} } from "./${m}";
`,p+=`export * from "./${m}";
`,r+=`	${i},`,u+1<c.length&&(r+=`
`)}),y.default.writeFileSync(w.default.join(e,"index.ts"),`import type { Plugin } from "vue";
${a}
${p}
export default [
${r}
] as Plugin[];
`)}}}function _(t){if(t)return{name:"fast-vite-plugin-vue-component-auto-import",buildStart(){let e=typeof t=="string"?t:t.dir,n=i=>i.charAt(0).toUpperCase()+i.slice(1),s=typeof t=="string"?n:t.formatter??n,o=y.default.readdirSync(e,{withFileTypes:!0});if(o?.length===0)return;let c=o.filter(i=>i.name!=="index.ts").map(i=>({componentName:s(i.name),fileName:i.name})).sort((i,m)=>i.componentName<m.componentName?-1:i.componentName>m.componentName?1:0),a="",p="",r="";c.forEach(({componentName:i,fileName:m},u)=>{a+=`import ${i} from "./${m}/index.vue";
`,p+=`export * from "./${m}/index.vue";
`,r+=`	${i},`,u+1<c.length&&(r+=`
`)}),y.default.writeFileSync(w.default.join(e,"index.ts"),`import type { DefineComponent } from "vue";
${a}
${p}
export default [
${r}
] as unknown as DefineComponent[];
`)}}}var d=g(require("fs"),1),P=g(require("path"),1);function v(t,e=2){return t.toString().padStart(e,"0")}function V(t){let e=t.getUTCFullYear(),n=v(t.getUTCMonth()+1),s=v(t.getUTCDate()),o=v(t.getUTCHours()),c=v(t.getUTCMinutes()),a=v(t.getUTCSeconds()),p=v(t.getUTCMilliseconds(),3);return`Z ${e}-${n}-${s} ${o}:${c}:${a}.${p}`}function Y(t){let e;return{name:"fast-vite-plugin-version-update",configResolved:n=>{e=n},buildStart(){let s=V(new Date),o=e.publicDir,c=P.default.join(o,"version.json");d.default.existsSync(o)||d.default.mkdirSync(o);let a=JSON.stringify({version:`v${t}`,dateTime:s},null,4);d.default.writeFileSync(c,a);let p=P.default.join(e.base,"package.json");if(d.default.existsSync(p)){let r=JSON.parse(d.default.readFileSync(p,"utf-8"));r.version=t,d.default.writeFileSync(p,JSON.stringify(r,null,2),"utf-8")}}}}0&&(module.exports={buildSvgIcon,cdnImport,findSvgFile,tsxComponentAutoImport,versionUpdatePlugin,vueComponentAutoImport,writeTSXIcon});
//# sourceMappingURL=index.cjs.map