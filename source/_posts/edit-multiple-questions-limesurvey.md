---
title: Edit multiple questions on LimeSurvey
excerpt: List Questions view allows you to edit multiple questions at the same time.
date: 2018-10-18
updated: 2018-10-26
tags:
- stats
- limesurvey
---

On LimeSurvey, making minor edits to multiple questions can be quite a chore. `List Questions` view allows you to edit multiple questions at the same time.

**List Questions** view allows you to delete, set 'mandatory', 'other', CSS class, and randomise multiple questions at the same time.

Edit: The view is accessible through (Survey) Settings > Survey menu > List questions.

![List all question in LimeSurvey](20181018/listquestions.png)

Ignore the rest...

I stumbled upon ListQuestions view after I deleted a question from a question group. But the view is not accessible through the interface, there's no button which can take you to that view.

To go that view, open the relevant question group where the questions you want to edit belong to.

The URL bar will shows up something like this,

`example.limequery.org/admin/questiongroups/sa/view/surveyid/123456/gid/1`

Replace `questiongroups` to `survey` and replace `view` to `listquestions`, so the URL becomes something like this,

`example.limequery.org/admin/survey/sa/listquestions/surveyid/123456/gid/1`

This is what ListQuestions view looks like,

![LimeSurvey ListQuestions page](20181018/limesurvey.png)

The view is also useful for quickly open multiple questions. Simply ctrl + left click or just middle click on the Edit button to open the question (to edit) in new tab.

![Edit button on LimeSurvey](20181018/limesurvey-edit.png)
