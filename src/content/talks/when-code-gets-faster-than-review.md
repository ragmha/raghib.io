---
title: "When Code Gets Faster Than Review"
description: "A talk version of the essay: when an assistant makes a change cheap to write, the scarce step becomes deciding it is safe to merge, and five ways to respond."
date: "2026-11-08"
kind: "talk"
locked: true
paginate: true
---

<!-- _class: cover -->
<!-- _paginate: false -->

## When Code Gets Faster Than Review

Raghib Hasan

---

## The scarce step moves

When a change is cheap to produce, the limit is how many changes the people and checks around it can judge safe to merge.

Speeding up generation alone does not ship more. It lengthens the line in front of review.

---

## Little's Law: L = λW

Open changes = rate opened × average time open

It does not say which of the three to change. It says they cannot move independently.

---

## Wait bends near capacity

Review finishes 10 changes a week.

| Arrivals / week | Time in system | Open changes |
| --------------- | -------------- | ------------ |
| 5               | ~0.2 weeks     | ~1           |
| 9               | ~1 week        | ~9           |
| 9.9             | ~10 weeks      | ~99          |

*Single-server queue model: read it for its shape, not its numbers.*

---

## Review is not a fixed cost

- The reviewer may be the first person to understand an assistant's change.
- An automated reviewer is a generator too: who reviews the reviewer?

---

## Five ways to respond

1. Let the queue grow
2. Review faster and shallower
3. Cap work in progress
4. Shrink, tier, and automate
5. Add reviewers

*Start with 3 and 4. Add reviewers last.*

---

## Measure before you choose

Track open count, time to first review, and time to merge for a few weeks.

If the queue isn't growing, none of the five options is needed yet.

Read the essay: [raghib.io/writing/when-code-gets-faster-than-review](https://raghib.io/writing/when-code-gets-faster-than-review/)
