const stationRows=[
 ['NDLS','New Delhi, Delhi'],['DLI','Old Delhi, Delhi'],['AGC','Agra Cantt, Uttar Pradesh'],['GWL','Gwalior, Madhya Pradesh'],['VGLJ','Virangana Lakshmibai Jhansi, Uttar Pradesh'],['BPL','Bhopal, Madhya Pradesh'],['RKMP','Rani Kamlapati, Madhya Pradesh'],['ET','Itarsi, Madhya Pradesh'],['NGP','Nagpur, Maharashtra'],['HYB','Hyderabad, Telangana'],['SBC','KSR Bengaluru, Karnataka'],['YPR','Yesvantpur, Karnataka'],['MYS','Mysuru, Karnataka'],['MAS','Chennai Central, Tamil Nadu'],['BZA','Vijayawada, Andhra Pradesh'],['VSKP','Visakhapatnam, Andhra Pradesh'],['BBS','Bhubaneswar, Odisha'],['HWH','Howrah, West Bengal'],['PNBE','Patna Junction, Bihar'],['DDU','Pt. Deen Dayal Upadhyaya, Uttar Pradesh'],['PRYJ','Prayagraj, Uttar Pradesh'],['CNB','Kanpur Central, Uttar Pradesh'],['LKO','Lucknow, Uttar Pradesh'],['BSB','Varanasi, Uttar Pradesh'],['GKP','Gorakhpur, Uttar Pradesh'],['GHY','Guwahati, Assam'],['NJP','New Jalpaiguri, West Bengal'],['DBRG','Dibrugarh, Assam'],['CSMT','Mumbai CSMT, Maharashtra'],['PUNE','Pune, Maharashtra'],['SUR','Solapur, Maharashtra'],['ADI','Ahmedabad, Gujarat'],['JP','Jaipur, Rajasthan'],['JU','Jodhpur, Rajasthan'],['UDZ','Udaipur City, Rajasthan'],['ASR','Amritsar, Punjab'],['CDG','Chandigarh, Chandigarh'],['JAT','Jammu Tawi, Jammu and Kashmir'],['TVC','Thiruvananthapuram Central, Kerala'],['ERS','Ernakulam Junction, Kerala'],['CLT','Kozhikode, Kerala'],['MAQ','Mangaluru Central, Karnataka'],['MAO','Madgaon, Goa'],['RNC','Ranchi, Jharkhand'],['TATA','Tatanagar, Jharkhand'],['KOTA','Kota, Rajasthan'],
 ['FBD','Faridabad, Haryana'],['GZB','Ghaziabad, Uttar Pradesh'],['MTC','Meerut City, Uttar Pradesh'],['ALJN','Aligarh Junction, Uttar Pradesh'],['KSJ','Kasganj, Uttar Pradesh'],['MB','Moradabad, Uttar Pradesh'],['BE','Bareilly, Uttar Pradesh'],['SPN','Shahjahanpur Junction, Uttar Pradesh'],['HRI','Hardoi, Uttar Pradesh'],['LJN','Lucknow Junction, Uttar Pradesh'],['RMR','Ramnagar, Uttarakhand'],['KGM','Kathgodam, Uttarakhand'],['UMB','Ambala Cantt, Haryana'],['LDH','Ludhiana, Punjab'],['JUC','Jalandhar City, Punjab'],['PTK','Pathankot, Punjab'],['UHP','Udhampur, Jammu and Kashmir'],['SVDK','Shri Mata Vaishno Devi Katra, Jammu and Kashmir'],['KLK','Kalka, Haryana'],['SML','Shimla, Himachal Pradesh'],['AWR','Alwar, Rajasthan'],['RE','Rewari, Haryana'],['AII','Ajmer, Rajasthan'],['BKN','Bikaner, Rajasthan'],['MTD','Merta Road, Rajasthan'],['RTM','Ratlam, Madhya Pradesh'],['UJN','Ujjain, Madhya Pradesh'],['INDB','Indore, Madhya Pradesh'],['BINA','Bina, Madhya Pradesh'],['JBP','Jabalpur, Madhya Pradesh'],['KTE','Katni, Madhya Pradesh'],['PNVL','Panvel, Maharashtra'],['BVI','Borivali, Maharashtra'],['BDTS','Mumbai Bandra Terminus, Maharashtra'],['KYN','Kalyan, Maharashtra'],['IGP','Igatpuri, Maharashtra'],['NAS','Nasik Road, Maharashtra'],['MMR','Manmad, Maharashtra'],['BSL','Bhusaval, Maharashtra'],['JL','Jalgaon, Maharashtra'],['DD','Daund, Maharashtra'],['ROHA','Roha, Maharashtra'],['RN','Ratnagiri, Maharashtra'],['THVM','Thivim, Goa'],['KAWR','Karwar, Karnataka'],['UD','Udupi, Karnataka'],['CAN','Kannur, Kerala'],['TCR','Thrissur, Kerala'],['ALLP','Alappuzha, Kerala'],['KTYM','Kottayam, Kerala'],['NCJ','Nagercoil Junction, Tamil Nadu'],['MDU','Madurai, Tamil Nadu'],['TPJ','Tiruchirappalli, Tamil Nadu'],['CBE','Coimbatore, Tamil Nadu'],['ED','Erode, Tamil Nadu'],['SA','Salem, Tamil Nadu'],['PGT','Palakkad, Kerala'],['AJJ','Arakkonam, Tamil Nadu'],['KPD','Katpadi, Tamil Nadu'],['JTJ','Jolarpettai, Tamil Nadu'],['KJM','Krishnarajapuram, Karnataka'],['KGI','Kengeri, Karnataka'],['UBL','Hubballi, Karnataka'],['BGM','Belagavi, Karnataka'],['HPT','Hospet, Karnataka'],['WADI','Wadi, Karnataka'],['KZJ','Kazipet, Telangana'],['RDM','Ramagundam, Telangana'],['BDCR','Bhadrachalam Road, Telangana'],['KCG','Kacheguda, Telangana'],['GTL','Guntakal, Andhra Pradesh'],['ADONI','Adoni, Andhra Pradesh'],['DMM','Dharmavaram, Andhra Pradesh'],['NLR','Nellore, Andhra Pradesh'],['GDR','Gudur, Andhra Pradesh'],['OGL','Ongole, Andhra Pradesh'],['RJY','Rajahmundry, Andhra Pradesh'],['SLO','Samalkot, Andhra Pradesh'],['VZM','Vizianagaram, Andhra Pradesh'],['PSA','Palasa, Andhra Pradesh'],['BAM','Brahmapur, Odisha'],['KUR','Khurda Road, Odisha'],['CTC','Cuttack, Odisha'],['BLS','Balasore, Odisha'],['KGP','Kharagpur, West Bengal'],['JSG','Jharsuguda, Odisha'],['ROU','Rourkela, Odisha'],['BSP','Bilaspur, Chhattisgarh'],['RIG','Raigarh, Chhattisgarh'],['BWN','Barddhaman, West Bengal'],['ASN','Asansol, West Bengal'],['DHN','Dhanbad, Jharkhand'],['GAYA','Gaya, Bihar'],['BXR','Buxar, Bihar'],['ARA','Ara, Bihar'],['DNR','Danapur, Bihar'],['MFP','Muzaffarpur, Bihar'],['DBG','Darbhanga, Bihar'],['CPR','Chhapra, Bihar'],['SEE','Sonpur, Bihar'],['KIR','Katihar, Bihar'],['MLDT','Malda Town, West Bengal'],['APDJ','Alipurduar, West Bengal'],['NGC','New Guwahati, Assam'],['NTSK','New Tinsukia, Assam'],['JTTN','Jorhat Town, Assam'],['SCL','Silchar, Assam'],['ST','Surat, Gujarat'],['BRC','Vadodara, Gujarat']
];
export const STATIONS=Object.fromEntries(stationRows);
const routes=[
 ['12952','Capital Rajdhani','Premium',['NDLS','KOTA','ADI','CSMT'],[0,270,660,960],990,960],
 ['12310','Ganga Rajdhani','Premium',['NDLS','CNB','PRYJ','DDU','PNBE'],[0,270,420,540,780],1030,1000],
 ['12628','Dakshin Express','Express',['NDLS','AGC','GWL','VGLJ','BPL','NGP','HYB','SBC','MAS'],[0,150,240,340,550,850,1340,1840,2140],1200,2550],
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
 ['12608','Southern Shatabdi','Superfast',['SBC','MAS'],[0,300],360,350],
 ['70001','Rohilkhand Corridor','Express',['NDLS','FBD','GZB','MTC','MB','BE','SPN','HRI','LKO'],270,430,92],
 ['70011','Terai Link','Express',['DLI','GZB','ALJN','KSJ','BE','MB','RMR','KGM'],330,390,88],
 ['70021','Awadh Purvanchal Link','Express',['LKO','LJN','HRI','SPN','BE','MB','GKP','CPR','SEE','DNR','PNBE'],360,760,98],
 ['70031','Ganga Plains Express','Express',['LKO','CNB','PRYJ','BSB','DDU','BXR','ARA','DNR','PNBE'],300,610,90],
 ['70041','Mithila Express','Express',['NDLS','CNB','PRYJ','DDU','GAYA','PNBE','MFP','DBG'],390,1050,104],
 ['70051','Aravalli Desert Link','Superfast',['NDLS','RE','AWR','JP','AII','MTD','UDZ','JU','BKN'],300,930,96],
 ['70061','Himalayan Valley Link','Express',['NDLS','UMB','CDG','KLK','SML'],360,520,88],
 ['70071','Punjab Jammu Mail','Express',['NDLS','UMB','LDH','JUC','ASR','PTK','JAT','UHP','SVDK'],330,760,92],
 ['70081','Madhya Bharat Express','Express',['CSMT','BDTS','BVI','KYN','IGP','NAS','MMR','BSL','JL','BINA','BPL','RKMP','ET','JBP'],330,1120,98],
 ['70091','Konkan Coast Express','Express',['CSMT','PNVL','ROHA','RN','MAO','THVM','KAWR','UD','MAQ','CAN','CLT'],390,1130,96],
 ['70101','Deccan Plateau Link','Express',['CSMT','PUNE','DD','SUR','WADI','HYB'],420,790,102],
 ['70111','Karnataka Hampi Express','Express',['HYB','KZJ','RDM','BDCR','KCG','GTL','ADONI','DMM','SBC'],360,720,94],
 ['70121','Mysuru Hubballi Express','Express',['SBC','YPR','KGI','MYS','HPT','UBL','BGM'],300,620,94],
 ['70131','Vellore Bengaluru Link','Express',['SBC','KJM','JTJ','KPD','AJJ','MAS'],360,360,75],
 ['70141','Andhra Coast Express','Superfast',['MAS','AJJ','KPD','NLR','GDR','OGL','BZA','RJY','SLO','VSKP','VZM'],300,800,92],
 ['70151','Tamil Kerala Express','Express',['MAS','TPJ','MDU','NCJ','TVC','ALLP','ERS'],330,850,94],
 ['70161','Kongu Intercity','Express',['ERS','KTYM','TCR','PGT','CBE','ED','SA','SBC'],390,690,88],
 ['70171','Odisha Coast Mail','Express',['VSKP','VZM','PSA','BAM','KUR','BBS','CTC','BLS','KGP','HWH'],330,900,91],
 ['70181','Chota Nagpur Link','Express',['HWH','BWN','ASN','DHN','TATA','RNC','ROU','JSG','BSP','RIG'],360,900,96],
 ['70191','North East Frontier Express','Express',['HWH','MLDT','KIR','NJP','APDJ','NGC','GHY'],390,920,98],
 ['70201','Brahmaputra Valley Link','Express',['GHY','NGC','JTTN','NTSK','DBRG'],450,520,94],
 ['70211','Gujarat Central Express','Superfast',['CSMT','KYN','MMR','BSL','RTM','UJN','ADI','BRC','ST'],300,900,94],
 ['70221','Mahakoshal Junction Express','Express',['BPL','BINA','KTE','JBP','PRYJ','CNB','LKO'],390,820,96],
 ['70231','Malwa Western Link','Express',['ADI','BRC','ST','RTM','UJN','INDB','BPL'],360,620,88],
 ['70241','Coastal Karnataka Shuttle','Express',['MAQ','UD','KAWR','MAO','THVM'],300,390,88],
 ['70251','Barak Valley Connection','Express',['HWH','MLDT','NJP','GHY','SCL'],420,980,102],
 ['70261','Brahmaputra Deccan Link','Express',['GHY','NJP','HWH','KGP','TATA','ROU','JSG','BPL','BINA','CSMT','PUNE'],540,1900,100],
 ['70271','North South Corridor Express','Express',['NDLS','AGC','GWL','VGLJ','BPL','NGP','HYB','SBC','MAS'],780,2550,100],
 ['71001','Demo Vande Bharat · Delhi–Varanasi','Premium',['NDLS','CNB','PRYJ','DDU','BSB'],360,780,78],
 ['71011','Demo Vande Bharat · Chennai–Vijayawada','Premium',['MAS','GDR','NLR','OGL','BZA'],390,450,82],
 ['71021','Demo Duronto · Delhi–Mumbai','Premium',['NDLS','KOTA','BPL','BINA','CSMT'],300,1350,92],
 ['71031','Demo Garib Rath · Howrah–Bhubaneswar','Superfast',['HWH','KGP','BLS','CTC','BBS'],420,450,76]
];
function buildRoute([id,name,type,stops,offsetsOrStart,startOrKm,kmOrPace]){
 if(Array.isArray(offsetsOrStart))return{id,name,type,stops,offsets:offsetsOrStart,start:startOrKm,km:kmOrPace};
 const start=offsetsOrStart,km=startOrKm,pace=kmOrPace??95;
 const offsets=stops.map((_,index)=>Math.round((index*pace+Math.max(0,index-1)*9)/5)*5);
 return{id,name,type,stops,offsets,start,km};
}
const serviceRoutes=routes.map(buildRoute);
export const TRAINS=serviceRoutes.flatMap(({id,name,type,stops,offsets,start,km})=>[{id,name,type,stops,offsets,start,km},{id:String(+id+101),name:name+' Return',type,stops:[...stops].reverse(),offsets:[...offsets].reverse().map(x=>offsets.at(-1)-x),start:Number(id)>=70000?240+(Number(id)%13)*50:480,km}]);
export const CLASSES={'SL':{name:'Sleeper',rate:.72,coach:'S1'},'3A':{name:'AC 3 Tier',rate:1.65,coach:'B1'},'2A':{name:'AC 2 Tier',rate:2.35,coach:'A1'},'1A':{name:'AC First',rate:3.8,coach:'H1'}};
export const RAC_CAPACITY=3;
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const addDays=(d,n)=>new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
export function routeFor(t,from,to,date){const a=t.stops.indexOf(from),b=t.stops.indexOf(to);if(a<0||b<=a)return null;const shift=Math.floor((t.start+t.offsets[a])/1440);return{trainId:t.id,a,b,from,to,date,originDate:addDays(date,-shift),duration:t.offsets[b]-t.offsets[a]};}
const indiaDate=iso=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso));
export function findConnections(from,to,date,{maxResults=8}={}){
 const journeys=[];
 for(const first of TRAINS){
  const sharedStops=first.stops;
  for(const hub of sharedStops){
   const firstRoute=routeFor(first,from,hub,date);
   if(!firstRoute)continue;
   const firstDeparture=journeyTime(first,firstRoute,firstRoute.a),firstArrival=journeyTime(first,firstRoute,firstRoute.b);
   for(const second of TRAINS){
    if(second.id===first.id||!second.stops.includes(hub))continue;
    let secondRoute=routeFor(second,hub,to,indiaDate(firstArrival.iso));
    let secondDeparture=secondRoute&&journeyTime(second,secondRoute,secondRoute.a);
    let transferMinutes=secondDeparture?(Date.parse(secondDeparture.iso)-Date.parse(firstArrival.iso))/60000:-1;
    if(transferMinutes<35||transferMinutes>1080){
     secondRoute=routeFor(second,hub,to,addDays(indiaDate(firstArrival.iso),1));
     secondDeparture=secondRoute&&journeyTime(second,secondRoute,secondRoute.a);
     transferMinutes=secondDeparture?(Date.parse(secondDeparture.iso)-Date.parse(firstArrival.iso))/60000:-1;
    }
    if(!secondRoute||transferMinutes<35||transferMinutes>1080)continue;
    const secondArrival=journeyTime(second,secondRoute,secondRoute.b);
    const duration=(Date.parse(secondArrival.iso)-Date.parse(firstDeparture.iso))/60000;
    if(duration<=0)continue;
    journeys.push({legs:[{train:first,route:firstRoute,departure:firstDeparture,arrival:firstArrival},{train:second,route:secondRoute,departure:secondDeparture,arrival:secondArrival}],hub,transferMinutes,duration});
   }
  }
 }
 const unique=new Map();
 journeys.sort((a,b)=>a.duration-b.duration||a.transferMinutes-b.transferMinutes);
 for(const journey of journeys){
  const key=journey.legs.map(leg=>`${leg.train.id}:${leg.route.from}-${leg.route.to}:${leg.route.originDate}`).join('|');
  if(!unique.has(key))unique.set(key,journey);
  if(unique.size>=maxResults)break;
 }
 return [...unique.values()];
}
export const overlaps=(a,b)=>a.a<b.b&&b.a<a.b;
export const berth=n=>['Lower','Middle','Upper','Lower','Middle','Upper','Side lower','Side upper'][(n-1)%8];
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function seededUnit(value){let hash=2166136261;for(const character of String(value)){hash^=character.codePointAt(0);hash=Math.imul(hash,16777619);}return(hash>>>0)/4294967296;}
export function simulatedUnavailableSeats(trainId,originDate,cls,fromIndex,toIndex){
 const train=TRAINS.find(item=>item.id===String(trainId));if(!train)return[];
 const segmentCount=Math.max(1,train.stops.length-1),from=Number(fromIndex),to=Number(toIndex);
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to>segmentCount||to<=from)return[];
 const date=typeof originDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(originDate)?originDate:today();
 const daysAway=clamp((Date.parse(`${date}T00:00:00Z`)-Date.parse(`${today()}T00:00:00Z`))/86400000,0,120);
 const dayOfWeek=new Date(`${date}T00:00:00Z`).getUTCDay(),weekendDemand=(dayOfWeek===0||dayOfWeek===6)?0.04:0;
 const classDemand={SL:.15,'3A':.24,'2A':.32,'1A':.4}[cls]??.24;
 const serviceDemand=train.type==='Premium'?.12:train.type==='Superfast'?.055:0;
 const routeDemand=.1*((to-from)/segmentCount),leadDemand=.18*(1-Math.min(daysAway,90)/90);
 const key=`${train.id}|${date}|${cls}`;
 const sellThrough=clamp(classDemand+serviceDemand+routeDemand+leadDemand+weekendDemand+(seededUnit(`${key}|load`)*.12-.06),.08,.88);
 const unavailable=new Set();
 for(let segment=from;segment<to;segment++)unavailable.add(1+Math.floor(seededUnit(`${key}|segment|${segment}|anchor`)*24));
 for(let seat=1;seat<=24;seat++){
  if(seededUnit(`${key}|seat|${seat}|sold`)>=sellThrough)continue;
  const start=Math.floor(seededUnit(`${key}|seat|${seat}|from`)*segmentCount);
  const length=1+Math.floor(seededUnit(`${key}|seat|${seat}|length`)*(segmentCount-start));
  if(start<to&&from<start+length)unavailable.add(seat);
 }
 return [...unavailable].sort((a,b)=>a-b);
}
export function availableSeats(bookings,r,cls){const unavailable=new Set(simulatedUnavailableSeats(r.trainId,r.originDate,cls,r.a,r.b));return Array.from({length:24},(_,i)=>i+1).filter(seat=>!unavailable.has(seat)&&!bookings.some(b=>b.status==='CONFIRMED'&&b.trainId===r.trainId&&b.originDate===r.originDate&&b.cls===cls&&overlaps(b,r)&&b.seats.includes(seat)));}
export function fare(t,r,cls,count,quota){const distance=Math.max(80,Math.round(t.km*r.duration/t.offsets.at(-1)));const base=Math.round(distance*CLASSES[cls].rate)*count;const reservation=40*count;const quotaCharge=quota==='TATKAL'?150*count:0;const tax=cls==='SL'?0:Math.round((base+reservation+quotaCharge)*.05);return{base,reservation,quotaCharge,tax,service:20,total:base+reservation+quotaCharge+tax+20,distance};}
export function journeyTime(t,r,index){const ms=Date.parse(r.originDate+'T00:00:00+05:30')+(t.start+t.offsets[index])*60000;return{iso:new Date(ms).toISOString(),date:new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric'}).format(ms),time:new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:false}).format(ms)};}
let dbPromise;
export function database(){return dbPromise??=new Promise((resolve,reject)=>{const req=indexedDB.open('railyatra-v1',1);req.onupgradeneeded=()=>{const d=req.result;d.createObjectStore('users',{keyPath:'email'});d.createObjectStore('bookings',{keyPath:'pnr'});d.createObjectStore('orders',{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function localAll(store){const db=await database();return new Promise((resolve,reject)=>{const r=db.transaction(store).objectStore(store).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function hash(password,salt){const bytes=new TextEncoder().encode(salt+password);return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');}
async function localRegister(name,email,password){const salt=crypto.randomUUID();const u={name,email,salt,password:await hash(password,salt)};const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('users','readwrite');tx.objectStore('users').add(u);tx.oncomplete=()=>resolve(u);tx.onabort=()=>reject(Error('This email already has a demo account. Sign in instead.'));});}
async function localAuthenticate(email,password){const u=(await localAll('users')).find(u=>u.email===email);if(!u||u.password!==await hash(password,u.salt))throw Error('Email or password is incorrect.');return u;}
function localQueueState(bookings,draft,freeSeats){
  const queued=bookings.filter(b=>b.trainId===draft.trainId&&b.originDate===draft.originDate&&b.cls===draft.cls&&overlaps(b,draft)&&['RAC','WAITLISTED'].includes(b.status));
  const racCount=queued.filter(b=>b.status==='RAC').reduce((n,b)=>n+b.passengers.length,0);
  const waitlistCount=queued.filter(b=>b.status==='WAITLISTED').reduce((n,b)=>n+b.passengers.length,0);
  if(racCount+waitlistCount===0&&freeSeats.length>=draft.passengers.length)return{status:'CONFIRMED',seats:freeSeats.slice(0,draft.passengers.length),queuePosition:null};
  if(waitlistCount===0&&racCount+draft.passengers.length<=RAC_CAPACITY)return{status:'RAC',seats:[],queuePosition:racCount+1};
  return{status:'WAITLISTED',seats:[],queuePosition:waitlistCount+1};
}
async function localReserve(draft){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('bookings','readwrite');const st=tx.objectStore('bookings');let result,error;st.getAll().onsuccess=e=>{const bookings=e.target.result;if(bookings.some(b=>b.paymentId===draft.paymentId)){error=Error('This checkout has already been completed. See your journeys.');tx.abort();return;}const free=availableSeats(bookings,draft,draft.cls);let reservation;if(draft.queueRequested){reservation=localQueueState(bookings,draft,free);}else{if(free.length<draft.passengers.length){error=Error('Confirmed seats just filled. Refresh availability and request RAC/WL if you want to continue. No demo payment was recorded.');tx.abort();return;}reservation={status:'CONFIRMED',seats:free.slice(0,draft.passengers.length),queuePosition:null};}let pnr;do{pnr=String(1000000000+crypto.getRandomValues(new Uint32Array(1))[0]%9000000000);}while(bookings.some(b=>b.pnr===pnr));result={...draft,...reservation,pnr,bookedAt:new Date().toISOString()};st.add(result);};tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(error??tx.error??Error('Reservation failed. Please retry.'));tx.onerror=()=>{};});}
async function localCancel(pnr,email){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction(['bookings','orders'],'readwrite');let error;const st=tx.objectStore('bookings');st.get(pnr).onsuccess=e=>{const b=e.target.result;if(!b||b.email!==email||!['CONFIRMED','RAC','WAITLISTED'].includes(b.status)||Date.parse(b.departure.iso)<=Date.now()){error=Error('Only your upcoming active tickets can be cancelled.');tx.abort();return;}b.status='CANCELLED';b.queuePosition=null;b.cancelledAt=new Date().toISOString();b.refund=b.fare.total;st.put(b);st.getAll().onsuccess=allEvent=>{const bookings=allEvent.target.result;const queued=bookings.filter(item=>item.trainId===b.trainId&&item.originDate===b.originDate&&item.cls===b.cls&&['RAC','WAITLISTED'].includes(item.status)).sort((a,c)=>a.bookedAt.localeCompare(c.bookedAt)||a.pnr.localeCompare(c.pnr));const assigned=[];for(const item of queued){const free=availableSeats(bookings,item,item.cls);let status,seats,queuePosition=null;if(free.length>=item.passengers.length){status='CONFIRMED';seats=free.slice(0,item.passengers.length);}else{const earlier=assigned.filter(entry=>overlaps(entry,item));const racCount=earlier.filter(entry=>entry.status==='RAC').reduce((n,entry)=>n+entry.passengerCount,0);const waitlistCount=earlier.filter(entry=>entry.status==='WAITLISTED').reduce((n,entry)=>n+entry.passengerCount,0);if(waitlistCount===0&&racCount+item.passengers.length<=RAC_CAPACITY){status='RAC';queuePosition=racCount+1;}else{status='WAITLISTED';queuePosition=waitlistCount+1;}seats=[];}item.status=status;item.seats=seats;item.queuePosition=queuePosition;st.put(item);assigned.push({a:item.a,b:item.b,status,passengerCount:item.passengers.length});}const os=tx.objectStore('orders');os.getAll().onsuccess=ordersEvent=>ordersEvent.target.result.filter(order=>order.pnr===pnr&&order.email===email).forEach(order=>os.put({...order,status:'CANCELLED'}));};};tx.oncomplete=()=>resolve();tx.onabort=()=>reject(error??tx.error);});}
async function localOrderFood(order){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction(['bookings','orders'],'readwrite');let error;tx.objectStore('bookings').get(order.pnr).onsuccess=e=>{const b=e.target.result;if(!b||b.email!==order.email||b.status!=='CONFIRMED'||Date.parse(b.departure.iso)<Date.now()){error=Error('Choose an upcoming confirmed journey.');tx.abort();return;}tx.objectStore('orders').add({...order,id:crypto.randomUUID(),status:'PLACED',createdAt:new Date().toISOString()});};tx.oncomplete=()=>resolve();tx.onabort=()=>reject(error??tx.error);});}

const apiOrigin=()=>typeof window!=='undefined'?String(window.RY_API_BASE??'').replace(/\/$/,''):'';
export const backendEnabled=()=>Boolean(apiOrigin());
if(typeof localStorage!=='undefined')localStorage.removeItem('ry-token');
async function apiRequest(path,options={}){
  const {auth:_auth,body,...fetchOptions}=options;
  const method=String(options.method??'GET').toUpperCase();
  const headers={Accept:'application/json',...(body?{'Content-Type':'application/json'}:{}),...(['POST','PUT','PATCH','DELETE'].includes(method)?{'X-RailYatra-Request':'1'}:{}),...(crypto.randomUUID?{'X-Request-ID':crypto.randomUUID()}:{}),...options.headers};
  let response;
  try{response=await fetch(`${apiOrigin()}/api${path}`,{...fetchOptions,method,headers,credentials:'include',body:body?JSON.stringify(body):undefined});}
  catch{throw Error('RailYatra server is unavailable. Check the backend connection and try again.');}
  if(response.status===204)return null;
  const payload=await response.json().catch(()=>({}));
  if(!response.ok){const error=Error(payload.error??'RailYatra could not complete that request.');error.status=response.status;throw error;}
  return payload;
}
export async function validateSession(){
  if(!backendEnabled())return null;
  try{return await apiRequest('/auth/me');}
  catch(error){if(error.status===401)return null;throw error;}
}
export async function all(store){
  if(!backendEnabled())return localAll(store);
  if(store==='users'){
    const current=await validateSession();
    return current?[current]:[];
  }
  if(store==='bookings')return apiRequest('/bookings');
  if(store==='orders')return apiRequest('/food-orders');
  if(store==='transactions')return apiRequest('/transactions');
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
  return response.user;
}
export async function authenticate(email,password){
  if(!backendEnabled())return localAuthenticate(email,password);
  const response=await apiRequest('/auth/login',{method:'POST',auth:false,body:{email,password}});
  return response.user;
}
export async function logout(){
  if(backendEnabled())try{await apiRequest('/auth/logout',{method:'POST'});}catch{}
  if(typeof localStorage!=='undefined')localStorage.removeItem('ry-token');
}
export async function createCheckout(draft){
  if(!backendEnabled())return{status:'HELD',id:null,expiresAt:new Date(Date.now()+5*60_000).toISOString()};
  const {checkoutKey,seats,...body}=draft;
  return apiRequest('/checkouts',{method:'POST',headers:{'Idempotency-Key':checkoutKey},body});
}
export async function completeCheckout(checkoutId,outcome){
  if(!backendEnabled())throw Error('A shared checkout session is not available in browser-only mode.');
  return apiRequest(`/checkouts/${encodeURIComponent(checkoutId)}/payment`,{method:'POST',body:{outcome}});
}
export async function releaseCheckout(checkoutId){
  if(!backendEnabled()||!checkoutId)return null;
  return apiRequest(`/checkouts/${encodeURIComponent(checkoutId)}/cancel`,{method:'POST'});
}
export async function reserve(draft){
  if(!backendEnabled())return localReserve(draft);
  const checkout=await createCheckout(draft);
  return completeCheckout(checkout.id,'SUCCESS');
}
export async function cancel(pnr,email){
  if(!backendEnabled())return localCancel(pnr,email);
  return apiRequest(`/bookings/${encodeURIComponent(pnr)}/cancel`,{method:'POST'});
}
export async function orderFood(order){
  if(!backendEnabled())return localOrderFood(order);
  return apiRequest('/food-orders',{method:'POST',body:order});
}
