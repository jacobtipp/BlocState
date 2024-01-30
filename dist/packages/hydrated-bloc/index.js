"use strict";var u=Object.defineProperty;var g=(n,o,s)=>o in n?u(n,o,{enumerable:!0,configurable:!0,writable:!0,value:s}):n[o]=s;var l=(n,o,s)=>(g(n,typeof o!="symbol"?o+"":o,s),s);Object.defineProperty(exports,Symbol.toStringTag,{value:"Module"});const f=n=>class extends n{constructor(...t){super(...t);l(this,"_cachedState",null);this.clear=this.clear.bind(this),this.fromJson=this.fromJson.bind(this),this.toJson=this.toJson.bind(this),this.hydrate=this.hydrate.bind(this)}get id(){return""}get storagePrefix(){return this.name}get storageToken(){return`${this.storagePrefix}-${this.id}`}async clear(){await i.storage.delete(this.storageToken)}get state(){const t=i.storage;if(this._cachedState!==null)return this._cachedState;try{const e=t.read(this.storageToken);if(e===null)return this._cachedState=super.state,super.state;const a=this.fromJson(e);return this._cachedState=a,a}catch(e){return e instanceof Error&&this.onError(e),this._cachedState=super.state,super.state}}onChange(t){super.onChange(t);const e=i.storage,a=t.nextState;try{const r=this.toJson(a);r!==null&&e.write(this.storageToken,r)}catch(r){if(r instanceof Error)throw this.onError(r),r}this._cachedState=a}hydrate(){try{const t=i.storage,e=this.toJson(this.state);e!=null&&t.write(this.storageToken,e)}catch(t){if(t instanceof Error&&this.onError(t),t instanceof h)throw t}}},S=n=>class extends n{constructor(...t){super(...t);l(this,"_cachedState",null);this.clear=this.clear.bind(this),this.fromJson=this.fromJson.bind(this),this.toJson=this.toJson.bind(this),this.hydrate=this.hydrate.bind(this)}get id(){return""}get storagePrefix(){return this.name}get storageToken(){return`${this.storagePrefix}-${this.id}`}async clear(){await i.storage.delete(this.storageToken)}get state(){const t=i.storage;if(this._cachedState!==null)return this._cachedState;try{const e=t.read(this.storageToken);if(e===null)return this._cachedState=super.state,super.state;const a=this.fromJson(e);return this._cachedState=a,a}catch(e){return e instanceof Error&&this.onError(e),this._cachedState=super.state,super.state}}onChange(t){super.onChange(t);const e=i.storage,a=t.nextState;try{const r=this.toJson(a);r!==null&&e.write(this.storageToken,r)}catch(r){if(r instanceof Error)throw this.onError(r),r}this._cachedState=a}hydrate(){try{const t=i.storage,e=this.toJson(this.state);e!=null&&t.write(this.storageToken,e)}catch(t){if(t instanceof Error&&this.onError(t),t instanceof h)throw t}}};class d{}const c=class c{static get storage(){if(c._storage===null)throw new h("Storage not found!");return c._storage}static set storage(o){c._storage=o}};l(c,"_storage",null);let i=c;class h extends Error{constructor(o){super(o),Object.setPrototypeOf(this,h.prototype)}}class y extends d{constructor(){super(...arguments);l(this,"_closed",!1)}read(s){return this._closed?null:localStorage.getItem(s)??null}write(s,t){return this._closed?Promise.resolve():new Promise((e,a)=>{try{localStorage.setItem(s,t),e()}catch(r){r instanceof Error&&a(r)}})}delete(s){return this._closed?Promise.resolve():new Promise(t=>{localStorage.removeItem(s),t()})}clear(){return this._closed?Promise.resolve():new Promise(s=>{localStorage.clear(),s()})}async close(){await this.clear(),this._closed=!0}}exports.HydratedLocalStorage=y;exports.HydratedStorage=i;exports.Storage=d;exports.StorageNotFound=h;exports.WithHydratedBloc=f;exports.WithHydratedCubit=S;
