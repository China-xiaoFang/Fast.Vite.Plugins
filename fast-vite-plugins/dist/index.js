import g from"fs";import f from"path";function y(t){let e=[];return g.readdirSync(t,{withFileTypes:!0}).forEach(r=>{if(r.isDirectory())e.push(...y(f.join(t,r.name)));else{let i=r.name.replace(".svg",""),l=g.readFileSync(f.join(t,r.name)).toString().replace(/<\?xml.*?\?>/,"").replace(/<!DOCTYPE svg.*?>/,"").replace(/(\r)|(\n)/g,"").replace(/<svg([^>+].*?)>/,(c,p)=>{let n=p.match(/viewBox="[^"]+"/),s=p.match(/width="(\d+)"/),a=p.match(/height="(\d+)"/),m=1024,u=1024;s&&(m=s[0]),a&&(u=a[0]);let v="";return n?v=n[0]:v=`viewBox="0 0 ${m} ${u}"`,`<svg xmlns="http://www.w3.org/2000/svg" ${v}>`});e.push({iconName:i.charAt(0).toUpperCase()+i.slice(1),iconContent:l})}}),e.sort((r,i)=>r.iconName<i.iconName?-1:r.iconName>i.iconName?1:0)}function P(t,e,o){g.mkdirSync(e,{recursive:!0});let r=`import { defineComponent } from "vue";
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
				${o}
			</ElIcon>
		);
	},
});

export default ${t};
`;g.writeFileSync(f.join(e,"index.tsx"),r)}function U(t,e){if(!t||!e)return;let o;return{name:"fast-vite-plugin-build-svg-icon",configResolved:r=>{o=r},buildStart(){let r=y(f.resolve(o.root,t)),i=f.resolve(o.root,e);g.mkdirSync(i,{recursive:!0});let l="",c="",p="";r.forEach((n,s)=>{P(n.iconName,f.join(i,n.iconName),n.iconContent),l+=`import { ${n.iconName} } from "./${n.iconName}";
`,c+=`export * from "./${n.iconName}";
`,p+=`	${n.iconName},`,s+1<r.length&&(p+=`
`)}),g.writeFileSync(f.resolve(i,"index.ts"),`import type { DefineComponent } from "vue";
${l}
${c}
export default [
${p}
] as unknown as DefineComponent[];
`)}}}import C from"fs";import N from"path";import F from"rollup-plugin-external-globals";import{viteExternalsPlugin as D}from"vite-plugin-externals";var E=process.env.NODE_ENV==="development";function A(t){let e=process.cwd(),o=N.join(e,"node_modules",t,"package.json");return C.existsSync(o)?JSON.parse(C.readFileSync(o,"utf8")).version:""}function $(t){return!!(t.startsWith("http:")||t.startsWith("https:")||t.startsWith("//"))}function x(t,e){let{path:o}=e;return $(o)&&(t=o),t.replace(/\{name\}/g,e.name).replace(/\{version\}/g,e.version).replace(/\{path\}/g,o)}function I(t,e){e=t.prodUrl||e;let o=t,r=A(o.name),i=[];Array.isArray(o.path)?i=o.path:i.push(o.path);let l={...o,version:r};i=i.map(n=>{if(!r&&!$(n))throw new Error(`modules: ${l.name} package.json file does not exist`);return x(e,{...l,path:n})});let c=o.css||[];!Array.isArray(c)&&c&&(c=[c]);let p=Array.isArray(c)?c.map(n=>x(e,{...l,path:n})):[];return{...o,version:r,pathList:i,cssList:p}}function B(t){let{modules:e=[],prodUrl:o="https://cdn.jsdelivr.net/npm/{name}@{version}/{path}",enableInDevMode:r=!1}=t,i=!1,l=e.map(n=>(Array.isArray(n)?n:[n]).map(a=>typeof a=="function"?a(o):a).map(a=>I(a,o))).flat(),c={};l.forEach(n=>{c[n.name]=n.var,Array.isArray(n.alias)&&n.alias.forEach(s=>{c[s]=n.var})});let p=[{name:"fast-vite-plugin-cdn-import",enforce:"pre",config(n,{command:s}){i=s==="build";let a={build:{rollupOptions:{plugins:[]}}};return i&&(a.build.rollupOptions.plugins=[F(c)]),a},transformIndexHtml(n){if(!i&&!r)return n;let s=[];return l.forEach(a=>{a.pathList.forEach(m=>{let u={src:m,crossorigin:"anonymous",...a?.attrs??{}};s.push({tag:"script",attrs:u})}),a.cssList.forEach(m=>{let u={href:m,rel:"stylesheet",crossorigin:"anonymous",...a?.attrs??{}};s.push({tag:"link",attrs:u})})}),s}}];return E&&r&&p.push(D(c,{enforce:"pre"})),p}import S from"fs";import T from"path";function V(t){if(t)return{name:"fast-vite-plugin-component-auto-import",buildStart(){let e=typeof t=="string"?t:t.dir,o=s=>s.charAt(0).toUpperCase()+s.slice(1),r=typeof t=="string"?o:t.formatter??o,i=S.readdirSync(e,{withFileTypes:!0});if(i?.length===0)return;let l=i.filter(s=>s.name!=="index.ts").map(s=>({componentName:r(s.name),fileName:s.name})).sort((s,a)=>s.componentName<a.componentName?-1:s.componentName>a.componentName?1:0),c="",p="",n="";l.forEach(({componentName:s,fileName:a},m)=>{c+=`import ${s} from "./${a}/index.vue";
`,p+=`export * from "./${a}/index.vue";
`,n+=`	${s},`,m+1<l.length&&(n+=`
`)}),S.writeFileSync(T.join(e,"index.ts"),`import type { DefineComponent } from "vue";
${c}
${p}
export default [
${n}
] as unknown as DefineComponent[];
`)}}}import d from"fs";import w from"path";function h(t,e=2){return t.toString().padStart(e,"0")}function k(t){let e=t.getUTCFullYear(),o=h(t.getUTCMonth()+1),r=h(t.getUTCDate()),i=h(t.getUTCHours()),l=h(t.getUTCMinutes()),c=h(t.getUTCSeconds()),p=h(t.getUTCMilliseconds(),3);return`Z ${e}-${o}-${r} ${i}:${l}:${c}.${p}`}function q(t){let e;return{name:"fast-vite-plugin-version-update",configResolved:o=>{e=o},buildStart(){let r=k(new Date),i=e.publicDir,l=w.join(i,"version.json");d.existsSync(i)||d.mkdirSync(i);let c=JSON.stringify({version:`v${t}`,dateTime:r},null,4);d.writeFileSync(l,c);let p=w.join(e.base,"package.json");if(d.existsSync(p)){let n=JSON.parse(d.readFileSync(p,"utf-8"));n.version=t,d.writeFileSync(p,JSON.stringify(n,null,2),"utf-8")}}}}export{U as buildSvgIcon,B as cdnImport,V as componentAutoImport,q as versionUpdatePlugin};
//# sourceMappingURL=index.js.map