(() => {
 const app=location.pathname.startsWith('/apps/architecture/')?'architecture':'engineering';
 const resource=app+'-web';
 let allowed=false;
 try{allowed=localStorage.getItem('eniglio-access-confirmed-v1')==='granted';}catch{}
 try{allowed=allowed||sessionStorage.getItem('eniglio-access-confirmed-v1')==='granted'||sessionStorage.getItem('eniglio-access-engineering-web')==='granted'||sessionStorage.getItem('eniglio-access-architecture-web')==='granted';}catch{}
 if(!allowed){
  const lang=new URLSearchParams(location.search).get('lang')==='en'?'en':'pt';
  location.replace('/?access='+resource+'&lang='+lang+'&source='+encodeURIComponent('/apps/'+app+'/'));
 }
})();
