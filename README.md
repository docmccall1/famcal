# Family Calendar

A lightweight shared family calendar web app with:
- Day / Week / Month / Year calendar views
- Side panel for requests
- High-importance to-do list
- Recurring activities
- AI-style date planner for busy couples
- Share-by-link support (anyone with the link can view the same data)

## Run

Start the app with live sharing support:

```bash
cd "/Users/adammccall/Library/Mobile Documents/com~apple~CloudDocs/family calendar"
node server.js
```

Then visit `http://localhost:8080`.

## Share with anyone

1. Add events/tasks/requests.
2. Click **Copy Share Link**.
3. Send the link. Anyone with it can open and edit the same live shared calendar (updates sync every few seconds).

## AI Date Planner input format

Use comma-separated busy blocks:

```text
Mon 18:00-20:00, Wed 17:30-19:30, Sat 12:00-14:00
```

Supported day names: `Sun Mon Tue Wed Thu Fri Sat`.
