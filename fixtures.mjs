export const fictional={kind:'fictional',version:'toy-rules-v1',calendars:{toy:{timezone:'UTC-date-only',holidays:['2026-11-02']}},events:[
 {id:'hearing',date:'2026-10-30'},
 {id:'brief',trigger:'hearing',offset:1,mode:'business',calendar:'toy',ruleVersion:'brief-v1'},
 {id:'custom-review',trigger:'hearing',offset:-2,mode:'business',calendar:'toy',ruleVersion:'review-v1',override:'2026-10-28'},
 {id:'review-followup',trigger:'custom-review',offset:1,mode:'business',calendar:'toy',ruleVersion:'followup-v1'},
 {id:'fixed-audit',date:'2026-12-01'},
 {id:'recurrence-exception',date:'2026-11-05',seriesException:{seriesId:'fictional-weekly',originalDate:'2026-11-06'}},
 {id:'unknown-rule',trigger:'hearing',offset:1,mode:'business',calendar:'toy'},
 {id:'unknown-child',trigger:'unknown-rule',offset:1,mode:'business',calendar:'toy',ruleVersion:'child-v1'},
]};
