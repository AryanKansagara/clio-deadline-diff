/** Fictional date-only dependency rules. No legal rules or calendar writes. */
const DAY=86400000;
export function dateValue(text) {
 if(typeof text!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(text))throw Error('ISO date-only required');
 const value=Date.parse(text+'T00:00:00Z');
 if(!Number.isFinite(value)||new Date(value).toISOString().slice(0,10)!==text)throw Error('invalid calendar date');return value;
}
const iso=value=>new Date(value).toISOString().slice(0,10);
export function shift(anchor, offset, mode, holidays, roll='none') {
 let value=dateValue(anchor);
 if(!Number.isInteger(offset)||Math.abs(offset)>3650||!['calendar','business'].includes(mode)||!['none','following','preceding'].includes(roll)||!Array.isArray(holidays))throw Error('invalid rule');
 holidays.forEach(dateValue);const closed=new Set(holidays);
 const business=v=>![0,6].includes(new Date(v).getUTCDay())&&!closed.has(iso(v));
 let left=Math.abs(offset);const direction=Math.sign(offset);
 while(left){value+=direction*DAY;if(mode==='calendar'||business(value))left--;}
 if(roll!=='none'){
  let tries=0;
  while(!business(value)){if(++tries>4000)throw Error('calendar has no bounded open day');value+=(roll==='following'?1:-1)*DAY;}
 }
 const result=iso(value);dateValue(result);return result;
}
function ordered(events) {
 const map=new Map(events.map(e=>[e.id,e]));
 if(map.size!==events.length||events.some(e=>typeof e.id!=='string'||!e.id))throw Error('unique event ids required');
 const result=[],visiting=new Set(),done=new Set();
 function visit(id){if(done.has(id))return;if(visiting.has(id))throw Error('dependency cycle');const e=map.get(id);if(!e)throw Error('missing dependency');visiting.add(id);if(e.trigger)visit(e.trigger);visiting.delete(id);done.add(id);result.push(e);}
 for(const e of events)visit(e.id);return result;
}
export function evaluate(pack) {
 if(pack?.kind!=='fictional'||!Array.isArray(pack.events)||typeof pack.version!=='string'||!pack.version.trim())throw Error('versioned fictional pack required');
 const results=[],byId=new Map();
 for(const event of ordered(pack.events)) {
  let result={id:event.id,trigger:event.trigger??null,ruleVersion:event.ruleVersion??null,calendar:event.calendar??null,seriesException:event.seriesException??null};
  if(event.date!==undefined){dateValue(event.date);result={...result,status:'fixed',date:event.date,nominal:event.date,reason:event.seriesException?'preserved explicit recurring-series exception':'authored fixed event'};}
  else {
   const calendar=pack.calendars?.[event.calendar],parent=byId.get(event.trigger);
   let issue=typeof event.ruleVersion!=='string'||!event.ruleVersion.trim()?'missing or invalid rule version':!calendar||calendar.timezone!=='UTC-date-only'||!Array.isArray(calendar.holidays)?'missing supported date-only calendar':!parent?.date||parent.status==='unknown'?'trigger date unknown':null;
   let nominal=null;
   if(!issue){try{nominal=shift(parent.date,event.offset,event.mode,calendar.holidays,event.roll??'none');}catch(error){issue=error.message;}}
   if(event.override!==undefined)dateValue(event.override);
   result={...result,status:issue?'unknown':event.override!==undefined?'override':'computed',date:issue?event.override??null:event.override??nominal,nominal,reason:issue??(event.override!==undefined?'explicit override preserved':'computed from trigger'),override:event.override??null};
  }
  results.push(result);byId.set(event.id,result);
 }
 return {packVersion:pack.version,scope:'fictional authored UTC-date-only rules; not legal advice or validated filing dates',events:results};
}
export function preview(pack,changes) {
 if(!changes||typeof changes!=='object'||Array.isArray(changes))throw Error('changes map required');
 const afterPack=structuredClone(pack);
 for(const [id,date] of Object.entries(changes)) {
  dateValue(date);const event=afterPack.events.find(e=>e.id===id);
  if(!event||event.date===undefined)throw Error('only explicit fixed triggers may be moved');event.date=date;
 }
 const before=evaluate(pack),after=evaluate(afterPack),old=new Map(before.events.map(e=>[e.id,e]));
 const review=new Set();
 const diff=after.events.map(event=> {
  const prior=old.get(event.id),changed=prior.date!==event.date;
  const ownReview=event.status==='unknown'||event.status==='override'&&prior.nominal!==event.nominal;
  const inheritedReview=review.has(event.trigger);
  if(ownReview||inheritedReview)review.add(event.id);
  return {id:event.id,before:prior.date,after:event.date,nominalBefore:prior.nominal,nominalAfter:event.nominal,changed,needsReview:ownReview||inheritedReview,status:event.status,explanation:ownReview&&event.status==='override'?'override preserved while nominal deadline changed':inheritedReview?'dependent on an override or unknown event requiring review':event.reason,ruleVersion:event.ruleVersion,calendar:event.calendar,seriesException:event.seriesException};
 });
 return {schemaVersion:1,before,after,diff,summary:{changed:diff.filter(e=>e.changed).length,needsReview:diff.filter(e=>e.needsReview).length},externalWrites:0};
}
