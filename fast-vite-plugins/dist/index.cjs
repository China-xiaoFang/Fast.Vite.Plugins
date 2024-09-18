"use strict";var D=Object.create;var x=Object.defineProperty;var b=Object.getOwnPropertyDescriptor;var k=Object.getOwnPropertyNames;var U=Object.getPrototypeOf,M=Object.prototype.hasOwnProperty;var O=(t,e)=>{for(var r in e)x(t,r,{get:e[r],enumerable:!0})},P=(t,e,r,s)=>{if(e&&typeof e=="object"||typeof e=="function")for(let o of k(e))!M.call(t,o)&&o!==r&&x(t,o,{get:()=>e[o],enumerable:!(s=b(e,o))||s.enumerable});return t};var g=(t,e,r)=>(r=t!=null?D(U(t)):{},P(e||!t||!t.__esModule?x(r,"default",{value:t,enumerable:!0}):r,t)),R=t=>P(x({},"__esModule",{value:!0}),t);var Y={};O(Y,{buildSvgIcon:()=>J,cdnImport:()=>H,findSvgFile:()=>$,tsxComponentAutoImport:()=>W,versionUpdatePlugin:()=>V,vueComponentAutoImport:()=>_,writeTSXIcon:()=>T});module.exports=R(Y);var u=g(require("fs"),1),l=g(require("path"),1),$=t=>{let e=[];return u.default.readdirSync(t,{withFileTypes:!0}).forEach(s=>{if(s.isDirectory())e.push(...$(l.default.join(t,s.name)));else{let o=s.name.replace(".svg",""),a=u.default.readFileSync(l.default.join(t,s.name),"utf-8").replace(/<\?xml.*?\?>/,"").replace(/<!DOCTYPE svg.*?>/,"").trimStart().trimEnd().replace(/<svg([^>+].*?)>/,(c,p)=>{let i=p.match(/viewBox="[^"]+"/),n=p.match(/width="(\d+)"/),m=p.match(/height="(\d+)"/),f=1024,h=1024;n&&(f=n[0]),m&&(h=m[0]);let C="";return i?C=i[0]:C=`viewBox="0 0 ${f} ${h}"`,`<svg xmlns="http://www.w3.org/2000/svg" ${C}>`});e.push({iconName:o,componentName:o.charAt(0).toUpperCase()+o.slice(1),iconContent:a})}}),e.sort((s,o)=>s.iconName<o.iconName?-1:s.iconName>o.iconName?1:0)},T=(t,e,r,s)=>{let o=l.default.join(r,"src");u.default.mkdirSync(r,{recursive:!0}),u.default.mkdirSync(o,{recursive:!0});let a=`import { defineComponent } from "vue";
import { ElIcon } from "element-plus";

/**
 * ${e} \u56FE\u6807\u7EC4\u4EF6
 */
export default defineComponent({
	name: "${e}",
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
			<ElIcon {...this.attrs} class="fa-icon fa-icon-${e} icon">
${s.split(`
`).map(i=>`				${i}`).join(`
`)}
			</ElIcon>
		);
	},
});
`;u.default.writeFileSync(l.default.join(o,`${t}.tsx`),a);let c=`import { withInstall } from "fast-element-plus";
import ${e}TSX from "./src/${t}.tsx";

export const ${e} = withInstall(${e}TSX);
export default ${e};
`;u.default.writeFileSync(l.default.join(r,"index.ts"),c);let p=`import type { TSXWithInstall } from "fast-element-plus";
import type { default as ${e}TSX } from "./src/${t}";

export declare const ${e}: TSXWithInstall<typeof ${e}TSX>;
export default ${e};
`;u.default.writeFileSync(l.default.join(r,"index.d.ts"),p)};function J(t,e){if(!t||!e)return;let r;return{name:"fast-vite-plugin-build-svg-icon",configResolved:s=>{r=s},buildStart(){let s=$(l.default.resolve(r.root,t)),o=l.default.resolve(r.root,e);u.default.mkdirSync(o,{recursive:!0});let a="",c="",p="",i="";s.forEach((n,m)=>{T(n.iconName,n.componentName,l.default.join(o,n.iconName),n.iconContent),a+=`import { ${n.componentName} } from "./${n.iconName}";
`,c+=`	${n.iconName},`,p+=`export * from "./${n.iconName}";
`,i+=`		${n.componentName}: (typeof import("./"))["${n.componentName}"];`,m+1<s.length&&(i+=`
`,c+=`
`)}),u.default.writeFileSync(l.default.join(o,"index.ts"),`import type { DefineComponent } from "vue";
${a}
${p}
export default [
${c}
] as Plugin[];
`),u.default.writeFileSync(l.default.join(o,"index.d.ts"),`// For this project development
import "@vue/runtime-core";

// GlobalComponents for Volar
declare module "@vue/runtime-core" {
	export interface GlobalComponents {
${i}
	}

	// interface ComponentCustomProperties {}
}

export {};
`)}}}var S=g(require("fs"),1),j=g(require("path"),1),N=g(require("rollup-plugin-external-globals"),1),E=require("vite-plugin-externals"),X=process.env.NODE_ENV==="development";function L(t){let e=process.cwd(),r=j.default.join(e,"node_modules",t,"package.json");return S.default.existsSync(r)?JSON.parse(S.default.readFileSync(r,"utf8")).version:""}function A(t){return!!(t.startsWith("http:")||t.startsWith("https:")||t.startsWith("//"))}function I(t,e){let{path:r}=e;return A(r)&&(t=r),t.replace(/\{name\}/g,e.name).replace(/\{version\}/g,e.version).replace(/\{path\}/g,r)}function B(t,e){e=t.prodUrl||e;let r=t,s=t.version||L(r.name),o=[];Array.isArray(r.path)?o=r.path:o.push(r.path);let a={...r,version:s};o=o.map(i=>{if(!s&&!A(i))throw new Error(`modules: ${a.name} package.json file does not exist`);return I(e,{name:a.name,version:a.version,path:i})});let c=r.css||[];!Array.isArray(c)&&c&&(c=[c]);let p=Array.isArray(c)?c.map(i=>I(e,{name:a.name,version:a.version,path:i})):[];return{...r,version:s,pathList:o,cssList:p}}function H(t){let{modules:e=[],prodUrl:r="https://cdn.jsdelivr.net/npm/{name}@{version}/{path}",enableInDevMode:s=!1}=t,o=!1,a=(Array.isArray(e)?e:[e]).map(i=>typeof i=="function"?i(r):i).map(i=>B(i,r)),c={};a.forEach(i=>{c[i.name]=i.var,Array.isArray(i.alias)&&i.alias.forEach(n=>{c[n]=i.var})});let p=[{name:"fast-vite-plugin-cdn-import",enforce:"pre",config(i,{command:n}){o=n==="build";let m={build:{rollupOptions:{plugins:[]}}};return o&&(m.build.rollupOptions.plugins=[(0,N.default)(c)]),m},transformIndexHtml(i){if(!o&&!s)return i;let n=[];return a.forEach(m=>{m.pathList.forEach(f=>{let h={src:f,crossorigin:"anonymous",...m?.attrs??{}};n.push({tag:"script",attrs:h})}),m.cssList.forEach(f=>{let h={href:f,rel:"stylesheet",crossorigin:"anonymous",...m?.attrs??{}};n.push({tag:"link",attrs:h})})}),n}}];return X&&s&&p.push((0,E.viteExternalsPlugin)(c,{enforce:"pre"})),p}var y=g(require("fs"),1),w=g(require("path"),1);function W(t){if(t)return{name:"fast-vite-plugin-tsx-component-auto-import",buildStart(){let e=typeof t=="string"?t:t.dir,r=n=>n.charAt(0).toUpperCase()+n.slice(1),s=typeof t=="string"?r:t.formatter??r,o=y.default.readdirSync(e,{withFileTypes:!0});if(o?.length===0)return;let a=o.filter(n=>n.name!=="index.ts").map(n=>({componentName:s(n.name),fileName:n.name})).sort((n,m)=>n.componentName<m.componentName?-1:n.componentName>m.componentName?1:0),c="",p="",i="";a.forEach(({componentName:n,fileName:m},f)=>{c+=`import { ${n} } from "./${m}";
`,p+=`export * from "./${m}";
`,i+=`	${n},`,f+1<a.length&&(i+=`
`)}),y.default.writeFileSync(w.default.join(e,"index.ts"),`import type { Plugin } from "vue";
${c}
${p}
export default [
${i}
] as Plugin[];
`)}}}function _(t){if(t)return{name:"fast-vite-plugin-vue-component-auto-import",buildStart(){let e=typeof t=="string"?t:t.dir,r=n=>n.charAt(0).toUpperCase()+n.slice(1),s=typeof t=="string"?r:t.formatter??r,o=y.default.readdirSync(e,{withFileTypes:!0});if(o?.length===0)return;let a=o.filter(n=>n.name!=="index.ts").map(n=>({componentName:s(n.name),fileName:n.name})).sort((n,m)=>n.componentName<m.componentName?-1:n.componentName>m.componentName?1:0),c="",p="",i="";a.forEach(({componentName:n,fileName:m},f)=>{c+=`import ${n} from "./${m}/index.vue";
`,p+=`export * from "./${m}/index.vue";
`,i+=`	${n},`,f+1<a.length&&(i+=`
`)}),y.default.writeFileSync(w.default.join(e,"index.ts"),`import type { DefineComponent } from "vue";
${c}
${p}
export default [
${i}
] as unknown as DefineComponent[];
`)}}}var d=g(require("fs"),1),F=g(require("path"),1);function v(t,e=2){return t.toString().padStart(e,"0")}function G(t){let e=t.getUTCFullYear(),r=v(t.getUTCMonth()+1),s=v(t.getUTCDate()),o=v(t.getUTCHours()),a=v(t.getUTCMinutes()),c=v(t.getUTCSeconds()),p=v(t.getUTCMilliseconds(),3);return`Z ${e}-${r}-${s} ${o}:${a}:${c}.${p}`}function V(t){let e;return{name:"fast-vite-plugin-version-update",configResolved:r=>{e=r},buildStart(){let s=G(new Date),o=e.publicDir,a=F.default.join(o,"version.json");d.default.existsSync(o)||d.default.mkdirSync(o);let c=JSON.stringify({version:`v${t}`,dateTime:s},null,4);d.default.writeFileSync(a,c);let p=F.default.join(e.base,"package.json");if(d.default.existsSync(p)){let i=JSON.parse(d.default.readFileSync(p,"utf-8"));i.version=t,d.default.writeFileSync(p,JSON.stringify(i,null,2),"utf-8")}}}}0&&(module.exports={buildSvgIcon,cdnImport,findSvgFile,tsxComponentAutoImport,versionUpdatePlugin,vueComponentAutoImport,writeTSXIcon});
//# sourceMappingURL=index.cjs.map