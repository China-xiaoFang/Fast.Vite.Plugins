import d from"fs";import g from"path";var $=t=>{let n=[];return d.readdirSync(t,{withFileTypes:!0}).forEach(s=>{if(s.isDirectory())n.push(...$(g.join(t,s.name)));else{let r=s.name.replace(".svg",""),p=d.readFileSync(g.join(t,s.name),"utf-8").replace(/<\?xml.*?\?>/,"").replace(/<!DOCTYPE svg.*?>/,"").trimStart().trimEnd().replace(/<svg([^>+].*?)>/,(c,m)=>{let i=m.match(/viewBox="[^"]+"/),o=m.match(/width="(\d+)"/),a=m.match(/height="(\d+)"/),l=1024,u=1024;o&&(l=o[0]),a&&(u=a[0]);let f="";return i?f=i[0]:f=`viewBox="0 0 ${l} ${u}"`,`<svg xmlns="http://www.w3.org/2000/svg" ${f}>`});n.push({iconName:r,componentName:r.charAt(0).toUpperCase()+r.slice(1),iconContent:p})}}),n.sort((s,r)=>s.iconName<r.iconName?-1:s.iconName>r.iconName?1:0)},D=(t,n,e)=>{d.mkdirSync(n,{recursive:!0});let s=`import { defineComponent } from "vue";

/**
 * ${t} \u56FE\u6807\u7EC4\u4EF6
 */
export const ${t} = defineComponent({
	name: "${t}",
	render() {
		return (
${e.split(`
`).map(r=>`			${r}`).join(`
`)}
		);
	},
});

export default ${t};
`;d.writeFileSync(g.join(n,"index.tsx"),s)};function J(t,n){if(!t||!n)return;let e;return{name:"fast-vite-plugin-build-svg-icon",configResolved:s=>{e=s},buildStart(){let s=$(g.resolve(e.root,t)),r=g.resolve(e.root,n);d.mkdirSync(r,{recursive:!0});let p="",c="",m="";s.forEach((i,o)=>{D(i.componentName,g.join(r,i.iconName),i.iconContent),p+=`import { ${i.componentName} } from "./${i.iconName}";
`,c+=`	${i.componentName},`,m+=`export * from "./${i.iconName}";
`,o+1<s.length&&(c+=`
`)}),d.writeFileSync(g.join(r,"index.ts"),`import type { DefineComponent } from "vue";
${p}
${m}
export default [
${c}
] as unknown as DefineComponent[];
`)}}}import S from"fs";import T from"path";import k from"rollup-plugin-external-globals";import{viteExternalsPlugin as A}from"vite-plugin-externals";var U=process.env.NODE_ENV==="development";function j(t){let n=process.cwd(),e=T.join(n,"node_modules",t,"package.json");return S.existsSync(e)?JSON.parse(S.readFileSync(e,"utf8")).version:""}function N(t){return!!(t.startsWith("http:")||t.startsWith("https:")||t.startsWith("//"))}function w(t,n){let{path:e}=n;return N(e)&&(t=e),t.replace(/\{name\}/g,n.name).replace(/\{version\}/g,n.version).replace(/\{path\}/g,e)}function E(t,n){n=t.prodUrl||n;let e=t,s=t.version||j(e.name),r=[];Array.isArray(e.path)?r=e.path:r.push(e.path);let p={...e,version:s};r=r.map(i=>{if(!s&&!N(i))throw new Error(`modules: ${p.name} package.json file does not exist`);return w(n,{name:p.name,version:p.version,path:i})});let c=e.css||[];!Array.isArray(c)&&c&&(c=[c]);let m=Array.isArray(c)?c.map(i=>w(n,{name:p.name,version:p.version,path:i})):[];return{...e,version:s,pathList:r,cssList:m}}var I="https://cdn.jsdelivr.net/npm/{name}@{version}/{path}",_="https://unpkg.com/{package}@{version}/{path}";function z(t){let{modules:n=[],prodUrl:e=I,enableInDevMode:s=!1,generateCssLinkTag:r,generateScriptTag:p}=t,c=!1,m=(Array.isArray(n)?n:[n]).map(a=>typeof a=="function"?a(e):a).map(a=>E(a,e)),i={};m.forEach(a=>{i[a.name]=a.var,Array.isArray(a.alias)&&a.alias.forEach(l=>{i[l]=a.var})});let o=[{name:"fast-vite-plugin-cdn-import",enforce:"pre",config(a,{command:l}){c=l==="build";let u={build:{rollupOptions:{plugins:[]}}};return c&&(u.build.rollupOptions.plugins=[k(i)]),u},transformIndexHtml(a){if(!c&&!s)return a;let l=[];return m.forEach(u=>{u.pathList.forEach(f=>{let y=p?.(u.name,f)||{},x={src:f,crossorigin:"anonymous",...u?.attrs??{},...y.attrs};l.push({tag:"script",attrs:x,...y})}),u.cssList.forEach(f=>{let y=r?.(u.name,f)||{},x={href:f,rel:"stylesheet",crossorigin:"anonymous",...u?.attrs??{},...y.attrs};l.push({tag:"link",attrs:x,...y})})}),l}}];return U&&s&&o.push(A(i,{enforce:"pre"})),o}import C from"fs";import P from"path";function G(t){if(t)return{name:"fast-vite-plugin-tsx-component-auto-import",buildStart(){let n=typeof t=="string"?t:t.dir,e=o=>o.charAt(0).toUpperCase()+o.slice(1),s=typeof t=="string"?e:t.formatter??e,r=C.readdirSync(n,{withFileTypes:!0});if(r?.length===0)return;let p=r.filter(o=>o.name!=="index.ts").map(o=>({componentName:s(o.name),fileName:o.name})).sort((o,a)=>o.componentName<a.componentName?-1:o.componentName>a.componentName?1:0),c="",m="",i="";p.forEach(({componentName:o,fileName:a},l)=>{c+=`import { ${o} } from "./${a}";
`,m+=`export * from "./${a}";
`,i+=`	${o},`,l+1<p.length&&(i+=`
`)}),C.writeFileSync(P.join(n,"index.ts"),`import type { Plugin } from "vue";
${c}
${m}
export default [
${i}
] as Plugin[];
`)}}}function X(t){if(t)return{name:"fast-vite-plugin-vue-component-auto-import",buildStart(){let n=typeof t=="string"?t:t.dir,e=o=>o.charAt(0).toUpperCase()+o.slice(1),s=typeof t=="string"?e:t.formatter??e,r=C.readdirSync(n,{withFileTypes:!0});if(r?.length===0)return;let p=r.filter(o=>o.name!=="index.ts").map(o=>({componentName:s(o.name),fileName:o.name})).sort((o,a)=>o.componentName<a.componentName?-1:o.componentName>a.componentName?1:0),c="",m="",i="";p.forEach(({componentName:o,fileName:a},l)=>{c+=`import ${o} from "./${a}/index.vue";
`,m+=`export * from "./${a}/index.vue";
`,i+=`	${o},`,l+1<p.length&&(i+=`
`)}),C.writeFileSync(P.join(n,"index.ts"),`import type { DefineComponent } from "vue";
${c}
${m}
export default [
${i}
] as unknown as DefineComponent[];
`)}}}import h from"fs";import F from"path";function v(t,n=2){return t.toString().padStart(n,"0")}function M(t){let n=t.getUTCFullYear(),e=v(t.getUTCMonth()+1),s=v(t.getUTCDate()),r=v(t.getUTCHours()),p=v(t.getUTCMinutes()),c=v(t.getUTCSeconds()),m=v(t.getUTCMilliseconds(),3);return`Z ${n}-${e}-${s} ${r}:${p}:${c}.${m}`}function tt(t){let n;return{name:"fast-vite-plugin-version-update",configResolved:e=>{n=e},buildStart(){let s=M(new Date),r=n.publicDir,p=F.join(r,"version.json");h.existsSync(r)||h.mkdirSync(r);let c=JSON.stringify({version:`v${t}`,dateTime:s},null,4);h.writeFileSync(p,c);let m=F.join(n.base,"package.json");if(h.existsSync(m)){let i=JSON.parse(h.readFileSync(m,"utf-8"));i.version=t,h.writeFileSync(m,JSON.stringify(i,null,2),"utf-8")}}}}export{J as buildSvgIcon,z as cdnImport,I as cdnJsDelivrUrl,_ as cdnUnpkgUrl,$ as findSvgFile,G as tsxComponentAutoImport,tt as versionUpdatePlugin,X as vueComponentAutoImport,D as writeTSXIcon};
//# sourceMappingURL=index.js.map