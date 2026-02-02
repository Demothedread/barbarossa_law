# 🚀 Deployment Checklist - 21-Day Schedule Component

## Pre-Deployment (Verify Setup)

- [ ] Vue 3.2+ installed in project
- [ ] Tailwind CSS configured and working
- [ ] lunaire-spa folder structure present
- [ ] Node.js/npm available for development

## File Placement

- [ ] `components/ScheduleCrashCourse.vue` exists and imports work
- [ ] `composables/useScheduleManagement.ts` exists
- [ ] `composables/scheduleTestData.ts` exists (optional, for testing)
- [ ] All imports reference correct paths

## Component Integration

### Minimum Setup (30 seconds)

```vue
<!-- In your page/component -->
<script setup>
import ScheduleCrashCourse from "@/components/ScheduleCrashCourse.vue";
</script>

<template>
  <ScheduleCrashCourse />
</template>
```

- [ ] Page renders without errors
- [ ] Schedule component displays
- [ ] Three view tabs visible (Week/Calendar/Tasks)
- [ ] Dark theme applied correctly

## Feature Verification

### View Tests

- [ ] **Week View**

  - [ ] 3 weeks display
  - [ ] 7 days per week visible
  - [ ] Primary/secondary subjects shown
  - [ ] Days clickable and highlightable

- [ ] **Calendar View**

  - [ ] 21 days in grid layout
  - [ ] Colors match subjects
  - [ ] Stats panel shows on right
  - [ ] Progress numbers update

- [ ] **Task List View**
  - [ ] Today's tasks display
  - [ ] Overdue tasks highlighted in amber
  - [ ] Subject color legend shows
  - [ ] Study type legend visible

### Task Management Tests

- [ ] Can click task to change state
  - [ ] First click → Orange (in-progress)
  - [ ] Second click → Red strikethrough (done)
  - [ ] Third click → Back to pending
- [ ] **Create Task** (if isAuthenticated = true)

  - [ ] Can type in input field
  - [ ] Enter key creates task
  - [ ] #subject shortcut works (#contracts, etc.)
  - [ ] /studyType shortcut works (/mbe, /essay, /review)
  - [ ] Task appears in task list

- [ ] **Edit Task** (in edit mode)

  - [ ] Edit button appears on hover
  - [ ] Modal opens with task details
  - [ ] Can change title, subject, study type, duration
  - [ ] Save button updates task
  - [ ] Cancel button closes without changes

- [ ] **Delete Task**
  - [ ] Delete button appears on hover (edit mode)
  - [ ] Confirms before deletion
  - [ ] Task removed from list

### Color & Visual Tests

- [ ] All 10 subjects have distinct colors
- [ ] Colors match intergalactic palette
- [ ] Bullet points display correctly
  - [ ] ● for MBE
  - [ ] ■ for Essay
  - [ ] ◆ for Review
- [ ] Text colors update with task state
- [ ] Strikethrough appears on completed tasks
- [ ] Orange highlighting on in-progress tasks

### Data Persistence Tests

- [ ] Create a task
- [ ] Refresh the page
  - [ ] Task still appears ✓ = localStorage working
- [ ] Mark task as done
- [ ] Refresh
  - [ ] Task still marked done ✓ = state persisted
- [ ] Clear browser cache
- [ ] Reload
  - [ ] Default schedule reloads ✓ = fallback works

### Responsive Design Tests

- [ ] **Desktop (1024px+)**

  - [ ] Calendar 3-column layout displays
  - [ ] Stats sidebar visible on right
  - [ ] All content readable

- [ ] **Tablet (640px - 1024px)**

  - [ ] Layout adapts to 2 columns
  - [ ] Touch targets are adequately sized
  - [ ] Scrolling works smoothly

- [ ] **Mobile (< 640px)**
  - [ ] Single column layout
  - [ ] Task list scrolls vertically
  - [ ] Touch interactions work well
  - [ ] No horizontal scrolling needed

### Accessibility Tests

- [ ] **Keyboard Navigation**

  - [ ] Tab through all buttons
  - [ ] Enter activates buttons/forms
  - [ ] Escape closes modals
  - [ ] Focus visible on all elements

- [ ] **Color Contrast**

  - [ ] Text readable on dark background
  - [ ] Subject colors have sufficient contrast
  - [ ] State indicators visible

- [ ] **Screen Reader** (if available)
  - [ ] Buttons have descriptive labels
  - [ ] Form inputs have labels
  - [ ] Structure is semantic

## Browser Compatibility Tests

- [ ] **Chrome/Edge 90+**

  - [ ] All features work
  - [ ] Styling correct
  - [ ] No console errors

- [ ] **Firefox 88+**

  - [ ] All features work
  - [ ] Styling correct
  - [ ] No console errors

- [ ] **Safari 14+**

  - [ ] All features work
  - [ ] Styling correct
  - [ ] No console errors

- [ ] **Mobile Browsers**
  - [ ] iOS Safari works
  - [ ] Chrome Mobile works
  - [ ] Touch gestures responsive

## Optional: Authentication Integration

If connecting to auth system:

- [ ] Import auth composable: `useAuth()`
- [ ] Update isAuthenticated check:
  ```typescript
  const { user } = useAuth();
  const isAuthenticated = computed(() => !!user.value);
  ```
- [ ] Edit button only shows when authenticated
- [ ] Test with logged-in user
- [ ] Test with logged-out user (no edit mode)

## Optional: Backend Integration

If syncing with server:

- [ ] Create API endpoint: `POST /api/user/schedule`
- [ ] Create composable function:
  ```typescript
  const syncToBackend = async () => {
    await fetch("/api/user/schedule", {
      method: "POST",
      body: JSON.stringify({ tasks, schedule }),
    });
  };
  ```
- [ ] Add sync button to component
- [ ] Test data saves to database
- [ ] Test data loads on new session

## Optional: Quiz Performance Integration

If adding adaptive study suggestions:

- [ ] Create performance tracking
- [ ] When quiz scores < 70%:
  - [ ] Automatically suggest review tasks
  - [ ] Add to today's task list
  - [ ] Mark as "suggested" for visibility
- [ ] Test with mock performance data
- [ ] Verify suggestions create correctly

## Performance Tests

Run these in browser DevTools:

```javascript
// Check bundle size
console.log("Component loaded");

// Measure task creation time
console.time("create-task");
// ... create task
console.timeEnd("create-task");

// Check localStorage usage
console.log(localStorage.getItem("barReviewSchedule").length, "bytes");

// Run test suite
import { runAllTests } from "@/composables/scheduleTestData";
runAllTests();
```

- [ ] Component loads in < 100ms
- [ ] Task creation < 20ms
- [ ] localStorage < 100KB
- [ ] No console errors
- [ ] Test suite passes

## Documentation Check

- [ ] README_SCHEDULE.md is discoverable
- [ ] SCHEDULE_GUIDE.md has full API docs
- [ ] SCHEDULE_QUICKREF.md accessible for quick help
- [ ] INTEGRATION_EXAMPLES.md shows real code
- [ ] Code comments are clear
- [ ] No dead/unused code

## Before Going Live

### Final Checks

- [ ] All tests passed
- [ ] No console errors or warnings
- [ ] Component renders on first load
- [ ] Tasks persist across refreshes
- [ ] All views work correctly
- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] Color scheme appropriate

### Backup & Safety

- [ ] Code backed up to git
- [ ] Branch merged or PR approved
- [ ] No breaking changes to existing code
- [ ] Rollback plan in place

### Communication

- [ ] Users notified of new feature
- [ ] Documentation linked from main README
- [ ] Help/support contact provided
- [ ] Known issues documented

## Deployment Steps

### Step 1: Code Push

```bash
git add components/ScheduleCrashCourse.vue
git add composables/useScheduleManagement.ts
git add lunaire-spa/README_SCHEDULE.md
git commit -m "feat: Add 21-day bar review schedule component"
git push origin main
```

### Step 2: Review & Merge

- [ ] Code review approved
- [ ] Tests passing in CI/CD
- [ ] No conflicts
- [ ] Ready to deploy

### Step 3: Deploy

```bash
npm run build
npm run deploy
```

- [ ] Build succeeds
- [ ] No warnings
- [ ] Deploy completes
- [ ] Site accessible

### Step 4: Post-Deployment

- [ ] Verify feature works in production
- [ ] Monitor error tracking (Sentry, etc.)
- [ ] Check user feedback
- [ ] Monitor performance metrics

## Rollback Plan (If Needed)

```bash
# Revert to previous version
git revert [commit-hash]
git push origin main

# Or restore backup
git checkout [previous-branch]
```

- [ ] Rollback tested locally
- [ ] Procedure documented
- [ ] Team aware of process

## Success Criteria

✅ Component deploys without errors
✅ All features work as specified
✅ Data persists correctly
✅ Responsive on all devices
✅ Accessible for keyboard/screen readers
✅ No console errors or warnings
✅ Performance metrics acceptable
✅ Users can create/edit/delete tasks
✅ Three views toggle correctly
✅ Colors display properly

## Post-Launch Monitoring

For 1 week after launch:

- [ ] Monitor error logs daily
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Track feature usage
- [ ] Watch for data issues
- [ ] Monitor browser compatibility

## Sign-Off

- [ ] Developer verified: **\*\***\_\_\_**\*\*** Date: **\_**
- [ ] QA approved: **\*\***\_\_\_**\*\*** Date: **\_**
- [ ] Product approved: **\*\***\_\_\_**\*\*** Date: **\_**

## Launch Date

**Planned Launch**: **\*\***\_\_\_**\*\***
**Actual Launch**: **\*\***\_\_\_**\*\***
**Status**: [ ] Successful [ ] Issues [ ] Rolled back

---

## Troubleshooting During Deployment

| Issue               | Solution                                                |
| ------------------- | ------------------------------------------------------- |
| Component not found | Check import paths, verify files in correct directory   |
| Styles not loading  | Verify Tailwind CSS is included, clear cache            |
| Tasks not saving    | Check localStorage is enabled, verify browser support   |
| Colors wrong        | Check hex codes in subjects array, clear browser cache  |
| Responsive broken   | Verify Tailwind breakpoints, test on actual devices     |
| Auth not working    | Verify useAuth() composable available, check user state |

---

**You're ready to deploy!** 🚀

**Questions?** Check SCHEDULE_GUIDE.md or INTEGRATION_EXAMPLES.md

**Need help?** Review the implementation summary or run test suite
