# Deadline Diff

Clio provides legal practice-management software and already supports court-rule calendaring, recalculation and custom dates. This independent project explores dependency/provenance review when a trigger moves but a manual override stays fixed.

**All rules and matters here are authored fiction. Outputs are not legal advice, verified filing dates or a rule pack for any jurisdiction. There are no Clio calls or calendar writes.**

## Run

Node.js 22+; verified with Node 24.22.1/Linux. No dependencies or credentials.

```sh
node --test
node cli.mjs
node cli.mjs path/to/input.json
```

Optional input contains a `pack` and `changes` map from fixed trigger IDs to ISO dates; see `fixtures.mjs`. The default demo moves a fictional hearing and prints a review report. [benchmarks/demo.json](benchmarks/demo.json) is actual execution over the authored pack. Nine test groups cover positive and adverse cases, including holiday crossing, overrides, unaffected dates, recurrence-exception metadata, unknown rules, dependency cycles and date-only daylight-saving boundaries.

## Engine behavior

A pack must declare `kind: "fictional"`, a version and unique event IDs. Fixed events have explicit dates. Derived events have one trigger, bounded integer offset, `calendar` or `business` counting, a calendar ID and a nonempty string rule version. Those edges form a DAG; missing references, duplicate IDs and cycles are rejected. Invalid dates are rejected. Missing rules, unsupported calendars and invalid offsets yield unknown results, and unknown trigger state propagates.

Business days exclude Saturday, Sunday and the explicitly supplied holiday list. Calendar-day shifts can roll to the following or preceding business day. Only strict `YYYY-MM-DD` dates and the declared `UTC-date-only` calendar are supported. These are date arithmetic semantics, not jurisdictional service or deadline rules.

Preview recomputes before/after dates without mutating the input. It preserves manual overrides, reports changes to their nominal computed dates, and propagates review flags to dependent events even when their actual dates remain unchanged. An override remains visible when its nominal rule is unknown; descendants stay unknown. Every diff contains rule/calendar provenance, nominal and actual dates, change/review flags and an explanation. Fixed unrelated dates and authored recurring-series exceptions remain unchanged.

The demo crosses a fictional Monday holiday, preserves the overridden review date, flags its dependent followup, and leaves two independent fixed/exception dates untouched. Missing rule versions and dependent results remain unknown. The exception metadata is preserved; **the engine does not expand or update recurring series**.

## Limits and next stages

The holiday list is assumed complete for the fictional calendar. No locale, actual court rules, service method, filing-time cutoff, time zone conversion, recurrence expansion or jurisdiction logic is implemented. The DST tests establish stable date-only arithmetic, not correct zoned event timing. JSON reports are reproducible output, not a persistent audit database. No integration has been verified; GitHub Actions is prepared but not remotely executed.

Node ESM suits deterministic graph/date orchestration; there is no inference path requiring C++. The next stage is stricter import schemas and read-only test-calendar ingestion preserving opaque identities and recurrence metadata. Any practical rule pack requires professional validation and explicit scope before use.

## Sources and overlap

- [Clio Court Rules](https://help.clio.com/hc/en-us/articles/9289840995867-Court-Rules): existing calculations, overrides and dependent-event review caveats.
- [Clio Manage API reference](https://docs.developers.clio.com/clio-manage/api-reference/): calendar permissions and recurrence-update semantics.

The dependency-review opportunity is an inference from these documented behaviors. This project is unaffiliated with Clio.
