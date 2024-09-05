"use strict";var T=Object.create;var y=Object.defineProperty;var k=Object.getOwnPropertyDescriptor;var j=Object.getOwnPropertyNames;var M=Object.getPrototypeOf,U=Object.prototype.hasOwnProperty;var b=(t,n)=>{for(var e in n)y(t,e,{get:n[e],enumerable:!0})},w=(t,n,e,i)=>{if(n&&typeof n=="object"||typeof n=="function")for(let r of j(n))!U.call(t,r)&&r!==e&&y(t,r,{get:()=>n[r],enumerable:!(i=k(n,r))||i.enumerable});return t};var m=(t,n,e)=>(e=t!=null?T(M(t)):{},w(n||!t||!t.__esModule?y(e,"default",{value:t,enumerable:!0}):e,t)),O=t=>w(y({},"__esModule",{value:!0}),t);var Z={};b(Z,{buildSvgIcon:()=>J,cdnImport:()=>W,componentAutoImport:()=>_,versionUpdatePlugin:()=>Y});module.exports=O(Z);var g=m(require("fs"),1),u=m(require("path"),1);function P(t){let n=[];return g.default.readdirSync(t,{withFileTypes:!0}).forEach(i=>{if(i.isDirectory())n.push(...P(u.default.join(t,i.name)));else{let r=i.name.replace(".svg",""),l=g.default.readFileSync(u.default.join(t,i.name)).toString().replace(/<\?xml.*?\?>/,"").replace(/<!DOCTYPE svg.*?>/,"").replace(/(\r)|(\n)/g,"").replace(/<svg([^>+].*?)>/,(c,p)=>{let o=p.match(/viewBox="[^"]+"/),s=p.match(/width="(\d+)"/),a=p.match(/height="(\d+)"/),f=1024,h=1024;s&&(f=s[0]),a&&(h=a[0]);let C="";return o?C=o[0]:C=`viewBox="0 0 ${f} ${h}"`,`<svg xmlns="http://www.w3.org/2000/svg" ${C}>`});n.push({iconName:r.charAt(0).toUpperCase()+r.slice(1),iconContent:l})}}),n.sort((i,r)=>i.iconName<r.iconName?-1:i.iconName>r.iconName?1:0)}function R(t,n,e){g.default.mkdirSync(n,{recursive:!0});let i=`import { defineComponent } from "vue";
import { ElIcon } from "element-plus";

/**
 * ${t} \u56FE\u6807\u7EC4\u4EF6
 */
export const ${t} = defineComponent({
	name: "${t}",
	components: {
		ElIcon,
	},
	setup(props, { attrs, slots, emit, expose }) {
		expose({});

		return {
			attrs,
			slots,
		};
	},
	render() {
		return (
			<ElIcon {...this.attrs} class="el-icon icon fa-icon fa-icon-${t}">
				${e}
			</ElIcon>
		);
	},
});

export default ${t};
`;g.default.writeFileSync(u.default.join(n,"index.tsx"),i)}function J(t,n){if(!t||!n)return;let e;return{name:"fast-vite-plugin-build-svg-icon",configResolved:i=>{e=i},buildStart(){let i=P(u.default.resolve(e.root,t)),r=u.default.resolve(e.root,n);g.default.mkdirSync(r,{recursive:!0});let l="",c="",p="";i.forEach((o,s)=>{R(o.iconName,u.default.join(r,o.iconName),o.iconContent),l+=`import { ${o.iconName} } from "./${o.iconName}";
`,c+=`export * from "./${o.iconName}";
`,p+=`	${o.iconName},`,s+1<i.length&&(p+=`
`)}),g.default.writeFileSync(u.default.resolve(r,"index.ts"),`import type { DefineComponent } from "vue";
${l}
${c}
export default [
${p}
] as unknown as DefineComponent[];
`)}}}var x=m(require("fs"),1),F=m(require("path"),1),D=m(require("rollup-plugin-external-globals"),1),E=require("vite-plugin-externals"),L=process.env.NODE_ENV==="development";function B(t){let n=process.cwd(),e=F.default.join(n,"node_modules",t,"package.json");return x.default.existsSync(e)?JSON.parse(x.default.readFileSync(e,"utf8")).version:""}function A(t){return!!(t.startsWith("http:")||t.startsWith("https:")||t.startsWith("//"))}function N(t,n){let{path:e}=n;return A(e)&&(t=e),t.replace(/\{name\}/g,n.name).replace(/\{version\}/g,n.version).replace(/\{path\}/g,e)}function H(t,n){n=t.prodUrl||n;let e=t,i=B(e.name),r=[];Array.isArray(e.path)?r=e.path:r.push(e.path);let l={...e,version:i};r=r.map(o=>{if(!i&&!A(o))throw new Error(`modules: ${l.name} package.json file does not exist`);return N(n,{...l,path:o})});let c=e.css||[];!Array.isArray(c)&&c&&(c=[c]);let p=Array.isArray(c)?c.map(o=>N(n,{...l,path:o})):[];return{...e,version:i,pathList:r,cssList:p}}function W(t){let{modules:n=[],prodUrl:e="https://cdn.jsdelivr.net/npm/{name}@{version}/{path}",enableInDevMode:i=!1}=t,r=!1,l=n.map(o=>(Array.isArray(o)?o:[o]).map(a=>typeof a=="function"?a(e):a).map(a=>H(a,e))).flat(),c={};l.forEach(o=>{c[o.name]=o.var,Array.isArray(o.alias)&&o.alias.forEach(s=>{c[s]=o.var})});let p=[{name:"fast-vite-plugin-cdn-import",enforce:"pre",config(o,{command:s}){r=s==="build";let a={build:{rollupOptions:{plugins:[]}}};return r&&(a.build.rollupOptions.plugins=[(0,D.default)(c)]),a},transformIndexHtml(o){if(!r&&!i)return o;let s=[];return l.forEach(a=>{a.pathList.forEach(f=>{let h={src:f,crossorigin:"anonymous",...a?.attrs??{}};s.push({tag:"script",attrs:h})}),a.cssList.forEach(f=>{let h={href:f,rel:"stylesheet",crossorigin:"anonymous",...a?.attrs??{}};s.push({tag:"link",attrs:h})})}),s}}];return L&&i&&p.push((0,E.viteExternalsPlugin)(c,{enforce:"pre"})),p}var $=m(require("fs"),1),I=m(require("path"),1);function _(t){if(t)return{name:"fast-vite-plugin-component-auto-import",buildStart(){let n=typeof t=="string"?t:t.dir,e=s=>s.charAt(0).toUpperCase()+s.slice(1),i=typeof t=="string"?e:t.formatter??e,r=$.default.readdirSync(n,{withFileTypes:!0});if(r?.length===0)return;let l=r.filter(s=>s.name!=="index.ts").map(s=>({componentName:i(s.name),fileName:s.name})).sort((s,a)=>s.componentName<a.componentName?-1:s.componentName>a.componentName?1:0),c="",p="",o="";l.forEach(({componentName:s,fileName:a},f)=>{c+=`import ${s} from "./${a}/index.vue";
`,p+=`export * from "./${a}/index.vue";
`,o+=`	${s},`,f+1<l.length&&(o+=`
`)}),$.default.writeFileSync(I.default.join(n,"index.ts"),`import type { DefineComponent } from "vue";
${c}
${p}
export default [
${o}
] as unknown as DefineComponent[];
`)}}}var d=m(require("fs"),1),S=m(require("path"),1);function v(t,n=2){return t.toString().padStart(n,"0")}function V(t){let n=t.getUTCFullYear(),e=v(t.getUTCMonth()+1),i=v(t.getUTCDate()),r=v(t.getUTCHours()),l=v(t.getUTCMinutes()),c=v(t.getUTCSeconds()),p=v(t.getUTCMilliseconds(),3);return`Z ${n}-${e}-${i} ${r}:${l}:${c}.${p}`}function Y(t){let n;return{name:"fast-vite-plugin-version-update",configResolved:e=>{n=e},buildStart(){let i=V(new Date),r=n.publicDir,l=S.default.join(r,"version.json");d.default.existsSync(r)||d.default.mkdirSync(r);let c=JSON.stringify({version:`v${t}`,dateTime:i},null,4);d.default.writeFileSync(l,c);let p=S.default.join(n.base,"package.json");if(d.default.existsSync(p)){let o=JSON.parse(d.default.readFileSync(p,"utf-8"));o.version=t,d.default.writeFileSync(p,JSON.stringify(o,null,2),"utf-8")}}}}0&&(module.exports={buildSvgIcon,cdnImport,componentAutoImport,versionUpdatePlugin});
//# sourceMappingURL=index.cjs.map