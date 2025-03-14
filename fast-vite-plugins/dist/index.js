import d from"fs";import g from"path";var $=t=>{let e=[];return d.readdirSync(t,{withFileTypes:!0}).forEach(s=>{if(s.isDirectory())e.push(...$(g.join(t,s.name)));else{let r=s.name.replace(".svg",""),p=d.readFileSync(g.join(t,s.name),"utf-8").replace(/<\?xml.*?\?>/,"").replace(/<!DOCTYPE svg.*?>/,"").trimStart().trimEnd().replace(/<svg([^>+].*?)>/,(c,m)=>{let i=m.match(/viewBox="[^"]+"/),o=m.match(/width="(\d+)"/),a=m.match(/height="(\d+)"/),u=1024,l=1024;o&&(u=o[0]),a&&(l=a[0]);let f="";return i?f=i[0]:f=`viewBox="0 0 ${u} ${l}"`,`<svg xmlns="http://www.w3.org/2000/svg" ${f}>`});e.push({iconName:r,componentName:r.charAt(0).toUpperCase()+r.slice(1),iconContent:p})}}),e.sort((s,r)=>s.iconName<r.iconName?-1:s.iconName>r.iconName?1:0)},T=(t,e,n)=>{d.mkdirSync(e,{recursive:!0});let s=`import { defineComponent } from "vue";

/**
 * ${t} \u56FE\u6807\u7EC4\u4EF6
 */
export const ${t} = defineComponent({
	name: "${t}",
	render() {
		return (
${n.split(`
`).map(r=>`			${r}`).join(`
`)}
		);
	},
});

export default ${t};
`;d.writeFileSync(g.join(e,"index.tsx"),s)};function b(t,e){if(!t||!e)return;let n;return{name:"fast-vite-plugin-build-svg-icon",configResolved:s=>{n=s},buildStart(){let s=$(g.resolve(n.root,t)),r=g.resolve(n.root,e);d.mkdirSync(r,{recursive:!0});let p="",c="",m="";s.forEach((i,o)=>{T(i.componentName,g.join(r,i.iconName),i.iconContent),p+=`import { ${i.componentName} } from "./${i.iconName}";
`,c+=`	${i.componentName},`,m+=`export * from "./${i.iconName}";
`,o+1<s.length&&(c+=`
`)}),d.writeFileSync(g.join(r,"index.ts"),`import type { DefineComponent } from "vue";
${p}
${m}
export default [
${c}
] as unknown as DefineComponent[];
`)}}}import S from"fs";import A from"path";import D from"rollup-plugin-external-globals";import{viteExternalsPlugin as j}from"vite-plugin-externals";var k=process.env.NODE_ENV==="development";function E(t){let e=process.cwd(),n=A.join(e,"node_modules",t,"package.json");return S.existsSync(n)?JSON.parse(S.readFileSync(n,"utf8")).version:""}function N(t){return!!(t.startsWith("http:")||t.startsWith("https:")||t.startsWith("//"))}function w(t,e){let{path:n}=e;return N(n)&&(t=n),t.replace(/\{name\}/g,e.name).replace(/\{version\}/g,e.version).replace(/\{path\}/g,n)}function I(t,e){e=t.prodUrl||e;let n=t,s=t.version||E(n.name),r=[];Array.isArray(n.path)?r=n.path:r.push(n.path);let p={...n,version:s};r=r.map(i=>{if(!s&&!N(i))throw new Error(`modules: ${p.name} package.json file does not exist`);return w(e,{name:p.name,version:p.version,path:i})});let c=n.css||[];!Array.isArray(c)&&c&&(c=[c]);let m=Array.isArray(c)?c.map(i=>w(e,{name:p.name,version:p.version,path:i})):[];return{...n,version:s,pathList:r,cssList:m}}function W(t){let{modules:e=[],prodUrl:n="https://cdn.jsdelivr.net/npm/{name}@{version}/{path}",enableInDevMode:s=!1,generateCssLinkTag:r,generateScriptTag:p}=t,c=!1,m=(Array.isArray(e)?e:[e]).map(a=>typeof a=="function"?a(n):a).map(a=>I(a,n)),i={};m.forEach(a=>{i[a.name]=a.var,Array.isArray(a.alias)&&a.alias.forEach(u=>{i[u]=a.var})});let o=[{name:"fast-vite-plugin-cdn-import",enforce:"pre",config(a,{command:u}){c=u==="build";let l={build:{rollupOptions:{plugins:[]}}};return c&&(l.build.rollupOptions.plugins=[D(i)]),l},transformIndexHtml(a){if(!c&&!s)return a;let u=[];return m.forEach(l=>{l.pathList.forEach(f=>{let y=p?.(l.name,f)||{},x={src:f,crossorigin:"anonymous",...l?.attrs??{},...y.attrs};u.push({tag:"script",attrs:x,...y})}),l.cssList.forEach(f=>{let y=r?.(l.name,f)||{},x={href:f,rel:"stylesheet",crossorigin:"anonymous",...l?.attrs??{},...y.attrs};u.push({tag:"link",attrs:x,...y})})}),u}}];return k&&s&&o.push(j(i,{enforce:"pre"})),o}import C from"fs";import P from"path";function Y(t){if(t)return{name:"fast-vite-plugin-tsx-component-auto-import",buildStart(){let e=typeof t=="string"?t:t.dir,n=o=>o.charAt(0).toUpperCase()+o.slice(1),s=typeof t=="string"?n:t.formatter??n,r=C.readdirSync(e,{withFileTypes:!0});if(r?.length===0)return;let p=r.filter(o=>o.name!=="index.ts").map(o=>({componentName:s(o.name),fileName:o.name})).sort((o,a)=>o.componentName<a.componentName?-1:o.componentName>a.componentName?1:0),c="",m="",i="";p.forEach(({componentName:o,fileName:a},u)=>{c+=`import { ${o} } from "./${a}";
`,m+=`export * from "./${a}";
`,i+=`	${o},`,u+1<p.length&&(i+=`
`)}),C.writeFileSync(P.join(e,"index.ts"),`import type { Plugin } from "vue";
${c}
${m}
export default [
${i}
] as Plugin[];
`)}}}function Z(t){if(t)return{name:"fast-vite-plugin-vue-component-auto-import",buildStart(){let e=typeof t=="string"?t:t.dir,n=o=>o.charAt(0).toUpperCase()+o.slice(1),s=typeof t=="string"?n:t.formatter??n,r=C.readdirSync(e,{withFileTypes:!0});if(r?.length===0)return;let p=r.filter(o=>o.name!=="index.ts").map(o=>({componentName:s(o.name),fileName:o.name})).sort((o,a)=>o.componentName<a.componentName?-1:o.componentName>a.componentName?1:0),c="",m="",i="";p.forEach(({componentName:o,fileName:a},u)=>{c+=`import ${o} from "./${a}/index.vue";
`,m+=`export * from "./${a}/index.vue";
`,i+=`	${o},`,u+1<p.length&&(i+=`
`)}),C.writeFileSync(P.join(e,"index.ts"),`import type { DefineComponent } from "vue";
${c}
${m}
export default [
${i}
] as unknown as DefineComponent[];
`)}}}import h from"fs";import F from"path";function v(t,e=2){return t.toString().padStart(e,"0")}function U(t){let e=t.getUTCFullYear(),n=v(t.getUTCMonth()+1),s=v(t.getUTCDate()),r=v(t.getUTCHours()),p=v(t.getUTCMinutes()),c=v(t.getUTCSeconds()),m=v(t.getUTCMilliseconds(),3);return`Z ${e}-${n}-${s} ${r}:${p}:${c}.${m}`}function K(t){let e;return{name:"fast-vite-plugin-version-update",configResolved:n=>{e=n},buildStart(){let s=U(new Date),r=e.publicDir,p=F.join(r,"version.json");h.existsSync(r)||h.mkdirSync(r);let c=JSON.stringify({version:`v${t}`,dateTime:s},null,4);h.writeFileSync(p,c);let m=F.join(e.base,"package.json");if(h.existsSync(m)){let i=JSON.parse(h.readFileSync(m,"utf-8"));i.version=t,h.writeFileSync(m,JSON.stringify(i,null,2),"utf-8")}}}}export{b as buildSvgIcon,W as cdnImport,$ as findSvgFile,Y as tsxComponentAutoImport,K as versionUpdatePlugin,Z as vueComponentAutoImport,T as writeTSXIcon};
//# sourceMappingURL=index.js.map