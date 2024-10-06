import f from"fs";import u from"path";var x=t=>{let e=[];return f.readdirSync(t,{withFileTypes:!0}).forEach(s=>{if(s.isDirectory())e.push(...x(u.join(t,s.name)));else{let i=s.name.replace(".svg",""),c=f.readFileSync(u.join(t,s.name),"utf-8").replace(/<\?xml.*?\?>/,"").replace(/<!DOCTYPE svg.*?>/,"").trimStart().trimEnd().replace(/<svg([^>+].*?)>/,(a,p)=>{let n=p.match(/viewBox="[^"]+"/),r=p.match(/width="(\d+)"/),m=p.match(/height="(\d+)"/),l=1024,g=1024;r&&(l=r[0]),m&&(g=m[0]);let y="";return n?y=n[0]:y=`viewBox="0 0 ${l} ${g}"`,`<svg xmlns="http://www.w3.org/2000/svg" ${y}>`});e.push({iconName:i,componentName:i.charAt(0).toUpperCase()+i.slice(1),iconContent:c})}}),e.sort((s,i)=>s.iconName<i.iconName?-1:s.iconName>i.iconName?1:0)},F=(t,e,o,s)=>{let i=u.join(o,"src");f.mkdirSync(o,{recursive:!0}),f.mkdirSync(i,{recursive:!0});let c=`import { defineComponent } from "vue";

/**
 * ${e} \u56FE\u6807\u7EC4\u4EF6
 */
export default defineComponent({
	name: "${e}",
	render() {
		return (
${s.split(`
`).map(n=>`			${n}`).join(`
`)}
		);
	},
});
`;f.writeFileSync(u.join(i,`${t}.tsx`),c);let a=`import { withInstall } from "fast-element-plus";
import ${e}TSX from "./src/${t}.tsx";

export const ${e} = withInstall(${e}TSX);
export default ${e};
`;f.writeFileSync(u.join(o,"index.ts"),a);let p=`import type { TSXWithInstall } from "fast-element-plus";
import type { default as ${e}TSX } from "./src/${t}";

export declare const ${e}: TSXWithInstall<typeof ${e}TSX>;
export default ${e};
`;f.writeFileSync(u.join(o,"index.d.ts"),p)};function M(t,e){if(!t||!e)return;let o;return{name:"fast-vite-plugin-build-svg-icon",configResolved:s=>{o=s},buildStart(){let s=x(u.resolve(o.root,t)),i=u.resolve(o.root,e);f.mkdirSync(i,{recursive:!0});let c="",a="",p="";s.forEach((n,r)=>{F(n.iconName,n.componentName,u.join(i,n.iconName),n.iconContent),c+=`import { ${n.componentName} } from "./${n.iconName}";
`,a+=`	${n.iconName},`,p+=`export * from "./${n.iconName}";
`,r+1<s.length&&(a+=`
`)}),f.writeFileSync(u.join(i,"index.ts"),`import type { DefineComponent } from "vue";
${c}
${p}
export default [
${a}
] as Plugin[];
`)}}}import $ from"fs";import T from"path";import N from"rollup-plugin-external-globals";import{viteExternalsPlugin as j}from"vite-plugin-externals";var A=process.env.NODE_ENV==="development";function I(t){let e=process.cwd(),o=T.join(e,"node_modules",t,"package.json");return $.existsSync(o)?JSON.parse($.readFileSync(o,"utf8")).version:""}function S(t){return!!(t.startsWith("http:")||t.startsWith("https:")||t.startsWith("//"))}function C(t,e){let{path:o,version:s}=e;return S(o)&&(t=o),s?t.replace(/\{name\}/g,e.name).replace(/\{version\}/g,`@${s}`).replace(/\{path\}/g,o):t.replace(/\{name\}/g,e.name).replace(/\{path\}/g,`@${o}`)}function D(t,e){e=t.prodUrl||e;let o=t,s=t.version||I(o.name),i=[];Array.isArray(o.path)?i=o.path:i.push(o.path);let c={...o,version:s};i=i.map(n=>{if(!s&&!S(n))throw new Error(`modules: ${c.name} package.json file does not exist`);return C(e,{name:c.name,version:c.version,path:n})});let a=o.css||[];!Array.isArray(a)&&a&&(a=[a]);let p=Array.isArray(a)?a.map(n=>C(e,{name:c.name,version:c.version,path:n})):[];return{...o,version:s,pathList:i,cssList:p}}function L(t){let{modules:e=[],prodUrl:o="https://cdn.jsdelivr.net/npm/{name}{version}/{path}",enableInDevMode:s=!1}=t,i=!1,c=(Array.isArray(e)?e:[e]).map(n=>typeof n=="function"?n(o):n).map(n=>D(n,o)),a={};c.forEach(n=>{a[n.name]=n.var,Array.isArray(n.alias)&&n.alias.forEach(r=>{a[r]=n.var})});let p=[{name:"fast-vite-plugin-cdn-import",enforce:"pre",config(n,{command:r}){i=r==="build";let m={build:{rollupOptions:{plugins:[]}}};return i&&(m.build.rollupOptions.plugins=[N(a)]),m},transformIndexHtml(n){if(!i&&!s)return n;let r=[];return c.forEach(m=>{m.pathList.forEach(l=>{let g={src:l,crossorigin:"anonymous",...m?.attrs??{}};r.push({tag:"script",attrs:g})}),m.cssList.forEach(l=>{let g={href:l,rel:"stylesheet",crossorigin:"anonymous",...m?.attrs??{}};r.push({tag:"link",attrs:g})})}),r}}];return A&&s&&p.push(j(a,{enforce:"pre"})),p}import v from"fs";import w from"path";function _(t){if(t)return{name:"fast-vite-plugin-tsx-component-auto-import",buildStart(){let e=typeof t=="string"?t:t.dir,o=r=>r.charAt(0).toUpperCase()+r.slice(1),s=typeof t=="string"?o:t.formatter??o,i=v.readdirSync(e,{withFileTypes:!0});if(i?.length===0)return;let c=i.filter(r=>r.name!=="index.ts").map(r=>({componentName:s(r.name),fileName:r.name})).sort((r,m)=>r.componentName<m.componentName?-1:r.componentName>m.componentName?1:0),a="",p="",n="";c.forEach(({componentName:r,fileName:m},l)=>{a+=`import { ${r} } from "./${m}";
`,p+=`export * from "./${m}";
`,n+=`	${r},`,l+1<c.length&&(n+=`
`)}),v.writeFileSync(w.join(e,"index.ts"),`import type { Plugin } from "vue";
${a}
${p}
export default [
${n}
] as Plugin[];
`)}}}function V(t){if(t)return{name:"fast-vite-plugin-vue-component-auto-import",buildStart(){let e=typeof t=="string"?t:t.dir,o=r=>r.charAt(0).toUpperCase()+r.slice(1),s=typeof t=="string"?o:t.formatter??o,i=v.readdirSync(e,{withFileTypes:!0});if(i?.length===0)return;let c=i.filter(r=>r.name!=="index.ts").map(r=>({componentName:s(r.name),fileName:r.name})).sort((r,m)=>r.componentName<m.componentName?-1:r.componentName>m.componentName?1:0),a="",p="",n="";c.forEach(({componentName:r,fileName:m},l)=>{a+=`import ${r} from "./${m}/index.vue";
`,p+=`export * from "./${m}/index.vue";
`,n+=`	${r},`,l+1<c.length&&(n+=`
`)}),v.writeFileSync(w.join(e,"index.ts"),`import type { DefineComponent } from "vue";
${a}
${p}
export default [
${n}
] as unknown as DefineComponent[];
`)}}}import d from"fs";import P from"path";function h(t,e=2){return t.toString().padStart(e,"0")}function E(t){let e=t.getUTCFullYear(),o=h(t.getUTCMonth()+1),s=h(t.getUTCDate()),i=h(t.getUTCHours()),c=h(t.getUTCMinutes()),a=h(t.getUTCSeconds()),p=h(t.getUTCMilliseconds(),3);return`Z ${e}-${o}-${s} ${i}:${c}:${a}.${p}`}function q(t){let e;return{name:"fast-vite-plugin-version-update",configResolved:o=>{e=o},buildStart(){let s=E(new Date),i=e.publicDir,c=P.join(i,"version.json");d.existsSync(i)||d.mkdirSync(i);let a=JSON.stringify({version:`v${t}`,dateTime:s},null,4);d.writeFileSync(c,a);let p=P.join(e.base,"package.json");if(d.existsSync(p)){let n=JSON.parse(d.readFileSync(p,"utf-8"));n.version=t,d.writeFileSync(p,JSON.stringify(n,null,2),"utf-8")}}}}export{M as buildSvgIcon,L as cdnImport,x as findSvgFile,_ as tsxComponentAutoImport,q as versionUpdatePlugin,V as vueComponentAutoImport,F as writeTSXIcon};
//# sourceMappingURL=index.js.map