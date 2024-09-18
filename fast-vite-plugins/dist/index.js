import f from"fs";import l from"path";var x=t=>{let n=[];return f.readdirSync(t,{withFileTypes:!0}).forEach(s=>{if(s.isDirectory())n.push(...x(l.join(t,s.name)));else{let i=s.name.replace(".svg",""),a=f.readFileSync(l.join(t,s.name),"utf-8").replace(/<\?xml.*?\?>/,"").replace(/<!DOCTYPE svg.*?>/,"").trimStart().trimEnd().replace(/<svg([^>+].*?)>/,(c,p)=>{let r=p.match(/viewBox="[^"]+"/),e=p.match(/width="(\d+)"/),m=p.match(/height="(\d+)"/),u=1024,g=1024;e&&(u=e[0]),m&&(g=m[0]);let y="";return r?y=r[0]:y=`viewBox="0 0 ${u} ${g}"`,`<svg xmlns="http://www.w3.org/2000/svg" ${y}>`});n.push({iconName:i,componentName:i.charAt(0).toUpperCase()+i.slice(1),iconContent:a})}}),n.sort((s,i)=>s.iconName<i.iconName?-1:s.iconName>i.iconName?1:0)},P=(t,n,o,s)=>{let i=l.join(o,"src");f.mkdirSync(o,{recursive:!0}),f.mkdirSync(i,{recursive:!0});let a=`import { defineComponent } from "vue";
import { ElIcon } from "element-plus";

/**
 * ${n} \u56FE\u6807\u7EC4\u4EF6
 */
export default defineComponent({
	name: "${n}",
	components: {
		ElIcon,
	},
	setup(_, { attrs }) {
		return {
			attrs,
		};
	},
	render() {
		return (
			<ElIcon {...this.attrs} class="fa-icon fa-icon-${n} icon">
${s.split(`
`).map(r=>`				${r}`).join(`
`)}
			</ElIcon>
		);
	},
});
`;f.writeFileSync(l.join(i,`${t}.tsx`),a);let c=`import { withInstall } from "fast-element-plus";
import ${n}TSX from "./src/${t}.tsx";

export const ${n} = withInstall(${n}TSX);
export default ${n};
`;f.writeFileSync(l.join(o,"index.ts"),c);let p=`import type { TSXWithInstall } from "fast-element-plus";
import type { default as ${n}TSX } from "./src/${t}";

export declare const ${n}: TSXWithInstall<typeof ${n}TSX>;
export default ${n};
`;f.writeFileSync(l.join(o,"index.d.ts"),p)};function U(t,n){if(!t||!n)return;let o;return{name:"fast-vite-plugin-build-svg-icon",configResolved:s=>{o=s},buildStart(){let s=x(l.resolve(o.root,t)),i=l.resolve(o.root,n);f.mkdirSync(i,{recursive:!0});let a="",c="",p="",r="";s.forEach((e,m)=>{P(e.iconName,e.componentName,l.join(i,e.iconName),e.iconContent),a+=`import { ${e.componentName} } from "./${e.iconName}";
`,c+=`	${e.iconName},`,p+=`export * from "./${e.iconName}";
`,r+=`		${e.componentName}: (typeof import("./"))["${e.componentName}"];`,m+1<s.length&&(r+=`
`,c+=`
`)}),f.writeFileSync(l.join(i,"index.ts"),`import type { DefineComponent } from "vue";
${a}
${p}
export default [
${c}
] as Plugin[];
`),f.writeFileSync(l.join(i,"index.d.ts"),`// For this project development
import "@vue/runtime-core";

// GlobalComponents for Volar
declare module "@vue/runtime-core" {
	export interface GlobalComponents {
${r}
	}

	// interface ComponentCustomProperties {}
}

export {};
`)}}}import C from"fs";import T from"path";import I from"rollup-plugin-external-globals";import{viteExternalsPlugin as j}from"vite-plugin-externals";var N=process.env.NODE_ENV==="development";function E(t){let n=process.cwd(),o=T.join(n,"node_modules",t,"package.json");return C.existsSync(o)?JSON.parse(C.readFileSync(o,"utf8")).version:""}function S(t){return!!(t.startsWith("http:")||t.startsWith("https:")||t.startsWith("//"))}function $(t,n){let{path:o}=n;return S(o)&&(t=o),t.replace(/\{name\}/g,n.name).replace(/\{version\}/g,n.version).replace(/\{path\}/g,o)}function A(t,n){n=t.prodUrl||n;let o=t,s=t.version||E(o.name),i=[];Array.isArray(o.path)?i=o.path:i.push(o.path);let a={...o,version:s};i=i.map(r=>{if(!s&&!S(r))throw new Error(`modules: ${a.name} package.json file does not exist`);return $(n,{name:a.name,version:a.version,path:r})});let c=o.css||[];!Array.isArray(c)&&c&&(c=[c]);let p=Array.isArray(c)?c.map(r=>$(n,{name:a.name,version:a.version,path:r})):[];return{...o,version:s,pathList:i,cssList:p}}function L(t){let{modules:n=[],prodUrl:o="https://cdn.jsdelivr.net/npm/{name}@{version}/{path}",enableInDevMode:s=!1}=t,i=!1,a=(Array.isArray(n)?n:[n]).map(r=>typeof r=="function"?r(o):r).map(r=>A(r,o)),c={};a.forEach(r=>{c[r.name]=r.var,Array.isArray(r.alias)&&r.alias.forEach(e=>{c[e]=r.var})});let p=[{name:"fast-vite-plugin-cdn-import",enforce:"pre",config(r,{command:e}){i=e==="build";let m={build:{rollupOptions:{plugins:[]}}};return i&&(m.build.rollupOptions.plugins=[I(c)]),m},transformIndexHtml(r){if(!i&&!s)return r;let e=[];return a.forEach(m=>{m.pathList.forEach(u=>{let g={src:u,crossorigin:"anonymous",...m?.attrs??{}};e.push({tag:"script",attrs:g})}),m.cssList.forEach(u=>{let g={href:u,rel:"stylesheet",crossorigin:"anonymous",...m?.attrs??{}};e.push({tag:"link",attrs:g})})}),e}}];return N&&s&&p.push(j(c,{enforce:"pre"})),p}import v from"fs";import w from"path";function _(t){if(t)return{name:"fast-vite-plugin-tsx-component-auto-import",buildStart(){let n=typeof t=="string"?t:t.dir,o=e=>e.charAt(0).toUpperCase()+e.slice(1),s=typeof t=="string"?o:t.formatter??o,i=v.readdirSync(n,{withFileTypes:!0});if(i?.length===0)return;let a=i.filter(e=>e.name!=="index.ts").map(e=>({componentName:s(e.name),fileName:e.name})).sort((e,m)=>e.componentName<m.componentName?-1:e.componentName>m.componentName?1:0),c="",p="",r="";a.forEach(({componentName:e,fileName:m},u)=>{c+=`import { ${e} } from "./${m}";
`,p+=`export * from "./${m}";
`,r+=`	${e},`,u+1<a.length&&(r+=`
`)}),v.writeFileSync(w.join(n,"index.ts"),`import type { Plugin } from "vue";
${c}
${p}
export default [
${r}
] as Plugin[];
`)}}}function G(t){if(t)return{name:"fast-vite-plugin-vue-component-auto-import",buildStart(){let n=typeof t=="string"?t:t.dir,o=e=>e.charAt(0).toUpperCase()+e.slice(1),s=typeof t=="string"?o:t.formatter??o,i=v.readdirSync(n,{withFileTypes:!0});if(i?.length===0)return;let a=i.filter(e=>e.name!=="index.ts").map(e=>({componentName:s(e.name),fileName:e.name})).sort((e,m)=>e.componentName<m.componentName?-1:e.componentName>m.componentName?1:0),c="",p="",r="";a.forEach(({componentName:e,fileName:m},u)=>{c+=`import ${e} from "./${m}/index.vue";
`,p+=`export * from "./${m}/index.vue";
`,r+=`	${e},`,u+1<a.length&&(r+=`
`)}),v.writeFileSync(w.join(n,"index.ts"),`import type { DefineComponent } from "vue";
${c}
${p}
export default [
${r}
] as unknown as DefineComponent[];
`)}}}import d from"fs";import F from"path";function h(t,n=2){return t.toString().padStart(n,"0")}function D(t){let n=t.getUTCFullYear(),o=h(t.getUTCMonth()+1),s=h(t.getUTCDate()),i=h(t.getUTCHours()),a=h(t.getUTCMinutes()),c=h(t.getUTCSeconds()),p=h(t.getUTCMilliseconds(),3);return`Z ${n}-${o}-${s} ${i}:${a}:${c}.${p}`}function q(t){let n;return{name:"fast-vite-plugin-version-update",configResolved:o=>{n=o},buildStart(){let s=D(new Date),i=n.publicDir,a=F.join(i,"version.json");d.existsSync(i)||d.mkdirSync(i);let c=JSON.stringify({version:`v${t}`,dateTime:s},null,4);d.writeFileSync(a,c);let p=F.join(n.base,"package.json");if(d.existsSync(p)){let r=JSON.parse(d.readFileSync(p,"utf-8"));r.version=t,d.writeFileSync(p,JSON.stringify(r,null,2),"utf-8")}}}}export{U as buildSvgIcon,L as cdnImport,x as findSvgFile,_ as tsxComponentAutoImport,q as versionUpdatePlugin,G as vueComponentAutoImport,P as writeTSXIcon};
//# sourceMappingURL=index.js.map