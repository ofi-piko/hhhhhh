export type AddressMapMessage = {
	type: 'location';
	latitude: number;
	longitude: number;
	address: string;
};

export type AddressMapLanguage = 'ru' | 'uz' | 'en';

export const SAMARKAND_CENTER: [number, number] = [66.9597, 39.6542];

export const MAP_LABELS: Record<AddressMapLanguage, { search: string; locate: string; hint: string; loading: string; missingKey: string }> = {
	ru: { search: 'Найти', locate: 'Моё местоположение', hint: 'Мы нашли вас. Это сюда доставлять?', loading: 'Ищем вас на карте…', missingKey: 'Добавьте ключ 2GIS в .env' },
	uz: { search: 'Topish', locate: 'Mening joylashuvim', hint: 'Sizni topdik. Shu yerga yetkazamizmi?', loading: 'Xaritadan qidirilmoqda…', missingKey: '2GIS kalitini .env fayliga qoʻshing' },
	en: { search: 'Find', locate: 'My location', hint: 'We found you. Deliver here?', loading: 'Finding you on the map…', missingKey: 'Add a 2GIS key to .env' },
};

export function createAddressMapHtml(
	mapApiKey: string,
	yandexApiKey: string,
	language: AddressMapLanguage,
): string {
	const labels = MAP_LABELS[language];
	const safeMapKey = JSON.stringify(mapApiKey);
	const safeYandexKey = JSON.stringify(yandexApiKey);
	const safeLabels = JSON.stringify(labels);
	const geocoderLanguage = language === 'en' ? 'en_RU' : 'ru_RU';

	return `<!doctype html>
<html lang="${language}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
*{box-sizing:border-box}html,body,#map{width:100%;height:100%;margin:0;overflow:hidden;font-family:Arial,sans-serif}body{background:#e8e5e0}.controls{position:absolute;z-index:5;top:12px;left:12px;right:12px;display:flex;justify-content:flex-end;gap:8px}button{border:1px solid rgba(255,255,255,.72);border-radius:16px;background:rgba(255,255,255,.28);color:#3a1818;font-size:13px;font-weight:600;white-space:nowrap;padding:0 12px;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 8px 22px rgba(27,25,24,.12),inset 0 1px 0 rgba(255,255,255,.55)}.locate{width:44px;height:44px;padding:0;font-size:18px}.hint{position:absolute;z-index:4;bottom:12px;left:50%;transform:translateX(-50%);padding:10px 15px;border:1px solid rgba(255,255,255,.72);border-radius:16px;background:rgba(255,255,255,.28);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 6px 20px rgba(27,25,24,.14),inset 0 1px 0 rgba(255,255,255,.5);color:#3a3330;font-size:12px;white-space:nowrap}.message{position:absolute;z-index:6;left:12px;right:12px;top:66px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.22);border:1px solid rgba(255,255,255,.45);backdrop-filter:blur(16px);color:#3a1818;font-size:12px;display:none}.loading{position:absolute;z-index:3;inset:0;display:grid;place-items:center;color:#574f49;font-size:14px}.mapgl-attribution{font-size:10px}
</style>
</head>
<body>
<div id="map"></div>
<div class="loading" id="loading"></div>
<div class="controls">
  <button class="locate" id="locate" type="button" aria-label="">◎</button>
</div>
<div class="message" id="message"></div>
<div class="hint" id="hint"></div>
<script>
const mapKey=${safeMapKey};
const yandexKey=${safeYandexKey};
const labels=${safeLabels};
const geocoderLanguage=${JSON.stringify(geocoderLanguage)};
const post=(payload)=>{const message=JSON.stringify(payload);if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(message)}else{window.parent.postMessage(message,'*')}};
document.getElementById('loading').textContent=labels.loading;
document.getElementById('locate').setAttribute('aria-label',labels.locate);
document.getElementById('hint').textContent=labels.hint;
const showMessage=(text)=>{const node=document.getElementById('message');node.textContent=text;node.style.display='block';setTimeout(()=>node.style.display='none',3600)};
const report=(latitude,longitude,address)=>post({type:'location',latitude,longitude,address});
const geocode=async(query)=>{if(!yandexKey)return null;const url=new URL('https://geocode-maps.yandex.ru/v1');url.searchParams.set('apikey',yandexKey);url.searchParams.set('geocode',query);url.searchParams.set('lang',geocoderLanguage);url.searchParams.set('format','json');url.searchParams.set('results','1');const response=await fetch(url.toString());if(!response.ok)throw new Error('Geocoder request failed');const data=await response.json();const item=data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;if(!item)return null;const [longitude,latitude]=item.Point.pos.split(' ').map(Number);return{latitude,longitude,address:item.metaDataProperty?.GeocoderMetaData?.text||item.name||query}};
const reverseWithNominatim=async(latitude,longitude)=>{const url=new URL('https://nominatim.openstreetmap.org/reverse');url.searchParams.set('lat',String(latitude));url.searchParams.set('lon',String(longitude));url.searchParams.set('format','json');const response=await fetch(url.toString(),{headers:{Accept:'application/json'}});if(!response.ok)return '';const data=await response.json();return data.display_name||''};
let map;let marker;let selectedPoint=null;
const selectPoint=async(latitude,longitude,knownAddress)=>{selectedPoint={latitude,longitude};if(marker)marker.destroy();marker=new mapgl.Marker(map,{coordinates:[longitude,latitude]});let address=knownAddress||'';if(!address&&yandexKey){try{const result=await geocode(longitude+','+latitude);address=result?.address||''}catch(_error){}}if(!address){try{address=await reverseWithNominatim(latitude,longitude)}catch(_error){}}report(latitude,longitude,address||latitude.toFixed(6)+', '+longitude.toFixed(6))};
const locateUser=(silent)=>{if(!navigator.geolocation){if(!silent)showMessage(labels.locate);return}navigator.geolocation.getCurrentPosition((position)=>{const{latitude,longitude}=position.coords;map.setCenter([longitude,latitude],16,{duration:450});selectPoint(latitude,longitude)},()=>{if(!silent)showMessage(labels.locate)},{enableHighAccuracy:true,timeout:10000})};
document.getElementById('locate').addEventListener('click',()=>locateUser(false));
if(!mapKey){document.getElementById('loading').textContent=labels.missingKey}else{const script=document.createElement('script');script.src='https://mapgl.2gis.com/api/js/v1';script.onload=()=>{try{map=new mapgl.Map('map',{key:mapKey,center:[66.9597,39.6542],zoom:13,lang:${JSON.stringify(language === 'en' ? 'en' : 'ru')}});map.on('click',(event)=>{const point=event.lngLat||event.coordinates;if(!point)return;const longitude=Array.isArray(point)?point[0]:point.lng;const latitude=Array.isArray(point)?point[1]:point.lat;if(Number.isFinite(latitude)&&Number.isFinite(longitude))selectPoint(latitude,longitude)});document.getElementById('loading').style.display='none';locateUser(true)}catch(_error){document.getElementById('loading').textContent=labels.missingKey}};script.onerror=()=>{document.getElementById('loading').textContent=labels.missingKey};document.head.appendChild(script)}
</script>
</body>
</html>`;
}