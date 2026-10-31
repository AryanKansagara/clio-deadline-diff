import test from 'node:test';import assert from 'node:assert/strict';
import {dateValue,shift,evaluate,preview} from './deadlines.mjs';import {fictional} from './fixtures.mjs';
const row=(r,id)=>r.diff.find(e=>e.id===id);
test('business-day holiday crossing and reverse counting are explicit',()=>{
 assert.equal(shift('2026-10-30',1,'business',['2026-11-02']),'2026-11-03');
 assert.equal(shift('2026-11-03',-1,'business',['2026-11-02']),'2026-10-30');
 assert.equal(shift('2026-10-30',1,'calendar',[],'following'),'2026-11-02');
 assert.equal(shift('2026-11-01',0,'calendar',[],'preceding'),'2026-10-30');
});
test('hearing shift changes descendants, preserves manual override and propagates review',()=>{
 const r=preview(fictional,{hearing:'2026-11-04'});
 assert.equal(row(r,'brief').before,'2026-11-03');assert.equal(row(r,'brief').after,'2026-11-05');
 assert.equal(row(r,'custom-review').changed,false);assert.equal(row(r,'custom-review').needsReview,true);
 assert.equal(row(r,'custom-review').nominalAfter,'2026-10-30');assert.equal(row(r,'review-followup').needsReview,true);
 assert.equal(row(r,'review-followup').after,row(r,'review-followup').before);assert.equal(r.externalWrites,0);
});
test('unaffected fixed event and recurrence exception are genuine unchanged controls',()=>{
 const r=preview(fictional,{hearing:'2026-11-04'});for(const id of ['fixed-audit','recurrence-exception']){assert.equal(row(r,id).changed,false);assert.equal(row(r,id).needsReview,false);}
 assert.equal(row(r,'recurrence-exception').seriesException.originalDate,'2026-11-06');
});
test('missing version, absent calendar, invalid rules and unknown parent propagate unknown',()=>{
 const p=structuredClone(fictional);p.events.push({id:'no-calendar',trigger:'hearing',ruleVersion:'v1',offset:2,mode:'business',calendar:'absent'});
 const r=preview(p,{});for(const id of ['unknown-rule','unknown-child','no-calendar']){assert.equal(row(r,id).status,'unknown');assert.equal(row(r,id).after,null);assert.equal(row(r,id).needsReview,true);}
 const bad=structuredClone(fictional);bad.events[1].offset=1.5;assert.equal(evaluate(bad).events.find(e=>e.id==='brief').status,'unknown');
});
test('override remains visible when its nominal rule is unknown and children stay unknown',()=>{
 const p=structuredClone(fictional);delete p.events.find(e=>e.id==='custom-review').ruleVersion;
 const r=preview(p,{});assert.equal(row(r,'custom-review').after,'2026-10-28');assert.equal(row(r,'custom-review').status,'unknown');assert.equal(row(r,'review-followup').status,'unknown');
});
test('invalid date, cyclic graph, duplicate and missing identity fail before any preview',()=>{
 for(const d of ['2026-02-30','2026-13-01','2026-3-01','x'])assert.throws(()=>dateValue(d));
 for(const events of [[{id:'a',trigger:'b'},{id:'b',trigger:'a'}],[{id:'a',trigger:'b'}],[{id:'a',date:'2026-01-01'},{id:'a',date:'2026-01-01'}]])assert.throws(()=>evaluate({...fictional,events}));
 assert.throws(()=>preview(fictional,{brief:'2026-01-01'}));assert.throws(()=>evaluate({...fictional,kind:'real'}));
});
test('date-only day shifts across DST and leap day preserve calendar dates',()=>{
 assert.equal(shift('2026-03-07',2,'calendar',[]),'2026-03-09');
 assert.equal(shift('2024-02-28',1,'calendar',[]),'2024-02-29');
 assert.equal(shift('2026-11-01',1,'calendar',[]),'2026-11-02');
});
test('empty move is deterministic, does not mutate input or flag unchanged override',()=>{
 const snapshot=JSON.stringify(fictional),a=preview(fictional,{}),b=preview(fictional,{});assert.deepEqual(a,b);assert.equal(JSON.stringify(fictional),snapshot);assert.equal(a.summary.changed,0);assert.equal(row(a,'custom-review').needsReview,false);
});

test('rule and pack versions require nonempty string provenance',()=>{
 for(const version of [{untrusted:'object'},[],1,true,'','   ']){
  const p=structuredClone(fictional);p.events.find(e=>e.id==='brief').ruleVersion=version;
  const result=evaluate(p).events.find(e=>e.id==='brief');assert.equal(result.status,'unknown');assert.equal(result.date,null);assert.match(result.reason,/rule version/);
  assert.throws(()=>evaluate({...fictional,version}));
 }
 assert.equal(evaluate(fictional).events.find(e=>e.id==='brief').status,'computed');
});
