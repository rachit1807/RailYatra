export const STATIONS={NDLS:'New Delhi',AGC:'Agra Cantt',GWL:'Gwalior',VGLJ:'Jhansi',BPL:'Bhopal',NGP:'Nagpur',HYB:'Hyderabad',SBC:'Bengaluru',MAS:'Chennai Central',BZA:'Vijayawada',VSKP:'Visakhapatnam',BBS:'Bhubaneswar',HWH:'Howrah',PNBE:'Patna',DDU:'Pt. Deen Dayal Upadhyaya',PRYJ:'Prayagraj',CNB:'Kanpur',LKO:'Lucknow',BSB:'Varanasi',GKP:'Gorakhpur',GHY:'Guwahati',NJP:'New Jalpaiguri',DBRG:'Dibrugarh',CSMT:'Mumbai CSMT',PUNE:'Pune',SUR:'Solapur',ADI:'Ahmedabad',JP:'Jaipur',JU:'Jodhpur',UDZ:'Udaipur',ASR:'Amritsar',CDG:'Chandigarh',JAT:'Jammu Tawi',TVC:'Thiruvananthapuram',ERS:'Ernakulam',CLT:'Kozhikode',MAQ:'Mangaluru',MAO:'Madgaon',RNC:'Ranchi',TATA:'Tatanagar',KOTA:'Kota'};
const routes=[
 ['12952','Capital Rajdhani','Premium',['NDLS','KOTA','ADI','CSMT'],[0,270,660,960],990,960],
 ['12310','Ganga Rajdhani','Premium',['NDLS','CNB','PRYJ','DDU','PNBE'],[0,270,420,540,780],1030,1000],
 ['12628','Dakshin Express','Express',['NDLS','AGC','GWL','VGLJ','BPL','NGP','HYB','SBC'],[0,150,240,340,550,850,1340,1840],1200,2200],
 ['12842','Coromandel Express','Express',['MAS','BZA','VSKP','BBS','HWH'],[0,360,780,1100,1530],420,1650],
 ['12002','Bhopal Shatabdi','Superfast',['NDLS','AGC','GWL','VGLJ','BPL'],[0,120,210,310,480],360,700],
 ['12424','Brahmaputra Rajdhani','Premium',['NDLS','CNB','PRYJ','PNBE','NJP','GHY','DBRG'],[0,280,450,760,1320,1740,2220],970,2700],
 ['12124','Deccan Queen','Superfast',['PUNE','CSMT'],[0,195],430,190],
 ['16526','Island Express','Express',['SBC','ERS','TVC'],[0,600,840],1200,800],
 ['16604','Malabar Coast Express','Express',['TVC','ERS','CLT','MAQ','MAO','CSMT'],[0,210,480,720,1080,1620],400,1800],
 ['12957','Desert Superfast','Superfast',['ADI','UDZ','JU','JP','NDLS'],[0,240,510,800,1100],1110,1200],
 ['12013','Northern Shatabdi','Superfast',['NDLS','CDG','ASR','JAT'],[0,200,390,630],420,850],
 ['15018','Purvanchal Express','Express',['GKP','LKO','CNB','PRYJ','BSB','PNBE','HWH'],[0,260,360,520,660,900,1350],660,1450],
 ['12810','Eastern Mail','Express',['HWH','TATA','RNC','NGP','CSMT'],[0,210,390,1000,1620],1170,1950],
 ['12702','Deccan Link','Express',['HYB','SUR','PUNE','CSMT'],[0,360,600,810],870,800],
 ['12608','Southern Shatabdi','Superfast',['SBC','MAS'],[0,300],360,350]
];
export const TRAINS=routes.flatMap(([id,name,type,stops,offsets,start,km])=>[{id,name,type,stops,offsets,start,km},{id:String(+id+101),name:name+' Return',type,stops:[...stops].reverse(),offsets:[...offsets].reverse().map(x=>offsets.at(-1)-x),start:480,km}]);
export const CLASSES={'SL':{name:'Sleeper',rate:.72,coach:'S1'},'3A':{name:'AC 3 Tier',rate:1.65,coach:'B1'},'2A':{name:'AC 2 Tier',rate:2.35,coach:'A1'},'1A':{name:'AC First',rate:3.8,coach:'H1'}};
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const addDays=(d,n)=>new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
export function routeFor(t,from,to,date){const a=t.stops.indexOf(from),b=t.stops.indexOf(to);if(a<0||b<=a)return null;const shift=Math.floor((t.start+t.offsets[a])/1440);return{trainId:t.id,a,b,from,to,date,originDate:addDays(date,-shift),duration:t.offsets[b]-t.offsets[a]};}
export const overlaps=(a,b)=>a.a<b.b&&b.a<a.b;
export const berth=n=>['Lower','Middle','Upper','Lower','Middle','Upper','Side lower','Side upper'][(n-1)%8];
export function availableSeats(bookings,r,cls){return Array.from({length:24},(_,i)=>i+1).filter(seat=>!bookings.some(b=>b.status==='CONFIRMED'&&b.trainId===r.trainId&&b.originDate===r.originDate&&b.cls===cls&&overlaps(b,r)&&b.seats.includes(seat)));}
export function fare(t,r,cls,count,quota){const distance=Math.max(80,Math.round(t.km*r.duration/t.offsets.at(-1)));const base=Math.round(distance*CLASSES[cls].rate)*count;const reservation=40*count;const quotaCharge=quota==='TATKAL'?150*count:0;const tax=cls==='SL'?0:Math.round((base+reservation+quotaCharge)*.05);return{base,reservation,quotaCharge,tax,service:20,total:base+reservation+quotaCharge+tax+20,distance};}
export function journeyTime(t,r,index){const ms=Date.parse(r.originDate+'T00:00:00+05:30')+(t.start+t.offsets[index])*60000;return{iso:new Date(ms).toISOString(),date:new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric'}).format(ms),time:new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:false}).format(ms)};}
let dbPromise;
export function database(){return dbPromise??=new Promise((resolve,reject)=>{const req=indexedDB.open('railyatra-v1',1);req.onupgradeneeded=()=>{const d=req.result;d.createObjectStore('users',{keyPath:'email'});d.createObjectStore('bookings',{keyPath:'pnr'});d.createObjectStore('orders',{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function localAll(store){const db=await database();return new Promise((resolve,reject)=>{const r=db.transaction(store).objectStore(store).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function hash(password,salt){const bytes=new TextEncoder().encode(salt+password);return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');}
async function localRegister(name,email,password){const salt=crypto.randomUUID();const u={name,email,salt,password:await hash(password,salt)};const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('users','readwrite');tx.objectStore('users').add(u);tx.oncomplete=()=>resolve(u);tx.onabort=()=>reject(Error('This email already has a demo account. Sign in instead.'));});}
async function localAuthenticate(email,password){const u=(await localAll('users')).find(u=>u.email===email);if(!u||u.password!==await hash(password,u.salt))throw Error('Email or password is incorrect.');return u;}
async function localReserve(draft){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('bookings','readwrite');const st=tx.objectStore('bookings');let result,error;st.getAll().onsuccess=e=>{const bookings=e.target.result;if(bookings.some(b=>b.paymentId===draft.paymentId)){error=Error('This checkout has already been completed. See your journeys.');tx.abort();return;}const free=availableSeats(bookings,draft,draft.cls);if(draft.seats.length!==draft.passengers.length||new Set(draft.seats).size!==draft.seats.length||draft.seats.some(s=>!free.includes(s))){error=Error('A selected seat was just booked. Go back and choose available seats. No demo payment was recorded.');tx.abort();return;}let pnr;do{pnr=String(1000000000+crypto.getRandomValues(new Uint32Array(1))[0]%9000000000);}while(bookings.some(b=>b.pnr===pnr));result={...draft,pnr,status:'CONFIRMED',bookedAt:new Date().toISOString()};st.add(result);};tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(error??tx.error??Error('Reservation failed. Please retry.'));tx.onerror=()=>{};});}
async function localCancel(pnr,email){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction(['bookings','orders'],'readwrite');let error;const st=tx.objectStore('bookings');st.get(pnr).onsuccess=e=>{const b=e.target.result;if(!b||b.email!==email||b.status!=='CONFIRMED'||Date.parse(b.departure.iso)<Date.now()){error=Error('Only your upcoming confirmed tickets can be cancelled.');tx.abort();return;}b.status='CANCELLED';b.cancelledAt=new Date().toISOString();b.refund=b.fare.total;st.put(b);const os=tx.objectStore('orders');os.getAll().onsuccess=e=>e.target.result.filter(o=>o.pnr===pnr&&o.email===email).forEach(o=>os.put({...o,status:'CANCELLED'}));};tx.oncomplete=()=>resolve();tx.onabort=()=>reject(error??tx.error);});}
async function localOrderFood(order){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction(['bookings','orders'],'readwrite');let error;tx.objectStore('bookings').get(order.pnr).onsuccess=e=>{const b=e.target.result;if(!b||b.email!==order.email||b.status!=='CONFIRMED'||Date.parse(b.departure.iso)<Date.now()){error=Error('Choose an upcoming confirmed journey.');tx.abort();return;}tx.objectStore('orders').add({...order,id:crypto.randomUUID(),status:'PLACED',createdAt:new Date().toISOString()});};tx.oncomplete=()=>resolve();tx.onabort=()=>reject(error??tx.error);});}

const apiOrigin=()=>typeof window!=='undefined'?String(window.RY_API_BASE??'').replace(/\/$/,''):'';
export const backendEnabled=()=>Boolean(apiOrigin());
const accessToken=()=>typeof localStorage!=='undefined'?localStorage.getItem('ry-token'):null;
async function apiRequest(path,options={}){
  const headers={Accept:'application/json',...(options.body?{'Content-Type':'application/json'}:{}),...options.headers};
  const token=options.auth===false?null:accessToken();
  if(token)headers.Authorization=`Bearer ${token}`;
  let response;
  try{response=await fetch(`${apiOrigin()}/api${path}`,{...options,headers,body:options.body?JSON.stringify(options.body):undefined});}
  catch{throw Error('RailYatra server is unavailable. Check the backend connection and try again.');}
  if(response.status===204)return null;
  const payload=await response.json().catch(()=>({}));
  if(!response.ok){const error=Error(payload.error??'RailYatra could not complete that request.');error.status=response.status;if(response.status===401)localStorage.removeItem('ry-token');throw error;}
  return payload;
}
function saveToken(token){localStorage.setItem('ry-token',token);}
export async function validateSession(){
  if(!backendEnabled()||!accessToken())return null;
  try{return await apiRequest('/auth/me');}
  catch(error){if(error.status===401)return null;throw error;}
}
export async function all(store){
  if(!backendEnabled())return localAll(store);
  if(store==='users'){
    if(!accessToken())return[];
    const current=await validateSession();
    return current?[current]:[];
  }
  if(!accessToken())return[];
  if(store==='bookings')return apiRequest('/bookings');
  if(store==='orders')return apiRequest('/food-orders');
  return[];
}
export async function getAvailability(search){
  if(!backendEnabled()||!search)return null;
  const query=new URLSearchParams({from:search.from,to:search.to,date:search.date});
  return apiRequest(`/availability?${query}`,{auth:false});
}
export async function register(name,email,password){
  if(!backendEnabled())return localRegister(name,email,password);
  const response=await apiRequest('/auth/register',{method:'POST',auth:false,body:{name,email,password}});
  saveToken(response.token);
  return response.user;
}
export async function authenticate(email,password){
  if(!backendEnabled())return localAuthenticate(email,password);
  const response=await apiRequest('/auth/login',{method:'POST',auth:false,body:{email,password}});
  saveToken(response.token);
  return response.user;
}
export async function logout(){
  if(backendEnabled()&&accessToken())try{await apiRequest('/auth/logout',{method:'POST'});}catch{}
  if(typeof localStorage!=='undefined')localStorage.removeItem('ry-token');
}
export async function reserve(draft){
  if(!backendEnabled())return localReserve(draft);
  return apiRequest('/bookings',{method:'POST',body:{...draft,paymentOutcome:'SUCCESS'}});
}
export async function cancel(pnr,email){
  if(!backendEnabled())return localCancel(pnr,email);
  return apiRequest(`/bookings/${encodeURIComponent(pnr)}/cancel`,{method:'POST'});
}
export async function orderFood(order){
  if(!backendEnabled())return localOrderFood(order);
  return apiRequest('/food-orders',{method:'POST',body:order});
}
