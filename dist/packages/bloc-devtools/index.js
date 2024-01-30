"use strict";var h=Object.defineProperty;var u=(r,t,o)=>t in r?h(r,t,{enumerable:!0,configurable:!0,writable:!0,value:o}):r[t]=o;var c=(r,t,o)=>(u(r,typeof t!="symbol"?t+"":t,o),o);Object.defineProperty(exports,Symbol.toStringTag,{value:"Module"});class p{constructor(t,o){c(this,"lock",!1);c(this,"bloc");c(this,"initialState");c(this,"connectionUnsubscribe");c(this,"update",(t,o="onChange")=>{var i,e,l;if(this.lock){this.lock=!1;return}const s=`[${this.options.name}] - ${o}`;(i=this.options)!=null&&i.logTrace&&(console.groupCollapsed(s,t),console.trace(),console.groupEnd()),(l=(e=this.options)==null?void 0:e.preAction)==null||l.call(e),this.send({type:s},t)});c(this,"send",(t,o)=>{this.connectionInstance.send(t,o)});this.options=t,this.connectionInstance=o,this.connectionUnsubscribe=this.connectionInstance.subscribe(n=>{var s,i;if(n.type==="DISPATCH"){const e=n.payload.type;if(e==="COMMIT"&&this.bloc){this.connectionInstance.init((s=this.bloc)==null?void 0:s.state);return}if(e==="RESET"&&this.bloc){this.lock=!0,this.bloc.__unsafeEmit__(this.initialState),this.connectionInstance.init((i=this.bloc)==null?void 0:i.state);return}(e==="JUMP_TO_STATE"||e==="JUMP_TO_ACTION")&&this.bloc&&(this.lock=!0,this.bloc.__unsafeEmit__(this.bloc.fromJson(n.state)))}})}close(){this.connectionInstance.unsubscribe(),this.connectionUnsubscribe()}addBloc(t,o){var s,i,e;this.bloc=t,this.initialState=o;const n=`[${this.options.name}] - @Init`;(s=this.options)!=null&&s.logTrace&&(console.groupCollapsed(n,o),console.trace(),console.groupEnd()),(e=(i=this.options)==null?void 0:i.preAction)==null||e.call(i),this.send({type:n},o)}removeBloc(){var o;const t=this.options.name;this.send({type:`[${t}] - onClose`},(o=this.bloc)==null?void 0:o.state),this.bloc=void 0}}class d{constructor(t){c(this,"connections",new Map);c(this,"isDev",process.env.NODE_ENV!=="production");c(this,"options");c(this,"addBloc",(t,o)=>{const n=t.name,s=this.connections.get(n);if(s)return s.addBloc(t,o);const i={...this.options,name:n},e=window.__REDUX_DEVTOOLS_EXTENSION__.connect(i),l=new p(i,e);l.addBloc(t,o),this.connections.set(n,l)});const o={name:document.title,logTrace:!1};if(this.options={...o,...t},this.isDev&&!window.__REDUX_DEVTOOLS_EXTENSION__)throw new a("DevtoolsObserver only works with Redux Devtools Extension installed in your web browser")}onEvent(t,o){}onError(t,o){}onCreate(t,o){this.isDev&&this.addBloc(t,o)}onTransition(t,o){if(!this.isDev)return;const n=this.connections.get(t.name),s=o.event.name??o.event.constructor.name;n==null||n.update(o.nextState,s)}onChange(t,o){if(!this.isDev||t.isBlocInstance)return;const n=this.connections.get(t.name);n==null||n.update(o.nextState)}onClose(t){if(!this.isDev)return;const o=t.name,n=this.connections.get(o);n==null||n.removeBloc()}onDestroy(){this.isDev&&(this.connections.forEach(t=>{t.close()}),this.connections.clear())}}class a extends Error{constructor(t){super(t),Object.setPrototypeOf(this,a.prototype)}}exports.DevtoolsError=a;exports.DevtoolsObserver=d;
