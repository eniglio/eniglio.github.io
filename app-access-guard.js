(() => {
 const app=location.pathname.startsWith('/apps/architecture/')?'architecture':'engineering';
 const resource=app+'-web';
 let allowed=false;
 try{allowed=sessionStorage.getItem('eniglio-access-'+resource)==='granted';}catch{}
 if(!allowed){
  const lang=new URLSearchParams(location.search).get('lang')==='en'?'en':'pt';
  location.replace('/?access='+resource+'&lang='+lang+'&source='+encodeURIComponent('/apps/'+app+'/'));
 }
})();
